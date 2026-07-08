'use client'

import { useState, useCallback } from 'react'
import { ArrowLeft, FlaskConical, Loader2, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ARM_SENSOR_CONFIG, predictAll, type PredictionResult } from '@/lib/api'

// Group features for cleaner UI
const FEATURE_GROUPS = [
  {
    label: 'General',
    keys: ['cycle_in_run', 'payload_mass_kg', 'speed_scale', 'cycle_time_s', 'ambient_temp_c'],
  },
  {
    label: 'Joint 1',
    keys: ['joint_1_pos_deg', 'joint_1_vel_deg_s', 'joint_1_acc_deg_s2', 'joint_1_effort_nm',
      'synthetic_current_j1_a', 'synthetic_temp_j1_c', 'synthetic_vibration_j1_g', 'tracking_error_j1_deg'],
  },
  {
    label: 'Joint 2',
    keys: ['joint_2_pos_deg', 'joint_2_vel_deg_s', 'joint_2_acc_deg_s2', 'joint_2_effort_nm',
      'synthetic_current_j2_a', 'synthetic_temp_j2_c', 'synthetic_vibration_j2_g', 'tracking_error_j2_deg'],
  },
  {
    label: 'Joint 3',
    keys: ['joint_3_pos_deg', 'joint_3_vel_deg_s', 'joint_3_acc_deg_s2', 'joint_3_effort_nm',
      'synthetic_current_j3_a', 'synthetic_temp_j3_c', 'synthetic_vibration_j3_g', 'tracking_error_j3_deg'],
  },
  {
    label: 'Joint 4',
    keys: ['joint_4_pos_deg', 'joint_4_vel_deg_s', 'joint_4_acc_deg_s2', 'joint_4_effort_nm',
      'synthetic_current_j4_a', 'synthetic_temp_j4_c', 'synthetic_vibration_j4_g', 'tracking_error_j4_deg'],
  },
  {
    label: 'Joint 5',
    keys: ['joint_5_pos_deg', 'joint_5_vel_deg_s', 'joint_5_acc_deg_s2', 'joint_5_effort_nm',
      'synthetic_current_j5_a', 'synthetic_temp_j5_c', 'synthetic_vibration_j5_g', 'tracking_error_j5_deg'],
  },
  {
    label: 'Joint 6',
    keys: ['joint_6_pos_deg', 'joint_6_vel_deg_s', 'joint_6_acc_deg_s2', 'joint_6_effort_nm',
      'synthetic_current_j6_a', 'synthetic_temp_j6_c', 'synthetic_vibration_j6_g', 'tracking_error_j6_deg'],
  },
]

const FAULT_LABELS: Record<string, string> = {
  normal: 'Normal ✅',
  bearing_vibration: 'Bearing Vibration ⚙️',
  joint_friction: 'Joint Friction 🔧',
  collision_event: 'Collision Event 💥',
  payload_overload: 'Payload Overload ⚖️',
  thermal_degradation: 'Thermal Degradation 🌡️',
  backlash_reducer_wear: 'Backlash / Reducer Wear 🔩',
}

function featureLabel(key: string) {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function healthColor(score: number) {
  if (score >= 75) return 'text-emerald-400'
  if (score >= 50) return 'text-yellow-400'
  if (score >= 25) return 'text-orange-400'
  return 'text-red-400'
}

function alertBadge(pred: PredictionResult) {
  const { health_score, RUL_cycles, fault_type, maintenance_required } = pred
  if (fault_type === 'normal' && health_score >= 75) return { label: 'OK', cls: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' }
  if (fault_type === 'normal' && health_score >= 50) return { label: 'LOW', cls: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' }
  if (health_score >= 50 && RUL_cycles >= 100) return { label: 'MEDIUM', cls: 'bg-orange-500/20 text-orange-400 border-orange-500/30' }
  if (health_score >= 25 && RUL_cycles >= 50) return { label: 'HIGH', cls: 'bg-red-500/20 text-red-400 border-red-500/30' }
  return { label: 'CRITICAL', cls: 'bg-red-700/30 text-red-300 border-red-600/40' }
}

// Build default values from config
function buildDefaults(): Record<string, number> {
  const out: Record<string, number> = {}
  for (const [k, v] of Object.entries(ARM_SENSOR_CONFIG)) out[k] = v.default
  return out
}

export function ScenarioCheckView({ onBack }: { onBack: () => void }) {
  const [values, setValues] = useState<Record<string, number>>(buildDefaults)
  const [result, setResult] = useState<PredictionResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  const setValue = useCallback((key: string, val: number) => {
    setValues((prev) => ({ ...prev, [key]: val }))
  }, [])

  async function runPrediction() {
    setLoading(true)
    setError(null)
    try {
      const res = await predictAll(values, 'SCENARIO-CHECK')
      setResult(res)
      // Scroll to results
      setTimeout(() => document.getElementById('scenario-results')?.scrollIntoView({ behavior: 'smooth' }), 100)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Prediction failed')
    } finally {
      setLoading(false)
    }
  }

  function resetDefaults() {
    setValues(buildDefaults())
    setResult(null)
    setError(null)
  }

  function toggleGroup(label: string) {
    setCollapsed((prev) => ({ ...prev, [label]: !prev[label] }))
  }

  const alert = result ? alertBadge(result) : null

  return (
    <div className="relative min-h-dvh grid-bg">
      {/* Ambient glow */}
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-0 size-[600px] -translate-x-1/2 opacity-30 rounded-full blur-3xl"
        style={{ background: 'radial-gradient(circle, oklch(0.78 0.14 210 / 0.5), transparent 65%)' }} />

      <div className="relative mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <button onClick={onBack}
            className="flex size-10 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-primary transition-all">
            <ArrowLeft className="size-5" />
          </button>
          <div>
            <div className="mb-1 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-0.5 text-xs font-medium text-primary">
              <FlaskConical className="size-3" /> Scenario Check
            </div>
            <h1 className="text-2xl font-bold tracking-tight">AI Model Scenario Simulator</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Adjust sensor values and see what the AI models would predict in real time.
            </p>
          </div>
          <button onClick={resetDefaults}
            className="ml-auto flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-xs text-muted-foreground hover:border-primary/40 hover:text-primary transition-all">
            <RotateCcw className="size-3.5" /> Reset
          </button>
        </div>

        {/* Feature Groups */}
        <div className="space-y-4">
          {FEATURE_GROUPS.map((group) => (
            <Card key={group.label} className="border-border overflow-hidden">
              <button
                onClick={() => toggleGroup(group.label)}
                className="flex w-full items-center justify-between px-5 py-3 text-left hover:bg-muted/30 transition-colors"
              >
                <span className="font-semibold text-sm">{group.label}</span>
                {collapsed[group.label]
                  ? <ChevronDown className="size-4 text-muted-foreground" />
                  : <ChevronUp className="size-4 text-muted-foreground" />}
              </button>

              {!collapsed[group.label] && (
                <CardContent className="grid gap-x-8 gap-y-5 px-5 pb-5 sm:grid-cols-2">
                  {group.keys.map((key) => {
                    const cfg = ARM_SENSOR_CONFIG[key]
                    if (!cfg) return null
                    const val = values[key] ?? cfg.default
                    const pct = ((val - cfg.min) / (cfg.max - cfg.min)) * 100
                    return (
                      <div key={key}>
                        <div className="mb-1.5 flex justify-between text-xs">
                          <span className="text-muted-foreground">{featureLabel(key)}</span>
                          <span className="font-mono text-primary font-medium">{val.toFixed(3)}</span>
                        </div>
                        <input
                          type="range"
                          min={cfg.min}
                          max={cfg.max}
                          step={cfg.step}
                          value={val}
                          onChange={(e) => setValue(key, parseFloat(e.target.value))}
                          className="w-full h-1.5 cursor-pointer accent-primary"
                        />
                        <div className="mt-0.5 flex justify-between text-[9px] text-muted-foreground/60 font-mono">
                          <span>{cfg.min}</span>
                          <span>{cfg.max}</span>
                        </div>
                      </div>
                    )
                  })}
                </CardContent>
              )}
            </Card>
          ))}
        </div>

        {/* Run button */}
        <div className="mt-6 flex justify-center">
          <button
            onClick={runPrediction}
            disabled={loading}
            className="flex items-center gap-2.5 rounded-xl bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:opacity-90 disabled:opacity-60 active:scale-95"
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : <FlaskConical className="size-4" />}
            {loading ? 'Running AI Models…' : 'Run Prediction'}
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive text-center">
            {error}
          </div>
        )}

        {/* Results */}
        {result && (
          <div id="scenario-results" className="mt-8 animate-rise">
            <h2 className="mb-4 text-center text-lg font-bold">AI Model Predictions</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

              {/* Health Score */}
              <Card className="border-border p-5">
                <p className="text-xs text-muted-foreground mb-1">Health Score</p>
                <p className={`text-4xl font-bold ${healthColor(result.health_score)}`}>
                  {result.health_score.toFixed(1)}
                  <span className="text-lg text-muted-foreground">/100</span>
                </p>
                <Progress value={result.health_score} className="mt-3 h-2" />
              </Card>

              {/* RUL */}
              <Card className="border-border p-5">
                <p className="text-xs text-muted-foreground mb-1">Remaining Useful Life</p>
                <p className="text-4xl font-bold text-primary">
                  {result.RUL_cycles.toFixed(0)}
                  <span className="text-lg text-muted-foreground"> cycles</span>
                </p>
                <p className="mt-3 text-xs text-muted-foreground">Cycles before maintenance needed</p>
              </Card>

              {/* Alert Level */}
              <Card className="border-border p-5 flex flex-col justify-between">
                <p className="text-xs text-muted-foreground mb-1">Alert Level</p>
                {alert && (
                  <span className={`inline-flex w-fit items-center rounded-lg border px-3 py-1.5 text-xl font-bold ${alert.cls}`}>
                    {alert.label}
                  </span>
                )}
                <p className="mt-3 text-xs text-muted-foreground">
                  Maintenance: <span className={result.maintenance_required ? 'text-destructive font-semibold' : 'text-emerald-400 font-semibold'}>
                    {result.maintenance_required ? 'REQUIRED ⚠️' : 'NOT REQUIRED ✅'}
                  </span>
                </p>
              </Card>

              {/* Fault Type */}
              <Card className="border-border p-5 sm:col-span-2 lg:col-span-1">
                <p className="text-xs text-muted-foreground mb-2">Fault Type</p>
                <p className="text-lg font-bold">{FAULT_LABELS[result.fault_type] ?? result.fault_type}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {result.fault_type === 'normal'
                    ? 'No fault detected with these sensor values.'
                    : 'A fault condition would be triggered with these values.'}
                </p>
              </Card>

              {/* Fault Axis */}
              <Card className="border-border p-5">
                <p className="text-xs text-muted-foreground mb-2">Affected Axis</p>
                <p className="text-4xl font-bold text-primary">{result.fault_axis.toUpperCase()}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {result.fault_axis === 'none' ? 'No specific axis affected' : `Joint ${result.fault_axis.replace('J', '')} is most affected`}
                </p>
              </Card>

              {/* Summary card */}
              <Card className="border-border p-5 sm:col-span-2 lg:col-span-1">
                <p className="text-xs text-muted-foreground mb-2">Quick Summary</p>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between"><span className="text-muted-foreground">Fault</span><span className="font-medium">{result.fault_type}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Axis</span><span className="font-medium">{result.fault_axis}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Health</span><span className={`font-medium ${healthColor(result.health_score)}`}>{result.health_score.toFixed(1)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">RUL</span><span className="font-medium text-primary">{result.RUL_cycles.toFixed(0)} cycles</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Maintenance</span>
                    <span className={result.maintenance_required ? 'text-destructive font-semibold' : 'text-emerald-400 font-semibold'}>
                      {result.maintenance_required ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        <p className="mt-10 text-center text-xs text-muted-foreground">
          Twinam Scenario Check — values are simulated and sent to the real AI models.
        </p>
      </div>
    </div>
  )
}
