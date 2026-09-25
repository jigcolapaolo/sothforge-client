'use client'

import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { RefreshCw } from 'lucide-react'
import { useAuth } from '@/lib/auth'

export function ProtectedRoute() {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading)
    return (
      <div className="loading-screen">
        <RefreshCw className="spin" />
        Restaurando tu sesión...
      </div>
    )
  return user ? <Outlet /> : <Navigate to="/login" replace state={{ from: location.pathname }} />
}
