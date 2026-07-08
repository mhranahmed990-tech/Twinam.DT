'use client'

import { useState } from 'react'
import { ConveyorView } from '@/components/conveyor-view'
import { HomeView } from '@/components/home-view'
import { RobotArmView } from '@/components/robot-arm-view'
import { RobotCarView } from '@/components/robot-car-view'
import { ScenarioCheckView } from '@/components/scenario-check-view'
import { ChatbotWidget } from '@/components/chatbot-widget'
import { ShutdownWarning } from '@/components/shutdown-warning'
import type { PredictionResult } from '@/lib/api'

export type ViewKey = 'home' | 'arm' | 'car' | 'conveyor' | 'scenario'

export function TwinamDashboard() {
  const [view, setView] = useState<ViewKey>('home')
  const [lastPrediction, setLastPrediction] = useState<PredictionResult | null>(null)

  const goHome = () => setView('home')

  return (
    <>
      <div key={view} className="animate-rise">
        {view === 'home'     && <HomeView onSelect={setView} />}
        {view === 'arm'      && <RobotArmView onHome={goHome} onPrediction={setLastPrediction} />}
        {view === 'car'      && <RobotCarView onHome={goHome} />}
        {view === 'conveyor' && <ConveyorView onHome={goHome} />}
        {view === 'scenario' && <ScenarioCheckView onBack={goHome} />}
      </div>

      {/* Shutdown / degradation warning — left side, all views */}
      <ShutdownWarning prediction={lastPrediction} />

      {/* AI Chatbot — bottom right, all views */}
      <ChatbotWidget lastPrediction={lastPrediction} />
    </>
  )
}
