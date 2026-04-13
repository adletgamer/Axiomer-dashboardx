# Axiomer — Cashflow Survival Agent

> **AI agent that autonomously manages cashflow decisions using x402 micropayments on Stellar testnet.**

Built for the **Agents on Stellar** hackathon. Axiomer is an autonomous AI agent that analyzes a business's financial position, decides when it needs external intelligence (revenue forecasts, payment optimization), and pays for that intelligence using the x402 protocol on Stellar. Every API call is a real micropayment — no subscriptions, no API keys, just cryptographic proof of payment.

## What It Does

Axiomer solves a real problem: AI agents can reason and plan, but they can't pay for the tools and data they need. This agent can.

**The flow works like this:**
1. The agent analyzes cash balance vs. obligations and detects uncertainty
2. It decides whether buying a revenue prediction is worth the cost ($0.01 USDC)
3. It calls a paywall-protected API — receives HTTP 402 Payment Required
4. It signs a Soroban authorization entry using its Stellar keypair
5. The x402 facilitator settles the payment on-chain
6. The agent receives the data and updates its strategy

All of this happens autonomously. The agent decides *when* to spend, *how much* to spend, and *what data* to buy — based on its financial analysis.

## Architecture

```
Frontend (Next.js)          Backend (Express + x402)         Stellar Testnet
┌──────────────────┐       ┌─────────────────────────┐      ┌──────────────┐
│  Dashboard UI    │──────>│  GET /predict-revenue    │      │  USDC on     │
│  Decision Engine │       │  @x402/express middleware │      │  Soroban     │
│  Payment Flow    │       │                          │      │              │
│  Wallet Config   │       │  Returns 402 with        │      │  Facilitator │
│                  │<──────│  PAYMENT-REQUIRED header  │<────>│  settles     │
│  Agent signs     │       │                          │      │  on-chain    │
│  Soroban auth    │──────>│  Validates payment       │      │              │
│  & retries       │<──────│  Returns data + proof    │      └──────────────┘
└──────────────────┘       └─────────────────────────┘
```

**Client (backend/client.js)** — Standalone agent that uses `@x402/fetch` to auto-handle the entire 402 flow programmatically.

## Tech Stack

- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS, shadcn/ui, Recharts
- **Backend:** Express.js, `@x402/express` middleware, `@x402/stellar` ExactStellarScheme
- **Blockchain:** Stellar testnet, Soroban smart contracts, USDC stablecoin
- **Protocol:** x402 (HTTP 402 Payment Required standard)
- **Facilitator:** x402.org (Coinbase — handles settlement)
- **Wallet:** Freighter browser extension + Ed25519 keypair (programmatic agent)

## Getting Started

### Prerequisites
- Node.js 18+ 
- A Stellar testnet keypair ([generate here](https://laboratory.stellar.org/#account-creator?network=test))
- Fund both accounts with testnet XLM via [Friendbot](https://friendbot.stellar.org)
- Set up USDC trustline on both accounts

### Quick Start

```bash
# Clone and install
git clone <repo-url>
cd Axiomer-dashboardx

# Install everything
npm install
cd backend && npm install && cd ..

# Configure backend
cp backend/.env.example backend/.env
# Edit backend/.env with your Stellar keypairs

# Run both servers
chmod +x start.sh
./start.sh
```

Or run manually:

```bash
# Terminal 1: Backend (port 4000)
cd backend
node server.js

# Terminal 2: Frontend (port 3000)
npm run dev
```

### Environment Variables (backend/.env)

```env
# Stellar testnet destination wallet (API provider receives payments here)
PAY_TO_ADDRESS=GBYRJOWPACAFBWEABT4YJDQI6RHWCAMHA6W6P5HT2U35A7QBUSKJWOOG

# Server port
PORT=4000

# Stellar client private key (for client.js agent — S... format)
STELLAR_PRIVATE_KEY=S...your-secret-key...
```

### Testing the x402 Flow

**Option A: Programmatic agent (recommended)**
```bash
cd backend
STELLAR_PRIVATE_KEY=S... node client.js
```

This will:
1. Call `/predict-revenue`
2. Auto-detect the 402 response
3. Sign a Soroban authorization entry
4. Retry with payment — data unlocked

**Option B: Dashboard UI**
1. Open http://localhost:3000
2. Navigate to "Decisions" section
3. Click "Call API" in the x402 Payment Flow panel
4. See the real 402 response with payment requirements
5. Use the agent client or manually send payment and paste tx hash

**Option C: Health check**
```bash
curl http://localhost:4000/health
```

## Key Features

### Decision Engine
The AI agent doesn't just blindly call APIs. It calculates:
- **Criticality** — How urgent are the payments?
- **Uncertainty** — How unpredictable is the income?
- **Default risk** — What's the probability of not meeting obligations?

Only when uncertainty is high enough AND the budget allows does the agent decide to purchase a prediction. This is economically rational agent behavior.

### x402 Protocol Integration
Real implementation of the HTTP 402 standard:
- Server uses `@x402/express` `paymentMiddleware` to protect endpoints
- Payment requirements are sent in the `PAYMENT-REQUIRED` header (base64-encoded)
- Client signs Soroban authorization entries using `@x402/stellar`
- Facilitator at x402.org handles settlement
- Settlement proof returned in `PAYMENT-RESPONSE` header

### Stellar Testnet Interaction
- All payments settle on Stellar testnet as real transactions
- Uses USDC stablecoin for predictable pricing
- Soroban smart contract authorization for security
- Transaction hashes are verifiable on [Stellar Expert](https://stellar.expert/explorer/testnet)

## Project Structure

```
├── app/                    # Next.js App Router
│   └── page.tsx            # Main dashboard
├── components/             # React components
│   ├── paid-api-flow.tsx   # x402 payment flow UI
│   ├── agent-decision-flow.tsx  # Decision timeline
│   ├── dashboard-section.tsx
│   ├── scenario-section.tsx
│   └── ui/                 # shadcn/ui components
├── lib/                    # Business logic
│   ├── api-client.ts       # Frontend x402 client
│   ├── decision-engine.ts  # AI decision logic
│   └── stellar-pay.ts      # Wallet helpers
├── backend/                # Express server
│   ├── server.js           # x402 middleware server
│   ├── client.js           # Programmatic agent client
│   ├── routes/             # API routes
│   └── services/           # Stellar verification
└── start.sh                # One-command startup
```

## What's Real vs. Simulated

| Component | Status |
|-----------|--------|
| x402 protocol flow | **Real** — `@x402/express` + `@x402/stellar` |
| Stellar transactions | **Real** — testnet USDC payments |
| Soroban authorization | **Real** — Ed25519 signing |
| Facilitator settlement | **Real** — x402.org (Coinbase) |
| Revenue prediction model | **Simulated** — randomized data |
| Decision engine | **Real** — algorithmic decision logic |
| Freighter wallet integration | **Real** — browser extension API |

## Hackathon Notes

- **Submission:** Agents on Stellar hackathon (March-April 2026)
- **Track:** Open Innovation
- **Network:** Stellar testnet
- **Protocol:** x402 (HTTP 402 Payment Required)

The revenue prediction endpoint returns simulated data because this is a prototype. In production, this would connect to a real ML model. The important part is that the *payment flow* is entirely real — every API call is a real Stellar testnet transaction.

## License

MIT
