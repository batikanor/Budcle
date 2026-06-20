# Browserless Circle/x402 Readiness Report

Analyzed: 2026-06-20T13:12:38.061Z

Repository: https://github.com/browserless/browserless

## Summary

- Score: 38/100
- Estimated effort: high
- Verdict: Early candidate: likely needs a new paid route, schemas, and billing/payment plumbing.
- Files scanned: 216
- Endpoints detected: 0

## Signals

| Present | Signal | Weight | Evidence count |
| --- | --- | ---: | ---: |
| no | HTTP API routes detected | 15 | 0 |
| yes | Existing auth/API-key middleware detected | 10 | 12 |
| yes | Existing billing/credit accounting detected | 12 | 12 |
| yes | Existing rate-limit/concurrency controls detected | 8 | 12 |
| no | x402 dependency or source references detected | 15 | 0 |
| no | Active x402 payment middleware detected | 15 | 0 |
| no | Commented x402 payment middleware detected | 5 | 0 |
| no | Circle Agent Wallet/Gateway/Marketplace language detected | 10 | 0 |
| yes | Machine-readable schemas or OpenAPI-like metadata detected | 8 | 12 |
| no | Payment receipt or fulfillment proof language detected | 8 | 0 |

## Candidate Endpoints

- No endpoints detected.

## Findings

### MEDIUM: Circle Agent Marketplace readiness is not documented

The scan did not find Circle Agent Wallet, Circle Gateway, USDC, or Marketplace-oriented language.

Recommendation: Add a maintainer-facing doc describing supported x402 networks, USDC settlement, input schema, pricing, response shape, and how Circle Agent Wallet users can pay.

Evidence:

- No direct source evidence found by static scan.

### LOW: Receipt and proof-of-work trail is weak

Agent users need to understand what was paid for and what was delivered.

Recommendation: Return a receipt object with paid resource, amount, network, request hash, result hash, and provider job id.

Evidence:

- No direct source evidence found by static scan.


## Maintainer Issue Draft

Title: Add Circle Agent Wallet / x402 paid access for AI agents

```md
## Proposal: add Circle Agent Wallet / x402 paid access for AI agents

This project looks like a strong candidate for agent-native paid access. I ran a static readiness scan focused on x402 and Circle Agent Marketplace compatibility.


### Readiness summary

- Score: 38/100
- Estimated effort: high
- Verdict: Early candidate: likely needs a new paid route, schemas, and billing/payment plumbing.

### Why this is useful

AI agents often need one-off access to API results without creating a dashboard account, sharing a long-lived API key, or preloading credits. A Circle/x402 path would let an agent:

1. Discover a paid endpoint.
2. Inspect pricing and request schema.
3. Pay in USDC from a Circle Agent Wallet.
4. Receive the API response plus a receipt/proof object.

### Candidate endpoints

- No route examples were detected by the scanner.

### Main integration gaps

- **Circle Agent Marketplace readiness is not documented**: Add a maintainer-facing doc describing supported x402 networks, USDC settlement, input schema, pricing, response shape, and how Circle Agent Wallet users can pay.
- **Receipt and proof-of-work trail is weak**: Return a receipt object with paid resource, amount, network, request hash, result hash, and provider job id.

### Suggested first implementation

Start with a narrow paid route rather than changing the whole billing model:

```
POST /x402/search or POST /x402/scrape
  -> return 402 payment challenge when no valid payment is supplied
  -> verify x402 payment on Base/USDC
  -> run the existing internal search/scrape pipeline
  -> bypass subscription credit billing for this one paid call
  -> return { data, receipt: { amount, network, resource, requestHash, resultHash, jobId } }
```

For Circle Agent Marketplace readiness, publish:

- method + URL
- USDC price
- supported network
- input JSON schema
- response JSON schema
- receipt shape
- timeout and retry guidance

### Notes

This issue is intentionally scoped as an additive path. Existing API keys, subscriptions, and dashboards can remain unchanged while agents get a pay-per-call option.
```
