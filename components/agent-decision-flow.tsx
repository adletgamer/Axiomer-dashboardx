'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DecisionStep {
  id: number
  title: string
  description: string
  status: 'evaluating' | 'insight_purchased' | 'action_taken' | 'pending'
  details: {
    label: string
    value: string
  }[]
  insight?: {
    endpoint: string
    cost: number
    result: string
  }
}

export function AgentDecisionFlow() {
  const [expandedStep, setExpandedStep] = useState<number | null>(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])

  const steps: DecisionStep[] = [
    {
      id: 1,
      title: 'Detecting Uncertainty',
      description: 'Analyzing cash balance vs. obligations',
      status: 'evaluating',
      details: [
        { label: 'Cash Balance', value: '$125,000' },
        { label: 'Total Obligations', value: '$180,000' },
        { label: 'Uncertainty Score', value: '72%' },
        { label: 'Decision', value: 'Need better forecasting' }
      ]
    },
    {
      id: 2,
      title: 'Calling /predict-revenue',
      description: 'Purchasing insight into incoming cash flows',
      status: 'insight_purchased',
      details: [
        { label: 'API Endpoint', value: '/predict-revenue' },
        { label: 'Cost', value: '0.02 USDC' },
        { label: 'Payment Proof', value: '0x8f3...a2c1' },
        { label: 'Status', value: 'Payment verified' }
      ],
      insight: {
        endpoint: '/predict-revenue',
        cost: 0.02,
        result: 'Forecasted $85k inflow in 30 days (72% confidence)'
      }
    },
    {
      id: 3,
      title: 'Evaluating Risk',
      description: 'Reassessing default probability with new data',
      status: 'evaluating',
      details: [
        { label: 'Previous Risk', value: '65% (high)' },
        { label: 'New Risk', value: '38% (medium)' },
        { label: 'Action Viable?', value: 'Yes' },
        { label: 'Next Step', value: 'Optimize payment timing' }
      ]
    },
    {
      id: 4,
      title: 'Paying $8,500 USDC',
      description: 'Paying critical supplier invoice',
      status: 'action_taken',
      details: [
        { label: 'Recipient', value: 'AWS Infrastructure' },
        { label: 'Amount', value: '$8,500 USDC' },
        { label: 'Priority', value: 'HIGH' },
        { label: 'TX Hash', value: '0x3d7...f9a2' }
      ]
    },
    {
      id: 5,
      title: 'Updating Decision',
      description: 'Recording action and refining strategy',
      status: 'action_taken',
      details: [
        { label: 'Remaining Balance', value: '$116,500' },
        { label: 'Remaining Obligations', value: '$171,500' },
        { label: 'Strategy Confidence', value: '89%' },
        { label: 'Next Action', value: 'Monitor cash inflow forecast' }
      ]
    }
  ]

  useEffect(() => {
    if (!isAnimating) return

    const interval = setInterval(() => {
      setCompletedSteps(prev => {
        if (prev.length < steps.length) {
          return [...prev, steps[prev.length].id]
        } else {
          setIsAnimating(false)
          return prev
        }
      })
    }, 1600)

    return () => clearInterval(interval)
  }, [isAnimating, steps.length])

  const getStatusColor = (status: DecisionStep['status']) => {
    switch (status) {
      case 'evaluating':
        return 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800'
      case 'insight_purchased':
        return 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800'
      case 'action_taken':
        return 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
      default:
        return 'bg-muted/30 border-border'
    }
  }

  const getStatusBadgeColor = (status: DecisionStep['status']) => {
    switch (status) {
      case 'evaluating':
        return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700'
      case 'insight_purchased':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-700'
      case 'action_taken':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-300 dark:border-green-700'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  const getStatusLabel = (status: DecisionStep['status']) => {
    switch (status) {
      case 'evaluating':
        return 'Evaluating'
      case 'insight_purchased':
        return 'Insight Purchased'
      case 'action_taken':
        return 'Action Taken'
      default:
        return 'Pending'
    }
  }

  const handleStartAnimation = () => {
    setCompletedSteps([])
    setIsAnimating(true)
  }

  const handleReset = () => {
    setCompletedSteps([])
    setIsAnimating(false)
    setExpandedStep(0)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Agent Decision Timeline</h2>
        <p className="text-sm text-muted-foreground">
          Step-by-step breakdown of how the AI agent makes financial decisions
        </p>
      </div>

      {/* Timeline Steps */}
      <div className="space-y-3">
        {steps.map((step, idx) => {
          const isCompleted = completedSteps.includes(step.id)
          const isExpanded = expandedStep === step.id

          return (
            <div key={step.id} className="relative">
              {/* Connector line */}
              {idx < steps.length - 1 && (
                <div
                  className={`absolute left-6 top-14 w-0.5 h-6 transition-colors duration-300 ${
                    isCompleted ? 'bg-accent' : 'bg-border'
                  }`}
                />
              )}

              {/* Step Card */}
              <Card
                className={`overflow-hidden border-2 transition-all duration-300 ${getStatusColor(step.status)} ${
                  isCompleted ? 'ring-2 ring-accent ring-offset-2 dark:ring-offset-slate-950' : ''
                }`}
              >
                <button
                  onClick={() => setExpandedStep(isExpanded ? null : step.id)}
                  className="w-full text-left p-4 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex gap-4 items-start justify-between">
                    {/* Left side - Step info */}
                    <div className="flex gap-4 flex-1 min-w-0">
                      {/* Step number circle */}
                      <div className="flex-shrink-0">
                        <div className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm transition-all',
                          isCompleted
                            ? 'bg-accent text-accent-foreground'
                            : 'bg-muted text-muted-foreground border-2 border-muted-foreground'
                        )}>
                          {isCompleted ? '✓' : step.id}
                        </div>
                      </div>

                      {/* Step content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-semibold text-foreground text-sm">{step.title}</h3>
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-xs font-medium',
                              getStatusBadgeColor(step.status)
                            )}
                          >
                            {getStatusLabel(step.status)}
                          </Badge>
                          {isCompleted && (
                            <Badge className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-300 dark:border-green-700">
                              Complete
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{step.description}</p>
                      </div>
                    </div>

                    {/* Expand button */}
                    <button
                      className="flex-shrink-0 ml-2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </button>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-current/10 bg-black/[0.02] dark:bg-white/[0.02] p-4">
                    <div className="space-y-3">
                      {/* Details table */}
                      <div className="space-y-2">
                        {step.details.map((detail, idx) => (
                          <div key={idx} className="flex justify-between items-start gap-4 py-1">
                            <span className="text-xs text-muted-foreground font-medium">{detail.label}</span>
                            <span className="text-xs font-mono text-foreground text-right">{detail.value}</span>
                          </div>
                        ))}
                      </div>

                      {/* Insight box if applicable */}
                      {step.insight && (
                        <div className="mt-3 pt-3 border-t border-current/10">
                          <div className="bg-blue-50 dark:bg-blue-950/40 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                            <p className="text-xs font-semibold text-blue-900 dark:text-blue-200 mb-1">
                              💡 Insight Purchased
                            </p>
                            <p className="text-xs text-blue-800 dark:text-blue-300">
                              {step.insight.result}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            </div>
          )
        })}
      </div>

      {/* Final Summary */}
      {completedSteps.length === steps.length && !isAnimating && (
        <Card className="p-4 rounded-xl bg-green-50 dark:bg-green-950/20 border-2 border-green-200 dark:border-green-800 animate-in fade-in">
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-xs font-bold">✓</span>
            </div>
            <div>
              <p className="font-semibold text-green-900 dark:text-green-200 text-sm mb-1">
                Decision Complete
              </p>
              <p className="text-xs text-green-800 dark:text-green-300">
                Agent executed full decision cycle with 1 insight purchase. Total cost: 0.02 USDC. 
                Forecast confidence: 89%. Ready for next evaluation cycle.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Controls */}
      <div className="flex gap-3 pt-4">
        <Button
          onClick={handleStartAnimation}
          disabled={isAnimating}
          className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg"
        >
          {isAnimating ? 'Running...' : 'Play Timeline'}
        </Button>
        <Button
          onClick={handleReset}
          variant="outline"
          className="rounded-lg"
        >
          Reset
        </Button>
      </div>
    </div>
  )
}
