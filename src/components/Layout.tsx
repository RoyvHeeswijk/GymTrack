import { Outlet, useLocation } from 'react-router-dom'
import BottomNav from './BottomNav'
import TopBar from './TopBar'

export default function Layout() {
  const location = useLocation()
  const isHome = location.pathname === '/'
  const isLog = location.pathname === '/loggen'
  const isAgenda = location.pathname === '/agenda'
  const mainClass = [
    'page-content',
    isHome && 'page-content-home',
    isLog && 'page-content-log',
    isAgenda && 'page-content-agenda',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <>
      <main className={mainClass}>
        <Outlet />
      </main>
      <TopBar />
      <BottomNav />
    </>
  )
}
