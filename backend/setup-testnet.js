/**
 * Stellar Testnet Setup Script
 * Funds both wallets via Friendbot and adds USDC trustlines
 *
 * Usage: node setup-testnet.js
 */

import 'dotenv/config';
import * as StellarSdk from '@stellar/stellar-sdk';

const HORIZON_TESTNET = 'https://horizon-testnet.stellar.org';
const NETWORK_PASSPHRASE = StellarSdk.Networks.TESTNET;
const FRIENDBOT_URL = 'https://friendbot.stellar.org';

// USDC asset on Stellar testnet (issued by testnet anchor)
const USDC_ISSUER = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';
const USDC_ASSET = new StellarSdk.Asset('USDC', USDC_ISSUER);

const PAY_TO_ADDRESS = process.env.PAY_TO_ADDRESS;
const PAY_TO_SECRET = process.env.PAY_TO_SECRET;
const CLIENT_SECRET = process.env.STELLAR_PRIVATE_KEY;

if (!PAY_TO_ADDRESS) {
  console.error('❌ Missing PAY_TO_ADDRESS in .env');
  process.exit(1);
}

if (!CLIENT_SECRET) {
  console.error('❌ Missing STELLAR_PRIVATE_KEY in .env');
  process.exit(1);
}

const clientKeypair = StellarSdk.Keypair.fromSecret(CLIENT_SECRET);
const clientPublic = clientKeypair.publicKey();

console.log('\n🔧 Stellar Testnet Setup');
console.log('========================');
console.log(`Server wallet (PAY_TO): ${PAY_TO_ADDRESS}`);
console.log(`Client wallet:          ${clientPublic}`);
console.log('');

const server = new StellarSdk.Horizon.Server(HORIZON_TESTNET);

// ── Step 1: Fund accounts via Friendbot ──
async function fundAccount(publicKey, label) {
  console.log(`💰 Funding ${label}...`);
  try {
    const res = await fetch(`${FRIENDBOT_URL}/?addr=${publicKey}`);
    const data = await res.json();
    if (data.hash || data.successful) {
      console.log(`   ✅ ${label} funded with 10,000 XLM`);
      return true;
    } else if (data.status === 400 || data.detail?.includes('createAccountAlreadyExist')) {
      console.log(`   ℹ️  ${label} already funded`);
      return true;
    } else {
      console.log(`   ⚠️  Unexpected response:`, JSON.stringify(data).substring(0, 200));
      return false;
    }
  } catch (err) {
    console.error(`   ❌ Failed to fund ${label}: ${err.message}`);
    return false;
  }
}

// ── Step 2: Add USDC trustline ──
async function addUSDCTrustline(secretKey, label) {
  console.log(`🔗 Adding USDC trustline for ${label}...`);
  try {
    const keypair = StellarSdk.Keypair.fromSecret(secretKey);
    const account = await server.loadAccount(keypair.publicKey());

    // Check if trustline already exists
    const hasTrustline = account.balances.some(
      (b) => b.asset_code === 'USDC' && b.asset_issuer === USDC_ISSUER
    );

    if (hasTrustline) {
      console.log(`   ℹ️  ${label} already has USDC trustline`);
      return true;
    }

    const tx = new StellarSdk.TransactionBuilder(account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(
        StellarSdk.Operation.changeTrust({
          asset: USDC_ASSET,
        })
      )
      .setTimeout(30)
      .build();

    tx.sign(keypair);
    const result = await server.submitTransaction(tx);
    console.log(`   ✅ USDC trustline added for ${label} (tx: ${result.hash.substring(0, 12)}...)`);
    return true;
  } catch (err) {
    console.error(`   ❌ Failed to add trustline for ${label}: ${err.message}`);
    if (err.response?.data?.extras?.result_codes) {
      console.error(`      Result codes:`, err.response.data.extras.result_codes);
    }
    return false;
  }
}

// ── Step 3: Check balances ──
async function checkBalance(publicKey, label) {
  try {
    const account = await server.loadAccount(publicKey);
    console.log(`\n📊 ${label} balances:`);
    for (const balance of account.balances) {
      if (balance.asset_type === 'native') {
        console.log(`   XLM:  ${parseFloat(balance.balance).toFixed(2)}`);
      } else if (balance.asset_code === 'USDC') {
        console.log(`   USDC: ${parseFloat(balance.balance).toFixed(2)}`);
      }
    }
  } catch (err) {
    console.error(`   ❌ Could not load ${label}: ${err.message}`);
  }
}

// ── Run setup ──
async function main() {
  // Fund both accounts
  console.log('\n── Step 1: Fund accounts with Friendbot ──');
  await fundAccount(PAY_TO_ADDRESS, 'Server wallet');
  await fundAccount(clientPublic, 'Client wallet');

  // Wait a moment for ledger
  console.log('\n⏳ Waiting for ledger...');
  await new Promise((r) => setTimeout(r, 3000));

  // Add USDC trustlines to both wallets
  console.log('\n── Step 2: Add USDC trustlines ──');
  if (PAY_TO_SECRET) {
    await addUSDCTrustline(PAY_TO_SECRET, 'Server wallet');
  } else {
    console.log('   ⚠️  PAY_TO_SECRET not set — skipping server wallet trustline');
    console.log('   Add PAY_TO_SECRET to .env to enable automatic trustline setup');
  }
  await addUSDCTrustline(CLIENT_SECRET, 'Client wallet');

  // Check balances
  console.log('\n── Step 3: Verify balances ──');
  await checkBalance(PAY_TO_ADDRESS, 'Server wallet');
  await checkBalance(clientPublic, 'Client wallet');

  console.log('\n✅ Setup complete!');
  console.log('\nNext steps:');
  console.log('  1. Start the backend:  node server.js');
  console.log('  2. Test the agent:     node client.js');
  console.log('  3. Start the frontend: cd .. && npm run dev');
  console.log('');
}

main().catch((err) => {
  console.error('Setup failed:', err);
  process.exit(1);
});
