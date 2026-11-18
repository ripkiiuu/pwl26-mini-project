import Joi from 'joi';

export const orderBody = Joi.object({
  productId: Joi.number().integer().positive().max(2147483647).required(),
  customerName: Joi.string().trim().min(1).max(191).required(),
  quantity: Joi.number().integer().positive().max(2147483647).required(),
});
