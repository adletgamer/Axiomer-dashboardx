'use client'

import { cn } from '@/lib/utils'
import { LayoutDashboard, Settings, BarChart3, Clock, Brain, Zap } from 'lucide-react'

interface SidebarProps {
  activeSection: string
  onSectionChange: (section: string) => void
}

export function Sidebar({ activeSection, onSectionChange }: SidebarProps) {
  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      description: 'Overview & metrics'
    },
    {
      id: 'scenario',
      label: 'Scenario',
      icon: Settings,
      description: 'Initialize financial scenario'
    },
    {
      id: 'decisions',
      label: 'Agent Decisions',
      icon: Brain,
      description: 'AI decision log'
    },
    {
      id: 'payments',
      label: 'Payment Log',
      icon: Clock,
      description: 'Payment history'
    },
    {
      id: 'stellar',
      label: 'Stellar Wallet',
      icon: Zap,
      description: 'Blockchain payments'
    }
  ]

  return (
    <aside className="w-64 bg-sidebar border-r border-sidebar-border h-screen flex flex-col">
      {/* Logo Section */}
      <div className="px-6 py-8 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-sidebar-primary flex items-center justify-center">
            <Brain className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-sidebar-foreground">
              Cashflow AI
            </span>
            <span className="text-xs text-sidebar-foreground/60">
              Survival Agent
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = activeSection === item.id

          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={cn(
                'w-full text-left px-4 py-3 rounded-lg transition-colors duration-200 group',
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent'
              )}
            >
              <div className="flex items-center gap-3">
                <Icon className="w-5 h-5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{item.label}</p>
                  <p
                    className={cn(
                      'text-xs',
                      isActive
                        ? 'text-sidebar-primary-foreground/80'
                        : 'text-sidebar-foreground/60'
                    )}
                  >
                    {item.description}
                  </p>
                </div>
              </div>
            </button>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-sidebar-border">
        <p className="text-xs text-sidebar-foreground/60">
          v0.1.0 • Ready to survive
        </p>
      </div>
    </aside>
  )
}
