import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  fetchProfile,
  profileDisplayName,
  profileInitial,
  updateProfileDisplayName,
  type UserProfile,
} from '../lib/profile'

export function useProfile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    if (!user) {
      setProfile(null)
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      setProfile(await fetchProfile(user.id, user.email))
    } catch {
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    void reload()
  }, [reload])

  const displayName = profileDisplayName(profile, user?.email)
  const initial = profileInitial(profile, user?.email)

  async function saveDisplayName(name: string) {
    if (!user) throw new Error('Niet ingelogd')
    const updated = await updateProfileDisplayName(user.id, name)
    setProfile(updated)
    return updated
  }

  return { profile, loading, displayName, initial, saveDisplayName, reload }
}
