'use client'

import { cn } from '@/lib/utils'
import { LayoutDashboard, Settings, BarChart3, Clock, Brain, Zap, Network } from 'lucide-react'
import { useEffect, useState } from 'react'

interface SidebarProps {
  activeSection: string
  onSectionChange: (section: string) => void
}

const SCAN_MESSAGES = [
  'Scanning Stellar mempool…',
  'Monitoring x402 endpoints…',
  'Analyzing Soroban auth…',
  'Watching ledger sequence…',
  'Tracking payment flows…',
]

export function Sidebar({ activeSection, onSectionChange }: SidebarProps) {
  const [scanIdx, setScanIdx] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setScanIdx(i => (i + 1) % SCAN_MESSAGES.length), 3200)
    return () => clearInterval(id)
  }, [])

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      description: 'Overview & metrics'
    },
    {
      id: 'scenario',
      label: 'Scenario',
      icon: Settings,
      description: 'Initialize financial scenario'
    },
    {
      id: 'decisions',
      label: 'Agent Decisions',
      icon: Brain,
      description: 'AI decision log'
    },
    {
      id: 'payments',
      label: 'Payment Log',
      icon: Clock,
      description: 'Payment history'
    },
    {
      id: 'stellar',
      label: 'Stellar Wallet',
      icon: Zap,
      description: 'Blockchain payments'
    }
  ]

  return (
    <aside className="w-64 bg-sidebar border-r border-sidebar-border h-screen flex flex-col">
      {/* Logo Section */}
      <div className="px-6 py-8 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          {/* Animated radar ring around logo */}
          <div className="relative flex-shrink-0">
            {/* Outer ping ring */}
            <span className="absolute inset-0 rounded-xl bg-sidebar-primary/40 animate-stellar-ping" />
            {/* Inner glow ring */}
            <span className="absolute inset-[-3px] rounded-xl border border-sidebar-primary/50 animate-stellar-pulse" />
            <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-sidebar-primary to-indigo-700 flex items-center justify-center shadow-lg shadow-sidebar-primary/30">
              {/* Stellar-inspired concentric circles logo */}
              <svg viewBox="0 0 20 20" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="10" cy="10" r="2.5" fill="currentColor" strokeWidth="0" />
                <circle cx="10" cy="10" r="5" opacity="0.6" />
                <circle cx="10" cy="10" r="8" opacity="0.3" />
              </svg>
            </div>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-bold text-sidebar-foreground tracking-tight">
              Axiomer AI
            </span>
            <span className="text-[10px] text-sidebar-foreground/50 truncate font-mono transition-all duration-700">
              {SCAN_MESSAGES[scanIdx]}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = activeSection === item.id

          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={cn(
                'w-full text-left px-4 py-3 rounded-lg transition-all duration-200 group',
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-md shadow-sidebar-primary/20'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )}
            >
              <div className="flex items-center gap-3">
                <Icon className={cn('w-4 h-4 flex-shrink-0', isActive && 'drop-shadow-sm')} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-none">{item.label}</p>
                  <p
                    className={cn(
                      'text-[10px] mt-1',
                      isActive
                        ? 'text-sidebar-primary-foreground/70'
                        : 'text-sidebar-foreground/45'
                    )}
                  >
                    {item.description}
                  </p>
                </div>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-sidebar-primary-foreground/70 flex-shrink-0 animate-stellar-pulse" />
                )}
              </div>
            </button>
          )
        })}
      </nav>

      {/* Network Badge Footer */}
      <div className="px-4 py-4 border-t border-sidebar-border space-y-2">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-sidebar-primary/10 border border-sidebar-primary/20">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-stellar-pulse flex-shrink-0" />
          <span className="text-[10px] font-mono text-sidebar-foreground/70 flex-1 truncate">stellar:testnet</span>
          <Network className="w-3 h-3 text-sidebar-primary/60 flex-shrink-0" />
        </div>
        <p className="text-[10px] text-sidebar-foreground/40 px-1">
          v0.1.0 • x402 Protocol
        </p>
      </div>
    </aside>
  )
}
