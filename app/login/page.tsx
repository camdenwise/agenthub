'use client'

import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setLoading(false)

    if (signInError) {
      setError(signInError.message)
      return
    }

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
                autoComplete="current-password"
                className="w-full rounded-lg border border-slate-600 bg-slate-900/80 px-4 py-2.5 text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                placeholder="••••••••"
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
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-400">
            Don&apos;t have an account?{' '}
            <Link
              href="/signup"
              className="font-medium text-sky-400 hover:text-sky-300"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
