import { useCallback, useEffect, useState } from 'react'
import { fetchActiveSchedule, type Schedule } from '../lib/api'

export function useSchedule() {
  const [schedule, setSchedule] = useState<Schedule | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setSchedule(await fetchActiveSchedule())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kon agenda niet laden.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  return { schedule, setSchedule, loading, error, reload }
}
