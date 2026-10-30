import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { pool } from './db/pool.js';
import { logger } from './middleware/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import productsRouter from './routes/products.js';
import ordersRouter from './routes/orders.js';
import authRouter from './routes/auth.js';

const app = express();

app.use(helmet());                          // защитные заголовки — первым
app.use(cors({ origin: process.env.CORS_ORIGIN }));
app.use(express.json({ limit: '10kb' }));   // тело запроса не больше 10 КБ

// В тестах лог каждого запроса только мешает читать результат
if (process.env.NODE_ENV !== 'test') {
  app.use(logger);
}

app.get('/', (req, res) => {
  res.send('АгроМаркет API работает');
});

// «Жив ли сервер и есть ли связь с базой?»
app.get('/api/health', async (req, res) => {
  await pool.query('SELECT 1');
  res.json({ status: 'ok', db: 'connected', time: new Date().toISOString() });
});

app.get('/api/about', (req, res) => {
  res.json({ name: 'АгроМаркет', version: '1.0', author: 'Ваше ФИО' });
});

app.use('/api/auth', authRouter);
app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);

// Сюда доходят только запросы, которые не обработал ни один маршрут
app.use((req, res) => {
  res.status(404).json({ error: `Маршрут ${req.method} ${req.originalUrl} не найден` });
});

app.use(errorHandler);   // ← последний middleware

export default app;      // приложение БЕЗ запуска сервера
