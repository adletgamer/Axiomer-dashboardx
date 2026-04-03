'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ThumbsUp, ThumbsDown, Clock, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

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
}

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
      rationale:
        'Invoice is 3 days overdue. Current cash position allows payment without reducing runway below 85 days.',
      userAction: 'approved'
    },
    {
      id: '2',
      timestamp: '2024-03-28 14:15:00',
      type: 'deferral',
      title: 'Defer Non-Critical Payments',
      description: 'Postpone Notion Pro ($150), GitHub Enterprise ($500) for 3 days',
      confidence: 87,
      impact: 'medium',
      rationale:
        'These payments are low-priority and deferring them by 3 days will preserve $650 of liquidity without impacting operations.',
      userAction: 'approved'
    },
    {
      id: '3',
      timestamp: '2024-03-28 12:45:00',
      type: 'risk',
      title: 'Payroll Coverage Alert',
      description: 'Current cash may be insufficient for full payroll on March 31',
      confidence: 76,
      impact: 'high',
      rationale:
        'Expected March revenue ($80k @ 65% probability) is critical. With deferred payments, coverage improves to 92%.',
      userAction: 'pending'
    },
    {
      id: '4',
      timestamp: '2024-03-28 10:20:00',
      type: 'optimization',
      title: 'Optimize Payment Order',
      description: 'Sequence 12 invoices to minimize overdraft risk',
      confidence: 89,
      impact: 'medium',
      rationale:
        'Processing highest-priority invoices first (payroll, rent) ensures critical obligations are met under all scenarios.',
      userAction: 'approved'
    },
    {
      id: '5',
      timestamp: '2024-03-27 16:10:00',
      type: 'risk',
      title: 'Insufficient Runway',
      description: 'Cash flow deficit detected without revenue injection',
      confidence: 91,
      impact: 'high',
      rationale:
        'Current obligations ($89.5k) exceed available cash ($87k). Immediate revenue injection of $5k+ needed within 3 days.',
      userAction: 'approved'
    },
    {
      id: '6',
      timestamp: '2024-03-27 13:35:00',
      type: 'optimization',
      title: 'Negotiate Extended Terms',
      description: 'Request 7-day payment extension for non-critical vendors',
      confidence: 72,
      impact: 'medium',
      rationale:
        'Vendors like DataDog and Vercel typically allow extended terms. This would add $3.3k to immediate runway.',
      userAction: 'pending'
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
      userAction: 'approved'
    }
  ]

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'payment':
        return 'bg-blue-500/20 text-blue-700 dark:text-blue-400'
      case 'deferral':
        return 'bg-amber-500/20 text-amber-700 dark:text-amber-400'
      case 'risk':
        return 'bg-red-500/20 text-red-700 dark:text-red-400'
      case 'optimization':
        return 'bg-green-500/20 text-green-700 dark:text-green-400'
      default:
        return 'bg-gray-500/20 text-gray-700 dark:text-gray-400'
    }
  }

  const getTypeLabel = (type: string) => {
    return type
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')
  }

  const getActionIcon = (action?: string) => {
    switch (action) {
      case 'approved':
        return <ThumbsUp className="w-4 h-4 text-green-600 dark:text-green-400" />
      case 'rejected':
        return <ThumbsDown className="w-4 h-4 text-red-600 dark:text-red-400" />
      default:
        return <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
    }
  }

  const stats = {
    approved: decisions.filter((d) => d.userAction === 'approved').length,
    rejected: decisions.filter((d) => d.userAction === 'rejected').length,
    pending: decisions.filter((d) => d.userAction === 'pending').length,
    avgConfidence: Math.round(
      decisions.reduce((sum, d) => sum + d.confidence, 0) / decisions.length
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Agent Decisions</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground font-medium">
            Approved Decisions
          </p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-2">
            {stats.approved}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground font-medium">
            Pending Review
          </p>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-2">
            {stats.pending}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground font-medium">
            Rejected Decisions
          </p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-2">
            {stats.rejected}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground font-medium">
            Avg. Confidence
          </p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-2">
            {stats.avgConfidence}%
          </p>
        </Card>
      </div>

      {/* Decisions List */}
      <div className="space-y-3">
        {decisions.map((decision) => (
          <Card key={decision.id} className="p-6 hover:shadow-md transition-shadow">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <Badge className={cn('text-xs font-medium', getTypeColor(decision.type))}>
                      {getTypeLabel(decision.type)}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-xs font-medium',
                        decision.impact === 'high'
                          ? 'border-red-300 text-red-700 dark:text-red-400 dark:border-red-700'
                          : decision.impact === 'medium'
                            ? 'border-amber-300 text-amber-700 dark:text-amber-400 dark:border-amber-700'
                            : 'border-green-300 text-green-700 dark:text-green-400 dark:border-green-700'
                      )}
                    >
                      {decision.impact.charAt(0).toUpperCase() + decision.impact.slice(1)}{' '}
                      Impact
                    </Badge>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">
                    {decision.title}
                  </h3>
                  <p className="text-muted-foreground text-sm mt-1">
                    {decision.description}
                  </p>
                </div>

                {/* Action */}
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
                    {getActionIcon(decision.userAction)}
                  </div>
                  <p className="text-xs text-muted-foreground font-medium capitalize">
                    {decision.userAction || 'pending'}
                  </p>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-border" />

              {/* Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground font-medium mb-1">
                    Confidence Score
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent"
                        style={{
                          width: `${decision.confidence}%`
                        }}
                      />
                    </div>
                    <p className="text-sm font-semibold text-foreground whitespace-nowrap">
                      {decision.confidence}%
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground font-medium mb-1">
                    Timestamp
                  </p>
                  <p className="text-sm text-foreground">{decision.timestamp}</p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground font-medium mb-1">
                    Status
                  </p>
                  <p className="text-sm capitalize">
                    <Badge
                      className={cn(
                        'text-xs font-medium',
                        decision.userAction === 'approved'
                          ? 'bg-green-500/20 text-green-700 dark:text-green-400'
                          : decision.userAction === 'rejected'
                            ? 'bg-red-500/20 text-red-700 dark:text-red-400'
                            : 'bg-amber-500/20 text-amber-700 dark:text-amber-400'
                      )}
                    >
                      {decision.userAction || 'pending'}
                    </Badge>
                  </p>
                </div>
              </div>

              {/* Rationale */}
              <div className="bg-muted/50 rounded-lg p-4 border border-border">
                <p className="text-xs text-muted-foreground font-semibold mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  AI Rationale
                </p>
                <p className="text-sm text-foreground leading-relaxed">
                  {decision.rationale}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Info Card */}
      <Card className="p-4 border border-accent/20 bg-accent/5">
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">How it works:</span> The
          AI Cashflow Survival Agent analyzes your financial position and generates
          decisions to optimize cash flow and ensure survival. Review each
          decision&apos;s rationale and approve or reject based on your business
          context.
        </p>
      </Card>
    </div>
  )
}
