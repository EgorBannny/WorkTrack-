import { createBrowserRouter, RouterProvider } from 'react-router'
import AuthPage from '@/pages/auth/AuthPage'
import OrgsPage from '@/pages/orgs/OrgsPage'
import { AppLayout } from '@/components/layout/AppLayout'

const router = createBrowserRouter([
  { path: '/', element: <AuthPage /> },
  {
    element: <AppLayout />,
    children: [
      { path: '/orgs', element: <OrgsPage /> },
      { path: '/orgs/:orgId/projects', element: <div className="p-8 text-foreground">Projects — coming soon</div> },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}