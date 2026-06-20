import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { analyzeRepo } from "../src/analyzer.js";
import { renderMarkdown } from "../src/report.js";

const fixture = resolve("tests/fixtures/minimal-api");
const commentedFixture = resolve("tests/fixtures/commented-x402");
const circleReadyFixture = resolve("tests/fixtures/circle-ready-api");

describe("analyzeRepo", () => {
  it("detects API, billing, active x402, and issue draft content", () => {
    const result = analyzeRepo({
      repoPath: fixture,
      name: "Fixture API",
      url: "https://github.com/example/fixture",
    });

    assert.equal(result.signals.find(s => s.id === "api_routes")?.present, true);
    assert.equal(result.signals.find(s => s.id === "active_payment_middleware")?.present, true);
    assert.equal(result.signals.find(s => s.id === "billing")?.present, true);
    assert.ok(result.endpoints.some(e => e.method === "POST" && e.path === "/x402/search"));
    assert.match(result.issueDraft.body, /Circle Agent Wallet/);
    assert.match(result.issueDraft.body, /receipt/);
  });

  it("distinguishes commented x402 middleware from active paid routes", () => {
    const result = analyzeRepo({
      repoPath: commentedFixture,
      name: "Commented x402 API",
    });

    assert.equal(result.signals.find(s => s.id === "x402_deps")?.present, true);
    assert.equal(result.signals.find(s => s.id === "commented_payment_middleware")?.present, true);
    assert.equal(result.signals.find(s => s.id === "active_payment_middleware")?.present, false);
    assert.ok(result.findings.some(f => f.severity === "high" && /not fully activated/.test(f.title)));
    assert.ok(!result.endpoints.some(e => e.path === "/x402/scrape"));
  });

  it("does not flag narrow coverage, missing Circle docs, or missing receipts for a Circle-ready paid scrape fixture", () => {
    const result = analyzeRepo({
      repoPath: circleReadyFixture,
      name: "Circle-ready API",
    });

    assert.equal(result.signals.find(s => s.id === "active_payment_middleware")?.present, true);
    assert.equal(result.signals.find(s => s.id === "circle_terms")?.present, true);
    assert.equal(result.signals.find(s => s.id === "receipts")?.present, true);
    assert.ok(result.endpoints.some(e => e.method === "POST" && e.path === "/x402/scrape"));
    assert.ok(!result.findings.some(f => /coverage appears narrow/.test(f.title)));
    assert.ok(!result.findings.some(f => /Marketplace readiness is not documented/.test(f.title)));
    assert.ok(!result.findings.some(f => /Receipt and proof-of-work/.test(f.title)));
  });

  it("renders maintainer-ready Markdown with prioritized endpoint examples", () => {
    const result = analyzeRepo({
      repoPath: fixture,
      name: "Fixture API",
      url: "https://github.com/example/fixture",
      existingIssueUrl: "https://github.com/example/fixture/issues/1",
    });
    const markdown = renderMarkdown(result);

    assert.match(markdown, /^# Fixture API Circle\/x402 Readiness Report/m);
    assert.match(markdown, /Existing x402 issue: https:\/\/github.com\/example\/fixture\/issues\/1/);
    assert.match(markdown, /POST \/x402\/search/);
    assert.match(markdown, /Maintainer Issue Draft/);
  });

  it("writes Markdown and JSON reports through the CLI", () => {
    const outDir = mkdtempSync(join(tmpdir(), "circle-readiness-agent-"));
    const markdownOut = join(outDir, "report.md");
    const jsonOut = join(outDir, "report.json");

    execFileSync(process.execPath, [
      "dist/src/cli.js",
      "--repo",
      fixture,
      "--name",
      "Fixture API",
      "--out",
      markdownOut,
      "--json-out",
      jsonOut,
    ]);

    assert.equal(existsSync(markdownOut), true);
    assert.equal(existsSync(jsonOut), true);
    assert.match(readFileSync(markdownOut, "utf8"), /Fixture API Circle\/x402 Readiness Report/);
    const json = JSON.parse(readFileSync(jsonOut, "utf8")) as { summary: { score: number }; issueDraft: { body: string } };
    assert.equal(json.summary.score > 0, true);
    assert.match(json.issueDraft.body, /Circle Agent Wallet/);
  });
});
