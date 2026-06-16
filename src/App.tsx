import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { SettingsProvider } from './context/SettingsContext'
import { isSupabaseConfigured } from './lib/supabase'
import Layout from './components/Layout'
import AuthPage from './pages/AuthPage'
import DashboardPage from './pages/DashboardPage'
import LogWorkoutPage from './pages/LogWorkoutPage'
import PlannerPage from './pages/PlannerPage'
import AgendaPage from './pages/AgendaPage'
import ProgressPage from './pages/ProgressPage'
import HistoryPage from './pages/HistoryPage'
import SettingsPage from './pages/SettingsPage'
import AccountPage from './pages/AccountPage'

function AppRoutes() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="app-screen items-center justify-center text-slate-400">Laden…</div>
    )
  }

  if (!user) return <AuthPage />

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/planner" element={<PlannerPage />} />
        <Route path="/agenda" element={<AgendaPage />} />
        <Route path="/loggen" element={<LogWorkoutPage />} />
        <Route path="/progressie" element={<ProgressPage />} />
        <Route path="/geschiedenis" element={<HistoryPage />} />
        <Route path="/instellingen" element={<SettingsPage />} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

function ConfigNotice() {
  return (
    <div className="app-screen items-center justify-center px-6 text-center">
      <p className="text-3xl">⚙️</p>
      <h1 className="mt-3 text-xl font-bold text-white">Supabase nog niet ingesteld</h1>
      <p className="mt-2 max-w-sm text-sm text-slate-400">
        Maak een <code className="text-emerald-400">.env</code>-bestand aan in de projectmap met{' '}
        <code className="text-emerald-400">VITE_SUPABASE_URL</code> en{' '}
        <code className="text-emerald-400">VITE_SUPABASE_ANON_KEY</code>. Zie de README voor de
        stappen.
      </p>
    </div>
  )
}

export default function App() {
  if (!isSupabaseConfigured) {
    return (
      <div className="app-bg app mx-auto max-w-md shadow-2xl ring-1 ring-theme">
        <ConfigNotice />
      </div>
    )
  }

  return (
    <AuthProvider>
      <SettingsProvider>
        <BrowserRouter>
          <div className="app-bg app mx-auto max-w-md shadow-2xl ring-1 ring-theme">
            <AppRoutes />
          </div>
        </BrowserRouter>
      </SettingsProvider>
    </AuthProvider>
  )
}
