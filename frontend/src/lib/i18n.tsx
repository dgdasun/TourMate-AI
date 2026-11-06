import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export type Lang = 'en' | 'si' | 'ta'

export const LANGUAGES: { code: Lang; label: string; name: string }[] = [
  { code: 'en', label: 'EN', name: 'English' },
  { code: 'si', label: 'සිං', name: 'සිංහල' },
  { code: 'ta', label: 'தமி', name: 'தமிழ்' }
]

const STRINGS = {
  en: {
    home: 'Home', explore: 'Explore', planner: 'Trip Planner', assistant: 'AI Assistant', crowds: 'Live Crowds',
    insights: 'Insights', eco: 'Eco Travel', manage: 'Manage',
    greeting: 'Ayubowan!', heroTitle: 'Explore Sri Lanka with', heroText:
      'An AI-powered smart tourism platform. Plan better trips, avoid the crowds and travel sustainably, while destination managers predict demand and grow tourism responsibly.',
    planTrip: 'Plan my trip', askAi: 'Ask the AI assistant', askPlaceholder: 'Ask anything about travelling in Sri Lanka…', send: 'Send'
  },
  si: {
    home: 'මුල් පිටුව', explore: 'ගවේෂණය', planner: 'සංචාර සැලසුම', assistant: 'AI සහායක', crowds: 'සජීවී සෙනඟ',
    insights: 'විශ්ලේෂණ', eco: 'පරිසර හිතකාමී සංචාර', manage: 'කළමනාකරණය',
    greeting: 'ආයුබෝවන්!', heroTitle: 'ශ්‍රී ලංකාව ගවේෂණය කරන්න', heroText:
      'කෘත්‍රිම බුද්ධියෙන් බලගැන්වූ ස්මාර්ට් සංචාරක වේදිකාවක්. වඩා හොඳ සංචාර සැලසුම් කරන්න, සෙනඟ මඟහරින්න, පරිසරයට හිතකාමීව සංචාරය කරන්න.',
    planTrip: 'මගේ සංචාරය සැලසුම් කරන්න', askAi: 'AI සහායකගෙන් අහන්න', askPlaceholder: 'ශ්‍රී ලංකාවේ සංචාරය ගැන ඕනෑම දෙයක් අහන්න…', send: 'යවන්න'
  },
  ta: {
    home: 'முகப்பு', explore: 'ஆராயுங்கள்', planner: 'பயணத் திட்டம்', assistant: 'AI உதவியாளர்', crowds: 'நேரடி கூட்டம்',
    insights: 'பகுப்பாய்வு', eco: 'சூழல் நட்பு பயணம்', manage: 'நிர்வாகம்',
    greeting: 'வணக்கம்!', heroTitle: 'இலங்கையை ஆராயுங்கள்', heroText:
      'செயற்கை நுண்ணறிவால் இயங்கும் ஸ்மார்ட் சுற்றுலா தளம். சிறந்த பயணங்களைத் திட்டமிடுங்கள், கூட்டத்தைத் தவிர்க்கவும், சுற்றுச்சூழலுக்கு நட்பாகப் பயணம் செய்யுங்கள்.',
    planTrip: 'எனது பயணத்தைத் திட்டமிடு', askAi: 'AI உதவியாளரிடம் கேளுங்கள்', askPlaceholder: 'இலங்கைப் பயணம் பற்றி எதையும் கேளுங்கள்…', send: 'அனுப்பு'
  }
} satisfies Record<Lang, Record<string, string>>

export type StringKey = keyof typeof STRINGS.en

const I18nContext = createContext<{ lang: Lang; setLang: (l: Lang) => void; t: (k: StringKey) => string }>({
  lang: 'en', setLang: () => {}, t: (k) => STRINGS.en[k]
})

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => {
    try {
      const l = localStorage.getItem('tourmate-lang')
      return l === 'si' || l === 'ta' ? l : 'en'
    } catch {
      return 'en'
    }
  })

  useEffect(() => {
    document.documentElement.lang = lang
    try { localStorage.setItem('tourmate-lang', lang) } catch { /* not persisted - fine */ }
  }, [lang])

  const t = (k: StringKey) => STRINGS[lang][k]
  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>
}

export const useI18n = () => useContext(I18nContext)
