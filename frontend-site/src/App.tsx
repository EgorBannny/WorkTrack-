import { createBrowserRouter, RouterProvider } from 'react-router'
import AuthPage from '@/pages/auth/AuthPage'

const router = createBrowserRouter([
  { path: '/', element: <AuthPage /> },
  { path: '/orgs', element: <div className="p-8 text-foreground">Orgs — coming soon</div> },
])

export default function App() {
  return <RouterProvider router={router} />
}