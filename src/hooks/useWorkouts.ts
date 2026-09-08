import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { getGuestWorkouts } from '../lib/guestDemoData'
import { fetchWorkoutsWithSets } from '../lib/api'
import type { WorkoutWithSets } from '../lib/types'

export function useWorkouts() {
  const { isGuest } = useAuth()
  const [workouts, setWorkouts] = useState<WorkoutWithSets[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (isGuest) {
      setWorkouts(getGuestWorkouts())
      setError(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      setWorkouts(await fetchWorkoutsWithSets())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kon trainingen niet laden.')
    } finally {
      setLoading(false)
    }
  }, [isGuest])

  useEffect(() => {
    void reload()
  }, [reload])

  return { workouts, loading, error, reload }
}
