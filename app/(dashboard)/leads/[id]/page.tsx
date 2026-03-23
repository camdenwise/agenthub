'use client'

import {
  getStatusBadgeClass,
  getStatusLabel,
} from '@/lib/leads-data'
import type { Lead } from '@/lib/leads-data'
import { createClient } from '@/lib/supabase'
import { useAdmin } from '@/lib/admin-context'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

const FIELD_LABELS: Record<string, string> = {
  name: 'Name',
  email: 'Email',
  phone: 'Phone',
  interest: 'Interest',
  referral: 'Referral',
  source: 'Source',
}

export default function LeadDetailPage() {
  const params = useParams()
  const id = params.id as string
  const { activeBusiness, loading: adminLoading } = useAdmin()
  const [lead, setLead] = useState<Lead | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    async function load() {
      if (!activeBusiness) return

      const { data } = await supabase
        .from('leads')
        .select('*')
        .eq('id', id)
        .single()

      if (data) setLead(data as Lead)
      setLoading(false)
    }

    if (!adminLoading) load()
  }, [id, activeBusiness?.id, adminLoading])

  async function handleGenerateFollowUp() {
    if (!lead || !activeBusiness) return
    setGenerating(true)

    try {
      const res = await fetch('/api/ai/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'lead',
          businessId: activeBusiness.id,
          leadId: lead.id,
          leadName: lead.name,
          leadEmail: lead.email,
          leadInterest: lead.interest,
          leadMessage: lead.form_message || '',
          referralSource: lead.referral || 'Unknown',
        }),
      })

      const result = await res.json()

      if (result.confidence === 'high') {
        const { data: updated } = await supabase
          .from('leads')
          .select('*')
          .eq('id', lead.id)
          .single()

        if (updated) setLead(updated as Lead)
      }
    } catch (err) {
      console.error('Failed to generate follow-up:', err)
    }

    setGenerating(false)
  }

  if (adminLoading || loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-slate-500">Loading lead...</p>
      </div>
    )
  }

  if (!lead) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-slate-500">Lead not found.</p>
        <Link href="/leads" className="mt-2 text-sm font-medium text-indigo-600 hover:text-indigo-500">
          Back to leads
        </Link>
      </div>
    )
  }

  const displayFields = ['name', 'email', 'phone', 'interest', 'referral', 'source'].filter(
    (key) => lead[key as keyof Lead] != null
  )

  return (
    <div className="flex flex-col">
      <Link
        href="/leads"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-indigo-600"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to all leads
      </Link>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-900">Form Submission</h2>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeClass(lead.status)}`}>
              {getStatusLabel(lead.status)}
            </span>
          </div>
          <dl className="space-y-4">
            {displayFields.map((key) => {
              const value = lead[key as keyof Lead] as string | null
              if (!value) return null
              const label = FIELD_LABELS[key] ?? key
              return (
                <div key={key}>
                  <dt className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</dt>
                  <dd className="mt-0.5 text-sm font-medium text-slate-900">{value}</dd>
                </div>
              )
            })}
          </dl>
          {lead.form_message && (
            <div className="mt-5 border-t border-slate-100 pt-4">
              <dt className="text-xs font-medium uppercase tracking-wider text-slate-500">Message</dt>
              <dd className="mt-1.5 whitespace-pre-wrap text-sm text-slate-700">{lead.form_message}</dd>
            </div>
          )}
          <div className="mt-4 text-xs text-slate-400">
            Submitted {new Date(lead.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-900">AI Follow-Up Email</h2>
            {lead.follow_up_email?.sent_at && (
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700">
                <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Sent {new Date(lead.follow_up_email.sent_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
              </span>
            )}
          </div>

          {lead.follow_up_email ? (
            <>
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Subject</p>
                <p className="mt-1 text-sm font-medium text-slate-900">{lead.follow_up_email.subject}</p>
              </div>
              <div className="mt-4 rounded-lg bg-slate-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Body</p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                  {lead.follow_up_email.body}
                </p>
              </div>
              <div className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-500/10 px-3 py-2 text-sm font-medium text-indigo-800">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                </svg>
                Auto-sent by AI agent based on instruction files
              </div>
            </>
          ) : (
            <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/50 py-8 text-center">
              <p className="text-sm text-slate-500">No follow-up email sent yet.</p>
              <button
                onClick={handleGenerateFollowUp}
                disabled={generating}
                className="mt-4 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {generating ? 'Generating & Sending...' : 'Generate & Send Follow-Up'}
              </button>
              <p className="mt-2 text-xs text-slate-400">
                AI will craft a personalized email with a conversion CTA
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}