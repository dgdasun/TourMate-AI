import { ArrowRight, Check, Globe, Loader2, Mail, User as UserIcon, X } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import AuthShell from '@/components/AuthShell'
import PasswordInput from '@/components/PasswordInput'
import { ErrorBox } from '@/components/ui'
import { useAuth } from '@/lib/auth'
import { cn } from '@/lib/utils'

const COUNTRIES = ['Sri Lanka', 'India', 'United Kingdom', 'Germany', 'China', 'Russia', 'Australia', 'France',
  'United States', 'Netherlands', 'Japan', 'Canada', 'Italy', 'Maldives', 'Other']

const RULES = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'Contains a letter', test: (p: string) => /[A-Za-z]/.test(p) },
  { label: 'Contains a number', test: (p: string) => /\d/.test(p) }
]

function strength(p: string) {
  let score = RULES.filter((r) => r.test(p)).length
  if (p.length >= 12) score++
  if (/[^A-Za-z0-9]/.test(p) && /[a-z]/.test(p) && /[A-Z]/.test(p)) score++
  return Math.min(score, 5)
}

const STRENGTH = [
  { label: 'Too weak', color: 'bg-red-500' }, { label: 'Too weak', color: 'bg-red-500' }, { label: 'Weak', color: 'bg-orange-500' },
  { label: 'Fair', color: 'bg-amber-500' }, { label: 'Strong', color: 'bg-emerald-500' }, { label: 'Very strong', color: 'bg-emerald-600' }
]

export default function Register() {
  const { user, register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ fullName: '', email: '', country: '', password: '', confirm: '' })
  const [agreed, setAgreed] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const [loading, setLoading] = useState(false)

  if (user) return <Navigate to="/dashboard" replace />

  const s = strength(form.password)
  const rulesOk = RULES.every((r) => r.test(form.password))
  const matches = form.confirm.length > 0 && form.confirm === form.password
  const canSubmit = rulesOk && matches && agreed && !loading

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setLoading(true)
    setError(null)
    try {
      await register({ fullName: form.fullName, email: form.email, password: form.password, country: form.country || undefined })
      navigate('/dashboard', { replace: true, state: { welcome: true } })
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm({ ...form, [k]: e.target.value })

  return (
    <AuthShell title="Create your account ✨" subtitle="Join free and start planning your Sri Lankan adventure in minutes.">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label" htmlFor="fullName">Full name</label>
          <div className="relative">
            <UserIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input id="fullName" className="input pl-9" required maxLength={80} autoComplete="name" placeholder="Kasun Perera"
              value={form.fullName} onChange={set('fullName')} />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="email">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input id="email" className="input pl-9" type="email" required autoComplete="email" placeholder="you@example.com"
                value={form.email} onChange={set('email')} />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="country">Country</label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <select id="country" className="input pl-9" value={form.country} onChange={set('country')}>
                <option value="">Select…</option>
                {COUNTRIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div>
          <label className="label" htmlFor="password">Password</label>
          <PasswordInput id="password" required autoComplete="new-password" placeholder="Create a password"
            value={form.password} onChange={set('password')} />
          {form.password && (
            <div className="mt-2">
              <div className="flex gap-1">
                {[0, 1, 2, 3, 4].map((i) => (
                  <span key={i} className={cn('h-1.5 flex-1 rounded-full transition-colors', i < s ? STRENGTH[s].color : 'bg-slate-200 dark:bg-slate-800')} />
                ))}
              </div>
              <div className="mt-1 text-xs font-medium text-slate-500">{STRENGTH[s].label}</div>
            </div>
          )}
          <ul className="mt-2 grid gap-1 text-xs sm:grid-cols-3">
            {RULES.map((r) => {
              const ok = r.test(form.password)
              return (
                <li key={r.label} className={cn('flex items-center gap-1', ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400')}>
                  {ok ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />} {r.label}
                </li>
              )
            })}
          </ul>
        </div>

        <div>
          <label className="label" htmlFor="confirm">Confirm password</label>
          <PasswordInput id="confirm" required autoComplete="new-password" placeholder="Repeat your password"
            value={form.confirm} onChange={set('confirm')} />
          {form.confirm && !matches && <p className="mt-1 text-xs text-red-600">Passwords don't match</p>}
        </div>

        <label className="flex cursor-pointer items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
          <input type="checkbox" className="mt-0.5 h-4 w-4 accent-brand-700" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
          I agree to travel responsibly and to TourMate AI's terms of use.
        </label>

        <ErrorBox error={error} />

        <button className="btn-primary w-full py-3 text-base" disabled={!canSubmit}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Create account <ArrowRight className="h-4 w-4" /></>}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-slate-600 dark:text-slate-400">
        Already have an account? <Link to="/login" className="font-semibold text-brand-700 hover:underline dark:text-brand-300">Log in</Link>
      </p>
    </AuthShell>
  )
}
