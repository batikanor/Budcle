import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, chmodSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import {
  createWallet,
  getBalance,
  inspectService,
  listWallets,
  payService,
  searchServices,
  sessionStatus,
} from '../packages/circle-tools/src/index';
import { SPEND_TOOL_NAMES } from '../packages/kit-core/src/tools';

const originalPath = process.env.PATH ?? '';

function installCircleMock(handlerSource: string): string {
  const dir = mkdtempSync(join(tmpdir(), 'circle-mock-'));
  const bin = join(dir, 'circle');
  writeFileSync(
    bin,
    `#!/usr/bin/env node
const args = process.argv.slice(2);
${handlerSource}
`,
  );
  chmodSync(bin, 0o755);
  process.env.PATH = `${dir}:${originalPath}`;
  return dir;
}

test.afterEach(() => {
  process.env.PATH = originalPath;
});

test('wallet wrappers parse Circle CLI JSON envelopes', async () => {
  installCircleMock(`
if (args.join(' ') === 'wallet create --chain BASE --output json') {
  console.log(JSON.stringify({ data: { wallets: [
    { blockchain: 'ETH', address: '0x0000000000000000000000000000000000000001' },
    { blockchain: 'BASE', address: '0x00000000000000000000000000000000000000ba' }
  ] } }));
  process.exit(0);
}
if (args.join(' ') === 'wallet list --chain BASE --type agent --output json') {
  console.log(JSON.stringify({ data: { wallets: [
    { address: '0x00000000000000000000000000000000000000ba' }
  ] } }));
  process.exit(0);
}
if (args[0] === 'wallet' && args[1] === 'balance') {
  console.log(JSON.stringify({ data: {
    address: args[args.indexOf('--address') + 1],
    balances: [{ amount: '12.5', token: { symbol: 'USDC' } }]
  } }));
  process.exit(0);
}
console.error('unexpected args: ' + args.join(' '));
process.exit(1);
`);

  await assert.deepEqual(await createWallet(), {
    address: '0x00000000000000000000000000000000000000ba',
  });
  await assert.deepEqual(await listWallets(), [
    { address: '0x00000000000000000000000000000000000000ba' },
  ]);
  await assert.deepEqual(
    await getBalance({
      address: '0x00000000000000000000000000000000000000ba',
      chain: 'BASE',
    }),
    {
      address: '0x00000000000000000000000000000000000000ba',
      tokens: [{ symbol: 'USDC', amount: '12.5' }],
    },
  );
});

test('service wrappers normalize search, inspection, and paid-call results', async () => {
  installCircleMock(`
if (args[0] === 'services' && args[1] === 'search') {
  console.log(JSON.stringify({ data: { items: [{
    resource: 'https://example.test/weather',
    accepts: [{ amount: '4000' }],
    metadata: { provider: { name: 'Weather API' }, description: 'Paid forecast' }
  }] } }));
  process.exit(0);
}
if (args[0] === 'services' && args[1] === 'inspect') {
  console.log(JSON.stringify({ data: {
    url: args[2],
    status: 'healthy',
    description: 'Paid forecast',
    provider: { name: 'Weather API' },
    price: { formatted: '0.004 USDC' },
    input: { type: 'object', properties: { city: { type: 'string' } } },
    method: 'GET'
  } }));
  process.exit(0);
}
if (args[0] === 'services' && args[1] === 'pay') {
  console.log(JSON.stringify({
    response: { forecast: 'clear' },
    payment: {
      amount: '4000',
      receipt: Buffer.from(JSON.stringify({
        transaction: '0x' + 'a'.repeat(64)
      })).toString('base64')
    }
  }));
  process.exit(0);
}
console.error('unexpected args: ' + args.join(' '));
process.exit(1);
`);

  assert.deepEqual(await searchServices({ keyword: 'weather' }), [
    {
      url: 'https://example.test/weather',
      name: 'Weather API',
      description: 'Paid forecast',
      price: '0.004 USDC',
    },
  ]);

  assert.deepEqual(await inspectService({ url: 'https://example.test/weather' }), {
    url: 'https://example.test/weather',
    name: 'Weather API',
    description: 'Paid forecast',
    price: '0.004 USDC',
    schema: { type: 'object', properties: { city: { type: 'string' } } },
    health: 'healthy',
    method: 'GET',
  });

  const paid = await payService({
    url: 'https://example.test/weather',
    address: '0x00000000000000000000000000000000000000ba',
    chain: 'BASE',
    method: 'GET',
    data: { city: 'Berlin' },
  });
  assert.equal(paid.serviceUrl, 'https://example.test/weather');
  assert.equal(paid.amount, '4000');
  assert.equal(paid.txHash, `0x${'a'.repeat(64)}`);
  assert.equal(paid.response, '{"forecast":"clear"}');
});

test('auth status detects terms gate without accepting terms', () => {
  installCircleMock(`
if (args[0] === 'wallet' && args[1] === 'status') {
  console.error('Error: Circle CLI Terms acceptance is required before use.');
  process.exit(1);
}
console.error('unexpected args: ' + args.join(' '));
process.exit(1);
`);

  const status = sessionStatus();
  assert.equal(status.loggedIn, false);
  assert.equal(status.termsPending, true);
});

test('spend tools stay explicit for human approval gates', () => {
  assert.deepEqual([...SPEND_TOOL_NAMES].sort(), ['circle_gateway_deposit', 'circle_pay_service']);
});
