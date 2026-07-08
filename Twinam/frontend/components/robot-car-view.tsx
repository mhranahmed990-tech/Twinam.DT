'use client'

import { useState } from 'react'
import { BatteryCharging, Gauge, MapPin, Navigation, Route, Truck, Weight } from 'lucide-react'
import {
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { DashboardShell } from '@/components/dashboard-shell'
import { MetricCard } from '@/components/metric-card'
import { RadialGauge } from '@/components/radial-gauge'
import { useLiveSeries, useLiveValue } from '@/lib/live-data'

const route = [
  { name: 'Warehouse', done: true },
  { name: 'Assembly Station A', done: true },
  { name: 'Inspection Station', done: true },
  { name: 'Packaging Station', done: false },
  { name: 'Shipping Area', done: false },
]

const AGV_UNITS = [
  { id: 'AGV-04', label: 'AGV-04 · First Material Transporter' },
  { id: 'AGV-05', label: 'AGV-05 · Second Material Transporter' },
]

function RobotCarViewInner({
  unitId,
  onHome,
  onSelectUnit,
}: {
  unitId: string
  onHome: () => void
  onSelectUnit: (id: string) => void
}) {
  const unitLabel = AGV_UNITS.find((u) => u.id === unitId)?.label ?? unitId
  const { data, latest } = useLiveSeries(
    {
      speed: { base: 1.4, jitter: 0.25, min: 0, max: 2.2 },
    },
    24,
  )
  const battery = useLiveValue(78, 0.6, 35, 100)
  const payload = useLiveValue(124, 4, 0, 200)
  const motorTemp = useLiveValue(46, 1.5, 35, 70)

  return (
    <DashboardShell
      icon={Truck}
      title="Mobile Robot (AGV)"
      subtitle={`Automated Guided Vehicle · ${unitLabel} (live simulation — no AI model for this unit yet)`}
      status={{ label: 'Moving', tone: 'ok' }}
      onHome={onHome}
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {AGV_UNITS.map((u) => (
          <button
            key={u.id}
            onClick={() => onSelectUnit(u.id)}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
              u.id === unitId
                ? 'border-primary bg-primary/15 text-primary'
                : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
            }`}
          >
            {u.label}
          </button>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard icon={BatteryCharging} label="Battery Level" value={Math.round(battery)} unit="%" tone={battery < 40 ? 'red' : 'green'} hint="Remaining range ~3.2 km" />
        <MetricCard icon={Gauge} label="Current Speed" value={latest.speed as number} unit="m/s" tone="cyan" />
        <MetricCard icon={Weight} label="Payload" value={Math.round(payload)} unit="kg" tone="teal" hint="Max capacity 200 kg" />
        <MetricCard icon={Navigation} label="Motor Temperature" value={motorTemp} unit="°C" tone={motorTemp > 60 ? 'amber' : 'cyan'} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Gauge className="size-4 text-primary" />
              Movement Speed (m/s)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer className="h-[260px] w-full" config={{ speed: { label: 'Speed (m/s)', color: 'var(--chart-1)' } }}>
              <LineChart data={data} margin={{ left: -20, right: 8, top: 8 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="t" tickLine={false} axisLine={false} minTickGap={32} fontSize={11} />
                <YAxis tickLine={false} axisLine={false} fontSize={11} domain={[0, 2.5]} width={40} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line dataKey="speed" type="monotone" stroke="var(--color-speed)" strokeWidth={2.5} dot={false} isAnimationActive={false} />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BatteryCharging className="size-4 text-primary" />
              Battery Status
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center gap-2 pt-4">
            <RadialGauge value={battery} label="Battery Charge" color="oklch(0.78 0.15 145)" size={190} />
            <p className="text-center text-xs text-muted-foreground">
              Voltage 48.2 V · Current 12.4 A
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Route className="size-4 text-primary" />
              Current Mission Route
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="relative space-y-5 ps-6">
              <span aria-hidden className="absolute inset-y-2 start-[7px] w-px bg-border" />
              {route.map((stop, i) => {
                const active = !stop.done && (i === 0 || route[i - 1]?.done)
                return (
                  <li key={stop.name} className="relative flex items-center gap-3">
                    <span
                      className={`absolute -start-6 flex size-3.5 items-center justify-center rounded-full ring-4 ring-background ${
                        stop.done
                          ? 'bg-[oklch(0.78_0.15_145)]'
                          : active
                            ? 'animate-pulse bg-primary'
                            : 'bg-muted-foreground/40'
                      }`}
                    />
                    <span className={`text-sm ${stop.done ? 'text-muted-foreground line-through' : active ? 'font-semibold text-primary' : 'text-foreground'}`}>
                      {stop.name}
                    </span>
                    {active ? (
                      <span className="ms-auto flex items-center gap-1 text-xs text-primary">
                        <MapPin className="size-3.5" /> Current Destination
                      </span>
                    ) : null}
                  </li>
                )
              })}
            </ol>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Navigation className="size-4 text-primary" />
              Operating Information
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            {[
              { k: 'Distance Today', v: '14.6 km' },
              { k: 'Tasks Completed', v: '38 / 45' },
              { k: 'Uptime', v: '6h 12m' },
              { k: 'Navigation Accuracy', v: '±2 cm' },
              { k: 'Drive Mode', v: 'Automatic' },
              { k: 'Status', v: 'No Errors' },
            ].map((item) => (
              <div key={item.k} className="rounded-lg border border-border bg-secondary/40 p-3">
                <p className="text-xs text-muted-foreground">{item.k}</p>
                <p className="mt-1 font-mono text-sm font-semibold text-foreground">{item.v}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  )
}

export function RobotCarView({ onHome }: { onHome: () => void }) {
  const [unitId, setUnitId] = useState(AGV_UNITS[0].id)
  return <RobotCarViewInner key={unitId} unitId={unitId} onHome={onHome} onSelectUnit={setUnitId} />
}

