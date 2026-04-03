'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Trash2, Plus, Play } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Invoice {
  id: string
  name: string
  amount: number
  dueDate: string
  priority: 'low' | 'medium' | 'high'
}

interface ScenarioData {
  balance: number
  expectedIncome: number
  incomeProbability: number
  invoices: Invoice[]
}

export function ScenarioSection() {
  const [scenario, setScenario] = useState<ScenarioData>({
    balance: 150000,
    expectedIncome: 80000,
    incomeProbability: 65,
    invoices: [
      {
        id: '1',
        name: 'AWS Infrastructure',
        amount: 8500,
        dueDate: '2024-04-15',
        priority: 'high'
      },
      {
        id: '2',
        name: 'Payroll - March',
        amount: 65000,
        dueDate: '2024-03-31',
        priority: 'high'
      },
      {
        id: '3',
        name: 'Office Rent',
        amount: 12000,
        dueDate: '2024-04-01',
        priority: 'high'
      },
      {
        id: '4',
        name: 'Slack Annual',
        amount: 1200,
        dueDate: '2024-04-20',
        priority: 'medium'
      },
      {
        id: '5',
        name: 'Software Licenses',
        amount: 2400,
        dueDate: '2024-04-10',
        priority: 'low'
      }
    ]
  })

  const [newInvoice, setNewInvoice] = useState({
    name: '',
    amount: '',
    dueDate: '',
    priority: 'medium' as const
  })

  const addInvoice = () => {
    if (newInvoice.name && newInvoice.amount && newInvoice.dueDate) {
      const invoice: Invoice = {
        id: Date.now().toString(),
        name: newInvoice.name,
        amount: parseFloat(newInvoice.amount),
        dueDate: newInvoice.dueDate,
        priority: newInvoice.priority
      }
      setScenario((prev) => ({
        ...prev,
        invoices: [...prev.invoices, invoice]
      }))
      setNewInvoice({
        name: '',
        amount: '',
        dueDate: '',
        priority: 'medium'
      })
    }
  }

  const removeInvoice = (id: string) => {
    setScenario((prev) => ({
      ...prev,
      invoices: prev.invoices.filter((inv) => inv.id !== id)
    }))
  }

  const totalInvoices = scenario.invoices.reduce((sum, inv) => sum + inv.amount, 0)
  const netPosition = scenario.balance - totalInvoices + scenario.expectedIncome

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500/20 text-red-700 dark:text-red-400'
      case 'medium':
        return 'bg-amber-500/20 text-amber-700 dark:text-amber-400'
      case 'low':
        return 'bg-green-500/20 text-green-700 dark:text-green-400'
      default:
        return 'bg-gray-500/20 text-gray-700 dark:text-gray-400'
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Scenario Setup</h1>
        <p className="text-muted-foreground mt-2">
          Configure your financial scenario for the agent to analyze
        </p>
      </div>

      {/* Input Section */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Financial Parameters
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              USDC Balance
            </label>
            <Input
              type="number"
              value={scenario.balance}
              onChange={(e) =>
                setScenario((prev) => ({
                  ...prev,
                  balance: parseFloat(e.target.value) || 0
                }))
              }
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Expected Income
            </label>
            <Input
              type="number"
              value={scenario.expectedIncome}
              onChange={(e) =>
                setScenario((prev) => ({
                  ...prev,
                  expectedIncome: parseFloat(e.target.value) || 0
                }))
              }
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Income Probability (%)
            </label>
            <Input
              type="number"
              min="0"
              max="100"
              value={scenario.incomeProbability}
              onChange={(e) =>
                setScenario((prev) => ({
                  ...prev,
                  incomeProbability: parseFloat(e.target.value) || 0
                }))
              }
              className="w-full"
            />
          </div>
        </div>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground font-medium">
            Total Obligations
          </p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-2">
            ${totalInvoices.toLocaleString()}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground font-medium">
            Expected Balance
          </p>
          <p
            className={cn(
              'text-2xl font-bold mt-2',
              netPosition >= 0
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
            )}
          >
            ${netPosition.toLocaleString()}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground font-medium">
            Invoices to Process
          </p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-2">
            {scenario.invoices.length}
          </p>
        </Card>
      </div>

      {/* Add Invoice Section */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Add Invoice
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-3">
          <Input
            placeholder="Invoice name"
            value={newInvoice.name}
            onChange={(e) =>
              setNewInvoice((prev) => ({ ...prev, name: e.target.value }))
            }
          />
          <Input
            placeholder="Amount"
            type="number"
            value={newInvoice.amount}
            onChange={(e) =>
              setNewInvoice((prev) => ({ ...prev, amount: e.target.value }))
            }
          />
          <Input
            placeholder="Due date"
            type="date"
            value={newInvoice.dueDate}
            onChange={(e) =>
              setNewInvoice((prev) => ({ ...prev, dueDate: e.target.value }))
            }
          />
          <select
            value={newInvoice.priority}
            onChange={(e) =>
              setNewInvoice((prev) => ({
                ...prev,
                priority: e.target.value as 'low' | 'medium' | 'high'
              }))
            }
            className="px-3 py-2 rounded-lg bg-input border border-border text-foreground text-sm"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <Button
            onClick={addInvoice}
            className="bg-accent text-accent-foreground hover:bg-accent/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add
          </Button>
        </div>
      </Card>

      {/* Invoices Table */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Invoices ({scenario.invoices.length})
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground">
                  Name
                </th>
                <th className="text-right py-3 px-4 font-semibold text-muted-foreground">
                  Amount
                </th>
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground">
                  Due Date
                </th>
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground">
                  Priority
                </th>
                <th className="text-center py-3 px-4 font-semibold text-muted-foreground">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {scenario.invoices.map((invoice) => (
                <tr
                  key={invoice.id}
                  className="border-b border-border hover:bg-muted/50 transition-colors"
                >
                  <td className="py-3 px-4 text-foreground font-medium">
                    {invoice.name}
                  </td>
                  <td className="text-right py-3 px-4 text-foreground font-semibold">
                    ${invoice.amount.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">
                    {new Date(invoice.dueDate).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={cn(
                        'px-2 py-1 rounded text-xs font-medium capitalize',
                        getPriorityColor(invoice.priority)
                      )}
                    >
                      {invoice.priority}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => removeInvoice(invoice.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Run Agent Button */}
      <Button
        size="lg"
        className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
      >
        <Play className="w-5 h-5 mr-2" />
        Run Agent Analysis
      </Button>
    </div>
  )
}
