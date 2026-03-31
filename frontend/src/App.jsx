import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider, useTheme } from './context/ThemeContext'
import AdminDashboard from './pages/AdminDashboard'
import AdvertiserDashboard from './pages/AdvertiserDashboard'
import DriverDashboard from './pages/DriverDashboard'
import AuthPage from './pages/AuthPage'
import LandingPage from './pages/LandingPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import LoadingSpinner from './components/LoadingSpinner'
import { Toaster } from 'react-hot-toast'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingSpinner />
  if (!user) return <Navigate to="/auth" replace />
  return children
}

function DashboardRouter() {
  const { profile, user, loading } = useAuth()
  // Still loading profile from DB — show spinner briefly
  if (loading) return <LoadingSpinner label="Loading your account…" />
  // Profile exists and has a role — go to the right dashboard
  if (profile?.role === 'admin') return <AdminDashboard profile={profile} />
  if (profile?.role === 'driver') return <DriverDashboard profile={profile} />
  if (profile?.role === 'advertiser') return <AdvertiserDashboard profile={profile} />
  // No profile or no role — show setup form so user can complete registration
  return <AuthPage setupMode userId={user?.id} />
}

function AppRoutes() {
  const { user, loading, isPasswordReset } = useAuth()
  const navigate = useNavigate()

  if (loading) return <LoadingSpinner />
  if (isPasswordReset) return <ResetPasswordPage />

  return (
    <Routes>
      <Route
        path="/"
        element={user ? <Navigate to="/dashboard" replace /> : <LandingPage onGetStarted={() => navigate('/auth')} />}
      />
      <Route
        path="/auth"
        element={user ? <Navigate to="/dashboard" replace /> : <AuthPage />}
      />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route
        path="/dashboard"
        element={<ProtectedRoute><DashboardRouter /></ProtectedRoute>}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function ToasterWithTheme() {
  const { theme } = useTheme()
  return (
    <Toaster
      position="top-center"
      toastOptions={{
        style: {
          background: theme === 'dark' ? '#1a1a1a' : '#ffffff',
          color: theme === 'dark' ? '#f5f0e8' : '#1A1814',
          border: theme === 'dark'
            ? '1px solid rgba(245,240,232,0.1)'
            : '1px solid rgba(26,24,20,0.12)',
          boxShadow: theme === 'dark'
            ? '0 8px 24px rgba(0,0,0,0.4)'
            : '0 4px 16px rgba(0,0,0,0.1)',
          borderRadius: '10px',
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '0.92rem',
        },
      }}
    />
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
          <ToasterWithTheme />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  )
}