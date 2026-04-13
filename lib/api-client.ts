/**
 * API Client for the Cashflow Survival Agent
 *
 * Two modes:
 *  1. AUTOMATED x402 — calls /api/x402-predict (server-side signing, secure)
 *  2. MANUAL — calls backend directly for 402 → user pastes tx hash
 *
 * SECURITY (OWASP):
 *  - A1: All inputs validated before sending
 *  - A3: No secrets in browser — signing happens server-side
 *  - A8: Response validation before rendering
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000'

// ══════════════════════════════════════════════════
// Types
// ══════════════════════════════════════════════════

export interface X402PaymentRequired {
  x402Version: number
  error?: string
  resource?: {
    url: string
    description?: string
    mimeType?: string
  }
  accepts: Array<{
    scheme: string
    network: string
    amount: string
    asset: string
    payTo: string
    maxTimeoutSeconds?: number
    extra?: Record<string, unknown>
  }>
}

export interface PredictionData {
  prediction: string
  confidence: number
  forecastedIncome: number
  timeframe: string
  generatedAt: string
  breakdown: Record<string, number>
  riskFactors: string[]
}

export interface PaidAPIResponse {
  data: PredictionData
  paymentResponse: string | null
}

export interface HealthResponse {
  status: string
  service: string
  protocol: string
  network: string
  payTo: string
  timestamp: string
}

// ── x402 automated flow response ──
export interface X402FlowStep {
  status: number | string
  durationMs: number
}

export interface X402AutomatedResponse {
  phase: 'success' | 'error'
  steps: {
    request: X402FlowStep | null
    signing?: X402FlowStep | null
    settlement?: X402FlowStep | null
  }
  paymentRequired?: X402PaymentRequired | null
  paymentRequiredRaw?: string | null
  data?: PredictionData
  paymentResponse?: string | null
  totalMs?: number
  error?: string
  detail?: string
}

// ══════════════════════════════════════════════════
// AUTOMATED x402 flow (recommended — server-side signing)
// ══════════════════════════════════════════════════

/**
 * Full automated x402 flow via server-side proxy.
 * Private keys never leave the server.
 *
 * POST /api/x402-predict → server handles:
 *   1. Call backend → 402
 *   2. Sign Soroban auth (Ed25519)
 *   3. Retry with payment → data
 */
export async function executeX402Flow(): Promise<X402AutomatedResponse> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 30_000) // 30s timeout

  try {
    const res = await fetch('/api/x402-predict', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    })

    const data: X402AutomatedResponse = await res.json()

    // OWASP A8: Validate response structure
    if (!data.phase || !data.steps) {
      throw new Error('Invalid response from x402 proxy')
    }

    return data
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      return {
        phase: 'error',
        error: 'Request timed out after 30 seconds',
        steps: { request: null },
      }
    }
    throw err
  } finally {
    clearTimeout(timeout)
  }
}

// ══════════════════════════════════════════════════
// MANUAL flow (fallback — direct backend calls)
// ══════════════════════════════════════════════════

function decodePaymentHeader(raw: string): X402PaymentRequired | undefined {
  try {
    return JSON.parse(raw)
  } catch {
    try {
      return JSON.parse(atob(raw))
    } catch {
      return undefined
    }
  }
}

/**
 * Step 1: Call /predict-revenue without payment → expect 402
 */
export async function requestPrediction(): Promise<{
  status: number
  paymentRequired?: X402PaymentRequired
  rawHeader?: string
  data?: PaidAPIResponse
}> {
  const res = await fetch(`${BACKEND_URL}/predict-revenue`)

  if (res.status === 402) {
    const paymentHeader = res.headers.get('PAYMENT-REQUIRED')
    let paymentRequired: X402PaymentRequired | undefined

    if (paymentHeader) {
      paymentRequired = decodePaymentHeader(paymentHeader)
    }

    if (!paymentRequired) {
      try {
        const body = await res.json()
        paymentRequired = body
      } catch { /* ignore */ }
    }

    return { status: 402, paymentRequired, rawHeader: paymentHeader || undefined }
  }

  const data = await res.json()
  const paymentResponse = res.headers.get('PAYMENT-RESPONSE')
  return { status: 200, data: { data, paymentResponse } }
}

/**
 * Step 2: Retry with x402 PAYMENT-SIGNATURE header
 */
export async function retryWithPaymentSignature(paymentSignature: string): Promise<{
  status: number
  data?: PaidAPIResponse
  error?: string
}> {
  // OWASP A1: Validate input
  if (!paymentSignature || typeof paymentSignature !== 'string') {
    return { status: 400, error: 'Invalid payment signature' }
  }

  const res = await fetch(`${BACKEND_URL}/predict-revenue`, {
    headers: { 'PAYMENT-SIGNATURE': paymentSignature },
  })

  if (!res.ok) {
    const body = await res.text()
    return { status: res.status, error: body || 'Payment verification failed' }
  }

  const data = await res.json()
  const paymentResponse = res.headers.get('PAYMENT-RESPONSE')
  return { status: 200, data: { data, paymentResponse } }
}

/**
 * Legacy: Retry with tx_hash (manual verification)
 */
export async function retryWithPayment(txHash: string): Promise<{
  status: number
  data?: PaidAPIResponse
  error?: string
}> {
  // OWASP A1: Validate tx hash format
  if (!txHash || typeof txHash !== 'string' || txHash.length < 10) {
    return { status: 400, error: 'Invalid transaction hash format' }
  }

  // Sanitize: only allow hex characters (OWASP A1: Injection prevention)
  const sanitized = txHash.replace(/[^a-fA-F0-9]/g, '')
  if (sanitized.length !== txHash.length) {
    return { status: 400, error: 'Transaction hash contains invalid characters' }
  }

  const res = await fetch(`${BACKEND_URL}/predict-revenue`, {
    headers: { 'X-Payment-Tx': sanitized },
  })

  if (res.status === 402) {
    let errorMsg = 'Payment verification failed'
    try {
      const body = await res.json()
      errorMsg = body.detail || body.error || errorMsg
    } catch { /* ignore */ }
    return { status: 402, error: errorMsg }
  }

  if (!res.ok) {
    return { status: res.status, error: 'Request failed' }
  }

  const data = await res.json()
  const paymentResponse = res.headers.get('PAYMENT-RESPONSE')
  return { status: 200, data: { data, paymentResponse } }
}

// ══════════════════════════════════════════════════
// Health check
// ══════════════════════════════════════════════════

export async function checkBackendHealth(): Promise<HealthResponse | null> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)

    const res = await fetch(`${BACKEND_URL}/health`, { signal: controller.signal })
    clearTimeout(timeout)

    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}
