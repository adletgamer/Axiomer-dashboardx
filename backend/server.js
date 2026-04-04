/**
 * Cashflow Survival Agent — Backend Server
 * Minimal Express server with x402-like payment flow on Stellar testnet
 */

import express from 'express';
import cors from 'cors';
import { Router } from 'express';
import predictRevenueRoute from './routes/predict-revenue.js';

const app = express();
const PORT = process.env.PORT || 4000;

// ── Middleware ──
app.use(cors());
app.use(express.json());

// ── Health check ──
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'cashflow-survival-agent', timestamp: new Date().toISOString() });
});

// ── API routes ──
const apiRouter = Router();
predictRevenueRoute(apiRouter);
app.use('/api', apiRouter);

// ── Start ──
app.listen(PORT, () => {
  console.log(`\n🚀 Cashflow Survival Agent backend running on http://localhost:${PORT}`);
  console.log(`   GET /health`);
  console.log(`   GET /api/predict-revenue  (x402-like paywall)\n`);
});
