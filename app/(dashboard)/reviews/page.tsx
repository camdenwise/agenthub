'use client'

import { useState } from 'react'

const MOCK_REQUESTS = [
  {
    id: '1',
    name: 'Taylor Wright',
    initials: 'TW',
    avatarColor: 'bg-indigo-500/15 text-indigo-800',
    milestone: '10th visit - 10 total visits',
    status: 'sent',
    rating: null,
    date: 'Today',
  },
  {
    id: '2',
    name: 'Jordan Blake',
    initials: 'JB',
    avatarColor: 'bg-violet-500/15 text-violet-800',
    milestone: '5th visit - 5 total visits',
    status: 'completed',
    rating: 5,
    date: 'Mar 4',
  },
  {
    id: '3',
    name: 'Casey Morgan',
    initials: 'CM',
    avatarColor: 'bg-slate-200/80 text-slate-700',
    milestone: 'Trial → Member - 5 total visits',
    status: 'sent',
    rating: null,
    date: 'Mar 3',
  },
  {
    id: '4',
    name: 'Riley Nguyen',
    initials: 'RN',
    avatarColor: 'bg-slate-200/80 text-slate-700',
    milestone: '10th visit - 12 total visits',
    status: 'completed',
    rating: 4,
    date: 'Mar 1',
  },
]

const MILESTONE_KEYS = [
  'visit_5',
  'visit_10',
  'trial_membership',
  'visit_20',
  'visit_25',
] as const

const MILESTONE_LABELS: Record<(typeof MILESTONE_KEYS)[number], string> = {
  visit_5: '5th Visit',
  visit_10: '10th Visit',
  trial_membership: 'Trial → Membership',
  visit_20: '20th Visit',
  visit_25: '25th Visit',
}

const DEFAULT_TOGGLES: Record<(typeof MILESTONE_KEYS)[number], boolean> = {
  visit_5: true,
  visit_10: false,
  trial_membership: true,
  visit_20: false,
  visit_25: false,
}

export default function ReviewsPage() {
  const [toggles, setToggles] = useState(DEFAULT_TOGGLES)

  function toggleMilestone(key: (typeof MILESTONE_KEYS)[number]) {
    setToggles((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="flex flex-col">
      <div className="shrink-0">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Review Campaigns
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Automated review requests at customer milestones.
        </p>
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
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-medium ${req.avatarColor}`}
                >
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
          <h2 className="font-semibold text-slate-900">Trigger Settings</h2>
          <p className="mt-1 text-sm text-slate-500">
            Choose which milestones trigger an automated review request.
          </p>
          <ul className="mt-4 space-y-3">
            {MILESTONE_KEYS.map((key) => (
              <li
                key={key}
                className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50/50 px-4 py-3"
              >
                <span className="text-sm font-medium text-slate-800">
                  {MILESTONE_LABELS[key]}
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={toggles[key]}
                  onClick={() => toggleMilestone(key)}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                    toggles[key] ? 'bg-indigo-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`absolute top-1 left-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                      toggles[key] ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-slate-500 leading-relaxed">
            Review requests are sent via email with a personalized message and a
            direct link to your Google Business Profile.
          </p>
        </section>
      </div>
    </div>
  )
}
