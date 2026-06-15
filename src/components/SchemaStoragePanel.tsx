import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useInactiveSchedules } from '../hooks/useInactiveSchedules'
import { useSchedule } from '../hooks/useSchedule'
import { deactivateSchedule, reactivateSchedule, type Schedule } from '../lib/api'

function formatScheduleDate(iso: string) {
  return new Date(iso).toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function trainingDaysCount(schedule: Schedule) {
  return schedule.assignments.filter((a) => a !== null).length
}

type Props = {
  onChanged?: () => void
  showActive?: boolean
  showHidden?: boolean
  /** Geen extra card-rand — voor gebruik binnen een bestaande card. */
  embedded?: boolean
}

export default function SchemaStoragePanel({
  onChanged,
  showActive = true,
  showHidden = true,
  embedded = false,
}: Props) {
  const { user } = useAuth()
  const { schedule, setSchedule, reload: reloadActive } = useSchedule()
  const { inactiveSchedules, loading: hiddenLoading, reload: reloadHidden } = useInactiveSchedules()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function refreshAll() {
    await Promise.all([reloadActive(), reloadHidden()])
    onChanged?.()
  }

  async function handleHide() {
    if (!schedule) return
    const confirmed = window.confirm(
      `"${schedule.title}" verbergen?\n\nHet schema blijft opgeslagen maar verdwijnt van home, agenda en loggen. Je kunt het later weer activeren.`,
    )
    if (!confirmed) return

    setBusyId(schedule.id)
    setError(null)
    try {
      await deactivateSchedule(schedule.id)
      setSchedule(null)
      await refreshAll()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verbergen mislukt.')
    } finally {
      setBusyId(null)
    }
  }

  async function handleReactivate(stored: Schedule) {
    if (!user) return
    setBusyId(stored.id)
    setError(null)
    try {
      const active = await reactivateSchedule(user.id, stored.id)
      setSchedule(active)
      await refreshAll()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Activeren mislukt.')
    } finally {
      setBusyId(null)
    }
  }

  const showActiveBlock = showActive && schedule
  const showHiddenBlock = showHidden && (hiddenLoading || inactiveSchedules.length > 0)

  if (!showActiveBlock && !showHiddenBlock) return null

  const activeWrap = embedded ? 'space-y-3' : 'card space-y-3'

  return (
    <div className="space-y-3">
      {showActiveBlock && (
        <div className={activeWrap}>
          {!embedded && (
            <div>
              <p className="section-title">Actief schema</p>
              <p className="mt-1 font-semibold text-white">{schedule.title}</p>
              <p className="mt-1 text-xs text-slate-500">
                {trainingDaysCount(schedule)} trainingdagen · sinds {formatScheduleDate(schedule.created_at)}
              </p>
            </div>
          )}
          {embedded && (
            <p className="text-xs text-slate-500">
              Actief: <span className="font-medium text-slate-300">{schedule.title}</span>
            </p>
          )}
          <button
            type="button"
            onClick={() => void handleHide()}
            disabled={busyId === schedule.id}
            className="w-full rounded-xl border border-white/10 py-2.5 text-sm font-medium text-slate-400 transition hover:border-white/20 hover:text-slate-200 disabled:opacity-50"
          >
            {busyId === schedule.id ? 'Verbergen…' : 'Schema verbergen'}
          </button>
          <p className="text-[11px] leading-relaxed text-slate-500">
            {embedded
              ? 'Verberg om home en agenda rustiger te houden. Het blijft opgeslagen.'
              : 'Verberg je schema om home en agenda rustiger te houden. Het blijft bewaard onder verborgen schema\'s.'}
          </p>
        </div>
      )}

      {showHiddenBlock && (
        <div className="card space-y-3">
          <div>
            <p className="section-title">Verborgen schema&apos;s</p>
            <p className="mt-1 text-sm text-slate-400">
              Opgeslagen maar niet in gebruik — activeer wanneer je ze weer nodig hebt.
            </p>
          </div>

          {hiddenLoading ? (
            <p className="text-sm text-slate-500">Laden…</p>
          ) : (
            <div className="space-y-2">
              {inactiveSchedules.map((stored) => (
                <div
                  key={stored.id}
                  className="surface-inset flex items-center justify-between gap-3 px-3 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">{stored.title}</p>
                    <p className="text-[11px] text-slate-500">
                      {trainingDaysCount(stored)} dagen · {formatScheduleDate(stored.created_at)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleReactivate(stored)}
                    disabled={busyId === stored.id}
                    className="btn-ghost shrink-0 py-1.5 text-[11px] disabled:opacity-50"
                  >
                    {busyId === stored.id ? '…' : 'Gebruiken'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>
      )}
    </div>
  )
}

export function HiddenSchemasHint() {
  const { inactiveSchedules, loading } = useInactiveSchedules()

  if (loading || inactiveSchedules.length === 0) return null

  return (
    <p className="text-sm text-slate-400">
      Je hebt {inactiveSchedules.length} verborgen schema
      {inactiveSchedules.length === 1 ? '' : 's'}.{' '}
      <Link to="/planner" className="font-semibold text-emerald-400 hover:text-emerald-300">
        Bekijk op schema →
      </Link>
    </p>
  )
}
