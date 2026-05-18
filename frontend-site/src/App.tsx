import { createBrowserRouter, RouterProvider, redirect } from 'react-router'
import AuthPage from '@/pages/auth/AuthPage'
import OrgsPage from '@/pages/orgs/OrgsPage'
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
      { path: '/orgs/:orgId/projects', element: <div className="p-8 text-foreground">Projects — coming soon</div> },
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