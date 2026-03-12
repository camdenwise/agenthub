'use client'

import { BellIcon } from '@/components/icons/BellIcon'
import { useRef, useState, useEffect } from 'react'

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
        aria-label="Notifications"
        aria-expanded={open}
      >
        <BellIcon className="h-5 w-5" />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border border-slate-200 bg-white py-2 shadow-lg"
          role="dialog"
          aria-label="Notifications"
        >
          <div className="border-b border-slate-100 px-4 py-2">
            <p className="text-sm font-semibold text-slate-900">Notifications</p>
          </div>
          <div className="px-4 py-8 text-center">
            <p className="text-sm text-slate-500">No new notifications</p>
          </div>
        </div>
      )}
    </div>
  )
}
