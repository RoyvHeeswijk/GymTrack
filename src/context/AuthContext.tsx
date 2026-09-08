import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import {
  disableGuestSession,
  enableGuestSession,
  GUEST_USER,
  isGuestSession,
} from '../lib/guestMode'
import { supabase } from '../lib/supabase'

interface AuthContextValue {
  user: User | null
  isGuest: boolean
  loading: boolean
  authError: string | null
  continueAsGuest: () => void
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isGuest: false,
  loading: true,
  authError: null,
  continueAsGuest: () => {},
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [isGuest, setIsGuest] = useState(isGuestSession())
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)

  useEffect(() => {
    if (isGuestSession()) {
      setIsGuest(true)
      setLoading(false)
      return
    }

    let cancelled = false

    void (async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        if (cancelled) return
        if (error) {
          setAuthError(error.message)
          setSession(null)
        } else {
          setSession(data.session)
        }
      } catch {
        if (!cancelled) {
          setAuthError(
            'Kon geen verbinding maken met Supabase. Controleer je internet of of het project actief is.',
          )
          setSession(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (isGuestSession()) return
      setIsGuest(false)
      setSession(newSession)
      if (newSession) setAuthError(null)
    })

    return () => {
      cancelled = true
      listener.subscription.unsubscribe()
    }
  }, [])

  function continueAsGuest() {
    enableGuestSession()
    setIsGuest(true)
    setSession(null)
    setAuthError(null)
    setLoading(false)
  }

  const signOut = async () => {
    if (isGuest || isGuestSession()) {
      disableGuestSession()
      setIsGuest(false)
      setSession(null)
      return
    }
    await supabase.auth.signOut()
  }

  const user = isGuest ? GUEST_USER : (session?.user ?? null)

  return (
    <AuthContext.Provider
      value={{ user, isGuest, loading, authError, continueAsGuest, signOut }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext)
}
