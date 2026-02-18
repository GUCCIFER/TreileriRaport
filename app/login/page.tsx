'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type Language = 'et' | 'ru'

const translations = {
  et: {
    title: 'Linford Transport',
    subtitle: 'Haagise Kontrolli Süsteem',
    email: 'E-post',
    emailPlaceholder: 'teie@email.com',
    password: 'Parool',
    passwordPlaceholder: '••••••••',
    stayLoggedIn: 'Jääte sisselogituks sellesse seadmesse',
    errorMessage: 'Vale e-post või parool. Palun proovige uuesti.',
    signingIn: 'Sisselogimine...',
    signIn: 'Logi Sisse',
  },
  ru: {
    title: 'Linford Transport',
    subtitle: 'Система Инспекции Прицепов',
    email: 'Электронная почта',
    emailPlaceholder: 'ваш@email.com',
    password: 'Пароль',
    passwordPlaceholder: '••••••••',
    stayLoggedIn: 'Вы останетесь в системе на этом устройстве',
    errorMessage: 'Неверный email или пароль. Попробуйте еще раз.',
    signingIn: 'Вход...',
    signIn: 'Войти',
  },
}

export default function LoginPage() {
  const [lang, setLang] = useState<Language>('et')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const t = translations[lang]

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(t.errorMessage)
      setLoading(false)
    } else {
      router.push('/')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-900 to-sky-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md relative">
        {/* Language Switcher */}
        <div className="absolute top-6 right-6 flex gap-2">
          <button
            onClick={() => setLang('et')}
            className={`px-3 py-1.5 rounded font-medium ${
              lang === 'et'
                ? 'bg-sky-700 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            ET
          </button>
          <button
            onClick={() => setLang('ru')}
            className={`px-3 py-1.5 rounded font-medium ${
              lang === 'ru'
                ? 'bg-sky-700 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            RU
          </button>
        </div>

        <div className="text-center mb-8">
          <span className="text-6xl">🚛</span>
          <h1 className="text-3xl font-bold text-sky-900 mt-4">{t.title}</h1>
          <p className="text-gray-500 text-lg mt-2">{t.subtitle}</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label
              htmlFor="email"
              className="block text-xl font-semibold text-gray-700 mb-2"
            >
              {t.email}
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full px-5 py-4 text-xl border-2 border-gray-300 rounded-xl focus:border-sky-500 focus:outline-none"
              placeholder={t.emailPlaceholder}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-xl font-semibold text-gray-700 mb-2"
            >
              {t.password}
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full px-5 py-4 text-xl border-2 border-gray-300 rounded-xl focus:border-sky-500 focus:outline-none"
              placeholder={t.passwordPlaceholder}
            />
          </div>

          <div className="bg-sky-50 border border-sky-200 rounded-lg p-4">
            <p className="text-sky-900 font-medium text-lg flex items-center gap-2">
              <span>✓</span>
              <span>{t.stayLoggedIn}</span>
            </p>
          </div>

          {error && (
            <p className="text-red-600 text-lg font-medium text-center bg-red-50 rounded-lg p-3">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-5 text-2xl font-bold bg-sky-700 hover:bg-sky-800 active:bg-sky-900 text-white rounded-xl disabled:opacity-50 transition-colors"
          >
            {loading ? t.signingIn : t.signIn}
          </button>
        </form>
      </div>
    </div>
  )
}
