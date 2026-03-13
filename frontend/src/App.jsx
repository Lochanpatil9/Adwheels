import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
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
  const { profile, user } = useAuth()

  if (profile?.role === 'admin') return <AdminDashboard profile={profile} />
  if (profile?.role === 'driver') return <DriverDashboard profile={profile} />
  if (profile?.role === 'advertiser') return <AdvertiserDashboard profile={profile} />

  return <AuthPage setupMode={true} userId={user?.id} />
}

function AppRoutes() {
  const { user, loading, isPasswordReset } = useAuth()
  const navigate = useNavigate()

  if (loading) return <LoadingSpinner />
  if (isPasswordReset) return <ResetPasswordPage />

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <LandingPage onGetStarted={() => navigate('/auth')} />} />
      <Route path="/auth" element={user ? <Navigate to="/dashboard" replace /> : <AuthPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/dashboard" element={<ProtectedRoute><DashboardRouter /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: '#1a1a1a',
              color: '#f5f0e8',
              border: '1px solid rgba(245,240,232,0.1)',
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  )
}
