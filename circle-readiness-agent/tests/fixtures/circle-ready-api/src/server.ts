import express from "express";
import { paymentMiddleware } from "@x402/express";

const router = express.Router();

const scrapeInputSchema = {
  type: "object",
  required: ["url"],
  properties: {
    url: { type: "string", format: "uri" },
  },
};

router.post(
  "/x402/scrape",
  paymentMiddleware({
    "POST /x402/scrape": {
      accepts: {
        scheme: "exact",
        network: "eip155:8453",
        price: "$0.01",
        payTo: "0x0000000000000000000000000000000000000000",
      },
      inputSchema: scrapeInputSchema,
      outputSchema: {
        type: "object",
        required: ["data", "receipt"],
      },
    },
  } as any),
  async (_req, res) => {
    res.json({
      data: { markdown: "ok" },
      receipt: {
        amount: "0.01",
        network: "base",
        txHash: "0xabc",
        transactionHash: "0xabc",
        requestHash: "sha256:req",
        resultHash: "sha256:res",
      },
    });
  },
);
