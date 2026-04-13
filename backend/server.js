/**
 * Cashflow Survival Agent — Backend Server
 * Express server with real x402 payment protocol on Stellar testnet
 *
 * Uses:
 *  - @x402/express    → paymentMiddleware for 402 enforcement
 *  - @x402/stellar    → ExactStellarScheme for Soroban auth
 *  - @x402/core       → HTTPFacilitatorClient for OpenZeppelin facilitator
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { paymentMiddleware, x402ResourceServer } from '@x402/express';
import { ExactStellarScheme } from '@x402/stellar/exact/server';
import { HTTPFacilitatorClient } from '@x402/core/server';

const app = express();
const PORT = process.env.PORT || 4000;
const PAY_TO = process.env.PAY_TO_ADDRESS || 'GBYRJOWPACAFBWEABT4YJDQI6RHWCAMHA6W6P5HT2U35A7QBUSKJWOOG';
const FACILITATOR_URL = 'https://x402.org/facilitator';

// ── Facilitator client (Coinbase — no API key needed, stellar:testnet supported) ──
const facilitatorClient = new HTTPFacilitatorClient({
  url: FACILITATOR_URL,
});

// ── x402 resource server with Stellar scheme ──
const resourceServer = new x402ResourceServer(facilitatorClient)
  .register('stellar:testnet', new ExactStellarScheme());

// ── Middleware ──
app.use(cors({
  exposedHeaders: ['PAYMENT-REQUIRED', 'PAYMENT-RESPONSE'],
}));
app.use(express.json());

// ── x402 payment middleware ──
// Protects specified routes with payment requirements
app.use(
  paymentMiddleware(
    {
      'GET /predict-revenue': {
        accepts: [
          {
            scheme: 'exact',
            price: '$0.01',
            network: 'stellar:testnet',
            payTo: PAY_TO,
          },
        ],
        description: 'AI revenue prediction — cashflow risk analysis',
        mimeType: 'application/json',
      },
    },
    resourceServer,
  ),
);

// ── Health check (not paywalled) ──
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'cashflow-survival-agent',
    protocol: 'x402',
    network: 'stellar:testnet',
    payTo: PAY_TO,
    timestamp: new Date().toISOString(),
  });
});

// ── Protected endpoint — only reached after x402 payment ──
app.get('/predict-revenue', (_req, res) => {
  const confidence = +(0.75 + Math.random() * 0.12).toFixed(2);
  res.json({
    prediction: confidence > 0.82 ? 'low revenue risk' : 'moderate revenue risk',
    confidence,
    forecastedIncome: 85000 + Math.floor(Math.random() * 10000),
    timeframe: '30 days',
    generatedAt: new Date().toISOString(),
    breakdown: {
      'Recurring Customers': 45000 + Math.floor(Math.random() * 5000),
      'New Contracts': 25000 + Math.floor(Math.random() * 3000),
      'Services Revenue': 15000 + Math.floor(Math.random() * 2000),
    },
    riskFactors: [
      'Client concentration risk: 35% revenue from top 2 clients',
      'Seasonal dip expected in next 15 days',
      'New contract pipeline shows positive momentum',
    ],
  });
});

// ── Start ──
app.listen(PORT, () => {
  console.log(`\n🚀 Cashflow Survival Agent backend running on http://localhost:${PORT}`);
  console.log(`   Protocol: x402 (real)`);
  console.log(`   Network:  stellar:testnet`);
  console.log(`   PayTo:    ${PAY_TO}`);
  console.log(`   Facilitator: ${FACILITATOR_URL} (Coinbase — no API key needed)`);
  console.log(`\n   GET /health           (free)`);
  console.log(`   GET /predict-revenue  (x402 paywall — $0.01 USDC)\n`);
});
