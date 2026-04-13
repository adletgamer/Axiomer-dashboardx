/**
 * Stellar Transaction Verification Service
 * Verifies real payments on Stellar testnet using Horizon API
 */

import * as StellarSdk from '@stellar/stellar-sdk';

// Real testnet destination — this is the API provider's wallet
const AGENT_DESTINATION = 'GBYRJOWPACAFBWEABT4YJDQI6RHWCAMHA6W6P5HT2U35A7QBUSKJWOOG';

const HORIZON_TESTNET = 'https://horizon-testnet.stellar.org';

/**
 * Verify a Stellar testnet transaction meets payment requirements.
 *
 * Checks:
 *  1. Transaction exists on network
 *  2. Contains a payment operation to `destination`
 *  3. Payment amount >= `expectedAmount`
 *  4. Memo matches (if provided)
 *
 * @param {string} txHash          - Transaction hash to verify
 * @param {string} expectedAmount  - Minimum amount expected (e.g. "0.02")
 * @param {string} [destination]   - Destination address (defaults to AGENT_DESTINATION)
 * @param {string} [expectedMemo]  - Optional memo to match
 * @returns {Promise<{verified: boolean, error?: string, tx?: object}>}
 */
export async function verifyTransaction(txHash, expectedAmount, destination, expectedMemo) {
  const dest = destination || AGENT_DESTINATION;

  try {
    const server = new StellarSdk.Horizon.Server(HORIZON_TESTNET);

    // ── 1. Fetch transaction ──
    const tx = await server.transactions().transaction(txHash).call();

    // ── 2. Check memo if required ──
    if (expectedMemo && tx.memo !== expectedMemo) {
      return {
        verified: false,
        error: `Memo mismatch. Expected "${expectedMemo}", got "${tx.memo || 'none'}"`,
      };
    }

    // ── 3. Fetch operations and find matching payment ──
    const ops = await server.operations().forTransaction(txHash).call();

    // Accept both 'payment' and 'create_account' (friendbot-style) ops
    const paymentOp = ops.records.find((op) => {
      if (op.type === 'payment') {
        return op.to === dest && parseFloat(op.amount) >= parseFloat(expectedAmount);
      }
      if (op.type === 'create_account') {
        return op.account === dest && parseFloat(op.starting_balance) >= parseFloat(expectedAmount);
      }
      return false;
    });

    if (!paymentOp) {
      return {
        verified: false,
        error: `No payment of >= ${expectedAmount} to ${dest} found in transaction`,
      };
    }

    // ── 4. Build verified tx object ──
    const amount = paymentOp.amount || paymentOp.starting_balance;
    const asset =
      paymentOp.asset_type === 'native' || paymentOp.type === 'create_account'
        ? 'XLM'
        : paymentOp.asset_code || 'unknown';

    return {
      verified: true,
      tx: {
        hash: tx.hash,
        from: tx.source_account,
        to: dest,
        amount,
        asset,
        memo: tx.memo || null,
        ledger: tx.ledger_attr,
        created_at: tx.created_at,
      },
    };
  } catch (err) {
    if (err?.response?.status === 404 || err?.message?.includes('404')) {
      return {
        verified: false,
        error: `Transaction ${txHash} not found on Stellar testnet. It may still be processing — wait a few seconds and retry.`,
      };
    }

    return {
      verified: false,
      error: `Verification failed: ${err.message || String(err)}`,
    };
  }
}

export { AGENT_DESTINATION, HORIZON_TESTNET };
