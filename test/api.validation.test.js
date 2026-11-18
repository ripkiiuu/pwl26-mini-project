import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { app } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import express from 'express';
import { errorHandler } from '../src/middleware/errorHandler.js';

// Permintaan ini ditolak sebelum query DB; aman diuji walau MySQL belum tersedia.
const server = app.listen(0);
after(async () => { server.close(); await prisma.$disconnect(); });
const base = `http://127.0.0.1:${server.address().port}`;

async function request(path, method = 'GET', body) {
  const response = await fetch(`${base}${path}`, {
    method, headers: { 'content-type': 'application/json' },
    ...(body !== undefined && { body: JSON.stringify(body) }),
  });
  return [response.status, await response.json()];
}

test('POST produk kosong ditolak 400', async () => {
  const [status, body] = await request('/products', 'POST', {});
  assert.equal(status, 400);
  assert.equal(body.error.kode, 'VALIDATION_ERROR');
});
test('POST tanpa JSON/body ditolak 400, bukan error Prisma 500', async () => {
  const response = await fetch(`${base}/products`, { method: 'POST' });
  assert.equal(response.status, 400);
  assert.equal((await response.json()).error.kode, 'VALIDATION_ERROR');
});
test('harga negatif dan stok negatif ditolak', async () => {
  const [status] = await request('/products', 'POST', {
    sku: 'X', name: 'Buket', category: 'Wisuda', price: -1, stock: -2,
  });
  assert.equal(status, 400);
});
test('ID dan query tidak valid ditolak', async () => {
  assert.equal((await request('/products/abc'))[0], 400);
  assert.equal((await request('/products?halaman=0&ukuran=200'))[0], 400);
});
test('order dengan jumlah nol ditolak', async () => {
  assert.equal((await request('/orders', 'POST', {
    productId: 1, customerName: 'Demo', quantity: 0,
  }))[0], 400);
});
test('JSON rusak dan route tak ada memakai format error seragam', async () => {
  const response = await fetch(`${base}/products`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: '{',
  });
  assert.equal(response.status, 400);
  assert.equal((await response.json()).error.kode, 'INVALID_JSON');
  assert.equal((await request('/tidak-ada'))[0], 404);
});

test('error internal terkontrol tidak membocorkan detail pada respons', async () => {
  // Aplikasi mini khusus proses test, bukan route debug dalam aplikasi final.
  const mini = express();
  mini.get('/uji', () => { throw new Error('RAHASIA_INTERNAL_TEST'); });
  mini.use(errorHandler);
  const listener = mini.listen(0);
  try {
    const response = await fetch(`http://127.0.0.1:${listener.address().port}/uji`);
    const text = await response.text();
    assert.equal(response.status, 500);
    assert.equal(JSON.parse(text).error.kode, 'INTERNAL_ERROR');
    assert.doesNotMatch(text, /RAHASIA_INTERNAL_TEST|stack/i);
  } finally {
    listener.close();
  }
});
