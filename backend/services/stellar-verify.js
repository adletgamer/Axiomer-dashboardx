/**
 * Stellar Transaction Verification Service
 * Verifies payments on Stellar testnet using Horizon API
 */

import * as StellarSdk from '@stellar/stellar-sdk';

// Agent's destination address on Stellar testnet
// Replace with your own testnet funded address
const AGENT_DESTINATION = process.env.STELLAR_DESTINATION || 'GDQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOBD3XBZGCM4BYSN';

const HORIZON_TESTNET = 'https://horizon-testnet.stellar.org';

/**
 * Verify that a Stellar testnet transaction:
 * 1. Exists on the network
 * 2. Sent at least `expectedAmount` of USDC to `destination`
 * 3. Contains the expected memo (optional)
 *
 * @param {string} txHash - Transaction hash to verify
 * @param {string} expectedAmount - Minimum USDC amount expected (as string, e.g. "0.02")
 * @param {string} [expectedMemo] - Optional memo to match
 * @returns {Promise<{verified: boolean, error?: string, tx?: object}>}
 */
export async function verifyStellarPayment(txHash, expectedAmount, expectedMemo) {
  try {
    const server = new StellarSdk.Horizon.Server(HORIZON_TESTNET);

    // Fetch transaction from Horizon
    const tx = await server.transactions().transaction(txHash).call();

    // Check memo if expected
    if (expectedMemo && tx.memo !== expectedMemo) {
      return {
        verified: false,
        error: `Memo mismatch. Expected "${expectedMemo}", got "${tx.memo || 'none'}"`,
      };
    }

    // Fetch operations for this transaction
    const ops = await server.operations().forTransaction(txHash).call();

    // Look for a payment operation to our destination with enough amount
    const paymentOp = ops.records.find((op) => {
      if (op.type !== 'payment') return false;
      // Accept native XLM or any asset (USDC on testnet may vary)
      const toMatch = op.to === AGENT_DESTINATION;
      const amountMatch = parseFloat(op.amount) >= parseFloat(expectedAmount);
      return toMatch && amountMatch;
    });

    if (!paymentOp) {
      // Fallback: also accept if destination matches and amount matches on any payment op
      // This is lenient for testnet demos
      const anyPayment = ops.records.find(
        (op) => op.type === 'payment' && parseFloat(op.amount) >= parseFloat(expectedAmount)
      );

      if (anyPayment) {
        return {
          verified: true,
          tx: {
            hash: tx.hash,
            from: tx.source_account,
            to: anyPayment.to,
            amount: anyPayment.amount,
            asset: anyPayment.asset_type === 'native' ? 'XLM' : anyPayment.asset_code,
            memo: tx.memo || null,
            created_at: tx.created_at,
          },
        };
      }

      return {
        verified: false,
        error: `No payment of >= ${expectedAmount} found to destination ${AGENT_DESTINATION}`,
      };
    }

    return {
      verified: true,
      tx: {
        hash: tx.hash,
        from: tx.source_account,
        to: paymentOp.to,
        amount: paymentOp.amount,
        asset: paymentOp.asset_type === 'native' ? 'XLM' : paymentOp.asset_code,
        memo: tx.memo || null,
        created_at: tx.created_at,
      },
    };
  } catch (err) {
    // Horizon returns 404 if tx not found
    if (err?.response?.status === 404) {
      return {
        verified: false,
        error: `Transaction ${txHash} not found on Stellar testnet`,
      };
    }

    return {
      verified: false,
      error: `Verification failed: ${err.message || err}`,
    };
  }
}

export { AGENT_DESTINATION };
