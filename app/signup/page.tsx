'use client'

import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (signUpError) {
      setLoading(false)
      setError(signUpError.message)
      return
    }

    if (authData.user) {
      const { error: insertError } = await supabase.from('businesses').insert({
        user_id: authData.user.id,
        name: businessName.trim() || null,
      })

      if (insertError) {
        setError(
          'Account created but failed to save business: ' + insertError.message
        )
        setLoading(false)
        return
      }
    }

    setLoading(false)
    router.refresh()
    router.push('/')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0f1729] px-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-slate-700/50 bg-slate-800/40 p-8 shadow-xl backdrop-blur">
          <h1 className="mb-8 text-center text-2xl font-bold tracking-tight text-white">
            AgentHub
          </h1>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm font-medium text-slate-300"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full rounded-lg border border-slate-600 bg-slate-900/80 px-4 py-2.5 text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-medium text-slate-300"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                className="w-full rounded-lg border border-slate-600 bg-slate-900/80 px-4 py-2.5 text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label
                htmlFor="businessName"
                className="mb-1.5 block text-sm font-medium text-slate-300"
              >
                Business name
              </label>
              <input
                id="businessName"
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                autoComplete="organization"
                className="w-full rounded-lg border border-slate-600 bg-slate-900/80 px-4 py-2.5 text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                placeholder="Acme Inc."
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-500/20 px-4 py-2.5 text-sm text-red-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-sky-600 py-2.5 font-medium text-white transition-colors hover:bg-sky-500 disabled:opacity-50"
            >
              {loading ? 'Creating account…' : 'Sign up'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-400">
            Already have an account?{' '}
            <Link
              href="/login"
              className="font-medium text-sky-400 hover:text-sky-300"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
