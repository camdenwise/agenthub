/**
 * Lead types and helpers for the Leads pipeline.
 * Data is now loaded from Supabase — these are just types and display helpers.
 */

export type LeadStatus = 'new' | 'contacted' | 'follow_up' | 'converted'

export type Lead = {
  id: string
  business_id: string
  name: string
  email: string
  phone: string | null
  source: string | null
  interest: string
  form_message: string | null
  referral: string | null
  status: LeadStatus
  follow_up_email: {
    subject: string
    body: string
    /** ISO timestamp when the follow-up was sent */
    sent_at?: string
    sentAt?: string
  } | null
  created_at: string
  updated_at: string
}

const STATUS_LABELS: Record<LeadStatus, string> = {
  new: 'New',
  contacted: 'Contacted',
  follow_up: 'Follow Up',
  converted: 'Converted',
}

const STATUS_CLASSES: Record<LeadStatus, string> = {
  new: 'bg-blue-100 text-blue-800',
  contacted: 'bg-amber-100 text-amber-800',
  follow_up: 'bg-red-100 text-red-800',
  converted: 'bg-emerald-100 text-emerald-800',
}

export function getStatusLabel(status: LeadStatus): string {
  return STATUS_LABELS[status] ?? status
}

export function getStatusBadgeClass(status: LeadStatus): string {
  return STATUS_CLASSES[status] ?? 'bg-slate-100 text-slate-800'
}
