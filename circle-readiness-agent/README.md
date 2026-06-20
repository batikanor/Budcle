# Circle Readiness Agent

Circle Readiness Agent evaluates open-source API repositories for x402 and Circle Agent Marketplace readiness. It scans source code, identifies likely API endpoints, detects existing payment/auth/billing primitives, scores integration difficulty, and generates a maintainer-ready GitHub issue draft.

This project was inspired by Firecrawl's open-source repository and its public x402 discussion, but it does not use or copy Firecrawl source code. Firecrawl was analyzed as an external case study from a git-ignored clone under `../.ignored-upstream/firecrawl`.

## Run

```bash
npm install
npm run build
npm test
npm run analyze:firecrawl
```

Analyze any local repository:

```bash
node dist/src/cli.js --repo /path/to/repo --name "Project Name" --url https://github.com/org/repo --out reports/project-circle-readiness.md
```

## What It Checks

- API framework and route files
- public endpoint inventory
- existing auth, API key, rate-limit, billing, and credit accounting
- x402 dependencies and payment middleware
- Circle-specific readiness gaps
- Marketplace listing readiness: schema, pricing, docs, receipts, and health
- maintainer outreach issue draft

The agent does not create GitHub issues automatically. It produces a draft that a user can review and approve before posting.
