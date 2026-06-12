import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { DEFAULT_EXERCISES, fetchExercises, saveWorkout } from '../lib/api'
import type { NewSetInput } from '../lib/types'

interface DraftSet {
  id: number
  exerciseName: string
  reps: string
  weight: string
}

let draftId = 0
function newDraftSet(exerciseName = ''): DraftSet {
  return { id: ++draftId, exerciseName, reps: '', weight: '' }
}

export default function LogWorkoutPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [workoutName, setWorkoutName] = useState('')
  const [sets, setSets] = useState<DraftSet[]>([newDraftSet()])
  const [knownExercises, setKnownExercises] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchExercises()
      .then((rows) => setKnownExercises(rows.map((r) => r.name)))
      .catch(() => {})
  }, [])

  const suggestions = useMemo(() => {
    const all = new Set([...knownExercises, ...DEFAULT_EXERCISES])
    return [...all].sort((a, b) => a.localeCompare(b, 'nl'))
  }, [knownExercises])

  function updateSet(id: number, patch: Partial<DraftSet>) {
    setSets((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)))
  }

  function duplicateSet(set: DraftSet) {
    setSets((prev) => {
      const index = prev.findIndex((s) => s.id === set.id)
      const copy = { ...newDraftSet(set.exerciseName), reps: set.reps, weight: set.weight }
      return [...prev.slice(0, index + 1), copy, ...prev.slice(index + 1)]
    })
  }

  function removeSet(id: number) {
    setSets((prev) => (prev.length > 1 ? prev.filter((s) => s.id !== id) : prev))
  }

  const validSets: NewSetInput[] = useMemo(
    () =>
      sets
        .filter((s) => s.exerciseName.trim() && Number(s.reps) > 0 && Number(s.weight) >= 0)
        .map((s) => ({
          exerciseName: s.exerciseName,
          reps: Math.round(Number(s.reps)),
          weightKg: Number(s.weight),
        })),
    [sets],
  )

  async function handleSave() {
    if (!user || validSets.length === 0) return
    setSaving(true)
    setError(null)
    try {
      await saveWorkout(user.id, workoutName, validSets)
      navigate('/', { state: { saved: true } })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Opslaan mislukt. Probeer het opnieuw.')
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Training loggen</h1>
        <p className="mt-1 text-sm text-slate-400">
          Voeg je sets toe en sla je training op. Snel en simpel.
        </p>
      </div>

      <input
        type="text"
        value={workoutName}
        onChange={(e) => setWorkoutName(e.target.value)}
        placeholder="Naam van de training (bijv. Push day)"
        className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white placeholder-slate-500 outline-none focus:border-emerald-500"
      />

      <datalist id="exercise-suggestions">
        {suggestions.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>

      <div className="space-y-3">
        {sets.map((set, index) => (
          <div key={set.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Set {index + 1}
              </span>
              <div className="flex gap-3 text-xs">
                <button
                  onClick={() => duplicateSet(set)}
                  className="text-emerald-400 hover:text-emerald-300"
                >
                  Dupliceer
                </button>
                {sets.length > 1 && (
                  <button onClick={() => removeSet(set.id)} className="text-red-400 hover:text-red-300">
                    Verwijder
                  </button>
                )}
              </div>
            </div>
            <input
              type="text"
              list="exercise-suggestions"
              value={set.exerciseName}
              onChange={(e) => updateSet(set.id, { exerciseName: e.target.value })}
              placeholder="Oefening (bijv. Squat)"
              className="mb-3 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-white placeholder-slate-500 outline-none focus:border-emerald-500"
            />
            <div className="flex gap-3">
              <label className="flex-1">
                <span className="mb-1 block text-xs text-slate-400">Herhalingen</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  value={set.reps}
                  onChange={(e) => updateSet(set.id, { reps: e.target.value })}
                  placeholder="8"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-white placeholder-slate-600 outline-none focus:border-emerald-500"
                />
              </label>
              <label className="flex-1">
                <span className="mb-1 block text-xs text-slate-400">Gewicht (kg)</span>
                <input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="0.5"
                  value={set.weight}
                  onChange={(e) => updateSet(set.id, { weight: e.target.value })}
                  placeholder="60"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-white placeholder-slate-600 outline-none focus:border-emerald-500"
                />
              </label>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => setSets((prev) => [...prev, newDraftSet(prev[prev.length - 1]?.exerciseName ?? '')])}
        className="w-full rounded-xl border border-dashed border-slate-700 py-3 text-sm font-medium text-slate-300 transition hover:border-emerald-500 hover:text-emerald-400"
      >
        + Set toevoegen
      </button>

      {error && <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</p>}

      <button
        onClick={() => void handleSave()}
        disabled={saving || validSets.length === 0}
        className="w-full rounded-xl bg-emerald-500 py-3.5 font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-40"
      >
        {saving
          ? 'Opslaan…'
          : validSets.length === 0
            ? 'Vul minimaal één complete set in'
            : `Training opslaan (${validSets.length} set${validSets.length > 1 ? 's' : ''})`}
      </button>
    </div>
  )
}
