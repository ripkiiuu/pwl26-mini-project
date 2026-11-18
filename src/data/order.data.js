import { prisma } from '../lib/prisma.js';

export function daftar() {
  return prisma.order.findMany({ include: { product: true }, orderBy: { id: 'desc' } });
}

// Semua fungsi transaksi menerima tx, bukan client global.
export function cariProduk(tx, id) { return tx.product.findUnique({ where: { id } }); }
export function kurangiStok(tx, productId, quantity) {
  return tx.product.updateMany({
    where: { id: productId, stock: { gte: quantity } },
    data: { stock: { decrement: quantity } },
  });
}
export function simpan(tx, input) { return tx.order.create({ data: input }); }
