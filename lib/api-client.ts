/**
 * API Client for the Cashflow Survival Agent backend
 * Connects frontend to real Express server with x402-like payment flow
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

export interface PaymentInstructions {
  error: string;
  price: string;
  asset: string;
  network: string;
  destination: string;
  memo: string;
  instructions: string;
}

export interface PredictionData {
  forecastedIncome: number;
  confidence: number;
  timeframe: string;
  generatedAt: string;
  breakdown: Record<string, number>;
  riskFactors: string[];
}

export interface PaidAPIResponse {
  success: boolean;
  paid: boolean;
  payment: {
    hash: string;
    from: string;
    to: string;
    amount: string;
    asset: string;
    memo: string | null;
    created_at: string;
  };
  data: PredictionData;
}

/**
 * Step 1: Call /predict-revenue without payment → get 402 with payment instructions
 */
export async function requestPrediction(): Promise<{
  status: number;
  paymentRequired?: PaymentInstructions;
  data?: PaidAPIResponse;
}> {
  const res = await fetch(`${BACKEND_URL}/api/predict-revenue`);
  const body = await res.json();

  if (res.status === 402) {
    return { status: 402, paymentRequired: body };
  }

  return { status: 200, data: body };
}

/**
 * Step 2: Retry /predict-revenue with tx_hash after payment
 */
export async function retryWithPayment(txHash: string): Promise<{
  status: number;
  data?: PaidAPIResponse;
  error?: string;
}> {
  const res = await fetch(`${BACKEND_URL}/api/predict-revenue`, {
    headers: {
      'X-Payment-Tx': txHash,
    },
  });

  const body = await res.json();

  if (res.status === 402) {
    return { status: 402, error: body.detail || body.error };
  }

  if (!res.ok) {
    return { status: res.status, error: body.error || 'Unknown error' };
  }

  return { status: 200, data: body };
}

/**
 * Health check
 */
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${BACKEND_URL}/health`);
    return res.ok;
  } catch {
    return false;
  }
}
