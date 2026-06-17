import { useMemo, useState } from 'react'
import { DEFAULT_EXERCISES } from '../lib/api'
import { EXERCISE_DB } from '../lib/exerciseDb'
import {
  buildPlanFromManual,
  WEEKDAY_SHORT,
  type GeneratedPlan,
  type PlanDay,
  type PlanExercise,
} from '../lib/planner'

const TIME_OPTIONS = [30, 45, 60, 75, 90]

interface DraftExercise {
  id: number
  name: string
  sets: string
  reps: string
}

interface DraftDay {
  id: number
  title: string
  focus: string
  exercises: DraftExercise[]
}

let dayId = 0
let exerciseId = 0

function newExercise(): DraftExercise {
  return { id: ++exerciseId, name: '', sets: '3', reps: '8-12' }
}

function newDay(index: number): DraftDay {
  return {
    id: ++dayId,
    title: `Training ${index}`,
    focus: '',
    exercises: [newExercise()],
  }
}

interface ManualSchemaBuilderProps {
  onComplete: (plan: GeneratedPlan) => void
}

export default function ManualSchemaBuilder({ onComplete }: ManualSchemaBuilderProps) {
  const [title, setTitle] = useState('Mijn schema')
  const [sessionMinutes, setSessionMinutes] = useState(60)
  const [unavailable, setUnavailable] = useState<Set<number>>(new Set())
  const [days, setDays] = useState<DraftDay[]>(() => [newDay(1), newDay(2)])
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const suggestions = useMemo(() => {
    const all = new Set([...DEFAULT_EXERCISES, ...EXERCISE_DB.map((e) => e.name)])
    return [...all].sort((a, b) => a.localeCompare(b, 'nl'))
  }, [])

  function toggleUnavailable(weekday: number) {
    setUnavailable((prev) => {
      const next = new Set(prev)
      if (next.has(weekday)) next.delete(weekday)
      else next.add(weekday)
      return next
    })
  }

  function updateDay(dayId: number, patch: Partial<DraftDay>) {
    setDays((prev) => prev.map((d) => (d.id === dayId ? { ...d, ...patch } : d)))
  }

  function updateExercise(dayId: number, exId: number, patch: Partial<DraftExercise>) {
    setDays((prev) =>
      prev.map((d) =>
        d.id === dayId
          ? {
              ...d,
              exercises: d.exercises.map((e) => (e.id === exId ? { ...e, ...patch } : e)),
            }
          : d,
      ),
    )
  }

  function addDay() {
    setDays((prev) => [...prev, newDay(prev.length + 1)])
  }

  function removeDay(dayId: number) {
    setDays((prev) => (prev.length <= 1 ? prev : prev.filter((d) => d.id !== dayId)))
  }

  function addExercise(dayId: number) {
    setDays((prev) =>
      prev.map((d) => (d.id === dayId ? { ...d, exercises: [...d.exercises, newExercise()] } : d)),
    )
  }

  function removeExercise(dayId: number, exId: number) {
    setDays((prev) =>
      prev.map((d) => {
        if (d.id !== dayId) return d
        const next = d.exercises.filter((e) => e.id !== exId)
        return { ...d, exercises: next.length > 0 ? next : [newExercise()] }
      }),
    )
  }

  function handleSubmit() {
    setError(null)
    const available = [0, 1, 2, 3, 4, 5, 6].filter((d) => !unavailable.has(d))
    if (available.length === 0) {
      setError('Kies minstens één dag waarop je kunt trainen.')
      return
    }

    const planDays: PlanDay[] = days.map((day) => ({
      title: day.title,
      focus: day.focus,
      exercises: day.exercises
        .filter((e) => e.name.trim())
        .map(
          (e): PlanExercise => ({
            name: e.name.trim(),
            sets: Math.max(1, Number(e.sets) || 1),
            reps: e.reps.trim() || '8-12',
          }),
        ),
    }))

    const filledDays = planDays.filter((d) => d.exercises.length > 0)
    if (filledDays.length === 0) {
      setError('Voeg minstens één oefening toe met een naam.')
      return
    }

    if (filledDays.length > available.length) {
      setError(
        `Je hebt ${filledDays.length} trainingen ingevuld maar maar ${available.length} beschikbare dag(en). Pas dagen aan of markeer meer weekdagen als beschikbaar.`,
      )
      return
    }

    setBusy(true)
    setTimeout(() => {
      try {
        const plan = buildPlanFromManual({
          title,
          sessionMinutes,
          availableWeekdays: available,
          days: filledDays,
        })
        onComplete(plan)
      } catch {
        setError('Schema kon niet worden opgebouwd. Controleer je invoer.')
      } finally {
        setBusy(false)
      }
    }, 300)
  }

  return (
    <div className="space-y-4">
      <datalist id="manual-exercise-suggestions">
        {suggestions.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>

      <p className="text-sm leading-relaxed text-slate-400">
        Vul je bestaande schema in: trainingsdagen, oefeningen, sets en reps. Daarna kun je het
        activeren als weekagenda.
      </p>

      <div>
        <label htmlFor="manual-plan-title" className="section-title mb-2 block">
          Schematitel
        </label>
        <input
          id="manual-plan-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Bijv. Mijn PPL-schema"
          className="input-field"
        />
      </div>

      <div>
        <p className="section-title mb-2">Tijd per training</p>
        <div className="flex flex-wrap gap-1.5">
          {TIME_OPTIONS.map((min) => (
            <button
              key={min}
              type="button"
              onClick={() => setSessionMinutes(min)}
              className={`chip ${sessionMinutes === min ? 'chip-active' : ''}`}
            >
              {min} min
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="section-title mb-2">Dagen waarop je niet kunt</p>
        <div className="flex flex-wrap gap-1.5">
          {WEEKDAY_SHORT.map((label, weekday) => (
            <button
              key={weekday}
              type="button"
              onClick={() => toggleUnavailable(weekday)}
              className={`chip ${unavailable.has(weekday) ? 'border-red-400/40 bg-red-500/15 text-red-300' : ''}`}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-[11px] text-slate-500">
          {7 - unavailable.size} dag(en) beschikbaar voor {days.length} training(en)
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="section-title">Trainingsdagen</p>
          <button type="button" onClick={addDay} className="btn-ghost py-1.5 text-[11px]">
            + Dag
          </button>
        </div>

        {days.map((day, dayIndex) => (
          <div key={day.id} className="surface-inset space-y-3 p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1 space-y-2">
                <input
                  type="text"
                  value={day.title}
                  onChange={(e) => updateDay(day.id, { title: e.target.value })}
                  placeholder={`Training ${dayIndex + 1}`}
                  className="w-full rounded-lg border border-white/10 bg-[#0e1218] px-3 py-2 text-sm font-semibold text-white outline-none focus:border-emerald-400/50"
                />
                <input
                  type="text"
                  value={day.focus}
                  onChange={(e) => updateDay(day.id, { focus: e.target.value })}
                  placeholder="Focus (bijv. Borst & triceps)"
                  className="w-full rounded-lg border border-white/10 bg-[#0e1218] px-3 py-2 text-xs text-slate-300 outline-none focus:border-emerald-400/50"
                />
              </div>
              {days.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeDay(day.id)}
                  className="shrink-0 text-xs text-red-400 hover:text-red-300"
                  aria-label="Dag verwijderen"
                >
                  Verwijder
                </button>
              )}
            </div>

            <div className="space-y-2">
              {day.exercises.map((exercise, exIndex) => (
                <div key={exercise.id} className="rounded-lg border border-white/10 bg-[#0e1218]/60 p-2.5">
                  <input
                    type="text"
                    list="manual-exercise-suggestions"
                    value={exercise.name}
                    onChange={(e) => updateExercise(day.id, exercise.id, { name: e.target.value })}
                    placeholder={exIndex === 0 ? 'Oefening' : 'Nog een oefening'}
                    className="w-full min-w-0 rounded-lg border border-white/10 bg-[#0e1218] px-2.5 py-2 text-sm text-white outline-none focus:border-emerald-400/50"
                  />
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex min-w-0 flex-1 items-center gap-1.5">
                      <span className="shrink-0 text-[10px] font-medium text-slate-500">Sets</span>
                      <input
                        type="number"
                        min={1}
                        value={exercise.sets}
                        onChange={(e) => updateExercise(day.id, exercise.id, { sets: e.target.value })}
                        className="w-full min-w-0 rounded-lg border border-white/10 bg-[#0e1218] px-2 py-2 text-center text-sm text-white outline-none focus:border-emerald-400/50"
                        aria-label="Sets"
                      />
                    </div>
                    <div className="flex min-w-0 flex-1 items-center gap-1.5">
                      <span className="shrink-0 text-[10px] font-medium text-slate-500">Reps</span>
                      <input
                        type="text"
                        value={exercise.reps}
                        onChange={(e) => updateExercise(day.id, exercise.id, { reps: e.target.value })}
                        placeholder="8-12"
                        className="w-full min-w-0 rounded-lg border border-white/10 bg-[#0e1218] px-2 py-2 text-center text-sm text-white outline-none focus:border-emerald-400/50"
                        aria-label="Reps"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeExercise(day.id, exercise.id)}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:text-red-400"
                      aria-label="Oefening verwijderen"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => addExercise(day.id)}
              className="w-full rounded-lg border border-dashed border-white/15 py-2 text-xs font-medium text-slate-400 hover:border-emerald-400/40 hover:text-emerald-300"
            >
              + Oefening
            </button>
          </div>
        ))}
      </div>

      {error && <p className="rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</p>}

      <button type="button" onClick={handleSubmit} disabled={busy} className="btn-primary w-full">
        {busy ? 'Schema wordt klaargezet…' : 'Gebruik dit schema →'}
      </button>
    </div>
  )
}
