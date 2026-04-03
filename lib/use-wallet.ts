'use client'

import { useState, useEffect, useCallback } from 'react'
import type { WalletConfig } from '@/components/wallet-setup'

interface WalletState {
  config: WalletConfig | null
  isLoading: boolean
  error: string | null
}

/**
 * useWallet Hook
 * Manages wallet state and persistence across the application
 * Handles localStorage synchronization and wallet operations
 */
export function useWallet() {
  const [state, setState] = useState<WalletState>({
    config: null,
    isLoading: true,
    error: null
  })

  // Load wallet config from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('agent-wallet-config')
      if (stored) {
        const config = JSON.parse(stored) as WalletConfig
        setState({
          config,
          isLoading: false,
          error: null
        })
      } else {
        setState({
          config: null,
          isLoading: false,
          error: null
        })
      }
    } catch (err) {
      setState({
        config: null,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to load wallet'
      })
    }
  }, [])

  /**
   * Save wallet configuration
   */
  const saveConfig = useCallback((config: WalletConfig) => {
    try {
      localStorage.setItem('agent-wallet-config', JSON.stringify(config))
      setState({
        config,
        isLoading: false,
        error: null
      })
      return true
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to save wallet'
      setState((prev) => ({
        ...prev,
        error: errorMsg
      }))
      return false
    }
  }, [])

  /**
   * Clear wallet configuration
   */
  const clearConfig = useCallback(() => {
    try {
      localStorage.removeItem('agent-wallet-config')
      setState({
        config: null,
        isLoading: false,
        error: null
      })
      return true
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to clear wallet'
      setState((prev) => ({
        ...prev,
        error: errorMsg
      }))
      return false
    }
  }, [])

  /**
   * Update wallet balance (simulated)
   */
  const updateBalance = useCallback((newBalance: number) => {
    if (!state.config) return false

    const updated = {
      ...state.config,
      initialBalance: newBalance
    }

    return saveConfig(updated)
  }, [state.config, saveConfig])

  /**
   * Check if wallet is configured
   */
  const isConfigured = useCallback(() => {
    return state.config !== null
  }, [state.config])

  /**
   * Get wallet summary
   */
  const getSummary = useCallback(() => {
    if (!state.config) {
      return null
    }

    return {
      address: state.config.walletAddress,
      balance: state.config.initialBalance,
      budget: state.config.budgetLimit,
      created: new Date(state.config.createdAt)
    }
  }, [state.config])

  return {
    ...state,
    saveConfig,
    clearConfig,
    updateBalance,
    isConfigured,
    getSummary
  }
}
