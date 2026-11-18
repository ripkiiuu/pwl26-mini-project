import 'dotenv/config';
import { app } from './app.js';
import { prisma } from './lib/prisma.js';

const port = Number(process.env.PORT || 3000);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT tidak valid');
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL belum diatur di .env');

try {
  await prisma.$connect();
  const server = app.listen(port, () => console.log(`API berjalan di http://localhost:${port}`));
  async function tutup() { server.close(); await prisma.$disconnect(); }
  process.on('SIGINT', tutup);
  process.on('SIGTERM', tutup);
} catch (err) {
  console.error('Gagal menghubungkan MySQL:', err);
  process.exitCode = 1;
  await prisma.$disconnect();
}
