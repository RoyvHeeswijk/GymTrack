export interface Exercise {
  id: string
  user_id: string
  name: string
  created_at: string
}

export interface Workout {
  id: string
  user_id: string
  name: string
  performed_at: string
  notes: string | null
  /** Canonieke oefeningnaam -> vrije notitie (bijv. aanpassing). */
  exercise_notes: Record<string, string> | null
  created_at: string
}

export interface WorkoutSet {
  id: string
  user_id: string
  workout_id: string
  exercise_id: string
  set_number: number
  reps: number
  weight_kg: number
  created_at: string
}

/** Een training inclusief alle sets en oefeningnamen, zoals de app hem gebruikt. */
export interface WorkoutWithSets extends Workout {
  sets: (WorkoutSet & { exercise_name: string })[]
}

/** Invoermodel voor het loggen van een nieuwe training. */
export interface NewSetInput {
  exerciseName: string
  reps: number
  weightKg: number
}
