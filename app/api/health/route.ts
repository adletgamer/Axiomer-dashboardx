/**
 * /api/health — Health check endpoint
 * Mirrors the Express backend's /health response so the frontend
 * health indicator works on Vercel without the local backend.
 */

import { NextResponse } from 'next/server'

const PAY_TO = process.env.PAY_TO_ADDRESS || 'GBYRJOWPACAFBWEABT4YJDQI6RHWCAMHA6W6P5HT2U35A7QBUSKJWOOG'
const IS_DEMO = !process.env.STELLAR_PRIVATE_KEY

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'cashflow-survival-agent',
    protocol: 'x402',
    network: 'stellar:testnet',
    payTo: PAY_TO,
    timestamp: new Date().toISOString(),
    mode: IS_DEMO ? 'demo' : 'live',
  })
}
