import * as data from '../data/product.data.js';
import { AppError } from '../utils/AppError.js';

export async function daftar(query) {
  const { halaman, ukuran, category, cari } = query;
  const where = {
    ...(category && { category }),
    ...(cari && { name: { contains: cari } }),
  };
  const [hasil, total] = await Promise.all([
    data.daftar(where, (halaman - 1) * ukuran, ukuran), data.hitung(where),
  ]);
  return { data: hasil, meta: { halaman, ukuran, total, totalHalaman: Math.ceil(total / ukuran) } };
}

export async function detail(id) {
  const produk = await data.cariById(id);
  if (!produk) throw new AppError(404, 'Produk tidak ditemukan', 'PRODUCT_NOT_FOUND');
  return produk;
}

export async function buat(input) {
  // Unique SKU dijamin indeks database; P2002 diterjemahkan errorHandler (aman juga saat request bersamaan).
  return data.simpan(input);
}

export async function perbarui(id, input) {
  await detail(id);
  return data.ubah(id, input);
}

export async function hapus(id) {
  await detail(id);
  return data.hapus(id); // foreign key RESTRICT -> P2003/409 bila sudah ada order
}
