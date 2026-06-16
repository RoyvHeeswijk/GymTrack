import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useProfile } from '../hooks/useProfile'

export default function TopBar() {
  const navigate = useNavigate()
  const { initial } = useProfile()

  return createPortal(
    <header className="top-bar">
      <div className="top-bar-inner mx-auto flex max-w-md items-center justify-between px-5">
        <button onClick={() => navigate('/')} className="flex items-center gap-2">
          <span className="app-logo text-lg font-bold tracking-[0.12em]">
            GYM<span className="gradient-text">TRACK</span>
          </span>
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/instellingen')}
            className="app-icon-btn flex h-9 w-9 items-center justify-center rounded-full border text-slate-400 transition hover:text-white"
            title="Instellingen"
            aria-label="Instellingen"
          >
            <SettingsIcon />
          </button>
          <button
            onClick={() => navigate('/account')}
            className="app-icon-btn flex h-9 w-9 items-center justify-center rounded-full border text-xs font-bold text-emerald-400 transition hover:border-emerald-400/30"
            title="Mijn account"
            aria-label="Mijn account"
          >
            {initial}
          </button>
        </div>
      </div>
    </header>,
    document.body,
  )
}

function SettingsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}
