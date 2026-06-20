import express from "express";
import { paymentMiddleware } from "@x402/express";

const router = express.Router();

router.post("/scrape", authMiddleware, checkCreditsMiddleware(1), async (_req, res) => {
  res.json({ markdown: "ok" });
});

// router.post("/x402/scrape", paymentMiddleware({}), scrapeController);

function authMiddleware(_req: unknown, _res: unknown, next: () => void): void {
  next();
}

function checkCreditsMiddleware(_credits: number): unknown {
  return (_req: unknown, _res: unknown, next: () => void) => next();
}
