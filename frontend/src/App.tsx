import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import Layout from './components/layout/Layout'
import { Skeleton } from './components/ui'

// each page is its own chunk, so the first load stays small
const Home = lazy(() => import('./pages/Home'))
const Explore = lazy(() => import('./pages/Explore'))
const Planner = lazy(() => import('./pages/Planner'))
const Assistant = lazy(() => import('./pages/Assistant'))
const Crowds = lazy(() => import('./pages/Crowds'))
const Insights = lazy(() => import('./pages/Insights'))
const Sustainability = lazy(() => import('./pages/Sustainability'))
const Manage = lazy(() => import('./pages/Manage'))

export default function App() {
  return (
    <Layout>
      <Suspense fallback={<div className="space-y-4"><Skeleton className="h-12 w-1/3" /><Skeleton className="h-64" /></div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/planner" element={<Planner />} />
          <Route path="/assistant" element={<Assistant />} />
          <Route path="/crowds" element={<Crowds />} />
          <Route path="/insights" element={<Insights />} />
          <Route path="/sustainability" element={<Sustainability />} />
          <Route path="/manage" element={<Manage />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </Suspense>
    </Layout>
  )
}
