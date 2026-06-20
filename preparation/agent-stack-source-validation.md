# Agent Stack Source Validation

Prepared: 2026-06-20

## Sources checked

| Source | URL | Validation notes |
| --- | --- | --- |
| Circle Agent Stack docs | https://developers.circle.com/agent-stack | Official Circle developer docs. Confirms Agent Stack lets agents hold/transact USDC, discover/pay for x402 services, and operate with compliance guardrails. Lists Circle CLI, Agent Wallets, Agent Nanopayments, Agent Marketplace, and Circle Skills. |
| Circle Agent Wallet quickstart | https://developers.circle.com/agent-stack/agent-wallets/quickstart | Official Circle quickstart. Confirms Node.js 20.18.2+, `npm install -g @circle-fin/cli`, email OTP login, automatic wallet provisioning, Base funding, and balance checks. |
| Circle CLI command reference | https://developers.circle.com/agent-stack/circle-cli/command-reference | Official command reference. Confirms `circle wallet login/status/create/list/balance/fund/transfer`, `circle services search/inspect/pay`, `circle gateway balance/deposit`, skills, and terms commands. |
| Circle Skills repo | https://github.com/circlefin/skills | Official Circle skill repo. Confirms skills for `use-circle-cli`, `use-agent-wallet`, `pay-via-agent-wallet`, `fund-agent-wallet`, and `agent-wallet-policy`. |
| Circle setup skill | https://agents.circle.com/skills/setup.md | Saved locally at `preparation/sources/circle-agent-setup-skill.md`. Confirms this flow must use Circle Agent Wallet CLI, install `@circle-fin/cli`, install Circle skills for Codex, authenticate with Circle wallet login, list/create wallets on Base, check balances, discover services, inspect service pricing/schema, and pay through the wallet-pay skill. |
| Agent Stack ecosystem starter kits | https://github.com/akelani-circle/agent-stack-ecosystem-kits | Public starter kit repo referenced by the PDF. Checked commit `77f38a12495ee870dc6cb817eb7e6caaf938200c` from 2026-06-18. Saved upstream README at `preparation/sources/agent-stack-ecosystem-kits-readme.md`. |
| Circle launch blog | https://www.circle.com/blog/introducing-circle-agent-stack-financial-infrastructure-for-the-agentic-economy | Official Circle blog. Confirms the five initial components: Agent Wallets, Agent Marketplace, Circle CLI, Nanopayments powered by Circle Gateway, and Circle Skills. |
| Circle x402/API monetization blog | https://www.circle.com/blog/turn-your-api-into-a-storefront-for-agents | Official Circle blog. Confirms the discover, evaluate, pay, and continue workflow for x402 services, plus the setup prompt flow using `https://agents.circle.com/skills/setup.md`. |

## PDF alignment

The local PDF at `organisational/Circle Agent Wallet Docs.pdf` asks builders to start from the Agent Stack ecosystem starter kits and use an agent framework such as OpenAI Agents SDK, Claude Agent SDK, LangChain, Mastra, Vercel AI SDK, or Google ADK.

The upstream starter kit repo contains those exact kits:

- `kits/openai-agents`
- `kits/claude-agent-sdk`
- `kits/langchain`
- `kits/mastra`
- `kits/vercel-ai`
- `kits/google-adk`

It also provides the shared packages the PDF implies:

- `packages/circle-tools`: framework-agnostic Circle CLI wrappers for wallets, balances, service discovery, and x402 payments.
- `packages/kit-core`: shared setup skill fetching, tool descriptions, payment preflight helpers, approval helpers, and terminal theme.

## Starter choice

I selected the OpenAI Agents SDK kit for this repo because:

- The PDF explicitly lists OpenAI Agents SDK among the supported framework starter kits.
- The current work is being performed from Codex, and Circle docs list Codex as a supported AI agent surface.
- The OpenAI kit has a focused TypeScript entry point for the required workflow: setup skill, Circle Agent Wallet, balance checks, Marketplace service discovery, x402 inspection, approval-gated payment, and receipt/result handling.

## Manual gate

A live Circle Agent Wallet run cannot be completed without user input:

- Circle Terms acceptance may be required on this host. The setup skill says the agent must never accept Terms or Privacy Policy on the user's behalf.
- Circle wallet login requires the user's Circle email and OTP.
- Funding with fiat/crypto requires user action and may involve a browser/on-ramp or external wallet.
- `circle_pay_service` and `circle_gateway_deposit` move USDC and are approval-gated in the starter.

Local validation therefore uses mocked Circle CLI tests. The code is ready for a live run once the above manual gates are completed by the user.
