import { createClient } from '@/lib/supabase-server'
import Link from 'next/link'
import { redirect } from 'next/navigation'

function StatCardIcon({ type, className }: { type: string; className: string }) {
  const base = 'shrink-0 ' + className
  if (type === 'messages') {
    return (
      <svg className={base} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
      </svg>
    )
  }
  if (type === 'ai') {
    return (
      <svg className={base} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    )
  }
  if (type === 'leads') {
    return (
      <svg className={base} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
      </svg>
    )
  }
  if (type === 'reviews') {
    return (
      <svg className={base} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
      </svg>
    )
  }
  return null
}

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

const STATUS_CLASSES: Record<string, string> = {
  new: 'bg-blue-100 text-blue-800',
  contacted: 'bg-amber-100 text-amber-800',
  follow_up: 'bg-red-100 text-red-800',
  converted: 'bg-emerald-100 text-emerald-800',
}

const STATUS_LABELS: Record<string, string> = {
  new: 'New',
  contacted: 'Contacted',
  follow_up: 'Follow Up',
  converted: 'Converted',
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: business } = await supabase
    .from('businesses')
    .select('id, name')
    .eq('user_id', user.id)
    .maybeSingle()

  const businessName = business?.name ?? 'Your business'
  const businessId = business?.id

  // Fetch real counts
  let totalConvos = 0
  let needsHumanCount = 0
  let totalLeads = 0
  let contactedLeads = 0
  let convertedLeads = 0
  let recentConversations: any[] = []
  let recentLeads: any[] = []

  if (businessId) {
    // Conversations
    const { data: convos } = await supabase
      .from('conversations')
      .select('id, customer_name, channel, status, messages, updated_at')
      .eq('business_id', businessId)
      .order('updated_at', { ascending: false })
      .limit(50)

    if (convos) {
      totalConvos = convos.length
      needsHumanCount = convos.filter((c: any) => c.status === 'needs_human').length
      recentConversations = convos.slice(0, 3)
    }

    // Leads
    const { data: leads } = await supabase
      .from('leads')
      .select('id, name, email, interest, status, created_at')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (leads) {
      totalLeads = leads.length
      contactedLeads = leads.filter((l: any) => l.status === 'contacted').length
      convertedLeads = leads.filter((l: any) => l.status === 'converted').length
      recentLeads = leads.slice(0, 4)
    }
  }

  const aiHandledPercent = totalConvos > 0 ? Math.round(((totalConvos - needsHumanCount) / totalConvos) * 100) : 0
  const aiHandledCount = totalConvos - needsHumanCount

  const STAT_CARDS = [
    {
      title: 'Messages',
      value: String(totalConvos),
      subtitle: needsHumanCount > 0 ? `${needsHumanCount} need human response` : 'All handled by AI',
      href: '/messages',
      icon: 'messages',
      iconBg: 'bg-indigo-500/10',
      iconColor: 'text-indigo-700',
    },
    {
      title: 'AI handled',
      value: `${aiHandledPercent}%`,
      subtitle: `${aiHandledCount} of ${totalConvos} automated`,
      href: '/messages',
      icon: 'ai',
      iconBg: 'bg-emerald-500/10',
      iconColor: 'text-emerald-700',
    },
    {
      title: 'New leads',
      value: String(totalLeads),
      subtitle: `${contactedLeads} contacted, ${convertedLeads} converted`,
      href: '/leads',
      icon: 'leads',
      iconBg: 'bg-amber-500/10',
      iconColor: 'text-amber-800',
    },
    {
      title: 'Reviews sent',
      value: '0',
      subtitle: 'Review system coming soon',
      href: '/reviews',
      icon: 'reviews',
      iconBg: 'bg-pink-500/10',
      iconColor: 'text-pink-700',
    },
  ]

  return (
    <div className="flex flex-col">
      <div className="shrink-0">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">
          {businessName} – Today&apos;s overview
        </p>
      </div>

      {/* Stat cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {STAT_CARDS.map((card) => (
          <Link
            key={card.title}
            href={card.href}
            className="group flex items-start gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-[2px] hover:shadow focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2"
          >
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${card.iconBg} ${card.iconColor}`}>
              <StatCardIcon type={card.icon} className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-500">{card.title}</p>
              <p className="mt-0.5 text-2xl font-bold tabular-nums text-slate-900">{card.value}</p>
              <p className="mt-1 text-xs text-slate-500">{card.subtitle}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent Messages + Lead Pipeline */}
      <div className="mt-6 flex flex-col gap-6 lg:flex-row">
        <Link
          href="/messages"
          className="block min-w-0 flex-1 rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all duration-200 hover:-translate-y-[2px] hover:shadow-md cursor-pointer"
        >
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="font-semibold text-slate-900">Recent Messages</h2>
            <span className="text-sm font-medium text-slate-500">View all →</span>
          </div>
          {recentConversations.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-slate-400">No messages yet</div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {recentConversations.map((conv: any) => {
                const msgs = conv.messages ?? []
                const lastMsg = msgs.length > 0 ? msgs[msgs.length - 1].content : 'No messages'
                return (
                  <li key={conv.id} className="flex items-center gap-4 px-5 py-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-500/15 text-sm font-medium text-indigo-800">
                      {getInitials(conv.customer_name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-slate-900">{conv.customer_name}</p>
                      <p className="truncate text-sm text-slate-500">{lastMsg}</p>
                    </div>
                    <span className="shrink-0 text-xs text-slate-400">{timeAgo(conv.updated_at)}</span>
                  </li>
                )
              })}
            </ul>
          )}
        </Link>

        <Link
          href="/leads"
          className="block min-w-0 flex-1 rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all duration-200 hover:-translate-y-[2px] hover:shadow-md cursor-pointer"
        >
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="font-semibold text-slate-900">Lead Pipeline</h2>
            <span className="text-sm font-medium text-slate-500">View all →</span>
          </div>
          {recentLeads.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-slate-400">No leads yet</div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {recentLeads.map((lead: any) => (
                <li key={lead.id} className="flex items-center gap-4 px-5 py-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-medium text-slate-600">
                    {getInitials(lead.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-900">{lead.name}</p>
                    <p className="text-sm text-slate-500">{lead.interest}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CLASSES[lead.status] ?? 'bg-slate-100 text-slate-700'}`}>
                    {STATUS_LABELS[lead.status] ?? lead.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Link>
      </div>
    </div>
  )
}