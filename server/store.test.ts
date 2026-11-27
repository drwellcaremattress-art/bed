import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  adjustVariantStock,
  loadStore,
  placeOrderRecord,
  updateOrderStatusRecord,
} from './store.ts';
import { createApp } from '../server.ts';

test('placeOrderRecord deducts stock, logs movement, and applies delivery threshold', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'alder-store-'));
  const storePath = path.join(tmpDir, 'store.json');
  const store = loadStore(storePath);

  const firstProduct = store.products[0];
  const firstVariant = firstProduct.variants[0];
  const startingStock = firstVariant.stockQuantity;
  assert.ok(startingStock >= 1, 'Expected seeded variant to have stock');

  const order = placeOrderRecord(store, {
    customerName: 'Kavitha Raman',
    customerEmail: 'kavitha@example.com',
    customerPhone: '9876543210',
    shippingAddress: '14 Boat Club Road, Chennai',
    postalCode: '600028',
    paymentMethod: 'UPI',
    items: [{ variantId: firstVariant.id, quantity: 1 }],
  });

  assert.match(order.orderNumber, /^AM-\d{4}$/);
  assert.equal(firstVariant.stockQuantity, startingStock - 1);
  assert.equal(store.movements[0].delta, -1);
  assert.equal(store.movements[0].referenceId, order.orderNumber);

  const expectedDelivery = order.subtotalCents >= 5000000 ? 0 : 180000;
  assert.equal(order.deliveryCents, expectedDelivery);
  assert.equal(order.totalCents, order.subtotalCents + expectedDelivery);

  assert.throws(
    () =>
      placeOrderRecord(store, {
        customerName: 'Test',
        customerEmail: 't@example.com',
        customerPhone: '9999999999',
        shippingAddress: 'Madurai',
        postalCode: '625001',
        paymentMethod: 'Card',
        items: [{ variantId: firstVariant.id, quantity: 9999 }],
      }),
    /Insufficient stock/
  );

  adjustVariantStock(store, {
    variantId: firstVariant.id,
    delta: 2,
    reason: 'Restock test',
    referenceId: 'TEST-01',
  });
  assert.equal(firstVariant.stockQuantity, startingStock + 1);

  const updated = updateOrderStatusRecord(store, order.id, 'In Joinery');
  assert.equal(updated.status, 'In Joinery');

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('Express API enforces admin auth and serves Teak-In-Furnitures endpoints', async () => {
  process.env.VITEST_NO_LISTEN = '1';
  process.env.ADMIN_PASSCODE = 'test-passcode-123';

  const app = createApp();
  const server = await new Promise<import('node:http').Server>((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });

  try {
    const addr = server.address() as import('node:net').AddressInfo;
    const base = `http://127.0.0.1:${addr.port}`;

    // 1. Public products endpoint returns array of WoodBedProduct
    const prodRes = await fetch(`${base}/api/products`);
    assert.equal(prodRes.status, 200);
    const products = (await prodRes.json()) as Array<{ id: string; variants: Array<{ id: string }> }>;
    assert.ok(Array.isArray(products) && products.length > 0);

    // 2. Protected endpoints reject unauthenticated requests
    const ordersUnauth = await fetch(`${base}/api/orders`);
    assert.equal(ordersUnauth.status, 401);

    const movUnauth = await fetch(`${base}/api/inventory/movements`);
    assert.equal(movUnauth.status, 401);

    // 3. Wrong passcode fails
    const badLogin = await fetch(`${base}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passcode: 'wrong' }),
    });
    assert.equal(badLogin.status, 401);

    // 4. Valid passcode sets HttpOnly cookie and grants access
    const goodLogin = await fetch(`${base}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passcode: 'test-passcode-123' }),
    });
    assert.equal(goodLogin.status, 200);
    const setCookie = goodLogin.headers.get('set-cookie') || '';
    assert.match(setCookie, /alder_admin_token=/);
    const cookieHeader = setCookie.split(';')[0];

    const ordersAuthed = await fetch(`${base}/api/orders`, {
      headers: { Cookie: cookieHeader },
    });
    assert.equal(ordersAuthed.status, 200);
    const allOrders = await ordersAuthed.json();
    assert.ok(Array.isArray(allOrders));
  } finally {
    server.close();
  }
});
