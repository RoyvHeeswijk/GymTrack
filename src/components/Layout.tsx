import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const tabs = [
  { to: '/', label: 'Home', icon: HomeIcon },
  { to: '/progressie', label: 'Progressie', icon: ChartIcon },
  { to: '/loggen', label: 'Loggen', icon: PlusIcon, highlight: true },
  { to: '/geschiedenis', label: 'Historie', icon: HistoryIcon },
]

export default function Layout() {
  const { signOut } = useAuth()

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-800 bg-slate-950/90 px-5 py-4 backdrop-blur">
        <div className="flex items-center gap-2">
          <span className="text-xl">🏋️</span>
          <span className="text-lg font-bold tracking-tight text-white">GymTrack</span>
        </div>
        <button
          onClick={() => void signOut()}
          className="text-sm text-slate-400 transition hover:text-white"
        >
          Uitloggen
        </button>
      </header>

      <main className="flex-1 px-5 pb-28 pt-5">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-10 mx-auto max-w-md border-t border-slate-800 bg-slate-950/95 backdrop-blur">
        <div className="flex items-stretch justify-around px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2">
          {tabs.map(({ to, label, icon: Icon, highlight }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex flex-1 flex-col items-center gap-1 rounded-xl py-1.5 text-[11px] font-medium transition ${
                  highlight
                    ? 'text-emerald-400'
                    : isActive
                      ? 'text-white'
                      : 'text-slate-500 hover:text-slate-300'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full ${
                      highlight
                        ? 'bg-emerald-500 text-slate-950'
                        : isActive
                          ? 'bg-slate-800'
                          : ''
                    }`}
                  >
                    <Icon />
                  </span>
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}

function HomeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <path d="M9 22V12h6v10" />
    </svg>
  )
}

function ChartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18" />
      <path d="m7 14 4-4 3 3 5-6" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

function HistoryIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M12 7v5l4 2" />
    </svg>
  )
}
