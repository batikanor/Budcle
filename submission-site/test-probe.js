const assert = require("node:assert/strict");
const handler = require("./api/x402-scrape");

function invoke({ method = "POST", headers = {} } = {}) {
  let statusCode = 200;
  const responseHeaders = {};
  let body = "";

  handler(
    { method, headers },
    {
      setHeader(name, value) {
        responseHeaders[name.toLowerCase()] = value;
      },
      get statusCode() {
        return statusCode;
      },
      set statusCode(value) {
        statusCode = value;
      },
      end(value) {
        body = value;
      },
    },
  );

  return { statusCode, responseHeaders, body: JSON.parse(body) };
}

const unpaid = invoke();
assert.equal(unpaid.statusCode, 402);
assert.equal(unpaid.body.error, "Payment required");
assert.match(unpaid.responseHeaders["x-accept-payment"], /USDC/);

const approved = invoke({ headers: { "x-budcle-demo-payment": "approved" } });
assert.equal(approved.statusCode, 200);
assert.equal(approved.body.receipt.demo, true);
assert.equal(approved.body.receipt.paymentVerified, false);
assert.equal(approved.body.receipt.asset, "USDC");

const wrongMethod = invoke({ method: "GET" });
assert.equal(wrongMethod.statusCode, 405);

console.log("x402 probe handler tests passed");
