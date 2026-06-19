import { getAlternatives, getExerciseInfo, recognizeExercise } from './exerciseDb'

export const USER_ALTERNATIVES_KEY = 'gymtrack-user-alternatives'

type UserAlternativesMap = Record<string, string[]>

export interface AlternativeItem {
  name: string
  equipmentLabel: string
  isUserSaved: boolean
}

const EQUIPMENT_LABELS: Record<string, string> = {
  barbell: 'Barbell',
  dumbbell: 'Dumbbell',
  cable: 'Kabel',
  machine: 'Machine',
  bodyweight: 'Bodyweight',
  kettlebell: 'Kettlebell',
  band: 'Band',
  other: 'Anders',
}

function canonicalKey(name: string): string {
  return recognizeExercise(name)?.name.toLowerCase() ?? name.trim().toLowerCase()
}

function loadMap(): UserAlternativesMap {
  try {
    const raw = localStorage.getItem(USER_ALTERNATIVES_KEY)
    return raw ? (JSON.parse(raw) as UserAlternativesMap) : {}
  } catch {
    return {}
  }
}

function saveMap(map: UserAlternativesMap): void {
  localStorage.setItem(USER_ALTERNATIVES_KEY, JSON.stringify(map))
}

export function getUserAlternativeNames(exerciseName: string): string[] {
  const key = canonicalKey(exerciseName)
  return loadMap()[key] ?? []
}

export function addUserAlternative(exerciseName: string, alternativeName: string): boolean {
  const alt = alternativeName.trim()
  if (!alt) return false
  const key = canonicalKey(exerciseName)
  const map = loadMap()
  const list = map[key] ?? []
  const normalized = alt.toLowerCase()
  if (list.some((n) => n.toLowerCase() === normalized)) return false
  map[key] = [...list, alt]
  saveMap(map)
  return true
}

export function resolveAlternativeName(input: string): string {
  const trimmed = input.trim()
  if (!trimmed) return ''
  return recognizeExercise(trimmed)?.name ?? trimmed
}

function equipmentLabel(name: string): string {
  const info = recognizeExercise(name) ?? getExerciseInfo(name)
  if (!info) return 'Eigen alternatief'
  return EQUIPMENT_LABELS[info.equipment] ?? info.equipment
}

/** Standaard- en door de gebruiker opgeslagen alternatieven, samengevoegd. */
export function getAlternativeItems(exerciseName: string): AlternativeItem[] {
  const builtIn = getAlternatives(exerciseName)
  const canonical = recognizeExercise(exerciseName)?.name ?? exerciseName.trim()
  const items: AlternativeItem[] = builtIn.map((e) => ({
    name: e.name,
    equipmentLabel: EQUIPMENT_LABELS[e.equipment] ?? e.equipment,
    isUserSaved: false,
  }))
  const seen = new Set(items.map((i) => i.name.toLowerCase()))

  for (const altName of getUserAlternativeNames(canonical)) {
    const resolved = resolveAlternativeName(altName)
    const lower = resolved.toLowerCase()
    if (seen.has(lower)) continue
    items.push({
      name: resolved,
      equipmentLabel: equipmentLabel(resolved),
      isUserSaved: true,
    })
    seen.add(lower)
  }

  return items
}
