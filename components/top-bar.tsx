'use client'

import { cn } from '@/lib/utils'
import { Zap, Clock, CheckCircle2, Copy, Check, ChevronDown } from 'lucide-react'
import { useState } from 'react'

interface TopBarProps {
  balance: number
  agentStatus: 'active' | 'evaluating' | 'executing'
}

const ASSETS = [
  { symbol: 'USDC', color: 'text-blue-400' },
  { symbol: 'XLM',  color: 'text-cyan-400' },
  { symbol: 'yXLM', color: 'text-violet-400' },
]

const WALLET_ADDR = 'GBYX7QNWVX4KFMJ2LDUQNXHZQEP3ITZQHBNQIGJQT3SSYQGJ5X4A1234'

export function TopBar({ balance, agentStatus }: TopBarProps) {
  const [copied, setCopied] = useState(false)
  const [assetIdx, setAssetIdx] = useState(0)

  const copyAddr = async () => {
    await navigator.clipboard.writeText(WALLET_ADDR)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'active':
        return {
          label: 'Active',
          color: 'bg-green-500/15 text-green-400 border border-green-500/30',
          dotColor: 'bg-green-400',
          icon: CheckCircle2
        }
      case 'evaluating':
        return {
          label: 'Evaluating',
          color: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
          dotColor: 'bg-amber-400',
          icon: Clock
        }
      case 'executing':
        return {
          label: 'Executing',
          color: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
          dotColor: 'bg-blue-400',
          icon: Zap
        }
      default:
        return {
          label: 'Unknown',
          color: 'bg-muted/30 text-muted-foreground border border-border',
          dotColor: 'bg-muted-foreground',
          icon: CheckCircle2
        }
    }
  }

  const statusConfig = getStatusConfig(agentStatus)
  const StatusIcon = statusConfig.icon
  const currentAsset = ASSETS[assetIdx]

  return (
    <header className="h-16 bg-card/80 backdrop-blur border-b border-border px-6 flex items-center justify-between sticky top-0 z-10">
      {/* Left: Balance + Wallet */}
      <div className="flex items-center gap-6">

        {/* Balance block */}
        <div className="flex flex-col gap-0.5">
          {/* Asset switcher */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setAssetIdx((i) => (i + 1) % ASSETS.length)}
              className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground hover:text-foreground transition-colors group"
            >
              <span className={cn('font-bold', currentAsset.color)}>{currentAsset.symbol}</span>
              <span>Balance</span>
              <ChevronDown className="w-2.5 h-2.5 group-hover:text-accent transition-colors" />
            </button>
            {/* Stellar testnet badge */}
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-accent/15 text-accent border border-accent/30 font-mono">
              stellar:testnet
            </span>
          </div>
          <span className="text-2xl font-bold text-foreground tracking-tight leading-none">
            ${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        {/* Divider */}
        <div className="h-8 w-px bg-border" />

        {/* Wallet address */}
        <div className="flex items-center gap-2">
          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">Agent Wallet</span>
            <span className="text-xs font-mono text-muted-foreground">
              {WALLET_ADDR.slice(0, 6)}…{WALLET_ADDR.slice(-6)}
            </span>
          </div>
          <button
            onClick={copyAddr}
            className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            title="Copy full address"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Asset row icons */}
        <div className="hidden md:flex items-center gap-1.5 pl-1">
          {ASSETS.map((a, i) => (
            <button
              key={a.symbol}
              onClick={() => setAssetIdx(i)}
              className={cn(
                'px-2 py-1 rounded-md text-[10px] font-bold border transition-all',
                i === assetIdx
                  ? 'bg-accent/20 border-accent/40 text-accent'
                  : 'border-border text-muted-foreground hover:border-accent/30 hover:text-foreground'
              )}
            >
              {a.symbol}
            </button>
          ))}
        </div>
      </div>

      {/* Right: Agent Status */}
      <div className="flex items-center gap-3">
        <div className={cn('flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium text-sm', statusConfig.color)}>
          <div className={cn('w-1.5 h-1.5 rounded-full animate-stellar-pulse', statusConfig.dotColor)} />
          <StatusIcon className="w-3.5 h-3.5" />
          <span className="text-xs">{statusConfig.label}</span>
        </div>
      </div>
    </header>
  )
}
