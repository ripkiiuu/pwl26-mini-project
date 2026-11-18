// Uji lokal setelah migrasi dan seed; transaksi sengaja gagal setelah INSERT.
import { prisma } from '../src/lib/prisma.js';

const productId = Number(process.argv[2]);
if (!Number.isInteger(productId) || productId < 1) {
  console.error('Pemakaian: node scripts/verify-rollback.js <productId>');
  process.exit(1);
}

try {
  const sebelum = await prisma.product.findUniqueOrThrow({ where: { id: productId } });
  const jumlahSebelum = await prisma.order.count({ where: { productId } });
  try {
    await prisma.$transaction(async (tx) => {
      await tx.order.create({
        data: { productId, customerName: 'Uji rollback F1D02410080', quantity: 1, totalPrice: sebelum.price },
      });
      // Baris sudah ada di transaksi ini, tetapi tidak akan di-commit.
      throw new Error('SENGAJA_GAGAL_SETELAH_INSERT');
    });
  } catch (err) {
    if (err.message !== 'SENGAJA_GAGAL_SETELAH_INSERT') throw err;
    console.log('Error sengaja tertangkap; transaksi dibatalkan.');
  }
  const sesudah = await prisma.product.findUniqueOrThrow({ where: { id: productId } });
  const jumlahSesudah = await prisma.order.count({ where: { productId } });
  if (sebelum.stock !== sesudah.stock || jumlahSebelum !== jumlahSesudah) {
    throw new Error('ROLLBACK GAGAL: data berubah');
  }
  console.log(`ROLLBACK OK: order ${jumlahSebelum} -> ${jumlahSesudah}; stok ${sebelum.stock} -> ${sesudah.stock}`);
} catch (err) {
  console.error(err);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
