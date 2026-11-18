import Joi from 'joi';

const kolom = {
  sku: Joi.string().trim().min(1).max(100).required(),
  name: Joi.string().trim().min(1).max(191).required(),
  category: Joi.string().trim().min(1).max(100).required(),
  description: Joi.string().trim().allow('').max(5000).optional(),
  price: Joi.number().positive().precision(2).max(9999999999.99).required(),
  stock: Joi.number().integer().min(0).max(2147483647).required(),
};

export const productBody = Joi.object(kolom);
export const productId = Joi.object({ id: Joi.number().integer().positive().max(2147483647).required() });
export const productQuery = Joi.object({
  halaman: Joi.number().integer().min(1).max(1000000).default(1),
  ukuran: Joi.number().integer().min(1).max(100).default(10),
  category: Joi.string().trim().min(1).max(100),
  cari: Joi.string().trim().min(1).max(191),
});
