'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ThumbsUp, ThumbsDown, Clock, AlertCircle, Terminal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'

interface Decision {
  id: string
  timestamp: string
  type: 'payment' | 'deferral' | 'risk' | 'optimization'
  title: string
  description: string
  confidence: number
  impact: 'high' | 'medium' | 'low'
  rationale: string
  userAction?: 'approved' | 'rejected' | 'pending'
  txHash?: string
}

// ── Terminal Log Lines ────────────────────────────────────────────────────────
interface LogLine {
  ts: string
  level: 'INFO' | 'WARN' | 'PAY' | 'OK'
  msg: string
  hash?: string
}

const RAW_LOGS: LogLine[] = [
  { ts: '15:32:00.124', level: 'INFO', msg: 'Agent initialised — scanning Stellar ledger #49182043' },
  { ts: '15:32:00.891', level: 'INFO', msg: 'Fetched 87 on-chain transactions via Horizon API' },
  { ts: '15:32:01.540', level: 'WARN', msg: 'Invoice GBYX#012 overdue by 3 days → priority queue' },
  { ts: '15:32:02.213', level: 'PAY',  msg: 'x402 payment signed — Soroban auth Ed25519', hash: 'a1b2c3d4e5f6789012345678901234a1b2c3d4e5f6789012345678901234abcd' },
  { ts: '15:32:03.041', level: 'OK',   msg: 'Settlement confirmed on stellar:testnet', hash: 'f7e8d9c0b1a23456789012345678901f7e8d9c0b1a2345678901234567890ab12' },
  { ts: '15:32:03.820', level: 'INFO', msg: 'Running Monte Carlo simulation — 1,000 scenarios' },
  { ts: '15:32:04.570', level: 'INFO', msg: 'Survival score recalculated → 72% (+8%)' },
  { ts: '15:32:05.120', level: 'PAY',  msg: 'Deferred: Notion Pro $150 / GitHub Ent $500 → +3 days', hash: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef' },
  { ts: '15:32:06.001', level: 'OK',   msg: 'Decision log committed — 7 actions queued' },
]

function TypewriterLine({ line, delay }: { line: LogLine; delay: number }) {
  const [visible, setVisible] = useState(false)
  const [text, setText] = useState('')

  useEffect(() => {
    const show = setTimeout(() => {
      setVisible(true)
      let i = 0
      const full = line.msg
      const type = setInterval(() => {
        setText(full.slice(0, i + 1))
        i++
        if (i >= full.length) clearInterval(type)
      }, 18)
      return () => clearInterval(type)
    }, delay)
    return () => clearTimeout(show)
  }, [line.msg, delay])

  if (!visible) return null

  const levelColor: Record<LogLine['level'], string> = {
    INFO: 'text-blue-400',
    WARN: 'text-amber-400',
    PAY:  'text-violet-400',
    OK:   'text-green-400',
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
      className="flex flex-wrap items-start gap-x-2 gap-y-0.5 font-mono text-[11px] leading-relaxed"
    >
      <span className="text-slate-500 flex-shrink-0">[{line.ts}]</span>
      <span className={cn('font-bold flex-shrink-0 w-10', levelColor[line.level])}>{line.level}</span>
      <span className="text-slate-300 flex-1">{text}</span>
      {line.hash && text === line.msg && (
        <a
          href={`https://stellar.expert/explorer/testnet/tx/${line.hash}`}
          target="_blank"
          rel="noreferrer"
          className="text-accent/80 hover:text-accent transition-colors underline-offset-2 hover:underline text-[10px] break-all"
        >
          {line.hash.slice(0, 16)}…{line.hash.slice(-8)}
        </a>
      )}
    </motion.div>
  )
}

function TerminalLog() {
  const [running, setRunning] = useState(false)
  const [shown, setShown] = useState<number>(0)

  const startReplay = () => {
    setRunning(true)
    setShown(0)
    RAW_LOGS.forEach((_, i) => {
      setTimeout(() => setShown(i + 1), i * 680)
    })
  }

  return (
    <Card className="overflow-hidden border-border">
      {/* Terminal chrome */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 border-b border-slate-700/60">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 opacity-70" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 opacity-70" />
          <span className="w-2.5 h-2.5 rounded-full bg-green-500 opacity-70" />
          <span className="text-[10px] text-slate-500 ml-2 font-mono">cashflow-agent · stellar:testnet</span>
        </div>
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-slate-500" />
          <button
            onClick={startReplay}
            disabled={running && shown < RAW_LOGS.length}
            className="text-[10px] font-semibold px-2.5 py-1 rounded bg-accent/80 hover:bg-accent text-white transition-colors disabled:opacity-40"
          >
            {running && shown < RAW_LOGS.length ? 'Running…' : 'Replay'}
          </button>
        </div>
      </div>

      {/* Log body */}
      <div className="bg-slate-950 p-4 min-h-[200px] space-y-1.5">
        {RAW_LOGS.slice(0, shown).map((line, i) => (
          <TypewriterLine key={i} line={line} delay={0} />
        ))}
        {shown > 0 && shown < RAW_LOGS.length && (
          <span className="inline-block w-2 h-3.5 bg-accent animate-cursor ml-0.5" />
        )}
        {shown === 0 && (
          <p className="text-slate-600 font-mono text-[11px]">
            $ Press <span className="text-accent">Replay</span> to stream agent logs…
          </p>
        )}
      </div>
    </Card>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export function DecisionsSection() {
  const decisions: Decision[] = [
    {
      id: '1',
      timestamp: '2024-03-28 15:32:00',
      type: 'payment',
      title: 'Process AWS Invoice Payment',
      description: 'Execute $8,500 payment to AWS for infrastructure costs',
      confidence: 94,
      impact: 'high',
      rationale: 'Invoice is 3 days overdue. Current cash position allows payment without reducing runway below 85 days.',
      userAction: 'approved',
      txHash: 'a1b2c3d4e5f6789012345678901234a1b2c3d4e5f6789012345678901234abcd'
    },
    {
      id: '2',
      timestamp: '2024-03-28 14:15:00',
      type: 'deferral',
      title: 'Defer Non-Critical Payments',
      description: 'Postpone Notion Pro ($150), GitHub Enterprise ($500) for 3 days',
      confidence: 87,
      impact: 'medium',
      rationale: 'These payments are low-priority and deferring them by 3 days will preserve $650 of liquidity without impacting operations.',
      userAction: 'approved',
      txHash: 'f7e8d9c0b1a23456789012345678901f7e8d9c0b1a2345678901234567890ab12'
    },
    {
      id: '3',
      timestamp: '2024-03-28 12:45:00',
      type: 'risk',
      title: 'Payroll Coverage Alert',
      description: 'Current cash may be insufficient for full payroll on March 31',
      confidence: 76,
      impact: 'high',
      rationale: 'Expected March revenue ($80k @ 65% probability) is critical. With deferred payments, coverage improves to 92%.',
      userAction: 'pending',
    },
    {
      id: '4',
      timestamp: '2024-03-28 10:20:00',
      type: 'optimization',
      title: 'Optimize Payment Order',
      description: 'Sequence 12 invoices to minimize overdraft risk',
      confidence: 89,
      impact: 'medium',
      rationale: 'Processing highest-priority invoices first (payroll, rent) ensures critical obligations are met under all scenarios.',
      userAction: 'approved',
      txHash: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
    },
    {
      id: '5',
      timestamp: '2024-03-27 16:10:00',
      type: 'risk',
      title: 'Insufficient Runway',
      description: 'Cash flow deficit detected without revenue injection',
      confidence: 91,
      impact: 'high',
      rationale: 'Current obligations ($89.5k) exceed available cash ($87k). Immediate revenue injection of $5k+ needed within 3 days.',
      userAction: 'approved',
      txHash: 'deadbeef1234567890abcdeadbeef1234567890abcdeadbeef1234567890abcd'
    },
    {
      id: '6',
      timestamp: '2024-03-27 13:35:00',
      type: 'optimization',
      title: 'Negotiate Extended Terms',
      description: 'Request 7-day payment extension for non-critical vendors',
      confidence: 72,
      impact: 'medium',
      rationale: 'Vendors like DataDog and Vercel typically allow extended terms. This would add $3.3k to immediate runway.',
      userAction: 'pending',
    },
    {
      id: '7',
      timestamp: '2024-03-26 11:00:00',
      type: 'payment',
      title: 'Execute Stripe Processing Fee Payment',
      description: 'Pay $12,400 for monthly processing fees',
      confidence: 98,
      impact: 'high',
      rationale: 'Essential business operation. No deferral recommended.',
      userAction: 'approved',
      txHash: 'cafe0000deadcafe0000deadcafe0000deadcafe0000deadcafe0000deadcafe00'
    }
  ]

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'payment': return 'bg-blue-500/20 text-blue-400'
      case 'deferral': return 'bg-amber-500/20 text-amber-400'
      case 'risk': return 'bg-red-500/20 text-red-400'
      case 'optimization': return 'bg-green-500/20 text-green-400'
      default: return 'bg-muted text-muted-foreground'
    }
  }

  const getTypeLabel = (type: string) =>
    type.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')

  const getActionIcon = (action?: string) => {
    switch (action) {
      case 'approved': return <ThumbsUp className="w-4 h-4 text-green-400" />
      case 'rejected': return <ThumbsDown className="w-4 h-4 text-red-400" />
      default: return <Clock className="w-4 h-4 text-amber-400" />
    }
  }

  const stats = {
    approved: decisions.filter((d) => d.userAction === 'approved').length,
    rejected: decisions.filter((d) => d.userAction === 'rejected').length,
    pending: decisions.filter((d) => d.userAction === 'pending').length,
    avgConfidence: Math.round(decisions.reduce((sum, d) => sum + d.confidence, 0) / decisions.length)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Agent Decisions</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          AI decisions · Soroban auth · Stellar testnet transaction hashes
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Approved', value: stats.approved, color: 'text-green-400' },
          { label: 'Pending', value: stats.pending, color: 'text-amber-400' },
          { label: 'Rejected', value: stats.rejected, color: 'text-red-400' },
          { label: 'Avg. Confidence', value: `${stats.avgConfidence}%`, color: 'text-accent' },
        ].map((s) => (
          <Card key={s.label} className="p-4">
            <p className="text-xs text-muted-foreground font-medium">{s.label}</p>
            <p className={cn('text-2xl font-bold mt-1', s.color)}>{s.value}</p>
          </Card>
        ))}
      </div>

      {/* Terminal Log */}
      <div className="space-y-1.5">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
          Agent Log Terminal
        </p>
        <TerminalLog />
      </div>

      {/* Decisions List */}
      <div className="space-y-3">
        {decisions.map((decision, i) => (
          <motion.div
            key={decision.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.3 }}
          >
            <Card className="p-5 hover:shadow-md transition-shadow">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <Badge className={cn('text-xs font-semibold', getTypeColor(decision.type))}>
                        {getTypeLabel(decision.type)}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-xs font-medium',
                          decision.impact === 'high'
                            ? 'border-red-500/40 text-red-400'
                            : decision.impact === 'medium'
                              ? 'border-amber-500/40 text-amber-400'
                              : 'border-green-500/40 text-green-400'
                        )}
                      >
                        {decision.impact.charAt(0).toUpperCase() + decision.impact.slice(1)} Impact
                      </Badge>
                      {/* Glow badge for approved/confirmed */}
                      {decision.userAction === 'approved' && (
                        <Badge className="text-[10px] font-bold bg-green-500/20 text-green-400 border border-green-500/30"
                          style={{ boxShadow: '0 0 8px rgba(34,197,94,0.3)' }}>
                          ✓ CONFIRMED
                        </Badge>
                      )}
                    </div>
                    <h3 className="text-base font-semibold text-foreground">{decision.title}</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">{decision.description}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
                      {getActionIcon(decision.userAction)}
                    </div>
                    <p className="text-[10px] text-muted-foreground font-medium capitalize">
                      {decision.userAction || 'pending'}
                    </p>
                  </div>
                </div>

                <div className="border-t border-border" />

                {/* Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-[10px] text-muted-foreground font-semibold mb-1.5">Confidence</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-accent to-indigo-500 rounded-full"
                          style={{ width: `${decision.confidence}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-foreground">{decision.confidence}%</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground font-semibold mb-1.5">Timestamp</p>
                    <p className="text-xs text-foreground font-mono">{decision.timestamp}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground font-semibold mb-1.5">Stellar Tx Hash</p>
                    {decision.txHash ? (
                      <a
                        href={`https://stellar.expert/explorer/testnet/tx/${decision.txHash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] font-mono text-accent hover:text-accent/80 transition-colors underline-offset-2 hover:underline break-all"
                      >
                        {decision.txHash.slice(0, 12)}…{decision.txHash.slice(-8)}
                      </a>
                    ) : (
                      <span className="text-[10px] text-muted-foreground">pending settlement</span>
                    )}
                  </div>
                </div>

                {/* Rationale */}
                <div className="bg-muted/40 rounded-lg p-3 border border-border">
                  <p className="text-[10px] text-muted-foreground font-semibold mb-1.5 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" />
                    AI Rationale
                  </p>
                  <p className="text-xs text-foreground leading-relaxed">{decision.rationale}</p>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
