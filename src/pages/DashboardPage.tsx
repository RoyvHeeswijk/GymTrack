import { Link, useLocation } from 'react-router-dom'
import { useWorkouts } from '../hooks/useWorkouts'
import {
  computeDashboardStats,
  computeMilestones,
  computePersonalRecords,
  formatDateNl,
} from '../lib/stats'

export default function DashboardPage() {
  const { workouts, loading, error } = useWorkouts()
  const location = useLocation()
  const justSaved = Boolean((location.state as { saved?: boolean } | null)?.saved)

  if (loading) return <p className="py-12 text-center text-slate-400">Laden…</p>
  if (error) return <p className="py-12 text-center text-red-400">{error}</p>

  const stats = computeDashboardStats(workouts)
  const records = computePersonalRecords(workouts).slice(0, 5)
  const milestones = computeMilestones(workouts)
  const achieved = milestones.filter((m) => m.achieved)
  const nextMilestone = milestones
    .filter((m) => !m.achieved)
    .sort((a, b) => b.progress - a.progress)[0]

  return (
    <div className="space-y-6">
      {justSaved && (
        <div className="rounded-xl bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-400">
          Training opgeslagen. Goed bezig! 💪
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-white">Jouw overzicht</h1>
        <p className="mt-1 text-sm text-slate-400">In één oogopslag zien hoe je ervoor staat.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Deze week" value={`${stats.workoutsThisWeek}`} sub="trainingen" />
        <StatCard label="Totaal" value={`${stats.totalWorkouts}`} sub="trainingen" />
        <StatCard label="Sets gelogd" value={`${stats.totalSets}`} sub="totaal" />
        <StatCard
          label="Volume"
          value={`${Math.round(stats.totalVolumeKg).toLocaleString('nl-NL')}`}
          sub="kg getild"
        />
      </div>

      {workouts.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-center">
          <p className="text-3xl">🏁</p>
          <h2 className="mt-2 font-semibold text-white">Nog geen trainingen</h2>
          <p className="mt-1 text-sm text-slate-400">
            Log je eerste training en zie hier direct je progressie verschijnen.
          </p>
          <Link
            to="/loggen"
            className="mt-4 inline-block rounded-xl bg-emerald-500 px-6 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
          >
            Eerste training loggen
          </Link>
        </div>
      ) : (
        <>
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">
              Persoonlijke records
            </h2>
            <div className="space-y-2">
              {records.map((pr) => (
                <div
                  key={pr.exerciseName}
                  className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-white">{pr.exerciseName}</p>
                    <p className="text-xs text-slate-500">{formatDateNl(pr.achievedAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-emerald-400">
                      {pr.bestWeightKg} kg × {pr.reps}
                    </p>
                    <p className="text-xs text-slate-500">
                      ≈ {Math.round(pr.estimatedOneRepMax)} kg 1RM
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">
              Mijlpalen
            </h2>
            {nextMilestone && (
              <div className="mb-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-medium text-white">Volgende: {nextMilestone.label}</span>
                  <span className="text-slate-400">{Math.round(nextMilestone.progress * 100)}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all"
                    style={{ width: `${nextMilestone.progress * 100}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-slate-500">{nextMilestone.description}</p>
              </div>
            )}
            {achieved.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {achieved.map((m) => (
                  <span
                    key={m.label}
                    className="rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400"
                  >
                    🏅 {m.label}
                  </span>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}

function StatCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
      <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-slate-400">{sub}</p>
    </div>
  )
}
