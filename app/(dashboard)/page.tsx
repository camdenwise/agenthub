import { createClient } from '@/lib/supabase-server'
import Link from 'next/link'

const STAT_CARDS = [
  {
    title: 'Messages today',
    value: '24',
    subtitle: '+8 from yesterday',
    href: '/messages',
    icon: 'messages',
    iconBg: 'bg-indigo-500/10',
    iconColor: 'text-indigo-700',
  },
  {
    title: 'AI handled',
    value: '89%',
    subtitle: '21 of 24 automated',
    href: '/messages',
    icon: 'ai',
    iconBg: 'bg-emerald-500/10',
    iconColor: 'text-emerald-700',
  },
  {
    title: 'New leads',
    value: '6',
    subtitle: '3 contacted, 1 converted',
    href: '/leads',
    icon: 'leads',
    iconBg: 'bg-amber-500/10',
    iconColor: 'text-amber-800',
  },
  {
    title: 'Reviews sent',
    value: '4',
    subtitle: '2 completed (avg 4.5★)',
    href: '/reviews',
    icon: 'reviews',
    iconBg: 'bg-pink-500/10',
    iconColor: 'text-pink-700',
  },
] as const

const MOCK_MESSAGES = [
  { initials: 'JK', name: 'James Kim', preview: 'Thanks for the quick response about membership...', time: '2m ago', color: 'bg-indigo-500/15 text-indigo-800' },
  { initials: 'SM', name: 'Sarah Martinez', preview: 'Can I get a trial pass for this weekend?', time: '14m ago', color: 'bg-slate-200/80 text-slate-700' },
  { initials: 'DC', name: 'David Chen', preview: 'What are your evening class times?', time: '1h ago', color: 'bg-slate-200/80 text-slate-700' },
]

const MOCK_LEADS = [
  { initials: 'AL', name: 'Alex Lee', interest: 'Personal training', status: 'New', statusClass: 'bg-slate-100 text-slate-700' },
  { initials: 'MR', name: 'Maria Rodriguez', interest: 'Group classes', status: 'Contacted', statusClass: 'bg-slate-100 text-slate-600' },
  { initials: 'TW', name: 'Taylor White', interest: 'Membership options', status: 'Follow Up', statusClass: 'bg-slate-100 text-slate-600' },
  { initials: 'JP', name: 'Jordan Park', interest: 'Corporate package', status: 'Converted', statusClass: 'bg-slate-100 text-slate-700' },
]

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

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { data: business } = await supabase
    .from('businesses')
    .select('name')
    .eq('user_id', user?.id ?? '')
    .maybeSingle()

  const businessName = business?.name ?? 'Your business'

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
          className="block min-w-0 flex-1 rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-shadow duration-200 hover:shadow-md cursor-pointer"
        >
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="font-semibold text-slate-900">Recent Messages</h2>
            <span className="text-sm font-medium text-slate-500">View all →</span>
          </div>
          <ul className="divide-y divide-slate-100">
            {MOCK_MESSAGES.map((msg) => (
              <li key={msg.name} className="flex items-center gap-4 px-5 py-4">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-medium ${msg.color}`}>
                  {msg.initials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-900">{msg.name}</p>
                  <p className="truncate text-sm text-slate-500">{msg.preview}</p>
                </div>
                <span className="shrink-0 text-xs text-slate-400">{msg.time}</span>
              </li>
            ))}
          </ul>
        </Link>

        <Link
          href="/leads"
          className="block min-w-0 flex-1 rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-shadow duration-200 hover:shadow-md cursor-pointer"
        >
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="font-semibold text-slate-900">Lead Pipeline</h2>
            <span className="text-sm font-medium text-slate-500">View all →</span>
          </div>
          <ul className="divide-y divide-slate-100">
            {MOCK_LEADS.map((lead) => (
              <li key={lead.name} className="flex items-center gap-4 px-5 py-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-medium text-slate-600">
                  {lead.initials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-900">{lead.name}</p>
                  <p className="text-sm text-slate-500">{lead.interest}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${lead.statusClass}`}>
                  {lead.status}
                </span>
              </li>
            ))}
          </ul>
        </Link>
      </div>
    </div>
  )
}
