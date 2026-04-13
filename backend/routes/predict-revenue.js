/**
 * /predict-revenue route
 * x402-like flow — enforces real Stellar payment:
 *   1. GET without txHash → 402 with payment instructions
 *   2. GET with txHash   → verifyTransaction() on Stellar → return data or 402
 */

import { verifyTransaction, AGENT_DESTINATION } from '../services/stellar-verify.js';

// Price in XLM (user has 10 XLM on testnet)
const PRICE = '0.5';
const ASSET = 'XLM';

// In-memory cache of verified tx hashes to avoid double-verification
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
        memo: 'predict-revenue',
        instructions: `Send ${PRICE} ${ASSET} to ${AGENT_DESTINATION} on Stellar testnet, then retry with header X-Payment-Tx: <tx_hash>`,
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
    const result = await verifyTransaction(
      txHash,
      PRICE,
      AGENT_DESTINATION,
      undefined // memo optional for now
    );

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
 * Generate financial prediction data
 * In production this would call a real ML model
 */
function generatePrediction() {
  const confidence = +(0.75 + Math.random() * 0.12).toFixed(2);
  return {
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
  };
}
