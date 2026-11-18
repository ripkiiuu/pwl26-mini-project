import { test } from 'node:test';
import assert from 'node:assert/strict';
import { app } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';

// Integration test nyata; jalankan hanya jika DATABASE_URL ada dan migrasi sudah diterapkan.
test('CRUD, filter, relasi, konflik, dan stok pada MySQL', { skip: !process.env.DATABASE_URL }, async () => {
  const server = app.listen(0);
  const base = `http://127.0.0.1:${server.address().port}`;
  const suffix = `${Date.now()}-${process.pid}`;
  const sku = `BKT-F1D02410080-TEST-${suffix}`;
  const sku2 = `BKT-F1D02410080-TEST2-${suffix}`;
  const productIds = [];

  async function req(method, path, body) {
    const response = await fetch(`${base}${path}`, {
      method,
      headers: { 'content-type': 'application/json' },
      ...(body !== undefined && { body: JSON.stringify(body) }),
    });
    return { status: response.status, body: response.status === 204 ? null : await response.json() };
  }

  try {
    let response = await req('GET', '/products?halaman=1&ukuran=5&category=Wisuda');
    assert.equal(response.status, 200);
    assert.equal(response.body.meta.ukuran, 5);
    assert.ok(response.body.data.every((row) => row.category === 'Wisuda'));

    const input = {
      sku, name: 'Uji Muhammad Rifqy Habibi F1D02410080', category: 'Wisuda',
      description: 'Data sementara integration test', price: 125000, stock: 1,
    };
    response = await req('POST', '/products', input);
    assert.equal(response.status, 201);
    const id = response.body.data.id;
    productIds.push(id);
    assert.equal((await req('GET', `/products/${id}`)).status, 200);
    assert.equal((await req('GET', '/products/99999999')).status, 404);
    assert.equal((await req('POST', '/products', input)).status, 409);

    response = await req('PUT', `/products/${id}`, { ...input, price: 130000 });
    assert.equal(response.status, 200);
    assert.equal(response.body.data.price, '130000');

    // Dua pesanan berebut satu stok: tepat satu 201 dan satu 409.
    const orderInput = { productId: id, customerName: 'Pelanggan Demo F1D02410080', quantity: 1 };
    const two = await Promise.all([
      req('POST', '/orders', orderInput), req('POST', '/orders', orderInput),
    ]);
    assert.deepEqual(two.map((r) => r.status).sort(), [201, 409]);
    assert.equal(two.find((r) => r.status === 201).body.data.totalPrice, '130000');
    assert.equal((await prisma.product.findUnique({ where: { id } })).stock, 0);
    assert.equal(await prisma.order.count({ where: { productId: id } }), 1);
    assert.equal((await req('DELETE', `/products/${id}`)).status, 409);

    response = await req('GET', '/orders');
    assert.equal(response.status, 200);
    assert.equal(response.body.data.find((row) => row.productId === id).product.sku, sku);

    response = await req('POST', '/products', { ...input, sku: sku2 });
    assert.equal(response.status, 201);
    productIds.push(response.body.data.id);
    assert.equal((await req('DELETE', `/products/${response.body.data.id}`)).status, 204);
    productIds.pop();
  } finally {
    // Hanya data sementara milik test yang dihapus; seed dan data mahasiswa lain tetap utuh.
    if (productIds.length) {
      await prisma.order.deleteMany({ where: { productId: { in: productIds } } });
      await prisma.product.deleteMany({ where: { id: { in: productIds } } });
    }
    server.close();
    await prisma.$disconnect();
  }
});
