import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  ArrowRight, BarChart3, Bot, Building2, CheckCircle2, Leaf, Map as MapIcon, MapPin, MessageSquareHeart, MousePointerClick,
  Sparkles, Star, UserPlus, Users
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import SriLankaMap from '@/components/SriLankaMap'
import { ErrorBox, Stat } from '@/components/ui'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { useI18n } from '@/lib/i18n'
import { CATEGORY_COLOR, CATEGORY_ICON, pretty } from '@/lib/utils'

// One feature per "Areas / Themes" item in the SLTDA competition brief
const FEATURES = [
  { to: '/planner', icon: MapIcon, area: 'Smart travel planning', title: 'AI Trip Planner', text: 'Personalised, monsoon-aware itineraries with route maps, cost and carbon estimates.' },
  { to: '/assistant', icon: Bot, area: 'AI visitor assistance', title: '24/7 AI Assistant', text: 'Answers visitors in English, Sinhala or Tamil on places, visas, transport, culture and safety.' },
  { to: '/manage', icon: Building2, area: 'Smart destination management', title: 'Destination Manager', text: 'Register destinations with capacity limits, climate zones and eco ratings.' },
  { to: '/insights', icon: BarChart3, area: 'Predictive analytics', title: 'Demand Forecasting', text: '12-month visitor forecasts per destination from seasonal time-series models.' },
  { to: '/sustainability', icon: Leaf, area: 'Sustainable tourism', title: 'Eco Travel', text: 'Compare transport carbon footprints and discover the greenest places to visit.' },
  { to: '/insights', icon: MessageSquareHeart, area: 'Visitor experience', title: 'Review Sentiment AI', text: 'Reads every review for sentiment and issues like cleanliness, crowds and price.' },
  { to: '/crowds', icon: Users, area: 'Smart mobility & visitor flow', title: 'Live Crowd Monitor', text: 'Live crowd map, the best hour to visit, and quieter alternatives nearby.' }
]

const STEPS = [
  { icon: UserPlus, title: 'Create a free account', text: 'Sign up in seconds. No credit card, no spam.' },
  { icon: MousePointerClick, title: 'Tell us how you travel', text: 'Pick your dates, interests, budget and transport.' },
  { icon: Sparkles, title: 'Let the AI do the rest', text: 'Get a route, costs, crowd tips and a greener way to go.' }
]

export default function Home() {
  const { t } = useI18n()
  const { user } = useAuth()
  const navigate = useNavigate()
  const overview = useQuery({ queryKey: ['overview'], queryFn: api.overview })
  const destinations = useQuery({ queryKey: ['destinations', {}], queryFn: () => api.destinations() })

  return (
    <div className="space-y-20">
      {/* hero */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-950 via-brand-800 to-brand-600 px-6 py-14 text-white sm:px-12 sm:py-20">
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-gold-500/20 blur-3xl" />
        <div className="absolute -bottom-32 left-1/3 h-80 w-80 rounded-full bg-sky-400/20 blur-3xl" />
        <div className="relative grid items-center gap-10 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-medium backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-gold-400" />
              Tourism Start-Up Competition 2026 · <span className="text-gold-400">AI-Driven Innovation for the Future of Tourism</span>
            </motion.div>
            <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="mt-6 text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">
              {t('greeting')}<br />{t('heroTitle')} <span className="bg-gradient-to-r from-gold-300 to-gold-500 bg-clip-text text-transparent">TourMate AI</span>
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="mt-5 max-w-xl text-lg text-blue-100">
              {t('heroText')}
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-8 flex flex-wrap gap-3">
              {user ? (
                <Link to="/dashboard" className="btn-gold px-6 py-3 text-base">Go to my dashboard <ArrowRight className="h-4 w-4" /></Link>
              ) : (
                <Link to="/register" className="btn-gold px-6 py-3 text-base">{t('getStarted')} <ArrowRight className="h-4 w-4" /></Link>
              )}
              <Link to="/explore" className="btn border border-white/30 bg-white/10 px-6 py-3 text-base text-white backdrop-blur hover:bg-white/20">
                <MapPin className="h-4 w-4" /> {t('explore')}
              </Link>
            </motion.div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-blue-100">
              {['Free to use', 'English · සිංහල · தமிழ்', 'Works on any device'].map((x) => (
                <span key={x} className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-gold-400" /> {x}</span>
              ))}
            </div>
          </div>
          <div className="relative hidden lg:block">
            <div className="animate-float rounded-3xl border border-white/20 bg-white/10 p-6 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gold-500 text-brand-900"><Bot className="h-6 w-6" /></div>
                <div><div className="font-semibold">TourMate AI</div><div className="text-xs text-blue-200">Your Sri Lanka travel buddy</div></div>
              </div>
              <div className="mt-5 space-y-3 text-sm">
                <div className="ml-auto w-fit rounded-2xl rounded-br-sm bg-white px-4 py-2 text-brand-900">Best beach to visit in July? 🏖️</div>
                <div className="w-fit max-w-[90%] rounded-2xl rounded-bl-sm bg-white/15 px-4 py-2">
                  July is east-coast season ☀️ Try <b>Arugam Bay</b> for surfing or <b>Pasikudah</b> for calm water.
                </div>
              </div>
            </div>
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }}
              className="absolute -bottom-8 -left-8 flex items-center gap-3 rounded-2xl bg-white p-3 pr-5 text-slate-900 shadow-2xl">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-100 text-emerald-700"><Users className="h-5 w-5" /></span>
              <div className="text-xs"><div className="font-bold">Sigiriya is busy</div><div className="text-slate-500">Try Anuradhapura instead →</div></div>
            </motion.div>
          </div>
        </div>
      </section>

      <ErrorBox error={overview.error} />

      {overview.data && (
        <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Stat value={overview.data.totalDestinations} label="Destinations monitored" icon={<MapPin />} />
          <Stat value={overview.data.tripsPlanned} label="AI trips planned" icon={<MapIcon />} delay={0.05} />
          <Stat value={`${overview.data.avgRating} ★`} label="Average visitor rating" icon={<Star />} delay={0.1} />
          <Stat value={overview.data.totalReviews} label="Reviews analysed by AI" icon={<MessageSquareHeart />} delay={0.15} />
        </section>
      )}

      {/* features */}
      <section>
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">Features</span>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">Solutions for every competition theme</h2>
          <p className="mt-3 text-slate-600 dark:text-slate-400">Seven AI-powered modules, one for each area in the SLTDA brief.</p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f, i) => (
            <motion.div key={f.title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
              <Link to={f.to} className="card group flex h-full flex-col transition hover:-translate-y-1 hover:border-brand-300 dark:hover:border-brand-600">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-700 transition group-hover:bg-brand-800 group-hover:text-white dark:bg-brand-500/10 dark:text-brand-300">
                  <f.icon className="h-5 w-5" />
                </div>
                <div className="mt-4 text-[11px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">{f.area}</div>
                <h3 className="mt-1 font-bold">{f.title}</h3>
                <p className="mt-1 flex-1 text-sm text-slate-600 dark:text-slate-400">{f.text}</p>
                <span className="mt-3 flex items-center gap-1 text-sm font-semibold text-brand-700 dark:text-brand-300">
                  Open <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* how it works */}
      <section>
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">How it works</span>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">Your perfect trip in three steps</h2>
        </div>
        <div className="relative mt-10 grid gap-6 md:grid-cols-3">
          <div className="absolute left-[16%] right-[16%] top-8 hidden h-0.5 bg-gradient-to-r from-brand-200 via-gold-400 to-brand-200 md:block dark:from-brand-800 dark:to-brand-800" />
          {STEPS.map((s, i) => (
            <motion.div key={s.title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className="relative text-center">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-brand-800 text-white shadow-soft dark:bg-brand-600">
                <s.icon className="h-7 w-7" />
              </div>
              <div className="mt-2 text-xs font-bold text-gold-600">STEP {i + 1}</div>
              <h3 className="mt-1 text-lg font-bold">{s.title}</h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{s.text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* map */}
      {destinations.data && (
        <section className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
          <div className="flex flex-col justify-center">
            <span className="text-sm font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">Destinations</span>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight">One island, every experience</h2>
            <p className="mt-3 text-slate-600 dark:text-slate-400">
              From UNESCO heritage cities to leopard safaris and world-class surf. Click a marker to explore it.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {Object.entries(CATEGORY_ICON).map(([c, icon]) => (
                <span key={c} className="chip">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: CATEGORY_COLOR[c as keyof typeof CATEGORY_COLOR] }} />
                  {icon} {pretty(c)}
                </span>
              ))}
            </div>
          </div>
          <SriLankaMap height={460} points={destinations.data.map((d) => ({
            id: d.id, lat: d.latitude, lng: d.longitude, color: CATEGORY_COLOR[d.category],
            label: `${CATEGORY_ICON[d.category]} ${d.name}`, onClick: () => navigate(`/explore?d=${d.id}`)
          }))} />
        </section>
      )}

      {/* call to action */}
      {!user && (
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-gold-500 to-gold-400 px-6 py-12 text-center text-brand-950 sm:px-12">
          <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/30 blur-2xl" />
          <h2 className="relative text-3xl font-extrabold tracking-tight sm:text-4xl">Ready for your Sri Lankan adventure?</h2>
          <p className="relative mx-auto mt-3 max-w-xl text-brand-900/80">
            Join TourMate AI for free and get a personalised, crowd-smart and eco-friendly itinerary in seconds.
          </p>
          <div className="relative mt-6 flex flex-wrap justify-center gap-3">
            <Link to="/register" className="btn bg-brand-900 px-6 py-3 text-base text-white hover:bg-brand-800">{t('signup')} <ArrowRight className="h-4 w-4" /></Link>
            <Link to="/login" className="btn border border-brand-900/20 bg-white/40 px-6 py-3 text-base text-brand-900 hover:bg-white/60">{t('login')}</Link>
          </div>
        </section>
      )}
    </div>
  )
}
