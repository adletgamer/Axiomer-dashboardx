'use client'

import { useState, useEffect } from 'react'
import { Sidebar } from '@/components/sidebar'
import { TopBar } from '@/components/top-bar'
import { DashboardSection } from '@/components/dashboard-section'
import { ScenarioSection } from '@/components/scenario-section'
import { PaymentLogSection } from '@/components/payment-log-section'
import { DecisionsSection } from '@/components/decisions-section'
import { AgentDecisionFlow } from '@/components/agent-decision-flow'
import { PaidAPIFlow } from '@/components/paid-api-flow'
import { StellarDemo } from '@/components/stellar-demo'
import { WalletSetup, type WalletConfig } from '@/components/wallet-setup'
import { useWallet } from '@/lib/use-wallet'

export default function Page() {
  const [activeSection, setActiveSection] = useState<string>('dashboard')
  const [balance] = useState<number>(87250)
  const [agentStatus] = useState<'active' | 'evaluating' | 'executing'>('active')
  const [isClient, setIsClient] = useState(false)
  const wallet = useWallet()

  // Only render on client to avoid hydration issues
  useEffect(() => {
    setIsClient(true)
  }, [])

  const renderSection = () => {
    // Show wallet setup if not configured
    if (activeSection === 'stellar' && !wallet.isLoading) {
      if (!wallet.isConfigured()) {
        return (
          <WalletSetup
            onWalletCreated={(config: WalletConfig) => {
              wallet.saveConfig(config)
              setActiveSection('dashboard')
            }}
          />
        )
      }
      return <StellarDemo />
    }

    switch (activeSection) {
      case 'dashboard':
        return <DashboardSection />
      case 'scenario':
        return <ScenarioSection />
      case 'payments':
        return <PaymentLogSection />
      case 'decisions':
        return (
          <div className="space-y-8">
            <AgentDecisionFlow />
            <div className="border-t border-border pt-8">
              <PaidAPIFlow />
            </div>
          </div>
        )
      default:
        return <DashboardSection />
    }
  }

  // Prevent hydration mismatch
  if (!isClient) {
    return null
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <TopBar balance={balance} agentStatus={agentStatus} />

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-8">
            {renderSection()}
          </div>
        </main>
      </div>
    </div>
  )
}
