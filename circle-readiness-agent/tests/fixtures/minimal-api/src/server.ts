import express from "express";
import { paymentMiddleware } from "@x402/express";

const router = express.Router();

router.post(
  "/x402/search",
  paymentMiddleware({
    "POST /x402/search": {
      accepts: {
        scheme: "exact",
        network: "eip155:8453",
        price: "$0.01",
        payTo: "0x0000000000000000000000000000000000000000",
      },
      description: "Paid search endpoint for USDC agents",
    },
  } as any),
  async (_req, res) => {
    res.json({
      data: [],
      receipt: { amount: "0.01", network: "base", txHash: "0xabc", resultHash: "sha256:abc" },
    });
  },
);

router.post("/scrape", authMiddleware, checkCreditsMiddleware(1), async (_req, res) => {
  res.json({ markdown: "ok" });
});

function authMiddleware(_req: unknown, _res: unknown, next: () => void): void {
  next();
}

function checkCreditsMiddleware(_credits: number): unknown {
  return (_req: unknown, _res: unknown, next: () => void) => next();
}
