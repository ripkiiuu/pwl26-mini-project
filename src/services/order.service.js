import { prisma } from '../lib/prisma.js';
import * as data from '../data/order.data.js';
import { AppError } from '../utils/AppError.js';

export function daftar() { return data.daftar(); }

export function buat({ productId, customerName, quantity }) {
  return prisma.$transaction(async (tx) => {
    const produk = await data.cariProduk(tx, productId);
    if (!produk) throw new AppError(404, 'Produk tidak ditemukan', 'PRODUCT_NOT_FOUND');

    // UPDATE ... WHERE stock >= quantity adalah pemeriksaan atomik pada baris MySQL.
    // Dua transaksi bersaing tidak dapat sama-sama mengurangi stok yang tidak cukup.
    const hasil = await data.kurangiStok(tx, productId, quantity);
    if (hasil.count !== 1) throw new AppError(409, 'Stok tidak cukup', 'INSUFFICIENT_STOCK');

    const totalPrice = produk.price.mul(quantity); // Decimal, bukan float dan bukan harga kiriman client.
    return data.simpan(tx, { productId, customerName, quantity, totalPrice });
  });
}
