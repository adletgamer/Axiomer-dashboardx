'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Download, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Payment {
  id: string
  recipient: string
  amount: number
  date: string
  status: 'completed' | 'pending' | 'failed' | 'scheduled'
  reason: string
  txHash?: string
}

export function PaymentLogSection() {
  const payments: Payment[] = [
    {
      id: '1',
      recipient: 'AWS',
      amount: 8500,
      date: '2024-03-28 14:32:00',
      status: 'completed',
      reason: 'Infrastructure costs',
      txHash: 'a1b2c3d4e5f6789012345678901234a1b2c3d4e5f6789012345678901234abcd'
    },
    {
      id: '2',
      recipient: 'Stripe Processing',
      amount: 12400,
      date: '2024-03-28 11:15:00',
      status: 'completed',
      reason: 'Monthly processing fees',
      txHash: 'f7e8d9c0b1a23456789012345678901f7e8d9c0b1a2345678901234567890ab12'
    },
    {
      id: '3',
      recipient: 'DataDog',
      amount: 2800,
      date: '2024-03-27 09:20:00',
      status: 'completed',
      reason: 'Analytics & monitoring',
      txHash: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
    },
    {
      id: '4',
      recipient: 'Payroll - March',
      amount: 65000,
      date: '2024-03-31 10:00:00',
      status: 'scheduled',
      reason: 'Employee salaries'
    },
    {
      id: '5',
      recipient: 'Office Rent',
      amount: 12000,
      date: '2024-04-01 00:00:00',
      status: 'scheduled',
      reason: 'Monthly office lease'
    },
    {
      id: '6',
      recipient: 'Vercel Pro',
      amount: 240,
      date: '2024-03-26 16:45:00',
      status: 'completed',
      reason: 'Hosting platform',
      txHash: 'deadbeef1234567890abcdeadbeef1234567890abcdeadbeef1234567890abcd'
    },
    {
      id: '7',
      recipient: 'GitHub Enterprise',
      amount: 500,
      date: '2024-03-25 08:10:00',
      status: 'pending',
      reason: 'Repository management'
    },
    {
      id: '8',
      recipient: 'Notion Pro',
      amount: 150,
      date: '2024-03-24 13:22:00',
      status: 'failed',
      reason: 'Documentation platform',
      txHash: 'cafe0000deadcafe0000deadcafe0000deadcafe0000deadcafe0000deadcafe00'
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 text-green-700 dark:text-green-400'
      case 'pending':
        return 'bg-blue-500/20 text-blue-700 dark:text-blue-400'
      case 'scheduled':
        return 'bg-amber-500/20 text-amber-700 dark:text-amber-400'
      case 'failed':
        return 'bg-red-500/20 text-red-700 dark:text-red-400'
      default:
        return 'bg-gray-500/20 text-gray-700 dark:text-gray-400'
    }
  }

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1)
  }

  const totalCompleted = payments
    .filter((p) => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0)

  const totalScheduled = payments
    .filter((p) => p.status === 'scheduled')
    .reduce((sum, p) => sum + p.amount, 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Payment Log</h1>
        <p className="text-muted-foreground mt-2">
          Complete history of all payments processed by the agent
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground font-medium">
            Completed Payments
          </p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-2">
            ${totalCompleted.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            {payments.filter((p) => p.status === 'completed').length} transactions
          </p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground font-medium">
            Scheduled Payments
          </p>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-2">
            ${totalScheduled.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            {payments.filter((p) => p.status === 'scheduled').length} transactions
          </p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground font-medium">
            Total Value
          </p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-2">
            ${payments.reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            {payments.length} total transactions
          </p>
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

      {/* Payment Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border">
              <tr className="bg-muted/50">
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground">
                  Recipient
                </th>
                <th className="text-right py-3 px-4 font-semibold text-muted-foreground">
                  Amount
                </th>
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground">
                  Date
                </th>
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground">
                  Status
                </th>
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground">
                  Reason
                </th>
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground">
                  Transaction
                </th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr
                  key={payment.id}
                  className="border-b border-border hover:bg-muted/30 transition-colors"
                >
                  <td className="py-3 px-4">
                    <p className="font-medium text-foreground">
                      {payment.recipient}
                    </p>
                  </td>
                  <td className="text-right py-3 px-4">
                    <p className="font-semibold text-foreground">
                      ${payment.amount.toLocaleString()}
                    </p>
                  </td>
                  <td className="py-3 px-4">
                    <p className="text-muted-foreground text-xs">
                      {payment.date}
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
                      {payment.reason}
                    </p>
                  </td>
                  <td className="py-3 px-4">
                    {payment.txHash ? (
                      <a
                        href={`https://stellar.expert/explorer/testnet/tx/${payment.txHash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-accent hover:text-accent/80 transition-colors text-[10px] font-mono underline-offset-2 hover:underline break-all"
                      >
                        {payment.txHash.slice(0, 12)}…{payment.txHash.slice(-8)}
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

      {/* Info Card */}
      <Card className="p-4 border border-accent/20 bg-accent/5">
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">Pro Tip:</span> Use the
          filter controls to search by recipient, amount, or status. All
          completed payments include transaction hashes for verification.
        </p>
      </Card>
    </div>
  )
}
