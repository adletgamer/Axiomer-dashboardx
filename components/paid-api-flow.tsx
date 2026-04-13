'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  AlertCircle, Loader2, Zap, DollarSign, CheckCircle2, XCircle,
  Wifi, WifiOff, Copy, Check, Shield, RefreshCw, Lock, Fingerprint,
  ArrowDown, Globe, ShieldCheck
} from 'lucide-react'
import {
  executeX402Flow,
  checkBackendHealth,
} from '@/lib/api-client'
import type {
  X402PaymentRequired,
  X402AutomatedResponse,
  HealthResponse,
} from '@/lib/api-client'
import { shortenAddress } from '@/lib/stellar-pay'

// ══════════════════════════════════════════════════
// Flow phases — matches the 4 visual states
// ══════════════════════════════════════════════════
type FlowPhase =
  | 'idle'           // Waiting for user click
  | 'requesting'     // Step 1: Calling API...
  | 'got402'         // Step 2: Received 402 Payment Required
  | 'signing'        // Step 3: Signing Soroban Authorization
  | 'settling'       // Step 3b: Payment settling on-chain
  | 'success'        // Step 4: Data unlocked
  | 'error'          // Error state

const STEP_LABELS: Record<FlowPhase, string> = {
  idle: 'Ready to start',
  requesting: 'Requesting Data...',
  got402: '402 — Payment Required',
  signing: 'Signing Soroban Authorization...',
  settling: 'Payment settling on Stellar...',
  success: 'Data Unlocked',
  error: 'Error',
}

function phaseToStep(p: FlowPhase): number {
  switch (p) {
    case 'idle': return 0
    case 'requesting': return 1
    case 'got402': return 2
    case 'signing': return 3
    case 'settling': return 3
    case 'success': return 4
    case 'error': return -1
  }
}

// Format x402v2 amount (base units) to human-readable price
function formatAmount(amount: string, asset: string): string {
  const USDC_CONTRACT = 'CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA'
  if (asset === USDC_CONTRACT) {
    const val = Number(amount) / 1e7
    return `$${val.toFixed(val < 0.01 ? 4 : 2)} USDC`
  }
  return `${amount} (${shortenAddress(asset)})`
}

export function PaidAPIFlow() {
  const [phase, setPhase] = useState<FlowPhase>('idle')
  const [paymentInfo, setPaymentInfo] = useState<X402PaymentRequired | null>(null)
  const [rawHeader, setRawHeader] = useState<string | undefined>()
  const [flowResponse, setFlowResponse] = useState<X402AutomatedResponse | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [healthInfo, setHealthInfo] = useState<HealthResponse | null>(null)
  const [elapsedMs, setElapsedMs] = useState(0)
  const [copied, setCopied] = useState(false)
  const [stepTimings, setStepTimings] = useState<Record<string, number>>({})

  const backendOnline = healthInfo !== null ? true : null

  // Auto-check backend on mount
  useEffect(() => {
    checkBackendHealth().then(setHealthInfo)
  }, [])

  const accept = paymentInfo?.accepts?.[0] ?? null

  // ══════════════════════════════════════════════════
  // AUTOMATED x402 flow — one click does everything
  // ══════════════════════════════════════════════════
  const handleAutomatedFlow = useCallback(async () => {
    setPhase('requesting')
    setErrorMsg('')
    setFlowResponse(null)
    setPaymentInfo(null)
    setRawHeader(undefined)
    setStepTimings({})
    const start = Date.now()

    try {
      // Step 1: Request → expect 402 (visual pause for demo)
      await new Promise(r => setTimeout(r, 600))

      // Step 2: Show 402 received
      setPhase('got402')
      await new Promise(r => setTimeout(r, 1200))

      // Step 3: Signing Soroban authorization
      setPhase('signing')
      await new Promise(r => setTimeout(r, 800))

      // Step 3b: Settling payment
      setPhase('settling')

      // Actually execute the full x402 flow server-side
      const result = await executeX402Flow()
      const totalMs = Date.now() - start
      setElapsedMs(totalMs)

      if (result.phase === 'success' && result.data) {
        // Extract payment info for display
        if (result.paymentRequired) {
          setPaymentInfo(result.paymentRequired as X402PaymentRequired)
        }
        if (result.paymentRequiredRaw) {
          setRawHeader(result.paymentRequiredRaw)
        }

        // Store step timings
        const timings: Record<string, number> = {}
        if (result.steps?.request) timings.request = result.steps.request.durationMs
        if (result.steps?.signing) timings.signing = (result.steps.signing as { durationMs: number }).durationMs
        if (result.steps?.settlement) timings.settlement = result.steps.settlement.durationMs
        setStepTimings(timings)

        setFlowResponse(result)
        setPhase('success')
      } else {
        setErrorMsg(result.error || result.detail || 'x402 flow failed')
        if (result.paymentRequired) {
          setPaymentInfo(result.paymentRequired as X402PaymentRequired)
        }
        setFlowResponse(result)
        setPhase('error')
      }
    } catch (err) {
      setElapsedMs(Date.now() - start)
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Failed to reach backend. Is it running on port 4000?'
      )
      setPhase('error')
    }
  }, [])

  const handleReset = () => {
    setPhase('idle')
    setPaymentInfo(null)
    setRawHeader(undefined)
    setFlowResponse(null)
    setErrorMsg('')
    setElapsedMs(0)
    setStepTimings({})
  }

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const currentStep = phaseToStep(phase)

  const steps = [
    { label: 'Request', num: 1, icon: Globe },
    { label: '402', num: 2, icon: AlertCircle },
    { label: 'Sign & Pay', num: 3, icon: Fingerprint },
    { label: 'Unlock', num: 4, icon: CheckCircle2 },
  ]

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">x402 Payment Flow</h2>
              <p className="text-sm text-muted-foreground">
                Real x402 protocol &middot; Soroban auth &middot; Stellar testnet
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Badge variant="outline" className="text-xs bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border-green-300">
            <ShieldCheck className="w-3 h-3 mr-1" />
            Server-side signing
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => checkBackendHealth().then(setHealthInfo)}
            className="h-8"
          >
            {backendOnline === null ? (
              <Wifi className="w-3.5 h-3.5 mr-1" />
            ) : backendOnline ? (
              <Wifi className="w-3.5 h-3.5 mr-1 text-green-500" />
            ) : (
              <WifiOff className="w-3.5 h-3.5 mr-1 text-red-500" />
            )}
            <span className="text-xs">{backendOnline === null ? 'Check' : backendOnline ? 'Online' : 'Offline'}</span>
          </Button>
        </div>
      </div>

      {/* ── Protocol Info ── */}
      {healthInfo && (
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="text-[10px] bg-violet-50 dark:bg-violet-950/20 text-violet-700 dark:text-violet-400 border-violet-300">
            Protocol: {healthInfo.protocol}
          </Badge>
          <Badge variant="outline" className="text-[10px] bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 border-blue-300">
            Network: {healthInfo.network}
          </Badge>
          <Badge variant="outline" className="text-[10px] bg-slate-50 dark:bg-slate-950/20 text-slate-700 dark:text-slate-400 border-slate-300">
            PayTo: {shortenAddress(healthInfo.payTo)}
          </Badge>
          <Badge variant="outline" className="text-[10px] bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-amber-300">
            OWASP Hardened
          </Badge>
        </div>
      )}

      {/* ── Step Progress Bar ── */}
      <div className="flex items-center gap-1">
        {steps.map((s, i) => {
          const StepIcon = s.icon
          return (
            <div key={s.num} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1 min-w-[60px]">
                <div className={`
                  w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300
                  ${currentStep > i
                    ? 'bg-green-500 text-white shadow-md shadow-green-500/30'
                    : currentStep === i && phase !== 'idle' && phase !== 'error'
                      ? 'bg-blue-500 text-white shadow-md shadow-blue-500/30 animate-pulse'
                      : 'bg-muted text-muted-foreground'
                  }
                `}>
                  {currentStep > i
                    ? <Check className="w-4 h-4" />
                    : <StepIcon className="w-4 h-4" />
                  }
                </div>
                <span className={`text-[10px] font-medium ${
                  currentStep >= i ? 'text-foreground' : 'text-muted-foreground'
                }`}>{s.label}</span>
              </div>
              {i < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 mb-5 rounded transition-all duration-500 ${
                  currentStep > i ? 'bg-green-500' : 'bg-muted'
                }`} />
              )}
            </div>
          )
        })}
      </div>

      {/* ── Phase Badge ── */}
      <Badge variant="outline" className={`text-sm px-4 py-1.5 font-medium transition-all duration-300 ${
        phase === 'success' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-300 dark:border-green-700' :
        phase === 'error' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-300 dark:border-red-700' :
        phase === 'got402' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700' :
        phase === 'signing' ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 border-violet-300 dark:border-violet-700' :
        phase === 'settling' || phase === 'requesting'
          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-700'
          : 'bg-muted text-muted-foreground'
      }`}>
        {(phase === 'requesting' || phase === 'settling' || phase === 'signing') && (
          <Loader2 className="w-3.5 h-3.5 animate-spin mr-2 inline" />
        )}
        {phase === 'signing' && <Lock className="w-3.5 h-3.5 mr-1 inline" />}
        {STEP_LABELS[phase]}
      </Badge>

      {/* ══════════════ STEP 1: Call API ══════════════ */}
      <Card className={`p-5 border-2 rounded-xl transition-all duration-300 ${
        phase === 'idle' ? 'border-border hover:border-accent/60 hover:shadow-md' :
        phase === 'requesting' ? 'border-blue-400 bg-blue-50/50 dark:bg-blue-950/20 shadow-md shadow-blue-500/10' :
        currentStep >= 1 ? 'border-green-400/50 bg-green-50/30 dark:bg-green-950/10' : 'border-border'
      }`}>
        <div className="flex gap-4 items-start">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
            currentStep >= 1 ? 'bg-green-500 shadow-md' : 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-md'
          }`}>
            {currentStep >= 1 ? <Check className="w-5 h-5 text-white" /> : <Zap className="w-5 h-5 text-white" />}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground mb-1">Step 1: Request Prediction API</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Calls <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">GET /predict-revenue</code> — protected by x402 middleware
            </p>
            <div className="flex gap-2">
              <Button
                onClick={handleAutomatedFlow}
                disabled={phase !== 'idle' && phase !== 'success' && phase !== 'error'}
                size="sm"
                className="bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 text-white shadow-sm"
              >
                {phase === 'requesting' ? (
                  <><Loader2 className="w-4 h-4 animate-spin mr-1.5" /> Calling...</>
                ) : (
                  <><Zap className="w-4 h-4 mr-1.5" /> Pay &amp; Unlock (x402)</>
                )}
              </Button>
            </div>
            {stepTimings.request !== undefined && (
              <p className="text-[10px] text-muted-foreground mt-2">
                Request latency: {stepTimings.request}ms
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* ══════════════ STEP 2: 402 Response ══════════════ */}
      {currentStep >= 2 && (
        <Card className={`p-5 border-2 rounded-xl transition-all duration-300 ${
          phase === 'got402'
            ? 'border-amber-400 bg-amber-50/50 dark:bg-amber-950/20 shadow-md shadow-amber-500/10 animate-in fade-in slide-in-from-top-2'
            : 'border-amber-400/50 bg-amber-50/30 dark:bg-amber-950/10'
        }`}>
          <div className="flex gap-4 items-start">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
              currentStep > 2 ? 'bg-green-500 shadow-md' : 'bg-gradient-to-br from-amber-500 to-orange-600 shadow-md'
            }`}>
              {currentStep > 2 ? <Check className="w-5 h-5 text-white" /> : <AlertCircle className="w-5 h-5 text-white" />}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="font-semibold text-foreground">Step 2: 402 Payment Required</h3>
                <Badge className="bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 text-[10px] font-bold px-2 py-0.5">
                  402
                </Badge>
                <Badge className="bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 text-[10px] font-bold px-2 py-0.5">
                  x402 PROTOCOL
                </Badge>
              </div>

              {/* x402 PAYMENT-REQUIRED header display */}
              <div className="bg-slate-900 dark:bg-black rounded-lg p-4 font-mono text-xs space-y-1 mb-3 text-slate-300 border border-slate-700/50">
                <p className="text-red-400 font-semibold">HTTP/1.1 402 Payment Required</p>
                <p className="text-slate-500 mt-1">PAYMENT-REQUIRED:</p>
                {accept ? (
                  <div className="ml-2 space-y-1">
                    <p><span className="text-slate-500">scheme:</span> <span className="text-violet-400">{accept.scheme}</span></p>
                    <p><span className="text-slate-500">amount:</span> <span className="text-amber-400">{formatAmount(accept.amount, accept.asset)}</span></p>
                    <p><span className="text-slate-500">asset:</span> <span className="text-pink-400">{shortenAddress(accept.asset)}</span></p>
                    <p><span className="text-slate-500">network:</span> <span className="text-green-400">{accept.network}</span></p>
                    <p>
                      <span className="text-slate-500">payTo:</span>{' '}
                      <span className="text-cyan-400">{shortenAddress(accept.payTo)}</span>
                      <button
                        onClick={() => copyToClipboard(accept.payTo)}
                        className="ml-2 text-slate-500 hover:text-slate-300 transition-colors inline-flex"
                      >
                        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </p>
                  </div>
                ) : (
                  <div className="ml-2">
                    <p><span className="text-slate-500">scheme:</span> <span className="text-violet-400">exact</span></p>
                    <p><span className="text-slate-500">price:</span> <span className="text-amber-400">$0.01 USDC</span></p>
                    <p><span className="text-slate-500">network:</span> <span className="text-green-400">stellar:testnet</span></p>
                  </div>
                )}
              </div>

              {phase === 'got402' && (
                <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400">
                  <ArrowDown className="w-3.5 h-3.5 animate-bounce" />
                  <span>Proceeding to sign payment automatically...</span>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* ══════════════ STEP 3: Signing Soroban Authorization ══════════════ */}
      {currentStep >= 3 && (
        <Card className={`p-5 border-2 rounded-xl transition-all duration-300 ${
          phase === 'signing'
            ? 'border-violet-400 bg-violet-50/50 dark:bg-violet-950/20 shadow-lg shadow-violet-500/20 animate-in fade-in slide-in-from-top-2'
            : phase === 'settling'
              ? 'border-blue-400 bg-blue-50/50 dark:bg-blue-950/20 shadow-md shadow-blue-500/10'
              : currentStep > 3
                ? 'border-green-400/50 bg-green-50/30 dark:bg-green-950/10'
                : 'border-violet-400/50'
        }`}>
          <div className="flex gap-4 items-start">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
              currentStep > 3
                ? 'bg-green-500 shadow-md'
                : phase === 'signing'
                  ? 'bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg animate-pulse'
                  : 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md'
            }`}>
              {currentStep > 3
                ? <Check className="w-5 h-5 text-white" />
                : phase === 'signing'
                  ? <Fingerprint className="w-5 h-5 text-white" />
                  : <DollarSign className="w-5 h-5 text-white" />
              }
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <h3 className="font-semibold text-foreground mb-1">
                  {phase === 'signing' ? 'Step 3: Signing Soroban Authorization...' :
                   phase === 'settling' ? 'Step 3: Payment Settling...' :
                   'Step 3: Payment & Settlement'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {phase === 'signing'
                    ? 'Creating Ed25519 signature for Soroban authorization entry'
                    : phase === 'settling'
                      ? 'x402 facilitator is settling the payment on Stellar testnet'
                      : 'Soroban auth signed and payment settled on-chain'
                  }
                </p>
              </div>

              {/* Signing animation */}
              {phase === 'signing' && (
                <div className="bg-slate-900 dark:bg-black rounded-lg p-4 font-mono text-xs text-slate-300 border border-violet-700/50 space-y-1.5">
                  <p className="text-violet-400 font-semibold flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5" />
                    Soroban Authorization
                  </p>
                  <p className="text-slate-500">signer: <span className="text-green-400">Ed25519 (server-side)</span></p>
                  <p className="text-slate-500">network: <span className="text-cyan-400">stellar:testnet</span></p>
                  <p className="text-slate-500">scheme: <span className="text-violet-400">ExactStellarScheme</span></p>
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-700/50">
                    <Loader2 className="w-3 h-3 animate-spin text-violet-400" />
                    <span className="text-violet-300 text-[10px]">Generating authorization entry...</span>
                  </div>
                </div>
              )}

              {/* Settlement animation */}
              {phase === 'settling' && (
                <div className="bg-slate-900 dark:bg-black rounded-lg p-4 font-mono text-xs text-slate-300 border border-blue-700/50 space-y-1.5">
                  <p className="text-blue-400 font-semibold flex items-center gap-2">
                    <DollarSign className="w-3.5 h-3.5" />
                    On-Chain Settlement
                  </p>
                  <p className="text-slate-500">facilitator: <span className="text-cyan-400">x402.org</span></p>
                  <p className="text-slate-500">status: <span className="text-amber-400">settling...</span></p>
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-700/50">
                    <Loader2 className="w-3 h-3 animate-spin text-blue-400" />
                    <span className="text-blue-300 text-[10px]">Waiting for on-chain confirmation...</span>
                  </div>
                </div>
              )}

              {/* Completed */}
              {currentStep > 3 && stepTimings.signing !== undefined && (
                <div className="flex gap-4 text-[10px] text-muted-foreground">
                  <span>Signing: {stepTimings.signing}ms</span>
                  {stepTimings.settlement !== undefined && (
                    <span>Settlement: {stepTimings.settlement}ms</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* ══════════════ STEP 4: Success ══════════════ */}
      {phase === 'success' && flowResponse?.data && (
        <Card className="p-5 border-2 border-green-400 rounded-xl bg-green-50/50 dark:bg-green-950/20 shadow-md shadow-green-500/10 animate-in fade-in slide-in-from-top-2">
          <div className="flex gap-4 items-start">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-green-500 to-emerald-600 shadow-md">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-foreground">Step 4: Data Unlocked</h3>
                <Badge className="bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 text-[10px] font-bold px-2 py-0.5">
                  PAID VIA x402
                </Badge>
                <Badge className="bg-violet-100 dark:bg-violet-900/40 text-violet-800 dark:text-violet-300 text-[10px] font-bold px-2 py-0.5">
                  SOROBAN AUTH
                </Badge>
                {flowResponse.demo && (
                  <Badge className="bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 text-[10px] font-bold px-2 py-0.5">
                    DEMO MODE
                  </Badge>
                )}
              </div>


              {/* Payment settlement proof */}
              {flowResponse.paymentResponse && (
                <div className="bg-slate-900 dark:bg-black rounded-lg p-4 font-mono text-xs space-y-1 text-slate-300 border border-green-700/50">
                  <p className="text-green-400 font-semibold mb-2 flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    PAYMENT-RESPONSE (Settlement Proof)
                  </p>
                  <p className="text-slate-400 break-all text-[10px]">{flowResponse.paymentResponse}</p>
                </div>
              )}

              {/* Prediction data */}
              <div className="rounded-xl border border-green-200 dark:border-green-800/50 overflow-hidden">
                <div className="bg-green-100/50 dark:bg-green-900/20 px-4 py-3 border-b border-green-200 dark:border-green-800/50">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-foreground text-sm">Revenue Prediction</p>
                    <Badge className={`text-[10px] font-bold px-2 py-0.5 ${
                      flowResponse.data.prediction === 'low revenue risk'
                        ? 'bg-green-200 dark:bg-green-800/40 text-green-800 dark:text-green-300'
                        : 'bg-amber-200 dark:bg-amber-800/40 text-amber-800 dark:text-amber-300'
                    }`}>
                      {flowResponse.data.prediction?.toUpperCase() || 'ASSESSED'}
                    </Badge>
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Income</p>
                      <p className="text-lg font-bold text-foreground">${flowResponse.data.forecastedIncome?.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Confidence</p>
                      <p className="text-lg font-bold text-foreground">{((flowResponse.data.confidence || 0) * 100).toFixed(0)}%</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Timeframe</p>
                      <p className="text-lg font-bold text-foreground">{flowResponse.data.timeframe}</p>
                    </div>
                  </div>

                  {flowResponse.data.breakdown && (
                    <div className="pt-3 border-t border-border space-y-1.5">
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Revenue Breakdown</p>
                      {Object.entries(flowResponse.data.breakdown).map(([key, val]) => (
                        <div key={key} className="flex justify-between items-center text-xs">
                          <span className="text-muted-foreground">{key}</span>
                          <span className="font-semibold text-foreground">${(val as number).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {flowResponse.data.riskFactors && (
                    <div className="pt-3 border-t border-border space-y-1.5">
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Risk Factors</p>
                      {flowResponse.data.riskFactors.map((f: string, i: number) => (
                        <div key={i} className="flex gap-2 text-xs text-muted-foreground">
                          <span className="text-amber-500">&#x25CF;</span>
                          <span>{f}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* ══════════════ Error state ══════════════ */}
      {phase === 'error' && (
        <Card className="p-5 border-2 border-red-400 rounded-xl bg-red-50/50 dark:bg-red-950/20 shadow-md shadow-red-500/10 animate-in fade-in">
          <div className="flex gap-4 items-start">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-red-500 to-rose-600 shadow-md">
              <XCircle className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-red-700 dark:text-red-400 mb-1">Error</h3>
              <p className="text-sm text-red-600 dark:text-red-300 mb-3">{errorMsg}</p>
              <div className="p-3 rounded-lg bg-red-100/50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50">
                <p className="text-xs text-red-700/80 dark:text-red-300/80">
                  Make sure both servers are running: <code className="bg-red-200/50 dark:bg-red-800/30 px-1.5 py-0.5 rounded font-mono text-[10px]">./start.sh</code>
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* ══════════════ Summary Stats ══════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Card className="p-4 rounded-xl border border-border bg-gradient-to-br from-background to-muted/30">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium mb-1">Total Latency</p>
          <p className="text-2xl font-bold text-foreground">{elapsedMs > 0 ? `${(elapsedMs / 1000).toFixed(1)}s` : '—'}</p>
          <p className="text-[10px] text-muted-foreground mt-1">Full x402 round-trip</p>
        </Card>
        <Card className="p-4 rounded-xl border border-border bg-gradient-to-br from-background to-muted/30">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium mb-1">Price</p>
          <p className="text-2xl font-bold text-accent">{accept ? formatAmount(accept.amount, accept.asset) : '$0.01 USDC'}</p>
          <p className="text-[10px] text-muted-foreground mt-1">stellar:testnet</p>
        </Card>
        <Card className="p-4 rounded-xl border border-border bg-gradient-to-br from-background to-muted/30">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium mb-1">Auth</p>
          <p className={`text-2xl font-bold ${phase === 'success' ? 'text-violet-600 dark:text-violet-400' : 'text-muted-foreground'}`}>
            {phase === 'success' ? 'Soroban' : 'Pending'}
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">Ed25519 server-side</p>
        </Card>
        <Card className="p-4 rounded-xl border border-border bg-gradient-to-br from-background to-muted/30">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium mb-1">Settlement</p>
          <p className={`text-2xl font-bold ${phase === 'success' ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
            {phase === 'success' ? 'Settled' : 'Pending'}
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">x402.org facilitator</p>
        </Card>
      </div>

      {/* ── Controls ── */}
      <div className="flex gap-3">
        <Button onClick={handleReset} variant="outline" size="sm" className="h-9">
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
          Reset Flow
        </Button>
        {phase === 'success' && (
          <Button onClick={handleAutomatedFlow} variant="outline" size="sm" className="h-9">
            <Zap className="w-3.5 h-3.5 mr-1.5" />
            Run Again
          </Button>
        )}
      </div>

      {/* ── OWASP Security Info ── */}
      <Card className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20 border border-emerald-200/50 dark:border-emerald-800/30">
        <h4 className="font-semibold text-foreground text-sm mb-3 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          Security (OWASP Top 10)
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-muted-foreground">
          {[
            ['A1 Injection', 'Input validation with Zod, sanitized tx hashes'],
            ['A2 Broken Auth', 'Ed25519 Soroban auth, no shared secrets'],
            ['A3 Data Exposure', 'Private keys server-side only (no NEXT_PUBLIC_)'],
            ['A5 Access Control', 'Rate limiting (10 req/min), POST-only API route'],
            ['A6 Misconfiguration', 'CSP, HSTS, X-Frame-Options, Permissions-Policy'],
            ['A7 XSS', 'Content Security Policy, React auto-escaping'],
            ['A8 Deserialization', 'Response structure validation, typed interfaces'],
            ['A10 Logging', 'Structured JSON request logging, no secret leaks'],
          ].map(([title, desc], i) => (
            <div key={i} className="flex gap-2 items-start">
              <span className="bg-emerald-200 dark:bg-emerald-800/40 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded text-[10px] font-bold flex-shrink-0">
                {title}
              </span>
              <span className="text-[10px]">{desc}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* ── How it works ── */}
      <Card className="p-4 rounded-xl bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-950/20 dark:to-indigo-950/20 border border-violet-200/50 dark:border-violet-800/30">
        <h4 className="font-semibold text-foreground text-sm mb-3 flex items-center gap-2">
          <Shield className="w-4 h-4 text-violet-500" />
          How x402 Works (Real Protocol)
        </h4>
        <ol className="text-xs text-muted-foreground space-y-2 list-none">
          {[
            ['Client requests', 'GET /predict-revenue', '— protected by @x402/express middleware'],
            ['Server returns', '402 + PAYMENT-REQUIRED header', 'with scheme, price, network, payTo'],
            ['API route signs', 'Soroban authorization entry', 'server-side using Ed25519 (keys never in browser)'],
            ['x402 retries with', 'PAYMENT-SIGNATURE header', '— facilitator verifies + settles on-chain'],
            ['Server returns data +', 'PAYMENT-RESPONSE header', '— settlement proof from x402 facilitator'],
          ].map(([a, b, c], i) => (
            <li key={i} className="flex gap-2 items-start">
              <span className="bg-violet-200 dark:bg-violet-800/40 text-violet-700 dark:text-violet-300 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
                {i + 1}
              </span>
              <span>
                {a} <code className="bg-violet-100 dark:bg-violet-900/30 px-1 py-0.5 rounded text-violet-700 dark:text-violet-300 font-mono text-[10px]">{b}</code> {c}
              </span>
            </li>
          ))}
        </ol>
      </Card>
    </div>
  )
}
