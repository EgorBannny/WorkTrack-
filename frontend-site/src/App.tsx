import { createBrowserRouter, RouterProvider, redirect } from 'react-router'
import AuthPage from '@/pages/auth/AuthPage'
import OrgsPage from '@/pages/orgs/OrgsPage'
import ProjectsPage from '@/pages/projects/ProjectsPage'
import InvitationsPage from '@/pages/invitations/InvitationsPage'
import InvitationAcceptPage from '@/pages/invitations/InvitationAcceptPage'
import ProfilePage from '@/pages/profile/ProfilePage'
import { AppLayout } from '@/components/layout/AppLayout'
import { useAuthStore } from '@/store/auth.store'

function requireGuest() {
  if (useAuthStore.getState().user) throw redirect('/orgs')
  return null
}

function requireAuth({ request }: { request: Request }) {
  if (!useAuthStore.getState().user) {
    const intended = new URL(request.url).pathname
    if (intended !== '/') sessionStorage.setItem('wt-intended', intended)
    throw redirect('/')
  }
  return null
}

const router = createBrowserRouter([
  {
    path: '/',
    loader: requireGuest,
    element: <AuthPage />,
  },
  {
    loader: requireAuth,
    element: <AppLayout />,
    children: [
      { path: '/orgs', element: <OrgsPage /> },
      { path: '/orgs/:orgId/projects', element: <ProjectsPage /> },
      { path: '/orgs/:orgId/projects/:projectId', element: <div className="p-8 text-foreground">Board — coming soon</div> },
      { path: '/invitations', element: <InvitationsPage /> },
      { path: '/invitations/:token', element: <InvitationAcceptPage /> },
      { path: '/profile', element: <ProfilePage /> },
    ],
  },
  {
    path: '*',
    loader: () => redirect('/'),
    element: null,
  },
])

export default function App() {
  return <RouterProvider router={router} />
}