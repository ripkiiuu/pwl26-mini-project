import * as service from '../services/product.service.js';

export async function daftar(req, res) { res.json(await service.daftar(res.locals.query)); }
export async function detail(req, res) { res.json({ data: await service.detail(res.locals.params.id) }); }
export async function buat(req, res) { res.status(201).json({ data: await service.buat(res.locals.body) }); }
export async function perbarui(req, res) { res.json({ data: await service.perbarui(res.locals.params.id, res.locals.body) }); }
export async function hapus(req, res) { await service.hapus(res.locals.params.id); res.status(204).end(); }
