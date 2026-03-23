'use client'

import { createClient } from '@/lib/supabase'
import { useAdmin } from '@/lib/admin-context'
import { useEffect, useState } from 'react'

const MOCK_REQUESTS = [
  { id: '1', name: 'Taylor Wright', initials: 'TW', avatarColor: 'bg-indigo-500/15 text-indigo-800', milestone: '10th visit - 10 total visits', status: 'sent', rating: null, date: 'Today' },
  { id: '2', name: 'Jordan Blake', initials: 'JB', avatarColor: 'bg-violet-500/15 text-violet-800', milestone: '5th visit - 5 total visits', status: 'completed', rating: 5, date: 'Mar 4' },
  { id: '3', name: 'Casey Morgan', initials: 'CM', avatarColor: 'bg-slate-200/80 text-slate-700', milestone: 'Trial → Member - 5 total visits', status: 'sent', rating: null, date: 'Mar 3' },
  { id: '4', name: 'Riley Nguyen', initials: 'RN', avatarColor: 'bg-slate-200/80 text-slate-700', milestone: '10th visit - 12 total visits', status: 'completed', rating: 4, date: 'Mar 1' },
]

const DEFAULT_MILESTONES = [
  { key: 'visit_5', label: '5th Visit', on: true },
  { key: 'visit_10', label: '10th Visit', on: true },
  { key: 'trial_membership', label: 'Trial → Membership', on: true },
  { key: 'visit_20', label: '20th Visit', on: false },
  { key: 'visit_25', label: '25th Visit', on: false },
]

export default function ReviewsPage() {
  const { activeBusiness, loading: adminLoading } = useAdmin()
  const [milestones, setMilestones] = useState(DEFAULT_MILESTONES)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newMilestone, setNewMilestone] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)

  const supabase = createClient()

  // Load saved trigger settings from business.settings
  useEffect(() => {
    async function load() {
      if (!activeBusiness) return
      setLoading(true)

      const { data: business } = await supabase
        .from('businesses')
        .select('settings')
        .eq('id', activeBusiness.id)
        .single()

      if (business?.settings?.reviewTriggers) {
        setMilestones(business.settings.reviewTriggers)
      } else {
        setMilestones(DEFAULT_MILESTONES)
      }

      setLoading(false)
    }

    if (!adminLoading) load()
  }, [activeBusiness?.id, adminLoading])

  // Save trigger settings to Supabase
  async function saveTriggers(updated: typeof milestones) {
    if (!activeBusiness) return
    setSaving(true)

    // Get existing settings first so we don't overwrite other fields
    const { data: business } = await supabase
      .from('businesses')
      .select('settings')
      .eq('id', activeBusiness.id)
      .single()

    const existingSettings = business?.settings || {}

    await supabase
      .from('businesses')
      .update({
        settings: { ...existingSettings, reviewTriggers: updated },
      })
      .eq('id', activeBusiness.id)

    setSaving(false)
  }

  function toggleMilestone(key: string) {
    const updated = milestones.map((m) =>
      m.key === key ? { ...m, on: !m.on } : m
    )
    setMilestones(updated)
    saveTriggers(updated)
  }

  function addMilestone() {
    if (!newMilestone.trim()) return
    const key = `custom_${Date.now()}`
    const updated = [...milestones, { key, label: newMilestone.trim(), on: true }]
    setMilestones(updated)
    saveTriggers(updated)
    setNewMilestone('')
    setShowAddForm(false)
  }

  function removeMilestone(key: string) {
    const updated = milestones.filter((m) => m.key !== key)
    setMilestones(updated)
    saveTriggers(updated)
  }

  if (adminLoading || loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-slate-500">Loading reviews...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <div className="shrink-0">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Review Campaigns</h1>
        <p className="mt-1 text-sm text-slate-500">Automated review requests at customer milestones.</p>
      </div>

      {/* Stat cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="flex items-start gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-700">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3 21l18-9L3 0l3 9" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-slate-500">Reviews Sent</p>
            <p className="mt-0.5 text-2xl font-bold tabular-nums text-slate-900">12</p>
            <p className="mt-1 text-xs text-slate-500">This month</p>
          </div>
        </div>
        <div className="flex items-start gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-700">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-slate-500">Completed</p>
            <p className="mt-0.5 text-2xl font-bold tabular-nums text-slate-900">7</p>
            <p className="mt-1 text-xs text-slate-500">58% completion rate</p>
          </div>
        </div>
        <div className="flex items-start gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-800">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-slate-500">Avg Rating</p>
            <p className="mt-0.5 text-2xl font-bold tabular-nums text-slate-900">4.6</p>
            <p className="mt-1 text-xs text-slate-500">From completed reviews</p>
          </div>
        </div>
      </div>

      {/* Recent Requests + Trigger Settings */}
      <div className="mt-6 flex flex-col gap-6 lg:flex-row">
        <section className="min-w-0 flex-1 rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="font-semibold text-slate-900">Recent Requests</h2>
          </div>
          <ul className="divide-y divide-slate-100">
            {MOCK_REQUESTS.map((req) => (
              <li key={req.id} className="flex items-center gap-4 px-5 py-4">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-medium ${req.avatarColor}`}>
                  {req.initials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-900">{req.name}</p>
                  <p className="text-sm text-slate-500">{req.milestone}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-0.5">
                  {req.status === 'sent' ? (
                    <span className="text-sm font-medium text-amber-700">Sent</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-sm font-medium text-emerald-700">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      {req.rating}★
                    </span>
                  )}
                  <span className="text-xs text-slate-400">{req.date}</span>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="w-full rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm lg:w-[320px] lg:shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Trigger Settings</h2>
            {saving && <span className="text-xs text-slate-400">Saving...</span>}
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Choose which milestones trigger an automated review request.
          </p>
          <ul className="mt-4 space-y-3">
            {milestones.map((m) => (
              <li key={m.key}
                className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50/50 px-4 py-3">
                <span className="text-sm font-medium text-slate-800">{m.label}</span>
                <div className="flex items-center gap-2">
                  {m.key.startsWith('custom_') && (
                    <button type="button" onClick={() => removeMilestone(m.key)}
                      className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-red-500">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                  <button type="button" role="switch" aria-checked={m.on} onClick={() => toggleMilestone(m.key)}
                    className={`relative h-6 w-11 shrink-0 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${m.on ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                    <span className={`absolute top-1 left-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${m.on ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>
              </li>
            ))}
          </ul>

          {showAddForm ? (
            <div className="mt-4 flex gap-2">
              <input type="text" value={newMilestone} onChange={(e) => setNewMilestone(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addMilestone()}
                placeholder="e.g. 50th Visit"
                className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
              <button type="button" onClick={addMilestone}
                className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500">
                Add
              </button>
              <button type="button" onClick={() => { setShowAddForm(false); setNewMilestone('') }}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
                Cancel
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => setShowAddForm(true)}
              className="mt-4 w-full rounded-lg border border-dashed border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">
              + Add custom milestone
            </button>
          )}

          <p className="mt-4 text-xs text-slate-500 leading-relaxed">
            Review requests are sent via email with a personalized message and a direct link to your Google Business Profile.
          </p>
        </section>
      </div>
    </div>
  )
}