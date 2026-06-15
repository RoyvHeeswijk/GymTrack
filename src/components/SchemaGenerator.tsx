import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useWorkouts } from '../hooks/useWorkouts'
import { activateSchedule, deletePlan, fetchPlans, savePlan, DEFAULT_EXERCISES, type SavedPlan } from '../lib/api'
import { EXERCISE_DB } from '../lib/exerciseDb'
import {
  generatePlan,
  parseExercisePreferenceList,
  parsePlanRequest,
  WEEKDAY_LABELS,
  WEEKDAY_SHORT,
  type GeneratedPlan,
  type Goal,
  type PlanDay,
} from '../lib/planner'
import { getExerciseInfo } from '../lib/exerciseDb'
import Body3D from './Body3D'
import ExerciseCoach from './ExerciseCoach'
import ManualSchemaBuilder from './ManualSchemaBuilder'
import type { WorkoutWithSets } from '../lib/types'

const GOAL_OPTIONS: { value: Goal | 'auto'; label: string }[] = [
  { value: 'auto', label: 'Automatisch' },
  { value: 'spiermassa', label: 'Spiermassa' },
  { value: 'kracht', label: 'Kracht' },
  { value: 'afvallen', label: 'Afvallen' },
  { value: 'conditie', label: 'Conditie' },
]

const TIME_OPTIONS = [30, 45, 60, 75, 90]

const EXAMPLES = [
  'Extra focus op armen en borst',
  'Ik heb last van mijn knie',
  'Ik train thuis met dumbbells',
]

export default function SchemaGenerator({ onActivated }: { onActivated?: () => void }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { workouts } = useWorkouts()

  const [goal, setGoal] = useState<Goal | 'auto'>('auto')
  const [daysPerWeek, setDaysPerWeek] = useState(3)
  const [sessionMinutes, setSessionMinutes] = useState(60)
  const [unavailable, setUnavailable] = useState<Set<number>>(new Set())
  const [extra, setExtra] = useState('')
  const [preferredExercises, setPreferredExercises] = useState('')
  const [avoidedExercises, setAvoidedExercises] = useState('')

  const [plan, setPlan] = useState<GeneratedPlan | null>(null)
  const [mode, setMode] = useState<'ai' | 'manual'>('ai')
  const [generating, setGenerating] = useState(false)
  const [showForm, setShowForm] = useState(true)
  const [resultTab, setResultTab] = useState<'schema' | 'analyse' | 'agenda'>('schema')
  const [savedPlans, setSavedPlans] = useState<SavedPlan[]>([])
  const [activateState, setActivateState] = useState<'idle' | 'busy'>('idle')
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPlans().then(setSavedPlans).catch(() => {})
  }, [])

  const exerciseSuggestions = useMemo(() => {
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

  function handleGenerate() {
    setGenerating(true)
    setSaveState('idle')
    setError(null)
    setTimeout(() => {
      const parsed = parsePlanRequest(extra)
      const available = [0, 1, 2, 3, 4, 5, 6].filter(
        (d) => !unavailable.has(d) && parsed.availableWeekdays.includes(d),
      )
      const detected = parsed.detected.filter((line) =>
        ['Rekening gehouden met', 'Minder nadruk op', 'Extra aandacht voor', 'Beperking herkend'].some(
          (prefix) => line.startsWith(prefix),
        ),
      )
      const unavailableFinal = [0, 1, 2, 3, 4, 5, 6].filter((d) => !available.includes(d))
      if (unavailableFinal.length > 0 && available.length > 0) {
        detected.push(`Niet beschikbaar op: ${unavailableFinal.map((d) => WEEKDAY_LABELS[d]).join(', ')}`)
      }

      const preferred = parseExercisePreferenceList(preferredExercises)
      const avoided = parseExercisePreferenceList(avoidedExercises)
      const avoidedSet = new Set(avoided.map((name) => name.toLowerCase()))
      const preferredFiltered = preferred.filter((name) => !avoidedSet.has(name.toLowerCase()))

      if (preferredFiltered.length > 0) {
        detected.push(`Voorkeursoefeningen: ${preferredFiltered.join(', ')}`)
      }
      if (avoided.length > 0) {
        detected.push(`Vermijden: ${avoided.join(', ')}`)
      }

      const request = {
        ...parsed,
        goal: goal === 'auto' ? parsed.goal : goal,
        daysPerWeek,
        sessionMinutes,
        availableWeekdays: available.length > 0 ? available : [0, 1, 2, 3, 4, 5, 6],
        detected,
        preferredExercises: preferredFiltered,
        avoidedExercises: avoided,
      }
      setPlan(generatePlan(request))
      setGenerating(false)
      setShowForm(false)
      setResultTab('schema')
    }, 700)
  }

  function swapExercise(dayIndex: number, oldName: string, newName: string) {
    setPlan((current) => {
      if (!current) return current
      const days = current.days.map((day, index) =>
        index === dayIndex
          ? {
              ...day,
              exercises: day.exercises.map((exercise) =>
                exercise.name === oldName ? { ...exercise, name: newName } : exercise,
              ),
            }
          : day,
      )
      return { ...current, days }
    })
    setSaveState('idle')
  }

  function startWorkout() {
    navigate('/loggen')
  }

  function handleManualComplete(manualPlan: GeneratedPlan) {
    setPlan(manualPlan)
    setShowForm(false)
    setResultTab('schema')
    setSaveState('idle')
    setError(null)
  }

  async function handleActivate() {
    if (!user || !plan) return
    setActivateState('busy')
    setError(null)
    try {
      await activateSchedule(
        user.id,
        plan.title,
        plan.goal,
        plan.days,
        plan.assignments,
        plan.sessionMinutes,
      )
      await savePlan(user.id, plan.title, plan.goal, plan.days).catch(() => {})
      onActivated?.()
      navigate('/agenda', { state: { scheduleActivated: true } })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Activeren mislukt.')
      setActivateState('idle')
    }
  }

  async function handleSave() {
    if (!user || !plan) return
    setSaveState('saving')
    setError(null)
    try {
      await savePlan(user.id, plan.title, plan.goal, plan.days)
      setSavedPlans(await fetchPlans())
      setSaveState('saved')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Opslaan mislukt.')
      setSaveState('idle')
    }
  }

  async function handleDelete(planId: string) {
    try {
      await deletePlan(planId)
      setSavedPlans((prev) => prev.filter((p) => p.id !== planId))
    } catch {
      // lijst blijft staan
    }
  }

  return (
    <div className="space-y-4">
      {/* Compacte samenvatting wanneer het formulier is ingeklapt */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="card flex w-full items-center justify-between text-left"
        >
          <div className="min-w-0">
            <p className="section-title mb-1">
              {mode === 'manual' ? 'Handmatig schema' : 'Jouw wensen'}
            </p>
            <p className="truncate text-sm text-slate-300">
              {mode === 'manual'
                ? plan?.title ?? 'Zelf ingevuld'
                : `${GOAL_OPTIONS.find((o) => o.value === goal)?.label} · ${daysPerWeek}x · ${sessionMinutes} min${unavailable.size > 0 ? ` · niet: ${[...unavailable].sort().map((d) => WEEKDAY_SHORT[d]).join('/')}` : ''}`}
            </p>
          </div>
          <span className="shrink-0 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-emerald-400">
            Aanpassen
          </span>
        </button>
      )}

      {showForm && (
        <div className="space-y-4">
          <div className="flex gap-1 rounded-2xl border border-white/10 bg-white/5 p-1">
            <button
              type="button"
              onClick={() => setMode('ai')}
              className={`flex-1 rounded-xl py-2.5 text-xs font-semibold transition ${
                mode === 'ai' ? 'bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-950' : 'text-slate-300'
              }`}
            >
              AI genereren
            </button>
            <button
              type="button"
              onClick={() => setMode('manual')}
              className={`flex-1 rounded-xl py-2.5 text-xs font-semibold transition ${
                mode === 'manual' ? 'bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-950' : 'text-slate-300'
              }`}
            >
              Zelf invullen
            </button>
          </div>

          {mode === 'manual' ? (
            <ManualSchemaBuilder onComplete={handleManualComplete} />
          ) : (
        <div className="space-y-4">
          <datalist id="schema-exercise-suggestions">
            {exerciseSuggestions.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
          <div>
            <p className="section-title mb-2">Doel</p>
            <div className="flex flex-wrap gap-1.5">
              {GOAL_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setGoal(option.value)}
                  className={`chip ${goal === option.value ? 'chip-active' : ''}`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="section-title mb-2">Trainingen per week</p>
            <div className="flex flex-wrap gap-1.5">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <button
                  key={n}
                  onClick={() => setDaysPerWeek(n)}
                  className={`chip min-w-10 ${daysPerWeek === n ? 'chip-active' : ''}`}
                >
                  {n}x
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="section-title mb-2">Tijd per training</p>
            <div className="flex flex-wrap gap-1.5">
              {TIME_OPTIONS.map((min) => (
                <button
                  key={min}
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
                  onClick={() => toggleUnavailable(weekday)}
                  className={`chip ${unavailable.has(weekday) ? 'border-red-400/40 bg-red-500/15 text-red-300' : ''}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-[11px] text-slate-500">
              {7 - unavailable.size} dag(en) beschikbaar · de AI plant{' '}
              {Math.min(daysPerWeek, 7 - unavailable.size)} trainingen in
            </p>
          </div>

          <div>
            <p className="section-title mb-2">Extra wensen (optioneel)</p>
            <textarea
              value={extra}
              onChange={(e) => setExtra(e.target.value)}
              rows={2}
              placeholder='Bijv. "extra focus op armen, maar ik heb last van mijn schouder"'
              className="input-field resize-none text-sm"
            />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {EXAMPLES.map((example) => (
                <button key={example} onClick={() => setExtra(example)} className="chip">
                  {example}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="section-title mb-1">Oefeningvoorkeuren (optioneel)</p>
            <p className="mb-2 text-[11px] text-slate-500">
              Scheiding met komma&apos;s. Herkenning werkt ook met informele namen (bijv. benchen).
            </p>
            <div className="space-y-2">
              <div>
                <label htmlFor="preferred-exercises" className="mb-1 block text-xs font-medium text-emerald-400">
                  Graag doen
                </label>
                <input
                  id="preferred-exercises"
                  type="text"
                  list="schema-exercise-suggestions"
                  value={preferredExercises}
                  onChange={(e) => setPreferredExercises(e.target.value)}
                  placeholder="Bijv. Lat pulldown, Bench press"
                  className="input-field text-sm"
                />
              </div>
              <div>
                <label htmlFor="avoided-exercises" className="mb-1 block text-xs font-medium text-red-400/90">
                  Liever vermijden
                </label>
                <input
                  id="avoided-exercises"
                  type="text"
                  list="schema-exercise-suggestions"
                  value={avoidedExercises}
                  onChange={(e) => setAvoidedExercises(e.target.value)}
                  placeholder="Bijv. Deadlift, Squat"
                  className="input-field text-sm"
                />
              </div>
            </div>
          </div>

          <button onClick={handleGenerate} disabled={generating} className="btn-primary w-full">
            {generating ? 'Schema wordt samengesteld…' : 'Genereer mijn schema'}
          </button>
        </div>
          )}
        </div>
      )}

      {plan && (
        <>
          <div className="rounded-xl border border-white/[0.07] bg-[#12171f] p-4">
            <h3 className="font-bold text-white">{plan.title}</h3>
            <WishBadges reasoning={plan.reasoning} />
          </div>

          <div className="flex gap-1 rounded-2xl border border-white/10 bg-white/5 p-1">
            {([
              ['schema', 'Schema'],
              ['analyse', 'Analyse'],
              ['agenda', 'Weekindeling'],
            ] as const).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setResultTab(key)}
                className={`flex-1 rounded-xl py-2 text-xs font-semibold transition ${
                  resultTab === key ? 'bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-950' : 'text-slate-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {resultTab === 'schema' && (
            <div className="space-y-3">
              {plan.days.map((day, dayIndex) => (
                <PlanDayCard
                  key={`${day.title}-${dayIndex}`}
                  day={day}
                  dayNumber={dayIndex + 1}
                  workouts={workouts}
                  onSwap={(oldName, newName) => swapExercise(dayIndex, oldName, newName)}
                  onStart={() => startWorkout()}
                />
              ))}
            </div>
          )}

          {resultTab === 'analyse' && (
            <div className="space-y-3">
              <div className="rounded-2xl border border-white/[0.06] bg-slate-950/40 p-4">
                <p className="section-title mb-2">Spierbelasting per week</p>
                <Body3D activation={plan.weeklyActivation} />
              </div>
              <div
                className={`rounded-2xl border p-4 ${
                  plan.balance.ok ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-amber-500/30 bg-amber-500/5'
                }`}
              >
                <h4 className={`text-sm font-semibold ${plan.balance.ok ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {plan.balance.ok ? 'Balanscheck: in evenwicht' : 'Balanscheck: aandachtspunten'}
                </h4>
                <ul className="mt-2 space-y-1">
                  {plan.balance.messages.map((message) => (
                    <li key={message} className="text-xs text-slate-300">
                      {message}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border border-white/[0.06] bg-slate-950/40 p-4">
                <p className="section-title mb-2">Onderbouwing</p>
                <div className="space-y-1.5">
                  {plan.reasoning.map((line) => (
                    <p key={line} className="flex gap-2 text-xs text-slate-400">
                      <span className="text-emerald-400">✓</span>
                      {line}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          )}

          {resultTab === 'agenda' && (
            <div className="rounded-2xl border border-white/[0.06] bg-slate-950/40 p-4">
              <p className="section-title mb-2">Weekindeling</p>
              <div className="flex justify-between gap-1">
                {plan.assignments.map((dayIndex, weekday) => (
                  <div key={weekday} className="flex flex-1 flex-col items-center gap-1">
                    <span className="text-[10px] text-slate-500">{WEEKDAY_SHORT[weekday]}</span>
                    <div
                      className={`flex h-10 w-full items-center justify-center rounded-lg text-[10px] font-semibold ${
                        dayIndex !== null
                          ? 'bg-gradient-to-br from-emerald-400/25 to-cyan-400/25 text-emerald-300'
                          : 'bg-white/5 text-slate-600'
                      }`}
                    >
                      {dayIndex !== null ? dayIndex + 1 : '·'}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 space-y-1">
                {plan.days.map((day, index) => (
                  <p key={index} className="text-xs text-slate-400">
                    <span className="font-semibold text-slate-200">{index + 1}.</span> {day.title} — {day.focus}
                  </p>
                ))}
              </div>
              <p className="mt-2 text-[11px] text-slate-500">
                Je kunt deze indeling later in de agenda per dag aanpassen.
              </p>
            </div>
          )}

          {error && <p className="rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</p>}

          <button onClick={() => void handleActivate()} disabled={activateState === 'busy'} className="btn-primary w-full">
            {activateState === 'busy' ? 'Activeren…' : 'Activeer als mijn agenda'}
          </button>
          <button onClick={() => void handleSave()} disabled={saveState !== 'idle'} className="btn-secondary w-full">
            {saveState === 'saving' ? 'Opslaan…' : saveState === 'saved' ? 'Opgeslagen ✓' : 'Alleen opslaan'}
          </button>
        </>
      )}

      {savedPlans.length > 0 && (
        <div>
          <h3 className="section-title mb-2">Opgeslagen schema's</h3>
          <div className="space-y-2">
            {savedPlans.map((saved) => (
              <SavedPlanCard
                key={saved.id}
                plan={saved}
                onDelete={() => void handleDelete(saved.id)}
                onStart={() => startWorkout()}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function WishBadges({ reasoning }: { reasoning: string[] }) {
  const badges: { text: string; cls: string }[] = []
  for (const line of reasoning) {
    if (line.startsWith('Extra aandacht voor')) {
      badges.push({ text: `Focus: ${line.replace('Extra aandacht voor ', '').split(':')[0]}`, cls: 'border-emerald-400/40 bg-emerald-500/10 text-emerald-300' })
    } else if (line.startsWith('Rekening gehouden met klachten aan')) {
      badges.push({ text: `Blessure: ${line.replace('Rekening gehouden met klachten aan ', '').split(':')[0]}`, cls: 'border-red-400/40 bg-red-500/10 text-red-300' })
    } else if (line.startsWith('Minder nadruk op')) {
      badges.push({ text: `Minder: ${line.replace('Minder nadruk op ', '').replace(' zoals gevraagd', '')}`, cls: 'border-amber-400/40 bg-amber-500/10 text-amber-300' })
    } else if (line.startsWith('Beperking herkend')) {
      badges.push({ text: line.replace('Beperking herkend: ', ''), cls: 'border-white/15 bg-white/5 text-slate-300' })
    } else if (line.startsWith('Voorkeursoefeningen:')) {
      badges.push({ text: line.replace('Voorkeursoefeningen: ', ''), cls: 'border-emerald-400/40 bg-emerald-500/10 text-emerald-300' })
    } else if (line.startsWith('Vermijden:')) {
      badges.push({ text: line.replace('Vermijden: ', ''), cls: 'border-red-400/40 bg-red-500/10 text-red-300' })
    }
  }
  if (badges.length === 0) {
    return <p className="mt-2 text-xs text-slate-500">Geen extra wensen herkend — algemeen gebalanceerd schema.</p>
  }
  return (
    <div className="mt-3">
      <p className="mb-1.5 text-[11px] font-medium text-slate-500">Jouw wensen toegepast:</p>
      <div className="flex flex-wrap gap-1.5">
        {badges.map((badge) => (
          <span key={badge.text} className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${badge.cls}`}>
            {badge.text}
          </span>
        ))}
      </div>
    </div>
  )
}

function PlanDayCard({
  day,
  dayNumber,
  workouts,
  onSwap,
  onStart,
}: {
  day: PlanDay
  dayNumber: number
  workouts: WorkoutWithSets[]
  onSwap: (oldName: string, newName: string) => void
  onStart: () => void
}) {
  const [openExercise, setOpenExercise] = useState<string | null>(null)

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-slate-950/40 p-4">
      <div className="flex items-baseline justify-between">
        <h4 className="font-semibold text-white">
          Dag {dayNumber}: {day.title}
        </h4>
        <span className="text-xs text-slate-500">{day.focus}</span>
      </div>
      <div className="mt-3 space-y-2">
        {day.exercises.map((exercise) => {
          const known = getExerciseInfo(exercise.name) !== null
          const open = openExercise === exercise.name
          return (
            <div key={exercise.name} className="rounded-2xl bg-white/5">
              <button
                onClick={() => known && setOpenExercise(open ? null : exercise.name)}
                className="flex w-full items-center justify-between px-3 py-2.5 text-left"
              >
                <span className="flex items-center gap-2 text-sm text-white">
                  {exercise.name}
                  {known && <span className="text-[10px] text-slate-500">{open ? '▲' : '▼ 3D & info'}</span>}
                </span>
                <span className="text-xs font-medium text-emerald-400">
                  {exercise.sets} × {exercise.reps}
                </span>
              </button>
              {open && (
                <div className="px-3 pb-3">
                  <ExerciseCoach
                    input={exercise.name}
                    workouts={workouts}
                    onSwap={(newName) => {
                      onSwap(exercise.name, newName)
                      setOpenExercise(newName)
                    }}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
      <button onClick={onStart} className="btn-primary mt-3 w-full py-2.5 text-sm">
        Start deze training →
      </button>
    </div>
  )
}

function SavedPlanCard({
  plan,
  onDelete,
  onStart,
}: {
  plan: SavedPlan
  onDelete: () => void
  onStart: () => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="card-tight">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between px-4 py-3 text-left">
        <div>
          <p className="text-sm font-semibold text-white">{plan.title}</p>
          <p className="text-xs text-slate-500">
            {new Date(plan.created_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </div>
        <span className="text-xs text-slate-500">{plan.days.length} dagen</span>
      </button>
      {open && (
        <div className="border-t border-white/5 px-4 py-3">
          {plan.days.map((day, index) => (
            <div key={index} className="flex items-center justify-between gap-3 py-1.5">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-300">{day.title}</p>
                <p className="truncate text-xs text-slate-500">
                  {day.exercises.map((e) => `${e.name} ${e.sets}×${e.reps}`).join(' · ')}
                </p>
              </div>
              <button
                onClick={onStart}
                className="shrink-0 rounded-lg bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-white/20"
              >
                Start
              </button>
            </div>
          ))}
          <button onClick={onDelete} className="mt-2 text-xs text-red-400 hover:text-red-300">
            Schema verwijderen
          </button>
        </div>
      )}
    </div>
  )
}
