import { AppError } from '../utils/AppError.js';

export function validate(schema, bagian = 'body') {
  return (req, res, next) => {
    const { value, error } = schema.validate(req[bagian], {
      abortEarly: false,
      allowUnknown: false,
      convert: bagian === 'params' || bagian === 'query',
    });
    if (error) return next(new AppError(400, error.details.map((detail) => detail.message).join('; '), 'VALIDATION_ERROR'));
    // Express 5: req.query merupakan getter, jadi simpan hasil terverifikasi di res.locals.
    res.locals[bagian] = value;
    next();
  };
}
