import { ArrowRight, Building2, Loader2, Mail, Plane } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import AuthShell from '@/components/AuthShell'
import PasswordInput from '@/components/PasswordInput'
import { ErrorBox } from '@/components/ui'
import { useAuth } from '@/lib/auth'

const DEMO_ACCOUNTS = [
  { label: 'Traveller demo', icon: Plane, email: 'demo@tourmate.lk', password: 'Demo@1234' },
  { label: 'Manager demo', icon: Building2, email: 'manager@tourmate.lk', password: 'Manager@123' }
]

export default function Login() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const from = (useLocation().state as { from?: string } | null)?.from ?? '/dashboard'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<unknown>(null)
  const [loading, setLoading] = useState(false)

  if (user) return <Navigate to={from} replace />

  const signIn = async (e?: string, p?: string) => {
    setLoading(true)
    setError(null)
    try {
      await login(e ?? email, p ?? password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  const submit = (ev: FormEvent) => {
    ev.preventDefault()
    signIn()
  }

  return (
    <AuthShell title="Welcome back 👋" subtitle="Log in to plan trips, chat with the AI assistant and save your journeys.">
      <form onSubmit={submit} className="space-y-5">
        <div>
          <label className="label" htmlFor="email">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input id="email" className="input pl-9" type="email" autoComplete="email" required placeholder="you@example.com"
              value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <PasswordInput id="password" autoComplete="current-password" required placeholder="••••••••"
            value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>

        <ErrorBox error={error} />

        <button className="btn-primary w-full py-3 text-base" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Log in <ArrowRight className="h-4 w-4" /></>}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-wider text-slate-400">
        <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" /> or try a demo account <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {DEMO_ACCOUNTS.map((d) => (
          <button key={d.email} type="button" className="btn-ghost py-3" disabled={loading}
            onClick={() => { setEmail(d.email); setPassword(d.password); signIn(d.email, d.password) }}>
            <d.icon className="h-4 w-4" /> {d.label}
          </button>
        ))}
      </div>

      <p className="mt-8 text-center text-sm text-slate-600 dark:text-slate-400">
        New to TourMate AI? <Link to="/register" className="font-semibold text-brand-700 hover:underline dark:text-brand-300">Create a free account</Link>
      </p>
    </AuthShell>
  )
}
