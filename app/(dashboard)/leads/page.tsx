'use client'

import {
  getStatusBadgeClass,
  getStatusLabel,
} from '@/lib/leads-data'
import type { Lead } from '@/lib/leads-data'
import { createClient } from '@/lib/supabase'
import { useAdmin } from '@/lib/admin-context'
import { DEFAULT_BUSINESS_TIMEZONE, formatInBusinessTimezone } from '@/lib/timezone'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function LeadsPage() {
  const { activeBusiness, loading: adminLoading } = useAdmin()
  const businessTimezone = activeBusiness?.timezone || DEFAULT_BUSINESS_TIMEZONE
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    async function load() {
      if (!activeBusiness) return
      setLoading(true)

      const { data } = await supabase
        .from('leads')
        .select('*')
        .eq('business_id', activeBusiness.id)
        .order('created_at', { ascending: false })

      setLeads((data ?? []) as Lead[])
      setLoading(false)
    }

    if (!adminLoading) load()
  }, [activeBusiness?.id, adminLoading])

  if (adminLoading || loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-slate-500">Loading leads...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <div className="shrink-0">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Lead Pipeline</h1>
        <p className="mt-1 text-sm text-slate-500">Website form submissions with AI-powered instant follow-ups.</p>
      </div>

      {leads.length === 0 ? (
        <div className="mt-8 flex flex-col items-center justify-center rounded-2xl border border-slate-200/80 bg-white p-12 shadow-sm">
          <p className="text-slate-500">No leads yet.</p>
          <p className="mt-1 text-sm text-slate-400">Leads from your website contact form will appear here.</p>
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80">
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Name</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Interest</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Follow-up</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Submitted</th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leads.map((lead) => (
                  <tr key={lead.id} className="cursor-pointer transition-colors hover:bg-slate-50/50">
                    <td className="px-5 py-4">
                      <Link href={`/leads/${lead.id}`} className="block">
                        <span className="block font-medium text-slate-900">{lead.name}</span>
                        <p className="mt-0.5 text-sm text-slate-500">{lead.email}</p>
                      </Link>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-700">{lead.interest}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeClass(lead.status)}`}>
                        {getStatusLabel(lead.status)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {lead.follow_up_email ? (
                        <span className="inline-flex flex-col gap-0.5 text-sm font-medium text-emerald-700">
                          <span className="inline-flex items-center gap-1.5">
                            <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            Sent
                          </span>
                          {(lead.follow_up_email.sent_at || lead.follow_up_email.sentAt) && (
                            <span className="text-xs font-normal text-slate-500">
                              {formatInBusinessTimezone(
                                (lead.follow_up_email.sent_at || lead.follow_up_email.sentAt) as string,
                                businessTimezone,
                                { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }
                              )}
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-sm text-slate-500">Pending</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      {formatInBusinessTimezone(lead.created_at, businessTimezone, {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link href={`/leads/${lead.id}`}
                        className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-500">
                        View
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}