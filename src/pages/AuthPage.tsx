import { useState, type FormEvent } from 'react'
import { getEmailConfirmRedirectUrl } from '../lib/authRedirect'
import { supabase } from '../lib/supabase'

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

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
      setError(err instanceof Error ? err.message : 'Er ging iets mis. Probeer het opnieuw.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="app-scroll flex h-full min-h-0 flex-1 flex-col justify-center px-6">
      <div className="mb-10 text-center">
        <h1 className="app-logo text-3xl font-bold tracking-[0.12em]">
          GYM<span className="gradient-text">TRACK</span>
        </h1>
        <p className="mt-3 text-sm text-slate-400">
          Plan slim. Train visueel. Begrijp je progressie.
        </p>
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

        <button type="submit" disabled={busy} className="btn-primary w-full">
          {busy ? 'Bezig…' : mode === 'login' ? 'Inloggen →' : 'Account aanmaken →'}
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
    </div>
  )
}
