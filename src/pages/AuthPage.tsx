import { useState, type FormEvent } from 'react'
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
        const { data, error } = await supabase.auth.signUp({ email, password })
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
    <div className="flex min-h-dvh flex-col justify-center px-6 py-12">
      <div className="mb-10 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/15 text-3xl">
          🏋️
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-white">GymTrack</h1>
        <p className="mt-2 text-sm text-slate-400">
          Log je trainingen. Zie je progressie. Blijf gemotiveerd.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
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
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white placeholder-slate-500 outline-none focus:border-emerald-500"
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
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white placeholder-slate-500 outline-none focus:border-emerald-500"
            placeholder="Minimaal 6 tekens"
          />
        </div>

        {error && (
          <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</p>
        )}
        {info && (
          <p className="rounded-xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">{info}</p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl bg-emerald-500 py-3.5 font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-50"
        >
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
    </div>
  )
}
