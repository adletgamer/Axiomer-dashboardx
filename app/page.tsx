'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/sidebar'
import { TopBar } from '@/components/top-bar'
import { DashboardSection } from '@/components/dashboard-section'
import { ScenarioSection } from '@/components/scenario-section'
import { PaymentLogSection } from '@/components/payment-log-section'
import { DecisionsSection } from '@/components/decisions-section'
import { DecisionTimeline } from '@/components/decision-timeline'
import { HTTP402PaymentFlow } from '@/components/http402-flow'

export default function Page() {
  const [activeSection, setActiveSection] = useState<string>('dashboard')
  const [balance] = useState<number>(87250)
  const [agentStatus] = useState<'active' | 'evaluating' | 'executing'>('active')

  const renderSection = () => {
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
            <DecisionTimeline />
            <div className="border-t border-border pt-8">
              <HTTP402PaymentFlow />
            </div>
            <div className="border-t border-border pt-8">
              <DecisionsSection />
            </div>
          </div>
        )
      default:
        return <DashboardSection />
    }
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
