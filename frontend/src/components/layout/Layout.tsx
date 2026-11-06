import { useQuery } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import {
  BarChart3, Bot, Compass, Leaf, Map as MapIcon, Menu, Monitor, Moon, Palmtree, Settings2, Sun, Users, X, Home
} from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { api } from '@/lib/api'
import { LANGUAGES, useI18n, type StringKey } from '@/lib/i18n'
import { useTheme } from '@/lib/theme'
import { cn } from '@/lib/utils'

const LINKS: { to: string; key: StringKey; icon: typeof Home }[] = [
  { to: '/', key: 'home', icon: Home },
  { to: '/explore', key: 'explore', icon: Compass },
  { to: '/planner', key: 'planner', icon: MapIcon },
  { to: '/assistant', key: 'assistant', icon: Bot },
  { to: '/crowds', key: 'crowds', icon: Users },
  { to: '/insights', key: 'insights', icon: BarChart3 },
  { to: '/sustainability', key: 'eco', icon: Leaf },
  { to: '/manage', key: 'manage', icon: Settings2 }
]

export default function Layout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  const { t } = useI18n()

  useEffect(() => {
    setOpen(false)
    window.scrollTo({ top: 0 })
  }, [pathname])

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-gradient-to-r from-brand-900 via-brand-800 to-brand-700 text-white shadow-lg">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
          <NavLink to="/" className="flex shrink-0 items-center gap-2 text-lg font-extrabold">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gold-500 text-brand-900"><Palmtree className="h-5 w-5" /></span>
            TourMate <span className="text-gold-400">AI</span>
          </NavLink>

          <nav className="ml-4 hidden items-center gap-1 xl:flex">
            {LINKS.map(({ to, key }) => (
              <NavLink key={to} to={to} end={to === '/'}
                className={({ isActive }) => cn('rounded-full px-3 py-1.5 text-sm font-medium transition',
                  isActive ? 'bg-gold-500 text-brand-900' : 'text-blue-100 hover:bg-white/10')}>
                {t(key)}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <AiStatus />
            <LanguageSwitch />
            <ThemeSwitch />
            <button className="rounded-lg p-2 hover:bg-white/10 xl:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {open && (
            <motion.nav initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-white/10 xl:hidden">
              <div className="mx-auto grid max-w-7xl grid-cols-2 gap-1 px-4 py-3 sm:grid-cols-4">
                {LINKS.map(({ to, key, icon: Icon }) => (
                  <NavLink key={to} to={to} end={to === '/'}
                    className={({ isActive }) => cn('flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium',
                      isActive ? 'bg-gold-500 text-brand-900' : 'text-blue-100 hover:bg-white/10')}>
                    <Icon className="h-4 w-4" /> {t(key)}
                  </NavLink>
                ))}
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8">
        <motion.div key={pathname} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>
          {children}
        </motion.div>
      </main>

      <footer className="bg-brand-950 px-4 py-8 text-center text-sm text-blue-200">
        <div className="font-semibold text-white">TourMate AI · Tourism Start-Up Competition 2026</div>
        <div className="mt-1">Theme: <span className="font-semibold text-gold-400">"AI-Driven Innovation for the Future of Tourism"</span></div>
        <div className="mt-3 text-blue-300/80">Let's innovate today for a smarter, sustainable and AI-powered tourism future!</div>
      </footer>
    </div>
  )
}

function AiStatus() {
  const { data, isError } = useQuery({ queryKey: ['ai-status'], queryFn: api.aiStatus, staleTime: 60_000 })
  const on = data?.aiEnabled
  return (
    <span className="hidden items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs md:flex"
      title={on ? 'Claude AI is connected' : 'Running on the built-in offline AI engine'}>
      <span className={cn('h-2 w-2 rounded-full', isError ? 'bg-red-400' : on ? 'bg-emerald-400' : 'bg-gold-400')} />
      {isError ? 'Backend offline' : on ? 'Claude AI' : 'Offline AI'}
    </span>
  )
}

function LanguageSwitch() {
  const { lang, setLang } = useI18n()
  return (
    <div className="flex rounded-full bg-white/10 p-0.5 text-xs" role="group" aria-label="Language">
      {LANGUAGES.map((l) => (
        <button key={l.code} onClick={() => setLang(l.code)} title={l.name}
          className={cn('rounded-full px-2 py-1 font-semibold transition', lang === l.code ? 'bg-white text-brand-900' : 'text-blue-100 hover:text-white')}>
          {l.label}
        </button>
      ))}
    </div>
  )
}

function ThemeSwitch() {
  const { theme, setTheme } = useTheme()
  const next = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light'
  const Icon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor
  return (
    <button onClick={() => setTheme(next)} className="rounded-lg p-2 hover:bg-white/10" title={`Theme: ${theme} (click for ${next})`} aria-label="Toggle theme">
      <Icon className="h-4 w-4" />
    </button>
  )
}
