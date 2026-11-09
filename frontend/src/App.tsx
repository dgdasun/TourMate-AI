import { lazy, Suspense, type ReactNode } from 'react'
import { Route, Routes } from 'react-router-dom'
import Layout from './components/layout/Layout'
import { Skeleton } from './components/ui'
import { RequireAuth } from './lib/auth'

// each page is its own chunk, so the first load stays small
const Home = lazy(() => import('./pages/Home'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Explore = lazy(() => import('./pages/Explore'))
const Planner = lazy(() => import('./pages/Planner'))
const Assistant = lazy(() => import('./pages/Assistant'))
const Crowds = lazy(() => import('./pages/Crowds'))
const Insights = lazy(() => import('./pages/Insights'))
const Sustainability = lazy(() => import('./pages/Sustainability'))
const Manage = lazy(() => import('./pages/Manage'))

const loading = <div className="mx-auto max-w-7xl space-y-4 px-4 py-8"><Skeleton className="h-12 w-1/3" /><Skeleton className="h-64" /></div>

/** Page wrapped in the main layout (navbar + footer). */
const page = (el: ReactNode) => <Layout>{el}</Layout>

export default function App() {
  return (
    <Suspense fallback={loading}>
      <Routes>
        {/* full-screen auth pages, no navbar */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* public */}
        <Route path="/" element={page(<Home />)} />
        <Route path="/explore" element={page(<Explore />)} />
        <Route path="/crowds" element={page(<Crowds />)} />
        <Route path="/sustainability" element={page(<Sustainability />)} />

        {/* signed in */}
        <Route path="/dashboard" element={page(<RequireAuth><Dashboard /></RequireAuth>)} />
        <Route path="/planner" element={page(<RequireAuth><Planner /></RequireAuth>)} />
        <Route path="/assistant" element={page(<RequireAuth><Assistant /></RequireAuth>)} />
        <Route path="/insights" element={page(<RequireAuth><Insights /></RequireAuth>)} />
        <Route path="/manage" element={page(<RequireAuth role="MANAGER"><Manage /></RequireAuth>)} />

        <Route path="*" element={page(<Home />)} />
      </Routes>
    </Suspense>
  )
}
