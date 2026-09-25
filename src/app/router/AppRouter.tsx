'use client'

import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import dynamic from 'next/dynamic'
import { AuthProvider } from '@/lib/auth'
import { AppShell } from '@/layouts/AppShell'
import { ProtectedRoute } from '@/features/auth/ProtectedRoute'
import { AuthPage } from '@/features/auth/AuthPage'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { OrganizationsPage } from '@/features/organizations/OrganizationsPage'
import { OrganizationProjectsPage } from '@/features/projects/OrganizationProjectsPage'
import { ProjectPage } from '@/features/projects/ProjectPage'
import { BoardPage } from '@/features/boards/BoardPage'
import { TaskPage } from '@/features/tasks/TaskPage'
import { OrganizationManagePage } from '@/features/organizations/OrganizationManagePage'
import { ProfilePage } from '@/features/users/ProfilePage'

function RouterContent() {
  return (
    <Routes>
      <Route path="/login" element={<AuthPage />} />
      <Route path="/register" element={<AuthPage register />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/app" element={<DashboardPage />} />
          <Route path="/app/profile" element={<ProfilePage />} />
          <Route path="/app/organizations" element={<OrganizationsPage />} />
          <Route
            path="/app/organizations/:organizationId/manage"
            element={<OrganizationManagePage />}
          />
          <Route
            path="/app/organizations/:organizationId/projects"
            element={<OrganizationProjectsPage />}
          />
          <Route path="/app/projects/:projectId" element={<ProjectPage />} />
          <Route path="/app/boards/:boardId" element={<BoardPage />} />
          <Route path="/app/tasks/:taskId" element={<TaskPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/app" replace />} />
    </Routes>
  )
}

function AppRouter() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <RouterContent />
      </BrowserRouter>
    </AuthProvider>
  )
}

export default dynamic(() => Promise.resolve(AppRouter), { ssr: false })
