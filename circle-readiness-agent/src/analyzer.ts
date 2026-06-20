import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { collectSourceFiles, grepEvidence, type SourceFile } from "./fs-scan.js";
import type { AnalysisResult, EndpointEvidence, Evidence, Finding, RepoInput, Signal } from "./types.js";

const ROUTE_REGEX =
  /\b(?:app|router|v\dRouter|[a-zA-Z_$][\w$]*Router)\s*\.\s*(get|post|put|patch|delete)\s*\(\s*(?:\[)?["'`]([^"'`]+)["'`]/gi;

function lineOf(text: string, index: number): number {
  return text.slice(0, index).split(/\r?\n/).length;
}

function evidenceFromMatches(files: SourceFile[], pattern: RegExp, limit = 12): Evidence[] {
  const evidence: Evidence[] = [];
  for (const file of files) {
    let match: RegExpExecArray | null;
    pattern.lastIndex = 0;
    while ((match = pattern.exec(file.text)) && evidence.length < limit) {
      const line = lineOf(file.text, match.index);
      evidence.push({
        file: file.relPath,
        line,
        text: file.lines[line - 1]?.trim().slice(0, 240) ?? "",
      });
    }
    if (evidence.length >= limit) break;
  }
  return evidence;
}

function isProbablyComment(line: string): boolean {
  return /^\s*(\/\/|#|\/\*|\*)/.test(line);
}

function collectEndpoints(files: SourceFile[]): EndpointEvidence[] {
  const endpoints: EndpointEvidence[] = [];
  for (const file of files) {
    if (
      !/(route|router|controller|server|app|index)\.(ts|tsx|js|jsx|mjs|cjs)$/.test(file.relPath) &&
      !/[\/\\]routes[\/\\][^\/\\]+\.(ts|tsx|js|jsx|mjs|cjs)$/.test(file.relPath)
    ) {
      continue;
    }
    let match: RegExpExecArray | null;
    ROUTE_REGEX.lastIndex = 0;
    while ((match = ROUTE_REGEX.exec(file.text))) {
      const method = (match[1] ?? "GET").toUpperCase();
      const path = match[2] ?? "";
      const line = lineOf(file.text, match.index);
      if (isProbablyComment(file.lines[line - 1] ?? "")) continue;
      const window = file.lines.slice(Math.max(0, line - 1), Math.min(file.lines.length, line + 8));
      endpoints.push({
        file: file.relPath,
        line,
        text: file.lines[line - 1]?.trim().slice(0, 240) ?? "",
        method,
        path,
        nearbyMiddleware: window
          .join(" ")
          .match(/\b(authMiddleware|checkCreditsMiddleware|paymentMiddleware|rateLimiter|countryCheck|blocklistMiddleware|idempotencyMiddleware)\b/g) ?? [],
      });
    }
  }
  return endpoints.slice(0, 80);
}

function activePaymentMiddlewareEvidence(files: SourceFile[]): Evidence[] {
  const evidence: Evidence[] = [];
  for (const file of files) {
    file.lines.forEach((line, index) => {
      if (!isProbablyComment(line) && /\bpaymentMiddleware\s*\(/.test(line)) {
        evidence.push({
          file: file.relPath,
          line: index + 1,
          text: line.trim().slice(0, 240),
        });
      }
    });
  }
  return evidence.slice(0, 12);
}

function commentedPaymentMiddlewareEvidence(files: SourceFile[]): Evidence[] {
  const evidence: Evidence[] = [];
  for (const file of files) {
    file.lines.forEach((line, index) => {
      if (isProbablyComment(line) && /\bpaymentMiddleware\s*\(/.test(line)) {
        evidence.push({
          file: file.relPath,
          line: index + 1,
          text: line.trim().slice(0, 240),
        });
      }
    });
  }
  return evidence.slice(0, 12);
}

function packageJsonEvidence(root: string): Evidence[] {
  const path = join(root, "package.json");
  if (!existsSync(path)) return [];
  const pkg = JSON.parse(readFileSync(path, "utf8")) as { dependencies?: Record<string, string>; devDependencies?: Record<string, string> };
  const deps = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) };
  return Object.entries(deps)
    .filter(([name]) => /x402|circle|stripe|payment/i.test(name))
    .map(([name, version]) => ({
      file: "package.json",
      line: 1,
      text: `${name}: ${version}`,
    }));
}

function signal(id: string, label: string, present: boolean, weight: number, evidence: Evidence[]): Signal {
  return { id, label, present, weight, evidence };
}

function buildSignals(root: string, files: SourceFile[], endpoints: EndpointEvidence[]): Signal[] {
  const activePayments = activePaymentMiddlewareEvidence(files);
  const commentedPayments = commentedPaymentMiddlewareEvidence(files);
  const packageEvidence = packageJsonEvidence(root);
  const authMiddlewareEvidence = evidenceFromMatches(files, /\bauthMiddleware\b/g, 12);
  const authEvidence =
    authMiddlewareEvidence.length > 0
      ? authMiddlewareEvidence
      : grepEvidence(files, "auth", /Authorization|Bearer|api[_-]?key|apiKey/i);
  const x402Evidence = [
    ...packageEvidence.filter(e => /x402/i.test(e.text)),
    ...grepEvidence(files, "x402", /\bx402\b|X402_|@x402/i),
  ].slice(0, 12);

  return [
    signal("api_routes", "HTTP API routes detected", endpoints.length > 0, 15, endpoints.slice(0, 8)),
    signal("auth", "Existing auth/API-key middleware detected", authEvidence.length > 0, 10, authEvidence.slice(0, 12)),
    signal("billing", "Existing billing/credit accounting detected", grepEvidence(files, "billing", /billing|credit|subscription|usage|stripe|checkout/i).length > 0, 12, grepEvidence(files, "billing", /billing|credit|subscription|usage|stripe|checkout/i)),
    signal("rate_limits", "Existing rate-limit/concurrency controls detected", grepEvidence(files, "rate_limits", /rateLimiter|rate limit|ratelimit|concurrency|semaphore/i).length > 0, 8, grepEvidence(files, "rate_limits", /rateLimiter|rate limit|ratelimit|concurrency|semaphore/i)),
    signal("x402_deps", "x402 dependency or source references detected", x402Evidence.length > 0, 15, x402Evidence),
    signal("active_payment_middleware", "Active x402 payment middleware detected", activePayments.length > 0, 15, activePayments),
    signal("commented_payment_middleware", "Commented x402 payment middleware detected", commentedPayments.length > 0, 5, commentedPayments),
    signal("circle_terms", "Circle Agent Wallet/Gateway/Marketplace language detected", grepEvidence(files, "circle", /Circle Agent|Agent Wallet|Circle Gateway|Circle Marketplace|Circle Agent Marketplace/i).length > 0, 10, grepEvidence(files, "circle", /Circle Agent|Agent Wallet|Circle Gateway|Circle Marketplace|Circle Agent Marketplace/i)),
    signal("schemas", "Machine-readable schemas or OpenAPI-like metadata detected", grepEvidence(files, "schemas", /openapi|inputSchema|outputSchema|z\.object|json schema|schema/i).length > 0, 8, grepEvidence(files, "schemas", /openapi|inputSchema|outputSchema|z\.object|json schema|schema/i)),
    signal("receipts", "Payment receipt or fulfillment proof language detected", grepEvidence(files, "receipts", /payment receipt|receipt|transaction hash|transactionHash|txHash|requestHash|resultHash|fulfillment proof/i).length > 0, 8, grepEvidence(files, "receipts", /payment receipt|receipt|transaction hash|transactionHash|txHash|requestHash|resultHash|fulfillment proof/i)),
  ];
}

function deriveFindings(signals: Signal[], endpoints: EndpointEvidence[]): Finding[] {
  const hasX402 = signals.find(s => s.id === "x402_deps")?.present ?? false;
  const hasActivePayment = signals.find(s => s.id === "active_payment_middleware")?.present ?? false;
  const hasCircle = signals.find(s => s.id === "circle_terms")?.present ?? false;
  const hasSchemas = signals.find(s => s.id === "schemas")?.present ?? false;
  const hasReceipts = signals.find(s => s.id === "receipts")?.present ?? false;
  const x402Endpoints = endpoints.filter(e => e.path.includes("x402"));
  const corePaidEndpointCoverage = x402Endpoints.some(e => /scrape|crawl|extract|parse/.test(e.path));
  const authEvidence = signals.find(s => s.id === "auth")?.evidence ?? [];
  const x402Evidence = signals.find(s => s.id === "x402_deps")?.evidence ?? [];
  const paymentEvidence = signals.find(s => s.id === "active_payment_middleware")?.evidence ?? [];
  const commentedEvidence = signals.find(s => s.id === "commented_payment_middleware")?.evidence ?? [];

  const findings: Finding[] = [];
  if (hasX402 && !hasActivePayment) {
    findings.push({
      severity: "high",
      title: "x402 is present but not fully activated on public API surfaces",
      detail: "The repo has x402 dependencies or code references, but no active payment middleware was detected in route execution paths.",
      evidence: [...x402Evidence, ...commentedEvidence].slice(0, 8),
      recommendation: "Promote one narrow endpoint to an active paid path first, ideally a low-risk search or scrape endpoint with explicit price, method, schema, network, and pay-to address.",
    });
  }
  if (endpoints.length > 0 && authEvidence.length > 0) {
    findings.push({
      severity: "medium",
      title: "Existing API-key auth can be complemented by x402 payment-auth",
      detail: "The project already has authenticated API routes. x402 can add a parallel no-account path for agents without replacing the existing subscription model.",
      evidence: authEvidence.slice(0, 6),
      recommendation: "Add a separate `/x402/*` route or conditional payment middleware branch that maps paid requests into the same internal job pipeline with bypassed credit billing.",
    });
  }
  if (hasActivePayment && !corePaidEndpointCoverage) {
    findings.push({
      severity: "medium",
      title: "x402 coverage appears narrow relative to the core API surface",
      detail: "Active x402 middleware was detected, but paid endpoint coverage does not appear to include the primary scrape/crawl/extract APIs.",
      evidence: [...paymentEvidence, ...x402Endpoints.slice(0, 6)].slice(0, 8),
      recommendation: "Keep the existing paid search path, then add a Circle-ready `/x402/scrape` endpoint or a documented paid mode for the existing scrape route.",
    });
  }
  if (!hasCircle) {
    findings.push({
      severity: "medium",
      title: "Circle Agent Marketplace readiness is not documented",
      detail: "The scan did not find Circle Agent Wallet, Circle Gateway, USDC, or Marketplace-oriented language.",
      evidence: [],
      recommendation: "Add a maintainer-facing doc describing supported x402 networks, USDC settlement, input schema, pricing, response shape, and how Circle Agent Wallet users can pay.",
    });
  }
  if (!hasSchemas) {
    findings.push({
      severity: "medium",
      title: "Marketplace schema metadata is missing or hard to discover",
      detail: "Circle Marketplace listings need machine-readable service schemas and pricing. The scan did not find clear schema metadata.",
      evidence: [],
      recommendation: "Publish JSON schema for request and response bodies beside each paid endpoint.",
    });
  }
  if (!hasReceipts) {
    findings.push({
      severity: "low",
      title: "Receipt and proof-of-work trail is weak",
      detail: "Agent users need to understand what was paid for and what was delivered.",
      evidence: [],
      recommendation: "Return a receipt object with paid resource, amount, network, request hash, result hash, and provider job id.",
    });
  }
  return findings;
}

function summarize(score: number): { verdict: string; estimatedEffort: "low" | "medium" | "high" } {
  if (score >= 75) return { verdict: "Strong candidate: useful primitives exist, but production Circle readiness may still need endpoint coverage, docs, and receipts.", estimatedEffort: "medium" };
  if (score >= 45) return { verdict: "Good candidate: meaningful primitives exist, but integration gaps remain.", estimatedEffort: "medium" };
  return { verdict: "Early candidate: likely needs a new paid route, schemas, and billing/payment plumbing.", estimatedEffort: "high" };
}

function buildIssueDraft(input: RepoInput, result: Omit<AnalysisResult, "issueDraft">): AnalysisResult["issueDraft"] {
  const topFindings = result.findings.slice(0, 5);
  const endpointExamples = preferredEndpointCandidates(result.endpoints)
    .slice(0, 8)
    .map(e => `- \`${e.method} ${e.path}\` in \`${e.file}:${e.line}\``)
    .join("\n");

  const body = `## Proposal: add Circle Agent Wallet / x402 paid access for AI agents

This project looks like a strong candidate for agent-native paid access. I ran a static readiness scan focused on x402 and Circle Agent Marketplace compatibility.

${input.existingIssueUrl ? `Related existing discussion: ${input.existingIssueUrl}\n` : ""}
### Readiness summary

- Score: ${result.summary.score}/100
- Estimated effort: ${result.summary.estimatedEffort}
- Verdict: ${result.summary.verdict}

### Why this is useful

AI agents often need one-off access to API results without creating a dashboard account, sharing a long-lived API key, or preloading credits. A Circle/x402 path would let an agent:

1. Discover a paid endpoint.
2. Inspect pricing and request schema.
3. Pay in USDC from a Circle Agent Wallet.
4. Receive the API response plus a receipt/proof object.

### Candidate endpoints

${endpointExamples || "- No route examples were detected by the scanner."}

### Main integration gaps

${topFindings.map(f => `- **${f.title}**: ${f.recommendation}`).join("\n")}

### Suggested first implementation

Start with a narrow paid route rather than changing the whole billing model:

\`\`\`
POST /x402/search or POST /x402/scrape
  -> return 402 payment challenge when no valid payment is supplied
  -> verify x402 payment on Base/USDC
  -> run the existing internal search/scrape pipeline
  -> bypass subscription credit billing for this one paid call
  -> return { data, receipt: { amount, network, resource, requestHash, resultHash, jobId } }
\`\`\`

For Circle Agent Marketplace readiness, publish:

- method + URL
- USDC price
- supported network
- input JSON schema
- response JSON schema
- receipt shape
- timeout and retry guidance

### Notes

This issue is intentionally scoped as an additive path. Existing API keys, subscriptions, and dashboards can remain unchanged while agents get a pay-per-call option.`;

  return {
    title: "Add Circle Agent Wallet / x402 paid access for AI agents",
    body,
  };
}

function preferredEndpointCandidates(endpoints: EndpointEvidence[]): EndpointEvidence[] {
  const ignored = /\/admin|\/health|\/team|\/is-production|\/e2e-test|^\/$/;
  const preferred = /x402|scrape|crawl|search|extract|parse|agent|browser|interact/;
  const coreCurrent = /(?:^|\/)routes[\/\\]v[12]\.ts$/;
  return [...endpoints].sort((a, b) => {
    const aIgnored = ignored.test(a.path) ? 1 : 0;
    const bIgnored = ignored.test(b.path) ? 1 : 0;
    if (aIgnored !== bIgnored) return aIgnored - bIgnored;
    const aPreferred = preferred.test(a.path) ? 0 : 1;
    const bPreferred = preferred.test(b.path) ? 0 : 1;
    if (aPreferred !== bPreferred) return aPreferred - bPreferred;
    const aX402 = a.path.includes("x402") ? 0 : 1;
    const bX402 = b.path.includes("x402") ? 0 : 1;
    if (aX402 !== bX402) return aX402 - bX402;
    const aCurrentRoute = coreCurrent.test(a.file) ? 0 : 1;
    const bCurrentRoute = coreCurrent.test(b.file) ? 0 : 1;
    if (aCurrentRoute !== bCurrentRoute) return aCurrentRoute - bCurrentRoute;
    const aLegacy = /(?:^|\/)routes[\/\\]v0\.ts$/.test(a.file) ? 1 : 0;
    const bLegacy = /(?:^|\/)routes[\/\\]v0\.ts$/.test(b.file) ? 1 : 0;
    if (aLegacy !== bLegacy) return aLegacy - bLegacy;
    return a.file.localeCompare(b.file) || a.line - b.line;
  });
}

export function analyzeRepo(input: RepoInput): AnalysisResult {
  const files = collectSourceFiles(input.repoPath);
  const endpoints = collectEndpoints(files);
  const signals = buildSignals(input.repoPath, files, endpoints);
  const positiveScore = signals.filter(s => s.present).reduce((sum, s) => sum + s.weight, 0);
  const score = Math.min(100, positiveScore);
  const summary = summarize(score);
  const findings = deriveFindings(signals, endpoints);
  const withoutIssue = {
    input,
    analyzedAt: new Date().toISOString(),
    summary: { score, ...summary },
    filesScanned: files.length,
    endpoints,
    signals,
    findings,
  };
  return {
    ...withoutIssue,
    issueDraft: buildIssueDraft(input, withoutIssue),
  };
}
