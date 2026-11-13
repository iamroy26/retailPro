import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import { apiErrorHandler, app } from '../src/app.js';
import { prisma } from '../src/db/prisma.js';

let server;
let origin;

before(async () => {
  server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });
  origin = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  await prisma.$disconnect();
});

for (const path of ['/api/auth/register', '/api/v1/auth/register']) {
  test(`${path} validates requests through the shared auth contract`, async () => {
    const response = await fetch(`${origin}${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ full_name: 'A', email: 'invalid', password: 'short' }),
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.error, 'Request validation failed.');
    assert.ok(payload.details.some((issue) => issue.path === 'email'));
  });
}

for (const path of ['/api/products', '/api/v1/products']) {
  test(`${path} preserves tenant data endpoint authentication`, async () => {
    const response = await fetch(`${origin}${path}`);
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.equal(payload.error, 'Please sign in to continue.');
  });
}

test('product image search and uploads remain authenticated on both API versions', async () => {
  for (const [path, options] of [
    ['/api/products/image-search?name=tea', {}],
    ['/api/v1/products/image-search?name=tea', {}],
    ['/api/products/images/import', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' }],
    ['/api/v1/products/images/upload', { method: 'POST', headers: { 'content-type': 'image/png' }, body: Buffer.from([0x89, 0x50, 0x4e, 0x47]) }],
  ]) {
    const response = await fetch(`${origin}${path}`, options);
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.equal(payload.error, 'Please sign in to continue.');
  }
});

test('database schema errors are logged with request context and return a safe migration message', () => {
  const logged = [];
  const originalError = console.error;
  const response = {
    statusCode: 200,
    payload: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    },
  };
  console.error = (...args) => logged.push(args);

  try {
    apiErrorHandler(
      Object.assign(new Error('The column `brand` does not exist.'), {
        code: 'P2022',
        meta: { modelName: 'Product', column: 'brand' },
      }),
      { method: 'POST', path: '/api/products' },
      response,
      () => {},
    );
  } finally {
    console.error = originalError;
  }

  assert.equal(response.statusCode, 503);
  assert.match(response.payload.error, /schema is not up to date/i);
  assert.equal(logged[0][1].path, '/api/products');
  assert.equal(logged[0][1].column, 'brand');
});
