import express from 'express';
import webhookRoutes from './routes/webhook.routes.js';
import runRoutes from './routes/run.routes.js';
import contactRoutes from './routes/contact.routes.js';
import orderRoutes from './routes/order.routes.js';
import associationRoutes from './routes/association.routes.js';
import logger from './logger/logger.js';

const app = express();

// ── Body parsing ───────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Health check ───────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Routes (all prefixed with /api) ────────────────────────────────────
app.use('/api/webhook', webhookRoutes);          // GHL automation trigger  (POST /api/webhook)
app.use('/api/create-custom-relation', runRoutes); // Manual full-flow trigger (POST /api/create-custom-relation)
app.use('/api/contacts', contactRoutes);         // Contact info             (GET  /api/contacts/:contactId)
app.use('/api/orders', orderRoutes);             // Order ops                (POST /api/orders/search | POST /api/orders | GET /api/orders/:orderId)
app.use('/api/associations', associationRoutes); // Association ops          (GET  /api/associations/check | POST /api/associations)

// ── 404 handler ────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// ── Global error handler ───────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  logger.error('Unhandled Express error', { error: err.message, stack: err.stack });
  res.status(500).json({ success: false, error: 'Internal server error' });
});

export default app;
