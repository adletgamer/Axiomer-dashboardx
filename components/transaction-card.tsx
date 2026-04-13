/** 
 * TransactionCard Component
 * Displays a compact Stellar transaction with status and details
 * Inspired by wallet activity feeds (clean, developer-focused design)
 */

'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  ArrowUpRight,
  CheckCircle2,
  Clock,
  ExternalLink,
  AlertCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TransactionResult } from '@/lib/stellar-payment'

interface TransactionCardProps {
  transaction: TransactionResult
  onViewExplorer?: () => void
  className?: string
}

/**
 * Get status badge styling based on transaction status
 */
function getStatusBadgeColor(
  status: TransactionResult['status']
): string {
  switch (status) {
    case 'confirmed':
      return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-300 dark:border-green-700'
    case 'pending':
      return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700'
    case 'failed':
      return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-300 dark:border-red-700'
    default:
      return 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400'
  }
}

/**
 * Get status icon based on transaction status
 */
function getStatusIcon(
  status: TransactionResult['status']
): React.ReactNode {
  switch (status) {
    case 'confirmed':
      return <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
    case 'pending':
      return <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
    case 'failed':
      return <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
    default:
      return null
  }
}

/**
 * Format timestamp to readable string
 */
function formatTime(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

export function TransactionCard({
  transaction,
  onViewExplorer,
  className
}: TransactionCardProps) {
  return (
    <Card
      className={cn(
        'p-0 overflow-hidden hover:shadow-md transition-shadow duration-200',
        className
      )}
    >
      <div className="flex items-center gap-4 p-4">
        {/* Left: Icon */}
        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-lg bg-accent/10 dark:bg-accent/20 flex items-center justify-center">
            <ArrowUpRight className="w-5 h-5 text-accent" />
          </div>
        </div>

        {/* Center: Payment details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-foreground text-sm truncate">
              Payment to {transaction.to.slice(0, 4)}...{transaction.to.slice(-4)}
            </h4>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <span className="font-mono">
              {transaction.from.slice(0, 4)}...{transaction.from.slice(-4)}
            </span>
            <span>→</span>
            <span className="font-mono">
              {transaction.to.slice(0, 4)}...{transaction.to.slice(-4)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {formatTime(transaction.timestamp)} · Stellar Testnet
          </p>
        </div>

        {/* Right: Amount and status */}
        <div className="flex-shrink-0 text-right">
          <div className="font-semibold text-foreground mb-2">
            {transaction.amount.toFixed(6)} USDC
          </div>
          <div className="flex items-center gap-2 justify-end">
            <Badge
              variant="outline"
              className={cn(
                'text-xs font-medium border',
                getStatusBadgeColor(transaction.status)
              )}
            >
              {transaction.status.charAt(0).toUpperCase() +
                transaction.status.slice(1)}
            </Badge>
            {getStatusIcon(transaction.status)}
          </div>
        </div>
      </div>

      {/* Optional: Explorer button */}
      {onViewExplorer && (
        <div className="px-4 py-2 bg-muted/50 dark:bg-muted/20 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={onViewExplorer}
            className="text-xs h-7 text-accent hover:text-accent/80"
          >
            <ExternalLink className="w-3 h-3 mr-1" />
            View on stellar.expert
          </Button>
        </div>
      )}
    </Card>
  )
}
