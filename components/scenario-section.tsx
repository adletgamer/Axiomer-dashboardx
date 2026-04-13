'use client'

import { useState, useRef, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Trash2, Plus, Play, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

interface Invoice {
  id: string
  name: string
  amount: number
  dueDate: string
  priority: 'low' | 'medium' | 'high'
}

interface ScenarioData {
  balance: number
  token: string
  expectedIncome: number
  incomeProbability: number
  invoices: Invoice[]
  gasless: boolean
}

const TOKENS = [
  { symbol: 'USDC',  desc: 'USD Coin on Stellar',        color: 'text-blue-400',   bg: 'bg-blue-500/10' },
  { symbol: 'XLM',   desc: 'Native Stellar Lumens',       color: 'text-cyan-400',   bg: 'bg-cyan-500/10' },
  { symbol: 'yXLM',  desc: 'Yield XLM (governance)',      color: 'text-violet-400', bg: 'bg-violet-500/10' },
]

// ── Odometer-style animated number ──────────────────────────────────────────
function AnimatedNumber({ value, prefix = '$', suffix = '' }: { value: number; prefix?: string; suffix?: string }) {
  const [displayed, setDisplayed] = useState(value)
  const prevRef = useRef(value)

  useEffect(() => {
    const from = prevRef.current
    const to = value
    prevRef.current = value
    if (from === to) return

    const steps = 24
    const delta = (to - from) / steps
    let step = 0
    const id = setInterval(() => {
      step++
      setDisplayed(Math.round(from + delta * step))
      if (step >= steps) { clearInterval(id); setDisplayed(to) }
    }, 22)
    return () => clearInterval(id)
  }, [value])

  return (
    <span>
      {prefix}{displayed.toLocaleString()}{suffix}
    </span>
  )
}

// ── Token Selector ────────────────────────────────────────────────────────────
function TokenSelector({ token, onChange }: { token: string; onChange: (t: string) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const current = TOKENS.find(t => t.symbol === token) ?? TOKENS[0]

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-semibold transition-colors',
          current.bg, current.color, 'border-current/30 hover:border-current/60'
        )}
      >
        {current.symbol}
        <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', open && 'rotate-180')} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute top-full mt-1 left-0 z-50 w-52 rounded-xl bg-popover border border-border shadow-xl overflow-hidden"
          >
            {TOKENS.map(t => (
              <button
                key={t.symbol}
                onClick={() => { onChange(t.symbol); setOpen(false) }}
                className={cn(
                  'w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors',
                  t.symbol === token && 'bg-muted/60'
                )}
              >
                <span className={cn('text-sm font-bold mt-0.5 w-12', t.color)}>{t.symbol}</span>
                <span className="text-xs text-muted-foreground leading-snug">{t.desc}</span>
              </button>
            ))}
            {/* Stellar ecosystem badge */}
            <div className="px-4 py-2 bg-muted/30 border-t border-border">
              <p className="text-[10px] text-muted-foreground font-mono">Stellar eSpace · SEP-38 compliant</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────
export function ScenarioSection() {
  const [scenario, setScenario] = useState<ScenarioData>({
    balance: 150000,
    token: 'USDC',
    expectedIncome: 80000,
    incomeProbability: 65,
    gasless: false,
    invoices: [
      { id: '1', name: 'AWS Infrastructure', amount: 8500,  dueDate: '2024-04-15', priority: 'high' },
      { id: '2', name: 'Payroll - March',    amount: 65000, dueDate: '2024-03-31', priority: 'high' },
      { id: '3', name: 'Office Rent',         amount: 12000, dueDate: '2024-04-01', priority: 'high' },
      { id: '4', name: 'Slack Annual',        amount: 1200,  dueDate: '2024-04-20', priority: 'medium' },
      { id: '5', name: 'Software Licenses',   amount: 2400,  dueDate: '2024-04-10', priority: 'low' },
    ]
  })

  const [newInvoice, setNewInvoice] = useState<{ name: string; amount: string; dueDate: string; priority: 'low' | 'medium' | 'high' }>({ name: '', amount: '', dueDate: '', priority: 'medium' })

  const addInvoice = () => {
    if (newInvoice.name && newInvoice.amount && newInvoice.dueDate) {
      const invoice: Invoice = {
        id: Date.now().toString(),
        name: newInvoice.name,
        amount: parseFloat(newInvoice.amount),
        dueDate: newInvoice.dueDate,
        priority: newInvoice.priority,
      }
      setScenario(prev => ({ ...prev, invoices: [...prev.invoices, invoice] }))
      setNewInvoice({ name: '', amount: '', dueDate: '', priority: 'medium' })
    }
  }

  const removeInvoice = (id: string) =>
    setScenario(prev => ({ ...prev, invoices: prev.invoices.filter(inv => inv.id !== id) }))

  const totalInvoices = scenario.invoices.reduce((sum, inv) => sum + inv.amount, 0)
  const netPosition = scenario.balance - totalInvoices + scenario.expectedIncome

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500/20 text-red-400'
      case 'medium': return 'bg-amber-500/20 text-amber-400'
      case 'low': return 'bg-green-500/20 text-green-400'
      default: return 'bg-muted text-muted-foreground'
    }
  }

  const currentToken = TOKENS.find(t => t.symbol === scenario.token) ?? TOKENS[0]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Scenario Setup</h1>
        <p className="text-muted-foreground mt-1 text-sm">Configure your financial scenario for AI analysis on Stellar</p>
      </div>

      {/* Financial Parameters */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-semibold text-foreground">Financial Parameters</h2>
          <TokenSelector
            token={scenario.token}
            onChange={(t) => setScenario(prev => ({ ...prev, token: t }))}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-2">
              <span className={currentToken.color}>{currentToken.symbol}</span> Balance
            </label>
            <Input
              type="number"
              value={scenario.balance}
              onChange={(e) => setScenario(prev => ({ ...prev, balance: parseFloat(e.target.value) || 0 }))}
              className="w-full font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-foreground mb-2">Expected Income</label>
            <Input
              type="number"
              value={scenario.expectedIncome}
              onChange={(e) => setScenario(prev => ({ ...prev, expectedIncome: parseFloat(e.target.value) || 0 }))}
              className="w-full font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-foreground mb-2">Income Probability (%)</label>
            <Input
              type="number"
              min="0"
              max="100"
              value={scenario.incomeProbability}
              onChange={(e) => setScenario(prev => ({ ...prev, incomeProbability: parseFloat(e.target.value) || 0 }))}
              className="w-full font-mono"
            />
          </div>
        </div>

        {/* Gasless/Sponsored toggle */}
        <div className="mt-5 pt-5 border-t border-border">
          <div className="flex items-start gap-3">
            <button
              onClick={() => setScenario(prev => ({ ...prev, gasless: !prev.gasless }))}
              className={cn(
                'relative w-10 h-5 rounded-full transition-colors flex-shrink-0 mt-0.5',
                scenario.gasless ? 'bg-accent' : 'bg-muted'
              )}
            >
              <span className={cn(
                'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform',
                scenario.gasless ? 'translate-x-5' : 'translate-x-0.5'
              )} />
            </button>
            <div>
              <p className="text-sm font-semibold text-foreground">
                Gasless Mode (Sponsored)
                <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-400 align-middle">SEP-27</span>
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Use Stellar's transaction sponsorship protocol — fee budget covered by the sponsoring account, not the agent.
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground font-medium">Total Obligations</p>
          <p className="text-2xl font-bold text-red-400 mt-1 font-mono">
            <AnimatedNumber value={totalInvoices} />
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground font-medium">Expected Balance</p>
          <p className={cn('text-2xl font-bold mt-1 font-mono', netPosition >= 0 ? 'text-green-400' : 'text-red-400')}>
            <AnimatedNumber value={netPosition} />
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground font-medium">Invoices to Process</p>
          <p className="text-2xl font-bold text-accent mt-1">{scenario.invoices.length}</p>
        </Card>
      </div>

      {/* Add Invoice */}
      <Card className="p-6">
        <h2 className="text-sm font-semibold text-foreground mb-4">Add Invoice</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-3">
          <Input placeholder="Invoice name" value={newInvoice.name}
            onChange={(e) => setNewInvoice(prev => ({ ...prev, name: e.target.value }))} />
          <Input placeholder="Amount" type="number" value={newInvoice.amount}
            onChange={(e) => setNewInvoice(prev => ({ ...prev, amount: e.target.value }))} />
          <Input placeholder="Due date" type="date" value={newInvoice.dueDate}
            onChange={(e) => setNewInvoice(prev => ({ ...prev, dueDate: e.target.value }))} />
          <select
            value={newInvoice.priority}
            onChange={(e) => setNewInvoice(prev => ({ ...prev, priority: e.target.value as 'low' | 'medium' | 'high' }))}
            className="px-3 py-2 rounded-lg bg-input border border-border text-foreground text-sm"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <Button onClick={addInvoice} className="bg-accent hover:bg-accent/90 text-accent-foreground">
            <Plus className="w-4 h-4 mr-1.5" /> Add
          </Button>
        </div>
      </Card>

      {/* Invoices Table */}
      <Card className="p-6">
        <h2 className="text-sm font-semibold text-foreground mb-4">Invoices ({scenario.invoices.length})</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {['Name', 'Amount', 'Due Date', 'Priority', 'Action'].map(h => (
                  <th key={h} className={cn('py-3 px-4 font-semibold text-muted-foreground text-xs',
                    h === 'Amount' ? 'text-right' : h === 'Action' ? 'text-center' : 'text-left')}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {scenario.invoices.map((invoice) => (
                  <motion.tr
                    key={invoice.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 8 }}
                    className="border-b border-border hover:bg-muted/30 transition-colors"
                  >
                    <td className="py-3 px-4 font-medium text-foreground">{invoice.name}</td>
                    <td className="text-right py-3 px-4 font-mono font-semibold text-foreground">
                      ${invoice.amount.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground text-xs">
                      {new Date(invoice.dueDate).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className={cn('px-2 py-1 rounded text-[10px] font-semibold capitalize', getPriorityColor(invoice.priority))}>
                        {invoice.priority}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button onClick={() => removeInvoice(invoice.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </Card>

      {/* Run Agent */}
      <Button size="lg" className="w-full bg-gradient-to-r from-accent to-indigo-600 hover:from-accent/90 hover:to-indigo-700 text-white font-semibold shadow-lg shadow-accent/20">
        <Play className="w-5 h-5 mr-2" />
        Run Agent Analysis
        {scenario.gasless && (
          <span className="ml-2 text-[10px] opacity-80 font-mono">[gasless · SEP-27]</span>
        )}
      </Button>
    </div>
  )
}
