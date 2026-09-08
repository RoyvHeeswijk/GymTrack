import { Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import BottomNav from './BottomNav'
import TopBar from './TopBar'

export default function Layout() {
  const { isGuest } = useAuth()
  const location = useLocation()
  const isHome = location.pathname === '/'
  const isLog = location.pathname === '/loggen'
  const isAgenda = location.pathname === '/agenda'
  const mainClass = [
    'page-content',
    isHome && 'page-content-home',
    isLog && 'page-content-log',
    isAgenda && 'page-content-agenda',
    isGuest && 'page-content-guest',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <>
      {isGuest && (
        <div className="guest-banner" role="status">
          Demo-modus — voorbeelddata, niets wordt opgeslagen
        </div>
      )}
      <main className={mainClass}>
        <Outlet />
      </main>
      <TopBar />
      <BottomNav />
    </>
  )
}
