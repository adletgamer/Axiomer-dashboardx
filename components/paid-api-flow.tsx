'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Check, AlertCircle, Loader, Zap, DollarSign, CheckCircle, XCircle, Wifi, WifiOff } from 'lucide-react'
import { requestPrediction, retryWithPayment, checkBackendHealth } from '@/lib/api-client'
import type { PaymentInstructions, PaidAPIResponse } from '@/lib/api-client'

type FlowPhase = 'idle' | 'requesting' | 'got402' | 'awaiting_tx' | 'verifying' | 'success' | 'error'

export function PaidAPIFlow() {
  const [phase, setPhase] = useState<FlowPhase>('idle')
  const [paymentInfo, setPaymentInfo] = useState<PaymentInstructions | null>(null)
  const [txHash, setTxHash] = useState('')
  const [result, setResult] = useState<PaidAPIResponse | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null)
  const [elapsedMs, setElapsedMs] = useState(0)

  // Check backend health
  const handleCheckHealth = async () => {
    const online = await checkBackendHealth()
    setBackendOnline(online)
  }

  // Step 1: Call API → expect 402
  const handleRequestAPI = async () => {
    setPhase('requesting')
    setErrorMsg('')
    setResult(null)
    setPaymentInfo(null)
    const start = Date.now()

    try {
      const res = await requestPrediction()

      if (res.status === 402 && res.paymentRequired) {
        setPaymentInfo(res.paymentRequired)
        setPhase('got402')
        setElapsedMs(Date.now() - start)
      } else if (res.data) {
        setResult(res.data)
        setPhase('success')
        setElapsedMs(Date.now() - start)
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to reach backend. Is it running on port 4000?')
      setPhase('error')
    }
  }

  // Step 2: Submit tx_hash → verify → get data
  const handleSubmitPayment = async () => {
    if (!txHash.trim()) return

    setPhase('verifying')
    setErrorMsg('')
    const start = Date.now()

    try {
      const res = await retryWithPayment(txHash.trim())

      if (res.status === 200 && res.data) {
        setResult(res.data)
        setPhase('success')
        setElapsedMs(Date.now() - start)
      } else {
        setErrorMsg(res.error || 'Payment verification failed')
        setPhase('got402')
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Verification request failed')
      setPhase('error')
    }
  }

  const handleReset = () => {
    setPhase('idle')
    setPaymentInfo(null)
    setTxHash('')
    setResult(null)
    setErrorMsg('')
    setElapsedMs(0)
  }

  const getPhaseLabel = () => {
    switch (phase) {
      case 'idle': return 'Ready'
      case 'requesting': return 'Calling API...'
      case 'got402': return '402 Received — Pay to unlock'
      case 'awaiting_tx': return 'Paste your tx hash'
      case 'verifying': return 'Verifying on Stellar...'
      case 'success': return 'Data Unlocked'
      case 'error': return 'Error'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">HTTP 402 Payment Flow</h2>
          <p className="text-sm text-muted-foreground">
            Live x402-like flow — calls real backend, verifies real Stellar transactions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleCheckHealth}>
            {backendOnline === null ? (
              <Wifi className="w-4 h-4 mr-1" />
            ) : backendOnline ? (
              <Wifi className="w-4 h-4 mr-1 text-green-500" />
            ) : (
              <WifiOff className="w-4 h-4 mr-1 text-red-500" />
            )}
            {backendOnline === null ? 'Check' : backendOnline ? 'Online' : 'Offline'}
          </Button>
        </div>
      </div>

      {/* Phase indicator */}
      <div className="flex items-center gap-3">
        <Badge variant="outline" className={`text-sm px-3 py-1 ${
          phase === 'success' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-300' :
          phase === 'error' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-300' :
          phase === 'got402' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-300' :
          phase === 'requesting' || phase === 'verifying' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-300' :
          'bg-muted text-muted-foreground'
        }`}>
          {getPhaseLabel()}
        </Badge>
        {(phase === 'requesting' || phase === 'verifying') && (
          <Loader className="w-4 h-4 animate-spin text-blue-500" />
        )}
      </div>

      {/* Step 1: Call API */}
      <Card className={`p-5 border-2 transition-all ${
        phase === 'idle' ? 'border-accent/50' :
        phase === 'requesting' ? 'border-blue-300 bg-blue-50/50 dark:bg-blue-950/20' :
        'border-green-300 bg-green-50/50 dark:bg-green-950/10'
      }`}>
        <div className="flex gap-4 items-start">
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-100 dark:bg-blue-900/30 flex-shrink-0">
            <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground mb-1">Step 1: Request Prediction API</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Calls <code className="text-xs bg-muted px-1 py-0.5 rounded">GET /api/predict-revenue</code> on real backend
            </p>
            <Button
              onClick={handleRequestAPI}
              disabled={phase === 'requesting' || phase === 'verifying'}
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              {phase === 'requesting' ? 'Calling...' : 'Call API'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Step 2: Show 402 response */}
      {paymentInfo && (phase === 'got402' || phase === 'awaiting_tx' || phase === 'verifying' || phase === 'success') && (
        <Card className="p-5 border-2 border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/20">
          <div className="flex gap-4 items-start">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-amber-100 dark:bg-amber-900/30 flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-foreground">Step 2: HTTP 402 Payment Required</h3>
                <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 text-xs">
                  REAL RESPONSE
                </Badge>
              </div>
              <div className="bg-black/5 dark:bg-white/5 rounded-lg p-3 font-mono text-xs space-y-1 mb-3">
                <p className="text-red-500">HTTP/1.1 402 Payment Required</p>
                <p><span className="text-muted-foreground">price:</span> {paymentInfo.price} {paymentInfo.asset}</p>
                <p><span className="text-muted-foreground">destination:</span> {paymentInfo.destination}</p>
                <p><span className="text-muted-foreground">network:</span> {paymentInfo.network}</p>
                <p><span className="text-muted-foreground">memo:</span> {paymentInfo.memo}</p>
              </div>
              <p className="text-xs text-muted-foreground">
                Send <strong>{paymentInfo.price} {paymentInfo.asset}</strong> (or XLM on testnet) to the destination address above, then paste the transaction hash below.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Step 3: Submit tx_hash */}
      {(phase === 'got402' || phase === 'awaiting_tx' || phase === 'verifying') && (
        <Card className={`p-5 border-2 transition-all ${
          phase === 'verifying' ? 'border-blue-300 bg-blue-50/50 dark:bg-blue-950/20' : 'border-purple-300 dark:border-purple-700 bg-purple-50/50 dark:bg-purple-950/20'
        }`}>
          <div className="flex gap-4 items-start">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-purple-100 dark:bg-purple-900/30 flex-shrink-0">
              <DollarSign className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-1">Step 3: Submit Stellar Transaction Hash</h3>
              <p className="text-sm text-muted-foreground mb-3">
                After paying on Stellar testnet, paste the tx hash here. Backend will verify on-chain.
              </p>
              <div className="flex gap-2">
                <Input
                  value={txHash}
                  onChange={(e) => setTxHash(e.target.value)}
                  placeholder="Paste Stellar transaction hash..."
                  className="font-mono text-xs flex-1"
                  disabled={phase === 'verifying'}
                />
                <Button
                  onClick={handleSubmitPayment}
                  disabled={!txHash.trim() || phase === 'verifying'}
                >
                  {phase === 'verifying' ? (
                    <><Loader className="w-4 h-4 animate-spin mr-1" /> Verifying...</>
                  ) : (
                    'Verify & Unlock'
                  )}
                </Button>
              </div>
              {errorMsg && phase === 'got402' && (
                <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                  <XCircle className="w-3 h-3" /> {errorMsg}
                </p>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Step 4: Success — show real data */}
      {phase === 'success' && result && (
        <Card className="p-5 border-2 border-green-300 dark:border-green-700 bg-green-50/50 dark:bg-green-950/20">
          <div className="flex gap-4 items-start">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-green-100 dark:bg-green-900/30 flex-shrink-0">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-foreground">Step 4: Data Unlocked</h3>
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 text-xs">
                  VERIFIED ON STELLAR
                </Badge>
              </div>

              {/* Payment proof */}
              {result.payment && (
                <div className="bg-black/5 dark:bg-white/5 rounded-lg p-3 font-mono text-xs space-y-1 mb-3">
                  <p className="text-green-600 dark:text-green-400 font-semibold">Payment Verified</p>
                  <p><span className="text-muted-foreground">tx:</span> {result.payment.hash}</p>
                  <p><span className="text-muted-foreground">from:</span> {result.payment.from}</p>
                  <p><span className="text-muted-foreground">amount:</span> {result.payment.amount} {result.payment.asset}</p>
                </div>
              )}

              {/* Prediction data */}
              <div className="bg-black/5 dark:bg-white/5 rounded-lg p-3 text-sm space-y-2">
                <p className="font-semibold text-foreground">Revenue Prediction</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Forecasted Income</p>
                    <p className="font-bold text-foreground">${result.data.forecastedIncome.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Confidence</p>
                    <p className="font-bold text-foreground">{(result.data.confidence * 100).toFixed(0)}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Timeframe</p>
                    <p className="font-bold text-foreground">{result.data.timeframe}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Generated At</p>
                    <p className="font-bold text-foreground text-xs">{new Date(result.data.generatedAt).toLocaleTimeString()}</p>
                  </div>
                </div>
                {result.data.breakdown && (
                  <div className="mt-2 pt-2 border-t border-border">
                    <p className="text-xs text-muted-foreground mb-1">Breakdown</p>
                    {Object.entries(result.data.breakdown).map(([key, val]) => (
                      <div key={key} className="flex justify-between text-xs">
                        <span className="text-muted-foreground">{key}</span>
                        <span className="font-semibold">${val.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}
                {result.data.riskFactors && (
                  <div className="mt-2 pt-2 border-t border-border">
                    <p className="text-xs text-muted-foreground mb-1">Risk Factors</p>
                    {result.data.riskFactors.map((f, i) => (
                      <p key={i} className="text-xs text-muted-foreground">• {f}</p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Error state */}
      {phase === 'error' && (
        <Card className="p-5 border-2 border-red-300 dark:border-red-700 bg-red-50/50 dark:bg-red-950/20">
          <div className="flex gap-4 items-start">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-red-100 dark:bg-red-900/30 flex-shrink-0">
              <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-red-700 dark:text-red-400 mb-1">Error</h3>
              <p className="text-sm text-red-600 dark:text-red-300">{errorMsg}</p>
              <p className="text-xs text-muted-foreground mt-2">
                Make sure the backend is running: <code className="bg-muted px-1 rounded">cd backend && npm run dev</code>
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        <Card className="p-4 rounded-xl border border-border">
          <p className="text-xs text-muted-foreground font-medium mb-2">Latency</p>
          <p className="text-xl font-bold text-foreground">{elapsedMs > 0 ? `${(elapsedMs / 1000).toFixed(1)}s` : '—'}</p>
          <p className="text-xs text-muted-foreground mt-2">Last API call</p>
        </Card>
        <Card className="p-4 rounded-xl border border-border">
          <p className="text-xs text-muted-foreground font-medium mb-2">Cost</p>
          <p className="text-xl font-bold text-accent">{paymentInfo ? `${paymentInfo.price} ${paymentInfo.asset}` : '—'}</p>
          <p className="text-xs text-muted-foreground mt-2">Micropayment required</p>
        </Card>
        <Card className="p-4 rounded-xl border border-border">
          <p className="text-xs text-muted-foreground font-medium mb-2">Verification</p>
          <p className={`text-xl font-bold ${phase === 'success' ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
            {phase === 'success' ? 'On-Chain ✓' : 'Pending'}
          </p>
          <p className="text-xs text-muted-foreground mt-2">Stellar testnet</p>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex gap-3 pt-2">
        <Button onClick={handleReset} variant="outline" className="rounded-lg">
          Reset Flow
        </Button>
      </div>

      {/* Explanation Box */}
      <Card className="p-4 rounded-xl bg-accent/5 border border-accent/20">
        <h4 className="font-semibold text-foreground text-sm mb-2">How This Works (Real Flow)</h4>
        <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
          <li>Frontend calls real Express backend at <code className="bg-muted px-1 rounded">localhost:4000/api/predict-revenue</code></li>
          <li>Backend returns HTTP 402 with payment instructions (destination, price, memo)</li>
          <li>You send USDC/XLM on Stellar testnet to the destination address</li>
          <li>Paste the transaction hash — backend verifies it on Stellar Horizon</li>
          <li>Once verified, backend returns real prediction data</li>
        </ol>
      </Card>
    </div>
  )
}
