import { useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useSchedule } from '../hooks/useSchedule'
import { useWorkouts } from '../hooks/useWorkouts'
import { updateScheduleAssignments } from '../lib/api'
import { computeAgenda, computeMonth, WEEKDAY_SHORT } from '../lib/scheduling'
import PageHeader from '../components/PageHeader'
import { AgendaActivatedNotice } from '../components/AgendaStatusBanner'

export default function AgendaPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const scheduleJustActivated = Boolean(
    (location.state as { scheduleActivated?: boolean } | null)?.scheduleActivated,
  )
  const { schedule, setSchedule, loading } = useSchedule()
  const { workouts, loading: workoutsLoading } = useWorkouts()
  const [editingWeekday, setEditingWeekday] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [view, setView] = useState<'week' | 'maand'>('week')
  const [monthOffset, setMonthOffset] = useState(0)

  const agenda = useMemo(
    () => (schedule ? computeAgenda(schedule, workouts) : null),
    [schedule, workouts],
  )

  const monthBase = useMemo(() => {
    const d = new Date()
    d.setDate(1)
    d.setMonth(d.getMonth() + monthOffset)
    return d
  }, [monthOffset])

  const monthWeeks = useMemo(
    () => (schedule ? computeMonth(schedule, workouts, monthBase.getFullYear(), monthBase.getMonth()) : []),
    [schedule, workouts, monthBase],
  )

  if (loading || workoutsLoading) {
    return <p className="py-12 text-center text-slate-400">Laden…</p>
  }

  if (!schedule || !agenda) {
    return (
      <div className="app-page">
        <PageHeader section="Agenda" title="Weekplanning" compact />
        <div className="card text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-xl">
            🗓️
          </div>
          <h2 className="font-semibold text-white">Nog geen actieve agenda</h2>
          <p className="mx-auto mt-1 max-w-xs text-sm text-slate-400">
            Maak een schema en activeer dat als weekagenda.
          </p>
          <Link to="/planner" className="btn-primary mt-3 inline-block px-6">
            Schema maken
          </Link>
        </div>
      </div>
    )
  }

  function startDay() {
    navigate('/loggen')
  }

  async function changeAssignment(weekday: number, planDayIndex: number | null) {
    if (!schedule) return
    const assignments = [...schedule.assignments]
    assignments[weekday] = planDayIndex
    setSchedule({ ...schedule, assignments })
    setEditingWeekday(null)
    setSaving(true)
    try {
      await updateScheduleAssignments(schedule.id, assignments)
    } catch {
      // bij fout: herladen zou corrigeren; we laten de optimistische update staan
    } finally {
      setSaving(false)
    }
  }

  const pct = agenda.adherence.planned
    ? Math.round((agenda.adherence.done / agenda.adherence.planned) * 100)
    : 0

  return (
    <div className="app-page">
      {scheduleJustActivated && <AgendaActivatedNotice />}

      <PageHeader section="Agenda" title="Weekplanning" compact />

      <div className="agenda-hero card-tight bg-gradient-to-br from-emerald-500/15 to-cyan-500/10 px-3.5 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            {agenda.next ? (
              <>
                <p className="truncate text-sm font-bold text-white">{agenda.next.planDay.title}</p>
                <p className="truncate text-xs text-slate-300">{agenda.next.planDay.focus}</p>
              </>
            ) : (
              <p className="text-sm font-medium text-white">Deze week</p>
            )}
            <div className="mt-2 flex items-center gap-2">
              <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="shrink-0 text-[10px] tabular-nums text-slate-400">
                {agenda.adherence.done}/{agenda.adherence.planned}
              </span>
            </div>
            {agenda.missed.length > 0 && (
              <p className="mt-1 text-[10px] text-amber-400">
                {agenda.missed.length} gemist — pak de volgende training op
              </p>
            )}
          </div>
          {agenda.next && (
            <button onClick={() => startDay()} className="btn-primary shrink-0 px-4 py-2 text-xs">
              Start
            </button>
          )}
        </div>
      </div>

      <div className="agenda-view-toggle flex gap-1 rounded-xl border border-white/10 bg-white/5 p-0.5">
        {(['week', 'maand'] as const).map((option) => (
          <button
            key={option}
            onClick={() => setView(option)}
            className={`flex-1 rounded-lg py-1.5 text-[11px] font-semibold capitalize transition ${
              view === option ? 'bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-950' : 'text-slate-300'
            }`}
          >
            {option === 'week' ? 'Week' : 'Maand'}
          </button>
        ))}
      </div>

      {view === 'maand' && (
        <section className="card-tight px-3 py-3">
          <div className="mb-2 flex items-center justify-between">
            <button
              onClick={() => setMonthOffset((o) => o - 1)}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 text-slate-300 transition hover:bg-white/5"
            >
              ‹
            </button>
            <p className="text-xs font-semibold capitalize text-white">
              {monthBase.toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' })}
            </p>
            <button
              onClick={() => setMonthOffset((o) => o + 1)}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 text-slate-300 transition hover:bg-white/5"
            >
              ›
            </button>
          </div>

          <div className="mb-0.5 grid grid-cols-7 gap-0.5">
            {WEEKDAY_SHORT.map((label) => (
              <div key={label} className="text-center text-[9px] font-medium text-slate-500">
                {label}
              </div>
            ))}
          </div>

          <div className="space-y-0.5">
            {monthWeeks.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7 gap-0.5">
                {week.map((day) => (
                  <button
                    key={day.date.toISOString()}
                    onClick={() => day.planDay && startDay()}
                    disabled={!day.planDay}
                    title={day.planDay ? day.planDay.title : 'Rustdag'}
                    className={`flex aspect-square flex-col items-center justify-center rounded-md text-[10px] transition ${
                      !day.inMonth ? 'opacity-30' : ''
                    } ${
                      day.done
                        ? 'bg-gradient-to-br from-emerald-400 to-cyan-400 font-semibold text-slate-950'
                        : day.missed
                          ? 'bg-amber-500/15 text-amber-300'
                          : day.planDay
                            ? 'bg-white/10 text-white hover:bg-white/20'
                            : 'text-slate-600'
                    } ${day.isToday ? 'ring-1 ring-cyan-400' : ''}`}
                  >
                    <span>{day.date.getDate()}</span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </section>
      )}

      {view === 'week' && (
        <section className="space-y-1.5">
          {saving && <p className="text-right text-[10px] text-slate-500">opslaan…</p>}
          {agenda.days.map((day) => (
            <div
              key={day.weekday}
              className={`agenda-day-row card-tight ${day.isToday ? 'agenda-day-row--today ring-1 ring-emerald-400/40' : ''}`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <div
                    className={`agenda-day-badge ${
                      day.planDay ? 'agenda-day-badge--plan' : 'agenda-day-badge--rest'
                    }`}
                  >
                    {day.shortLabel}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">
                      {day.planDay ? day.planDay.title : 'Rust'}
                      {day.isToday && <span className="ml-1.5 text-[10px] text-emerald-400">nu</span>}
                    </p>
                    <p className="truncate text-[11px] text-slate-500">
                      {day.done ? '✓ Klaar' : day.missed ? 'Gemist' : day.planDay ? day.planDay.focus : 'Herstel'}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {day.planDay && !day.done && (
                    <button
                      onClick={() => startDay()}
                      className="agenda-day-start rounded-lg px-2 py-1 text-[10px] font-semibold transition"
                    >
                      Start
                    </button>
                  )}
                  <button
                    onClick={() => setEditingWeekday(editingWeekday === day.weekday ? null : day.weekday)}
                    className="agenda-day-edit rounded-lg border px-2 py-1 text-[10px] transition"
                  >
                    {editingWeekday === day.weekday ? '✕' : 'Wijzig'}
                  </button>
                </div>
              </div>

              {editingWeekday === day.weekday && (
                <div className="mt-2 border-t border-white/5 pt-2">
                  <div className="flex flex-wrap gap-1">
                    <button
                      onClick={() => changeAssignment(day.weekday, null)}
                      className={`chip text-[11px] ${day.planDay === null ? 'chip-active' : ''}`}
                    >
                      Rust
                    </button>
                    {schedule.days.map((planDay, index) => (
                      <button
                        key={index}
                        onClick={() => changeAssignment(day.weekday, index)}
                        className={`chip text-[11px] ${day.planDayIndex === index ? 'chip-active' : ''}`}
                      >
                        {planDay.title}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </section>
      )}
    </div>
  )
}
