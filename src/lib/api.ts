import { supabase } from './supabase'
import type { Exercise, NewSetInput, WorkoutWithSets } from './types'
import type { PlanDay } from './planner'

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

/** Maakt een lege workoutsessie aan voor auto-save tijdens het loggen. */
export async function createWorkoutSession(userId: string, name: string): Promise<string> {
  const { data, error } = await supabase
    .from('workouts')
    .insert({ user_id: userId, name: name.trim() || 'Training' })
    .select('id')
    .single()
  if (error) throw error
  return data.id
}

async function buildSetRows(userId: string, workoutId: string, sets: NewSetInput[]) {
  const uniqueNames = [...new Set(sets.map((s) => s.exerciseName.trim()))]
  const exerciseByName = new Map<string, Exercise>()
  for (const exerciseName of uniqueNames) {
    const exercise = await getOrCreateExercise(userId, exerciseName)
    exerciseByName.set(exerciseName.toLowerCase(), exercise)
  }

  return sets.map((set, index) => ({
    user_id: userId,
    workout_id: workoutId,
    exercise_id: exerciseByName.get(set.exerciseName.trim().toLowerCase())!.id,
    set_number: index + 1,
    reps: set.reps,
    weight_kg: set.weightKg,
  }))
}

/** Vervangt alle sets van een workoutsessie en slaat oefeningnotities op (debounced auto-save). */
export async function syncWorkoutSets(
  workoutId: string,
  userId: string,
  sets: NewSetInput[],
  exerciseNotes: Record<string, string> = {},
): Promise<void> {
  const { error: deleteError } = await supabase.from('sets').delete().eq('workout_id', workoutId)
  if (deleteError) throw deleteError

  if (sets.length > 0) {
    const rows = await buildSetRows(userId, workoutId, sets)
    const { error: insertError } = await supabase.from('sets').insert(rows)
    if (insertError) throw insertError
  }

  const { error: notesError } = await supabase
    .from('workouts')
    .update({ exercise_notes: exerciseNotes })
    .eq('id', workoutId)
  if (notesError) throw notesError
}

/** Haalt de workoutsessie van vandaag op (zelfde titel) voor hervatten. */
export async function fetchTodaysWorkout(
  userId: string,
  planTitle: string,
): Promise<WorkoutWithSets | null> {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(end.getDate() + 1)

  const { data, error } = await supabase
    .from('workouts')
    .select('*, sets(*, exercises(name))')
    .eq('user_id', userId)
    .ilike('name', planTitle.trim())
    .gte('performed_at', start.toISOString())
    .lt('performed_at', end.toISOString())
    .order('performed_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  if (!data) return null

  type RawRow = Omit<WorkoutWithSets, 'sets'> & {
    sets: (WorkoutWithSets['sets'][number] & { exercises: { name: string } | null })[]
  }

  const workout = data as unknown as RawRow
  return {
    ...workout,
    exercise_notes: (workout.exercise_notes as Record<string, string> | null) ?? {},
    sets: workout.sets
      .map(({ exercises, ...set }) => ({
        ...set,
        weight_kg: Number(set.weight_kg),
        exercise_name: exercises?.name ?? 'Onbekend',
      }))
      .sort((a, b) => a.set_number - b.set_number),
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
    exercise_notes: (workout.exercise_notes as Record<string, string> | null) ?? {},
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

/* ------------------------------ Plannen ------------------------------- */

export interface SavedPlan {
  id: string
  user_id: string
  title: string
  goal: string | null
  days: PlanDay[]
  created_at: string
}

export async function fetchPlans(): Promise<SavedPlan[]> {
  const { data, error } = await supabase
    .from('plans')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as SavedPlan[]
}

export async function savePlan(
  userId: string,
  title: string,
  goal: string,
  days: PlanDay[],
): Promise<void> {
  const { error } = await supabase
    .from('plans')
    .insert({ user_id: userId, title, goal, days })
  if (error) throw error
}

export async function deletePlan(planId: string): Promise<void> {
  const { error } = await supabase.from('plans').delete().eq('id', planId)
  if (error) throw error
}

/* ------------------------------ Agenda -------------------------------- */

export interface Schedule {
  id: string
  user_id: string
  title: string
  goal: string | null
  days: PlanDay[]
  /** Lengte 7 (ma..zo); index in days of null = rustdag. */
  assignments: (number | null)[]
  session_minutes: number
  is_active: boolean
  created_at: string
}

/** Haalt de actieve agenda op (of null als die er niet is). */
export async function fetchActiveSchedule(): Promise<Schedule | null> {
  const { data, error } = await supabase
    .from('schedules')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return (data as Schedule | null) ?? null
}

/** Haalt verborgen (inactieve) schema's op, nieuwste eerst. */
export async function fetchInactiveSchedules(): Promise<Schedule[]> {
  const { data, error } = await supabase
    .from('schedules')
    .select('*')
    .eq('is_active', false)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Schedule[]
}

/** Verbergt het actieve schema — blijft opgeslagen maar wordt niet meer gebruikt. */
export async function deactivateSchedule(scheduleId: string): Promise<void> {
  const { error } = await supabase
    .from('schedules')
    .update({ is_active: false })
    .eq('id', scheduleId)
  if (error) throw error
}

/** Zet een opgeslagen schema weer als actieve agenda. */
export async function reactivateSchedule(userId: string, scheduleId: string): Promise<Schedule> {
  await supabase.from('schedules').update({ is_active: false }).eq('user_id', userId).eq('is_active', true)

  const { data, error } = await supabase
    .from('schedules')
    .update({ is_active: true })
    .eq('id', scheduleId)
    .select()
    .single()
  if (error) throw error
  return data as Schedule
}

/** Activeert een nieuw weekschema en deactiveert eventuele eerdere agenda's. */
export async function activateSchedule(
  userId: string,
  title: string,
  goal: string,
  days: PlanDay[],
  assignments: (number | null)[],
  sessionMinutes: number,
): Promise<Schedule> {
  await supabase.from('schedules').update({ is_active: false }).eq('user_id', userId).eq('is_active', true)

  const { data, error } = await supabase
    .from('schedules')
    .insert({
      user_id: userId,
      title,
      goal,
      days,
      assignments,
      session_minutes: sessionMinutes,
      is_active: true,
    })
    .select()
    .single()
  if (error) throw error
  return data as Schedule
}

/** Past de dag-indeling van een bestaande agenda aan. */
export async function updateScheduleAssignments(
  scheduleId: string,
  assignments: (number | null)[],
): Promise<void> {
  const { error } = await supabase
    .from('schedules')
    .update({ assignments })
    .eq('id', scheduleId)
  if (error) throw error
}

export async function deleteSchedule(scheduleId: string): Promise<void> {
  const { error } = await supabase.from('schedules').delete().eq('id', scheduleId)
  if (error) throw error
}

/** Verwijdert alle gebruikersdata — bedoeld voor prototype-testen. */
export async function clearAllPrototypeData(userId: string): Promise<void> {
  const { error: workoutsError } = await supabase.from('workouts').delete().eq('user_id', userId)
  if (workoutsError) throw workoutsError

  const { error: exercisesError } = await supabase.from('exercises').delete().eq('user_id', userId)
  if (exercisesError) throw exercisesError

  const { error: plansError } = await supabase.from('plans').delete().eq('user_id', userId)
  if (plansError) throw plansError

  const { error: schedulesError } = await supabase.from('schedules').delete().eq('user_id', userId)
  if (schedulesError) throw schedulesError
}
