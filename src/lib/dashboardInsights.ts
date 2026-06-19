import type { Goal } from './planner'
import type { WorkoutWithSets } from './types'
import { computePersonalRecords, estimateOneRepMax, type PersonalRecord } from './stats'
import type { Agenda } from './scheduling'

const GOAL_LABELS: Record<string, string> = {
  spiermassa: 'Spiermassa',
  kracht: 'Kracht',
  afvallen: 'Afvallen',
  conditie: 'Conditie',
  algemeen: 'Algemeen',
}

const MOTIVATION_TIPS = [
  'Consistentie wint van perfectie — elke training telt.',
  'Focus op techniek vóór je het gewicht verhoogt.',
  'Drink water tussen je sets — herstel begint direct.',
  'Een goede warming-up vermindert blessurerisico.',
  'Log je sets — wat je meet, kun je verbeteren.',
  'Rust is onderdeel van je training, niet een pauze van progressie.',
]

const DAILY_TIPS = [
  'Plan je training op vaste dagen — routine helpt bij consistentie.',
  'Neem 2–3 min rust tussen zware compound sets.',
  'Varieer je oefeningen iedere 8–12 weken voor blijvende progressie.',
  'Track je slaap — herstel bepaalt hoe hard je kunt trainen.',
]

export function formatGoalLabel(goal: string | null | undefined): string {
  if (!goal) return 'Nog geen doel'
  return GOAL_LABELS[goal] ?? goal
}

export function startOfWeek(reference = new Date()): Date {
  const date = new Date(reference)
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() - ((date.getDay() + 6) % 7))
  return date
}

export function computeWeeklyVolumeKg(workouts: WorkoutWithSets[]): number {
  const weekStart = startOfWeek()
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 7)
  return workouts
    .filter((w) => {
      const d = new Date(w.performed_at)
      return d >= weekStart && d < weekEnd
    })
    .reduce((sum, w) => sum + w.sets.reduce((s, set) => s + set.weight_kg * set.reps, 0), 0)
}

export interface RecentPR extends PersonalRecord {
  improvementKg: number
}

/** PR-momenten: wanneer een set een nieuw gewichtsrecord was voor die oefening. */
export function computeRecentPRs(workouts: WorkoutWithSets[], limit = 5): RecentPR[] {
  const bestSoFar = new Map<string, number>()
  const events: RecentPR[] = []

  const sorted = [...workouts].sort((a, b) => a.performed_at.localeCompare(b.performed_at))
  for (const workout of sorted) {
    for (const set of workout.sets) {
      const prev = bestSoFar.get(set.exercise_name) ?? 0
      if (set.weight_kg > prev) {
        events.push({
          exerciseName: set.exercise_name,
          bestWeightKg: set.weight_kg,
          reps: set.reps,
          estimatedOneRepMax: estimateOneRepMax(set.weight_kg, set.reps),
          achievedAt: workout.performed_at,
          improvementKg: set.weight_kg - prev,
        })
        bestSoFar.set(set.exercise_name, set.weight_kg)
      }
    }
  }
  return events.slice(-limit).reverse()
}

export function computeBiggestImprovement(recentPrs: RecentPR[]): RecentPR | null {
  if (recentPrs.length === 0) return null
  return recentPrs.reduce((best, pr) => (pr.improvementKg > best.improvementKg ? pr : best))
}

export interface WeekBar {
  label: string
  count: number
  isCurrent: boolean
}

export function computeWeeklyActivity(workouts: WorkoutWithSets[], weeks = 4): WeekBar[] {
  const bars: WeekBar[] = []
  const now = new Date()
  for (let i = weeks - 1; i >= 0; i--) {
    const start = startOfWeek(now)
    start.setDate(start.getDate() - i * 7)
    const end = new Date(start)
    end.setDate(end.getDate() + 7)
    const count = workouts.filter((w) => {
      const d = new Date(w.performed_at)
      return d >= start && d < end
    }).length
    bars.push({
      label: i === 0 ? 'Deze wk' : start.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' }),
      count,
      isCurrent: i === 0,
    })
  }
  return bars
}

/** Regel-gebaseerde coach-inzichten uit trainingshistorie. */
export function computeCoachInsights(workouts: WorkoutWithSets[]): string[] {
  if (workouts.length === 0) {
    return ['Log je eerste training — daarna krijg je hier persoonlijke inzichten.']
  }

  const insights: string[] = []
  const byExercise = new Map<string, { dates: string[]; weights: number[] }>()

  for (const workout of workouts) {
    for (const set of workout.sets) {
      const entry = byExercise.get(set.exercise_name) ?? { dates: [], weights: [] }
      const date = workout.performed_at.slice(0, 10)
      if (!entry.dates.includes(date)) {
        entry.dates.push(date)
        const maxForDay = workout.sets
          .filter((s) => s.exercise_name === set.exercise_name)
          .reduce((m, s) => Math.max(m, s.weight_kg), 0)
        entry.weights.push(maxForDay)
      }
      byExercise.set(set.exercise_name, entry)
    }
  }

  for (const [name, data] of byExercise) {
    if (data.weights.length >= 3) {
      const last3 = data.weights.slice(-3)
      if (last3[2] > last3[0] && last3[1] >= last3[0] && last3[2] >= last3[1]) {
        insights.push(`Je ${name.toLowerCase()} stijgt al 3 sessies achter elkaar.`)
        break
      }
    }
  }

  const records = computePersonalRecords(workouts)
  const squat = records.find((r) => /squat|kniebeugen/i.test(r.exerciseName))
  if (squat && squat.bestWeightKg > 0) {
    const recent = workouts.slice(0, 5)
    const recentSquatVol = recent.reduce((sum, w) => {
      return sum + w.sets
        .filter((s) => /squat|kniebeugen/i.test(s.exercise_name))
        .reduce((s, set) => s + set.weight_kg * set.reps, 0)
    }, 0)
    if (recentSquatVol > 0) {
      insights.push('Je bent waarschijnlijk klaar voor een nieuw squat PR — volume zit goed deze week.')
    }
  }

  const backKeywords = /rug|row|deadlift|pull-up|lat/i
  const thisMonth = new Date()
  thisMonth.setDate(1)
  const lastMonth = new Date(thisMonth)
  lastMonth.setMonth(lastMonth.getMonth() - 1)

  let backVolThis = 0
  let backVolLast = 0
  for (const w of workouts) {
    const d = new Date(w.performed_at)
    const vol = w.sets
      .filter((s) => backKeywords.test(s.exercise_name))
      .reduce((sum, s) => sum + s.weight_kg * s.reps, 0)
    if (d >= thisMonth) backVolThis += vol
    else if (d >= lastMonth && d < thisMonth) backVolLast += vol
  }
  if (backVolLast > 0 && backVolThis > backVolLast * 1.1) {
    const pct = Math.round(((backVolThis - backVolLast) / backVolLast) * 100)
    insights.push(`Je volume op rugtrainingen ligt ${pct}% hoger dan vorige maand.`)
  }

  if (insights.length === 0) {
    const top = records[0]
    if (top) {
      insights.push(`Sterkste lift: ${top.exerciseName} op ${top.bestWeightKg} kg. Blijf consistent loggen voor meer inzichten.`)
    } else {
      insights.push('Goed bezig — elke gelogde set helpt je progressie zichtbaar maken.')
    }
  }

  return insights.slice(0, 3)
}

export function getMotivationTip(): string {
  const day = new Date().getDay()
  return MOTIVATION_TIPS[day % MOTIVATION_TIPS.length]
}

export function getDailyTip(): string {
  const day = new Date().getDate()
  return DAILY_TIPS[day % DAILY_TIPS.length]
}

export function computeTrainingRecommendation(
  agenda: Agenda | null,
  goal: Goal | string | null,
): string {
  if (agenda?.today?.planDay) {
    return `Vandaag: ${agenda.today.planDay.title} — focus op ${agenda.today.planDay.focus.split('·')[0]?.trim() ?? 'kwaliteit'}.`
  }
  if (agenda?.next?.planDay) {
    return `Volgende sessie: ${agenda.next.planDay.title}. Bereid je sets mentaal alvast voor.`
  }
  if (goal === 'kracht') return 'Focus op lage reps en langere rust tussen compound sets.'
  if (goal === 'spiermassa') return 'Houd je reps tussen 8–12 en controleer je techniek op elke set.'
  if (goal === 'afvallen') return 'Combineer krachttraining met steady tempo — geen haast tussen sets.'
  return 'Plan vandaag nog een training — consistentie is je grootste hefboom.'
}

export function weekdayLabel(weekday: number | null): string {
  if (weekday === null) return 'Binnenkort'
  const labels = ['Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag', 'Zondag']
  return labels[weekday] ?? 'Gepland'
}
