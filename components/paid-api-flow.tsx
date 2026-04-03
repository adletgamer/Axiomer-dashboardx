'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Check, AlertCircle, Loader, Zap, DollarSign, CheckCircle } from 'lucide-react'

type StepStatus = 'idle' | 'pending' | 'success' | 'failed'

interface Step {
  id: number
  title: string
  description: string
  icon: React.ReactNode
  status: StepStatus
  detail?: string
}

export function PaidAPIFlow() {
  const [activeStep, setActiveStep] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [steps, setSteps] = useState<Step[]>([
    {
      id: 1,
      title: 'API Call',
      description: 'Request revenue prediction data',
      icon: <Zap className="w-5 h-5" />,
      status: 'idle',
      detail: 'GET /predict-revenue'
    },
    {
      id: 2,
      title: '402 Payment Required',
      description: 'Server returns payment demand',
      icon: <AlertCircle className="w-5 h-5" />,
      status: 'idle',
      detail: 'Cost: 0.02 USDC'
    },
    {
      id: 3,
      title: 'Agent Signs Transaction',
      description: 'Create Stellar payment proof',
      icon: <Loader className="w-5 h-5" />,
      status: 'idle',
      detail: 'Signing with agent keypair...'
    },
    {
      id: 4,
      title: 'Payment Sent',
      description: 'Broadcast USDC transaction',
      icon: <DollarSign className="w-5 h-5" />,
      status: 'idle',
      detail: 'TX: 0x8f3...a2c1'
    },
    {
      id: 5,
      title: 'Data Returned',
      description: 'API unlocked, data received',
      icon: <CheckCircle className="w-5 h-5" />,
      status: 'idle',
      detail: 'Forecasted: $85k (72% confidence)'
    }
  ])

  // Auto-play animation
  useEffect(() => {
    if (!isAnimating) return

    const timer = setTimeout(() => {
      if (activeStep < steps.length - 1) {
        setActiveStep(activeStep + 1)
      } else {
        setIsAnimating(false)
      }
    }, 1200)

    return () => clearTimeout(timer)
  }, [activeStep, isAnimating, steps.length])

  // Update step statuses based on active step
  useEffect(() => {
    setSteps(prevSteps =>
      prevSteps.map((step, idx) => {
        if (idx < activeStep) {
          return { ...step, status: 'success' }
        } else if (idx === activeStep && isAnimating) {
          return { ...step, status: 'pending' }
        } else {
          return { ...step, status: 'idle' }
        }
      })
    )
  }, [activeStep, isAnimating])

  const handleStart = () => {
    setActiveStep(0)
    setIsAnimating(true)
  }

  const handleReset = () => {
    setActiveStep(0)
    setIsAnimating(false)
  }

  const getStatusStyles = (status: StepStatus) => {
    switch (status) {
      case 'success':
        return 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
      case 'pending':
        return 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800'
      case 'failed':
        return 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
      default:
        return 'bg-muted/30 border-border'
    }
  }

  const getIconStyles = (status: StepStatus) => {
    switch (status) {
      case 'success':
        return 'text-green-600 dark:text-green-400'
      case 'pending':
        return 'text-blue-600 dark:text-blue-400 animate-spin'
      case 'failed':
        return 'text-red-600 dark:text-red-400'
      default:
        return 'text-muted-foreground'
    }
  }

  const totalTime = 6.5 // seconds
  const totalSpent = 0.02 // USDC
  const allSuccess = activeStep === steps.length && !isAnimating

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">HTTP 402 Payment Flow</h2>
        <p className="text-sm text-muted-foreground">
          How the agent handles paid API endpoints with micropayments
        </p>
      </div>

      {/* Timeline Steps */}
      <div className="space-y-3">
        {steps.map((step, idx) => (
          <div key={step.id} className="relative">
            {/* Connector line */}
            {idx < steps.length - 1 && (
              <div
                className={`absolute left-6 top-12 w-0.5 h-8 transition-colors duration-300 ${
                  idx < activeStep ? 'bg-green-400' : 'bg-border'
                }`}
              />
            )}

            {/* Step Card */}
            <Card
              className={`p-4 border-2 transition-all duration-300 cursor-pointer ${getStatusStyles(step.status)} ${
                idx === activeStep ? 'ring-2 ring-accent ring-offset-2 dark:ring-offset-slate-950' : ''
              }`}
              onClick={() => !isAnimating && handleReset()}
            >
              <div className="flex gap-4 items-start">
                {/* Step Icon */}
                <div className="flex-shrink-0 mt-1">
                  <div className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    step.status === 'success'
                      ? 'bg-green-100 dark:bg-green-900/30'
                      : step.status === 'pending'
                        ? 'bg-blue-100 dark:bg-blue-900/30'
                        : 'bg-muted'
                  }`}>
                    {step.status === 'success' ? (
                      <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
                    ) : (
                      <div className={getIconStyles(step.status)}>
                        {step.icon}
                      </div>
                    )}
                  </div>
                </div>

                {/* Step Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-foreground">{step.title}</h3>
                    <Badge
                      variant="outline"
                      className={`text-xs font-medium transition-colors ${
                        step.status === 'success'
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-300 dark:border-green-700'
                          : step.status === 'pending'
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-700'
                            : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {step.status === 'success' ? 'Complete' : step.status === 'pending' ? 'Processing' : 'Pending'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{step.description}</p>
                  {step.detail && (
                    <p className="text-xs font-mono text-accent bg-accent/5 px-2 py-1 rounded max-w-fit">
                      {step.detail}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          </div>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        <Card className="p-4 rounded-xl border border-border">
          <p className="text-xs text-muted-foreground font-medium mb-2">Total Time</p>
          <p className="text-xl font-bold text-foreground">{totalTime}s</p>
          <p className="text-xs text-muted-foreground mt-2">End-to-end latency</p>
        </Card>

        <Card className="p-4 rounded-xl border border-border">
          <p className="text-xs text-muted-foreground font-medium mb-2">Cost</p>
          <p className="text-xl font-bold text-accent">{totalSpent.toFixed(3)} USDC</p>
          <p className="text-xs text-muted-foreground mt-2">Micropayment to agent</p>
        </Card>

        <Card className="p-4 rounded-xl border border-border">
          <p className="text-xs text-muted-foreground font-medium mb-2">Status</p>
          <p className={`text-xl font-bold ${allSuccess ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
            {allSuccess ? 'Success' : 'Ready'}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            {allSuccess ? 'Data received & unlocked' : 'Click play to start'}
          </p>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex gap-3 pt-4">
        <Button
          onClick={handleStart}
          disabled={isAnimating}
          className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg"
        >
          {isAnimating ? 'Running...' : 'Play Demo'}
        </Button>
        <Button
          onClick={handleReset}
          variant="outline"
          className="rounded-lg"
        >
          Reset
        </Button>
      </div>

      {/* Explanation Box */}
      <Card className="p-4 rounded-xl bg-accent/5 border border-accent/20">
        <h4 className="font-semibold text-foreground text-sm mb-2">How It Works</h4>
        <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
          <li>Agent requests data from paid API endpoint</li>
          <li>Server responds with HTTP 402 and payment details</li>
          <li>Agent automatically signs a Stellar transaction for the required amount</li>
          <li>Payment is broadcast on-chain to the API provider&apos;s wallet</li>
          <li>API server verifies payment and unlocks the requested data</li>
        </ol>
      </Card>
    </div>
  )
}
