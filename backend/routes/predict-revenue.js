/**
 * /predict-revenue route
 * x402-like flow:
 *   1. GET without payment → 402 with payment instructions
 *   2. GET with tx_hash header → verify on Stellar → return data
 */

import { verifyStellarPayment, AGENT_DESTINATION } from '../services/stellar-verify.js';

const PRICE = '0.02';
const ASSET = 'USDC';

// In-memory cache of verified tx hashes to avoid re-verification
const verifiedTxCache = new Map();

export default function predictRevenueRoute(router) {
  router.get('/predict-revenue', async (req, res) => {
    const txHash = req.headers['x-payment-tx'] || req.query.tx_hash;

    // ── No payment proof → 402 Payment Required ──
    if (!txHash) {
      return res.status(402).json({
        error: 'Payment Required',
        price: PRICE,
        asset: ASSET,
        network: 'stellar_testnet',
        destination: AGENT_DESTINATION,
        memo: `predict-revenue-${Date.now()}`,
        instructions: `Send ${PRICE} ${ASSET} (or XLM equivalent on testnet) to ${AGENT_DESTINATION}, then retry with header X-Payment-Tx: <tx_hash>`,
      });
    }

    // ── Check cache first ──
    if (verifiedTxCache.has(txHash)) {
      return res.json({
        success: true,
        paid: true,
        payment: verifiedTxCache.get(txHash),
        data: generatePrediction(),
      });
    }

    // ── Verify payment on Stellar testnet ──
    const result = await verifyStellarPayment(txHash, PRICE);

    if (!result.verified) {
      return res.status(402).json({
        error: 'Payment Verification Failed',
        detail: result.error,
        price: PRICE,
        asset: ASSET,
        destination: AGENT_DESTINATION,
      });
    }

    // Cache the verified tx
    verifiedTxCache.set(txHash, result.tx);

    // ── Return paid data ──
    return res.json({
      success: true,
      paid: true,
      payment: result.tx,
      data: generatePrediction(),
    });
  });

  return router;
}

/**
 * Generate mock financial prediction data
 * In production, this would call a real ML model or data provider
 */
function generatePrediction() {
  return {
    forecastedIncome: 85000 + Math.floor(Math.random() * 10000),
    confidence: +(0.68 + Math.random() * 0.15).toFixed(2),
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
  };
}
