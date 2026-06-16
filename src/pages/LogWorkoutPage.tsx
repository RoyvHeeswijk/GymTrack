import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  DEFAULT_EXERCISES,
  createWorkoutSession,
  fetchExercises,
  fetchTodaysWorkout,
  syncWorkoutSets,
} from '../lib/api'
import { EXERCISE_DB, getAlternatives, recognizeExercise } from '../lib/exerciseDb'
import { resolveLoggingPlanDay } from '../lib/scheduling'
import { LOG_SESSION_KEY } from '../lib/settings'
import { useSchedule } from '../hooks/useSchedule'
import { useSettings } from '../hooks/useSettings'
import { useWorkouts } from '../hooks/useWorkouts'
import Body3D from '../components/Body3D'
import { muscleFocusFromExercise } from '../lib/muscleFocus'
import type { NewSetInput, WorkoutWithSets } from '../lib/types'
import type { PlanDay } from '../lib/planner'

interface DraftSetRow {
  id: number
  reps: string
  weight: string
}

interface ExerciseBlock {
  id: number
  name: string
  note: string
  sets: DraftSetRow[]
}

interface LogSession {
  workoutId: string
  planTitle: string
  date: string
}

let blockId = 0
let rowId = 0

const EQUIPMENT_LABELS: Record<string, string> = {
  barbell: 'Barbell',
  dumbbell: 'Dumbbells',
  machine: 'Machine',
  cable: 'Kabel',
  bodyweight: 'Lichaamsgewicht',
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10)
}

function readSession(): LogSession | null {
  try {
    const raw = sessionStorage.getItem(LOG_SESSION_KEY)
    return raw ? (JSON.parse(raw) as LogSession) : null
  } catch {
    return null
  }
}

function writeSession(session: LogSession) {
  sessionStorage.setItem(LOG_SESSION_KEY, JSON.stringify(session))
}

function scheduleKey(scheduleId: string, assignments: (number | null)[]): string {
  return `${scheduleId}:${assignments.join(',')}`
}

function newRow(): DraftSetRow {
  return { id: ++rowId, reps: '', weight: '' }
}

function newBlock(name = ''): ExerciseBlock {
  return { id: ++blockId, name, note: '', sets: [newRow()] }
}

function lowerReps(reps: string): string {
  const match = reps.match(/\d+/)
  return match ? match[0] : ''
}

function canonicalName(name: string): string {
  return recognizeExercise(name)?.name ?? name.trim()
}

function lastSetHint(
  workouts: WorkoutWithSets[],
  exerciseName: string,
  setIndex: number,
): { weight: string; reps: string } {
  const canonical = canonicalName(exerciseName)
  if (!canonical) return { weight: '', reps: '' }

  for (const workout of workouts) {
    const exerciseSets = workout.sets
      .filter((s) => canonicalName(s.exercise_name) === canonical)
      .sort((a, b) => a.set_number - b.set_number)
    if (exerciseSets.length >= setIndex) {
      const s = exerciseSets[setIndex - 1]
      return { weight: String(s.weight_kg), reps: String(s.reps) }
    }
  }
  return { weight: '', reps: '' }
}

function coachExecutionSteps(exerciseName: string): string[] {
  const exercise = recognizeExercise(exerciseName)
  if (!exercise) return []
  if (exercise.steps.length > 0) return exercise.steps
  return exercise.cues
}

function blocksFromPlanDay(day: PlanDay): ExerciseBlock[] {
  return day.exercises.map((exercise) => ({
    id: ++blockId,
    name: exercise.name,
    note: '',
    sets: Array.from({ length: exercise.sets }, () => ({
      ...newRow(),
      reps: lowerReps(exercise.reps),
    })),
  }))
}

function blocksFromSavedWorkout(workout: WorkoutWithSets, planDay: PlanDay): ExerciseBlock[] {
  const savedNotes = workout.exercise_notes ?? {}
  const savedByName = new Map<string, { reps: string; weight: string }[]>()
  for (const set of workout.sets) {
    const name = canonicalName(set.exercise_name)
    const list = savedByName.get(name) ?? []
    list.push({ reps: String(set.reps), weight: String(set.weight_kg) })
    savedByName.set(name, list)
  }

  return planDay.exercises.map((exercise) => {
    const name = canonicalName(exercise.name)
    const saved = savedByName.get(name) ?? []
    const count = Math.max(exercise.sets, saved.length, 1)
    return {
      id: ++blockId,
      name: exercise.name,
      note: savedNotes[name] ?? '',
      sets: Array.from({ length: count }, (_, i) => ({
        id: ++rowId,
        reps: saved[i]?.reps ?? lowerReps(exercise.reps),
        weight: saved[i]?.weight ?? '',
      })),
    }
  })
}

function mergeBlocksWithPlan(
  current: ExerciseBlock[],
  planDay: PlanDay,
  workouts: WorkoutWithSets[],
): ExerciseBlock[] {
  const byName = new Map<string, { sets: DraftSetRow[]; note: string }>()
  for (const block of current) {
    const name = canonicalName(block.name)
    if (name) {
      byName.set(name, {
        sets: block.sets.map((r) => ({ ...r })),
        note: block.note,
      })
    }
  }

  const fresh = blocksFromPlanDay(planDay)
  const merged = fresh.map((block) => {
    const name = canonicalName(block.name)
    const existing = name ? byName.get(name) : undefined
    if (!existing) return block
    return {
      ...block,
      note: existing.note,
      sets: block.sets.map((row, i) => {
        const prev = existing.sets[i]
        if (!prev) return row
        return {
          ...row,
          reps: prev.reps || row.reps,
          weight: prev.weight !== '' ? prev.weight : row.weight,
        }
      }),
    }
  })
  return prefillFromHistory(merged, workouts)
}

function resolveSetValues(
  row: DraftSetRow,
  hint: { weight: string; reps: string },
): { reps: string; weight: string } | null {
  const reps = row.reps || hint.reps
  const weight = row.weight !== '' ? row.weight : hint.weight
  if (Number(reps) > 0 && weight !== '' && Number(weight) >= 0) {
    return { reps, weight }
  }
  return null
}

function flattenBlocks(blocks: ExerciseBlock[], workouts: WorkoutWithSets[]): NewSetInput[] {
  const result: NewSetInput[] = []
  for (const block of blocks) {
    const name = canonicalName(block.name)
    if (!name) continue
    block.sets.forEach((row, index) => {
      const resolved = resolveSetValues(row, lastSetHint(workouts, block.name, index + 1))
      if (resolved) {
        result.push({
          exerciseName: name,
          reps: Math.round(Number(resolved.reps)),
          weightKg: Number(resolved.weight),
        })
      }
    })
  }
  return result
}

function collectExerciseNotes(blocks: ExerciseBlock[]): Record<string, string> {
  const notes: Record<string, string> = {}
  for (const block of blocks) {
    const name = canonicalName(block.name)
    const trimmed = block.note.trim()
    if (name && trimmed) notes[name] = trimmed
  }
  return notes
}

function prefillFromHistory(blocks: ExerciseBlock[], workouts: WorkoutWithSets[]): ExerciseBlock[] {
  return blocks.map((block) => ({
    ...block,
    sets: block.sets.map((row, index) => {
      const hint = lastSetHint(workouts, block.name, index + 1)
      return {
        ...row,
        reps: row.reps || hint.reps,
        weight: row.weight !== '' ? row.weight : hint.weight,
      }
    }),
  }))
}

function LogNavArrowIcon({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {direction === 'left' ? (
        <path d="M15 18l-6-6 6-6" />
      ) : (
        <path d="M9 18l6-6-6-6" />
      )}
    </svg>
  )
}

const AUTOSAVE_MS = 3000

export default function LogWorkoutPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { schedule, loading: scheduleLoading, reload: reloadSchedule } = useSchedule()
  const { workouts, loading: workoutsLoading, reload: reloadWorkouts } = useWorkouts()
  const { settings } = useSettings()

  const [workoutName, setWorkoutName] = useState('')
  const [workoutId, setWorkoutId] = useState<string | null>(null)
  const [blocks, setBlocks] = useState<ExerciseBlock[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [ready, setReady] = useState(false)
  const [knownExercises, setKnownExercises] = useState<string[]>([])
  const [showAlternatives, setShowAlternatives] = useState(false)
  const [show3D, setShow3D] = useState(false)
  const [showCoach, setShowCoach] = useState(false)
  const [showNote, setShowNote] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [showReorder, setShowReorder] = useState(false)
  const [sessionPlanDay, setSessionPlanDay] = useState<PlanDay | null>(null)
  const [noPlanAvailable, setNoPlanAvailable] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  const boundScheduleKey = useRef<string | null>(null)
  const initStarted = useRef(false)
  const blocksRef = useRef(blocks)
  blocksRef.current = blocks
  const workoutsRef = useRef(workouts)
  workoutsRef.current = workouts
  const workoutIdRef = useRef(workoutId)
  workoutIdRef.current = workoutId
  const validSetsRef = useRef<NewSetInput[]>([])
  const exerciseNotesRef = useRef<Record<string, string>>({})

  const block = blocks[currentIndex] ?? blocks[0]
  const isLastExercise = blocks.length > 0 && currentIndex >= blocks.length - 1
  const recognized = block?.name.trim() ? recognizeExercise(block.name) : null
  const alternatives = recognized ? getAlternatives(recognized.name) : []

  const validSets = useMemo(() => flattenBlocks(blocks, workouts), [blocks, workouts])
  validSetsRef.current = validSets
  const exerciseNotes = useMemo(() => collectExerciseNotes(blocks), [blocks])
  exerciseNotesRef.current = exerciseNotes

  const executionSteps =
    recognized && settings.showCoachTips ? coachExecutionSteps(block.name) : []

  const muscleFocus = useMemo(
    () => (recognized ? muscleFocusFromExercise(recognized) : null),
    [recognized],
  )

  const filledInBlock = block
    ? block.sets.filter((row, i) => {
        const hint = lastSetHint(workouts, block.name, i + 1)
        return resolveSetValues(row, hint)
      }).length
    : 0

  useEffect(() => {
    setShowNote(Boolean(block?.note.trim()))
    setShowCoach(false)
    setShowAlternatives(false)
  }, [currentIndex, block?.id, block?.note])

  async function initSession(day: PlanDay, mergeFrom?: ExerciseBlock[]) {
    if (!user || !schedule) return

    setWorkoutName(day.title)
    setSessionPlanDay(day)
    setNoPlanAvailable(false)

    const history = workoutsRef.current
    let nextBlocks: ExerciseBlock[]
    let id: string

    if (mergeFrom && mergeFrom.length > 0) {
      const todays = await fetchTodaysWorkout(user.id, day.title)
      id = todays?.id ?? workoutIdRef.current ?? (await createWorkoutSession(user.id, day.title))
      nextBlocks = mergeBlocksWithPlan(mergeFrom, day, history)
    } else {
      const todays = await fetchTodaysWorkout(user.id, day.title)
      if (todays) {
        id = todays.id
        nextBlocks = blocksFromSavedWorkout(todays, day)
      } else {
        const session = readSession()
        if (session?.planTitle === day.title && session.date === todayKey()) {
          id = session.workoutId
          nextBlocks = prefillFromHistory(blocksFromPlanDay(day), history)
        } else {
          id = await createWorkoutSession(user.id, day.title)
          nextBlocks = prefillFromHistory(blocksFromPlanDay(day), history)
        }
      }
    }

    setWorkoutId(id)
    setBlocks(nextBlocks)
    writeSession({ workoutId: id, planTitle: day.title, date: todayKey() })
    boundScheduleKey.current = scheduleKey(schedule.id, schedule.assignments)
    setReady(true)
  }

  useEffect(() => {
    fetchExercises()
      .then((rows) => setKnownExercises(rows.map((r) => r.name)))
      .catch(() => {})
  }, [])

  useEffect(() => {
    const handler = () => {
      if (document.visibilityState === 'visible') void reloadSchedule()
    }
    document.addEventListener('visibilitychange', handler)
    return () => document.removeEventListener('visibilitychange', handler)
  }, [reloadSchedule])

  useEffect(() => {
    if (!user || scheduleLoading || workoutsLoading || !schedule) return

    const schedKey = scheduleKey(schedule.id, schedule.assignments)

    // Sessie actief en agenda ongewijzigd → niet opnieuw laden (ook niet na auto-save)
    if (ready && boundScheduleKey.current === schedKey) return

    const day = resolveLoggingPlanDay(schedule, workoutsRef.current)

    if (!day) {
      if (!initStarted.current) {
        initStarted.current = true
        setNoPlanAvailable(true)
        setReady(true)
      }
      return
    }

    if (ready && boundScheduleKey.current !== schedKey) {
      void initSession(day, blocksRef.current)
      return
    }

    if (initStarted.current) return
    initStarted.current = true
    void initSession(day)
  }, [user, schedule, scheduleLoading, workoutsLoading, ready])

  useEffect(() => {
    if (!user || !workoutId || !ready) return

    setSaveStatus((s) => (s === 'saving' ? s : 'idle'))

    const timer = setTimeout(() => {
      void (async () => {
        setSaveStatus('saving')
        setError(null)
        try {
          await syncWorkoutSets(workoutId, user.id, validSetsRef.current, exerciseNotesRef.current)
          void reloadWorkouts()
          setSaveStatus('saved')
        } catch (err) {
          setSaveStatus('error')
          setError(err instanceof Error ? err.message : 'Opslaan mislukt.')
        }
      })()
    }, AUTOSAVE_MS)

    return () => clearTimeout(timer)
  }, [blocks, workoutId, user, ready, reloadWorkouts])

  const suggestions = useMemo(() => {
    const all = new Set([...knownExercises, ...DEFAULT_EXERCISES, ...EXERCISE_DB.map((e) => e.name)])
    return [...all].sort((a, b) => a.localeCompare(b, 'nl'))
  }, [knownExercises])

  function updateBlock(blockId: number, patch: Partial<ExerciseBlock>) {
    setBlocks((prev) => prev.map((b) => (b.id === blockId ? { ...b, ...patch } : b)))
  }

  function updateRow(blockId: number, rowId: number, patch: Partial<DraftSetRow>) {
    setBlocks((prev) =>
      prev.map((b) =>
        b.id === blockId
          ? { ...b, sets: b.sets.map((r) => (r.id === rowId ? { ...r, ...patch } : r)) }
          : b,
      ),
    )
  }

  function addSetToBlock(blockId: number) {
    setBlocks((prev) =>
      prev.map((b) => {
        if (b.id !== blockId) return b
        const last = b.sets[b.sets.length - 1]
        return {
          ...b,
          sets: [...b.sets, { ...newRow(), reps: last?.reps ?? '' }],
        }
      }),
    )
  }

  function removeCurrentBlock() {
    setBlocks((prev) => {
      const next = prev.filter((_, i) => i !== currentIndex)
      return next.length > 0 ? next : [newBlock()]
    })
    setCurrentIndex((i) => Math.max(0, i - 1))
    setShowMenu(false)
  }

  function moveBlock(from: number, to: number) {
    if (to < 0 || to >= blocks.length || from === to) return
    setBlocks((prev) => {
      const next = [...prev]
      const [item] = next.splice(from, 1)
      next.splice(to, 0, item)
      return next
    })
    setCurrentIndex((prev) => {
      if (prev === from) return to
      if (from < prev && to >= prev) return prev - 1
      if (from > prev && to <= prev) return prev + 1
      return prev
    })
  }

  function swapExercise(blockId: number, newName: string) {
    setBlocks((prev) =>
      prefillFromHistory(
        prev.map((b) => (b.id === blockId ? { ...b, name: newName, note: '' } : b)),
        workouts,
      ),
    )
    setShowAlternatives(false)
  }

  function goNext() {
    if (isLastExercise) {
      navigate('/', { state: { saved: true } })
    } else {
      setCurrentIndex((i) => i + 1)
      setShowMenu(false)
    }
  }

  function goPrev() {
    setCurrentIndex((i) => Math.max(0, i - 1))
    setShowMenu(false)
  }

  if (scheduleLoading || (!ready && workoutsLoading)) {
    return <p className="py-12 text-center text-slate-400">Training laden…</p>
  }

  if (!schedule) {
    return (
      <div className="space-y-5 pb-8">
        <h1 className="log-page-title">Training loggen</h1>
        <div className="card text-center">
          <h2 className="font-semibold text-white">Nog geen actieve agenda</h2>
          <p className="mx-auto mt-2 max-w-xs text-sm text-slate-400">
            Maak eerst een schema op Home en activeer dat als weekagenda. Daarna opent Loggen
            automatisch de training die op de planning staat.
          </p>
          <Link to="/" className="btn-primary mt-4 inline-block px-6">
            Naar Home
          </Link>
        </div>
      </div>
    )
  }

  if (noPlanAvailable || !sessionPlanDay) {
    return (
      <div className="space-y-5 pb-8">
        <h1 className="log-page-title">Training loggen</h1>
        <div className="card text-center">
          <h2 className="font-semibold text-white">Geen training gepland</h2>
          <p className="mx-auto mt-2 max-w-xs text-sm text-slate-400">
            Er staat momenteel geen training in je schema. Pas je agenda aan of voeg trainingsdagen
            toe.
          </p>
          <Link to="/agenda" className="btn-primary mt-4 inline-block px-6">
            Naar Agenda
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="log-page">
      <datalist id="exercise-suggestions">
        {suggestions.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>

      <header className="log-top">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className="h-2 w-2 shrink-0 rounded-full bg-teal-400" />
          <span className="log-workout-label truncate">{workoutName}</span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {saveStatus === 'saving' && (
            <span className="text-[10px] font-medium text-slate-500">Opslaan…</span>
          )}
          {saveStatus === 'saved' && (
            <span className="text-[10px] font-medium text-teal-400">Opgeslagen</span>
          )}
          <p className="log-progress-label">
            {currentIndex + 1}/{blocks.length}
          </p>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMenu((v) => !v)}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#334155] bg-[#0f172a] text-base text-slate-400 hover:text-white"
              aria-label="Meer opties"
            >
              ⋯
            </button>
            {showMenu && (
              <div className="absolute right-0 top-full z-20 mt-1 min-w-[10.5rem] rounded-xl border border-[#334155] bg-[#1e293b] py-1 shadow-xl">
                <button
                  type="button"
                  onClick={() => {
                    setShowReorder(true)
                    setShowMenu(false)
                  }}
                  className="block w-full px-4 py-2 text-left text-xs text-slate-300 hover:bg-white/5"
                >
                  Volgorde aanpassen
                </button>
                {recognized && (
                  <button
                    type="button"
                    onClick={() => {
                      setShow3D((v) => !v)
                      setShowMenu(false)
                    }}
                    className="block w-full px-4 py-2 text-left text-xs text-slate-300 hover:bg-white/5"
                  >
                    {show3D ? 'Verberg 3D' : 'Toon 3D'}
                  </button>
                )}
                {executionSteps.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowCoach((v) => !v)
                      setShowMenu(false)
                    }}
                    className="block w-full px-4 py-2 text-left text-xs text-slate-300 hover:bg-white/5"
                  >
                    {showCoach ? 'Verberg uitvoering' : 'Toon uitvoering'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setShowNote((v) => !v)
                    setShowMenu(false)
                  }}
                  className="block w-full px-4 py-2 text-left text-xs text-slate-300 hover:bg-white/5"
                >
                  {showNote ? 'Verberg notitie' : 'Notitie toevoegen'}
                </button>
                {blocks.length > 1 && (
                  <button
                    type="button"
                    onClick={removeCurrentBlock}
                    className="block w-full px-4 py-2 text-left text-xs text-red-400 hover:bg-white/5"
                  >
                    Oefening verwijderen
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="log-scroll space-y-2">
        {block && (
          <div className="log-exercise-card">
            <div className="flex items-center justify-between gap-2">
              <p className="log-exercise-meta truncate">
                {filledInBlock}/{block.sets.length} sets ingevuld
              </p>
              {recognized && (
                <span className="log-equipment-chip shrink-0">{EQUIPMENT_LABELS[recognized.equipment]}</span>
              )}
            </div>

            {recognized ? (
              <h2 className="log-exercise-title">{recognized.name}</h2>
            ) : (
              <input
                type="text"
                list="exercise-suggestions"
                value={block.name}
                onChange={(e) => updateBlock(block.id, { name: e.target.value })}
                placeholder="Oefening (bijv. benchen)"
                className="log-exercise-title w-full bg-transparent outline-none placeholder:font-normal placeholder:text-slate-600"
              />
            )}

            {recognized && settings.showMuscleFocus && muscleFocus && (
              <div className="flex flex-wrap gap-1">
                {muscleFocus.primary.map((label) => (
                  <span key={label} className="log-muscle-chip log-muscle-chip--primary">
                    {label}
                  </span>
                ))}
                {muscleFocus.secondary.slice(0, 2).map((label) => (
                  <span key={label} className="log-muscle-chip log-muscle-chip--secondary">
                    {label}
                  </span>
                ))}
              </div>
            )}

            {showNote && (
              <textarea
                id={`exercise-note-${block.id}`}
                value={block.note}
                onChange={(e) => updateBlock(block.id, { note: e.target.value })}
                placeholder="Notitie…"
                rows={2}
                className="log-exercise-note"
              />
            )}

            <div>
              <div className="mb-1.5 grid grid-cols-[1.75rem_1fr_1fr] gap-1.5 px-0.5">
                <span className="log-exercise-meta">#</span>
                <span className="log-exercise-meta">Reps</span>
                <span className="log-exercise-meta">Kg</span>
              </div>

              <div className="space-y-2">
                {block.sets.map((row, setIndex) => {
                  const hint = lastSetHint(workouts, block.name, setIndex + 1)
                  return (
                    <div key={row.id} className="grid grid-cols-[1.75rem_1fr_1fr] items-center gap-1.5">
                      <span className="text-center text-xs font-bold text-slate-500">{setIndex + 1}</span>
                      <input
                        type="number"
                        inputMode="numeric"
                        min={1}
                        value={row.reps}
                        placeholder={hint.reps || '—'}
                        onChange={(e) => updateRow(block.id, row.id, { reps: e.target.value })}
                        className="log-set-input"
                        aria-label={`Set ${setIndex + 1} herhalingen`}
                      />
                      <input
                        type="number"
                        inputMode="decimal"
                        min={0}
                        step="0.5"
                        value={row.weight}
                        placeholder={hint.weight || '—'}
                        onChange={(e) => updateRow(block.id, row.id, { weight: e.target.value })}
                        className="log-set-input"
                        aria-label={`Set ${setIndex + 1} gewicht`}
                      />
                    </div>
                  )
                })}
              </div>
            </div>

            <button type="button" onClick={() => addSetToBlock(block.id)} className="log-add-set-btn">
              + Set
            </button>
          </div>
        )}

        {recognized && alternatives.length > 0 && (
          <button type="button" onClick={() => setShowAlternatives((v) => !v)} className="log-alt-btn">
            {showAlternatives ? 'Verberg alternatieven' : 'Apparaat bezet? Alternatieven'}
          </button>
        )}

        {showAlternatives && alternatives.length > 0 && (
          <div className="space-y-1.5">
            {alternatives.map((alt) => (
              <div
                key={alt.name}
                className="flex items-center justify-between rounded-xl border border-[#334155] bg-[#1e293b] px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">{alt.name}</p>
                  <p className="text-[10px] text-slate-500">{EQUIPMENT_LABELS[alt.equipment]}</p>
                </div>
                <button
                  type="button"
                  onClick={() => swapExercise(block.id, alt.name)}
                  className="shrink-0 rounded-lg bg-teal-400 px-2.5 py-1 text-[11px] font-bold text-slate-950 hover:bg-teal-300"
                >
                  Wissel
                </button>
              </div>
            ))}
          </div>
        )}

        {showCoach && executionSteps.length > 0 && (
          <div className="log-coach-tip">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-teal-400">Uitvoering</p>
            <ol className="mt-1.5 space-y-1">
              {executionSteps.map((step, index) => (
                <li key={step} className="flex gap-2 text-xs leading-snug text-slate-300">
                  <span className="shrink-0 font-semibold text-teal-400/80">{index + 1}.</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {show3D && recognized && (
          <div className="overflow-hidden rounded-xl border border-[#334155]">
            <Body3D activation={recognized.muscles} height={200} showLegend={false} />
          </div>
        )}

        {error && <p className="rounded-xl bg-red-500/10 px-3 py-2 text-xs text-red-400">{error}</p>}
      </div>

      {showReorder && (
        <div className="log-reorder-backdrop" onClick={() => setShowReorder(false)}>
          <div className="log-reorder-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Volgorde aanpassen</h3>
              <button
                type="button"
                onClick={() => setShowReorder(false)}
                className="text-sm font-medium text-teal-400"
              >
                Klaar
              </button>
            </div>
            <p className="text-xs text-slate-500">Gebruik ↑ ↓ om oefeningen te verplaatsen.</p>
            <div className="max-h-[50vh] space-y-2 overflow-y-auto">
              {blocks.map((b, index) => {
                const label = recognizeExercise(b.name)?.name || b.name || 'Nieuwe oefening'
                const isCurrent = index === currentIndex
                return (
                  <div key={b.id} className={`log-reorder-row ${isCurrent ? 'border-teal-400/40' : ''}`}>
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#1e293b] text-xs font-bold text-slate-400">
                      {index + 1}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-white">{label}</span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => moveBlock(index, index - 1)}
                        className="log-reorder-move"
                        aria-label="Omhoog"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        disabled={index === blocks.length - 1}
                        onClick={() => moveBlock(index, index + 1)}
                        className="log-reorder-move"
                        aria-label="Omlaag"
                      >
                        ↓
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      <div className="log-workout-fab fixed inset-x-0 z-10 mx-auto max-w-md px-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={goPrev}
            disabled={currentIndex === 0}
            className="log-nav-arrow"
            aria-label="Vorige oefening"
          >
            <LogNavArrowIcon direction="left" />
          </button>
          <button type="button" onClick={goNext} className="log-btn-next">
            {isLastExercise ? 'Klaar' : 'Volgende'}
          </button>
          <button
            type="button"
            onClick={() => {
              if (!isLastExercise) goNext()
            }}
            disabled={isLastExercise}
            className="log-nav-arrow"
            aria-label="Volgende oefening"
          >
            <LogNavArrowIcon direction="right" />
          </button>
        </div>
      </div>
    </div>
  )
}
