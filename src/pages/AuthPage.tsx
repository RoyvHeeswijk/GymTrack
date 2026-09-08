import { useState, type FormEvent, useEffect } from 'react'
import { getEmailConfirmRedirectUrl } from '../lib/authRedirect'
import { useAuth } from '../context/AuthContext'
import { isSupabaseConfigured } from '../lib/supabase'
import { supabase } from '../lib/supabase'

export default function AuthPage({ authError }: { authError?: string | null }) {
  const { continueAsGuest } = useAuth()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(authError ?? null)
  const [info, setInfo] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (authError) setError(authError)
  }, [authError])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setBusy(true)
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: getEmailConfirmRedirectUrl(),
          },
        })
        if (error) throw error
        if (!data.session) {
          setInfo('Account aangemaakt. Bevestig je e-mailadres via de link in je inbox en log daarna in.')
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Er ging iets mis. Probeer het opnieuw.'
      if (/fetch|network|failed|gateway/i.test(message)) {
        setError('Geen verbinding met Supabase. Het database-project start op — wacht 1–2 minuten en probeer opnieuw.')
      } else {
        setError(message)
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-page flex flex-col justify-center px-6 py-12">
      <div className="mb-8 text-center">
        <h1 className="app-logo text-2xl font-bold tracking-[0.12em]">
          GYM<span className="gradient-text">TRACK</span>
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Plan slim. Train visueel. Begrijp je progressie.
        </p>
      </div>

      <button
        type="button"
        onClick={continueAsGuest}
        className="btn-primary w-full"
      >
        Doorgaan als gast →
      </button>
      <p className="mt-2 text-center text-xs text-slate-500">
        Portfolio-demo met voorbeelddata. Geen account nodig.
      </p>

      {isSupabaseConfigured && (
        <>
          <div className="my-8 flex items-center gap-3">
            <span className="h-px flex-1 bg-slate-700" />
            <span className="text-xs text-slate-500">of log in met account</span>
            <span className="h-px flex-1 bg-slate-700" />
          </div>

          <form onSubmit={handleSubmit} className="card space-y-4">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-300">
                E-mailadres
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="jij@voorbeeld.nl"
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-300">
                Wachtwoord
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="Minimaal 6 tekens"
              />
            </div>

            {error && (
              <p className="rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</p>
            )}
            {info && (
              <p className="rounded-2xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">{info}</p>
            )}

            <button type="submit" disabled={busy} className="btn-secondary w-full">
              {busy ? 'Bezig…' : mode === 'login' ? 'Inloggen' : 'Account aanmaken'}
            </button>
          </form>

          <button
            type="button"
            onClick={() => {
              setMode(mode === 'login' ? 'register' : 'login')
              setError(null)
              setInfo(null)
            }}
            className="mt-6 text-center text-sm text-slate-400 hover:text-white"
          >
            {mode === 'login' ? 'Nog geen account? Registreer hier' : 'Al een account? Log hier in'}
          </button>
        </>
      )}
    </div>
  )
}
