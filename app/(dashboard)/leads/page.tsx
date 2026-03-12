'use client'

import {
  getStatusBadgeClass,
  getStatusLabel,
  MOCK_LEADS,
} from '@/lib/leads-data'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function LeadsPage() {
  const router = useRouter()

  return (
    <div className="flex flex-col">
      <div className="shrink-0">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Lead Pipeline
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Website form submissions with AI-powered instant follow-ups.
        </p>
      </div>

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
              {MOCK_LEADS.map((lead) => (
                <tr
                  key={lead.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => router.push(`/leads/${lead.id}`)}
                  onKeyDown={(e) =>
                    e.key === 'Enter' && router.push(`/leads/${lead.id}`)
                  }
                  className="cursor-pointer transition-colors hover:bg-slate-50/50"
                >
                  <td className="px-5 py-4">
                    <span className="block font-medium text-slate-900">
                      {lead.form.name}
                    </span>
                    <p className="mt-0.5 text-sm text-slate-500">
                      {lead.form.email}
                    </p>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-700">
                    {lead.form.interest}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeClass(lead.status)}`}
                    >
                      {getStatusLabel(lead.status)}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    {lead.followUp === 'sent' ? (
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
                    {lead.form.submitted}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link
                      href={`/leads/${lead.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-500"
                    >
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
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
