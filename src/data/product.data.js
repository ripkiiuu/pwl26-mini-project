import { prisma } from '../lib/prisma.js';

export function daftar(where, skip, take) {
  return prisma.product.findMany({ where, skip, take, orderBy: { id: 'asc' } });
}
export function hitung(where) { return prisma.product.count({ where }); }
export function cariById(id) { return prisma.product.findUnique({ where: { id } }); }
export function simpan(input) { return prisma.product.create({ data: input }); }
export function ubah(id, input) { return prisma.product.update({ where: { id }, data: input }); }
export function hapus(id) { return prisma.product.delete({ where: { id } }); }
