# Implementation Notes

## Local project

The Circle Agent Wallet starter project is in `agent-wallet/`.

It is based on the official `akelani-circle/agent-stack-ecosystem-kits` OpenAI Agents SDK kit at commit `77f38a12495ee870dc6cb817eb7e6caaf938200c`.

Only the required local pieces were copied:

- `kits/openai-agents`
- `packages/circle-tools`
- `packages/kit-core`
- root TypeScript/workspace config

## Local compatibility changes

The upstream kit expects Bun 1.2+ and uses `workspace:*` dependency specifiers. This machine has Node.js 24 but does not have Bun installed, so the local copy was adjusted for npm-based verification:

- root scripts use npm workspaces for `build` and `typecheck`
- workspace dependencies use local `file:` links
- `tsx` was added for Node test execution

The demo source and Circle CLI behavior are otherwise kept aligned with the upstream starter.

## Validation

The project has been validated without a real Circle session or payment:

```bash
cd agent-wallet
npm install
npm run typecheck
npm test
npm run build
```

Tests mock the `circle` executable and cover:

- wallet create/list/balance JSON parsing
- service search/inspect/pay result normalization
- Terms-of-Use gate detection without accepting terms
- explicit approval-gated spend tool list

## Live run prerequisites

To run the actual Circle Agent Wallet demo:

```bash
cd agent-wallet
npm install
npm install -g @circle-fin/cli
circle skill install --tool codex
cp kits/openai-agents/.env.example kits/openai-agents/.env
```

Then add `OPENAI_API_KEY` to `kits/openai-agents/.env`.

The upstream intended command is:

```bash
bun run --cwd kits/openai-agents demo
```

Because Bun is not installed on this machine, install Bun first or run the TypeScript entry point with a compatible TS runner after confirming Circle CLI auth:

```bash
npx tsx kits/openai-agents/src/index.ts
```

The live run will stop for:

- Circle email
- OTP
- Terms acceptance if not already completed
- user approval before any USDC-moving tool call
