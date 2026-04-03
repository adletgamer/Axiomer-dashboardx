/**
 * Paid API Endpoints with HTTP 402 Payment Required Flow
 * Simulates APIs that require micropayment before returning data
 * Ready for x402 integration
 */

export interface PaymentProof {
  transactionHash: string
  amount: number
  timestamp: number
}

export interface APIResponse<T> {
  success: boolean
  data?: T
  error?: string
  status: number
  paymentRequired?: {
    endpoint: string
    cost: number
    reason: string
  }
}

/**
 * HTTP 402 Error Response
 * Returned when payment is required
 */
export function create402Error(endpoint: string, cost: number): APIResponse<null> {
  return {
    success: false,
    status: 402,
    error: 'Payment Required',
    paymentRequired: {
      endpoint,
      cost,
      reason: `Payment of ${cost} USDC required to access ${endpoint}`
    }
  }
}

/**
 * Prediction API: Forecast revenue based on historical data and market signals
 * Cost: 0.02 USDC
 */
export function predictRevenue(
  paymentProof?: PaymentProof
): APIResponse<{
  forecastedIncome: number
  confidence: number
  timeframe: string
  breakdown: Record<string, number>
}> {
  const COST = 0.02

  // Without payment proof, return 402
  if (!paymentProof) {
    return create402Error('/predict-revenue', COST)
  }

  // Validate payment
  if (paymentProof.amount < COST) {
    return {
      success: false,
      status: 402,
      error: `Insufficient payment. Required: ${COST} USDC, Received: ${paymentProof.amount} USDC`,
      paymentRequired: {
        endpoint: '/predict-revenue',
        cost: COST,
        reason: 'Payment verification failed'
      }
    }
  }

  // Return mock prediction data
  return {
    success: true,
    status: 200,
    data: {
      forecastedIncome: 85000,
      confidence: 0.72,
      timeframe: '30 days',
      breakdown: {
        'Recurring Customers': 45000,
        'New Contracts': 25000,
        'Services Revenue': 15000
      }
    }
  }
}

/**
 * Supplier Risk API: Evaluate risk profile of a supplier/creditor
 * Cost: 0.015 USDC
 */
export function supplierRisk(
  supplierId: string,
  paymentProof?: PaymentProof
): APIResponse<{
  riskScore: number
  riskLevel: 'low' | 'medium' | 'high'
  defaultProbability: number
  recommendedAction: string
  factors: Record<string, number>
}> {
  const COST = 0.015

  // Without payment proof, return 402
  if (!paymentProof) {
    return create402Error('/supplier-risk', COST)
  }

  // Validate payment
  if (paymentProof.amount < COST) {
    return {
      success: false,
      status: 402,
      error: `Insufficient payment. Required: ${COST} USDC, Received: ${paymentProof.amount} USDC`,
      paymentRequired: {
        endpoint: '/supplier-risk',
        cost: COST,
        reason: 'Payment verification failed'
      }
    }
  }

  // Return mock risk assessment
  return {
    success: true,
    status: 200,
    data: {
      riskScore: 34,
      riskLevel: 'medium',
      defaultProbability: 0.12,
      recommendedAction: 'Maintain current payment terms, monitor closely',
      factors: {
        'Payment History': 85,
        'Financial Health': 62,
        'Market Volatility': 45,
        'Industry Trends': 72
      }
    }
  }
}

/**
 * Late Penalty Calculator API: Compute penalties and interest for late payments
 * Cost: 0.01 USDC
 */
export function latePenalty(
  invoiceAmount: number,
  daysLate: number,
  paymentProof?: PaymentProof
): APIResponse<{
  basePenalty: number
  interestAccrued: number
  totalDue: number
  breakdown: {
    original: number
    penalty: number
    interest: number
  }
}> {
  const COST = 0.01

  // Without payment proof, return 402
  if (!paymentProof) {
    return create402Error('/late-penalty', COST)
  }

  // Validate payment
  if (paymentProof.amount < COST) {
    return {
      success: false,
      status: 402,
      error: `Insufficient payment. Required: ${COST} USDC, Received: ${paymentProof.amount} USDC`,
      paymentRequired: {
        endpoint: '/late-penalty',
        cost: COST,
        reason: 'Payment verification failed'
      }
    }
  }

  // Calculate mock penalties (realistic but simplified)
  const penaltyRate = 0.05 // 5% penalty
  const interestRate = 0.02 // 2% interest per 10 days
  const basePenalty = invoiceAmount * penaltyRate
  const interestAccrued = invoiceAmount * (interestRate * (daysLate / 10))

  return {
    success: true,
    status: 200,
    data: {
      basePenalty,
      interestAccrued,
      totalDue: invoiceAmount + basePenalty + interestAccrued,
      breakdown: {
        original: invoiceAmount,
        penalty: basePenalty,
        interest: interestAccrued
      }
    }
  }
}

/**
 * Helper function to simulate payment and get proof
 * In real implementation, this would interact with Stellar/blockchain
 */
export function createPaymentProof(amount: number): PaymentProof {
  return {
    transactionHash: `0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 6)}`,
    amount,
    timestamp: Date.now()
  }
}

/**
 * Example integration function showing the full flow
 */
export async function getRevenueWithPayment(amount: number = 0.02): Promise<APIResponse<any>> {
  // Step 1: Call API without payment (expect 402)
  const step1 = predictRevenue()
  if (step1.status === 402) {
    console.log('Step 1: Received 402 Payment Required')
    
    // Step 2: Create payment proof
    const proof = createPaymentProof(amount)
    console.log('Step 2: Payment signed and broadcast')
    
    // Step 3: Call API with payment proof
    const step3 = predictRevenue(proof)
    console.log('Step 3: API call successful after payment')
    
    return step3
  }
  
  return step1
}
