import type { ExerciseInfo } from './exerciseDb'
import { MUSCLE_LABELS, type MuscleId } from './muscles'

export interface MuscleFocusGroups {
  primary: string[]
  secondary: string[]
}

export function muscleFocusFromExercise(exercise: ExerciseInfo): MuscleFocusGroups {
  const primary = (Object.entries(exercise.muscles) as [MuscleId, number][])
    .filter(([, v]) => v >= 0.7)
    .sort((a, b) => b[1] - a[1])
    .map(([m]) => MUSCLE_LABELS[m])

  const secondary = (Object.entries(exercise.muscles) as [MuscleId, number][])
    .filter(([, v]) => v >= 0.3 && v < 0.7)
    .sort((a, b) => b[1] - a[1])
    .map(([m]) => MUSCLE_LABELS[m])

  return { primary, secondary }
}
