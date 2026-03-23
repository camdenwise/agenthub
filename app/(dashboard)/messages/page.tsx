'use client'

import { BellIcon } from '@/components/icons/BellIcon'
import { createClient } from '@/lib/supabase'
import { useEffect, useRef, useState } from 'react'

type Channel = 'instagram' | 'facebook' | 'email' | 'web_chat'
type ConvoStatus = 'active' | 'needs_human' | 'resolved' | 'spam'

type DBConversation = {
  id: string
  channel: Channel
  customer_name: string
  status: ConvoStatus
  messages: { role: string; content: string; time: string; confidence?: string }[]
  created_at: string
  updated_at: string
  external_thread_id?: string | null
}

type ChatMessage = {
  role: string
  content: string
  time: string
  confidence?: string
}

function formatMessageTime(time: string) {
  const d = new Date(time)
  if (!Number.isNaN(d.getTime())) {
    return d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }
  return time
}

const CHANNEL_LABELS: Record<Channel, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  email: 'Email',
  web_chat: 'Website',
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function getAvatarColor(channel: Channel) {
  switch (channel) {
    case 'instagram':
      return 'bg-pink-500/15 text-pink-800'
    case 'facebook':
      return 'bg-indigo-500/15 text-indigo-800'
    case 'email':
      return 'bg-violet-500/15 text-violet-800'
    default:
      return 'bg-emerald-500/15 text-emerald-800'
  }
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} hr ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
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
  const [conversations, setConversations] = useState<DBConversation[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [businessId, setBusinessId] = useState<string | null>(null)
  const endRef = useRef<HTMLDivElement>(null)

  const supabase = createClient()

  // Load conversations on mount
  useEffect(() => {
    async function load() {
      setLoading(true)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      const { data: business } = await supabase
        .from('businesses')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (!business) {
        setLoading(false)
        return
      }

      setBusinessId(business.id)

      // Fetch conversations
      const { data: convos } = await supabase
        .from('conversations')
        .select('*')
        .eq('business_id', business.id)
        .order('updated_at', { ascending: false })

      if (convos && convos.length > 0) {
        setConversations(convos)
        setSelectedId(convos[0].id)
      }

      setLoading(false)
    }

    load()
  }, [])

  // Scroll to bottom when messages change
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [selectedId, conversations])

  const selected = conversations.find((c) => c.id === selectedId)
  const messages: ChatMessage[] = selected?.messages ?? []

  // Get the last message text for the conversation list preview
  function getLastMessage(convo: DBConversation) {
    const msgs = convo.messages ?? []
    if (msgs.length === 0) return 'No messages'
    return msgs[msgs.length - 1].content
  }

  async function handleSend() {
    if (!inputValue.trim() || sending || !selected || !businessId) return

    const text = inputValue.trim()
    setInputValue('')
    setSending(true)

    const now = new Date().toISOString()
    const agentMsg: ChatMessage = {
      role: 'agent',
      content: text,
      time: now,
      confidence: 'human',
    }

    const updatedMessages = [...messages, agentMsg]
    const newStatus: ConvoStatus =
      selected.status === 'needs_human' ? 'active' : selected.status

    setConversations((prev) =>
      prev.map((c) =>
        c.id === selected.id
          ? {
              ...c,
              messages: updatedMessages,
              status: newStatus,
              updated_at: now,
            }
          : c
      )
    )

    try {
      const { data: updatedRow, error: updateErr } = await supabase
        .from('conversations')
        .update({
          messages: updatedMessages,
          status: newStatus,
          updated_at: now,
        })
        .eq('id', selected.id)
        .select()
        .single()

      if (updateErr) {
        console.error('Failed to save reply:', updateErr)
        setConversations((prev) =>
          prev.map((c) =>
            c.id === selected.id
              ? { ...c, messages, status: selected.status, updated_at: selected.updated_at }
              : c
          )
        )
        alert('Could not save your reply. Please try again.')
        setSending(false)
        return
      }

      if (updatedRow) {
        setConversations((prev) =>
          prev.map((c) => (c.id === selected.id ? (updatedRow as DBConversation) : c))
        )
      }

      const webhookUrl = process.env.NEXT_PUBLIC_ZAPIER_REPLY_WEBHOOK
      if (webhookUrl) {
        try {
          await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: text,
              conversationId: selected.id,
              customerName: selected.customer_name,
              channel: selected.channel,
              externalThreadId: selected.external_thread_id ?? '',
            }),
          })
        } catch (zapErr) {
          console.error('Zapier webhook error:', zapErr)
        }
      }
    } catch (err) {
      console.error('Failed to send message:', err)
      setConversations((prev) =>
        prev.map((c) =>
          c.id === selected.id
            ? { ...c, messages, status: selected.status, updated_at: selected.updated_at }
            : c
        )
      )
      alert('Something went wrong. Please try again.')
    }

    setSending(false)
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-slate-500">Loading messages...</p>
      </div>
    )
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col">
        <div className="shrink-0">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Messages</h1>
          <p className="mt-1 text-sm text-slate-500">All message channels in one centralized inbox.</p>
        </div>
        <div className="mt-8 flex flex-col items-center justify-center rounded-2xl border border-slate-200/80 bg-white p-12 shadow-sm">
          <p className="text-slate-500">No conversations yet.</p>
          <p className="mt-1 text-sm text-slate-400">Messages from Instagram, Facebook, email, and your website will appear here.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Messages</h1>
        <p className="mt-1 text-sm text-slate-500">
          Reply as your business; replies are saved here and can be forwarded to the customer via Zapier.
        </p>
      </div>

      <div className="mt-4 flex min-h-0 flex-1 gap-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        {/* Conversation list */}
        <div className="flex w-[300px] shrink-0 flex-col border-r border-slate-200">
          <div className="shrink-0 border-b border-slate-100 px-4 py-3">
            <h2 className="font-semibold text-slate-900">All Messages</h2>
            <p className="text-sm text-slate-500">{conversations.length} conversations</p>
          </div>
          <ul className="flex-1 overflow-y-auto">
            {conversations.map((conv) => {
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
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-medium ${getAvatarColor(conv.channel)}`}
                      >
                        {getInitials(conv.customer_name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate font-medium text-slate-900">{conv.customer_name}</span>
                          <span className="shrink-0 text-xs text-slate-400">{timeAgo(conv.updated_at)}</span>
                        </div>
                        <p className="mt-0.5 truncate text-sm text-slate-500">{getLastMessage(conv)}</p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">
                            <ChannelIcon channel={conv.channel} />
                            {CHANNEL_LABELS[conv.channel]}
                          </span>
                          {conv.status === 'needs_human' && (
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                              Needs Human
                            </span>
                          )}
                          {conv.status === 'resolved' && (
                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                              Resolved
                            </span>
                          )}
                          {conv.status === 'spam' && (
                            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                              Spam
                            </span>
                          )}
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
        {!selected ? (
          <div className="flex min-w-0 flex-1 items-center justify-center text-sm text-slate-400">
            Select a conversation
          </div>
        ) : (
          <div className="flex min-w-0 flex-1 flex-col bg-slate-50/50">
            {/* Chat header */}
            <div className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-200 bg-white px-5 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-medium ${getAvatarColor(selected.channel)}`}
                >
                  {getInitials(selected.customer_name)}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900">{selected.customer_name}</p>
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
                {messages.map((msg, i) =>
                  msg.role === 'customer' ? (
                    <div key={i} className="flex justify-start">
                      <div className="max-w-[85%]">
                        <div className="rounded-2xl rounded-tl-md bg-white px-4 py-2.5 shadow-sm ring-1 ring-slate-200/60">
                          <p className="text-sm text-slate-900">{msg.content}</p>
                        </div>
                        <p className="mt-1 text-xs text-slate-400">{formatMessageTime(msg.time)}</p>
                      </div>
                    </div>
                  ) : (
                    <div key={i} className="flex justify-end">
                      <div className="max-w-[85%]">
                        <div className="rounded-2xl rounded-tr-md bg-indigo-600 px-4 py-2.5 text-white shadow-sm">
                          <p className="text-sm">{msg.content}</p>
                        </div>
                        <div className="mt-1 flex items-center justify-end gap-2">
                          {msg.confidence === 'low' && (
                            <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                              Unsure
                            </span>
                          )}
                          {msg.confidence === 'human' && (
                            <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                              Human
                            </span>
                          )}
                          {msg.confidence === 'high' && (
                            <span className="rounded bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
                              AI
                            </span>
                          )}
                          <p className="text-xs text-slate-400">{formatMessageTime(msg.time)}</p>
                        </div>
                      </div>
                    </div>
                  )
                )}
                {sending && (
                  <div className="flex justify-end">
                    <div className="rounded-2xl rounded-tr-md bg-indigo-600 px-6 py-3.5 shadow-sm">
                      <div className="flex gap-1.5">
                        <div className="h-2 w-2 animate-pulse rounded-full bg-white/50" />
                        <div className="h-2 w-2 animate-pulse rounded-full bg-white/50" style={{ animationDelay: '0.2s' }} />
                        <div className="h-2 w-2 animate-pulse rounded-full bg-white/50" style={{ animationDelay: '0.4s' }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={endRef} />
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
                  placeholder="Type a reply..."
                  disabled={sending}
                  className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={sending || !inputValue.trim()}
                  className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 2L11 13" />
                    <path d="M22 2l-7 20-4-9-9-4 20-7z" />
                  </svg>
                  {sending ? 'Sending...' : 'Send'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}