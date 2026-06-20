This is a submission to **Circle’s Agentic Commerce Track**.

Also part of **Agentic Commerce (payments, x402, automation & subscriptions)**

Together with bonus tracks & partner bounties:

[] Circle

[] Nebius

[] Tavilly

[] Blockchain for Good

Ongoing work.

## Circle Readiness Agent

This repo includes `circle-readiness-agent/`, a Circle-adapted tool that evaluates open-source API projects for x402 and Circle Agent Marketplace readiness, then drafts maintainer-facing GitHub issues.

The idea was inspired by Firecrawl's open-source repository and its public x402 discussion. We analyzed Firecrawl as an external case study from a git-ignored local clone, but we did not use or copy Firecrawl source code.

Run the analyzer:

```bash
cd circle-readiness-agent
npm test
npm run analyze:firecrawl
```

Generated reports live in `circle-readiness-agent/reports/`.

## Submission Demo

`submission-site/` is a static Vercel-ready report viewer for the jury and video demo. `SUBMISSION.md` contains the 3 minute pitch plan, live demo flow, and submission checklist.
