import { useMutation } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { Bot, Send, User } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { PageHeader } from '@/components/ui'
import { api } from '@/lib/api'
import { LANGUAGES, useI18n } from '@/lib/i18n'
import type { ChatTurn } from '@/lib/types'
import { cn } from '@/lib/utils'

interface Message extends ChatTurn {
  aiPowered?: boolean | null
}

const WELCOME: Message = {
  role: 'assistant',
  content: "Ayubowan! 🙏 I'm TourMate AI, your Sri Lanka travel assistant. Ask me about destinations, the best time to visit, transport, visas, food, culture or safety.",
  aiPowered: null
}

export default function Assistant() {
  const { lang, t } = useI18n()
  const [messages, setMessages] = useState<Message[]>([WELCOME])
  const [suggestions, setSuggestions] = useState([
    'When is the best time to visit the beaches?', 'Tell me about Sigiriya', 'How do I get around?', 'Emergency numbers in Sri Lanka'
  ])
  const [input, setInput] = useState('')
  const logRef = useRef<HTMLDivElement>(null)

  const chat = useMutation({
    mutationFn: api.chat,
    onSuccess: (res) => {
      setMessages((m) => [...m, { role: 'assistant', content: res.reply, aiPowered: res.aiPowered }])
      if (res.suggestions.length) setSuggestions(res.suggestions)
    },
    onError: (err) => setMessages((m) => [...m, { role: 'assistant', content: `Sorry, something went wrong: ${err.message}`, aiPowered: null }])
  })

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, chat.isPending])

  const send = (text?: string) => {
    const message = (text ?? input).trim()
    if (!message || chat.isPending) return
    // the welcome message is UI-only; the API expects history to start with the user
    const history = messages.filter((m) => m !== WELCOME).map(({ role, content }) => ({ role, content }))
    setMessages((m) => [...m, { role: 'user', content: message }])
    setInput('')
    chat.mutate({ message, history, language: LANGUAGES.find((l) => l.code === lang)!.name })
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    send()
  }

  return (
    <div>
      <PageHeader icon={<Bot className="h-5 w-5" />} title="AI Visitor Assistant"
        subtitle="Instant, 24/7 answers for travellers. With Claude enabled it replies in English, Sinhala or Tamil (switch language in the top bar)." />

      <div className="card flex h-[70vh] min-h-[460px] flex-col overflow-hidden p-0">
        <div ref={logRef} className="flex-1 space-y-4 overflow-y-auto p-5">
          <AnimatePresence initial={false}>
            {messages.map((m, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className={cn('flex gap-3', m.role === 'user' && 'flex-row-reverse')}>
                <div className={cn('grid h-8 w-8 shrink-0 place-items-center rounded-full',
                  m.role === 'user' ? 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200' : 'bg-brand-800 text-white dark:bg-brand-600')}>
                  {m.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </div>
                <div className={cn('max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed sm:max-w-[75%]',
                  m.role === 'user' ? 'rounded-tr-sm bg-brand-800 text-white dark:bg-brand-600' : 'rounded-tl-sm bg-slate-100 dark:bg-slate-800')}>
                  {m.content}
                  {m.role === 'assistant' && m.aiPowered != null && (
                    <div className="mt-1.5 text-[11px] opacity-60">{m.aiPowered ? '🤖 Claude AI' : '⚙️ Offline knowledge base'}</div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {chat.isPending && (
            <div className="flex gap-3">
              <div className="grid h-8 w-8 place-items-center rounded-full bg-brand-800 text-white dark:bg-brand-600"><Bot className="h-4 w-4" /></div>
              <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-slate-100 px-4 py-3 dark:bg-slate-800">
                {[0, 1, 2].map((i) => (
                  <motion.span key={i} className="h-2 w-2 rounded-full bg-slate-400"
                    animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }} />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2 px-4 pb-3">
          {suggestions.map((s) => (
            <button key={s} onClick={() => send(s)}
              className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 transition hover:border-brand-400 hover:text-brand-700 dark:border-slate-700 dark:text-slate-300 dark:hover:text-brand-300">
              {s}
            </button>
          ))}
        </div>
        <form onSubmit={submit} className="flex gap-2 border-t border-slate-200 p-3 dark:border-slate-800">
          <input className="input" placeholder={t('askPlaceholder')} value={input} onChange={(e) => setInput(e.target.value)} />
          <button className="btn-primary" disabled={chat.isPending || !input.trim()}><Send className="h-4 w-4" /><span className="hidden sm:inline">{t('send')}</span></button>
        </form>
      </div>
    </div>
  )
}
