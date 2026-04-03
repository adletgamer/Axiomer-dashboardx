'use client'

import { Card } from '@/components/ui/card'
import { AlertCircle, TrendingDown, Zap, DollarSign } from 'lucide-react'

export function DashboardSection() {
  const metrics = [
    {
      label: 'Monthly Obligations',
      value: '$45,250',
      change: '+12.5%',
      icon: DollarSign,
      color: 'text-blue-600 dark:text-blue-400'
    },
    {
      label: 'Days to Insolvency',
      value: '87 days',
      change: '-5 days',
      icon: AlertCircle,
      color: 'text-amber-600 dark:text-amber-400'
    },
    {
      label: 'Critical Invoices',
      value: '3 due',
      change: '→ $12k overdue',
      icon: TrendingDown,
      color: 'text-red-600 dark:text-red-400'
    },
    {
      label: 'Survival Score',
      value: '72%',
      change: '+8% from last check',
      icon: Zap,
      color: 'text-green-600 dark:text-green-400'
    }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Real-time cash flow analysis and survival metrics
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, idx) => {
          const Icon = metric.icon
          return (
            <Card key={idx} className="p-6">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className={`p-2 rounded-lg bg-muted ${metric.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium">
                    {metric.label}
                  </p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {metric.value}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  {metric.change}
                </p>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Recent Activity */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Recent Agent Activity
        </h2>
        <div className="space-y-3">
          {[
            {
              time: '2 mins ago',
              action: 'Evaluated invoice queue',
              result: 'Identified $12k high-priority payments'
            },
            {
              time: '15 mins ago',
              action: 'Analyzed cash position',
              result: 'Recommended 2-day payment deferral'
            },
            {
              time: '32 mins ago',
              action: 'Ran survival simulation',
              result: 'Current strategy provides 87-day runway'
            },
            {
              time: '1 hour ago',
              action: 'Initial scenario analysis',
              result: 'Scenario loaded with 24 invoices'
            }
          ].map((activity, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 pb-3 border-b border-border last:border-0"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-accent mt-2 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {activity.action}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {activity.result}
                </p>
              </div>
              <p className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                {activity.time}
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* Status Card */}
      <Card className="p-6 border border-accent/20 bg-accent/5">
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground">
            Current Survival Status
          </h3>
          <p className="text-sm text-muted-foreground">
            The agent is continuously monitoring your cash position. With the
            current strategy, you have approximately 87 days before insolvency.
            The system recommends deferring non-critical payments for 2 days.
          </p>
        </div>
      </Card>
    </div>
  )
}
