import type { WorkoutWithSets } from './types'

/** Geschatte 1RM volgens de Epley-formule. */
export function estimateOneRepMax(weightKg: number, reps: number): number {
  if (reps <= 1) return weightKg
  return weightKg * (1 + reps / 30)
}

export interface PersonalRecord {
  exerciseName: string
  bestWeightKg: number
  reps: number
  estimatedOneRepMax: number
  achievedAt: string
}

/** Bepaal per oefening het zwaarst getilde gewicht (en bijbehorende est. 1RM). */
export function computePersonalRecords(workouts: WorkoutWithSets[]): PersonalRecord[] {
  const records = new Map<string, PersonalRecord>()
  for (const workout of workouts) {
    for (const set of workout.sets) {
      const current = records.get(set.exercise_name)
      const candidate: PersonalRecord = {
        exerciseName: set.exercise_name,
        bestWeightKg: set.weight_kg,
        reps: set.reps,
        estimatedOneRepMax: estimateOneRepMax(set.weight_kg, set.reps),
        achievedAt: workout.performed_at,
      }
      if (!current || candidate.bestWeightKg > current.bestWeightKg) {
        records.set(set.exercise_name, candidate)
      }
    }
  }
  return [...records.values()].sort((a, b) => b.bestWeightKg - a.bestWeightKg)
}

export interface ProgressPoint {
  date: string
  maxWeightKg: number
  estimatedOneRepMax: number
  volumeKg: number
}

/** Progressie per trainingsdag voor één oefening (voor de grafieken). */
export function computeExerciseProgress(
  workouts: WorkoutWithSets[],
  exerciseName: string,
): ProgressPoint[] {
  const byDate = new Map<string, ProgressPoint>()
  for (const workout of workouts) {
    const sets = workout.sets.filter((s) => s.exercise_name === exerciseName)
    if (sets.length === 0) continue
    const date = workout.performed_at.slice(0, 10)
    const point = byDate.get(date) ?? {
      date,
      maxWeightKg: 0,
      estimatedOneRepMax: 0,
      volumeKg: 0,
    }
    for (const set of sets) {
      point.maxWeightKg = Math.max(point.maxWeightKg, set.weight_kg)
      point.estimatedOneRepMax = Math.max(
        point.estimatedOneRepMax,
        Math.round(estimateOneRepMax(set.weight_kg, set.reps) * 10) / 10,
      )
      point.volumeKg += set.weight_kg * set.reps
    }
    byDate.set(date, point)
  }
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date))
}

export interface Milestone {
  label: string
  description: string
  achieved: boolean
  progress: number // 0..1
}

/** Mijlpalen op basis van totalen, voor het motivatie-element. */
export function computeMilestones(workouts: WorkoutWithSets[]): Milestone[] {
  const totalWorkouts = workouts.length
  const totalSets = workouts.reduce((sum, w) => sum + w.sets.length, 0)
  const totalVolume = workouts.reduce(
    (sum, w) => sum + w.sets.reduce((s, set) => s + set.weight_kg * set.reps, 0),
    0,
  )

  const workoutGoals = [1, 5, 10, 25, 50, 100]
  const volumeGoals = [1000, 5000, 10000, 25000, 50000, 100000]
  const setGoals = [10, 50, 100, 250, 500, 1000]

  const milestones: Milestone[] = []
  for (const goal of workoutGoals) {
    milestones.push({
      label: `${goal} training${goal > 1 ? 'en' : ''}`,
      description: `${Math.min(totalWorkouts, goal)} van ${goal} trainingen voltooid`,
      achieved: totalWorkouts >= goal,
      progress: Math.min(totalWorkouts / goal, 1),
    })
  }
  for (const goal of setGoals) {
    milestones.push({
      label: `${goal} sets`,
      description: `${Math.min(totalSets, goal)} van ${goal} sets gelogd`,
      achieved: totalSets >= goal,
      progress: Math.min(totalSets / goal, 1),
    })
  }
  for (const goal of volumeGoals) {
    milestones.push({
      label: `${goal.toLocaleString('nl-NL')} kg volume`,
      description: `${Math.round(Math.min(totalVolume, goal)).toLocaleString('nl-NL')} van ${goal.toLocaleString('nl-NL')} kg getild`,
      achieved: totalVolume >= goal,
      progress: Math.min(totalVolume / goal, 1),
    })
  }
  return milestones
}

export interface DashboardStats {
  totalWorkouts: number
  workoutsThisWeek: number
  totalVolumeKg: number
  totalSets: number
}

export function computeDashboardStats(workouts: WorkoutWithSets[]): DashboardStats {
  const now = new Date()
  const startOfWeek = new Date(now)
  const day = (now.getDay() + 6) % 7 // maandag = 0
  startOfWeek.setDate(now.getDate() - day)
  startOfWeek.setHours(0, 0, 0, 0)

  return {
    totalWorkouts: workouts.length,
    workoutsThisWeek: workouts.filter((w) => new Date(w.performed_at) >= startOfWeek).length,
    totalVolumeKg: workouts.reduce(
      (sum, w) => sum + w.sets.reduce((s, set) => s + set.weight_kg * set.reps, 0),
      0,
    ),
    totalSets: workouts.reduce((sum, w) => sum + w.sets.length, 0),
  }
}

/** Aantal aaneengesloten weken (incl. of t/m vorige week) met minstens één training. */
export function computeWeeklyStreak(workouts: WorkoutWithSets[]): number {
  if (workouts.length === 0) return 0

  const weekKey = (date: Date): string => {
    const d = new Date(date)
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7)) // maandag
    return d.toISOString().slice(0, 10)
  }

  const weeks = new Set(workouts.map((w) => weekKey(new Date(w.performed_at))))

  let cursor = new Date()
  cursor.setHours(0, 0, 0, 0)
  cursor.setDate(cursor.getDate() - ((cursor.getDay() + 6) % 7))

  // Lopende week mag leeg zijn zonder de reeks te breken
  if (!weeks.has(cursor.toISOString().slice(0, 10))) {
    cursor.setDate(cursor.getDate() - 7)
  }

  let streak = 0
  while (weeks.has(cursor.toISOString().slice(0, 10))) {
    streak++
    cursor.setDate(cursor.getDate() - 7)
  }
  return streak
}

export function formatDateNl(iso: string): string {
  return new Date(iso).toLocaleDateString('nl-NL', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}
