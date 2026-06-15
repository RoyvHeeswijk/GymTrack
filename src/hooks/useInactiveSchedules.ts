import { useCallback, useEffect, useState } from 'react'
import { fetchInactiveSchedules, type Schedule } from '../lib/api'

export function useInactiveSchedules() {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    setLoading(true)
    try {
      setSchedules(await fetchInactiveSchedules())
    } catch {
      setSchedules([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  return { inactiveSchedules: schedules, loading, reload }
}
