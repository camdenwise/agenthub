import { DashboardSidebar } from '@/components/DashboardSidebar'
import { NotificationBell } from '@/components/NotificationBell'
import { createClient } from '@/lib/supabase-server'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let businessName: string | null = null
  let businessLocation: string | null = null
  let unreadMessagesCount = 0

  if (user) {
    const { data: business } = await supabase
      .from('businesses')
      .select('name')
      .eq('user_id', user.id)
      .maybeSingle()
    businessName = business?.name ?? null
    // Add 'location' to select() when your businesses table has that column
    businessLocation = null
    // TODO: replace with real unread count when messages table exists
    // const { count } = await supabase.from('messages').select('*', { count: 'exact', head: true }).eq('read', false)
    // unreadMessagesCount = count ?? 0
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      <div className="h-screen shrink-0">
        <DashboardSidebar
          businessName={businessName}
          businessLocation={businessLocation}
          unreadMessagesCount={unreadMessagesCount}
        />
      </div>
      <div className="flex min-h-0 flex-1 flex-col min-w-0 overflow-hidden">
        <header className="flex h-14 shrink-0 items-center justify-end border-b border-slate-200 bg-white px-5">
          <NotificationBell />
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
