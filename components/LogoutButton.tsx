'use client'

import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export function LogoutButton() {
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.refresh()
    router.push('/login')
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="rounded-lg border border-slate-600 bg-slate-800/80 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-700 hover:text-white"
    >
      Log out
    </button>
  )
}
