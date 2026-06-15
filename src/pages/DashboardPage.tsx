import { useMemo } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useWorkouts } from '../hooks/useWorkouts'
import { useSchedule } from '../hooks/useSchedule'
import {
  computeDashboardStats,
  computePersonalRecords,
  computeWeeklyStreak,
  formatDateNl,
} from '../lib/stats'
import { computeAgenda } from '../lib/scheduling'
import { useProfile } from '../hooks/useProfile'
import type { PlanDay } from '../lib/planner'

export default function DashboardPage() {
  const { workouts, loading, error } = useWorkouts()
  const { schedule } = useSchedule()
  const { displayName: name } = useProfile()
  const location = useLocation()
  const navigate = useNavigate()
  const justSaved = Boolean((location.state as { saved?: boolean } | null)?.saved)

  const agenda = useMemo(
    () => (schedule ? computeAgenda(schedule, workouts) : null),
    [schedule, workouts],
  )

  if (loading) {
    return <p className="py-8 text-center text-sm text-slate-500">Laden…</p>
  }
  if (error) {
    return <p className="py-8 text-center text-sm text-red-400">{error}</p>
  }

  const stats = computeDashboardStats(workouts)
  const streak = computeWeeklyStreak(workouts)
  const recent = workouts.slice(0, 2)
  const topPr = computePersonalRecords(workouts)[0] ?? null

  const focusDay: PlanDay | null = agenda?.today?.planDay ?? agenda?.next?.planDay ?? null
  const focusIsToday = Boolean(agenda?.today)

  function startLog() {
    navigate('/loggen')
  }

  return (
    <div className="dashboard-home">
      {justSaved && (
        <div className="dashboard-toast status-pill shrink-0 justify-center border-emerald-400/40 py-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Opgeslagen
        </div>
      )}

      <div className="dashboard-top shrink-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="section-title">Home</p>
            <h1 className="truncate text-xl font-bold tracking-tight text-white">Hallo, {name}</h1>
          </div>
          {streak > 0 && <span className="dashboard-streak shrink-0">🔥 {streak}w</span>}
        </div>
      </div>

      <div className="dashboard-hero shrink-0">
        {focusDay ? (
          <div className="card p-3.5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="section-title">{focusIsToday ? 'Vandaag' : 'Volgende sessie'}</p>
                <h2 className="truncate text-lg font-bold text-white">{focusDay.title}</h2>
                <p className="truncate text-xs text-slate-400">{focusDay.focus}</p>
              </div>
              <div className="surface-inset shrink-0 px-2.5 py-1.5 text-center">
                <p className="text-base font-bold tabular-nums text-white">{focusDay.exercises.length}</p>
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">oef.</p>
              </div>
            </div>

            {agenda && (
              <div className="mt-3">
                <div className="flex items-end gap-1">
                  {agenda.days.map((d) => (
                    <div key={d.weekday} className="flex min-w-0 flex-1 flex-col items-center gap-1">
                      <div
                        title={d.label}
                        className={`h-1.5 w-full rounded-full ${
                          d.done
                            ? 'bg-emerald-400'
                            : d.planDay
                              ? d.isToday
                                ? 'bg-cyan-400'
                                : 'bg-white/20'
                              : 'bg-white/[0.06]'
                        }`}
                      />
                      <span
                        className={`text-[9px] font-semibold uppercase ${
                          d.isToday ? 'text-cyan-400' : d.done ? 'text-emerald-400/80' : 'text-slate-500'
                        }`}
                      >
                        {d.shortLabel}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button type="button" onClick={() => startLog()} className="btn-primary mt-3 w-full py-3 text-sm">
              Start training →
            </button>
          </div>
        ) : !schedule ? (
          <div className="card p-3.5">
            <p className="section-title">Start hier</p>
            <h2 className="mt-0.5 text-lg font-bold text-white">Maak je schema</h2>
            <p className="mt-1 text-xs text-slate-400">AI of zelf invullen — daarna staat het in je agenda.</p>
            <button type="button" onClick={() => navigate('/planner')} className="btn-primary mt-3 w-full py-3 text-sm">
              Schema maken →
            </button>
          </div>
        ) : (
          <div className="card p-3.5 text-center">
            <p className="text-sm text-slate-400">Geen sessie gepland.</p>
            <Link to="/agenda" className="btn-secondary mt-2 inline-block px-5 py-2 text-xs">
              Agenda
            </Link>
          </div>
        )}
      </div>

      <div className="dashboard-stats shrink-0">
        <div className="grid grid-cols-2 gap-1.5">
          <StatPill label="Deze week" value={String(stats.workoutsThisWeek)} unit="trainingen" />
          <StatPill label="Totaal" value={String(stats.totalWorkouts)} unit="sessies" />
          <StatPill label="Sets" value={String(stats.totalSets)} unit="gelogd" />
          <StatPill
            label="Volume"
            value={Math.round(stats.totalVolumeKg).toLocaleString('nl-NL')}
            unit="kg"
          />
        </div>
      </div>

      {topPr && (
        <Link to="/progressie" className="card block shrink-0 p-3 transition hover:border-emerald-400/20">
          <p className="section-title">Sterkste lift</p>
          <p className="mt-1 truncate text-sm font-semibold text-white">{topPr.exerciseName}</p>
          <p className="mt-0.5 text-xs font-bold tabular-nums text-emerald-400">
            {topPr.bestWeightKg} kg × {topPr.reps}
          </p>
        </Link>
      )}

      <section className="dashboard-recent shrink-0">
        <div className="mb-1.5 flex items-center justify-between">
          <p className="section-title">Recente activiteit</p>
          <Link to="/geschiedenis" className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
            Alles →
          </Link>
        </div>

        {recent.length === 0 ? (
          <div className="card flex flex-col items-center p-4 text-center">
            <p className="text-sm font-medium text-white">Nog geen trainingen</p>
            <p className="mt-0.5 text-xs text-slate-500">Log je eerste sessie via Loggen.</p>
            <Link to="/loggen" className="btn-primary mt-3 px-5 py-2 text-xs">
              Loggen →
            </Link>
          </div>
        ) : (
          <div className="space-y-1.5">
            {recent.map((workout) => {
              const volume = workout.sets.reduce((sum, s) => sum + s.weight_kg * s.reps, 0)
              const exercises = new Set(workout.sets.map((s) => s.exercise_name)).size
              return (
                <div key={workout.id} className="card-tight flex items-center gap-2.5 px-3 py-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-emerald-400/20 bg-emerald-500/10 text-emerald-400">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="m6.5 6.5 11 11" />
                      <path d="M21 21l-1-1M3 3l1 1" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">{workout.name}</p>
                    <p className="text-[10px] text-slate-500">
                      {formatDateNl(workout.performed_at)} · {workout.sets.length} sets · {exercises} oef.
                    </p>
                  </div>
                  <p className="shrink-0 text-xs font-bold tabular-nums text-emerald-400">
                    {Math.round(volume).toLocaleString('nl-NL')} kg
                  </p>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}

function StatPill({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="card px-2.5 py-2">
      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="text-base font-bold tabular-nums text-white">{value}</p>
      {unit && <p className="text-[10px] text-slate-500">{unit}</p>}
    </div>
  )
}
