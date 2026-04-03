/**
 * AgentWalletCard Component
 * Displays agent's USDC balance, spending, and budget allocation
 * Shows stakes and decision-making power at a glance
 */

'use client'

import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface AgentWalletCardProps {
  balance: number
  totalSpent: number
  budgetLimit: number
  className?: string
}

/**
 * Calculate percentage spent for progress visualization
 */
function calculateSpentPercentage(spent: number, limit: number): number {
  if (limit === 0) return 0
  return Math.min((spent / limit) * 100, 100)
}

/**
 * Format USDC amount with proper decimals
 */
function formatUSDC(amount: number): string {
  return amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4
  })
}

/**
 * Get color for budget bar based on spending level
 */
function getBudgetBarColor(percentage: number): string {
  if (percentage >= 80) return 'bg-red-500'
  if (percentage >= 60) return 'bg-amber-500'
  if (percentage >= 40) return 'bg-blue-500'
  return 'bg-green-500'
}

export function AgentWalletCard({
  balance,
  totalSpent,
  budgetLimit,
  className
}: AgentWalletCardProps) {
  const remainingBudget = budgetLimit - totalSpent
  const spentPercentage = calculateSpentPercentage(totalSpent, budgetLimit)
  const isOverBudget = totalSpent > budgetLimit
  const isNearLimit = spentPercentage >= 80

  return (
    <Card
      className={cn(
        'p-6 border-2 bg-gradient-to-br from-card to-muted/30 dark:from-card dark:to-muted/10',
        className
      )}
    >
      {/* Header with agent context */}
      <div className="mb-6">
        <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">
          Agent Wallet
        </p>
        <h2 className="text-4xl font-bold text-foreground">
          {formatUSDC(balance)}
        </h2>
        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
          Agent is allocating capital for intelligence
        </p>
      </div>

      {/* Spending section */}
      <div className="space-y-4">
        {/* Budget label and values */}
        <div className="flex items-end justify-between mb-3">
          <div>
            <p className="text-xs text-muted-foreground font-medium mb-1">
              Budget Allocation
            </p>
            <p className="text-sm font-semibold text-foreground">
              Spent: ${formatUSDC(totalSpent)} / ${formatUSDC(budgetLimit)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground font-medium mb-1">
              Remaining
            </p>
            <p
              className={cn('text-sm font-semibold', {
                'text-red-600 dark:text-red-400': isOverBudget,
                'text-amber-600 dark:text-amber-400': isNearLimit && !isOverBudget,
                'text-green-600 dark:text-green-400': !isNearLimit && !isOverBudget
              })}
            >
              ${formatUSDC(Math.max(remainingBudget, 0))}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="w-full h-2 bg-muted dark:bg-muted/50 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full transition-all duration-500 ease-out',
                getBudgetBarColor(spentPercentage)
              )}
              style={{ width: `${Math.min(spentPercentage, 100)}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground text-right">
            {spentPercentage.toFixed(1)}% of budget used
          </p>
        </div>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-border/50">
        <div>
          <p className="text-xs text-muted-foreground font-medium mb-1">
            API Calls Made
          </p>
          <p className="text-lg font-semibold text-foreground">
            {Math.floor(totalSpent / 0.01)}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground font-medium mb-1">
            Avg Cost
          </p>
          <p className="text-lg font-semibold text-foreground">
            ${totalSpent > 0 ? (totalSpent / Math.floor(totalSpent / 0.01)).toFixed(4) : '0.00'} USDC
          </p>
        </div>
      </div>

      {/* Status indicator */}
      <div className="mt-6 p-3 rounded-lg bg-accent/5 dark:bg-accent/10 border border-accent/20">
        <div className="flex items-start gap-2">
          <div className="w-2 h-2 rounded-full bg-accent mt-1.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-semibold text-accent mb-0.5">
              {isOverBudget ? 'Over Budget' : isNearLimit ? 'Approaching Limit' : 'Healthy Status'}
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {isOverBudget
                ? 'Agent has exceeded budget allocation. New payments will be blocked.'
                : isNearLimit
                  ? 'Agent is approaching budget limit. Consider reviewing spending or increasing allocation.'
                  : 'Agent is operating within allocated budget with room for optimization.'}
            </p>
          </div>
        </div>
      </div>
    </Card>
  )
}
