import type { WorkoutWithSets } from './types'
import { estimateOneRepMax } from './stats'
import { getExerciseInfo } from './exerciseDb'
import { normalizeActivation, type MuscleActivation, type MuscleId } from './muscles'

export type TrendDirection = 'vooruitgang' | 'stagnatie' | 'achteruitgang' | 'te-weinig-data'

export interface ExerciseTrend {
  exerciseName: string
  direction: TrendDirection
  /** Procentuele verandering in geschatte 1RM over de laatste sessies. */
  changePct: number | null
  sessions: number
  bestE1rm: number
  message: string
}

export interface WorkoutAnalysis {
  workout: WorkoutWithSets
  /** Samenvatting in begrijpelijke taal. */
  summary: string[]
  /** Nieuwe records die in deze training zijn gezet. */
  newRecords: { exerciseName: string; weightKg: number; reps: number }[]
  /** Volumevergelijking met vorige soortgelijke training. */
  volumeChangePct: number | null
  /** Spierbelasting van deze training. */
  activation: MuscleActivation
}

/** Geschatte 1RM van de beste set per sessie voor een oefening. */
function sessionE1rms(workouts: WorkoutWithSets[], exerciseName: string): { date: string; e1rm: number }[] {
  const result: { date: string; e1rm: number }[] = []
  // workouts zijn nieuwste-eerst; we willen oudste-eerst
  for (const workout of [...workouts].reverse()) {
    const sets = workout.sets.filter((s) => s.exercise_name === exerciseName)
    if (sets.length === 0) continue
    const best = Math.max(...sets.map((s) => estimateOneRepMax(s.weight_kg, s.reps)))
    result.push({ date: workout.performed_at, e1rm: best })
  }
  return result
}

/** Trendanalyse per oefening: vooruitgang, stagnatie of achteruitgang. */
export function computeExerciseTrends(workouts: WorkoutWithSets[]): ExerciseTrend[] {
  const names = new Set<string>()
  for (const workout of workouts) {
    for (const set of workout.sets) names.add(set.exercise_name)
  }

  const trends: ExerciseTrend[] = []
  for (const name of names) {
    const sessions = sessionE1rms(workouts, name)
    const bestE1rm = Math.max(...sessions.map((s) => s.e1rm))

    if (sessions.length < 3) {
      trends.push({
        exerciseName: name,
        direction: 'te-weinig-data',
        changePct: null,
        sessions: sessions.length,
        bestE1rm,
        message: `Nog ${3 - sessions.length} sessie${3 - sessions.length > 1 ? 's' : ''} nodig voor een betrouwbare trendanalyse.`,
      })
      continue
    }

    // Vergelijk gemiddelde van laatste 2 sessies met de 2 daarvoor
    const recent = sessions.slice(-2)
    const previous = sessions.slice(-4, -2)
    const recentAvg = recent.reduce((s, x) => s + x.e1rm, 0) / recent.length
    const previousAvg = previous.reduce((s, x) => s + x.e1rm, 0) / previous.length
    const changePct = ((recentAvg - previousAvg) / previousAvg) * 100

    let direction: TrendDirection
    let message: string
    if (changePct > 2) {
      direction = 'vooruitgang'
      message = `Je geschatte 1RM steeg ${changePct.toFixed(1)}% over je laatste sessies. Blijf dit volhouden.`
    } else if (changePct < -2) {
      direction = 'achteruitgang'
      message = `Je geschatte 1RM daalde ${Math.abs(changePct).toFixed(1)}%. Check je herstel, slaap en voeding.`
    } else {
      direction = 'stagnatie'
      message = `Je prestaties zijn al ${sessions.length >= 4 ? 'meerdere' : 'enkele'} sessies vlak. Probeer een extra set, iets meer gewicht of een variatie.`
    }

    trends.push({ exerciseName: name, direction, changePct, sessions: sessions.length, bestE1rm, message })
  }

  const order: Record<TrendDirection, number> = {
    achteruitgang: 0,
    stagnatie: 1,
    vooruitgang: 2,
    'te-weinig-data': 3,
  }
  return trends.sort((a, b) => order[a.direction] - order[b.direction])
}

/** Spierbelasting van één training (voor de heatmap). */
export function workoutActivation(workout: WorkoutWithSets): MuscleActivation {
  const raw: MuscleActivation = {}
  for (const set of workout.sets) {
    const info = getExerciseInfo(set.exercise_name)
    if (!info) continue
    for (const [muscle, value] of Object.entries(info.muscles) as [MuscleId, number][]) {
      raw[muscle] = (raw[muscle] ?? 0) + value
    }
  }
  return normalizeActivation(raw)
}

function workoutVolume(workout: WorkoutWithSets): number {
  return workout.sets.reduce((sum, s) => sum + s.weight_kg * s.reps, 0)
}

/** Volledige analyse van de meest recente training, in begrijpelijke taal. */
export function analyzeLatestWorkout(workouts: WorkoutWithSets[]): WorkoutAnalysis | null {
  if (workouts.length === 0) return null
  const latest = workouts[0]
  const older = workouts.slice(1)

  const summary: string[] = []
  const volume = workoutVolume(latest)
  const exercises = [...new Set(latest.sets.map((s) => s.exercise_name))]

  summary.push(
    `Je hebt ${latest.sets.length} sets gedaan verdeeld over ${exercises.length} oefening${exercises.length > 1 ? 'en' : ''}, met een totaal volume van ${Math.round(volume).toLocaleString('nl-NL')} kg.`,
  )

  // Nieuwe records t.o.v. alle eerdere trainingen
  const newRecords: WorkoutAnalysis['newRecords'] = []
  for (const name of exercises) {
    const latestBest = Math.max(
      ...latest.sets.filter((s) => s.exercise_name === name).map((s) => s.weight_kg),
    )
    const historicBest = Math.max(
      0,
      ...older.flatMap((w) => w.sets.filter((s) => s.exercise_name === name).map((s) => s.weight_kg)),
    )
    if (latestBest > historicBest && older.length > 0) {
      const bestSet = latest.sets
        .filter((s) => s.exercise_name === name && s.weight_kg === latestBest)
        .sort((a, b) => b.reps - a.reps)[0]
      newRecords.push({ exerciseName: name, weightKg: latestBest, reps: bestSet.reps })
    }
  }
  if (newRecords.length > 0) {
    summary.push(
      `Nieuw record op ${newRecords.map((r) => `${r.exerciseName} (${r.weightKg} kg × ${r.reps})`).join(', ')}. Sterk gedaan!`,
    )
  }

  // Volume vergelijken met vorige training met overlappende oefeningen
  let volumeChangePct: number | null = null
  const comparable = older.find((w) => w.sets.some((s) => exercises.includes(s.exercise_name)))
  if (comparable) {
    const previousVolume = workoutVolume(comparable)
    if (previousVolume > 0) {
      volumeChangePct = ((volume - previousVolume) / previousVolume) * 100
      if (volumeChangePct > 5) {
        summary.push(`Je trainingsvolume lag ${volumeChangePct.toFixed(0)}% hoger dan je vorige vergelijkbare training.`)
      } else if (volumeChangePct < -5) {
        summary.push(`Je trainingsvolume lag ${Math.abs(volumeChangePct).toFixed(0)}% lager dan je vorige vergelijkbare training. Een lichtere dag hoort erbij.`)
      } else {
        summary.push('Je trainingsvolume was vergelijkbaar met je vorige training: consistent bezig.')
      }
    }
  }

  // Belaste spiergroepen benoemen
  const activation = workoutActivation(latest)
  const top = (Object.entries(activation) as [MuscleId, number][])
    .filter(([, v]) => v >= 0.5)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
  if (top.length > 0) {
    const labels: Record<string, string> = {
      chest: 'borst', frontDelts: 'voorste schouders', sideDelts: 'zijschouders',
      rearDelts: 'achterste schouders', biceps: 'biceps', triceps: 'triceps',
      forearms: 'onderarmen', abs: 'buikspieren', obliques: 'schuine buikspieren',
      quads: 'quadriceps', hamstrings: 'hamstrings', glutes: 'bilspieren',
      calves: 'kuiten', traps: 'trapezius', lats: 'lats', upperBack: 'bovenrug', lowerBack: 'onderrug',
    }
    summary.push(`De grootste belasting lag op: ${top.map(([m]) => labels[m]).join(', ')}.`)
  }

  return { workout: latest, summary, newRecords, volumeChangePct, activation }
}
