'use client'

import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, Bot, Gauge, HeartPulse, PlugZap, Repeat, Target, Thermometer, Wrench } from 'lucide-react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { DashboardShell } from '@/components/dashboard-shell'
import { MetricCard } from '@/components/metric-card'
import { RadialGauge } from '@/components/radial-gauge'
import {
  ARM_SENSOR_CONFIG,
  fetchSensorConfig,
  generateArmSample,
  predictAll,
  type PredictionResult,
  type SensorConfig,
} from '@/lib/api'

const ARM_UNITS = [
  { id: 'ROB-ARM-01', label: 'Arm 01 · Loading Station' },
  { id: 'ROB-ARM-02', label: 'Arm 02 · Processing Station' },
  { id: 'ROB-ARM-03', label: 'Arm 03 · Packaging Station' },
]

const POLL_MS = 4000
const HISTORY_LEN = 20

function timeLabel(d: Date) {
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

type HistoryPoint = { t: string; health: number; rul: number }

const FAULT_TYPE_LABEL: Record<string, string> = {
  normal: 'Normal',
  bearing_vibration: 'Bearing Vibration',
  joint_friction: 'Joint Friction',
  collision_event: 'Collision Event',
  payload_overload: 'Payload Overload',
  thermal_degradation: 'Thermal Degradation',
  backlash_reducer_wear: 'Backlash Reducer Wear',
}

export function RobotArmView({ onHome, onPrediction }: { onHome: () => void; onPrediction?: (p: PredictionResult) => void }) {
  const [unitId, setUnitId] = useState(ARM_UNITS[0].id)
  const [config, setConfig] = useState<SensorConfig>(ARM_SENSOR_CONFIG)
  const [sample, setSample] = useState<Record<string, number> | null>(null)
  const [prediction, setPrediction] = useState<PredictionResult | null>(null)
  const [history, setHistory] = useState<HistoryPoint[]>([])
  const [connected, setConnected] = useState<boolean | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Fetch the real sensor ranges from the backend once
  useEffect(() => {
    fetchSensorConfig().then(setConfig)
  }, [])

  // Polling loop: generate a sensor reading + send it to the real model + update the UI
  useEffect(() => {
    let cancelled = false

    async function tick() {
      const s = generateArmSample(config)
      setSample(s)
      try {
        const result = await predictAll(s, unitId)
        if (cancelled) return
        setPrediction(result)
        onPrediction?.(result)
        setConnected(true)
        setErrorMsg(null)
        setHistory((prev) => {
          const point: HistoryPoint = {
            t: timeLabel(new Date()),
            health: result.health_score,
            rul: result.RUL_cycles,
          }
          return [...prev.slice(-(HISTORY_LEN - 1)), point]
        })
      } catch (err) {
        if (cancelled) return
        setConnected(false)
        setErrorMsg(err instanceof Error ? err.message : 'Failed to connect to the server')
      }
    }

    tick()
    timerRef.current = setInterval(tick, POLL_MS)
    return () => {
      cancelled = true
      if (timerRef.current) clearInterval(timerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unitId, config])

  const isFaulty = prediction ? prediction.fault_type !== 'normal' : false
  const needsMaintenance = prediction?.maintenance_required === 1

  const jointEfforts = [1, 2, 3, 4, 5, 6].map((n) => ({
    axis: `J${n}`,
    effort: sample?.[`joint_${n}_effort_nm`] ?? 0,
  }))

  const jointPositions = [1, 2, 3, 4, 5, 6].map((n) => ({
    name: `Joint ${n}`,
    pos: sample?.[`joint_${n}_pos_deg`] ?? 0,
    range: config[`joint_${n}_pos_deg`],
  }))

  return (
    <DashboardShell
      icon={Bot}
      title="Robot Arm"
      subtitle="6 axes · real prediction model (RUL · faults · health) via FastAPI"
      status={
        connected === null
          ? { label: 'Connecting...', tone: 'warn' }
          : connected
            ? { label: 'Connected to prediction model', tone: needsMaintenance || isFaulty ? 'warn' : 'ok' }
            : { label: 'Disconnected from server', tone: 'err' }
      }
      onHome={onHome}
    >
      {/* Unit selector: 3 robot arms on the production line */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {ARM_UNITS.map((u) => (
          <button
            key={u.id}
            onClick={() => setUnitId(u.id)}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
              unitId === u.id
                ? 'border-primary bg-primary/15 text-primary'
                : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
            }`}
          >
            {u.label}
          </button>
        ))}
      </div>

      {connected === false && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertTriangle className="size-4 shrink-0" />
          <span>
            Could not reach the prediction server (FastAPI). Make sure it is running at{' '}
            <code className="font-mono">{process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}</code>.
            {errorMsg ? ` — ${errorMsg}` : ''}
          </span>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon={Repeat}
          label="Remaining Useful Life (RUL)"
          value={prediction ? prediction.RUL_cycles : '—'}
          unit="cycles"
          tone="cyan"
          hint="Expected number of cycles before maintenance is needed"
        />
        <MetricCard
          icon={HeartPulse}
          label="Overall Health Score"
          value={prediction ? prediction.health_score : '—'}
          unit="%"
          tone={prediction && prediction.health_score < 60 ? 'red' : prediction && prediction.health_score < 80 ? 'amber' : 'green'}
        />
        <MetricCard
          icon={Wrench}
          label="Is Maintenance Required?"
          value={prediction ? (needsMaintenance ? 'Yes' : 'No') : '—'}
          tone={needsMaintenance ? 'amber' : 'teal'}
        />
        <MetricCard
          icon={Target}
          label="Predicted Fault Type"
          value={prediction ? FAULT_TYPE_LABEL[prediction.fault_type] ?? prediction.fault_type : '—'}
          tone={isFaulty ? 'red' : 'green'}
          hint={prediction && prediction.fault_axis !== 'none' ? `Axis: ${prediction.fault_axis}` : undefined}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <HeartPulse className="size-4 text-primary" />
              Health Score & Remaining Useful Life (from the real prediction model)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              className="h-[260px] w-full"
              config={{
                health: { label: 'Health Score %', color: 'var(--chart-1)' },
                rul: { label: 'Remaining Life (cycles)', color: 'var(--chart-4)' },
              }}
            >
              <AreaChart data={history} margin={{ left: -16, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="fillHealth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-health)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="var(--color-health)" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="t" tickLine={false} axisLine={false} minTickGap={32} fontSize={11} />
                <YAxis tickLine={false} axisLine={false} fontSize={11} width={40} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Area dataKey="health" type="monotone" stroke="var(--color-health)" fill="url(#fillHealth)" strokeWidth={2} isAnimationActive={false} />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <PlugZap className="size-4 text-primary" />
              Current Unit Status
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-2">
            <RadialGauge
              value={prediction ? prediction.health_score : 0}
              label="Health Score"
              color={prediction && prediction.health_score < 60 ? 'oklch(0.66 0.2 25)' : 'oklch(0.78 0.15 145)'}
            />
            <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
              <Badge variant="outline" className="gap-1.5">
                <Thermometer className="size-3.5" />
                Joint 1 Temp: {sample ? sample.synthetic_temp_j1_c.toFixed(1) : '—'}°C
              </Badge>
              <Badge variant="outline" className="gap-1.5">
                <Gauge className="size-3.5" />
                Payload: {sample ? sample.payload_mass_kg.toFixed(2) : '—'} kg
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Gauge className="size-4 text-primary" />
              Live Torque per Axis (Nm)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer className="h-[240px] w-full" config={{ effort: { label: 'Torque (Nm)', color: 'var(--chart-2)' } }}>
              <BarChart data={jointEfforts} margin={{ left: -16, right: 8 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="axis" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis tickLine={false} axisLine={false} fontSize={11} width={40} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="effort" fill="var(--color-effort)" radius={[6, 6, 0, 0]} isAnimationActive={false} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Bot className="size-4 text-primary" />
              Current Joint Angles (from live reading)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {jointPositions.map((j) => {
              const min = j.range?.min ?? -90
              const max = j.range?.max ?? 90
              const pct = ((j.pos - min) / (max - min)) * 100
              return (
                <div key={j.name}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{j.name}</span>
                    <span className="font-mono text-foreground">{j.pos.toFixed(2)}°</span>
                  </div>
                  <Progress value={pct} className="h-2" />
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  )
}
