'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Download, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface MicropaymentEntry {
  id: string
  endpoint: string
  cost: number
  timestamp: string
  status: 'success' | 'failed'
  result: string
  txHash?: string
}

export function PaymentLogSection() {
  const micropayments: MicropaymentEntry[] = [
    {
      id: '1',
      endpoint: '/predict-revenue',
      cost: 0.02,
      timestamp: '2024-03-28 14:32:15',
      status: 'success',
      result: 'Forecasted $85k inflow (72% confidence)',
      txHash: '0x8f3...a2c1'
    },
    {
      id: '2',
      endpoint: '/prioritize-payments',
      cost: 0.01,
      timestamp: '2024-03-28 14:32:08',
      status: 'success',
      result: 'Reordered 8 invoices, optimized schedule',
      txHash: '0x3d7...f9a2'
    },
    {
      id: '3',
      endpoint: '/market-conditions',
      cost: 0.005,
      timestamp: '2024-03-28 13:45:20',
      status: 'success',
      result: 'Liquidity stable, lending rates +2%',
      txHash: '0x5b2...c4e8'
    },
    {
      id: '4',
      endpoint: '/risk-assessment',
      cost: 0.015,
      timestamp: '2024-03-28 13:44:55',
      status: 'success',
      result: 'Default risk 34%, downtrend confirmed',
      txHash: '0x9c1...b7d3'
    },
    {
      id: '5',
      endpoint: '/predict-revenue',
      cost: 0.02,
      timestamp: '2024-03-27 09:20:10',
      status: 'success',
      result: 'Forecasted $92k inflow (68% confidence)',
      txHash: '0x4a6...e9f2'
    },
    {
      id: '6',
      endpoint: '/market-conditions',
      cost: 0.005,
      timestamp: '2024-03-27 08:15:30',
      status: 'failed',
      result: 'Service timeout, using cached data',
      txHash: '0x6b2...d5f3'
    },
    {
      id: '7',
      endpoint: '/prioritize-payments',
      cost: 0.01,
      timestamp: '2024-03-26 16:45:22',
      status: 'success',
      result: 'Updated priority matrix for 12 invoices',
      txHash: '0x7c3...e6g4'
    },
    {
      id: '8',
      endpoint: '/predict-revenue',
      cost: 0.02,
      timestamp: '2024-03-26 14:20:05',
      status: 'success',
      result: 'Forecasted $78k inflow (71% confidence)',
      txHash: '0x8d4...f7h5'
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-500/20 text-green-700 dark:text-green-400'
      case 'failed':
        return 'bg-red-500/20 text-red-700 dark:text-red-400'
      default:
        return 'bg-gray-500/20 text-gray-700 dark:text-gray-400'
    }
  }

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1)
  }

  const totalSpent = micropayments.reduce((sum, m) => sum + m.cost, 0)
  const successCount = micropayments.filter((m) => m.status === 'success').length
  const successRate = ((successCount / micropayments.length) * 100).toFixed(1)

  // Calculate ROI: cost savings vs. total spent
  const estimatedSavings = 45000 // Mocked: prevented defaults, optimized schedules
  const roi = ((estimatedSavings / totalSpent) * 100).toFixed(0)

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Micropayments</h1>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground font-medium">Total Spent</p>
          <p className="text-2xl font-bold text-accent mt-2">
            ${totalSpent.toFixed(2)} USDC
          </p>
          <p className="text-xs text-muted-foreground mt-2">{micropayments.length} API calls</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground font-medium">Success Rate</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-2">
            {successRate}%
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            {successCount} successful calls
          </p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground font-medium">Est. Savings</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-2">
            ${estimatedSavings.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground mt-2">Default prevention + optimization</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground font-medium">ROI</p>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-2">
            {roi}x
          </p>
          <p className="text-xs text-muted-foreground mt-2">Return on invested USDC</p>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </div>
        <Button variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Micropayment Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border">
              <tr className="bg-muted/50">
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground">
                  API Endpoint
                </th>
                <th className="text-right py-3 px-4 font-semibold text-muted-foreground">
                  Cost
                </th>
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground">
                  Timestamp
                </th>
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground">
                  Status
                </th>
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground">
                  Result
                </th>
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground">
                  TX Hash
                </th>
              </tr>
            </thead>
            <tbody>
              {micropayments.map((payment) => (
                <tr
                  key={payment.id}
                  className="border-b border-border hover:bg-muted/30 transition-colors"
                >
                  <td className="py-3 px-4">
                    <p className="font-mono font-medium text-accent text-sm">
                      {payment.endpoint}
                    </p>
                  </td>
                  <td className="text-right py-3 px-4">
                    <p className="font-semibold text-foreground">
                      {payment.cost.toFixed(3)} USDC
                    </p>
                  </td>
                  <td className="py-3 px-4">
                    <p className="text-muted-foreground text-xs">
                      {payment.timestamp}
                    </p>
                  </td>
                  <td className="py-3 px-4">
                    <Badge
                      className={cn(
                        'text-xs font-medium',
                        getStatusColor(payment.status)
                      )}
                    >
                      {getStatusLabel(payment.status)}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    <p className="text-muted-foreground text-sm">
                      {payment.result}
                    </p>
                  </td>
                  <td className="py-3 px-4">
                    {payment.txHash ? (
                      <a
                        href="#"
                        className="text-accent hover:underline text-xs font-mono"
                      >
                        {payment.txHash}
                      </a>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
