'use client'

import { AlertTriangle, ShieldAlert, X, Clock } from 'lucide-react'
import { useState } from 'react'
import type { PredictionResult } from '@/lib/api'

// Estimate time-to-shutdown based on RUL cycles
// Assumption: 1 cycle ≈ 3 minutes average → cycles to months
function estimateTimeToShutdown(rulCycles: number): string {
  // Rough estimate: 1 shift = 8 hrs = ~160 cycles, 22 working days/month
  const cyclesPerMonth = 160 * 22 // ~3520 cycles/month
  const months = rulCycles / cyclesPerMonth

  if (months < 0.5) return 'less than 2 weeks'
  if (months < 1) return 'less than 1 month'
  if (months < 1.5) return '1–2 months'
  if (months < 2.5) return 'approx. 2 months'
  if (months < 3.5) return 'approx. 3 months'
  if (months < 4.5) return 'approx. 4 months'
  if (months < 6) return 'approx. 5–6 months'
  return `approx. ${Math.round(months)} months`
}

const FAULT_ADVICE: Record<string, string> = {
  bearing_vibration: 'Inspect and lubricate bearing assembly on the affected joint.',
  joint_friction: 'Check gearbox oil level and joint seals — friction is beyond normal range.',
  collision_event: 'Perform structural inspection and recalibrate arm position sensors.',
  payload_overload: 'Reduce payload or reconfigure end-effector load distribution.',
  thermal_degradation: 'Check cooling fans, ambient airflow, and thermal paste on motor drivers.',
  backlash_reducer_wear: 'Inspect reducer gearbox — replace if backlash exceeds tolerance.',
}

interface ShutdownWarningProps {
  prediction: PredictionResult | null
}

export function ShutdownWarning({ prediction }: ShutdownWarningProps) {
  const [dismissed, setDismissed] = useState(false)

  if (!prediction || dismissed) return null

  const { fault_type, fault_axis, health_score, RUL_cycles, maintenance_required } = prediction

  // Don't show if everything is normal and healthy
  if (fault_type === 'normal' && health_score >= 75 && maintenance_required === 0) return null

  const isCritical = maintenance_required === 1 || health_score < 50 || RUL_cycles < 100
  const timeEstimate = estimateTimeToShutdown(RUL_cycles)
  const advice = FAULT_ADVICE[fault_type] ?? 'Perform a general inspection of all joints.'

  return (
    <div
      className={`fixed left-4 top-1/2 z-40 -translate-y-1/2 w-72 rounded-2xl border shadow-2xl shadow-black/40 overflow-hidden animate-rise ${
        isCritical
          ? 'border-destructive/50 bg-destructive/10 backdrop-blur-md'
          : 'border-yellow-500/40 bg-yellow-500/10 backdrop-blur-md'
      }`}
    >
      {/* Top accent bar */}
      <div className={`h-1 w-full ${isCritical ? 'bg-destructive' : 'bg-yellow-500'}`} />

      <div className="p-4">
        {/* Header */}
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            {isCritical ? (
              <ShieldAlert className={`size-5 shrink-0 text-destructive animate-pulse`} />
            ) : (
              <AlertTriangle className="size-5 shrink-0 text-yellow-400" />
            )}
            <span
              className={`text-sm font-bold ${isCritical ? 'text-destructive' : 'text-yellow-400'}`}
            >
              {isCritical ? '⚠️ Shutdown Risk' : '⚠️ Performance Warning'}
            </span>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted transition-colors"
          >
            <X className="size-3.5" />
          </button>
        </div>

        {/* Main message */}
        <p className={`text-xs leading-relaxed mb-3 ${isCritical ? 'text-destructive/90' : 'text-yellow-300/90'}`}>
          {isCritical
            ? `This fault (${fault_type.replace(/_/g, ' ')}) will cause the robot to shut down in approximately ${timeEstimate} if not repaired.`
            : `Continuing in current condition without action will lead to robot shutdown in approximately ${timeEstimate}.`}
        </p>

        {/* Details */}
        <div className="space-y-1.5 mb-3">
          <div className="flex justify-between text-[11px]">
            <span className="text-muted-foreground">Fault</span>
            <span className="font-medium capitalize">{fault_type.replace(/_/g, ' ')}</span>
          </div>
          {fault_axis !== 'none' && (
            <div className="flex justify-between text-[11px]">
              <span className="text-muted-foreground">Axis</span>
              <span className="font-medium">{fault_axis.toUpperCase()}</span>
            </div>
          )}
          <div className="flex justify-between text-[11px]">
            <span className="text-muted-foreground">Health Score</span>
            <span className={`font-medium ${health_score < 50 ? 'text-destructive' : 'text-yellow-400'}`}>
              {health_score.toFixed(1)} / 100
            </span>
          </div>
          <div className="flex justify-between text-[11px]">
            <span className="text-muted-foreground">RUL</span>
            <span className="font-medium text-primary">{RUL_cycles.toFixed(0)} cycles</span>
          </div>
        </div>

        {/* Time estimate pill */}
        <div className={`flex items-center gap-1.5 rounded-lg px-3 py-2 mb-3 ${
          isCritical ? 'bg-destructive/20' : 'bg-yellow-500/20'
        }`}>
          <Clock className={`size-3.5 shrink-0 ${isCritical ? 'text-destructive' : 'text-yellow-400'}`} />
          <span className={`text-[11px] font-semibold ${isCritical ? 'text-destructive' : 'text-yellow-300'}`}>
            Estimated time to shutdown: <strong>{timeEstimate}</strong>
          </span>
        </div>

        {/* Recommendation */}
        <div className="rounded-lg border border-border bg-background/40 px-3 py-2">
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-1">
            Recommended Action
          </p>
          <p className="text-[11px] text-foreground/80 leading-relaxed">{advice}</p>
        </div>
      </div>
    </div>
  )
}
