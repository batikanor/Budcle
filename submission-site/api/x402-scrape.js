const paymentRequirements = {
  scheme: "exact",
  network: "base-sepolia",
  asset: "USDC",
  amount: "0.01",
  resource: "/api/x402-scrape",
  payTo: "0x0000000000000000000000000000000000000000",
  description: "Budcle demo endpoint. Shows the x402 challenge/receipt shape without settling real USDC.",
};

module.exports = function handler(req, res) {
  res.setHeader("content-type", "application/json; charset=utf-8");

  if (req.method !== "POST") {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: "Method not allowed. Use POST." }, null, 2));
    return;
  }

  if (req.headers["x-budcle-demo-payment"] !== "approved") {
    res.statusCode = 402;
    res.setHeader("x-accept-payment", JSON.stringify(paymentRequirements));
    res.end(
      JSON.stringify(
        {
          error: "Payment required",
          accepts: [paymentRequirements],
          nextStep: "For the live demo, resend with header: x-budcle-demo-payment: approved",
        },
        null,
        2,
      ),
    );
    return;
  }

  res.statusCode = 200;
  res.end(
    JSON.stringify(
      {
        data: {
          markdown: "# Budcle demo\n\nThis response represents the protected API resource after an x402-style payment gate.",
        },
        receipt: {
          demo: true,
          paymentVerified: false,
          amount: paymentRequirements.amount,
          asset: paymentRequirements.asset,
          network: paymentRequirements.network,
          resource: paymentRequirements.resource,
          requestHash: "sha256:demo-request",
          resultHash: "sha256:demo-result",
          note: "Demo-only receipt shape. Production should verify x402/Gateway payment before returning data.",
        },
      },
      null,
      2,
    ),
  );
};
