import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { SettingsProvider } from './context/SettingsContext'
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
  const { user, loading, authError } = useAuth()

  if (loading) {
    return (
      <div className="app-screen items-center justify-center text-slate-400">Laden…</div>
    )
  }

  if (!user) return <AuthPage authError={authError} />

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

export default function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <BrowserRouter>
          <div className="app-bg app mx-auto flex h-full min-h-0 w-full max-w-md flex-col overflow-hidden shadow-2xl ring-1 ring-theme">
            <AppRoutes />
          </div>
        </BrowserRouter>
      </SettingsProvider>
    </AuthProvider>
  )
}
