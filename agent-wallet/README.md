# Circle Agent Wallet Starter

This folder contains a local starter project for the Circle Agent Wallet workflow described in `organisational/Circle Agent Wallet Docs.pdf`.

It is based on the official OpenAI Agents SDK kit from `akelani-circle/agent-stack-ecosystem-kits`, plus npm-compatible local verification scripts.

## What it does

- Uses the Circle setup skill flow.
- Works through Circle CLI wrappers for agent wallets, balances, Marketplace search, service inspection, Gateway balance/deposit, and x402 payment.
- Builds an OpenAI Agents SDK autonomous payment agent.
- Requires approval before tools that move USDC.
- Detects Circle Terms/login gates and leaves them for the user.

## Validate locally

```bash
npm install
npm run typecheck
npm test
npm run build
```

## Live demo

A live run requires the Circle CLI, Circle login, and user approval before any USDC spend:

```bash
npm install -g @circle-fin/cli
circle skill install --tool codex
cp kits/openai-agents/.env.example kits/openai-agents/.env
```

Set `OPENAI_API_KEY` in `kits/openai-agents/.env`, then run:

```bash
npx tsx kits/openai-agents/src/index.ts
```

The upstream starter recommends Bun:

```bash
bun run --cwd kits/openai-agents demo
```

That command is available after installing Bun 1.2+.
