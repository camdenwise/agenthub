'use client'

import { BellIcon } from '@/components/icons/BellIcon'
import { useState } from 'react'

type Channel = 'instagram' | 'facebook' | 'email'
type Status = 'needs_human' | 'resolved'

type Conversation = {
  id: string
  customerName: string
  initials: string
  avatarColor: string
  lastMessagePreview: string
  timestamp: string
  channel: Channel
  status: Status
}

type ChatMessage = {
  id: string
  sender: 'customer' | 'ai'
  text: string
  time: string
  unsure?: boolean
}

const CHANNEL_LABELS: Record<Channel, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  email: 'Email',
}

const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: '1',
    customerName: 'Sarah Mitchell',
    initials: 'SM',
    avatarColor: 'bg-pink-500/15 text-pink-800',
    lastMessagePreview: 'Do you have any beginner-friendly classes?',
    timestamp: '2 min ago',
    channel: 'instagram',
    status: 'resolved',
  },
  {
    id: '2',
    customerName: 'James Rodriguez',
    initials: 'JR',
    avatarColor: 'bg-indigo-500/15 text-indigo-800',
    lastMessagePreview: 'What time do your spin classes start?',
    timestamp: '18 min ago',
    channel: 'facebook',
    status: 'needs_human',
  },
  {
    id: '3',
    customerName: 'Maria Santos',
    initials: 'MS',
    avatarColor: 'bg-emerald-500/15 text-emerald-800',
    lastMessagePreview: 'Thanks, that was really helpful!',
    timestamp: '1 hr ago',
    channel: 'email',
    status: 'resolved',
  },
  {
    id: '4',
    customerName: 'Alex Chen',
    initials: 'AC',
    avatarColor: 'bg-amber-500/15 text-amber-800',
    lastMessagePreview: 'Can I get a trial pass for this weekend?',
    timestamp: '2 hr ago',
    channel: 'instagram',
    status: 'resolved',
  },
]

const MOCK_THREADS: Record<string, ChatMessage[]> = {
  '1': [
    { id: 'm1', sender: 'customer', text: 'Do you have any beginner-friendly classes?', time: '9:42 AM' },
    { id: 'm2', sender: 'ai', text: 'Yes! We have Yoga Basics on Tuesday and Thursday at 10am, and Gentle Flow on Monday at 6pm. Would you like to try a drop-in?', time: '9:43 AM' },
    { id: 'm3', sender: 'customer', text: 'Yoga Basics sounds perfect. How do I sign up?', time: '9:44 AM' },
    { id: 'm4', sender: 'ai', text: 'You can book online through our app or just show up and pay at the front desk. First class is half price for new members!', time: '9:44 AM' },
  ],
  '2': [
    {
      id: 'm5',
      sender: 'customer',
      text: "Hi, I'm the HR director at Lumen Technologies. Do you offer corporate wellness programs or group rates for employees?",
      time: '9:45 AM',
    },
    {
      id: 'm6',
      sender: 'ai',
      text: "That's a great question! I'm not sure about specific corporate programs, but let me get someone from our team to reach out to you directly.",
      time: '9:46 AM',
      unsure: true,
    },
  ],
  '3': [
    { id: 'm7', sender: 'customer', text: 'What are your opening hours?', time: '8:30 AM' },
    { id: 'm8', sender: 'ai', text: 'We’re open Mon–Fri 5am–10pm and Sat–Sun 6am–8pm. Holiday hours may vary.', time: '8:31 AM' },
    { id: 'm9', sender: 'customer', text: 'Thanks, that was really helpful!', time: '8:32 AM' },
  ],
  '4': [
    { id: 'm10', sender: 'customer', text: 'Can I get a trial pass for this weekend?', time: 'Yesterday' },
    { id: 'm11', sender: 'ai', text: 'Absolutely! We offer a 3-day trial for $25. You can sign up at the front desk or online. Bring a valid ID.', time: 'Yesterday' },
  ],
}

function ChannelIcon({ channel }: { channel: Channel }) {
  const base = 'h-4 w-4 shrink-0'
  if (channel === 'instagram') {
    return (
      <svg className={base} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
      </svg>
    )
  }
  if (channel === 'facebook') {
    return (
      <svg className={base} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    )
  }
  return (
    <svg className={base} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
    </svg>
  )
}

export default function MessagesPage() {
  const [selectedId, setSelectedId] = useState<string>(MOCK_CONVERSATIONS[0].id)
  const [inputValue, setInputValue] = useState('')
  const [threads, setThreads] = useState<Record<string, ChatMessage[]>>(MOCK_THREADS)

  const selected = MOCK_CONVERSATIONS.find((c) => c.id === selectedId) ?? MOCK_CONVERSATIONS[0]
  const messages = threads[selectedId] ?? []

  function handleSend() {
    if (!inputValue.trim()) return
    const newCustomerMsg: ChatMessage = {
      id: `new-${Date.now()}`,
      sender: 'customer',
      text: inputValue.trim(),
      time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
    }
    const newAiMsg: ChatMessage = {
      id: `new-ai-${Date.now()}`,
      sender: 'ai',
      text: "Thanks for your message. This is a test reply — we'll connect this to your AI when you're ready.",
      time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
    }
    setThreads((prev) => ({
      ...prev,
      [selectedId]: [...(prev[selectedId] ?? []), newCustomerMsg, newAiMsg],
    }))
    setInputValue('')
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Messages</h1>
        <p className="mt-1 text-sm text-slate-500">
          All message channels in one centralized inbox.
        </p>
      </div>

      <div className="mt-4 flex min-h-0 flex-1 gap-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        {/* Conversation list - 300px */}
        <div className="flex w-[300px] shrink-0 flex-col border-r border-slate-200">
          <div className="shrink-0 border-b border-slate-100 px-4 py-3">
            <h2 className="font-semibold text-slate-900">All Messages</h2>
            <p className="text-sm text-slate-500">{MOCK_CONVERSATIONS.length} conversations</p>
          </div>
          <ul className="flex-1 overflow-y-auto">
            {MOCK_CONVERSATIONS.map((conv) => {
              const isActive = conv.id === selectedId
              return (
                <li key={conv.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(conv.id)}
                    className={`flex w-full flex-col gap-0.5 px-4 py-3 text-left transition-colors ${
                      isActive ? 'border-l-2 border-indigo-500 bg-indigo-500/5' : 'border-l-2 border-transparent hover:bg-slate-50/80'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-medium ${conv.avatarColor}`}
                      >
                        {conv.initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate font-medium text-slate-900">{conv.customerName}</span>
                          <span className="shrink-0 text-xs text-slate-400">{conv.timestamp}</span>
                        </div>
                        <p className="mt-0.5 truncate text-sm text-slate-500">{conv.lastMessagePreview}</p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">
                            <ChannelIcon channel={conv.channel} />
                            {CHANNEL_LABELS[conv.channel]}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                              conv.status === 'needs_human' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {conv.status === 'needs_human' ? 'Needs Human' : 'Resolved'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>

        {/* Chat view */}
        <div className="flex min-w-0 flex-1 flex-col bg-slate-50/50">
          {/* Chat header */}
          <div className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-200 bg-white px-5 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-medium ${selected.avatarColor}`}
              >
                {selected.initials}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-slate-900">{selected.customerName}</p>
                <p className="inline-flex items-center gap-1.5 text-sm text-slate-500">
                  <ChannelIcon channel={selected.channel} />
                  {CHANNEL_LABELS[selected.channel]}
                </p>
              </div>
            </div>
            {selected.status === 'needs_human' && (
              <div className="flex shrink-0 items-center gap-2 rounded-lg bg-amber-50 px-3 py-1.5 text-sm text-amber-800">
                <BellIcon className="h-4 w-4" />
                <span>Manager notified via email</span>
              </div>
            )}
          </div>

          {/* Message list */}
          <div className="flex-1 overflow-y-auto px-5 py-4">
            <div className="space-y-4">
              {messages.map((msg) =>
                msg.sender === 'customer' ? (
                  <div key={msg.id} className="flex justify-start">
                    <div className="max-w-[85%]">
                      <div className="rounded-2xl rounded-tl-md bg-white px-4 py-2.5 shadow-sm ring-1 ring-slate-200/60">
                        <p className="text-sm text-slate-900">{msg.text}</p>
                      </div>
                      <p className="mt-1 text-xs text-slate-400">{msg.time}</p>
                    </div>
                  </div>
                ) : (
                  <div key={msg.id} className="flex justify-end">
                    <div className="max-w-[85%]">
                      <div className="rounded-2xl rounded-tr-md bg-indigo-600 px-4 py-2.5 text-white shadow-sm">
                        <p className="text-sm">{msg.text}</p>
                      </div>
                      <div className="mt-1 flex items-center justify-end gap-2">
                        {msg.unsure && (
                          <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                            Unsure
                          </span>
                        )}
                        <p className="text-xs text-slate-400">{msg.time}</p>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Input */}
          <div className="shrink-0 border-t border-slate-200 bg-white p-4">
            <div className="flex gap-3">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="Type to respond directly to customer..."
                className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={handleSend}
                className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 2L11 13" />
                  <path d="M22 2l-7 20-4-9-9-4 20-7z" />
                </svg>
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
