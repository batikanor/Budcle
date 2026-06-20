# Firecrawl Circle/x402 Readiness Report

Analyzed: 2026-06-20T12:35:13.594Z

Repository: https://github.com/firecrawl/firecrawl
Existing x402 issue: https://github.com/firecrawl/firecrawl/issues/3279

## Summary

- Score: 88/100
- Estimated effort: medium
- Verdict: Strong candidate: useful primitives exist, but production Circle readiness may still need endpoint coverage, docs, and receipts.
- Files scanned: 1114
- Endpoints detected: 80

## Signals

| Present | Signal | Weight | Evidence count |
| --- | --- | ---: | ---: |
| yes | HTTP API routes detected | 15 | 8 |
| yes | Existing auth/API-key middleware detected | 10 | 12 |
| yes | Existing billing/credit accounting detected | 12 | 12 |
| yes | Existing rate-limit/concurrency controls detected | 8 | 12 |
| yes | x402 dependency or source references detected | 15 | 12 |
| yes | Active x402 payment middleware detected | 15 | 2 |
| yes | Commented x402 payment middleware detected | 5 | 2 |
| no | Circle Agent Wallet/Gateway/Marketplace language detected | 10 | 0 |
| yes | Machine-readable schemas or OpenAPI-like metadata detected | 8 | 12 |
| no | Payment receipt or fulfillment proof language detected | 8 | 0 |

## Candidate Endpoints

- `POST /x402/search` in `apps/api/src/routes/v1.ts:336` (authMiddleware, countryCheck, paymentMiddleware)
- `POST /scrape` in `apps/api/src/routes/v1.ts:125` (authMiddleware, countryCheck, checkCreditsMiddleware, blocklistMiddleware)
- `POST /crawl` in `apps/api/src/routes/v1.ts:134` (authMiddleware, countryCheck, checkCreditsMiddleware, blocklistMiddleware, idempotencyMiddleware)
- `POST /batch/scrape` in `apps/api/src/routes/v1.ts:144` (authMiddleware, countryCheck, checkCreditsMiddleware, blocklistMiddleware, idempotencyMiddleware)
- `POST /search` in `apps/api/src/routes/v1.ts:154` (authMiddleware, countryCheck, checkCreditsMiddleware)
- `GET /crawl/ongoing` in `apps/api/src/routes/v1.ts:170` (authMiddleware)
- `GET /crawl/active` in `apps/api/src/routes/v1.ts:177` (authMiddleware)
- `GET /crawl/:jobId` in `apps/api/src/routes/v1.ts:183` (authMiddleware)
- `GET /batch/scrape/:jobId` in `apps/api/src/routes/v1.ts:190` (authMiddleware)
- `GET /crawl/:jobId/errors` in `apps/api/src/routes/v1.ts:198` (authMiddleware)
- `GET /batch/scrape/:jobId/errors` in `apps/api/src/routes/v1.ts:204` (authMiddleware)
- `GET /scrape/:jobId` in `apps/api/src/routes/v1.ts:210` (authMiddleware)
- `POST /extract` in `apps/api/src/routes/v1.ts:224` (authMiddleware, countryCheck, checkCreditsMiddleware)
- `GET /extract/:jobId` in `apps/api/src/routes/v1.ts:233` (authMiddleware)
- `POST /deep-research` in `apps/api/src/routes/v1.ts:256` (authMiddleware, countryCheck, checkCreditsMiddleware)
- `GET /deep-research/:jobId` in `apps/api/src/routes/v1.ts:265` (authMiddleware)
- `DELETE /crawl/:jobId` in `apps/api/src/routes/v1.ts:274` (authMiddleware)
- `DELETE /batch/scrape/:jobId` in `apps/api/src/routes/v1.ts:280` (authMiddleware)
- `POST /search` in `apps/api/src/routes/v2.ts:240` (authMiddleware, countryCheck, checkCreditsMiddleware, blocklistMiddleware)
- `POST /search/:jobId/feedback` in `apps/api/src/routes/v2.ts:249` (authMiddleware)
- `POST /parse` in `apps/api/src/routes/v2.ts:262` (authMiddleware, countryCheck, checkCreditsMiddleware)
- `POST /scrape` in `apps/api/src/routes/v2.ts:272` (authMiddleware, countryCheck, checkCreditsMiddleware, blocklistMiddleware)
- `GET /scrape/:jobId` in `apps/api/src/routes/v2.ts:281` (authMiddleware)
- `POST /scrape/:jobId/interact` in `apps/api/src/routes/v2.ts:288` (authMiddleware)
- `DELETE /scrape/:jobId/interact` in `apps/api/src/routes/v2.ts:295` (authMiddleware)
- `POST /batch/scrape` in `apps/api/src/routes/v2.ts:302` (authMiddleware, countryCheck, checkCreditsMiddleware, blocklistMiddleware)
- `POST /crawl` in `apps/api/src/routes/v2.ts:319` (authMiddleware, countryCheck, checkCreditsMiddleware, blocklistMiddleware, idempotencyMiddleware)
- `POST /crawl/params-preview` in `apps/api/src/routes/v2.ts:329` (authMiddleware, checkCreditsMiddleware)
- `GET /crawl/ongoing` in `apps/api/src/routes/v2.ts:336` (authMiddleware)
- `GET /crawl/active` in `apps/api/src/routes/v2.ts:342` (authMiddleware)

## Findings

### MEDIUM: Existing API-key auth can be complemented by x402 payment-auth

The project already has authenticated API routes. x402 can add a parallel no-account path for agents without replacing the existing subscription model.

Recommendation: Add a separate `/x402/*` route or conditional payment middleware branch that maps paid requests into the same internal job pipeline with bypassed credit billing.

Evidence:

- `apps/api/src/routes/admin.ts:5` - import { authMiddleware, checkCreditsMiddleware, wrap } from "./shared";
- `apps/api/src/routes/admin.ts:81` - authMiddleware(RateLimiterMode.Crawl),
- `apps/api/src/routes/shared.ts:197` - export function authMiddleware(
- `apps/api/src/routes/v1.ts:31` - authMiddleware,
- `apps/api/src/routes/v1.ts:127` - authMiddleware(RateLimiterMode.Scrape, { allowKeyless: true }),
- `apps/api/src/routes/v1.ts:136` - authMiddleware(RateLimiterMode.Crawl),

### MEDIUM: x402 coverage appears narrow relative to the core API surface

Active x402 middleware was detected, but paid endpoint coverage does not appear to include the primary scrape/crawl/extract APIs.

Recommendation: Keep the existing paid search path, then add a Circle-ready `/x402/scrape` endpoint or a documented paid mode for the existing scrape route.

Evidence:

- `apps/api/src/routes/v1.ts:340` - paymentMiddleware(
- `apps/api/src/routes/v2.ts:613` - paymentMiddleware(
- `apps/api/src/routes/v1.ts:336` - v1Router.post(

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

Related existing discussion: https://github.com/firecrawl/firecrawl/issues/3279

### Readiness summary

- Score: 88/100
- Estimated effort: medium
- Verdict: Strong candidate: useful primitives exist, but production Circle readiness may still need endpoint coverage, docs, and receipts.

### Why this is useful

AI agents often need one-off access to API results without creating a dashboard account, sharing a long-lived API key, or preloading credits. A Circle/x402 path would let an agent:

1. Discover a paid endpoint.
2. Inspect pricing and request schema.
3. Pay in USDC from a Circle Agent Wallet.
4. Receive the API response plus a receipt/proof object.

### Candidate endpoints

- `POST /x402/search` in `apps/api/src/routes/v1.ts:336`
- `POST /scrape` in `apps/api/src/routes/v1.ts:125`
- `POST /crawl` in `apps/api/src/routes/v1.ts:134`
- `POST /batch/scrape` in `apps/api/src/routes/v1.ts:144`
- `POST /search` in `apps/api/src/routes/v1.ts:154`
- `GET /crawl/ongoing` in `apps/api/src/routes/v1.ts:170`
- `GET /crawl/active` in `apps/api/src/routes/v1.ts:177`
- `GET /crawl/:jobId` in `apps/api/src/routes/v1.ts:183`

### Main integration gaps

- **Existing API-key auth can be complemented by x402 payment-auth**: Add a separate `/x402/*` route or conditional payment middleware branch that maps paid requests into the same internal job pipeline with bypassed credit billing.
- **x402 coverage appears narrow relative to the core API surface**: Keep the existing paid search path, then add a Circle-ready `/x402/scrape` endpoint or a documented paid mode for the existing scrape route.
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
