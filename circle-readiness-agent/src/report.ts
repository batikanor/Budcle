import type { AnalysisResult, Evidence } from "./types.js";

function evidenceList(items: Evidence[]): string {
  if (items.length === 0) return "- No direct source evidence found by static scan.";
  return items.map(e => `- \`${e.file}:${e.line}\` - ${e.text}`).join("\n");
}

export function renderMarkdown(result: AnalysisResult): string {
  const signalRows = result.signals
    .map(s => `| ${s.present ? "yes" : "no"} | ${s.label} | ${s.weight} | ${s.evidence.length} |`)
    .join("\n");

  const findings = result.findings
    .map(
      f => `### ${f.severity.toUpperCase()}: ${f.title}

${f.detail}

Recommendation: ${f.recommendation}

Evidence:

${evidenceList(f.evidence)}
`,
    )
    .join("\n");

  const endpoints = preferredEndpointCandidates(result.endpoints)
    .slice(0, 30)
    .map(e => `- \`${e.method} ${e.path}\` in \`${e.file}:${e.line}\` (${[...new Set(e.nearbyMiddleware)].join(", ") || "no nearby middleware detected"})`)
    .join("\n");

  return `# ${result.input.name} Circle/x402 Readiness Report

Analyzed: ${result.analyzedAt}

Repository: ${result.input.url ?? result.input.repoPath}
${result.input.existingIssueUrl ? `Existing x402 issue: ${result.input.existingIssueUrl}\n` : ""}
## Summary

- Score: ${result.summary.score}/100
- Estimated effort: ${result.summary.estimatedEffort}
- Verdict: ${result.summary.verdict}
- Files scanned: ${result.filesScanned}
- Endpoints detected: ${result.endpoints.length}

## Signals

| Present | Signal | Weight | Evidence count |
| --- | --- | ---: | ---: |
${signalRows}

## Candidate Endpoints

${endpoints || "- No endpoints detected."}

## Findings

${findings || "No findings."}

## Maintainer Issue Draft

Title: ${result.issueDraft.title}

\`\`\`md
${result.issueDraft.body}
\`\`\`
`;
}

function preferredEndpointCandidates(endpoints: AnalysisResult["endpoints"]): AnalysisResult["endpoints"] {
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
