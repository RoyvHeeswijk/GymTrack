import { useCallback, useEffect, useState } from 'react'
import { fetchWorkoutsWithSets } from '../lib/api'
import type { WorkoutWithSets } from '../lib/types'

export function useWorkouts() {
  const [workouts, setWorkouts] = useState<WorkoutWithSets[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setWorkouts(await fetchWorkoutsWithSets())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kon trainingen niet laden.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  return { workouts, loading, error, reload }
}
