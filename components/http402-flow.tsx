'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Zap,
  Globe,
  Wallet,
  Lock,
  Database,
  Clock
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState, useEffect } from 'react'

interface FlowStep {
  id: number
  title: string
  description: string
  icon: React.ReactNode
  status: 'pending' | 'active' | 'completed' | 'error'
  details: string[]
  color: string
}

export function HTTP402PaymentFlow() {
  const [activeStep, setActiveStep] = useState(0)
  const [isAnimating, setIsAnimating] = useState(true)

  useEffect(() => {
    if (!isAnimating) return

    const interval = setInterval(() => {
      setActiveStep((prev) => (prev < 4 ? prev + 1 : 0))
    }, 3500)

    return () => clearInterval(interval)
  }, [isAnimating])

  const steps: FlowStep[] = [
    {
      id: 1,
      title: 'API Request',
      description: 'Client sends request to restricted API endpoint',
      icon: <Globe className="w-6 h-6" />,
      status: activeStep >= 0 ? 'completed' : 'pending',
      details: ['GET /api/premium-data', 'Authorization header missing premium token', 'Content-Type: application/json'],
      color: 'from-blue-500 to-blue-600'
    },
    {
      id: 2,
      title: '402 Response',
      description: 'Server returns HTTP 402 Payment Required',
      icon: <AlertCircle className="w-6 h-6" />,
      status: activeStep >= 1 ? (activeStep === 1 ? 'active' : 'completed') : 'pending',
      details: [
        'HTTP/1.1 402 Payment Required',
        'Charge: 1.50 USDC',
        'Stellar-Account: gbuqwp...',
        'Stellar-Memo: premium-access-v1'
      ],
      color: 'from-amber-500 to-amber-600'
    },
    {
      id: 3,
      title: 'Sign Transaction',
      description: 'Agent signs Stellar transaction for payment',
      icon: <Lock className="w-6 h-6" />,
      status: activeStep >= 2 ? (activeStep === 2 ? 'active' : 'completed') : 'pending',
      details: [
        'Transaction: Transfer 1.50 USDC',
        'Destination: gbuqwp... (API Provider)',
        'Memo: premium-access-v1',
        'Signature: Valid'
      ],
      color: 'from-purple-500 to-purple-600'
    },
    {
      id: 4,
      title: 'Payment Sent',
      description: 'Payment confirmed on Stellar network',
      icon: <Wallet className="w-6 h-6" />,
      status: activeStep >= 3 ? (activeStep === 3 ? 'active' : 'completed') : 'pending',
      details: [
        'Status: Confirmed',
        'Amount: 1.50 USDC',
        'Block: 48,392,521',
        'Time: 2024-03-28 14:32:51.234'
      ],
      color: 'from-green-500 to-green-600'
    },
    {
      id: 5,
      title: 'API Returns Data',
      description: 'Server grants access and streams protected data',
      icon: <Database className="w-6 h-6" />,
      status: activeStep >= 4 ? (activeStep === 4 ? 'active' : 'completed') : 'pending',
      details: [
        'HTTP/1.1 200 OK',
        'X-Charge-Verified: true',
        'X-Access-Until: 2024-04-28 14:32:51',
        'Content-Length: 42580'
      ],
      color: 'from-teal-500 to-teal-600'
    }
  ]

  const getStatusColor = (status: FlowStep['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800'
      case 'active':
        return 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 ring-2 ring-blue-300 dark:ring-blue-600'
      case 'pending':
        return 'bg-muted border-border opacity-60'
      default:
        return 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800'
    }
  }

  const getStatusBadgeVariant = (status: FlowStep['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300'
      case 'active':
        return 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300'
      case 'error':
        return 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  const getStatusIcon = (status: FlowStep['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-500" />
      case 'active':
        return <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-pulse" />
      case 'pending':
        return <Clock className="w-5 h-5 text-muted-foreground" />
      default:
        return <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-500" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">HTTP 402 Payment Flow</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time visualization of API payment authorization via Stellar blockchain
          </p>
        </div>
        <button
          onClick={() => {
            setIsAnimating(!isAnimating)
            if (!isAnimating) {
              setActiveStep(0)
            }
          }}
          className="text-xs font-medium px-3 py-1 rounded-full bg-accent text-accent-foreground hover:opacity-90 transition-opacity"
        >
          {isAnimating ? 'Pause' : 'Play'}
        </button>
      </div>

      {/* Main Flow Diagram */}
      <div className="space-y-3">
        {steps.map((step, index) => (
          <div key={step.id} className="space-y-3">
            {/* Flow Card */}
            <Card
              className={cn(
                'border-l-4 transition-all duration-300',
                getStatusColor(step.status),
                step.status === 'completed' && 'border-l-green-600 dark:border-l-green-500',
                step.status === 'active' && 'border-l-blue-600 dark:border-l-blue-400',
                step.status === 'pending' && 'border-l-muted-foreground',
                step.status === 'error' && 'border-l-red-600 dark:border-l-red-500'
              )}
            >
              <div className="p-4">
                <div className="flex items-start gap-4">
                  {/* Step Number Badge */}
                  <div className="flex-shrink-0">
                    <div
                      className={cn(
                        'flex items-center justify-center w-12 h-12 rounded-full text-white transition-all duration-300',
                        step.status === 'completed' && `bg-gradient-to-br ${step.color}`,
                        step.status === 'active' && `bg-gradient-to-br ${step.color} shadow-lg scale-110`,
                        step.status === 'pending' && 'bg-muted text-muted-foreground'
                      )}
                    >
                      {step.icon}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-foreground">{step.title}</h3>
                      <Badge className={cn('flex-shrink-0', getStatusBadgeVariant(step.status))}>
                        {step.status === 'active' && 'In Progress'}
                        {step.status === 'completed' && 'Complete'}
                        {step.status === 'pending' && 'Pending'}
                        {step.status === 'error' && 'Error'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{step.description}</p>

                    {/* Details Code Block */}
                    <div className="bg-black/5 dark:bg-white/5 rounded-md p-3 font-mono text-xs leading-relaxed">
                      {step.details.map((detail, idx) => (
                        <div key={idx} className="text-muted-foreground">
                          <span className="text-muted-foreground/60">&gt;</span> {detail}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Status Icon */}
                  <div className="flex-shrink-0 mt-1">{getStatusIcon(step.status)}</div>
                </div>
              </div>
            </Card>

            {/* Arrow Between Steps */}
            {index < steps.length - 1 && (
              <div className="flex justify-center py-1">
                <div
                  className={cn(
                    'flex items-center gap-2 text-xs font-medium transition-colors duration-300',
                    activeStep > index ? 'text-green-600 dark:text-green-500' : 'text-muted-foreground'
                  )}
                >
                  <div className={cn('h-px flex-1', activeStep > index ? 'bg-green-600 dark:bg-green-500' : 'bg-border')} />
                  <ArrowRight className="w-4 h-4" />
                  <div className={cn('h-px flex-1', activeStep > index ? 'bg-green-600 dark:bg-green-500' : 'bg-border')} />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Summary Section */}
      <Card className="bg-accent/5 dark:bg-accent/10 border-accent/20 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Total Time</p>
            <p className="text-lg font-bold text-foreground">3.8 seconds</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Amount Charged</p>
            <p className="text-lg font-bold text-foreground">1.50 USDC</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Status</p>
            <p className="text-lg font-bold text-green-600 dark:text-green-500">Complete</p>
          </div>
        </div>
      </Card>

      {/* Info Box */}
      <Card className="border-2 border-accent/30 p-4 bg-background">
        <div className="flex gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <Zap className="w-5 h-5 text-accent" />
          </div>
          <div className="space-y-2">
            <p className="font-semibold text-foreground text-sm">How it works</p>
            <p className="text-sm text-muted-foreground">
              When an API endpoint charges for access, the client receives a 402 Payment Required response with payment
              details. The AI agent signs a Stellar transaction, payment is verified on-chain, and the server grants
              access. No credit cards, no KYC—just cryptographic proof of payment.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
