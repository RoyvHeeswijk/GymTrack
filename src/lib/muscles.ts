export type MuscleId =
  | 'chest'
  | 'frontDelts'
  | 'sideDelts'
  | 'rearDelts'
  | 'biceps'
  | 'triceps'
  | 'forearms'
  | 'abs'
  | 'obliques'
  | 'quads'
  | 'hamstrings'
  | 'glutes'
  | 'calves'
  | 'traps'
  | 'lats'
  | 'upperBack'
  | 'lowerBack'

export const MUSCLE_LABELS: Record<MuscleId, string> = {
  chest: 'Borst',
  frontDelts: 'Voorste schouders',
  sideDelts: 'Zijschouders',
  rearDelts: 'Achterste schouders',
  biceps: 'Biceps',
  triceps: 'Triceps',
  forearms: 'Onderarmen',
  abs: 'Buikspieren',
  obliques: 'Schuine buikspieren',
  quads: 'Quadriceps',
  hamstrings: 'Hamstrings',
  glutes: 'Bilspieren',
  calves: 'Kuiten',
  traps: 'Trapezius',
  lats: 'Lats',
  upperBack: 'Bovenrug',
  lowerBack: 'Onderrug',
}

export const ALL_MUSCLES = Object.keys(MUSCLE_LABELS) as MuscleId[]

/** Activatie per spiergroep, waarden 0..1 (voor de heatmap). */
export type MuscleActivation = Partial<Record<MuscleId, number>>

/** Telt activaties bij elkaar op en normaliseert naar 0..1. */
export function normalizeActivation(raw: MuscleActivation): MuscleActivation {
  const max = Math.max(...Object.values(raw).map((v) => v ?? 0), 0)
  if (max === 0) return {}
  const result: MuscleActivation = {}
  for (const [muscle, value] of Object.entries(raw)) {
    result[muscle as MuscleId] = (value ?? 0) / max
  }
  return result
}
