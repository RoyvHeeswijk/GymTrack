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
import { computeExerciseProgress } from '../lib/stats'

type Metric = 'maxWeightKg' | 'estimatedOneRepMax' | 'volumeKg'

const metricLabels: Record<Metric, string> = {
  maxWeightKg: 'Zwaarste set (kg)',
  estimatedOneRepMax: 'Geschatte 1RM (kg)',
  volumeKg: 'Volume per training (kg)',
}

export default function ProgressPage() {
  const { workouts, loading, error } = useWorkouts()
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null)
  const [metric, setMetric] = useState<Metric>('maxWeightKg')

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
      <div>
        <h1 className="text-2xl font-bold text-white">Progressie</h1>
        <p className="mt-1 text-sm text-slate-400">Zie per oefening hoe je sterker wordt.</p>
      </div>

      {exerciseNames.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-center">
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
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
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
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                    : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                {metricLabels[key]}
              </button>
            ))}
          </div>

          {trend !== null && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm">
              <span className="text-slate-400">Sinds je eerste log: </span>
              <span className={trend >= 0 ? 'font-semibold text-emerald-400' : 'font-semibold text-red-400'}>
                {trend >= 0 ? '+' : ''}
                {trend.toFixed(1)}%
              </span>
            </div>
          )}

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
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
                  <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    tickFormatter={(d: string) =>
                      new Date(d).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
                    }
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    domain={['auto', 'auto']}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      border: '1px solid #334155',
                      borderRadius: '0.75rem',
                      color: '#fff',
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
