'use client'

import { Card } from '@/components/ui/card'
import { AlertCircle, TrendingDown, Zap, DollarSign, Info } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'

// ── Semi-Donut Gauge ────────────────────────────────────────────────────────
function SurvivalGauge({ score }: { score: number }) {
  const [animated, setAnimated] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => {
      let start = 0
      const step = () => {
        start += 1
        setAnimated(start)
        if (start < score) requestAnimationFrame(step)
      }
      requestAnimationFrame(step)
    }, 300)
    return () => clearTimeout(t)
  }, [score])

  // SVG arc math for a half-circle gauge
  const R = 56
  const cx = 70
  const cy = 70
  const circumference = Math.PI * R           // half circle
  const strokeDash = (animated / 100) * circumference

  // Color: red(0%) → amber(50%) → green(100%)
  const hue = Math.round((animated / 100) * 120)  // 0=red, 120=green
  const gaugeColor = `hsl(${hue}, 85%, 52%)`

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="140" height="80" viewBox="0 0 140 80" className="overflow-visible">
        {/* Track arc */}
        <path
          d={`M ${cx - R} ${cy} A ${R} ${R} 0 0 1 ${cx + R} ${cy}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="10"
          strokeLinecap="round"
          className="text-muted/40"
        />
        {/* Animated value arc */}
        <path
          d={`M ${cx - R} ${cy} A ${R} ${R} 0 0 1 ${cx + R} ${cy}`}
          fill="none"
          stroke={gaugeColor}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${strokeDash} ${circumference}`}
          className="transition-all"
          style={{ filter: `drop-shadow(0 0 6px ${gaugeColor})` }}
        />
        {/* Score text */}
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize="22" fontWeight="700" fill={gaugeColor} fontFamily="Inter,sans-serif">
          {animated}%
        </text>
        <text x={cx} y={cy + 10} textAnchor="middle" fontSize="9" fill="currentColor" className="fill-muted-foreground" fontFamily="Inter,sans-serif">
          SURVIVAL SCORE
        </text>
        {/* Min/Max labels */}
        <text x={cx - R} y={cy + 18} textAnchor="middle" fontSize="8" fill="currentColor" className="fill-muted-foreground">0</text>
        <text x={cx + R} y={cy + 18} textAnchor="middle" fontSize="8" fill="currentColor" className="fill-muted-foreground">100</text>
      </svg>
    </div>
  )
}

// ── Tooltip ──────────────────────────────────────────────────────────────────
function ScoreTooltip() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="text-muted-foreground hover:text-accent transition-colors"
        aria-label="Score methodology"
      >
        <Info className="w-3.5 h-3.5" />
      </button>
      {open && (
        <div className="absolute right-0 top-5 z-50 w-72 rounded-xl p-3 bg-popover border border-border shadow-xl text-xs space-y-2 animate-in fade-in slide-in-from-top-1">
          <p className="font-semibold text-foreground">Score Methodology</p>
          <p className="text-muted-foreground leading-relaxed">
            Powered by <span className="text-accent font-semibold">Soroban Smart Contracts</span>. Analyzing 87 on-chain payments via the <span className="text-accent font-semibold">x402 protocol</span> on Stellar testnet.
          </p>
          <div className="space-y-1 pt-1 border-t border-border">
            {[
              ['Cash-to-obligation ratio', '45%'],
              ['Income probability coverage', '35%'],
              ['Historical deferral success', '20%'],
            ].map(([label, weight]) => (
              <div key={label} className="flex justify-between">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-semibold text-accent">{weight}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Live Ticker ──────────────────────────────────────────────────────────────
const TICKER_ITEMS = [
  { hash: 'a1b2c3...f7e8', amount: '+0.02 USDC', label: 'x402 Payment' },
  { hash: '4d5e6f...1a2b', amount: '-12,500 USDC', label: 'Payroll' },
  { hash: '7g8h9i...3c4d', amount: '+80,000 USDC', label: 'Revenue' },
  { hash: 'j0k1l2...5e6f', amount: '-8,500 USDC', label: 'AWS Infra' },
  { hash: 'm3n4o5...7g8h', amount: '+0.01 USDC', label: 'API Fee' },
  { hash: 'p6q7r8...9i0j', amount: '-2,400 USDC', label: 'SaaS License' },
]

function LiveTicker() {
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS] // duplicate for seamless loop
  return (
    <div className="overflow-hidden bg-muted/30 border border-border rounded-lg px-0 py-2 relative">
      <div className="flex gap-8 animate-ticker whitespace-nowrap">
        {items.map((item, i) => (
          <span key={i} className="inline-flex items-center gap-2 text-[11px] font-mono flex-shrink-0">
            <span className="text-accent">◆</span>
            <a
              href={`https://stellar.expert/explorer/testnet/tx/${item.hash}`}
              target="_blank"
              rel="noreferrer"
              className="text-muted-foreground hover:text-accent transition-colors underline-offset-2 hover:underline"
            >
              {item.hash}
            </a>
            <span className={item.amount.startsWith('+') ? 'text-green-500' : 'text-red-400'}>
              {item.amount}
            </span>
            <span className="text-muted-foreground/60">{item.label}</span>
          </span>
        ))}
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export function DashboardSection() {
  const metrics = [
    {
      label: 'Monthly Obligations',
      value: '$45,250',
      change: '+12.5%',
      icon: DollarSign,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10'
    },
    {
      label: 'Days to Insolvency',
      value: '87 days',
      change: '-5 days',
      icon: AlertCircle,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10'
    },
    {
      label: 'Critical Invoices',
      value: '3 due',
      change: '→ $12k overdue',
      icon: TrendingDown,
      color: 'text-red-500',
      bg: 'bg-red-500/10'
    }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Real-time cash flow analysis — powered by Soroban x402 protocol
        </p>
      </div>

      {/* Top row: 3 metrics + Survival Gauge */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {metrics.map((metric, idx) => {
          const Icon = metric.icon
          return (
            <Card key={idx} className="p-5 hover:shadow-md transition-shadow">
              <div className="space-y-3">
                <div className={`w-9 h-9 rounded-lg ${metric.bg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${metric.color}`} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">{metric.label}</p>
                  <p className="text-2xl font-bold text-foreground mt-0.5">{metric.value}</p>
                </div>
                <p className="text-xs text-muted-foreground">{metric.change}</p>
              </div>
            </Card>
          )
        })}

        {/* Survival Gauge Card */}
        <Card className="p-5 border-accent/30 bg-gradient-to-br from-card to-accent/5 hover:shadow-md transition-shadow">
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1 self-end mb-1">
              <ScoreTooltip />
            </div>
            <SurvivalGauge score={72} />
            <p className="text-[10px] text-muted-foreground mt-1 text-center leading-relaxed">
              +8% from last check · 87 on-chain txns
            </p>
          </div>
        </Card>
      </div>

      {/* AI Insights */}
      <Card className="p-5 border-accent/20 bg-accent/5">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
            <Zap className="w-4 h-4 text-accent-foreground" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">AI Score Breakdown</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Soroban analysis of 87 transactions via x402 protocol on Stellar testnet
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { label: 'Cash-to-Obligation Ratio', score: 45, desc: 'Current balance covers 94% of Q2 obligations', weight: '45%' },
            { label: 'Income Probability Coverage', score: 35, desc: '65% probability × $80k income → weighted runway', weight: '35%' },
            { label: 'Deferral Success Rate', score: 20, desc: '89% historical success on 3-day deferrals', weight: '20%' },
          ].map((item) => (
            <div key={item.label} className="rounded-lg bg-background/60 border border-border p-3 space-y-2">
              <div className="flex justify-between items-start">
                <p className="text-xs font-semibold text-foreground leading-tight">{item.label}</p>
                <span className="text-[10px] font-bold text-accent ml-2 flex-shrink-0">{item.weight}</span>
              </div>
              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-accent to-indigo-500 rounded-full transition-all duration-1000"
                  style={{ width: `${(item.score / 45) * 100}%` }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Recent Agent Activity */}
      <Card className="p-5">
        <h2 className="text-sm font-semibold text-foreground mb-4">Recent Agent Activity</h2>
        <div className="space-y-3">
          {[
            { time: '2 mins ago', action: 'Evaluated invoice queue', result: 'Identified $12k high-priority payments', hash: 'a1b2c3d4e5f6...7890' },
            { time: '15 mins ago', action: 'Analyzed cash position', result: 'Recommended 2-day payment deferral', hash: 'f1e2d3c4b5a6...3210' },
            { time: '32 mins ago', action: 'Ran survival simulation', result: 'Current strategy provides 87-day runway', hash: '9a8b7c6d5e4f...bcde' },
            { time: '1 hour ago', action: 'Initial scenario analysis', result: 'Scenario loaded with 24 invoices', hash: '1234abcd5678...efgh' },
          ].map((activity, idx) => (
            <div key={idx} className="flex items-start gap-3 pb-3 border-b border-border last:border-0 last:pb-0">
              <div className="w-1.5 h-1.5 rounded-full bg-accent mt-2 flex-shrink-0 animate-stellar-pulse" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{activity.action}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{activity.result}</p>
                <a
                  href={`https://stellar.expert/explorer/testnet/tx/${activity.hash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] font-mono text-accent/70 hover:text-accent transition-colors mt-0.5 inline-block"
                >
                  {activity.hash}
                </a>
              </div>
              <p className="text-[10px] text-muted-foreground flex-shrink-0 ml-2 mt-0.5">{activity.time}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Live Stellar Ticker */}
      <div className="space-y-1.5">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-1">
          Live Stellar Network · Horizon API
        </p>
        <LiveTicker />
      </div>
    </div>
  )
}
