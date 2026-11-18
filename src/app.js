import express from 'express';
import productRoutes from './routes/product.routes.js';
import orderRoutes from './routes/order.routes.js';
import { logger } from './middleware/logger.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

export const app = express();
app.use(logger);
app.use(express.json({ limit: '32kb' }));
app.use('/products', productRoutes);
app.use('/orders', orderRoutes);
app.use(notFound);
app.use(errorHandler);
