import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { isSupabaseConfigured } from './lib/supabase'
import Layout from './components/Layout'
import AuthPage from './pages/AuthPage'
import DashboardPage from './pages/DashboardPage'
import LogWorkoutPage from './pages/LogWorkoutPage'
import ProgressPage from './pages/ProgressPage'
import HistoryPage from './pages/HistoryPage'

function AppRoutes() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-slate-400">Laden…</div>
    )
  }

  if (!user) return <AuthPage />

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/loggen" element={<LogWorkoutPage />} />
        <Route path="/progressie" element={<ProgressPage />} />
        <Route path="/geschiedenis" element={<HistoryPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

function ConfigNotice() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
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
  if (!isSupabaseConfigured) return <ConfigNotice />

  return (
    <AuthProvider>
      <BrowserRouter>
        {/* Mobiele frame: app blijft smal en gecentreerd, ook op desktop */}
        <div className="mx-auto min-h-dvh max-w-md bg-slate-950 text-slate-100 shadow-2xl">
          <AppRoutes />
        </div>
      </BrowserRouter>
    </AuthProvider>
  )
}
