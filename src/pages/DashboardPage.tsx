import { useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useWorkouts } from '../hooks/useWorkouts'
import { useSchedule } from '../hooks/useSchedule'
import SchemaGenerator from '../components/SchemaGenerator'
import { AgendaStatusLink } from '../components/AgendaStatusBanner'
import {
  computeDashboardStats,
  computeMilestones,
  computePersonalRecords,
  computeWeeklyStreak,
  formatDateNl,
} from '../lib/stats'
import { computeAgenda } from '../lib/scheduling'
import { useProfile } from '../hooks/useProfile'
import type { PlanDay } from '../lib/planner'

export default function DashboardPage() {
  const { workouts, loading, error } = useWorkouts()
  const { schedule, reload: reloadSchedule } = useSchedule()
  const { displayName: name } = useProfile()
  const location = useLocation()
  const navigate = useNavigate()
  const justSaved = Boolean((location.state as { saved?: boolean } | null)?.saved)
  const [showGenerator, setShowGenerator] = useState(false)

  const agenda = useMemo(
    () => (schedule ? computeAgenda(schedule, workouts) : null),
    [schedule, workouts],
  )

  if (loading) return <p className="py-12 text-center text-slate-500">Laden…</p>
  if (error) return <p className="py-12 text-center text-red-400">{error}</p>

  const stats = computeDashboardStats(workouts)
  const streak = computeWeeklyStreak(workouts)
  const records = computePersonalRecords(workouts).slice(0, 4)
  const recent = workouts.slice(0, 3)
  const milestones = computeMilestones(workouts)
  const achieved = milestones.filter((m) => m.achieved)
  const nextMilestone = milestones.filter((m) => !m.achieved).sort((a, b) => b.progress - a.progress)[0]

  const focusDay: PlanDay | null = agenda?.today?.planDay ?? agenda?.next?.planDay ?? null
  const focusIsToday = Boolean(agenda?.today)

  function startLog() {
    navigate('/loggen')
  }

  const statusMessage = focusDay
    ? focusIsToday
      ? `Vandaag staat ${focusDay.title} gepland — ${focusDay.exercises.length} oefeningen.`
      : `Volgende sessie: ${focusDay.title}.`
    : schedule
      ? 'Je schema is actief. Log een training of bekijk je agenda.'
      : 'Nog geen schema — maak er een om te starten.'

  return (
    <div className="space-y-5">
      {schedule && <AgendaStatusLink />}

      {justSaved && (
        <div className="status-pill w-full justify-center border-emerald-400/40 py-2">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Training opgeslagen
        </div>
      )}

      {/* Begroeting + systeemstatus (Aura-stijl) */}
      <div>
        <p className="section-title">Dashboard</p>
        <h1 className="page-title mt-1">Hallo, {name}</h1>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{statusMessage}</p>
        {streak > 0 && (
          <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-amber-400/20 bg-amber-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-300">
            🔥 {streak} {streak === 1 ? 'week' : 'weken'} streak
          </div>
        )}
      </div>

      {/* Hero: training vandaag + grote CTA-pill */}
      {focusDay ? (
        <div className="card">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="section-title">
                {focusIsToday ? 'Sessie vandaag' : 'Volgende sessie'}
              </p>
              <h2 className="mt-1 truncate text-xl font-bold text-white">{focusDay.title}</h2>
              <p className="truncate text-sm text-slate-400">{focusDay.focus}</p>
            </div>
            <div className="surface-inset shrink-0 px-3 py-2 text-center">
              <p className="metric-value text-lg">{focusDay.exercises.length}</p>
              <p className="metric-label">oef.</p>
            </div>
          </div>

          {agenda && (
            <div className="mt-4 flex items-center gap-1">
              {agenda.days.map((d) => (
                <div
                  key={d.weekday}
                  title={d.label}
                  className={`h-1 flex-1 rounded-full ${
                    d.done ? 'bg-emerald-400' : d.planDay ? (d.isToday ? 'bg-cyan-400' : 'bg-white/15') : 'bg-white/[0.04]'
                  }`}
                />
              ))}
            </div>
          )}

          <button onClick={() => startLog()} className="btn-primary mt-4 w-full">
            Start training →
          </button>
        </div>
      ) : !schedule ? (
        <div className="card">
          <div className="min-w-0">
            <p className="section-title">Start hier</p>
            <h2 className="mt-1 text-xl font-bold text-white">Maak je trainingsschema</h2>
            <p className="mt-1 text-sm text-slate-400">
              Laat de AI een schema maken of vul zelf je bestaande schema in.
            </p>
          </div>
          <button type="button" onClick={() => navigate('/planner')} className="btn-primary mt-4 w-full">
            Schema maken →
          </button>
        </div>
      ) : (
        <div className="card text-center">
          <p className="text-sm text-slate-400">Geen training gepland op korte termijn.</p>
          <Link to="/agenda" className="btn-secondary mt-3 inline-block">
            Naar agenda
          </Link>
        </div>
      )}

      {/* Metrics grid (telemetry-stijl) */}
      <div className="grid grid-cols-2 gap-2">
        <MetricCard label="Deze week" value={String(stats.workoutsThisWeek)} unit="trainingen" />
        <MetricCard label="Totaal" value={String(stats.totalWorkouts)} unit="sessies" />
        <MetricCard label="Sets" value={String(stats.totalSets)} unit="gelogd" />
        <MetricCard
          label="Volume"
          value={Math.round(stats.totalVolumeKg).toLocaleString('nl-NL')}
          unit="kg"
        />
      </div>

      {/* Schema generator ingeklapt */}
      {schedule && (
        <div className="card">
          <button
            onClick={() => setShowGenerator((v) => !v)}
            className="flex w-full items-center justify-between text-left"
          >
            <div>
              <p className="section-title">Schema</p>
              <p className="mt-1 font-semibold text-white">Nieuw schema genereren</p>
            </div>
            <span className="btn-ghost">{showGenerator ? 'Sluiten' : 'Openen'}</span>
          </button>
          {showGenerator && (
            <div className="mt-4 border-t border-white/[0.06] pt-4">
              <SchemaGenerator onActivated={reloadSchedule} />
            </div>
          )}
        </div>
      )}

      {workouts.length === 0 ? (
        <div className="card text-center">
          <p className="text-2xl">🏁</p>
          <h2 className="mt-2 font-bold text-white">Nog geen trainingen</h2>
          <p className="mt-1 text-sm text-slate-400">Log je eerste sessie om progressie te zien.</p>
          <Link to="/loggen" className="btn-primary mt-4 inline-block">
            Eerste training loggen →
          </Link>
        </div>
      ) : (
        <>
          {/* Recente activiteit — Aura activity cards */}
          <section>
            <div className="mb-2 flex items-center justify-between">
              <p className="section-title">Recente activiteit</p>
              <Link to="/geschiedenis" className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                Alles →
              </Link>
            </div>
            <div className="space-y-2">
              {recent.map((workout) => {
                const volume = workout.sets.reduce((sum, s) => sum + s.weight_kg * s.reps, 0)
                const exercises = new Set(workout.sets.map((s) => s.exercise_name)).size
                return (
                  <div key={workout.id} className="card-tight flex items-center gap-3 px-4 py-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-400/20 bg-emerald-500/10">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-400">
                        <path d="m6.5 6.5 11 11" />
                        <path d="M21 21l-1-1M3 3l1 1" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-white">{workout.name}</p>
                      <p className="text-xs text-slate-500">{formatDateNl(workout.performed_at)}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-bold tabular-nums text-emerald-400">
                        {Math.round(volume).toLocaleString('nl-NL')} kg
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {workout.sets.length} sets · {exercises} oef.
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          {/* PR's */}
          {records.length > 0 && (
            <section>
              <p className="section-title mb-2">Persoonlijke records</p>
              <div className="space-y-2">
                {records.map((pr) => (
                  <div key={pr.exerciseName} className="card-tight flex items-center justify-between px-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-white">{pr.exerciseName}</p>
                      <p className="text-[10px] text-slate-500">{formatDateNl(pr.achievedAt)}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-bold tabular-nums text-emerald-400">
                        {pr.bestWeightKg} kg × {pr.reps}
                      </p>
                      <p className="text-[10px] text-slate-500">≈ {Math.round(pr.estimatedOneRepMax)} kg 1RM</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Mijlpaal */}
          {nextMilestone && (
            <section className="card">
              <p className="section-title">Volgende mijlpaal</p>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="font-semibold text-white">{nextMilestone.label}</span>
                <span className="font-bold tabular-nums text-emerald-400">
                  {Math.round(nextMilestone.progress * 100)}%
                </span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400"
                  style={{ width: `${nextMilestone.progress * 100}%` }}
                />
              </div>
              {achieved.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {achieved.slice(-4).map((m) => (
                    <span key={m.label} className="chip text-[10px] text-emerald-400">
                      🏅 {m.label}
                    </span>
                  ))}
                </div>
              )}
            </section>
          )}
        </>
      )}
    </div>
  )
}

function MetricCard({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="card py-3">
      <p className="metric-label">{label}</p>
      <p className="metric-value mt-1">{value}</p>
      <p className="text-[10px] text-slate-500">{unit}</p>
    </div>
  )
}
