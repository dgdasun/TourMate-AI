import { motion } from 'framer-motion'
import { BarChart3, Bot, Leaf, Map as MapIcon, Palmtree, Star, Users } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

const HIGHLIGHTS = [
  { icon: MapIcon, text: 'AI itineraries that follow the monsoons' },
  { icon: Bot, text: '24/7 assistant in English, Sinhala & Tamil' },
  { icon: Users, text: 'Live crowd levels and quieter alternatives' },
  { icon: Leaf, text: 'Carbon footprint for every trip' }
]

/** Split-screen layout for the login and registration pages: brand story on the left, form on the right. */
export default function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-brand-950 via-brand-800 to-brand-600 p-12 text-white lg:flex lg:flex-col">
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-gold-500/20 blur-3xl" />
        <div className="absolute -bottom-40 -left-20 h-96 w-96 rounded-full bg-sky-400/20 blur-3xl" />

        <Link to="/" className="relative flex items-center gap-2 text-xl font-extrabold">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-gold-500 text-brand-900"><Palmtree className="h-5 w-5" /></span>
          TourMate <span className="text-gold-400">AI</span>
        </Link>

        <div className="relative my-auto max-w-md">
          <motion.h2 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-4xl font-extrabold leading-tight">
            Your smart companion for <span className="text-gold-400">Sri Lanka</span>
          </motion.h2>
          <p className="mt-4 text-blue-100">Plan better trips, skip the crowds and travel sustainably, powered by AI.</p>
          <ul className="mt-8 space-y-4">
            {HIGHLIGHTS.map(({ icon: Icon, text }, i) => (
              <motion.li key={text} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.08 }}
                className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-white/10 backdrop-blur"><Icon className="h-4 w-4 text-gold-400" /></span>
                {text}
              </motion.li>
            ))}
          </ul>

          <motion.figure initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            className="mt-10 rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-md">
            <div className="flex gap-0.5 text-gold-400">{[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}</div>
            <blockquote className="mt-2 text-sm text-blue-50">
              "It moved Sigiriya to 7am and sent us to Anuradhapura when it was packed. Best trip we've had."
            </blockquote>
            <figcaption className="mt-2 text-xs text-blue-200">Demo review · Emma, United Kingdom</figcaption>
          </motion.figure>
        </div>

        <div className="relative flex items-center gap-2 text-xs text-blue-200">
          <BarChart3 className="h-4 w-4" /> Tourism Start-Up Competition 2026 · AI-Driven Innovation for the Future of Tourism
        </div>
      </aside>

      <main className="flex items-center justify-center bg-slate-50 px-4 py-12 dark:bg-slate-950 sm:px-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <Link to="/" className="mb-8 flex items-center gap-2 text-lg font-extrabold lg:hidden">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gold-500 text-brand-900"><Palmtree className="h-5 w-5" /></span>
            TourMate <span className="text-brand-700 dark:text-gold-400">AI</span>
          </Link>
          <h1 className="text-3xl font-extrabold tracking-tight">{title}</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </motion.div>
      </main>
    </div>
  )
}
