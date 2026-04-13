/**
 * x402 Client — Programmatic agent that pays for API access
 * Uses @x402/fetch to auto-handle 402 responses with Stellar payments
 *
 * Usage:
 *   STELLAR_PRIVATE_KEY=S... node client.js
 */

import 'dotenv/config';
import { wrapFetchWithPayment } from '@x402/fetch';
import { x402Client } from '@x402/core/client';
import { createEd25519Signer } from '@x402/stellar';
import { ExactStellarScheme } from '@x402/stellar/exact/client';

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:4000';
const STELLAR_KEY = process.env.STELLAR_PRIVATE_KEY;

if (!STELLAR_KEY) {
  console.error('❌ Missing STELLAR_PRIVATE_KEY in .env');
  console.error('   Generate a testnet keypair at: https://lab.stellar.org/#account-creator?network=test');
  console.error('   Fund it with friendbot, then add the secret key (S...) to backend/.env');
  process.exit(1);
}

async function main() {
  console.log('\n🤖 Cashflow Survival Agent — x402 Client');
  console.log(`   Server: ${SERVER_URL}`);
  console.log(`   Network: stellar:testnet\n`);

  // ── 1. Create Stellar signer ──
  const stellarSigner = createEd25519Signer(STELLAR_KEY, 'stellar:testnet');
  console.log('✅ Stellar signer created');

  // ── 2. Create x402 client and register Stellar scheme ──
  const client = new x402Client();
  client.register('stellar:testnet', new ExactStellarScheme(stellarSigner));
  console.log('✅ x402 client configured with ExactStellarScheme');

  // ── 3. Wrap fetch with payment handling ──
  const fetchWithPayment = wrapFetchWithPayment(fetch, client);

  // ── 4. Make request — payment is handled automatically ──
  console.log('\n📡 Calling GET /predict-revenue...');
  console.log('   (x402 will auto-detect 402, sign Soroban auth, and retry)\n');

  try {
    const response = await fetchWithPayment(`${SERVER_URL}/predict-revenue`, {
      method: 'GET',
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ API unlocked! Response:');
      console.log(JSON.stringify(data, null, 2));

      // Check payment settlement header
      const paymentResponse = response.headers.get('PAYMENT-RESPONSE');
      if (paymentResponse) {
        console.log('\n💰 Payment settled on-chain:');
        try {
          console.log(JSON.stringify(JSON.parse(paymentResponse), null, 2));
        } catch {
          console.log(paymentResponse);
        }
      }
    } else {
      const body = await response.text();
      console.error(`❌ Request failed with status ${response.status}`);
      console.error(body);
    }
  } catch (err) {
    console.error('❌ Error:', err.message || err);
  }
}

main();
