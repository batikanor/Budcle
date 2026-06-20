import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolve } from "node:path";
import { analyzeRepo } from "../src/analyzer.js";

const fixture = resolve("tests/fixtures/minimal-api");

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
});
