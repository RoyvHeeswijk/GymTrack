import { EXERCISE_DB, getExerciseInfo, recognizeExercise, type Equipment, type ExerciseInfo } from './exerciseDb'
import { MUSCLE_LABELS, normalizeActivation, type MuscleActivation, type MuscleId } from './muscles'

export type Goal = 'kracht' | 'spiermassa' | 'afvallen' | 'conditie' | 'algemeen'

export interface PlanRequest {
  goal: Goal
  daysPerWeek: number
  excludedMuscles: MuscleId[]
  excludedEquipment: Equipment[]
  /** Spiergroepen waar de gebruiker expliciet om vraagt (extra volume). */
  focusMuscles: MuscleId[]
  /** Beschikbare dagen van de week (0 = maandag .. 6 = zondag). */
  availableWeekdays: number[]
  /** Beschikbare tijd per training in minuten. */
  sessionMinutes: number
  /** Herkende signalen, voor uitleg aan de gebruiker. */
  detected: string[]
  /** Oefeningen die de gebruiker graag in het schema wil. */
  preferredExercises: string[]
  /** Oefeningen die het schema moet vermijden. */
  avoidedExercises: string[]
  /** Alleen oefeningen waar de gekozen spiergroep(en) primair target zijn. */
  focusOnly: boolean
}

export interface PlanExercise {
  name: string
  sets: number
  reps: string
}

export interface PlanDay {
  title: string
  focus: string
  exercises: PlanExercise[]
}

export interface GeneratedPlan {
  title: string
  goal: Goal
  days: PlanDay[]
  /** Uitleg van de "AI" over de gemaakte keuzes. */
  reasoning: string[]
  /** Gecombineerde spierbelasting over de hele week. */
  weeklyActivation: MuscleActivation
  /** Balansanalyse: waarschuwingen of bevestiging. */
  balance: { ok: boolean; messages: string[] }
  /** Tijd per training in minuten (bepaalt aantal oefeningen). */
  sessionMinutes: number
  /** Weekindeling: lengte 7 (ma..zo); index in days of null = rustdag. */
  assignments: (number | null)[]
}

export const WEEKDAY_LABELS = ['Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag', 'Zondag']
export const WEEKDAY_SHORT = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo']

/** Aantal oefeningen dat in de beschikbare tijd past. */
export function exercisesForMinutes(minutes: number): number {
  if (minutes <= 35) return 4
  if (minutes <= 50) return 5
  return 6
}

/** Verdeelt de trainingsdagen zo gelijkmatig mogelijk over de beschikbare weekdagen. */
export function assignToWeekdays(dayCount: number, availableWeekdays: number[]): (number | null)[] {
  const assignments: (number | null)[] = [null, null, null, null, null, null, null]
  const available = [...availableWeekdays].sort((a, b) => a - b)
  if (dayCount === 0 || available.length === 0) return assignments

  const count = Math.min(dayCount, available.length)
  // Kies gelijkmatig gespreide posities uit de beschikbare dagen
  const chosen: number[] = []
  for (let i = 0; i < count; i++) {
    const pos = Math.round((i * (available.length - 1)) / Math.max(count - 1, 1))
    chosen.push(available[pos])
  }
  // Voorkom dubbele posities bij afronding
  const unique = [...new Set(chosen)]
  let fallback = 0
  while (unique.length < count && fallback < available.length) {
    if (!unique.includes(available[fallback])) unique.push(available[fallback])
    fallback++
  }
  unique.sort((a, b) => a - b)
  unique.forEach((weekday, index) => {
    assignments[weekday] = index
  })
  return assignments
}

/* ----------------------------- NL-parsing ------------------------------ */

const GOAL_KEYWORDS: Record<Goal, string[]> = {
  kracht: ['kracht', 'sterker', 'sterk worden', 'powerlift', '1rm', 'strength'],
  spiermassa: ['spiermassa', 'massa', 'spieren', 'groter', 'bulken', 'hypertrofie', 'muscle', 'aankomen'],
  afvallen: ['afvallen', 'vet', 'droog', 'cutten', 'gewicht verliezen', 'slank'],
  conditie: ['conditie', 'uithouding', 'fitter', 'endurance', 'cardio'],
  algemeen: [],
}

/** Woorden die wijzen op een blessure vlak vóór een lichaamsdeel. */
const INJURY_INDICATORS = [
  'blessure', 'geblesseerd', 'klachten', 'pijn', 'last van', 'last aan', 'overbelast',
  'kapot', 'hernia', 'zeer', 'gevoelig', 'herstellende', 'gescheurd', 'verrekt',
]

/** Woorden die wijzen op minder nadruk vlak vóór een lichaamsdeel. */
const DEEMPHASIS_INDICATORS = [
  'minder', 'weinig', 'rustig', 'licht', 'voorzichtig', 'spaar', 'ontzie', 'geen',
]

interface MuscleGroup {
  /** Specifiekere groepen eerst, zodat "onderrug" niet als "rug" wordt gezien. */
  keywords: string[]
  muscles: MuscleId[]
  label: string
}

const MUSCLE_GROUPS: MuscleGroup[] = [
  { keywords: ['onderrug', 'lage rug', 'hernia'], muscles: ['lowerBack'], label: 'onderrug' },
  { keywords: ['knie', 'knieën'], muscles: ['quads'], label: 'knieën' },
  { keywords: ['pols', 'polsen'], muscles: ['forearms'], label: 'polsen' },
  { keywords: ['elleboog', 'ellebogen'], muscles: ['triceps', 'biceps'], label: 'ellebogen' },
  { keywords: ['biceps'], muscles: ['biceps'], label: 'biceps' },
  { keywords: ['triceps'], muscles: ['triceps'], label: 'triceps' },
  { keywords: ['armen', 'grotere armen', 'armpjes', 'arm'], muscles: ['biceps', 'triceps'], label: 'armen' },
  { keywords: ['borst', 'chest', 'pecs'], muscles: ['chest'], label: 'borst' },
  { keywords: ['lats', 'brede rug', 'rug'], muscles: ['lats', 'upperBack'], label: 'rug' },
  { keywords: ['schouder', 'schouders', 'delts'], muscles: ['frontDelts', 'sideDelts', 'rearDelts'], label: 'schouders' },
  { keywords: ['hamstrings'], muscles: ['hamstrings'], label: 'hamstrings' },
  { keywords: ['quadriceps', 'quads', 'bovenbenen', 'dijen'], muscles: ['quads'], label: 'quadriceps' },
  { keywords: ['billen', 'bilspieren', 'glutes', 'kont'], muscles: ['glutes'], label: 'billen' },
  { keywords: ['kuiten', 'calves'], muscles: ['calves'], label: 'kuiten' },
  { keywords: ['benen', 'beendag', 'legs', 'been'], muscles: ['quads', 'hamstrings', 'glutes', 'calves'], label: 'benen' },
  { keywords: ['buikspieren', 'buik', 'sixpack', 'six-pack', 'core', 'abs'], muscles: ['abs'], label: 'buikspieren' },
]

type Intent = 'injury' | 'deemphasis' | 'focus'

/** Vindt woordgrens-correcte posities van een trefwoord in de tekst. */
function findOccurrences(keyword: string, text: string): [number, number][] {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const pattern = new RegExp(`\\b${escaped}\\b`, 'gi')
  const result: [number, number][] = []
  let match: RegExpExecArray | null
  while ((match = pattern.exec(text)) !== null) {
    result.push([match.index, match.index + match[0].length])
  }
  return result
}

/** Bepaalt de bedoeling op basis van de woorden vlak vóór het lichaamsdeel. */
function classifyIntent(text: string, start: number): Intent {
  const window = text.slice(Math.max(0, start - 32), start)
  if (INJURY_INDICATORS.some((indicator) => window.includes(indicator))) return 'injury'
  if (DEEMPHASIS_INDICATORS.some((indicator) => window.includes(indicator))) return 'deemphasis'
  return 'focus'
}

interface EquipmentRule {
  keywords: string[]
  excluded: Equipment[]
  label: string
}

const EQUIPMENT_RULES: EquipmentRule[] = [
  { keywords: ['thuis', 'geen apparatuur', 'geen gym', 'zonder gewichten', 'home'], excluded: ['barbell', 'machine', 'cable'], label: 'thuis trainen (alleen dumbbells en lichaamsgewicht)' },
  { keywords: ['geen barbell', 'geen stang', 'zonder barbell'], excluded: ['barbell'], label: 'geen barbell-oefeningen' },
  { keywords: ['geen machines', 'zonder machines'], excluded: ['machine'], label: 'geen machine-oefeningen' },
]

/** Interpreteert de invoer in natuurlijke taal (regelgebaseerde NLP). */
export function parsePlanRequest(input: string): PlanRequest {
  const text = input.toLowerCase()
  const detected: string[] = []

  // Doel
  let goal: Goal = 'algemeen'
  for (const [candidate, keywords] of Object.entries(GOAL_KEYWORDS) as [Goal, string[]][]) {
    if (keywords.some((k) => text.includes(k))) {
      goal = candidate
      break
    }
  }
  detected.push(
    goal === 'algemeen'
      ? 'Geen specifiek doel herkend, ik kies een algemeen fitnessdoel'
      : `Doel herkend: ${goal}`,
  )

  // Frequentie: "3x", "3 keer", "drie dagen", "3 dagen per week"
  let daysPerWeek = 3
  const digitMatch = text.match(/(\d)\s*(x|keer|dagen|dgn|days|maal)/)
  const wordNumbers: Record<string, number> = { een: 1, twee: 2, drie: 3, vier: 4, vijf: 5, zes: 6 }
  const wordMatch = text.match(/\b(een|twee|drie|vier|vijf|zes)\b\s*(x|keer|dagen|maal)/)
  if (digitMatch) {
    daysPerWeek = parseInt(digitMatch[1], 10)
  } else if (wordMatch) {
    daysPerWeek = wordNumbers[wordMatch[1]]
  }
  daysPerWeek = Math.min(Math.max(daysPerWeek, 1), 6)
  detected.push(`Trainingsfrequentie: ${daysPerWeek}x per week`)

  // Per spiergroep bepalen of het om blessure, minder nadruk of juist focus gaat.
  // We scannen de woorden vlak vóór elk lichaamsdeel, zodat één zin tegelijk
  // "extra focus op armen" én "blessure aan benen" correct kan bevatten.
  const excludedMuscles: MuscleId[] = []
  const focusMuscles: MuscleId[] = []
  const claimed: [number, number][] = []
  const overlapsClaimed = (start: number, end: number) =>
    claimed.some(([s, e]) => start < e && end > s)

  for (const group of MUSCLE_GROUPS) {
    const occurrences = group.keywords
      .flatMap((keyword) => findOccurrences(keyword, text))
      .filter(([start, end]) => !overlapsClaimed(start, end))
    if (occurrences.length === 0) continue

    for (const range of occurrences) claimed.push(range)
    const intents = occurrences.map(([start]) => classifyIntent(text, start))

    if (intents.includes('injury')) {
      excludedMuscles.push(...group.muscles)
      detected.push(`Rekening gehouden met klachten aan ${group.label}: zwaar belastende oefeningen vermeden`)
    } else if (intents.includes('deemphasis')) {
      excludedMuscles.push(...group.muscles)
      detected.push(`Minder nadruk op ${group.label} zoals gevraagd`)
    } else {
      focusMuscles.push(...group.muscles)
      detected.push(`Extra aandacht voor ${group.label}: meer volume ingepland`)
    }
  }

  // Een gefocuste spier kan niet tegelijk uitgesloten zijn
  const uniqueExcluded = [...new Set(excludedMuscles)]
  const uniqueFocus = [...new Set(focusMuscles)].filter((m) => !uniqueExcluded.includes(m))

  // Apparatuur
  const excludedEquipment: Equipment[] = []
  for (const rule of EQUIPMENT_RULES) {
    if (rule.keywords.some((k) => text.includes(k))) {
      excludedEquipment.push(...rule.excluded)
      detected.push(`Beperking herkend: ${rule.label}`)
    }
  }

  // Tijd per sessie: "45 min", "een uur", "1.5 uur"
  let sessionMinutes = 60
  const minMatch = text.match(/(\d{2,3})\s*(min|minuten|minutes)/)
  const hourMatch = text.match(/(\d(?:[.,]\d)?)\s*uur/)
  if (minMatch) {
    sessionMinutes = parseInt(minMatch[1], 10)
  } else if (hourMatch) {
    sessionMinutes = Math.round(parseFloat(hourMatch[1].replace(',', '.')) * 60)
  }
  sessionMinutes = Math.min(Math.max(sessionMinutes, 20), 120)
  if (minMatch || hourMatch) detected.push(`Tijd per training: ${sessionMinutes} minuten`)

  // Niet-beschikbare dagen: "niet op maandag", "behalve in het weekend"
  const dayNames = ['maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag', 'zondag']
  const negationClauses = text
    .split(/[.,;!?]| maar | en verder | daarnaast /)
    .map((clause) => clause.trim())
    .filter((clause) => ['niet', 'geen', 'kan niet', 'behalve', 'nooit'].some((n) => clause.includes(n)))
  let availableWeekdays = [0, 1, 2, 3, 4, 5, 6]
  const unavailable = new Set<number>()
  for (const clause of negationClauses) {
    dayNames.forEach((name, index) => {
      if (clause.includes(name)) unavailable.add(index)
    })
    if (clause.includes('weekend')) {
      unavailable.add(5)
      unavailable.add(6)
    }
    if (clause.includes('doordeweeks')) {
      ;[0, 1, 2, 3, 4].forEach((d) => unavailable.add(d))
    }
  }
  if (unavailable.size > 0) {
    availableWeekdays = availableWeekdays.filter((d) => !unavailable.has(d))
    detected.push(
      `Niet beschikbaar op: ${[...unavailable].sort().map((d) => WEEKDAY_LABELS[d]).join(', ')}`,
    )
  }

  return {
    goal,
    daysPerWeek,
    excludedMuscles: uniqueExcluded,
    excludedEquipment,
    focusMuscles: uniqueFocus,
    availableWeekdays,
    sessionMinutes,
    detected,
    preferredExercises: [],
    avoidedExercises: [],
    focusOnly: false,
  }
}

/** Parseert een komma-/regel-gescheiden lijst oefeningnamen naar canonieke namen. */
export function parseExercisePreferenceList(raw: string): string[] {
  const result: string[] = []
  const seen = new Set<string>()
  for (const part of raw.split(/[,;\n]+/)) {
    const trimmed = part.trim()
    if (!trimmed) continue
    const canonical = recognizeExercise(trimmed)?.name ?? trimmed
    const key = canonical.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    result.push(canonical)
  }
  return result
}

/* --------------------------- Schemageneratie --------------------------- */

const REP_SCHEMES: Record<Goal, { compound: { sets: number; reps: string }; isolation: { sets: number; reps: string } }> = {
  kracht: { compound: { sets: 5, reps: '3-5' }, isolation: { sets: 3, reps: '6-8' } },
  spiermassa: { compound: { sets: 4, reps: '6-10' }, isolation: { sets: 3, reps: '8-12' } },
  afvallen: { compound: { sets: 3, reps: '10-15' }, isolation: { sets: 3, reps: '12-15' } },
  conditie: { compound: { sets: 3, reps: '12-20' }, isolation: { sets: 2, reps: '15-20' } },
  algemeen: { compound: { sets: 3, reps: '8-12' }, isolation: { sets: 3, reps: '10-15' } },
}

interface DayTemplate {
  title: string
  focus: string
  /** Voorkeursoefeningen op volgorde; eerste beschikbare wordt gekozen. */
  slots: string[][]
}

function templatesFor(days: number): DayTemplate[] {
  const fullBody = (n: number): DayTemplate => ({
    title: `Full body ${n}`,
    focus: 'Hele lichaam',
    slots: [
      ['Squat', 'Leg press', 'Goblet squat', 'Lunge'],
      ['Bench press', 'Dumbbell press', 'Push-up'],
      ['Barbell row', 'Seated cable row', 'Dumbbell row'],
      ['Romanian deadlift', 'Leg curl', 'Hip thrust'],
      ['Overhead press', 'Lateral raise'],
      ['Plank', 'Hanging knee raise', 'Cable crunch'],
    ],
  })
  const push: DayTemplate = {
    title: 'Push',
    focus: 'Borst, schouders en triceps',
    slots: [
      ['Bench press', 'Dumbbell press', 'Push-up'],
      ['Overhead press', 'Lateral raise'],
      ['Incline dumbbell press', 'Chest fly', 'Push-up'],
      ['Lateral raise', 'Chest fly'],
      ['Tricep pushdown', 'Skull crusher', 'Dips'],
    ],
  }
  const pull: DayTemplate = {
    title: 'Pull',
    focus: 'Rug, biceps en achterste schouders',
    slots: [
      ['Deadlift', 'Barbell row', 'Dumbbell row'],
      ['Pull-up', 'Lat pulldown'],
      ['Seated cable row', 'Dumbbell row', 'Barbell row'],
      ['Face pull', 'Rear delt fly'],
      ['Bicep curl', 'Hammer curl'],
    ],
  }
  const legs: DayTemplate = {
    title: 'Legs',
    focus: 'Benen, billen en core',
    slots: [
      ['Squat', 'Leg press', 'Goblet squat'],
      ['Romanian deadlift', 'Leg curl'],
      ['Lunge', 'Bulgarian split squat', 'Leg extension'],
      ['Hip thrust', 'Back extension'],
      ['Calf raise'],
      ['Plank', 'Hanging knee raise'],
    ],
  }
  const upper: DayTemplate = {
    title: 'Upper',
    focus: 'Bovenlichaam',
    slots: [
      ['Bench press', 'Dumbbell press', 'Push-up'],
      ['Barbell row', 'Seated cable row', 'Dumbbell row'],
      ['Overhead press', 'Lateral raise'],
      ['Pull-up', 'Lat pulldown'],
      ['Bicep curl', 'Hammer curl'],
      ['Tricep pushdown', 'Skull crusher'],
    ],
  }
  const lower: DayTemplate = {
    title: 'Lower',
    focus: 'Onderlichaam en core',
    slots: [
      ['Squat', 'Leg press', 'Goblet squat'],
      ['Romanian deadlift', 'Leg curl'],
      ['Lunge', 'Bulgarian split squat'],
      ['Hip thrust', 'Back extension'],
      ['Calf raise'],
      ['Hanging knee raise', 'Plank'],
    ],
  }

  switch (days) {
    case 1:
      return [fullBody(1)]
    case 2:
      return [fullBody(1), fullBody(2)]
    case 3:
      return [push, pull, legs]
    case 4:
      return [
        { ...upper, title: 'Upper 1' },
        { ...lower, title: 'Lower 1' },
        { ...upper, title: 'Upper 2' },
        { ...lower, title: 'Lower 2' },
      ]
    case 5:
      return [push, pull, legs, upper, lower]
    default:
      return [push, pull, legs, { ...push, title: 'Push 2' }, { ...pull, title: 'Pull 2' }, { ...legs, title: 'Legs 2' }]
  }
}

/** Bovenlichaam/armen-dag die een geblokkeerde benen-dag vervangt. */
const ARMS_UPPER_TEMPLATE: DayTemplate = {
  title: 'Upper & armen',
  focus: 'Bovenlichaam met extra armen',
  slots: [
    ['Bench press', 'Dumbbell press', 'Push-up'],
    ['Barbell row', 'Seated cable row', 'Dumbbell row'],
    ['Overhead press', 'Lateral raise'],
    ['Lat pulldown', 'Pull-up'],
    ['Bicep curl', 'Hammer curl'],
    ['Tricep pushdown', 'Skull crusher', 'Dips'],
  ],
}

/**
 * Vervangt been-/onderlichaam-dagen door een bovenlichaamdag wanneer de
 * onderlichaamsspieren grotendeels zijn uitgesloten (bijv. door een blessure).
 * Zo blijft er geen vrijwel lege trainingsdag over.
 */
function substituteBlockedDays(templates: DayTemplate[], lowerBodyBlocked: boolean): DayTemplate[] {
  if (!lowerBodyBlocked) return templates
  let count = 0
  return templates.map((template) => {
    if (/legs|lower/i.test(template.title) || /onderlichaam|benen/i.test(template.focus)) {
      count++
      return { ...ARMS_UPPER_TEMPLATE, title: count > 1 ? `Upper & armen ${count}` : 'Upper & armen' }
    }
    return template
  })
}

/** Primair target valt binnen de gevraagde focus-spieren (synergisten bij compound mogen mee). */
function targetsFocusMuscles(exercise: ExerciseInfo, focusMuscles: MuscleId[]): boolean {
  if (focusMuscles.length === 0) return true
  const focusSet = new Set(focusMuscles)
  const primaries = (Object.entries(exercise.muscles) as [MuscleId, number][])
    .filter(([, value]) => value >= 0.5)
    .map(([muscle]) => muscle)
  if (primaries.some((muscle) => focusSet.has(muscle))) return true
  const top = (Object.entries(exercise.muscles) as [MuscleId, number][]).sort((a, b) => b[1] - a[1])[0]
  return top !== undefined && top[1] >= 0.35 && focusSet.has(top[0])
}

function isAllowed(exercise: ExerciseInfo, request: PlanRequest): boolean {
  const avoided = new Set(request.avoidedExercises.map((name) => name.toLowerCase()))
  if (avoided.has(exercise.name.toLowerCase())) return false
  if (request.excludedEquipment.includes(exercise.equipment)) return false
  // Vermijd oefeningen die een uitgesloten spier zwaar belasten (> 0.5)
  for (const muscle of request.excludedMuscles) {
    if ((exercise.muscles[muscle] ?? 0) > 0.5) return false
  }
  if (request.focusOnly && request.focusMuscles.length > 0) {
    if (!targetsFocusMuscles(exercise, request.focusMuscles)) return false
  }
  return true
}

function pickFromSlot(
  slot: string[],
  request: PlanRequest,
  chosen: PlanExercise[],
): ExerciseInfo | null {
  const candidates = slot
    .map((name) => getExerciseInfo(name))
    .filter((e): e is ExerciseInfo => e !== null)
    .filter((e) => isAllowed(e, request) && !chosen.some((c) => c.name === e.name))

  if (candidates.length === 0) return null

  const preferred = new Set(request.preferredExercises.map((name) => name.toLowerCase()))
  const focusScore = (exercise: ExerciseInfo) =>
    request.focusMuscles.reduce((sum, muscle) => sum + (exercise.muscles[muscle] ?? 0), 0)

  return [...candidates].sort((a, b) => {
    const aPreferred = preferred.has(a.name.toLowerCase()) ? 1 : 0
    const bPreferred = preferred.has(b.name.toLowerCase()) ? 1 : 0
    if (bPreferred !== aPreferred) return bPreferred - aPreferred
    return focusScore(b) - focusScore(a)
  })[0]
}

/** Beste extra oefeningen per spiergroep voor focus-volume. */
const FOCUS_POOL: Partial<Record<MuscleId, string[]>> = {
  biceps: ['Bicep curl', 'Hammer curl'],
  triceps: ['Tricep pushdown', 'Skull crusher', 'Dips'],
  chest: ['Chest fly', 'Incline dumbbell press', 'Push-up'],
  lats: ['Lat pulldown', 'Pull-up', 'Dumbbell row'],
  upperBack: ['Seated cable row', 'Dumbbell row', 'Face pull'],
  sideDelts: ['Lateral raise'],
  rearDelts: ['Face pull', 'Rear delt fly'],
  frontDelts: ['Overhead press'],
  quads: ['Leg extension', 'Lunge', 'Bulgarian split squat'],
  hamstrings: ['Leg curl', 'Romanian deadlift'],
  glutes: ['Hip thrust', 'Lunge', 'Bulgarian split squat'],
  abs: ['Hanging knee raise', 'Cable crunch', 'Plank'],
  calves: ['Calf raise'],
}

function dayActivationFor(day: PlanDay, muscle: MuscleId): number {
  let total = 0
  for (const planExercise of day.exercises) {
    const info = getExerciseInfo(planExercise.name)
    if (info) total += (info.muscles[muscle] ?? 0) * planExercise.sets
  }
  return total
}

/** Voegt extra oefeningen toe voor spiergroepen waar de gebruiker om vraagt. */
function applyFocus(
  days: PlanDay[],
  request: PlanRequest,
  scheme: (typeof REP_SCHEMES)[Goal],
  maxExercises: number,
): string[] {
  const added: string[] = []
  for (const muscle of request.focusMuscles) {
    const pool = (FOCUS_POOL[muscle] ?? [])
      .map((name) => getExerciseInfo(name))
      .filter((e): e is ExerciseInfo => e !== null)
      .filter((e) => isAllowed(e, request))
    if (pool.length === 0) continue

    // Voeg toe aan de dagen waar deze spiergroep al het meest past
    const ranked = [...days].sort(
      (a, b) => dayActivationFor(b, muscle) - dayActivationFor(a, muscle),
    )
    let count = 0
    for (const day of ranked) {
      if (count >= Math.min(2, days.length)) break
      if (day.exercises.length >= maxExercises) continue
      const candidate = pool.find((e) => !day.exercises.some((x) => x.name === e.name))
      if (!candidate) continue
      const reps = candidate.compound ? scheme.compound : scheme.isolation
      day.exercises.push({ name: candidate.name, sets: reps.sets, reps: reps.reps })
      added.push(`${candidate.name} toegevoegd aan ${day.title} (focus: ${MUSCLE_LABELS[muscle]})`)
      count++
    }
  }
  return added
}

/** Voegt voorkeursoefeningen toe die nog niet in het schema staan. */
function applyPreferred(
  days: PlanDay[],
  request: PlanRequest,
  scheme: (typeof REP_SCHEMES)[Goal],
  maxExercises: number,
): string[] {
  const added: string[] = []
  const inPlan = new Set(days.flatMap((day) => day.exercises.map((e) => e.name.toLowerCase())))

  for (const name of request.preferredExercises) {
    if (inPlan.has(name.toLowerCase())) continue
    const info = getExerciseInfo(name)
    if (!info || !isAllowed(info, request)) continue

    const primaryMuscle = (Object.entries(info.muscles) as [MuscleId, number][])
      .filter(([, value]) => value >= 0.5)
      .sort((a, b) => b[1] - a[1])[0]?.[0]

    const ranked = [...days].sort((a, b) =>
      primaryMuscle ? dayActivationFor(b, primaryMuscle) - dayActivationFor(a, primaryMuscle) : 0,
    )

    for (const day of ranked) {
      if (day.exercises.length >= maxExercises) continue
      const reps = info.compound ? scheme.compound : scheme.isolation
      day.exercises.push({ name: info.name, sets: reps.sets, reps: reps.reps })
      inPlan.add(info.name.toLowerCase())
      added.push(`${info.name} toegevoegd aan ${day.title} (voorkeur)`)
      break
    }
  }
  return added
}

const GOAL_TITLES: Record<Goal, string> = {
  kracht: 'Krachtschema',
  spiermassa: 'Spiermassa-schema',
  afvallen: 'Vetverlies-schema',
  conditie: 'Conditieschema',
  algemeen: 'Algemeen fitnessschema',
}

/** Bouwt trainingsdagen uitsluitend uit oefeningen voor de gekozen focus-spieren. */
function buildFocusOnlyDays(
  request: PlanRequest,
  effectiveDays: number,
  maxExercises: number,
  scheme: (typeof REP_SCHEMES)[Goal],
): PlanDay[] {
  const focusLabel = [...new Set(request.focusMuscles.map((m) => MUSCLE_LABELS[m]))].join(', ')
  const seen = new Set<string>()
  const candidates: ExerciseInfo[] = []

  for (const name of request.preferredExercises) {
    const info = getExerciseInfo(name)
    if (info && isAllowed(info, request) && !seen.has(info.name.toLowerCase())) {
      candidates.push(info)
      seen.add(info.name.toLowerCase())
    }
  }
  for (const muscle of request.focusMuscles) {
    for (const name of FOCUS_POOL[muscle] ?? []) {
      const info = getExerciseInfo(name)
      if (info && isAllowed(info, request) && !seen.has(info.name.toLowerCase())) {
        candidates.push(info)
        seen.add(info.name.toLowerCase())
      }
    }
  }
  for (const info of EXERCISE_DB) {
    if (!targetsFocusMuscles(info, request.focusMuscles) || !isAllowed(info, request)) continue
    if (seen.has(info.name.toLowerCase())) continue
    candidates.push(info)
    seen.add(info.name.toLowerCase())
  }

  const days: PlanDay[] = Array.from({ length: effectiveDays }, (_, i) => ({
    title: effectiveDays === 1 ? `Alleen ${focusLabel}` : `Focus ${i + 1}`,
    focus: `Alleen ${focusLabel}`,
    exercises: [],
  }))

  if (candidates.length === 0) return days

  let cursor = 0
  for (let round = 0; round < maxExercises; round++) {
    for (let d = 0; d < effectiveDays; d++) {
      if (days[d].exercises.length >= maxExercises) continue
      for (let attempt = 0; attempt < candidates.length; attempt++) {
        const exercise = candidates[cursor % candidates.length]
        cursor++
        if (days[d].exercises.some((e) => e.name === exercise.name)) continue
        const reps = exercise.compound ? scheme.compound : scheme.isolation
        days[d].exercises.push({ name: exercise.name, sets: reps.sets, reps: reps.reps })
        break
      }
    }
  }

  return days
}

/** Genereert een volledig trainingsschema op basis van een geparste aanvraag. */
export function generatePlan(request: PlanRequest): GeneratedPlan {
  const scheme = REP_SCHEMES[request.goal]

  // Beschikbare dagen begrenzen het aantal trainingsdagen
  const availableWeekdays =
    request.availableWeekdays.length > 0 ? request.availableWeekdays : [0, 1, 2, 3, 4, 5, 6]
  const effectiveDays = Math.min(request.daysPerWeek, availableWeekdays.length)
  const maxExercises = exercisesForMinutes(request.sessionMinutes)
  const focusOnlyMode = request.focusOnly && request.focusMuscles.length > 0

  let days: PlanDay[]
  let focusAdditions: string[] = []

  if (focusOnlyMode) {
    days = buildFocusOnlyDays(request, effectiveDays, maxExercises, scheme)
  } else {
    const lowerBodyBlocked = (['quads', 'hamstrings'] as MuscleId[]).every((m) =>
      request.excludedMuscles.includes(m),
    )
    const templates = substituteBlockedDays(templatesFor(effectiveDays), lowerBodyBlocked)

    days = templates.map((template) => {
      const chosen: PlanExercise[] = []
      for (const slot of template.slots) {
        if (chosen.length >= maxExercises) break
        const exercise = pickFromSlot(slot, request, chosen)
        if (!exercise) continue
        const reps = exercise.compound ? scheme.compound : scheme.isolation
        chosen.push({ name: exercise.name, sets: reps.sets, reps: reps.reps })
      }
      return { title: template.title, focus: template.focus, exercises: chosen }
    })

    focusAdditions = applyFocus(days, request, scheme, maxExercises)
  }

  const preferredAdditions = applyPreferred(days, request, scheme, maxExercises)

  // Weekindeling over beschikbare dagen
  const assignments = assignToWeekdays(days.length, availableWeekdays)
  const trainingDayLabels = assignments
    .map((dayIndex, weekday) => (dayIndex !== null ? WEEKDAY_SHORT[weekday] : null))
    .filter(Boolean)
    .join(', ')

  // Weekbelasting voor heatmap
  const raw: MuscleActivation = {}
  for (const day of days) {
    for (const planExercise of day.exercises) {
      const info = getExerciseInfo(planExercise.name)
      if (!info) continue
      for (const [muscle, value] of Object.entries(info.muscles) as [MuscleId, number][]) {
        raw[muscle] = (raw[muscle] ?? 0) + value * planExercise.sets
      }
    }
  }
  const weeklyActivation = normalizeActivation(raw)

  // Balansanalyse
  const balance = analyzeBalance(raw, request)

  const focusLabels = request.focusMuscles.map((m) => MUSCLE_LABELS[m])
  const preferenceParts: string[] = []
  if (request.preferredExercises.length > 0) {
    preferenceParts.push(`voorkeursoefeningen (${request.preferredExercises.join(', ')})`)
  }
  if (focusLabels.length > 0) {
    preferenceParts.push(`focus op ${focusLabels.join(', ')}`)
  }
  const focusOnlyLabel = [...new Set(request.focusMuscles.map((m) => MUSCLE_LABELS[m]))].join(', ')
  const summaryLead = focusOnlyMode
    ? `Alleen oefeningen voor ${focusOnlyLabel}; andere spieren komen alleen mee als assistent bij de oefening. Maximaal ${maxExercises} oefeningen per sessie (${request.sessionMinutes} min).`
    : preferenceParts.length > 0
      ? `Schema opgebouwd rond ${preferenceParts.join(' en ')}, met maximaal ${maxExercises} oefeningen per sessie (${request.sessionMinutes} min).`
      : `Gebalanceerd schema met maximaal ${maxExercises} oefeningen per sessie (${request.sessionMinutes} min), verdeeld over ${effectiveDays} trainingsdagen.`

  const reasoning = [
    summaryLead,
    ...request.detected,
    ...(focusOnlyMode
      ? [`Alleen-focus modus: geen oefeningen buiten ${focusOnlyLabel} (synergisten bij compound-oefeningen zijn oké).`]
      : []),
    ...preferredAdditions,
    ...focusAdditions,
    `Maximaal ${maxExercises} oefeningen per training, passend bij ${request.sessionMinutes} minuten`,
    `Repbereik afgestemd op ${request.goal === 'algemeen' ? 'algemene fitness' : request.goal}: compound ${scheme.compound.reps} herhalingen, isolatie ${scheme.isolation.reps}`,
    `Split gekozen op basis van ${effectiveDays} dagen: ${days.map((d) => d.title).join(' / ')}`,
    trainingDayLabels ? `Ingepland op: ${trainingDayLabels}` : '',
  ].filter(Boolean)

  return {
    title: `${GOAL_TITLES[request.goal]} (${effectiveDays}x per week)`,
    goal: request.goal,
    days,
    reasoning,
    weeklyActivation,
    balance,
    sessionMinutes: request.sessionMinutes,
    assignments,
  }
}

function analyzeBalance(raw: MuscleActivation, request: PlanRequest): { ok: boolean; messages: string[] } {
  const messages: string[] = []
  const get = (m: MuscleId) => raw[m] ?? 0

  const push = get('chest') + get('frontDelts') + get('triceps')
  const pull = get('lats') + get('upperBack') + get('rearDelts') + get('biceps')
  if (pull > 0 && push / pull > 1.6) {
    messages.push('Relatief veel duwwerk ten opzichte van trekwerk; overweeg een extra roei- of pull-oefening.')
  } else if (push > 0 && pull / push > 1.6) {
    messages.push('Relatief veel trekwerk ten opzichte van duwwerk; overweeg een extra druk-oefening.')
  }

  const quads = get('quads')
  const posterior = get('hamstrings') + get('glutes')
  if (posterior > 0 && quads / posterior > 1.8) {
    messages.push('Quadriceps worden zwaarder belast dan hamstrings/billen; let op de balans voor en achter.')
  }

  const upper = push + pull
  const lower = quads + posterior + get('calves')
  if (lower > 0 && upper / lower > 2.2 && request.excludedMuscles.length === 0) {
    messages.push('Het bovenlichaam krijgt duidelijk meer volume dan het onderlichaam.')
  } else if (upper > 0 && lower / upper > 2.2) {
    messages.push('Het onderlichaam krijgt duidelijk meer volume dan het bovenlichaam.')
  }

  const neglected = (['chest', 'lats', 'quads', 'hamstrings'] as MuscleId[]).filter(
    (m) => get(m) === 0 && !request.excludedMuscles.includes(m),
  )
  if (neglected.length > 0) {
    messages.push(`Niet of nauwelijks getraind: ${neglected.map((m) => MUSCLE_LABELS[m]).join(', ')}.`)
  }

  if (messages.length === 0) {
    messages.push('De trainingsbelasting is evenwichtig verdeeld over het lichaam.')
    return { ok: true, messages }
  }
  return { ok: false, messages }
}

export interface ManualPlanInput {
  title: string
  sessionMinutes: number
  availableWeekdays: number[]
  days: PlanDay[]
}

/** Bouwt een GeneratedPlan vanuit handmatig ingevulde dagen (bestaand eigen schema). */
export function buildPlanFromManual(input: ManualPlanInput): GeneratedPlan {
  const days = input.days
    .map((day) => ({
      title: day.title.trim() || 'Training',
      focus: day.focus.trim() || 'Eigen samengesteld',
      exercises: day.exercises
        .filter((e) => e.name.trim())
        .map((e) => ({
          name: e.name.trim(),
          sets: Math.max(1, e.sets),
          reps: e.reps.trim() || '8-12',
        })),
    }))
    .filter((day) => day.exercises.length > 0)

  const availableWeekdays =
    input.availableWeekdays.length > 0 ? input.availableWeekdays : [0, 1, 2, 3, 4, 5, 6]
  const effectiveDays = days.length
  const assignments = assignToWeekdays(effectiveDays, availableWeekdays)

  const raw: MuscleActivation = {}
  for (const day of days) {
    for (const planExercise of day.exercises) {
      const info = getExerciseInfo(planExercise.name)
      if (!info) continue
      for (const [muscle, value] of Object.entries(info.muscles) as [MuscleId, number][]) {
        raw[muscle] = (raw[muscle] ?? 0) + value * planExercise.sets
      }
    }
  }
  const weeklyActivation = normalizeActivation(raw)

  const request: PlanRequest = {
    goal: 'algemeen',
    daysPerWeek: effectiveDays,
    excludedMuscles: [],
    excludedEquipment: [],
    focusMuscles: [],
    availableWeekdays,
    sessionMinutes: input.sessionMinutes,
    detected: ['Handmatig ingevuld schema'],
    preferredExercises: [],
    avoidedExercises: [],
    focusOnly: false,
  }
  const balance = analyzeBalance(raw, request)

  const trainingDayLabels = assignments
    .map((idx, weekday) => (idx !== null ? WEEKDAY_LABELS[weekday] : null))
    .filter(Boolean)
    .join(', ')

  const totalExercises = days.reduce((sum, d) => sum + d.exercises.length, 0)
  const reasoning = [
    'Handmatig samengesteld — jij bepaalt oefeningen en indeling',
    trainingDayLabels ? `Ingepland op: ${trainingDayLabels}` : '',
    `${effectiveDays} training(en), ${totalExercises} oefening(en) totaal`,
    `${input.sessionMinutes} minuten per sessie (voor agenda-planning)`,
  ].filter(Boolean)

  return {
    title: input.title.trim() || `Mijn schema (${effectiveDays}x per week)`,
    goal: 'algemeen',
    days,
    reasoning,
    weeklyActivation,
    balance,
    sessionMinutes: input.sessionMinutes,
    assignments,
  }
}
