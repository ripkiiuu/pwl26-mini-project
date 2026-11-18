import * as service from '../services/order.service.js';

export async function daftar(req, res) { res.json({ data: await service.daftar() }); }
export async function buat(req, res) { res.status(201).json({ data: await service.buat(res.locals.body) }); }
