import { supabase } from './supabase'
import type { Exercise, NewSetInput, WorkoutWithSets } from './types'

/** Veelvoorkomende oefeningen die als suggestie worden getoond. */
export const DEFAULT_EXERCISES = [
  'Squat',
  'Deadlift',
  'Bench press',
  'Overhead press',
  'Barbell row',
  'Pull-up',
  'Lat pulldown',
  'Leg press',
  'Romanian deadlift',
  'Hip thrust',
  'Incline dumbbell press',
  'Bicep curl',
  'Tricep pushdown',
  'Lateral raise',
]

export async function fetchExercises(): Promise<Exercise[]> {
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .order('name')
  if (error) throw error
  return data ?? []
}

async function getOrCreateExercise(userId: string, name: string): Promise<Exercise> {
  const trimmed = name.trim()
  const { data: existing, error: findError } = await supabase
    .from('exercises')
    .select('*')
    .ilike('name', trimmed)
    .maybeSingle()
  if (findError) throw findError
  if (existing) return existing

  const { data: created, error: insertError } = await supabase
    .from('exercises')
    .insert({ user_id: userId, name: trimmed })
    .select()
    .single()
  if (insertError) throw insertError
  return created
}

export async function saveWorkout(
  userId: string,
  name: string,
  sets: NewSetInput[],
  notes?: string,
): Promise<void> {
  const { data: workout, error: workoutError } = await supabase
    .from('workouts')
    .insert({ user_id: userId, name: name.trim() || 'Training', notes: notes?.trim() || null })
    .select()
    .single()
  if (workoutError) throw workoutError

  // Oefeningen ophalen of aanmaken (uniek per naam)
  const uniqueNames = [...new Set(sets.map((s) => s.exerciseName.trim()))]
  const exerciseByName = new Map<string, Exercise>()
  for (const exerciseName of uniqueNames) {
    const exercise = await getOrCreateExercise(userId, exerciseName)
    exerciseByName.set(exerciseName.toLowerCase(), exercise)
  }

  const rows = sets.map((set, index) => ({
    user_id: userId,
    workout_id: workout.id,
    exercise_id: exerciseByName.get(set.exerciseName.trim().toLowerCase())!.id,
    set_number: index + 1,
    reps: set.reps,
    weight_kg: set.weightKg,
  }))

  const { error: setsError } = await supabase.from('sets').insert(rows)
  if (setsError) {
    // Laat geen lege training achter als de sets niet konden worden opgeslagen
    await supabase.from('workouts').delete().eq('id', workout.id)
    throw setsError
  }
}

export async function fetchWorkoutsWithSets(): Promise<WorkoutWithSets[]> {
  const { data, error } = await supabase
    .from('workouts')
    .select('*, sets(*, exercises(name))')
    .order('performed_at', { ascending: false })
  if (error) throw error

  type RawRow = Omit<WorkoutWithSets, 'sets'> & {
    sets: (WorkoutWithSets['sets'][number] & { exercises: { name: string } | null })[]
  }

  return ((data ?? []) as unknown as RawRow[]).map((workout) => ({
    ...workout,
    sets: workout.sets
      .map(({ exercises, ...set }) => ({
        ...set,
        weight_kg: Number(set.weight_kg),
        exercise_name: exercises?.name ?? 'Onbekend',
      }))
      .sort((a, b) => a.set_number - b.set_number),
  }))
}

export async function deleteWorkout(workoutId: string): Promise<void> {
  const { error } = await supabase.from('workouts').delete().eq('id', workoutId)
  if (error) throw error
}
