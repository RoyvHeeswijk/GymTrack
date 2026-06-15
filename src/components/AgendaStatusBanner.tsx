import { Link } from 'react-router-dom'

function CalendarIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
      aria-hidden
    >
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  )
}

/** Compacte link naar agenda wanneer er een actief schema is. */
export function AgendaStatusLink() {
  return (
    <Link to="/agenda" className="agenda-status-link">
      <CalendarIcon />
      <span className="min-w-0 truncate">Staat in je agenda</span>
      <span className="agenda-status-link-action">Bekijken →</span>
    </Link>
  )
}

/** Eenmalige bevestiging na het activeren van een schema. */
export function AgendaActivatedNotice() {
  return (
    <div className="agenda-status-notice">
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
      <CalendarIcon />
      <span>Schema geactiveerd — staat in je agenda</span>
    </div>
  )
}
