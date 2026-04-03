'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { Check, Copy, Wallet, Zap } from 'lucide-react'

interface WalletSetupProps {
  onWalletCreated?: (config: WalletConfig) => void
  className?: string
}

export interface WalletConfig {
  walletAddress: string
  initialBalance: number
  budgetLimit: number
  createdAt: string
}

/**
 * WalletSetup Component
 * Handles wallet initialization and configuration for the agent
 * Integrates with Stellar blockchain for micropayments
 */
export function WalletSetup({ onWalletCreated, className }: WalletSetupProps) {
  const [step, setStep] = useState<'init' | 'configure' | 'review' | 'created'>('init')
  const [initialBalance, setInitialBalance] = useState<string>('1000')
  const [budgetLimit, setBudgetLimit] = useState<string>('1.00')
  const [walletAddress, setWalletAddress] = useState<string>('')
  const [copied, setCopied] = useState(false)

  /**
   * Generate a mock Stellar wallet address
   */
  const generateWalletAddress = () => {
    const address = 'G' + Array.from({ length: 55 }, () =>
      'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'[Math.floor(Math.random() * 32)]
    ).join('')
    setWalletAddress(address)
  }

  /**
   * Handle wallet creation
   */
  const handleCreateWallet = () => {
    if (!walletAddress) {
      generateWalletAddress()
      return
    }

    const config: WalletConfig = {
      walletAddress,
      initialBalance: parseFloat(initialBalance),
      budgetLimit: parseFloat(budgetLimit),
      createdAt: new Date().toISOString()
    }

    // Store in localStorage for demo purposes
    localStorage.setItem('agent-wallet-config', JSON.stringify(config))

    onWalletCreated?.(config)
    setStep('created')
  }

  /**
   * Copy wallet address to clipboard
   */
  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(walletAddress)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Wallet Setup</h1>
        <p className="text-muted-foreground mt-2">
          Configure your agent's Stellar wallet for micropayments
        </p>
      </div>

      {/* Progress indicator */}
      <div className="flex gap-2">
        {(['init', 'configure', 'review', 'created'] as const).map((s, idx) => (
          <div key={s} className="flex items-center">
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all',
                ['init', 'configure', 'review', 'created'].indexOf(step) >= idx
                  ? 'bg-accent text-accent-foreground'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {['init', 'configure', 'review', 'created'].indexOf(step) > idx ? '✓' : idx + 1}
            </div>
            {idx < 3 && (
              <div
                className={cn(
                  'h-0.5 w-12 mx-1 transition-all',
                  ['init', 'configure', 'review', 'created'].indexOf(step) > idx
                    ? 'bg-accent'
                    : 'bg-muted'
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Init Step */}
      {step === 'init' && (
        <Card className="p-6 space-y-6">
          <div>
            <h2 className="text-xl font-bold text-foreground mb-2">Welcome to Stellar Wallet</h2>
            <p className="text-muted-foreground">
              Your AI agent needs a Stellar wallet to make micropayments for API insights. This wallet will be funded with USDC (stablecoin) for budget-constrained decision-making.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: Wallet, title: 'Create Wallet', desc: 'Generate a secure Stellar address' },
              { icon: Zap, title: 'Fund Agent', desc: 'Allocate USDC budget for API calls' },
              { icon: Check, title: 'Ready', desc: 'Agent can now pay for insights' }
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex gap-3 p-4 rounded-lg bg-muted/50">
                <Icon className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm text-foreground">{title}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          <Button
            onClick={() => setStep('configure')}
            className="w-full"
          >
            Continue to Configuration
          </Button>
        </Card>
      )}

      {/* Configure Step */}
      {step === 'configure' && (
        <Card className="p-6 space-y-6">
          <div>
            <h2 className="text-xl font-bold text-foreground mb-2">Configure Wallet</h2>
            <p className="text-muted-foreground text-sm">
              Set your initial balance and budget limits for the agent's spending
            </p>
          </div>

          <div className="space-y-4">
            {/* Initial Balance */}
            <div>
              <label className="text-sm font-semibold text-foreground block mb-2">
                Initial Balance (USDC)
              </label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={initialBalance}
                  onChange={(e) => setInitialBalance(e.target.value)}
                  placeholder="1000"
                  min="1"
                  step="0.01"
                  className="flex-1"
                />
                <div className="px-3 py-2 rounded-md bg-muted border border-border text-sm font-semibold text-muted-foreground">
                  USDC
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Total amount to fund the wallet
              </p>
            </div>

            {/* Budget Limit */}
            <div>
              <label className="text-sm font-semibold text-foreground block mb-2">
                API Budget Limit (USDC)
              </label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={budgetLimit}
                  onChange={(e) => setBudgetLimit(e.target.value)}
                  placeholder="1.00"
                  min="0.01"
                  step="0.01"
                  className="flex-1"
                />
                <div className="px-3 py-2 rounded-md bg-muted border border-border text-sm font-semibold text-muted-foreground">
                  USDC
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Maximum allowed to spend on API calls per evaluation cycle
              </p>
            </div>

            {/* Summary */}
            <div className="p-4 rounded-lg bg-accent/5 border border-accent/20 space-y-2">
              <p className="text-xs font-semibold text-accent">Summary</p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Wallet Balance</p>
                  <p className="font-semibold text-foreground">${parseFloat(initialBalance).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">API Budget</p>
                  <p className="font-semibold text-foreground">${parseFloat(budgetLimit).toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setStep('init')}
              className="flex-1"
            >
              Back
            </Button>
            <Button
              onClick={() => {
                generateWalletAddress()
                setStep('review')
              }}
              className="flex-1"
            >
              Generate Wallet
            </Button>
          </div>
        </Card>
      )}

      {/* Review Step */}
      {step === 'review' && (
        <Card className="p-6 space-y-6">
          <div>
            <h2 className="text-xl font-bold text-foreground mb-2">Review & Confirm</h2>
            <p className="text-muted-foreground text-sm">
              Please review your wallet configuration before proceeding
            </p>
          </div>

          {/* Wallet Address Display */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-foreground block">
              Stellar Wallet Address
            </label>
            <div className="flex gap-2">
              <div className="flex-1 px-3 py-2 rounded-lg bg-muted border border-border font-mono text-sm text-foreground break-all">
                {walletAddress}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={copyToClipboard}
                className="flex-shrink-0"
              >
                {copied ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Share this address with your funding source or exchange
            </p>
          </div>

          {/* Configuration Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-muted/50 border border-border">
              <p className="text-xs text-muted-foreground font-medium mb-1">Initial Balance</p>
              <p className="text-2xl font-bold text-foreground">${parseFloat(initialBalance).toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-2">USDC</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 border border-border">
              <p className="text-xs text-muted-foreground font-medium mb-1">API Budget Limit</p>
              <p className="text-2xl font-bold text-accent">${parseFloat(budgetLimit).toFixed(2)}</p>
              <p className="text-xs text-muted-foreground mt-2">Per cycle</p>
            </div>
          </div>

          {/* Important Info */}
          <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 space-y-2">
            <p className="text-xs font-semibold text-amber-900 dark:text-amber-400">Important</p>
            <p className="text-xs text-amber-800 dark:text-amber-300">
              This is a demo wallet. In production, ensure you use secure key management and proper Stellar SDK integration.
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setStep('configure')}
              className="flex-1"
            >
              Back
            </Button>
            <Button
              onClick={handleCreateWallet}
              className="flex-1"
            >
              Create Wallet
            </Button>
          </div>
        </Card>
      )}

      {/* Created Step */}
      {step === 'created' && (
        <Card className="p-6 space-y-6 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/10">
          <div className="flex gap-4 items-start">
            <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
              <Check className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-green-900 dark:text-green-400 mb-1">
                Wallet Ready
              </h2>
              <p className="text-sm text-green-800 dark:text-green-300">
                Your agent's Stellar wallet has been configured and is ready for micropayments
              </p>
            </div>
          </div>

          {/* Success Details */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-black/20">
              <p className="text-sm text-foreground">Wallet Address</p>
              <Badge variant="secondary" className="font-mono text-xs">
                {walletAddress.slice(0, 8)}...{walletAddress.slice(-8)}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-black/20">
              <p className="text-sm text-foreground">Initial Balance</p>
              <p className="font-semibold text-foreground">${parseFloat(initialBalance).toLocaleString()} USDC</p>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-black/20">
              <p className="text-sm text-foreground">API Budget</p>
              <p className="font-semibold text-accent">${parseFloat(budgetLimit).toFixed(2)}/cycle</p>
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-white dark:bg-black/20 rounded-lg p-4 space-y-2">
            <p className="text-sm font-semibold text-foreground">Next Steps</p>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Fund your wallet with USDC on Stellar</li>
              <li>Configure API endpoints in the Scenario section</li>
              <li>Agent will automatically pay for insights when needed</li>
            </ol>
          </div>

          <Button className="w-full" onClick={() => window.location.reload()}>
            Close & Continue
          </Button>
        </Card>
      )}
    </div>
  )
}
