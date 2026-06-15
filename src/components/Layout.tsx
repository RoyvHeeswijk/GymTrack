import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useProfile } from '../hooks/useProfile'

const tabs = [
  { to: '/', label: 'Home', icon: HomeIcon },
  { to: '/agenda', label: 'Agenda', icon: CalendarIcon },
  { to: '/loggen', label: 'Loggen', icon: PlusIcon },
  { to: '/progressie', label: 'Stats', icon: ChartIcon },
  { to: '/geschiedenis', label: 'Historie', icon: HistoryIcon },
]

export default function Layout() {
  const navigate = useNavigate()
  const { initial } = useProfile()

  return (
    <div className="app-layout">
      <header className="app-header z-20 flex shrink-0 items-center justify-between border-b px-5 py-4 backdrop-blur-md">
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
      </header>

      <main className="app-main">
        <Outlet />
      </main>

      {/* Aura-stijl: vlakke bottom bar, actieve tab als pill */}
      <nav className="app-nav fixed inset-x-0 bottom-0 z-20 mx-auto max-w-md border-t backdrop-blur-md">
        <div className="flex items-center justify-around px-2 pb-[max(env(safe-area-inset-bottom),0.625rem)] pt-2">
          {tabs.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex flex-1 flex-col items-center gap-0.5 rounded-xl py-2 text-[10px] font-semibold uppercase tracking-wide transition ${
                  isActive ? 'nav-pill-active' : 'text-slate-500 hover:text-slate-300'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon active={isActive} />
                  <span className="mt-0.5">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}

function HomeIcon({ active }: { active?: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.25 : 1.75} strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <path d="M9 22V12h6v10" />
    </svg>
  )
}

function CalendarIcon({ active }: { active?: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.25 : 1.75} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  )
}

function PlusIcon({ active }: { active?: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2} strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

function ChartIcon({ active }: { active?: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.25 : 1.75} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18" />
      <path d="m7 14 4-4 3 3 5-6" />
    </svg>
  )
}

function HistoryIcon({ active }: { active?: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.25 : 1.75} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M12 7v5l4 2" />
    </svg>
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
