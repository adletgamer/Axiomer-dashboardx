'use client'

import { cn } from '@/lib/utils'
import { Zap, Clock, CheckCircle2 } from 'lucide-react'

interface TopBarProps {
  balance: number
  agentStatus: 'active' | 'evaluating' | 'executing'
}

export function TopBar({ balance, agentStatus }: TopBarProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'active':
        return {
          label: 'Active',
          color: 'bg-green-500/20 text-green-700 dark:text-green-400',
          dotColor: 'bg-green-500',
          icon: CheckCircle2
        }
      case 'evaluating':
        return {
          label: 'Evaluating',
          color: 'bg-amber-500/20 text-amber-700 dark:text-amber-400',
          dotColor: 'bg-amber-500',
          icon: Clock
        }
      case 'executing':
        return {
          label: 'Executing',
          color: 'bg-blue-500/20 text-blue-700 dark:text-blue-400',
          dotColor: 'bg-blue-500',
          icon: Zap
        }
      default:
        return {
          label: 'Unknown',
          color: 'bg-gray-500/20 text-gray-700 dark:text-gray-400',
          dotColor: 'bg-gray-500',
          icon: CheckCircle2
        }
    }
  }

  const statusConfig = getStatusConfig(agentStatus)
  const StatusIcon = statusConfig.icon

  return (
    <header className="h-16 bg-card border-b border-border px-8 flex items-center justify-between sticky top-0 z-10">
      {/* Left: Balance */}
      <div className="flex items-center gap-6">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground font-medium">
            USDC Balance
          </span>
          <span className="text-2xl font-bold text-foreground">
            ${balance.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}
          </span>
        </div>
      </div>

      {/* Right: Agent Status */}
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm',
            statusConfig.color
          )}
        >
          <div className={cn('w-2 h-2 rounded-full', statusConfig.dotColor)} />
          <StatusIcon className="w-4 h-4" />
          <span>{statusConfig.label}</span>
        </div>
      </div>
    </header>
  )
}
