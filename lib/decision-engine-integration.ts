/**
 * Integration helpers for the decision engine
 * Shows how to use the engine with UI components
 */

import {
  makeDecision,
  type ScenarioInput,
  type DecisionResult,
} from './decision-engine'

/**
 * Example: Run decision engine on a financial scenario
 * This can be called from UI components to generate agent decisions
 */
export function runAgentDecision(scenario: ScenarioInput): DecisionResult {
  console.log('[Decision Engine] Analyzing scenario:', scenario)

  const result = makeDecision(scenario)

  console.log('[Decision Engine] Decision result:', result)
  console.log('[Decision Engine] Strategy:', result.strategy)
  console.log('[Decision Engine] Confidence:', result.confidence)
  console.log('[Decision Engine] API calls:', result.apiCalls)
  console.log('[Decision Engine] Actions:', result.actions)

  return result
}

/**
 * Example usage in a React component:
 *
 * import { runAgentDecision } from '@/lib/decision-engine-integration'
 *
 * function MyComponent() {
 *   const scenario = {
 *     cashBalance: 150000,
 *     invoices: [...],
 *     expectedIncome: 80000,
 *     incomeProbability: 65
 *   }
 *
 *   const result = runAgentDecision(scenario)
 *
 *   return (
 *     <div>
 *       <p>Strategy: {result.strategy}</p>
 *       <p>Risk Level: {result.riskLevel}</p>
 *       <ul>
 *         {result.actions.map(action => (
 *           <li key={action.invoiceId}>{action.reasoning}</li>
 *         ))}
 *       </ul>
 *       <ul>
 *         {result.apiCalls.map(call => (
 *           <li key={call.endpoint}>{call.endpoint}: ${call.cost}</li>
 *         ))}
 *       </ul>
 *     </div>
 *   )
 * }
 */

/**
 * Format decision result for display
 */
export function formatDecisionResult(result: DecisionResult) {
  return {
    summary: {
      strategy: result.strategy,
      riskLevel: result.riskLevel,
      confidence: `${(result.confidence * 100).toFixed(0)}%`,
      totalCost: `$${result.totalCost.toFixed(2)} USDC`,
    },
    apiCalls: result.apiCalls.map((call) => ({
      endpoint: call.endpoint,
      cost: `$${call.cost.toFixed(3)} USDC`,
      purpose: call.purpose,
    })),
    actions: result.actions.map((action) => ({
      invoiceId: action.invoiceId,
      amount: `$${action.amount.toLocaleString()}`,
      delay: action.delay > 0 ? `${action.delay} days` : 'Immediate',
      reasoning: action.reasoning,
    })),
  }
}

/**
 * Example decision output for demo purposes
 */
export function getExampleDecision(): DecisionResult {
  return {
    actions: [
      {
        invoiceId: 'aws-001',
        amount: 8500,
        delay: 0,
        reasoning: 'Critical: Pay now to avoid default',
      },
      {
        invoiceId: 'payroll-001',
        amount: 65000,
        delay: 0,
        reasoning: 'Critical: Pay now to avoid default',
      },
      {
        invoiceId: 'rent-001',
        amount: 12000,
        delay: 0,
        reasoning: 'Critical: Pay now to avoid default',
      },
      {
        invoiceId: 'slack-001',
        amount: 1200,
        delay: 3,
        reasoning: 'Safe to defer 3 days, optimize cash timing',
      },
    ],
    apiCalls: [
      {
        endpoint: '/predict-revenue',
        cost: 0.02,
        purpose: 'Forecast incoming cash flows',
      },
      {
        endpoint: '/prioritize-payments',
        cost: 0.01,
        purpose: 'Optimize payment order to minimize default risk',
      },
    ],
    strategy:
      'Emergency Mode: Prioritize critical payments, defer non-urgent obligations',
    riskLevel: 'high',
    totalCost: 0.03,
    expectedOutcome: 'Payment strategy viable with 75% confidence',
    confidence: 0.75,
  }
}
