/**
 * StellarDemo Component
 * Demonstrates Stellar payment integration with wallet and transaction cards
 * Shows real-world usage patterns and state management
 */

'use client'

import { useState } from 'react'
import { AgentWalletCard } from '@/components/agent-wallet-card'
import { TransactionCard } from '@/components/transaction-card'
import { Button } from '@/components/ui/button'
import { sendStellarPayment, type TransactionResult } from '@/lib/stellar-payment'
import { Card } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

interface Transaction extends TransactionResult {
  id: string
}

export function StellarDemo() {
  // State management
  const [balance, setBalance] = useState(1000)
  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: 'tx-1',
      status: 'confirmed',
      amount: 0.02,
      from: 'GBYX...XXXX',
      to: 'GAPI...1234',
      timestamp: Date.now() - 600000,
      hash: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
      confirmations: 5
    },
    {
      id: 'tx-2',
      status: 'confirmed',
      amount: 0.01,
      from: 'GBYX...XXXX',
      to: 'GAPI...5678',
      timestamp: Date.now() - 1200000,
      hash: 'b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7',
      confirmations: 4
    }
  ])

  const [isProcessing, setIsProcessing] = useState(false)
  const [processingStatus, setProcessingStatus] = useState('')

  const totalSpent = transactions.reduce((sum, tx) => sum + tx.amount, 0)
  const budgetLimit = 1.0

  /**
   * Handle payment submission
   * Demonstrates the full payment lifecycle with status updates
   */
  const handleSendPayment = async () => {
    setIsProcessing(true)
    setProcessingStatus('Preparing transaction...')

    try {
      const result = await sendStellarPayment(
        {
          amount: 0.02,
          destination: 'GXXX...YYYY'
        },
        (status) => {
          setProcessingStatus(status)
        }
      )

      if ('hash' in result) {
        // Success: add to transaction list
        const newTransaction: Transaction = {
          ...result,
          id: `tx-${Date.now()}`,
        }

        setTransactions((prev) => [newTransaction, ...prev])
        setBalance((prev) => prev - result.amount)
        setProcessingStatus('')
      } else {
        // Error: show error message
        setProcessingStatus(`Error: ${result.message}`)
        setTimeout(() => setProcessingStatus(''), 3000)
      }
    } catch (error) {
      setProcessingStatus('An unexpected error occurred')
      setTimeout(() => setProcessingStatus(''), 3000)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Stellar Wallet</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Agent micropayment wallet · Stellar testnet · x402 protocol
        </p>
      </div>

      {/* Wallet Card */}
      <AgentWalletCard
        balance={balance}
        totalSpent={totalSpent}
        budgetLimit={budgetLimit}
      />

      {/* Action Section */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-foreground mb-1">
              Send Micropayment
            </h3>
            <p className="text-sm text-muted-foreground">
              {processingStatus || 'Send a 0.02 USDC payment to call a paid API'}
            </p>
          </div>
          <Button
            onClick={handleSendPayment}
            disabled={isProcessing || balance < 0.02}
            className="gap-2"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Send Payment'
            )}
          </Button>
        </div>
      </Card>

      {/* Transactions */}
      <div>
        <div className="mb-4">
          <h2 className="text-xl font-bold text-foreground">Recent Transactions</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="space-y-3">
          {transactions.length > 0 ? (
            transactions.map((tx) => (
              <TransactionCard
                key={tx.id}
                transaction={tx}
                onViewExplorer={() => {
                  window.open(
                    `https://stellar.expert/explorer/testnet/tx/${tx.hash}`,
                    '_blank'
                  )
                }}
              />
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No transactions yet. Send a payment to get started.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
