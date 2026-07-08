'use client'

import { AlertTriangle, GitCommitVertical, Package, Percent, Thermometer, Zap } from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { useLiveSeries, useLiveValue } from '@/lib/live-data'

const stationOutput = [
  { station: 'Station 1', good: 138, defect: 4 },
  { station: 'Station 2', good: 142, defect: 2 },
  { station: 'Station 3', good: 129, defect: 7 },
  { station: 'Station 4', good: 146, defect: 3 },
  { station: 'Station 5', good: 134, defect: 5 },
]

export function ConveyorView({ onHome }: { onHome: () => void }) {
  const { data, latest } = useLiveSeries(
    {
      throughput: { base: 142, jitter: 6, min: 90, max: 180 },
      belt: { base: 0.65, jitter: 0.04, min: 0.4, max: 0.9 },
    },
    24,
  )
  const oee = useLiveValue(87, 1.2, 70, 99)
  const defectRate = useLiveValue(2.4, 0.3, 0.5, 8)
  const beltTemp = useLiveValue(38, 1, 28, 60)

  return (
    <DashboardShell
      icon={GitCommitVertical}
      title="Production Line"
      subtitle="Main Conveyor Belt · Assembly Line · CONV-LINE-02"
      status={{ label: defectRate > 5 ? 'Warning' : 'Active', tone: defectRate > 5 ? 'warn' : 'ok' }}
      onHome={onHome}
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard icon={Package} label="Throughput Rate" value={Math.round(latest.throughput as number)} unit="units/hr" tone="cyan" />
        <MetricCard icon={Zap} label="Belt Speed" value={latest.belt as number} unit="m/s" tone="teal" />
        <MetricCard icon={Percent} label="Equipment Efficiency (OEE)" value={Math.round(oee)} unit="%" tone={oee < 75 ? 'amber' : 'green'} />
        <MetricCard icon={AlertTriangle} label="Defect Rate" value={defectRate} unit="%" tone={defectRate > 5 ? 'red' : 'amber'} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Package className="size-4 text-primary" />
              Throughput & Belt Speed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              className="h-[260px] w-full"
              config={{
                throughput: { label: 'Throughput (units/hr)', color: 'var(--chart-1)' },
                belt: { label: 'Belt Speed (m/s)', color: 'var(--chart-4)' },
              }}
            >
              <LineChart data={data} margin={{ left: -20, right: 8, top: 8 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="t" tickLine={false} axisLine={false} minTickGap={32} fontSize={11} />
                <YAxis yAxisId="left" tickLine={false} axisLine={false} fontSize={11} width={40} />
                <YAxis yAxisId="right" orientation="left" tickLine={false} axisLine={false} fontSize={11} domain={[0, 1.2]} width={36} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Line yAxisId="left" dataKey="throughput" type="monotone" stroke="var(--color-throughput)" strokeWidth={2.5} dot={false} isAnimationActive={false} />
                <Line yAxisId="right" dataKey="belt" type="monotone" stroke="var(--color-belt)" strokeWidth={2.5} dot={false} isAnimationActive={false} />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Percent className="size-4 text-primary" />
              Overall Efficiency
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-3 pt-2">
            <RadialGauge value={oee} label="Overall OEE" color="oklch(0.78 0.14 210)" size={190} />
            <div className="flex w-full items-center justify-between rounded-lg border border-border bg-secondary/40 px-3 py-2 text-sm">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Thermometer className="size-4" /> Belt Temperature
              </span>
              <span className="font-mono font-semibold">{beltTemp}°C</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <GitCommitVertical className="size-4 text-primary" />
              Good Output vs Defects per Station
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              className="h-[260px] w-full"
              config={{
                good: { label: 'Good Units', color: 'var(--chart-3)' },
                defect: { label: 'Defective Units', color: 'var(--chart-5)' },
              }}
            >
              <BarChart data={stationOutput} margin={{ left: -16, right: 8 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="station" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis tickLine={false} axisLine={false} fontSize={11} width={40} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey="good" stackId="a" fill="var(--color-good)" radius={[0, 0, 0, 0]} />
                <Bar dataKey="defect" stackId="a" fill="var(--color-defect)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Zap className="size-4 text-primary" />
              Station Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {stationOutput.map((s) => {
              const rate = (s.defect / (s.good + s.defect)) * 100
              const warn = rate > 4
              return (
                <div key={s.station} className="flex items-center justify-between rounded-lg border border-border bg-secondary/40 px-3 py-2.5">
                  <span className="text-sm">{s.station}</span>
                  <span className={`flex items-center gap-1.5 text-xs font-medium ${warn ? 'text-[oklch(0.8_0.15_80)]' : 'text-[oklch(0.82_0.15_145)]'}`}>
                    <span className="size-1.5 rounded-full bg-current" />
                    {warn ? 'Monitoring' : 'Normal'} · {rate.toFixed(1)}% defects
                  </span>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  )
}
