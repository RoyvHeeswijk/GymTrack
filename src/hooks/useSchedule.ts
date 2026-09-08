import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { getGuestSchedule } from '../lib/guestDemoData'
import { fetchActiveSchedule, type Schedule } from '../lib/api'

export function useSchedule() {
  const { isGuest } = useAuth()
  const [schedule, setSchedule] = useState<Schedule | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (isGuest) {
      setSchedule(getGuestSchedule())
      setError(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      setSchedule(await fetchActiveSchedule())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kon agenda niet laden.')
    } finally {
      setLoading(false)
    }
  }, [isGuest])

  useEffect(() => {
    void reload()
  }, [reload])

  return { schedule, setSchedule, loading, error, reload }
}
