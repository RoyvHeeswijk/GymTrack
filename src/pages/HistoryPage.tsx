import { useState } from 'react'
import { useWorkouts } from '../hooks/useWorkouts'
import { deleteWorkout } from '../lib/api'
import { formatDateNl } from '../lib/stats'
import type { WorkoutWithSets } from '../lib/types'

export default function HistoryPage() {
  const { workouts, loading, error, reload } = useWorkouts()

  if (loading) return <p className="py-12 text-center text-slate-400">Laden…</p>
  if (error) return <p className="py-12 text-center text-red-400">{error}</p>

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Geschiedenis</h1>
        <p className="mt-1 text-sm text-slate-400">Al je trainingen op een rij.</p>
      </div>

      {workouts.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-center">
          <p className="text-3xl">📒</p>
          <p className="mt-2 text-sm text-slate-400">Nog geen trainingen gelogd.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {workouts.map((workout) => (
            <WorkoutCard key={workout.id} workout={workout} onDeleted={reload} />
          ))}
        </div>
      )}
    </div>
  )
}

function WorkoutCard({
  workout,
  onDeleted,
}: {
  workout: WorkoutWithSets
  onDeleted: () => void
}) {
  const [open, setOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const volume = workout.sets.reduce((sum, s) => sum + s.weight_kg * s.reps, 0)
  const exercises = [...new Set(workout.sets.map((s) => s.exercise_name))]

  async function handleDelete() {
    if (!confirm('Weet je zeker dat je deze training wilt verwijderen?')) return
    setDeleting(true)
    try {
      await deleteWorkout(workout.id)
      onDeleted()
    } catch {
      setDeleting(false)
      alert('Verwijderen mislukt. Probeer het opnieuw.')
    }
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-3.5 text-left"
      >
        <div>
          <p className="font-semibold text-white">{workout.name}</p>
          <p className="text-xs text-slate-500">{formatDateNl(workout.performed_at)}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-emerald-400">
            {Math.round(volume).toLocaleString('nl-NL')} kg
          </p>
          <p className="text-xs text-slate-500">
            {workout.sets.length} sets · {exercises.length} oefening{exercises.length > 1 ? 'en' : ''}
          </p>
        </div>
      </button>

      {open && (
        <div className="border-t border-slate-800 px-4 py-3">
          {exercises.map((exerciseName) => (
            <div key={exerciseName} className="py-2">
              <p className="mb-1 text-sm font-medium text-white">{exerciseName}</p>
              <div className="space-y-0.5">
                {workout.sets
                  .filter((s) => s.exercise_name === exerciseName)
                  .map((set) => (
                    <p key={set.id} className="text-xs text-slate-400">
                      Set {set.set_number}: {set.reps} × {set.weight_kg} kg
                    </p>
                  ))}
              </div>
            </div>
          ))}
          <button
            onClick={() => void handleDelete()}
            disabled={deleting}
            className="mt-2 text-xs text-red-400 hover:text-red-300 disabled:opacity-50"
          >
            {deleting ? 'Verwijderen…' : 'Training verwijderen'}
          </button>
        </div>
      )}
    </div>
  )
}
