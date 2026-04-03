'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ChevronDown, ChevronUp, Clock, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'

interface TimelineStep {
  id: string
  timestamp: string
  action: string
  status: 'pending' | 'success' | 'failed' | 'processing'
  details: string
  duration?: string
  metadata?: Record<string, string | number>
}

export function DecisionTimeline() {
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set(['1', '2', '3']))

  const steps: TimelineStep[] = [
    {
      id: '1',
      timestamp: '14:32:45.123',
      action: 'Detecting Uncertainty',
      status: 'success',
      details: 'Agent initialized to evaluate cash flow survival options with current obligations',
      duration: '2.1s',
      metadata: {
        'Total Obligations': '$12,450',
        'Current Balance': '$5,200',
        'Survival Days': '42 days'
      }
    },
    {
      id: '2',
      timestamp: '14:32:47.245',
      action: 'Calling /predict-revenue API',
      status: 'success',
      details: 'Invoking revenue prediction model to forecast incoming payments from pending contracts',
      duration: '1.8s',
      metadata: {
        'Expected Revenue': '$8,500',
        'Confidence': '87%',
        'Time Window': '14 days'
      }
    },
    {
      id: '3',
      timestamp: '14:32:49.089',
      action: 'Evaluating Invoice Priorities',
      status: 'success',
      details: 'Analyzing invoice priority matrix and determining optimal payment sequence',
      duration: '0.6s',
      metadata: {
        'Critical': '3 invoices',
        'Medium': '5 invoices',
        'Low': '8 invoices'
      }
    },
    {
      id: '4',
      timestamp: '14:32:49.712',
      action: 'Signing Stellar Transaction',
      status: 'success',
      details: 'Agent generated and signed transaction for $0.02 USDC test payment to AWS',
      duration: '0.9s',
      metadata: {
        'Amount': '$0.02 USDC',
        'Recipient': 'aws-payments.stellar',
        'TX Hash': '8f2a4c9...b1e2'
      }
    },
    {
      id: '5',
      timestamp: '14:32:50.634',
      action: 'Broadcasting Payment',
      status: 'success',
      details: 'Payment transaction submitted to Stellar network and confirmed on ledger',
      duration: '0.4s',
      metadata: {
        'Status': 'Confirmed',
        'Block': '48,392,102',
        'Fee': '100 stroops'
      }
    },
    {
      id: '6',
      timestamp: '14:32:51.022',
      action: 'Updating Decision Record',
      status: 'processing',
      details: 'Recording agent decision and payment outcome to decision log for audit trail',
      duration: '0.3s',
      metadata: {
        'Decision Type': 'test_payment',
        'Confidence': '94%',
        'Recommendation': 'defer_non_critical'
      }
    }
  ]

  const toggleStep = (stepId: string) => {
    const newExpanded = new Set(expandedSteps)
    if (newExpanded.has(stepId)) {
      newExpanded.delete(stepId)
    } else {
      newExpanded.add(stepId)
    }
    setExpandedSteps(newExpanded)
  }

  const getStatusIcon = (status: TimelineStep['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-500" />
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-500" />
      case 'processing':
        return <Loader2 className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-spin" />
      default:
        return <Clock className="w-5 h-5 text-muted-foreground" />
    }
  }

  const getStatusColor = (status: TimelineStep['status']) => {
    switch (status) {
      case 'success':
        return 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800'
      case 'failed':
        return 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800'
      case 'processing':
        return 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800'
      default:
        return 'bg-muted border-border'
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Decision Timeline</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Step-by-step execution of AI agent decision-making process
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-accent">6 steps</p>
          <p className="text-xs text-muted-foreground">Execution time: 5.9s</p>
        </div>
      </div>

      <div className="space-y-3">
        {steps.map((step, index) => (
          <Card
            key={step.id}
            className={cn(
              'border-l-4 transition-all cursor-pointer hover:shadow-md',
              getStatusColor(step.status),
              step.status === 'success' && 'border-l-green-600 dark:border-l-green-500',
              step.status === 'failed' && 'border-l-red-600 dark:border-l-red-500',
              step.status === 'processing' && 'border-l-blue-600 dark:border-l-blue-400',
              step.status === 'pending' && 'border-l-muted-foreground'
            )}
            onClick={() => toggleStep(step.id)}
          >
            <div className="p-4">
              {/* Header Row */}
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  {/* Step Number Circle */}
                  <div className="flex-shrink-0 mt-1">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                      {index + 1}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground truncate">{step.action}</h3>
                      <Badge
                        variant={
                          step.status === 'success'
                            ? 'secondary'
                            : step.status === 'failed'
                              ? 'destructive'
                              : 'secondary'
                        }
                        className={cn(
                          'ml-2 flex-shrink-0',
                          step.status === 'success' && 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300',
                          step.status === 'processing' && 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300'
                        )}
                      >
                        {step.status === 'processing' ? 'Processing' : step.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {step.timestamp} {step.duration && `(${step.duration})`}
                    </p>
                  </div>
                </div>

                {/* Icon and Toggle */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {getStatusIcon(step.status)}
                  {expandedSteps.has(step.id) ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
              </div>

              {/* Details (Expandable) */}
              {expandedSteps.has(step.id) && (
                <div className="mt-4 pt-4 border-t border-border space-y-3">
                  <div>
                    <p className="text-sm text-foreground">{step.details}</p>
                  </div>

                  {/* Metadata */}
                  {step.metadata && (
                    <div className="bg-card/50 dark:bg-background/50 rounded-sm p-3 space-y-2">
                      {Object.entries(step.metadata).map(([key, value]) => (
                        <div key={key} className="flex justify-between items-center gap-4">
                          <span className="text-xs text-muted-foreground font-medium">{key}</span>
                          <span className="text-sm font-semibold text-foreground text-right">{value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Summary Footer */}
      <Card className="bg-accent/5 dark:bg-accent/10 border-accent/20 p-4">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-foreground text-sm">
              Decision Ready: Agent recommends deferring non-critical payments for 3 days
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              This action preserves $650 liquidity while maintaining critical operational payments. Revenue prediction confidence: 87%
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
