'use client'

import {
  getStatusBadgeClass,
  getStatusLabel,
} from '@/lib/leads-data'
import type { Lead } from '@/lib/leads-data'
import { useRouter } from 'next/navigation'

export function LeadsTable({ leads }: { leads: Lead[] }) {
  const router = useRouter()

  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80">
              <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Name
              </th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Interest
              </th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Status
              </th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Follow-up
              </th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Submitted
              </th>
              <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                View
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {leads.map((lead) => (
              <tr
                key={lead.id}
                role="link"
                tabIndex={0}
                aria-label={`Open lead: ${lead.name}`}
                className="cursor-pointer transition-colors hover:bg-slate-50/50 focus-visible:bg-slate-50/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500/40"
                onClick={() => router.push(`/leads/${lead.id}`)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    router.push(`/leads/${lead.id}`)
                  }
                }}
              >
                <td className="px-5 py-4">
                  <span className="block font-medium text-slate-900">{lead.name}</span>
                  <p className="mt-0.5 text-sm text-slate-500">{lead.email}</p>
                </td>
                <td className="px-5 py-4 text-sm text-slate-700">{lead.interest}</td>
                <td className="px-5 py-4">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeClass(lead.status)}`}
                  >
                    {getStatusLabel(lead.status)}
                  </span>
                </td>
                <td className="px-5 py-4">
                  {lead.follow_up_email ? (
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700">
                      <svg
                        className="h-4 w-4 text-emerald-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Sent
                    </span>
                  ) : (
                    <span className="text-sm text-slate-500">Pending</span>
                  )}
                </td>
                <td className="px-5 py-4 text-sm text-slate-600">
                  {new Date(lead.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </td>
                <td className="px-5 py-4 text-right">
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600">
                    View
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
