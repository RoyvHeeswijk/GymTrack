import PageHeader from '../components/PageHeader'
import { useAuth } from '../context/AuthContext'
import { useSettings } from '../hooks/useSettings'
import { clearAllPrototypeData } from '../lib/api'
import { clearPrototypeLocalState } from '../lib/settings'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

function SettingToggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description: string
  checked: boolean
  onChange: () => void
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="font-medium text-primary">{label}</p>
        <p className="mt-1 text-sm text-muted">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        className={`relative h-8 w-14 shrink-0 rounded-full transition ${
          checked ? 'bg-teal-400' : 'bg-[#334155]'
        }`}
      >
        <span
          className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition ${
            checked ? 'left-7' : 'left-1'
          }`}
        />
      </button>
    </div>
  )
}

export default function SettingsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { settings, updateSettings } = useSettings()
  const [clearing, setClearing] = useState(false)
  const [clearMessage, setClearMessage] = useState<string | null>(null)
  const [clearError, setClearError] = useState<string | null>(null)

  async function handleClearAll() {
    if (!user) return

    const confirmed = window.confirm(
      'Alle planning, trainingen, statistieken en historie worden permanent verwijderd.\n\nDoorgaan?',
    )
    if (!confirmed) return

    setClearing(true)
    setClearMessage(null)
    setClearError(null)

    try {
      await clearAllPrototypeData(user.id)
      clearPrototypeLocalState()
      setClearMessage('Alle data is gewist. Je kunt opnieuw beginnen met testen.')
      setTimeout(() => navigate('/', { replace: true }), 1200)
    } catch (err) {
      setClearError(err instanceof Error ? err.message : 'Wissen mislukt. Probeer het opnieuw.')
    } finally {
      setClearing(false)
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        section="App"
        title="Instellingen"
        description="Pas het gedrag van GymTrack aan tijdens het trainen."
      />

      <div className="card space-y-4">
        <SettingToggle
          label="Coach tips tijdens loggen"
          description="Toon korte uitleg over de uitvoering van elke oefening op het logscherm."
          checked={settings.showCoachTips}
          onChange={() => updateSettings({ showCoachTips: !settings.showCoachTips })}
        />
        <div className="border-t border-theme pt-4">
          <SettingToggle
            label="Spierfocus bij oefening"
            description="Toon een klein vakje met de belangrijkste spiergroepen per oefening tijdens het loggen."
            checked={settings.showMuscleFocus}
            onChange={() => updateSettings({ showMuscleFocus: !settings.showMuscleFocus })}
          />
        </div>
        <div className="border-t border-theme pt-4">
          <SettingToggle
            label="Dagmodus"
            description="Witte achtergrond in plaats van het donkere thema."
            checked={settings.lightMode}
            onChange={() => updateSettings({ lightMode: !settings.lightMode })}
          />
        </div>
      </div>

      <div className="card space-y-3 border-red-500/20">
        <div>
          <p className="font-medium text-primary">Prototype: alles wissen</p>
          <p className="mt-1 text-sm text-muted">
            Verwijdert al je schema&apos;s, agenda, gelogde trainingen, sets en oefeningen. Handig om
            opnieuw te testen vanaf een lege staat.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void handleClearAll()}
          disabled={clearing}
          className="w-full rounded-xl border border-red-500/40 bg-red-500/10 py-3 text-sm font-semibold text-red-400 transition hover:bg-red-500/20 disabled:opacity-50"
        >
          {clearing ? 'Bezig met wissen…' : 'Alle data wissen'}
        </button>
        {clearMessage && (
          <p className="rounded-xl bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400">{clearMessage}</p>
        )}
        {clearError && (
          <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-400">{clearError}</p>
        )}
      </div>
    </div>
  )
}
