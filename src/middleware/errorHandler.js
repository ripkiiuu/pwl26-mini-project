import { AppError } from '../utils/AppError.js';

export function notFound(req, res, next) {
  next(new AppError(404, 'Endpoint tidak ditemukan', 'ROUTE_NOT_FOUND'));
}

export function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);
  let error = err;
  if (err.code === 'P2002') error = new AppError(409, 'SKU sudah digunakan', 'SKU_DUPLICATE');
  if (err.code === 'P2003') error = new AppError(409, 'Produk masih memiliki pesanan terkait', 'PRODUCT_HAS_ORDERS');
  if (err.code === 'P2025') error = new AppError(404, 'Data tidak ditemukan', 'NOT_FOUND');
  if (err.type === 'entity.parse.failed') error = new AppError(400, 'JSON tidak valid', 'INVALID_JSON');

  if (!(error instanceof AppError)) {
    console.error(err); // detail hanya di terminal server, bukan respons HTTP
    error = new AppError(500, 'Kesalahan internal server', 'INTERNAL_ERROR');
  }
  res.status(error.status).json({ error: { kode: error.kode, pesan: error.message } });
}
