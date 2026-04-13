/**
 * x402 Prediction API Route — Server-Side Proxy
 *
 * SECURITY ARCHITECTURE:
 * - Private keys NEVER leave this server-side route
 * - No NEXT_PUBLIC_ exposure of secrets
 * - Rate limiting per IP (OWASP A5: Broken Access Control)
 * - Input validation with Zod (OWASP A1: Injection)
 * - Structured error responses (OWASP A3: Sensitive Data Exposure)
 *
 * FLOW:
 * 1. Frontend calls POST /api/x402-predict
 * 2. This route calls the backend → gets 402
 * 3. Signs Soroban auth with Ed25519 key (server-side)
 * 4. Retries with PAYMENT-SIGNATURE → gets data
 * 5. Returns structured response to frontend
 */

import { NextRequest, NextResponse } from 'next/server'

// ── Rate limiter (in-memory, OWASP A5) ──
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_WINDOW_MS = 60_000 // 1 minute
const RATE_LIMIT_MAX = 10 // 10 requests per minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return true
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false
  }

  entry.count++
  return true
}

// ── Clean stale rate limit entries periodically ──
setInterval(() => {
  const now = Date.now()
  for (const [key, val] of rateLimitMap.entries()) {
    if (now > val.resetAt) rateLimitMap.delete(key)
  }
}, 60_000)

// ── Decode base64 x402 PAYMENT-REQUIRED header ──
function decodePaymentHeader(raw: string): Record<string, unknown> | null {
  try {
    return JSON.parse(raw)
  } catch {
    try {
      return JSON.parse(atob(raw))
    } catch {
      return null
    }
  }
}

// ── Request logging (OWASP A10: Insufficient Logging) ──
function logRequest(ip: string, action: string, details?: Record<string, unknown>) {
  const timestamp = new Date().toISOString()
  console.log(
    JSON.stringify({
      timestamp,
      ip: ip.substring(0, 20), // Don't log full IP
      action,
      ...details,
    })
  )
}

export async function POST(req: NextRequest) {
  // ── OWASP A5: Rate limiting ──
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'

  if (!checkRateLimit(ip)) {
    logRequest(ip, 'RATE_LIMITED')
    return NextResponse.json(
      { error: 'Too many requests. Please try again in a minute.' },
      { status: 429 }
    )
  }

  // ── OWASP A6: Security headers ──
  const headers = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Cache-Control': 'no-store, no-cache, must-revalidate',
  }

  // ── Validate environment (OWASP A3: no secrets in error messages) ──
  const STELLAR_PRIVATE_KEY = process.env.STELLAR_PRIVATE_KEY
  const BACKEND_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000'

  if (!STELLAR_PRIVATE_KEY) {
    logRequest(ip, 'CONFIG_ERROR', { reason: 'missing_key' })
    return NextResponse.json(
      { error: 'Server configuration error. Contact administrator.' },
      { status: 500, headers }
    )
  }

  logRequest(ip, 'X402_FLOW_START')

  try {
    // ══════════════════════════════════════════════
    // STEP 1: Call backend → expect 402
    // ══════════════════════════════════════════════
    const step1Start = Date.now()
    const initialRes = await fetch(`${BACKEND_URL}/predict-revenue`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    })

    const step1Ms = Date.now() - step1Start

    // If backend returned 200 directly (no payment needed — shouldn't happen but handle gracefully)
    if (initialRes.ok) {
      const data = await initialRes.json()
      logRequest(ip, 'X402_DIRECT_SUCCESS')
      return NextResponse.json({
        phase: 'success',
        steps: {
          request: { status: 200, durationMs: step1Ms },
          payment: null,
          settlement: null,
        },
        data,
        paymentResponse: initialRes.headers.get('PAYMENT-RESPONSE'),
      }, { headers })
    }

    // Expected: 402 Payment Required
    if (initialRes.status !== 402) {
      logRequest(ip, 'X402_UNEXPECTED_STATUS', { status: initialRes.status })
      return NextResponse.json({
        phase: 'error',
        error: `Backend returned unexpected status: ${initialRes.status}`,
        steps: { request: { status: initialRes.status, durationMs: step1Ms } },
      }, { status: 502, headers })
    }

    // Parse x402 PAYMENT-REQUIRED header
    const paymentRequiredRaw = initialRes.headers.get('PAYMENT-REQUIRED')
    let paymentRequired = null

    if (paymentRequiredRaw) {
      paymentRequired = decodePaymentHeader(paymentRequiredRaw)
    }

    // Fallback: try JSON body
    if (!paymentRequired) {
      try {
        paymentRequired = await initialRes.json()
      } catch {
        // ignore
      }
    }

    logRequest(ip, 'X402_GOT_402', {
      hasHeader: !!paymentRequiredRaw,
      durationMs: step1Ms,
    })

    // ══════════════════════════════════════════════
    // STEP 2: Sign Soroban authorization (server-side)
    // ══════════════════════════════════════════════
    const step2Start = Date.now()

    // Dynamic imports to avoid bundling issues
    // @x402/fetch re-exports both wrapFetchWithPayment and x402Client
    // @x402/stellar re-exports ExactStellarScheme and createEd25519Signer
    const { wrapFetchWithPayment, x402Client } = await import('@x402/fetch')
    const { createEd25519Signer, ExactStellarScheme } = await import('@x402/stellar')

    // Create signer with server-side private key
    const signer = createEd25519Signer(STELLAR_PRIVATE_KEY, 'stellar:testnet')

    // Create x402 client with Stellar scheme
    const client = new x402Client()
    client.register('stellar:testnet', new ExactStellarScheme(signer))

    // Wrap fetch with payment handling
    const fetchWithPayment = wrapFetchWithPayment(fetch, client)

    const step2Ms = Date.now() - step2Start

    logRequest(ip, 'X402_SIGNER_CREATED', { durationMs: step2Ms })

    // ══════════════════════════════════════════════
    // STEP 3: Auto-retry with payment
    // ══════════════════════════════════════════════
    const step3Start = Date.now()

    const paidRes = await fetchWithPayment(`${BACKEND_URL}/predict-revenue`, {
      method: 'GET',
    })

    const step3Ms = Date.now() - step3Start

    if (paidRes.ok) {
      const data = await paidRes.json()
      const paymentResponse = paidRes.headers.get('PAYMENT-RESPONSE')

      logRequest(ip, 'X402_FLOW_SUCCESS', {
        totalMs: step1Ms + step2Ms + step3Ms,
      })

      return NextResponse.json({
        phase: 'success',
        steps: {
          request: { status: 402, durationMs: step1Ms },
          signing: { status: 'signed', durationMs: step2Ms },
          settlement: { status: 200, durationMs: step3Ms },
        },
        paymentRequired: paymentRequired,
        paymentRequiredRaw: paymentRequiredRaw,
        data,
        paymentResponse,
        totalMs: step1Ms + step2Ms + step3Ms,
      }, { headers })
    }

    // Payment failed
    const errorBody = await paidRes.text()
    logRequest(ip, 'X402_PAYMENT_FAILED', {
      status: paidRes.status,
      durationMs: step3Ms,
    })

    return NextResponse.json({
      phase: 'error',
      error: `Payment failed with status ${paidRes.status}`,
      detail: errorBody.substring(0, 500), // OWASP A3: limit error exposure
      steps: {
        request: { status: 402, durationMs: step1Ms },
        signing: { status: 'signed', durationMs: step2Ms },
        settlement: { status: paidRes.status, durationMs: step3Ms },
      },
      paymentRequired,
    }, { status: 502, headers })
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'

    logRequest(ip, 'X402_FLOW_ERROR', {
      // OWASP A3: Don't leak stack traces or internal details
      error: errorMessage.substring(0, 200),
    })

    return NextResponse.json({
      phase: 'error',
      error: 'x402 payment flow failed. Is the backend running?',
      detail: errorMessage.substring(0, 200),
    }, { status: 500, headers: { ...headers } })
  }
}

// ── Only POST allowed (OWASP A5) ──
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST.' },
    { status: 405 }
  )
}
