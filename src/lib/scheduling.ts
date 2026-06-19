import { WEEKDAY_LABELS, WEEKDAY_SHORT, type PlanDay } from './planner'
import type { Schedule } from './api'
import type { WorkoutWithSets } from './types'

export { WEEKDAY_LABELS, WEEKDAY_SHORT }

/** JS getDay() (0=zo..6=za) omgezet naar maandag-eerst (0=ma..6=zo). */
export function mondayIndex(date: Date): number {
  return (date.getDay() + 6) % 7
}

/** Begin van de huidige week (maandag 00:00). */
export function startOfWeek(reference = new Date()): Date {
  const date = new Date(reference)
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() - mondayIndex(date))
  return date
}

export interface AgendaDay {
  weekday: number
  label: string
  shortLabel: string
  /** Geplande training voor deze dag, of null bij rustdag. */
  planDay: PlanDay | null
  planDayIndex: number | null
  isToday: boolean
  isPast: boolean
  /** Voltooid deze week. */
  done: boolean
  /** Gepland maar in het verleden en niet gedaan. */
  missed: boolean
}

export interface Agenda {
  days: AgendaDay[]
  /** Eerstvolgende training (rotatie: schuift mee als je een dag mist). */
  next: { planDay: PlanDay; planDayIndex: number; weekday: number | null } | null
  /** Training die vandaag gepland staat (indien aanwezig). */
  today: { planDay: PlanDay; planDayIndex: number } | null
  /** Gemiste, nog in te halen trainingen van deze week. */
  missed: { planDay: PlanDay; planDayIndex: number; weekday: number }[]
  adherence: { done: number; planned: number }
}

/** Trainingen van deze week, gekoppeld aan de weekdag waarop ze plaatsvonden. */
function workoutsThisWeekByWeekday(workouts: WorkoutWithSets[]): Map<number, WorkoutWithSets[]> {
  const weekStart = startOfWeek()
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 7)

  const map = new Map<number, WorkoutWithSets[]>()
  for (const workout of workouts) {
    const performed = new Date(workout.performed_at)
    if (performed >= weekStart && performed < weekEnd) {
      const weekday = mondayIndex(performed)
      const list = map.get(weekday) ?? []
      list.push(workout)
      map.set(weekday, list)
    }
  }
  return map
}

/**
 * Bepaalt de eerstvolgende training via rotatie. Op basis van de laatst
 * gelogde training die bij een schemadag hoort, is de volgende dag in de
 * rotatie aan de beurt. Zo schuift het schema mee als een dag wordt gemist.
 */
function computeNext(
  schedule: Schedule,
  workouts: WorkoutWithSets[],
): { planDay: PlanDay; planDayIndex: number; weekday: number | null } | null {
  const days = schedule.days
  if (days.length === 0) return null

  const titles = days.map((d) => d.title.toLowerCase())
  // Zoek de meest recente training die bij een schemadag hoort
  let lastIndex: number | null = null
  for (const workout of workouts) {
    const idx = titles.indexOf(workout.name.trim().toLowerCase())
    if (idx !== -1) {
      lastIndex = idx
      break // workouts zijn nieuwste-eerst
    }
  }

  const nextIndex = lastIndex === null ? 0 : (lastIndex + 1) % days.length
  const weekday = schedule.assignments.findIndex((a) => a === nextIndex)
  return {
    planDay: days[nextIndex],
    planDayIndex: nextIndex,
    weekday: weekday === -1 ? null : weekday,
  }
}

export interface MonthDay {
  date: Date
  inMonth: boolean
  planDay: PlanDay | null
  done: boolean
  missed: boolean
  isToday: boolean
}

function dateKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
}

/** Bouwt een maandkalender (maandag-eerst) met de schema-indeling per dag. */
export function computeMonth(
  schedule: Schedule,
  workouts: WorkoutWithSets[],
  year: number,
  month: number,
): MonthDay[][] {
  const first = new Date(year, month, 1)
  const gridStart = new Date(first)
  gridStart.setDate(1 - mondayIndex(first))

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const namesByDate = new Map<string, Set<string>>()
  for (const workout of workouts) {
    const key = dateKey(new Date(workout.performed_at))
    const set = namesByDate.get(key) ?? new Set<string>()
    set.add(workout.name.trim().toLowerCase())
    namesByDate.set(key, set)
  }

  const weeks: MonthDay[][] = []
  for (let week = 0; week < 6; week++) {
    const row: MonthDay[] = []
    for (let day = 0; day < 7; day++) {
      const date = new Date(gridStart)
      date.setDate(gridStart.getDate() + week * 7 + day)
      date.setHours(0, 0, 0, 0)

      const assignment = schedule.assignments[mondayIndex(date)]
      const planDay = assignment !== null && assignment !== undefined ? schedule.days[assignment] ?? null : null
      const done = planDay !== null && (namesByDate.get(dateKey(date))?.has(planDay.title.trim().toLowerCase()) ?? false)
      row.push({
        date,
        inMonth: date.getMonth() === month,
        planDay,
        done,
        missed: planDay !== null && date < today && !done,
        isToday: date.getTime() === today.getTime(),
      })
    }
    weeks.push(row)
    // Stop wanneer de volgende week volledig buiten de maand valt
    if (week >= 4 && row.every((d) => !d.inMonth)) {
      weeks.pop()
      break
    }
  }
  return weeks
}

/** Bouwt de volledige agenda-weergave voor een schema. */
export function computeAgenda(schedule: Schedule, workouts: WorkoutWithSets[]): Agenda {
  const todayWeekday = mondayIndex(new Date())
  const doneByWeekday = workoutsThisWeekByWeekday(workouts)

  // Bepaal per schemadag of die deze week al is gedaan (op titel)
  const doneTitles = new Set<string>()
  for (const list of doneByWeekday.values()) {
    for (const workout of list) doneTitles.add(workout.name.trim().toLowerCase())
  }

  const days: AgendaDay[] = schedule.assignments.map((planDayIndex, weekday) => {
    const planDay = planDayIndex !== null ? schedule.days[planDayIndex] ?? null : null
    const isToday = weekday === todayWeekday
    const isPast = weekday < todayWeekday
    const done = planDay !== null && doneTitles.has(planDay.title.trim().toLowerCase())
    const missed = planDay !== null && isPast && !done
    return {
      weekday,
      label: WEEKDAY_LABELS[weekday],
      shortLabel: WEEKDAY_SHORT[weekday],
      planDay,
      planDayIndex: planDay ? planDayIndex : null,
      isToday,
      isPast,
      done,
      missed,
    }
  })

  const plannedDays = days.filter((d) => d.planDay !== null)
  const adherence = {
    done: plannedDays.filter((d) => d.done).length,
    planned: plannedDays.length,
  }

  const todayEntry = days.find((d) => d.isToday && d.planDay && !d.done)
  const today = todayEntry?.planDay
    ? { planDay: todayEntry.planDay, planDayIndex: todayEntry.planDayIndex! }
    : null

  const missed = days
    .filter((d) => d.missed && d.planDay)
    .map((d) => ({ planDay: d.planDay!, planDayIndex: d.planDayIndex!, weekday: d.weekday }))

  return {
    days,
    next: computeNext(schedule, workouts),
    today,
    missed,
    adherence,
  }
}

/** Bepaalt welke training automatisch geladen wordt bij Loggen. */
export function resolveLoggingPlanDay(
  schedule: Schedule,
  workouts: WorkoutWithSets[],
): PlanDay | null {
  const agenda = computeAgenda(schedule, workouts)
  if (agenda.today) return agenda.today.planDay
  if (agenda.next) return agenda.next.planDay
  return null
}

/** Index in schedule.days voor de training die bij Loggen geladen wordt. */
export function resolveLoggingPlanDayIndex(
  schedule: Schedule,
  workouts: WorkoutWithSets[],
): number | null {
  const agenda = computeAgenda(schedule, workouts)
  if (agenda.today) return agenda.today.planDayIndex
  if (agenda.next) return agenda.next.planDayIndex
  return null
}
