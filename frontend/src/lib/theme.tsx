import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

type Theme = 'light' | 'dark' | 'system'

const ThemeContext = createContext<{ theme: Theme; setTheme: (t: Theme) => void }>({ theme: 'system', setTheme: () => {} })

const STORAGE_KEY = 'tourmate-theme'

function readStored(): Theme {
  try {
    const t = localStorage.getItem(STORAGE_KEY)
    return t === 'light' || t === 'dark' ? t : 'system'
  } catch {
    return 'system'
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(readStored)

  useEffect(() => {
    const media = matchMedia('(prefers-color-scheme: dark)')
    const apply = () => {
      const dark = theme === 'dark' || (theme === 'system' && media.matches)
      document.documentElement.classList.toggle('dark', dark)
      document.documentElement.dataset.theme = dark ? 'dark' : 'light'
    }
    apply()
    try {
      if (theme === 'system') localStorage.removeItem(STORAGE_KEY)
      else localStorage.setItem(STORAGE_KEY, theme)
    } catch { /* storage unavailable - theme still applies for this visit */ }
    media.addEventListener('change', apply)
    return () => media.removeEventListener('change', apply)
  }, [theme])

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>
}

export const useTheme = () => useContext(ThemeContext)
