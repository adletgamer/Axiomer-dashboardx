/**
 * AI Agent Decision Engine
 * Simulates decision-making logic for cashflow optimization
 */

export interface Invoice {
  id: string
  name: string
  amount: number
  dueDate: string
  priority: 'low' | 'medium' | 'high'
}

export interface ScenarioInput {
  cashBalance: number
  invoices: Invoice[]
  expectedIncome?: number
  incomeProbability?: number
}

export interface APICall {
  endpoint: string
  cost: number
  purpose: string
}

export interface PaymentAction {
  invoiceId: string
  amount: number
  delay: number
  reasoning: string
}

export interface DecisionResult {
  actions: PaymentAction[]
  apiCalls: APICall[]
  strategy: string
  riskLevel: 'low' | 'medium' | 'high'
  totalCost: number
  expectedOutcome: string
  confidence: number
}

/**
 * Main decision engine function
 * Analyzes financial scenario and returns optimized payment strategy
 */
export function makeDecision(input: ScenarioInput): DecisionResult {
  const { cashBalance, invoices, expectedIncome = 0, incomeProbability = 0 } = input

  // Calculate metrics
  const totalObligations = invoices.reduce((sum, inv) => sum + inv.amount, 0)
  const criticality = calculateCriticality(invoices, cashBalance)
  const uncertainty = calculateUncertainty(expectedIncome, incomeProbability)
  const riskOfDefault = calculateDefaultRisk(cashBalance, totalObligations)

  // Determine if we need API insights
  const apiCalls: APICall[] = []
  let totalApiCost = 0

  // Strategy 1: High uncertainty and reasonable budget → buy prediction
  if (uncertainty > 0.6 && cashBalance > 5000) {
    const predictionCost = 0.02
    apiCalls.push({
      endpoint: '/predict-revenue',
      cost: predictionCost,
      purpose: 'Forecast incoming cash flows'
    })
    totalApiCost += predictionCost
  }

  // Strategy 2: High risk and we have insights budget → call priority API
  if (riskOfDefault > 0.7 && cashBalance > 1000 && totalApiCost < 0.05) {
    const priorityCost = 0.01
    apiCalls.push({
      endpoint: '/prioritize-payments',
      cost: priorityCost,
      purpose: 'Optimize payment order to minimize default risk'
    })
    totalApiCost += priorityCost
  }

  // Strategy 3: Medium uncertainty and low cost → get market data
  if (uncertainty > 0.4 && cashBalance > 2000 && totalApiCost < 0.03) {
    const marketCost = 0.005
    apiCalls.push({
      endpoint: '/market-conditions',
      cost: marketCost,
      purpose: 'Check liquidity conditions'
    })
    totalApiCost += marketCost
  }

  // Generate payment actions based on risk level
  const actions = generatePaymentActions(
    invoices,
    cashBalance - totalApiCost,
    riskOfDefault,
    expectedIncome,
    incomeProbability
  )

  // Determine overall strategy
  let strategy = ''
  let confidence = 0

  if (riskOfDefault > 0.8) {
    strategy = 'Emergency Mode: Prioritize critical payments, defer non-urgent obligations'
    confidence = 0.75
  } else if (riskOfDefault > 0.5) {
    strategy = 'Conservative: Pay high-priority invoices, negotiate terms on others'
    confidence = 0.85
  } else if (uncertainty > 0.6) {
    strategy = 'Optimized: Use predictions to stagger payments and maintain optionality'
    confidence = apiCalls.length > 0 ? 0.92 : 0.80
  } else {
    strategy = 'Standard: Execute planned payment schedule'
    confidence = 0.95
  }

  return {
    actions,
    apiCalls,
    strategy,
    riskLevel: riskOfDefault > 0.7 ? 'high' : riskOfDefault > 0.4 ? 'medium' : 'low',
    totalCost: totalApiCost,
    expectedOutcome: `Payment strategy viable with ${(confidence * 100).toFixed(0)}% confidence`,
    confidence
  }
}

/**
 * Calculate criticality score based on overdue invoices and high-priority items
 */
function calculateCriticality(invoices: Invoice[], balance: number): number {
  const today = new Date()
  const overdue = invoices.filter(inv => new Date(inv.dueDate) < today)
  const highPriority = invoices.filter(inv => inv.priority === 'high')

  let score = 0
  score += overdue.length * 0.3
  score += highPriority.length * 0.2
  score += Math.max(0, (invoices.reduce((sum, inv) => sum + inv.amount, 0) - balance) / 100000)

  return Math.min(1, score)
}

/**
 * Calculate uncertainty based on income probability and gap
 */
function calculateUncertainty(expectedIncome: number, probability: number): number {
  if (expectedIncome === 0) return 1.0
  if (probability > 90) return 0.1
  if (probability > 70) return 0.3
  if (probability > 50) return 0.6
  return 0.9
}

/**
 * Calculate probability of default (0-1 scale)
 */
function calculateDefaultRisk(balance: number, totalObligations: number): number {
  if (balance <= 0) return 1.0
  if (balance >= totalObligations * 2) return 0.1
  if (balance >= totalObligations) return 0.2
  if (balance >= totalObligations * 0.5) return 0.5
  return 0.8
}

/**
 * Generate ordered list of payment actions
 */
function generatePaymentActions(
  invoices: Invoice[],
  availableBalance: number,
  riskLevel: number,
  expectedIncome: number,
  incomeProbability: number
): PaymentAction[] {
  // Sort invoices by priority and due date
  const sortedInvoices = [...invoices].sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    }
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  })

  const actions: PaymentAction[] = []
  let remainingBalance = availableBalance

  for (const invoice of sortedInvoices) {
    if (remainingBalance <= 0) break

    // High risk = pay everything immediately
    // Medium risk = prioritize and spread
    // Low risk = optimize timing
    let delay = 0
    if (riskLevel < 0.3 && invoice.priority === 'low') {
      delay = 7 // Can wait a week for low-priority items
    } else if (riskLevel < 0.5 && invoice.priority !== 'high') {
      delay = 3 // Can wait 3 days for medium priority
    }

    if (remainingBalance >= invoice.amount) {
      actions.push({
        invoiceId: invoice.id,
        amount: invoice.amount,
        delay,
        reasoning:
          riskLevel > 0.7
            ? 'Critical: Pay now to avoid default'
            : delay > 0
              ? `Safe to defer ${delay} days, optimize cash timing`
              : 'Standard payment schedule'
      })
      remainingBalance -= invoice.amount
    } else if (remainingBalance > 0 && riskLevel > 0.6) {
      // In crisis mode, make partial payments
      actions.push({
        invoiceId: invoice.id,
        amount: remainingBalance,
        delay: 0,
        reasoning: 'Partial payment to preserve some credibility'
      })
      remainingBalance = 0
    }
  }

  return actions
}
