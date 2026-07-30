import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LoadingScreen } from './LoadingScreen'

export function ProtectedRoute() {
  const { user, initializing } = useAuth()
  const location = useLocation()
  if (initializing) return <LoadingScreen />
  if (!user) return <Navigate to="/signin" state={{ from: location }} replace />
  return <Outlet />
}
