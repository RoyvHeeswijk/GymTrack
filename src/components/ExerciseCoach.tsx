import { useMemo, useState } from 'react'
import { getAlternatives, recognizeExercise } from '../lib/exerciseDb'
import { MUSCLE_LABELS, type MuscleId } from '../lib/muscles'
import type { WorkoutWithSets } from '../lib/types'
import { formatDateNl } from '../lib/stats'
import Body3D from './Body3D'

interface ExerciseCoachProps {
  /** Ingevoerde naam (mag synoniem of informeel zijn). */
  input: string
  /** Trainingsgeschiedenis voor historische prestaties. */
  workouts: WorkoutWithSets[]
  /** Vervang de oefening (Dynamische Gym Intelligence). */
  onSwap?: (newName: string) => void
  /** Open direct de lijst met alternatieven (bijv. via 'Bezet?'-knop). */
  autoShowAlternatives?: boolean
}

const EQUIPMENT_LABELS: Record<string, string> = {
  barbell: 'Barbell',
  dumbbell: 'Dumbbells',
  machine: 'Machine',
  cable: 'Kabel',
  bodyweight: 'Lichaamsgewicht',
}

export default function ExerciseCoach({
  input,
  workouts,
  onSwap,
  autoShowAlternatives = false,
}: ExerciseCoachProps) {
  const [showAlternatives, setShowAlternatives] = useState(autoShowAlternatives)
  const [showBody, setShowBody] = useState(false)

  const exercise = useMemo(() => recognizeExercise(input), [input])

  const history = useMemo(() => {
    if (!exercise) return []
    const sessions: { date: string; summary: string; bestWeight: number }[] = []
    for (const workout of workouts) {
      const sets = workout.sets.filter(
        (s) => recognizeExercise(s.exercise_name)?.name === exercise.name,
      )
      if (sets.length === 0) continue
      const bestWeight = Math.max(...sets.map((s) => s.weight_kg))
      sessions.push({
        date: workout.performed_at,
        summary: sets.map((s) => `${s.reps}×${s.weight_kg}kg`).join('  '),
        bestWeight,
      })
      if (sessions.length >= 3) break
    }
    return sessions
  }, [exercise, workouts])

  if (!input.trim()) return null

  if (!exercise) {
    return (
      <div className="mt-2 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-slate-500">
        Oefening niet herkend — je kunt hem gewoon loggen, maar de coach heeft er geen informatie over.
      </div>
    )
  }

  const primaryMuscles = (Object.entries(exercise.muscles) as [MuscleId, number][])
    .filter(([, v]) => v >= 0.7)
    .map(([m]) => MUSCLE_LABELS[m])
  const secondaryMuscles = (Object.entries(exercise.muscles) as [MuscleId, number][])
    .filter(([, v]) => v >= 0.3 && v < 0.7)
    .map(([m]) => MUSCLE_LABELS[m])

  const alternatives = getAlternatives(exercise.name)
  const inputIsCanonical = input.trim().toLowerCase() === exercise.name.toLowerCase()

  return (
    <div className="mt-2 space-y-3 rounded-xl border border-emerald-500/20 bg-slate-950 p-3">
      {!inputIsCanonical && (
        <p className="text-xs text-emerald-400">
          Herkend als <span className="font-semibold">{exercise.name}</span>
          {onSwap && (
            <button
              onClick={() => onSwap(exercise.name)}
              className="ml-2 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] hover:bg-emerald-500/25"
            >
              naam overnemen
            </button>
          )}
        </p>
      )}

      {/* Spiergroepen en focus */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Spiergroepen · {EQUIPMENT_LABELS[exercise.equipment]}
        </p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {primaryMuscles.map((muscle) => (
            <span key={muscle} className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] font-medium text-emerald-400">
              {muscle}
            </span>
          ))}
          {secondaryMuscles.map((muscle) => (
            <span key={muscle} className="rounded-full bg-slate-800 px-2.5 py-1 text-[11px] text-slate-400">
              {muscle}
            </span>
          ))}
        </div>
        <button
          onClick={() => setShowBody(!showBody)}
          className="mt-2 text-[11px] text-slate-400 underline-offset-2 hover:text-white hover:underline"
        >
          {showBody ? 'Verberg 3D-weergave' : 'Toon op 3D-lichaam'}
        </button>
        {showBody && (
          <div className="mt-2">
            <Body3D activation={exercise.muscles} height={240} showLegend={false} />
          </div>
        )}
      </div>

      {/* Uitvoering */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Uitvoering</p>
        <ol className="mt-1.5 space-y-1">
          {exercise.steps.map((step, index) => (
            <li key={step} className="flex gap-2 text-xs text-slate-300">
              <span className="font-semibold text-emerald-400">{index + 1}.</span>
              {step}
            </li>
          ))}
        </ol>
      </div>

      {/* Form cues */}
      <div className="flex flex-wrap gap-1.5">
        {exercise.cues.map((cue) => (
          <span key={cue} className="rounded-lg border border-slate-700 px-2.5 py-1 text-[11px] font-medium text-slate-200">
            {cue}
          </span>
        ))}
      </div>

      {/* Historische prestaties */}
      {history.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Jouw laatste prestaties
          </p>
          <div className="mt-1.5 space-y-1">
            {history.map((session) => (
              <div key={session.date} className="flex items-center justify-between text-xs">
                <span className="text-slate-500">{formatDateNl(session.date)}</span>
                <span className="text-slate-300">{session.summary}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dynamische Gym Intelligence */}
      {alternatives.length > 0 && (
        <div>
          <button
            onClick={() => setShowAlternatives(!showAlternatives)}
            className="w-full rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-400 transition hover:bg-amber-500/20"
          >
            Apparaat bezet? Toon alternatieven
          </button>
          {showAlternatives && (
            <div className="mt-2 space-y-1.5">
              {alternatives.map((alternative) => {
                const altPrimary = (Object.entries(alternative.muscles) as [MuscleId, number][])
                  .filter(([, v]) => v >= 0.7)
                  .map(([m]) => MUSCLE_LABELS[m])
                  .join(', ')
                return (
                  <div
                    key={alternative.name}
                    className="flex items-center justify-between rounded-xl bg-slate-900 px-3 py-2.5"
                  >
                    <div>
                      <p className="text-xs font-medium text-white">{alternative.name}</p>
                      <p className="text-[11px] text-slate-500">
                        {altPrimary} · {EQUIPMENT_LABELS[alternative.equipment]}
                      </p>
                    </div>
                    {onSwap && (
                      <button
                        onClick={() => {
                          onSwap(alternative.name)
                          setShowAlternatives(false)
                        }}
                        className="rounded-lg bg-emerald-500 px-3 py-1.5 text-[11px] font-semibold text-slate-950 hover:bg-emerald-400"
                      >
                        Wissel
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
