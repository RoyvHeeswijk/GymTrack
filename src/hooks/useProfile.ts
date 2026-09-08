import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { GUEST_USER_ID } from '../lib/guestMode'
import {
  fetchProfile,
  profileDisplayName,
  profileInitial,
  updateProfileDisplayName,
  type UserProfile,
} from '../lib/profile'

const GUEST_PROFILE: UserProfile = {
  id: GUEST_USER_ID,
  display_name: 'Gast',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

export function useProfile() {
  const { user, isGuest } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    if (isGuest) {
      setProfile(GUEST_PROFILE)
      setLoading(false)
      return
    }

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
  }, [user, isGuest])

  useEffect(() => {
    void reload()
  }, [reload])

  const displayName = profileDisplayName(profile, user?.email)
  const initial = profileInitial(profile, user?.email)

  async function saveDisplayName(name: string) {
    if (isGuest) throw new Error('In demo-modus kun je je profiel niet opslaan.')
    if (!user) throw new Error('Niet ingelogd')
    const updated = await updateProfileDisplayName(user.id, name)
    setProfile(updated)
    return updated
  }

  return { profile, loading, displayName, initial, saveDisplayName, reload }
}
