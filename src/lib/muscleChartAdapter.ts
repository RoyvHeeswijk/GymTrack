import { INTENSITY_COLORS, ViewSide, type BodyState } from 'body-muscles'
import type { MuscleActivation, MuscleId } from './muscles'

/** Plugin SVG-regio's per GymTrack-spiergroep. */
export const MUSCLE_ID_TO_CHART_IDS: Record<MuscleId, readonly string[]> = {
  chest: ['chest-upper-left', 'chest-upper-right', 'chest-lower-left', 'chest-lower-right'],
  frontDelts: ['shoulder-front-left', 'shoulder-front-right'],
  sideDelts: ['shoulder-side-left', 'shoulder-side-right'],
  rearDelts: ['deltoid-rear-left', 'deltoid-rear-right'],
  biceps: ['biceps-left', 'biceps-right'],
  triceps: [
    'triceps-long-left',
    'triceps-lateral-left',
    'triceps-long-right',
    'triceps-lateral-right',
  ],
  forearms: [
    'forearm-left',
    'forearm-right',
    'forearm-flexors-left',
    'forearm-flexors-right',
    'forearm-extensors-left',
    'forearm-extensors-right',
  ],
  abs: ['abs-upper-left', 'abs-upper-right', 'abs-lower-left', 'abs-lower-right'],
  obliques: ['obliques-left', 'obliques-right', 'serratus-anterior-left', 'serratus-anterior-right'],
  quads: ['quads-left', 'quads-right', 'adductors-left', 'adductors-right'],
  hamstrings: [
    'hamstrings-medial-left',
    'hamstrings-lateral-left',
    'hamstrings-medial-right',
    'hamstrings-lateral-right',
  ],
  glutes: ['gluteus-maximus-left', 'gluteus-maximus-right', 'gluteus-medius-left', 'gluteus-medius-right'],
  calves: [
    'calves-gastroc-medial-left',
    'calves-gastroc-lateral-left',
    'calves-soleus-left',
    'calves-gastroc-medial-right',
    'calves-gastroc-lateral-right',
    'calves-soleus-right',
    'tibialis-anterior-left',
    'tibialis-anterior-right',
  ],
  traps: [
    'traps-upper-left',
    'traps-mid-left',
    'traps-lower-left',
    'traps-upper-right',
    'traps-mid-right',
    'traps-lower-right',
  ],
  lats: [
    'lats-upper-left',
    'lats-mid-left',
    'lats-lower-left',
    'lats-upper-right',
    'lats-mid-right',
    'lats-lower-right',
  ],
  upperBack: ['traps-mid-left', 'traps-mid-right', 'traps-lower-left', 'traps-lower-right'],
  lowerBack: [
    'lower-back-erectors-left',
    'lower-back-erectors-right',
    'lower-back-ql-left',
    'lower-back-ql-right',
    'spine',
  ],
}

const BACK_MUSCLE_IDS = new Set<MuscleId>([
  'rearDelts',
  'triceps',
  'traps',
  'lats',
  'upperBack',
  'lowerBack',
  'glutes',
  'hamstrings',
  'calves',
])

const FRONT_MUSCLE_IDS = new Set<MuscleId>([
  'chest',
  'frontDelts',
  'sideDelts',
  'biceps',
  'forearms',
  'abs',
  'obliques',
  'quads',
])

function toIntensity(value: number): number {
  return Math.max(0, Math.min(10, Math.round(value * 10)))
}

export function activationToBodyState(activation: MuscleActivation): BodyState {
  const bodyState: BodyState = {}

  for (const [muscleId, value] of Object.entries(activation) as [MuscleId, number][]) {
    if (!value || value <= 0.01) continue
    const intensity = toIntensity(value)
    for (const chartId of MUSCLE_ID_TO_CHART_IDS[muscleId]) {
      bodyState[chartId] = { intensity, selected: false }
    }
  }

  return bodyState
}

function sumActivation(activation: MuscleActivation, muscleIds: Set<MuscleId>): number {
  let sum = 0
  for (const id of muscleIds) {
    sum += activation[id] ?? 0
  }
  return sum
}

export function hasBackActivation(activation: MuscleActivation): boolean {
  return sumActivation(activation, BACK_MUSCLE_IDS) > 0.01
}

export function hasFrontActivation(activation: MuscleActivation): boolean {
  return sumActivation(activation, FRONT_MUSCLE_IDS) > 0.01
}

/** Kiest automatisch voor- of achteraanzicht op basis van activatie. */
export function pickViewSide(activation: MuscleActivation): ViewSide {
  const backScore = sumActivation(activation, BACK_MUSCLE_IDS)
  const frontScore = sumActivation(activation, FRONT_MUSCLE_IDS)
  if (backScore > frontScore) return ViewSide.BACK
  if (frontScore > backScore) return ViewSide.FRONT
  return ViewSide.FRONT
}

/** Legend-kleur consistent met body-muscles intensiteitsschaal. */
export function heatColorForValue(value: number): string {
  const intensity = toIntensity(value)
  if (intensity <= 0) return '#64748b'
  return INTENSITY_COLORS[intensity] ?? INTENSITY_COLORS[10]
}
