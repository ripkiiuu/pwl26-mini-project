import { prisma } from '../src/lib/prisma.js';

const produk = [
  ['BKT-F1D02410080-001', 'Buket Wisuda — Muhammad Rifqy Habibi', 'Wisuda', 175000, 12, 'Data demo akademik NIM F1D02410080.'],
  ['BKT-WIS-002', 'Buket Bunga Matahari', 'Wisuda', 150000, 8, 'Buket kuning untuk wisuda.'],
  ['BKT-WIS-003', 'Buket Mawar Biru', 'Wisuda', 210000, 5, 'Rangkaian bunga biru.'],
  ['BKT-WIS-004', 'Buket Boneka Mini', 'Wisuda', 125000, 14, 'Buket dengan boneka mini.'],
  ['BKT-ULT-005', 'Buket Ulang Tahun Pink', 'Ulang Tahun', 160000, 9, 'Warna merah muda.'],
  ['BKT-ULT-006', 'Buket Cokelat', 'Ulang Tahun', 95000, 18, 'Buket camilan cokelat.'],
  ['BKT-ULT-007', 'Buket Tulip', 'Ulang Tahun', 225000, 4, 'Rangkaian tulip.'],
  ['BKT-ROM-008', 'Buket Mawar Merah', 'Romantis', 245000, 7, 'Mawar merah klasik.'],
  ['BKT-ROM-009', 'Buket Putih Elegan', 'Romantis', 190000, 6, 'Rangkaian putih sederhana.'],
  ['BKT-ROM-010', 'Buket Lavender', 'Romantis', 205000, 11, 'Nuansa ungu lembut.'],
  ['BKT-TER-011', 'Buket Terima Kasih', 'Apresiasi', 130000, 15, 'Hadiah ucapan terima kasih.'],
  ['BKT-TER-012', 'Buket Kertas Warna', 'Apresiasi', 80000, 20, 'Buket dekoratif ekonomis.'],
];

try {
  for (const [sku, name, category, price, stock, description] of produk) {
    // Upsert hanya mengisi data yang belum ada; tidak menimpa stok yang berubah karena order.
    await prisma.product.upsert({
      where: { sku }, update: {}, create: { sku, name, category, price, stock, description },
    });
  }
  console.log(`Seed selesai: ${produk.length} SKU demo tersedia (tanpa menghapus/mengatur ulang data lama).`);
} catch (err) {
  console.error('Seed gagal:', err);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
