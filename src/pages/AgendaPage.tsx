import { useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useSchedule } from '../hooks/useSchedule'
import { useWorkouts } from '../hooks/useWorkouts'
import { updateScheduleAssignments } from '../lib/api'
import { computeAgenda, computeMonth, WEEKDAY_LABELS, WEEKDAY_SHORT } from '../lib/scheduling'
import PageHeader from '../components/PageHeader'
import { AgendaActivatedNotice } from '../components/AgendaStatusBanner'
import SchemaStoragePanel, { HiddenSchemasHint } from '../components/SchemaStoragePanel'

export default function AgendaPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const scheduleJustActivated = Boolean(
    (location.state as { scheduleActivated?: boolean } | null)?.scheduleActivated,
  )
  const { schedule, setSchedule, loading, reload } = useSchedule()
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
      <div className="space-y-5">
        <PageHeader
          section="Agenda"
          title="Weekplanning"
          description="Pas dagen aan naar wens. Gemiste trainingen schuiven vanzelf door."
        />
        <div className="card text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-2xl">
            🗓️
          </div>
          <h2 className="font-semibold text-white">Nog geen actieve agenda</h2>
          <p className="mx-auto mt-1 max-w-xs text-sm text-slate-400">
            Laat de AI Schema-Architect een schema maken en activeer dat als jouw weekagenda. Geef
            daarbij aan welke dagen je niet kunt en hoeveel tijd je hebt.
          </p>
          <HiddenSchemasHint />
          <Link to="/planner" className="btn-primary mt-4 inline-block px-6">
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
    <div className="space-y-5">
      {scheduleJustActivated && <AgendaActivatedNotice />}

      <PageHeader
        section="Agenda"
        title="Weekplanning"
        description="Pas dagen aan naar wens. Gemiste trainingen schuiven vanzelf door."
      />

      {/* Volgende training (rotatie, schuift mee bij gemiste dagen) */}
      {agenda.next && (
        <div className="card bg-gradient-to-br from-emerald-500/15 to-cyan-500/10">
          <p className="section-title text-emerald-300/80">Volgende training</p>
          <div className="mt-1 flex items-end justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">{agenda.next.planDay.title}</h2>
              <p className="text-sm text-slate-300">{agenda.next.planDay.focus}</p>
            </div>
            <button onClick={() => startDay()} className="btn-primary px-5 py-2.5 text-sm">
              Start
            </button>
          </div>
          <p className="mt-2 text-xs text-slate-400">
            {agenda.next.planDay.exercises.length} oefeningen · schuift automatisch mee als je een dag overslaat
          </p>
        </div>
      )}

      {/* Wekelijkse voortgang */}
      <div className="card">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium text-white">Deze week voltooid</span>
          <span className="text-slate-400">
            {agenda.adherence.done}/{agenda.adherence.planned} trainingen
          </span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        {agenda.missed.length > 0 && (
          <p className="mt-2 text-xs text-amber-400">
            {agenda.missed.length} gemiste training{agenda.missed.length > 1 ? 'en' : ''} deze week — geen
            stress, pak de volgende training gewoon op.
          </p>
        )}
      </div>

      {/* Schakelaar week / maand */}
      <div className="flex gap-1 rounded-2xl border border-white/10 bg-white/5 p-1">
        {(['week', 'maand'] as const).map((option) => (
          <button
            key={option}
            onClick={() => setView(option)}
            className={`flex-1 rounded-xl py-2 text-xs font-semibold capitalize transition ${
              view === option ? 'bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-950' : 'text-slate-300'
            }`}
          >
            {option === 'week' ? 'Weekoverzicht' : 'Maandoverzicht'}
          </button>
        ))}
      </div>

      {/* Maandoverzicht */}
      {view === 'maand' && (
        <section className="card">
          <div className="mb-3 flex items-center justify-between">
            <button
              onClick={() => setMonthOffset((o) => o - 1)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-slate-300 transition hover:bg-white/5"
            >
              ‹
            </button>
            <p className="text-sm font-semibold capitalize text-white">
              {monthBase.toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' })}
            </p>
            <button
              onClick={() => setMonthOffset((o) => o + 1)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-slate-300 transition hover:bg-white/5"
            >
              ›
            </button>
          </div>

          <div className="mb-1 grid grid-cols-7 gap-1">
            {WEEKDAY_SHORT.map((label) => (
              <div key={label} className="text-center text-[10px] font-medium text-slate-500">
                {label}
              </div>
            ))}
          </div>

          <div className="space-y-1">
            {monthWeeks.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7 gap-1">
                {week.map((day) => (
                  <button
                    key={day.date.toISOString()}
                    onClick={() => day.planDay && startDay()}
                    disabled={!day.planDay}
                    title={day.planDay ? day.planDay.title : 'Rustdag'}
                    className={`flex aspect-square flex-col items-center justify-center rounded-lg text-[11px] transition ${
                      !day.inMonth ? 'opacity-30' : ''
                    } ${
                      day.done
                        ? 'bg-gradient-to-br from-emerald-400 to-cyan-400 font-semibold text-slate-950'
                        : day.missed
                          ? 'bg-amber-500/15 text-amber-300'
                          : day.planDay
                            ? 'bg-white/10 text-white hover:bg-white/20'
                            : 'text-slate-600'
                    } ${day.isToday ? 'ring-2 ring-cyan-400' : ''}`}
                  >
                    <span>{day.date.getDate()}</span>
                    {day.planDay && <span className="h-1 w-1 rounded-full bg-current opacity-70" />}
                  </button>
                ))}
              </div>
            ))}
          </div>

          <div className="mt-3 flex flex-wrap gap-3 text-[10px] text-slate-400">
            <Legend className="bg-gradient-to-br from-emerald-400 to-cyan-400" label="Voltooid" />
            <Legend className="bg-amber-500/40" label="Gemist" />
            <Legend className="bg-white/20" label="Gepland" />
            <Legend className="ring-2 ring-cyan-400" label="Vandaag" />
          </div>
        </section>
      )}

      {/* Weekoverzicht */}
      {view === 'week' && (
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="section-title">Weekoverzicht</h2>
          {saving && <span className="text-[11px] text-slate-500">opslaan…</span>}
        </div>
        <div className="space-y-2">
          {agenda.days.map((day) => (
            <div
              key={day.weekday}
              className={`card-tight px-4 py-3 ${day.isToday ? 'ring-1 ring-emerald-400/40' : ''}`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    className={`flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl text-[11px] font-semibold ${
                      day.planDay
                        ? 'bg-gradient-to-br from-emerald-400/20 to-cyan-400/20 text-emerald-300'
                        : 'bg-white/5 text-slate-500'
                    }`}
                  >
                    {day.shortLabel}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-white">
                      {day.planDay ? day.planDay.title : 'Rustdag'}
                      {day.isToday && <span className="ml-2 text-[11px] text-emerald-400">vandaag</span>}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {day.done
                        ? '✓ Voltooid'
                        : day.missed
                          ? 'Gemist'
                          : day.planDay
                            ? day.planDay.focus
                            : 'Herstel & rust'}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {day.planDay && !day.done && (
                    <button
                      onClick={() => startDay()}
                      className="rounded-lg bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-white/20"
                    >
                      Start
                    </button>
                  )}
                  <button
                    onClick={() => setEditingWeekday(editingWeekday === day.weekday ? null : day.weekday)}
                    className="rounded-lg border border-white/10 px-2.5 py-1.5 text-[11px] text-slate-300 transition hover:bg-white/5"
                  >
                    Wijzig
                  </button>
                </div>
              </div>

              {editingWeekday === day.weekday && (
                <div className="mt-3 border-t border-white/5 pt-3">
                  <p className="mb-2 text-[11px] text-slate-400">
                    Wat wil je op {WEEKDAY_LABELS[day.weekday].toLowerCase()} doen?
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      onClick={() => changeAssignment(day.weekday, null)}
                      className={`chip ${day.planDay === null ? 'chip-active' : ''}`}
                    >
                      Rustdag
                    </button>
                    {schedule.days.map((planDay, index) => (
                      <button
                        key={index}
                        onClick={() => changeAssignment(day.weekday, index)}
                        className={`chip ${day.planDayIndex === index ? 'chip-active' : ''}`}
                      >
                        {planDay.title}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
      )}

      <Link to="/planner" className="btn-secondary block">
        Nieuw schema maken
      </Link>

      <SchemaStoragePanel onChanged={reload} showHidden={false} embedded />
    </div>
  )
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-3 w-3 rounded ${className}`} />
      {label}
    </span>
  )
}

