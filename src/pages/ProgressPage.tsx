import { useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useWorkouts } from '../hooks/useWorkouts'
import { useSettings } from '../hooks/useSettings'
import { computeExerciseProgress } from '../lib/stats'
import { computeExerciseTrends, type TrendDirection } from '../lib/analysis'
import PageHeader from '../components/PageHeader'

type Metric = 'maxWeightKg' | 'estimatedOneRepMax' | 'volumeKg'

const metricLabels: Record<Metric, string> = {
  maxWeightKg: 'Zwaarste set (kg)',
  estimatedOneRepMax: 'Geschatte 1RM (kg)',
  volumeKg: 'Volume per training (kg)',
}

const trendStyles: Record<TrendDirection, { box: string; text: string; label: string }> = {
  vooruitgang: {
    box: 'border-emerald-500/30 bg-emerald-500/5',
    text: 'text-emerald-400',
    label: 'AI-analyse: vooruitgang',
  },
  stagnatie: {
    box: 'border-amber-500/30 bg-amber-500/5',
    text: 'text-amber-400',
    label: 'AI-analyse: stagnatie gedetecteerd',
  },
  achteruitgang: {
    box: 'border-red-500/30 bg-red-500/5',
    text: 'text-red-400',
    label: 'AI-analyse: achteruitgang',
  },
  'te-weinig-data': {
    box: 'border-slate-700 bg-slate-900/60',
    text: 'text-slate-400',
    label: 'AI-analyse: meer data nodig',
  },
}

export default function ProgressPage() {
  const { workouts, loading, error } = useWorkouts()
  const { settings } = useSettings()
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null)
  const [metric, setMetric] = useState<Metric>('maxWeightKg')

  const chartTheme = settings.lightMode
    ? { grid: '#e2e8f0', tick: '#64748b', tooltipBg: '#ffffff', tooltipBorder: '#cbd5e1', tooltipText: '#0f172a' }
    : { grid: '#1e293b', tick: '#64748b', tooltipBg: '#0f172a', tooltipBorder: '#334155', tooltipText: '#fff' }

  const exerciseNames = useMemo(() => {
    const names = new Set<string>()
    for (const workout of workouts) {
      for (const set of workout.sets) names.add(set.exercise_name)
    }
    return [...names].sort((a, b) => a.localeCompare(b, 'nl'))
  }, [workouts])

  const activeExercise = selectedExercise ?? exerciseNames[0] ?? null

  const data = useMemo(
    () => (activeExercise ? computeExerciseProgress(workouts, activeExercise) : []),
    [workouts, activeExercise],
  )

  const trends = useMemo(() => computeExerciseTrends(workouts), [workouts])
  const activeTrend = trends.find((t) => t.exerciseName === activeExercise)

  const trend = useMemo(() => {
    if (data.length < 2) return null
    const first = data[0][metric]
    const last = data[data.length - 1][metric]
    if (first === 0) return null
    return ((last - first) / first) * 100
  }, [data, metric])

  if (loading) return <p className="py-12 text-center text-slate-400">Laden…</p>
  if (error) return <p className="py-12 text-center text-red-400">{error}</p>

  return (
    <div className="space-y-5">
      <PageHeader
        section="Analytics"
        title="Progressie"
        description="Sterkte en volume per oefening."
      />

      {exerciseNames.length === 0 ? (
        <div className="card text-center">
          <p className="text-3xl">📈</p>
          <p className="mt-2 text-sm text-slate-400">
            Log eerst een training om hier je progressiegrafieken te zien.
          </p>
        </div>
      ) : (
        <>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {exerciseNames.map((name) => (
              <button
                key={name}
                onClick={() => setSelectedExercise(name)}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${
                  name === activeExercise
                    ? 'bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-950'
                    : 'border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                {name}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            {(Object.keys(metricLabels) as Metric[]).map((key) => (
              <button
                key={key}
                onClick={() => setMetric(key)}
                className={`flex-1 rounded-xl border px-2 py-2 text-xs font-medium transition ${
                  metric === key
                    ? 'border-emerald-400/50 bg-emerald-500/10 text-emerald-400'
                    : 'border-white/10 bg-white/5 text-slate-400 hover:text-slate-200'
                }`}
              >
                {metricLabels[key]}
              </button>
            ))}
          </div>

          {trend !== null && (
            <div className="card-tight px-4 py-3 text-sm">
              <span className="text-slate-400">Sinds je eerste log: </span>
              <span className={trend >= 0 ? 'font-semibold text-emerald-400' : 'font-semibold text-red-400'}>
                {trend >= 0 ? '+' : ''}
                {trend.toFixed(1)}%
              </span>
            </div>
          )}

          {activeTrend && (
            <div className={`rounded-2xl border p-4 ${trendStyles[activeTrend.direction].box}`}>
              <p className={`text-sm font-semibold ${trendStyles[activeTrend.direction].text}`}>
                {trendStyles[activeTrend.direction].label}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-slate-300">{activeTrend.message}</p>
            </div>
          )}

          <div className="card">
            {data.length < 2 ? (
              <p className="py-8 text-center text-sm text-slate-400">
                Log deze oefening op meerdere dagen om een grafiek te zien.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="progressGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#34d399" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={chartTheme.grid} strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: chartTheme.tick, fontSize: 11 }}
                    tickFormatter={(d: string) =>
                      new Date(d).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
                    }
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: chartTheme.tick, fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    domain={['auto', 'auto']}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: chartTheme.tooltipBg,
                      border: `1px solid ${chartTheme.tooltipBorder}`,
                      borderRadius: '0.75rem',
                      color: chartTheme.tooltipText,
                    }}
                    labelFormatter={(d) =>
                      new Date(String(d)).toLocaleDateString('nl-NL', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                      })
                    }
                    formatter={(value) => [`${String(value)} kg`, metricLabels[metric]]}
                  />
                  <Area
                    type="monotone"
                    dataKey={metric}
                    stroke="#34d399"
                    strokeWidth={2.5}
                    fill="url(#progressGradient)"
                    dot={{ fill: '#34d399', r: 3 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </>
      )}
    </div>
  )
}
