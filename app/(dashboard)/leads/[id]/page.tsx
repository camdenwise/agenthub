import {
  DEFAULT_FORM_FIELD_ORDER,
  getStatusBadgeClass,
  getStatusLabel,
  MOCK_LEADS,
} from '@/lib/leads-data'
import Link from 'next/link'
import { notFound } from 'next/navigation'

const FORM_LABELS: Record<string, string> = {
  name: 'Name',
  email: 'Email',
  phone: 'Phone',
  interest: 'Interest',
  referral: 'Referral',
  submitted: 'Submitted',
  message: 'Message',
}

type PageProps = { params: Promise<{ id: string }> }

export default async function LeadDetailPage({ params }: PageProps) {
  const { id } = await params
  const lead = MOCK_LEADS.find((l) => l.id === id)
  if (!lead) notFound()

  const displayFields = DEFAULT_FORM_FIELD_ORDER.filter(
    (key) => lead.form[key] != null && key in lead.form
  )

  return (
    <div className="flex flex-col">
      <Link
        href="/leads"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-indigo-600"
      >
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
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Back to all leads
      </Link>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Form submission (left) */}
        <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-900">
              Form Submission
            </h2>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeClass(lead.status)}`}
            >
              {getStatusLabel(lead.status)}
            </span>
          </div>
          <dl className="space-y-4">
            {displayFields.map((key) => {
              if (key === 'message') return null
              const value = lead.form[key]
              if (value == null) return null
              const label = FORM_LABELS[key] ?? key
              return (
                <div key={key}>
                  <dt className="text-xs font-medium uppercase tracking-wider text-slate-500">
                    {label}
                  </dt>
                  <dd className="mt-0.5 text-sm font-medium text-slate-900">
                    {value}
                  </dd>
                </div>
              )
            })}
          </dl>
          {lead.form.message && (
            <div className="mt-5 border-t border-slate-100 pt-4">
              <dt className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Message
              </dt>
              <dd className="mt-1.5 text-sm text-slate-700 whitespace-pre-wrap">
                {lead.form.message}
              </dd>
            </div>
          )}
        </section>

        {/* AI follow-up email (right) */}
        <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-900">
              AI Follow-Up Email
            </h2>
            {lead.followUp === 'sent' && lead.followUpSentAt && (
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
                Sent {lead.followUpSentAt}
              </span>
            )}
          </div>

          {lead.followUpEmail ? (
            <>
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                  Subject
                </p>
                <p className="mt-1 text-sm font-medium text-slate-900">
                  {lead.followUpEmail.subject}
                </p>
              </div>
              <div className="mt-4 rounded-lg bg-slate-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                  Body
                </p>
                <p className="mt-2 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {lead.followUpEmail.body}
                </p>
              </div>
              <div className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-500/10 px-3 py-2 text-sm font-medium text-indigo-800">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
                  />
                </svg>
                Auto-sent by AI agent based on instruction files
              </div>
            </>
          ) : (
            <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/50 py-8 text-center">
              <p className="text-sm text-slate-500">
                No follow-up email sent yet.
              </p>
              <p className="mt-1 text-xs text-slate-400">
                AI will send a follow-up when configured.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
