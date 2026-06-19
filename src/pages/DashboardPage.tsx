import { useMemo } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useWorkouts } from '../hooks/useWorkouts'
import { useSchedule } from '../hooks/useSchedule'
import { computeDashboardStats, computeWeeklyStreak, formatDateNl } from '../lib/stats'
import { computeAgenda } from '../lib/scheduling'
import { useProfile } from '../hooks/useProfile'
import {
  computeBiggestImprovement,
  computeCoachInsights,
  computeRecentPRs,
  computeTrainingRecommendation,
  computeWeeklyActivity,
  computeWeeklyVolumeKg,
  formatGoalLabel,
  getDailyTip,
  getMotivationTip,
  weekdayLabel,
} from '../lib/dashboardInsights'

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
  const weeklyVolume = computeWeeklyVolumeKg(workouts)
  const recentPrs = computeRecentPRs(workouts, 5)
  const latestPr = recentPrs[0] ?? null
  const biggestGain = computeBiggestImprovement(recentPrs)
  const coachInsights = computeCoachInsights(workouts)
  const weekBars = computeWeeklyActivity(workouts)
  const maxBar = Math.max(1, ...weekBars.map((b) => b.count))
  const goalLabel = formatGoalLabel(schedule?.goal)
  const motivation = getMotivationTip()
  const dailyTip = getDailyTip()
  const trainingTip = computeTrainingRecommendation(agenda, schedule?.goal ?? null)

  const focusDay = agenda?.today?.planDay ?? agenda?.next?.planDay ?? null
  const focusIsToday = Boolean(agenda?.today)
  const focusWeekday = agenda?.today
    ? agenda.days.find((d) => d.isToday)?.weekday
    : agenda?.next?.weekday

  const weekPct =
    agenda && agenda.adherence.planned
      ? Math.round((agenda.adherence.done / agenda.adherence.planned) * 100)
      : 0

  function startLog() {
    navigate('/loggen')
  }

  return (
    <div className="dashboard-home space-y-4 pb-2">
      {justSaved && (
        <div className="dashboard-toast status-pill justify-center border-emerald-400/40 py-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Training opgeslagen
        </div>
      )}

      {/* Welkomstsectie */}
      <section className="card p-4">
        <p className="section-title">Welkom terug</p>
        <h1 className="mt-1 text-xl font-bold tracking-tight text-white">Hallo, {name}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
            Doel: {goalLabel}
          </span>
          {streak > 0 && <span className="dashboard-streak">🔥 {streak}w streak</span>}
        </div>
      </section>

      {/* Vandaag */}
      <section className="card p-4">
        <p className="section-title">{focusIsToday ? 'Vandaag' : 'Eerstvolgende training'}</p>
        {focusDay ? (
          <>
            <h2 className="mt-1 text-lg font-bold text-white">{focusDay.title}</h2>
            <p className="mt-0.5 text-sm text-slate-400">{focusDay.focus}</p>
            <p className="mt-2 text-xs text-slate-500">
              {focusIsToday ? 'Vandaag' : weekdayLabel(focusWeekday ?? null)} · {focusDay.exercises.length} oefeningen
            </p>
            <button type="button" onClick={() => startLog()} className="btn-primary mt-4 w-full py-3 text-sm">
              Start training →
            </button>
          </>
        ) : !schedule ? (
          <>
            <h2 className="mt-1 text-lg font-bold text-white">Nog geen schema</h2>
            <p className="mt-1 text-sm text-slate-400">Maak een schema en activeer het om trainingen te plannen.</p>
            <button type="button" onClick={() => navigate('/planner')} className="btn-primary mt-4 w-full py-3 text-sm">
              Schema maken →
            </button>
          </>
        ) : (
          <>
            <p className="mt-1 text-sm text-slate-400">Geen sessie gepland in je agenda.</p>
            <Link to="/agenda" className="btn-secondary mt-3 inline-block px-5 py-2 text-xs">
              Bekijk agenda
            </Link>
          </>
        )}
      </section>

      {/* Persoonlijke statistieken */}
      <section>
        <p className="section-title mb-2">Jouw statistieken</p>
        <div className="grid grid-cols-2 gap-2">
          <StatCard label="Deze week" value={String(stats.workoutsThisWeek)} sub="trainingen" />
          <StatCard label="Streak" value={String(streak)} sub="weken" />
          <StatCard label="Totaal" value={String(stats.totalWorkouts)} sub="afgerond" />
          <StatCard
            label="Volume deze week"
            value={Math.round(weeklyVolume).toLocaleString('nl-NL')}
            sub="kg"
          />
        </div>
      </section>

      {/* PR's */}
      {recentPrs.length > 0 && (
        <section>
          <div className="mb-2 flex items-center justify-between">
            <p className="section-title">Persoonlijke records</p>
            <Link to="/progressie" className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
              Alles →
            </Link>
          </div>

          {latestPr && (
            <div className="card mb-2 p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Laatste PR</p>
              <p className="mt-1 font-semibold text-white">{latestPr.exerciseName}</p>
              <p className="mt-0.5 text-sm font-bold tabular-nums text-emerald-400">
                {latestPr.bestWeightKg} kg × {latestPr.reps}
              </p>
              <p className="mt-1 text-[10px] text-slate-500">{formatDateNl(latestPr.achievedAt)}</p>
            </div>
          )}

          {biggestGain && biggestGain.improvementKg > 0 && (
            <div className="card border-emerald-400/20 bg-emerald-500/[0.06] p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Grootste verbetering</p>
              <p className="mt-1 text-sm text-white">
                {biggestGain.exerciseName}: +{biggestGain.improvementKg} kg
              </p>
            </div>
          )}

          {recentPrs.length > 1 && (
            <div className="mt-2 space-y-1.5">
              {recentPrs.slice(1, 4).map((pr) => (
                <div key={`${pr.exerciseName}-${pr.achievedAt}`} className="card-tight flex items-center justify-between px-3 py-2">
                  <span className="truncate text-sm text-white">{pr.exerciseName}</span>
                  <span className="shrink-0 text-xs font-bold tabular-nums text-emerald-400">
                    {pr.bestWeightKg} kg
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* AI Coach */}
      <section className="card p-4">
        <p className="section-title">AI Coach</p>
        <ul className="mt-3 space-y-2">
          {coachInsights.map((line) => (
            <li key={line} className="flex gap-2 text-sm leading-snug text-slate-300">
              <span className="shrink-0 text-emerald-400">✦</span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Voortgang */}
      <section className="card p-4">
        <p className="section-title">Voortgang</p>
        <div className="mt-3 flex items-end justify-between gap-2">
          {weekBars.map((bar) => (
            <div key={bar.label} className="flex min-w-0 flex-1 flex-col items-center gap-1">
              <div className="flex h-16 w-full items-end">
                <div
                  className={`w-full rounded-t-md transition-all ${
                    bar.isCurrent ? 'bg-cyan-400' : 'bg-white/15'
                  }`}
                  style={{ height: `${Math.max(8, (bar.count / maxBar) * 100)}%` }}
                />
              </div>
              <span className={`text-[9px] font-semibold ${bar.isCurrent ? 'text-cyan-400' : 'text-slate-500'}`}>
                {bar.label}
              </span>
              <span className="text-[10px] tabular-nums text-slate-400">{bar.count}</span>
            </div>
          ))}
        </div>
        {agenda && agenda.adherence.planned > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Weekconsistentie</span>
              <span className="tabular-nums text-white">
                {agenda.adherence.done}/{agenda.adherence.planned} ({weekPct}%)
              </span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400"
                style={{ width: `${weekPct}%` }}
              />
            </div>
          </div>
        )}
      </section>

      {/* Motivatie */}
      <section className="card space-y-3 p-4">
        <p className="section-title">Motivatie</p>
        <p className="text-sm leading-relaxed text-slate-300">{motivation}</p>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Tip van vandaag</p>
          <p className="mt-1 text-sm text-slate-300">{dailyTip}</p>
        </div>
        <div className="rounded-xl border border-cyan-400/20 bg-cyan-500/[0.06] px-3 py-2.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">Voor je training</p>
          <p className="mt-1 text-sm text-slate-200">{trainingTip}</p>
        </div>
      </section>
    </div>
  )
}

function StatCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="card px-3 py-2.5">
      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="text-lg font-bold tabular-nums text-white">{value}</p>
      <p className="text-[10px] text-slate-500">{sub}</p>
    </div>
  )
}
