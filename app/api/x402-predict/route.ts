/**
 * x402 Prediction API Route — Server-Side Proxy
 *
 * DEPLOYMENT MODES:
 *  1. LOCAL  — `BACKEND_URL=http://localhost:4000`, real Express backend
 *  2. VERCEL — No external backend; uses internal /api/predict-revenue + x402 signing
 *  3. DEMO   — No STELLAR_PRIVATE_KEY set; simulates the full x402 flow visually
 *
 * SECURITY ARCHITECTURE:
 *  - Private keys NEVER in browser (no NEXT_PUBLIC_ exposure)
 *  - Rate limiting per IP (OWASP A5)
 *  - Input validation / structured errors (OWASP A1, A3)
 */

import { NextRequest, NextResponse } from 'next/server'

// ── Rate limiter (in-memory, OWASP A5) ──
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX = 10

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return true
  }
  if (entry.count >= RATE_LIMIT_MAX) return false
  entry.count++
  return true
}

setInterval(() => {
  const now = Date.now()
  for (const [key, val] of rateLimitMap.entries()) {
    if (now > val.resetAt) rateLimitMap.delete(key)
  }
}, 60_000)

function decodePaymentHeader(raw: string): Record<string, unknown> | null {
  try { return JSON.parse(raw) } catch { /* continue */ }
  try { return JSON.parse(atob(raw)) } catch { /* continue */ }
  return null
}

function logRequest(ip: string, action: string, details?: Record<string, unknown>) {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    ip: ip.substring(0, 20),
    action,
    ...details,
  }))
}

// ── Demo prediction (used when no real key / backend available) ──
function demoPrediction() {
  const confidence = +(0.75 + Math.random() * 0.12).toFixed(2)
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
  }
}

// ── Demo payment-required payload ──
const DEMO_PAYMENT_REQUIRED = {
  x402Version: 1,
  error: 'Payment Required',
  accepts: [{
    scheme: 'exact',
    network: 'stellar:testnet',
    amount: '100000',
    asset: 'CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA',
    payTo: 'GBYRJOWPACAFBWEABT4YJDQI6RHWCAMHA6W6P5HT2U35A7QBUSKJWOOG',
    maxTimeoutSeconds: 300,
  }],
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'

  if (!checkRateLimit(ip)) {
    logRequest(ip, 'RATE_LIMITED')
    return NextResponse.json(
      { error: 'Too many requests. Please try again in a minute.' },
      { status: 429 }
    )
  }

  const secHeaders = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Cache-Control': 'no-store, no-cache, must-revalidate',
  }

  const STELLAR_PRIVATE_KEY = process.env.STELLAR_PRIVATE_KEY

  // ── Determine backend URL ──
  // On Vercel: use the internal Next.js API route (no external server needed)
  // Locally:   use BACKEND_URL (localhost:4000 Express server)
  let BACKEND_URL = process.env.BACKEND_URL || ''
  const IS_VERCEL = !!process.env.VERCEL || !!process.env.VERCEL_URL

  if (!BACKEND_URL || IS_VERCEL) {
    // Use the internal self-hosted backend route
    const origin = req.nextUrl.origin
    BACKEND_URL = origin
  }

  logRequest(ip, 'X402_FLOW_START', { mode: IS_VERCEL ? 'vercel' : 'local', hasKey: !!STELLAR_PRIVATE_KEY })

  // ══════════════════════════════════════════════════════════════
  // DEMO MODE — no private key configured (e.g. fresh Vercel deploy
  // without env vars). Simulate the full UI flow with realistic data.
  // ══════════════════════════════════════════════════════════════
  if (!STELLAR_PRIVATE_KEY) {
    logRequest(ip, 'X402_DEMO_MODE')
    const t0 = Date.now()

    // Simulate realistic latencies
    await new Promise(r => setTimeout(r, 200 + Math.random() * 300))
    const step1Ms = Date.now() - t0

    const t1 = Date.now()
    await new Promise(r => setTimeout(r, 100 + Math.random() * 200))
    const step2Ms = Date.now() - t1

    const t2 = Date.now()
    await new Promise(r => setTimeout(r, 300 + Math.random() * 400))
    const step3Ms = Date.now() - t2

    return NextResponse.json({
      phase: 'success',
      demo: true, // flag for UI to show demo badge
      steps: {
        request: { status: 402, durationMs: step1Ms },
        signing: { status: 'signed', durationMs: step2Ms },
        settlement: { status: 200, durationMs: step3Ms },
      },
      paymentRequired: DEMO_PAYMENT_REQUIRED,
      paymentRequiredRaw: JSON.stringify(DEMO_PAYMENT_REQUIRED),
      data: demoPrediction(),
      paymentResponse: JSON.stringify({
        success: true,
        txHash: `demo-${Date.now().toString(16)}`,
        network: 'stellar:testnet',
        settledAt: new Date().toISOString(),
      }),
      totalMs: step1Ms + step2Ms + step3Ms,
    }, { headers: secHeaders })
  }

  // ══════════════════════════════════════════════════════════════
  // REAL MODE — private key is available, run actual x402 flow
  // ══════════════════════════════════════════════════════════════
  try {
    // ── STEP 1: Initial request → expect 402 ──
    const step1Start = Date.now()
    const predictUrl = IS_VERCEL
      ? `${BACKEND_URL}/api/predict-revenue`
      : `${BACKEND_URL}/predict-revenue`

    const initialRes = await fetch(predictUrl, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    })
    const step1Ms = Date.now() - step1Start

    // If backend returned 200 directly (edge case)
    if (initialRes.ok) {
      const data = await initialRes.json()
      logRequest(ip, 'X402_DIRECT_SUCCESS')
      return NextResponse.json({
        phase: 'success',
        steps: {
          request: { status: 200, durationMs: step1Ms },
          signing: null,
          settlement: null,
        },
        paymentRequired: DEMO_PAYMENT_REQUIRED,
        data,
        paymentResponse: initialRes.headers.get('PAYMENT-RESPONSE'),
      }, { headers: secHeaders })
    }

    if (initialRes.status !== 402) {
      logRequest(ip, 'X402_UNEXPECTED_STATUS', { status: initialRes.status })
      // Still return a properly-shaped error so the frontend renders the error state
      return NextResponse.json({
        phase: 'error',
        error: `Backend returned unexpected status: ${initialRes.status}. Is it running?`,
        steps: { request: { status: initialRes.status, durationMs: step1Ms } },
      }, { status: 200, headers: secHeaders }) // return 200 so frontend can read JSON
    }

    // Parse PAYMENT-REQUIRED header
    const paymentRequiredRaw = initialRes.headers.get('PAYMENT-REQUIRED')
    let paymentRequired: Record<string, unknown> | null = null
    if (paymentRequiredRaw) {
      paymentRequired = decodePaymentHeader(paymentRequiredRaw)
    }
    if (!paymentRequired) {
      try { paymentRequired = await initialRes.json() } catch { /* ignore */ }
    }
    if (!paymentRequired) {
      paymentRequired = DEMO_PAYMENT_REQUIRED
    }

    logRequest(ip, 'X402_GOT_402', { hasHeader: !!paymentRequiredRaw, durationMs: step1Ms })

    // ── STEP 2: Sign Soroban auth ──
    const step2Start = Date.now()
    let fetchWithPayment: typeof fetch

    try {
      const { wrapFetchWithPayment, x402Client } = await import('@x402/fetch')
      const { createEd25519Signer, ExactStellarScheme } = await import('@x402/stellar')

      const signer = createEd25519Signer(STELLAR_PRIVATE_KEY, 'stellar:testnet')
      const client = new x402Client()
      client.register('stellar:testnet', new ExactStellarScheme(signer))
      fetchWithPayment = wrapFetchWithPayment(fetch, client)
    } catch (importErr) {
      // Signing packages failed (shouldn't happen after npm install, but guard anyway)
      logRequest(ip, 'X402_IMPORT_FAILED', {
        error: importErr instanceof Error ? importErr.message.substring(0, 100) : 'unknown',
      })
      // Fall back to demo mode result
      const step2Ms = Date.now() - step2Start
      return NextResponse.json({
        phase: 'success',
        demo: true,
        steps: {
          request: { status: 402, durationMs: step1Ms },
          signing: { status: 'signed', durationMs: step2Ms },
          settlement: { status: 200, durationMs: 0 },
        },
        paymentRequired,
        paymentRequiredRaw,
        data: demoPrediction(),
        paymentResponse: JSON.stringify({ success: true, demo: true }),
        totalMs: step1Ms + step2Ms,
      }, { headers: secHeaders })
    }

    const step2Ms = Date.now() - step2Start
    logRequest(ip, 'X402_SIGNER_CREATED', { durationMs: step2Ms })

    // ── STEP 3: Retry with payment ──
    const step3Start = Date.now()
    const paidRes = await fetchWithPayment(predictUrl, { method: 'GET' })
    const step3Ms = Date.now() - step3Start

    if (paidRes.ok) {
      const data = await paidRes.json()
      const paymentResponse = paidRes.headers.get('PAYMENT-RESPONSE')
      logRequest(ip, 'X402_FLOW_SUCCESS', { totalMs: step1Ms + step2Ms + step3Ms })

      return NextResponse.json({
        phase: 'success',
        steps: {
          request: { status: 402, durationMs: step1Ms },
          signing: { status: 'signed', durationMs: step2Ms },
          settlement: { status: 200, durationMs: step3Ms },
        },
        paymentRequired,
        paymentRequiredRaw,
        data,
        paymentResponse,
        totalMs: step1Ms + step2Ms + step3Ms,
      }, { headers: secHeaders })
    }

    const errorBody = await paidRes.text()
    logRequest(ip, 'X402_PAYMENT_FAILED', { status: paidRes.status, durationMs: step3Ms })

    return NextResponse.json({
      phase: 'error',
      error: `Payment failed with status ${paidRes.status}`,
      detail: errorBody.substring(0, 500),
      steps: {
        request: { status: 402, durationMs: step1Ms },
        signing: { status: 'signed', durationMs: step2Ms },
        settlement: { status: paidRes.status, durationMs: step3Ms },
      },
      paymentRequired,
    }, { status: 200, headers: secHeaders }) // 200 so frontend reads the error JSON

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    logRequest(ip, 'X402_FLOW_ERROR', { error: errorMessage.substring(0, 200) })

    return NextResponse.json({
      phase: 'error',
      error: 'x402 payment flow failed. Backend may be unreachable.',
      detail: errorMessage.substring(0, 200),
      steps: { request: null },
    }, { status: 200, headers: secHeaders })
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST.' },
    { status: 405 }
  )
}
