import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import { useAuth } from '../context/AuthContext'
import { useProfile } from '../hooks/useProfile'
import { defaultDisplayName } from '../lib/profile'

export default function AccountPage() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const { profile, loading, displayName, initial, saveDisplayName } = useProfile()
  const [username, setUsername] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!loading) {
      setUsername(displayName)
    }
  }, [loading, displayName])

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    if (!user) return
    setSaving(true)
    setError(null)
    setSaveMessage(null)
    try {
      await saveDisplayName(username)
      setSaveMessage('Accountgegevens opgeslagen.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Opslaan mislukt.')
    } finally {
      setSaving(false)
    }
  }

  async function handleSignOut() {
    await signOut()
    navigate('/', { replace: true })
  }

  const memberSince = profile?.created_at ?? user?.created_at
  const memberLabel = memberSince
    ? new Date(memberSince).toLocaleDateString('nl-NL', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null

  if (loading) {
    return <p className="py-12 text-center text-slate-500">Account laden…</p>
  }

  return (
    <div className="app-page app-page-account">
      <PageHeader section="Account" title="Mijn account" compact />

      <div className="card flex items-center gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-500/10 text-lg font-bold text-emerald-400">
          {initial}
        </div>
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold text-white">{displayName}</p>
          <p className="truncate text-sm text-slate-400">{user?.email}</p>
        </div>
      </div>

      <form onSubmit={(e) => void handleSave(e)} className="card space-y-4">
        <div>
          <label htmlFor="username" className="section-title mb-2 block">
            Gebruikersnaam
          </label>
          <input
            id="username"
            type="text"
            required
            minLength={2}
            maxLength={32}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder={defaultDisplayName(user?.email)}
            className="input-field"
          />
          <p className="mt-1.5 text-[11px] text-slate-500">
            Zo zie je jezelf terug op het dashboard en in de app.
          </p>
        </div>

        <div>
          <label htmlFor="email" className="section-title mb-2 block">
            E-mailadres
          </label>
          <input
            id="email"
            type="email"
            value={user?.email ?? ''}
            readOnly
            className="input-field cursor-not-allowed opacity-70"
          />
        </div>

        {memberLabel && (
          <p className="text-xs text-slate-500">
            Lid sinds {memberLabel}
          </p>
        )}

        {error && (
          <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>
        )}
        {saveMessage && (
          <p className="rounded-xl bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400">{saveMessage}</p>
        )}

        <button type="submit" disabled={saving} className="btn-primary w-full">
          {saving ? 'Opslaan…' : 'Wijzigingen opslaan'}
        </button>
      </form>

      <div className="card space-y-3">
        <div>
          <p className="font-medium text-primary">Sessie</p>
          <p className="mt-1 text-sm text-muted">Log uit op dit apparaat.</p>
        </div>
        <button
          type="button"
          onClick={() => void handleSignOut()}
          className="w-full rounded-xl border border-red-500/40 bg-red-500/10 py-3 text-sm font-semibold text-red-400 transition hover:bg-red-500/20"
        >
          Uitloggen
        </button>
      </div>
    </div>
  )
}
