import { Router } from 'express';
import * as ctrl from '../controllers/product.controller.js';
import { validate } from '../middleware/validate.js';
import { productBody, productId, productQuery } from '../validators/product.validator.js';

const router = Router();
router.get('/', validate(productQuery, 'query'), ctrl.daftar);
router.get('/:id', validate(productId, 'params'), ctrl.detail);
router.post('/', validate(productBody), ctrl.buat);
router.put('/:id', validate(productId, 'params'), validate(productBody), ctrl.perbarui);
router.delete('/:id', validate(productId, 'params'), ctrl.hapus);
export default router;
