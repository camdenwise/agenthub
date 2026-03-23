'use client'

import { useAdmin } from '@/lib/admin-context'

export function AdminBar() {
  const { isAdmin, allBusinesses, activeBusiness, setActiveBusiness } = useAdmin()

  if (!isAdmin) return null

  return (
    <div className="flex items-center gap-3 border-b border-amber-200 bg-amber-50 px-5 py-2">
      <div className="flex items-center gap-2">
        <svg className="h-4 w-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
        </svg>
        <span className="text-xs font-semibold text-amber-800">ADMIN</span>
      </div>
      <div className="h-4 w-px bg-amber-300" />
      <label className="text-xs text-amber-700">Viewing:</label>
      <select
        value={activeBusiness?.id ?? ''}
        onChange={(e) => {
          const biz = allBusinesses.find((b) => b.id === e.target.value)
          if (biz) setActiveBusiness(biz)
        }}
        className="rounded-md border border-amber-300 bg-white px-2 py-1 text-sm font-medium text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
      >
        {allBusinesses.map((biz) => (
          <option key={biz.id} value={biz.id}>
            {biz.name}
          </option>
        ))}
      </select>
      <span className="text-xs text-amber-600">
        {allBusinesses.length} {allBusinesses.length === 1 ? 'business' : 'businesses'} on platform
      </span>
    </div>
  )
}