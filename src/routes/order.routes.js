import { Router } from 'express';
import * as ctrl from '../controllers/order.controller.js';
import { validate } from '../middleware/validate.js';
import { orderBody } from '../validators/order.validator.js';

const router = Router();
router.get('/', ctrl.daftar);
router.post('/', validate(orderBody), ctrl.buat);
export default router;
