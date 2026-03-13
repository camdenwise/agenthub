'use client'

import { BellIcon as SharedBellIcon } from '@/components/icons/BellIcon'
import { useState } from 'react'

type SettingsTab =
  | 'business-profile'
  | 'channels'
  | 'api-connections'
  | 'webhooks'
  | 'notifications'
  | 'billing'

type ChannelIconKey = 'instagram' | 'facebook' | 'email' | 'website' | 'generic'
type ApiIconKey = 'meta' | 'resend' | 'mindbody' | 'vagaro' | 'google' | 'stripe' | 'generic'

type ChannelItem = {
  id: string
  name: string
  description: string
  account?: string
  connectedAt?: string
  connected: boolean
  iconKey: ChannelIconKey
}

type ApiItem = {
  id: string
  name: string
  description: string
  connected: boolean
  apiKey?: string
  webhookUrl?: string
  reviewLink?: string
  tokenExpires?: string
  lastSync?: string
  iconKey: ApiIconKey
}

type WebhookItem = {
  id: string
  name: string
  url: string
  type: 'inbound' | 'outbound'
  active: boolean
  lastReceived: string
  totalEvents: number
}

const TABS: { id: SettingsTab; label: string; icon: string }[] = [
  { id: 'business-profile', label: 'Business Profile', icon: 'person' },
  { id: 'channels', label: 'Channels', icon: 'chat' },
  { id: 'api-connections', label: 'API Connections', icon: 'link' },
  { id: 'webhooks', label: 'Webhooks', icon: 'webhook' },
  { id: 'notifications', label: 'Notifications', icon: 'bell' },
  { id: 'billing', label: 'Billing', icon: 'card' },
]

const INDUSTRIES = ['Gym', 'Salon', 'Restaurant', 'Retail', 'Other']

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('business-profile')

  // Business Profile
  const [profile, setProfile] = useState({
    businessName: 'Iron Temple Gym',
    address: '4521 Trade Street, Charlotte, NC 28203',
    phone: '(704) 555-0100',
    website: 'www.irontemple.com',
    industry: 'Gym',
    managerName: 'Miko Reynolds',
    managerEmail: 'miko@irontemple.com',
  })
  const [profileSaved, setProfileSaved] = useState(false)

  // Channels
  const [channels, setChannels] = useState<ChannelItem[]>([
    { id: '1', name: 'Instagram DMs', description: 'Receive and respond to Instagram Direct Messages', account: '@irontemple_clt', connectedAt: 'Feb 15, 2026', connected: true, iconKey: 'instagram' },
    { id: '2', name: 'Facebook Messenger', description: 'Receive and respond to Facebook page messages', account: 'Connected just now', connectedAt: 'Just now', connected: true, iconKey: 'facebook' },
    { id: '3', name: 'Email (Inbound)', description: 'Receive and respond to customer emails', account: 'hello@irontemple.com', connectedAt: 'Feb 20, 2026', connected: true, iconKey: 'email' },
    { id: '4', name: 'Website Chat Widget', description: 'Embed a chat widget on your website for live AI responses', connected: false, iconKey: 'website' },
  ])

  // API Connections
  const [apis, setApis] = useState<ApiItem[]>([
    { id: '1', name: 'Meta Graph API', description: 'Powers Instagram DMs and Facebook Messenger.', connected: true, apiKey: 'FABdhc%T***', webhookUrl: 'https://app.agenthub.io/api/webhooks/meta/ig_etc123', tokenExpires: 'May 19, 2026', iconKey: 'meta' },
    { id: '2', name: 'Resend (Email)', description: 'Sends follow-up emails to leads and review requests.', connected: true, apiKey: 'rv_dk2Ufa4***', iconKey: 'resend' },
    { id: '3', name: 'Mindbody', description: 'Syncs visit counts and membership data for review triggers.', connected: true, apiKey: 'im_etthe_12345', webhookUrl: 'https://app.agenthub.io/api/webhooks/mindbody/ig_etc123', lastSync: 'Today 8:00 AM', iconKey: 'mindbody' },
    { id: '4', name: 'Vagaro', description: 'Alternative booking platform integration.', connected: false, iconKey: 'vagaro' },
    { id: '5', name: 'Google Business Profile', description: 'Review link destination for review request campaigns.', connected: true, reviewLink: 'https://g.page/r/irontemple-clt/review', iconKey: 'google' },
    { id: '6', name: 'Stripe (Billing)', description: 'Accept payments and manage client subscriptions.', connected: false, iconKey: 'stripe' },
  ])

  // Webhooks
  const [webhooks, setWebhooks] = useState<WebhookItem[]>([
    { id: '1', name: 'Website Contact Form', url: 'https://app.agenthub.io/api/webhooks/ltg_nc123', type: 'inbound', active: true, lastReceived: 'Today 9:30 AM', totalEvents: 47 },
    { id: '2', name: 'Meta Messaging', url: 'https://app.agenthub.io/api/webhooks/meta/lg_abc123', type: 'inbound', active: true, lastReceived: 'Today 10:22 AM', totalEvents: 812 },
    { id: '3', name: 'Mindbody Events', url: 'https://app.agenthub.io/api/webhooks/mindbody/ltg_ah173', type: 'inbound', active: true, lastReceived: 'Today 8:00 AM', totalEvents: 89 },
    { id: '4', name: 'Booking Confirmation', url: 'https://app.agenthub.io/api/webhooks/booking/lg_ab123', type: 'outbound', active: false, lastReceived: 'Never', totalEvents: 0 },
  ])

  // Notifications - all active by default
  const [notifToggles, setNotifToggles] = useState<Record<string, boolean>>({
    'ai-needs-human': true,
    'new-lead': true,
    'lead-follow-up': true,
    'review-completed': true,
    'daily-summary': true,
    'weekly-analytics': true,
  })
  const [notifChannel, setNotifChannel] = useState<'email' | 'sms'>('email')
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null)

  // Modals for Add Channel / API / Webhook
  const [modalOpen, setModalOpen] = useState<'channel' | 'api' | 'webhook' | null>(null)
  const [channelForm, setChannelForm] = useState({ name: '', description: '', account: '' })
  const [apiForm, setApiForm] = useState({ name: '', description: '', apiKey: '', webhookUrl: '', reviewLink: '' })
  const [webhookForm, setWebhookForm] = useState({ name: '', url: '', type: 'inbound' as 'inbound' | 'outbound' })

  // Remove confirmation: { type, id, name }
  const [removeConfirm, setRemoveConfirm] = useState<{ type: 'channel' | 'api' | 'webhook'; id: string; name: string } | null>(null)

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopyFeedback(label)
      setTimeout(() => setCopyFeedback(null), 2000)
    })
  }

  function toggleChannel(id: string) {
    setChannels((prev) =>
      prev.map((c) => (c.id === id ? { ...c, connected: !c.connected, connectedAt: !c.connected ? new Date().toLocaleDateString('en-US') : undefined } : c))
    )
  }

  function openChannelModal() {
    setChannelForm({ name: '', description: '', account: '' })
    setModalOpen('channel')
  }
  function saveChannel() {
    if (!channelForm.name.trim()) return
    setChannels((prev) => [
      ...prev,
      { id: `ch-${Date.now()}`, name: channelForm.name.trim(), description: channelForm.description.trim() || 'Add description', account: channelForm.account.trim() || undefined, connected: false, iconKey: 'generic' },
    ])
    setModalOpen(null)
  }
  function removeChannel(id: string) {
    setChannels((prev) => prev.filter((c) => c.id !== id))
    setRemoveConfirm(null)
  }

  function toggleApi(id: string) {
    setApis((prev) =>
      prev.map((a) => (a.id === id ? { ...a, connected: !a.connected } : a))
    )
  }
  function updateApiField(id: string, field: keyof ApiItem, value: string) {
    setApis((prev) => prev.map((a) => (a.id === id ? { ...a, [field]: value } : a)))
  }
  function openApiModal() {
    setApiForm({ name: '', description: '', apiKey: '', webhookUrl: '', reviewLink: '' })
    setModalOpen('api')
  }
  function saveApi() {
    if (!apiForm.name.trim()) return
    setApis((prev) => [
      ...prev,
      { id: `api-${Date.now()}`, name: apiForm.name.trim(), description: apiForm.description.trim() || 'Configure connection', connected: false, iconKey: 'generic', apiKey: apiForm.apiKey.trim() || undefined, webhookUrl: apiForm.webhookUrl.trim() || undefined, reviewLink: apiForm.reviewLink.trim() || undefined },
    ])
    setModalOpen(null)
  }
  function removeApi(id: string) {
    setApis((prev) => prev.filter((a) => a.id !== id))
    setRemoveConfirm(null)
  }

  function updateWebhookUrl(id: string, url: string) {
    setWebhooks((prev) => prev.map((w) => (w.id === id ? { ...w, url } : w)))
  }
  function openWebhookModal() {
    setWebhookForm({ name: '', url: 'https://app.agenthub.io/api/webhooks/', type: 'inbound' })
    setModalOpen('webhook')
  }
  function saveWebhook() {
    if (!webhookForm.name.trim() || !webhookForm.url.trim()) return
    setWebhooks((prev) => [
      ...prev,
      { id: `wh-${Date.now()}`, name: webhookForm.name.trim(), url: webhookForm.url.trim(), type: webhookForm.type, active: false, lastReceived: 'Never', totalEvents: 0 },
    ])
    setModalOpen(null)
  }
  function removeWebhook(id: string) {
    setWebhooks((prev) => prev.filter((w) => w.id !== id))
    setRemoveConfirm(null)
  }
  function confirmRemove() {
    if (!removeConfirm) return
    if (removeConfirm.type === 'channel') removeChannel(removeConfirm.id)
    else if (removeConfirm.type === 'api') removeApi(removeConfirm.id)
    else removeWebhook(removeConfirm.id)
  }

  return (
    <div className="flex flex-col lg:flex-row lg:gap-8">
      <div className="shrink-0 lg:w-56">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Settings
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Configure your business, connections, and preferences.
        </p>
        <nav className="mt-6 space-y-0.5 rounded-2xl border border-slate-200/80 bg-white p-2 shadow-sm">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-indigo-500/10 text-indigo-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {tab.icon === 'person' && <UserIcon />}
              {tab.icon === 'chat' && <ChatIcon />}
              {tab.icon === 'link' && <LinkIcon />}
              {tab.icon === 'webhook' && <WebhookIcon />}
              {tab.icon === 'bell' && <SharedBellIcon className="h-5 w-5" />}
              {tab.icon === 'card' && <CardIcon />}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="min-w-0 flex-1 pt-8 lg:pt-0 max-w-2xl">
        {activeTab === 'business-profile' && (
          <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Business Profile</h2>
            <p className="mt-1 text-sm text-slate-500">Basic information about your business</p>
            <form
              className="mt-6 space-y-4"
              onSubmit={(e) => {
                e.preventDefault()
                setProfileSaved(true)
                setTimeout(() => setProfileSaved(false), 3000)
              }}
            >
              <div>
                <label className="block text-sm font-medium text-slate-700">Business Name</label>
                <input
                  type="text"
                  value={profile.businessName}
                  onChange={(e) => setProfile({ ...profile, businessName: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Address</label>
                <input
                  type="text"
                  value={profile.address}
                  onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Phone</label>
                  <input
                    type="text"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Website</label>
                  <input
                    type="text"
                    value={profile.website}
                    onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Industry</label>
                <select
                  value={profile.industry}
                  onChange={(e) => setProfile({ ...profile, industry: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  {INDUSTRIES.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              <div className="border-t border-slate-100 pt-4">
                <p className="text-sm font-medium text-slate-900">Manager Contact</p>
                <p className="text-xs text-slate-500">Receives notifications when the AI needs human help.</p>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Manager Name</label>
                    <input
                      type="text"
                      value={profile.managerName}
                      onChange={(e) => setProfile({ ...profile, managerName: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Manager Email</label>
                    <input
                      type="email"
                      value={profile.managerEmail}
                      onChange={(e) => setProfile({ ...profile, managerEmail: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>
              <button
                type="submit"
                className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-500"
              >
                {profileSaved ? 'Saved!' : 'Save Changes'}
              </button>
            </form>
          </section>
        )}

        {activeTab === 'channels' && (
          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Channels</h2>
              <p className="mt-1 text-sm text-slate-500">Connect the platforms where your customers reach you</p>
            </div>
            <div className="space-y-3">
              {channels.map((ch) => (
                <div
                  key={ch.id}
                  className="flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                      <ChannelIcon key_={ch.iconKey} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-900">{ch.name}</span>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ch.connected ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                          {ch.connected ? 'Connected' : 'Disconnected'}
                        </span>
                      </div>
                      <p className="mt-0.5 text-sm text-slate-500">{ch.description}</p>
                      {ch.account && <p className="mt-1 text-xs text-slate-500">Account: {ch.account} {ch.connectedAt && `- connected ${ch.connectedAt}`}</p>}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleChannel(ch.id)}
                      className={`rounded-lg px-4 py-2 text-sm font-medium ${ch.connected ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-indigo-600 text-white hover:bg-indigo-500'}`}
                    >
                      {ch.connected ? 'Disconnect' : 'Connect'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setRemoveConfirm({ type: 'channel', id: ch.id, name: ch.name })}
                      className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-red-50 hover:border-red-200 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button type="button" onClick={openChannelModal} className="rounded-lg border border-dashed border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">
              + Add new channel
            </button>
          </section>
        )}

        {activeTab === 'api-connections' && (
          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">API Connections</h2>
              <p className="mt-1 text-sm text-slate-500">Manage external service connections and API keys</p>
            </div>
            <div className="space-y-3">
              {apis.map((api) => (
                <div key={api.id} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex gap-4 min-w-0 flex-1">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                        <ApiIcon key_={api.iconKey} />
                      </div>
                      <div className="min-w-0 flex-1 space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-slate-900">{api.name}</span>
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${api.connected ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                            {api.connected && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
                            {api.connected ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <p className="text-sm text-slate-500">{api.description}</p>
                        <div className="space-y-2 text-sm">
                          <div className="flex flex-wrap items-center gap-2">
                            <label className="w-20 shrink-0 text-slate-500">API Key</label>
                            <input type="text" value={api.apiKey ?? ''} onChange={(e) => updateApiField(api.id, 'apiKey', e.target.value)} placeholder="Optional" className="min-w-0 flex-1 max-w-xs rounded border border-slate-200 px-2 py-1 text-slate-900" />
                            {api.apiKey && <button type="button" onClick={() => copyToClipboard(api.apiKey!, 'key')} className="text-indigo-600 hover:underline text-xs cursor-pointer">Copy</button>}
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <label className="w-20 shrink-0 text-slate-500">Webhook URL</label>
                            <input type="text" value={api.webhookUrl ?? ''} onChange={(e) => updateApiField(api.id, 'webhookUrl', e.target.value)} placeholder="Optional" className="min-w-0 flex-1 max-w-xs rounded border border-slate-200 px-2 py-1 text-slate-900 font-mono text-xs" />
                            {api.webhookUrl && <button type="button" onClick={() => copyToClipboard(api.webhookUrl!, 'webhook')} className="text-indigo-600 hover:underline text-xs cursor-pointer">Copy</button>}
                          </div>
                          {api.iconKey === 'google' && (
                            <div className="flex flex-wrap items-center gap-2">
                              <label className="w-20 shrink-0 text-slate-500">Review link</label>
                              <input type="text" value={api.reviewLink ?? ''} onChange={(e) => updateApiField(api.id, 'reviewLink', e.target.value)} placeholder="Google Business review URL" className="min-w-0 flex-1 max-w-xs rounded border border-slate-200 px-2 py-1 text-slate-900 font-mono text-xs" />
                              {api.reviewLink && <button type="button" onClick={() => copyToClipboard(api.reviewLink!, 'link')} className="text-indigo-600 hover:underline text-xs cursor-pointer">Copy</button>}
                            </div>
                          )}
                          {api.tokenExpires && <p className="text-xs text-slate-500">Token expires: {api.tokenExpires}</p>}
                          {api.lastSync && <p className="text-xs text-slate-500">Last sync: {api.lastSync} <button type="button" className="text-indigo-600 hover:underline">Sync now</button></p>}
                        </div>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleApi(api.id)}
                        className={`rounded-lg px-4 py-2 text-sm font-medium ${api.connected ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-indigo-600 text-white hover:bg-indigo-500'}`}
                      >
                        {api.connected ? 'Disconnect' : 'Connect'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setRemoveConfirm({ type: 'api', id: api.id, name: api.name })}
                        className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-red-50 hover:border-red-200 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button type="button" onClick={openApiModal} className="rounded-lg border border-dashed border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">
              + Add new API
            </button>
            {copyFeedback && <p className="text-sm text-emerald-600">Copied {copyFeedback} to clipboard.</p>}
          </section>
        )}

        {activeTab === 'webhooks' && (
          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Webhooks</h2>
              <p className="mt-1 text-sm text-slate-500">Endpoint URLs that receive or send event data. Copy or edit below.</p>
            </div>
            <div className="space-y-3">
              {webhooks.map((wh) => (
                <div key={wh.id} className="flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-slate-900">{wh.name}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${wh.type === 'inbound' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>{wh.type === 'inbound' ? 'Inbound' : 'Outbound'}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${wh.active ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-600'}`}>{wh.active ? 'Active' : 'Inactive'}</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="text-sm text-slate-500 shrink-0">URL</label>
                      <input type="text" value={wh.url} onChange={(e) => updateWebhookUrl(wh.id, e.target.value)} className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm text-slate-900" placeholder="https://..." />
                      <button type="button" onClick={() => copyToClipboard(wh.url, 'URL')} className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                        Copy URL
                      </button>
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => setRemoveConfirm({ type: 'webhook', id: wh.id, name: wh.name })}
                        className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-red-50 hover:border-red-200 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500">Last received: {wh.lastReceived} · Total events: {wh.totalEvents}</p>
                </div>
              ))}
            </div>
            <button type="button" onClick={openWebhookModal} className="rounded-lg border border-dashed border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">
              + Add new webhook
            </button>
            <div className="rounded-xl border border-indigo-200 bg-indigo-500/5 p-4 flex gap-3">
              <span className="text-indigo-600 shrink-0">ℹ</span>
              <p className="text-sm text-slate-700">To connect your website contact form, set the form action URL to your Website Contact Form webhook above. AI subagents will automatically create leads and trigger AI follow-up emails.</p>
            </div>
            {copyFeedback && <p className="text-sm text-emerald-600">Copied {copyFeedback} to clipboard.</p>}
          </section>
        )}

        {activeTab === 'notifications' && (
          <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Notification Preferences</h2>
            <p className="mt-1 text-sm text-slate-500">How and when you get notified about AI agent activity</p>
            <ul className="mt-6 space-y-4">
              {[
                { key: 'ai-needs-human', label: 'AI needs human response', desc: "When the AI can't confidently answer a message" },
                { key: 'new-lead', label: 'New lead received', desc: 'When a website form submission comes in' },
                { key: 'lead-follow-up', label: 'Lead follow-up sent', desc: 'Confirmation when AI sends a follow-up email' },
                { key: 'review-completed', label: 'Review completed', desc: 'When a customer submits a review' },
                { key: 'daily-summary', label: 'Daily summary', desc: 'End-of-day recap of all agent activity' },
                { key: 'weekly-analytics', label: 'Weekly analytics report', desc: 'Weekly performance metrics and trends' },
              ].map(({ key, label, desc }) => (
                <li key={key} className="flex items-center justify-between gap-4 rounded-lg border border-slate-100 bg-slate-50/50 px-4 py-3">
                  <div>
                    <p className="font-medium text-slate-900">{label}</p>
                    <p className="text-sm text-slate-500">{desc}</p>
                  </div>
                  <Toggle on={notifToggles[key]} onClick={() => setNotifToggles((t) => ({ ...t, [key]: !t[key] }))} />
                </li>
              ))}
            </ul>
            <div className="mt-6 border-t border-slate-100 pt-6">
              <p className="font-medium text-slate-900">Notification Channels</p>
              <p className="text-sm text-slate-500">Where to send notifications</p>
              <div className="mt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setNotifChannel('email')}
                  className={`flex flex-1 items-center gap-3 rounded-xl border-2 p-4 text-left ${notifChannel === 'email' ? 'border-indigo-500 bg-indigo-500/5' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                >
                  <span className="text-2xl">✉</span>
                  <div>
                    <p className="font-medium text-slate-900">Email</p>
                    <p className="text-sm text-slate-500">miko@irontemple.com</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setNotifChannel('sms')}
                  className={`flex flex-1 items-center gap-3 rounded-xl border-2 p-4 text-left ${notifChannel === 'sms' ? 'border-indigo-500 bg-indigo-500/5' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                >
                  <span className="text-2xl">📱</span>
                  <div>
                    <p className="font-medium text-slate-900">SMS</p>
                    <p className="text-sm text-slate-500">(704) 555-0100</p>
                  </div>
                </button>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'billing' && (
          <section className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Billing</h2>
              <p className="mt-1 text-sm text-slate-500">Manage your subscription and payment details.</p>
            </div>
            <div className="w-full max-w-md rounded-2xl bg-indigo-600 p-5 text-white">
              <p className="text-sm font-medium opacity-90">Current Plan</p>
              <p className="mt-1 text-lg font-bold">Growth Plan</p>
              <p className="mt-1 text-sm opacity-90">$400/month — All 3 AI agents, unlimited messages</p>
              <p className="mt-3 text-xs opacity-80">Next billing: Apr 1, 2026 · Status: Active</p>
            </div>
            <div className="max-w-md rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <h3 className="font-semibold text-slate-900">Payment method</h3>
              <p className="mt-1 text-sm text-slate-500">Add or update the card used for billing.</p>
              <button type="button" className="mt-4 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-500">
                Add payment method
              </button>
            </div>
            <div className="max-w-md rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <h3 className="font-semibold text-slate-900">Usage This Month</h3>
              <ul className="mt-4 space-y-2 text-sm">
                <li className="flex justify-between"><span className="text-slate-600">AI Messages Processed</span><span className="font-medium text-slate-900">847 / Unlimited</span></li>
                <li className="flex justify-between"><span className="text-slate-600">Lead Follow-Ups Sent</span><span className="font-medium text-slate-900">23 / Unlimited</span></li>
                <li className="flex justify-between"><span className="text-slate-600">Review Requests Sent</span><span className="font-medium text-slate-900">12 / Unlimited</span></li>
                <li className="flex justify-between"><span className="text-slate-600">API Calls (Claude)</span><span className="font-medium text-slate-900">1,247 / Included</span></li>
              </ul>
            </div>
          </section>
        )}
      </div>

      {/* Modals */}
      {modalOpen === 'channel' && (
        <Modal title="Add channel" onClose={() => setModalOpen(null)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Name</label>
              <input type="text" value={channelForm.name} onChange={(e) => setChannelForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Instagram DMs" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Description</label>
              <input type="text" value={channelForm.description} onChange={(e) => setChannelForm((f) => ({ ...f, description: e.target.value }))} placeholder="What this channel does" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Account (optional)</label>
              <input type="text" value={channelForm.account} onChange={(e) => setChannelForm((f) => ({ ...f, account: e.target.value }))} placeholder="e.g. @handle or email" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setModalOpen(null)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
              <button type="button" onClick={saveChannel} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500">Add</button>
            </div>
          </div>
        </Modal>
      )}
      {modalOpen === 'api' && (
        <Modal title="Add API connection" onClose={() => setModalOpen(null)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Name</label>
              <input type="text" value={apiForm.name} onChange={(e) => setApiForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Meta Graph API" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Description</label>
              <input type="text" value={apiForm.description} onChange={(e) => setApiForm((f) => ({ ...f, description: e.target.value }))} placeholder="What this API does" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">API Key (optional)</label>
              <input type="text" value={apiForm.apiKey} onChange={(e) => setApiForm((f) => ({ ...f, apiKey: e.target.value }))} placeholder="Paste API key" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm text-slate-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Webhook URL (optional)</label>
              <input type="text" value={apiForm.webhookUrl} onChange={(e) => setApiForm((f) => ({ ...f, webhookUrl: e.target.value }))} placeholder="https://..." className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm text-slate-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Review link (optional)</label>
              <input type="text" value={apiForm.reviewLink} onChange={(e) => setApiForm((f) => ({ ...f, reviewLink: e.target.value }))} placeholder="https://..." className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm text-slate-900" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setModalOpen(null)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
              <button type="button" onClick={saveApi} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500">Add</button>
            </div>
          </div>
        </Modal>
      )}
      {/* Remove confirmation modal */}
      {removeConfirm && (
        <Modal title="Remove connection" onClose={() => setRemoveConfirm(null)}>
          <p className="text-slate-600">
            Are you sure you want to remove &quot;{removeConfirm.name}&quot;?
          </p>
          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setRemoveConfirm(null)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmRemove}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500"
            >
              Remove
            </button>
          </div>
        </Modal>
      )}

      {modalOpen === 'webhook' && (
        <Modal title="Add webhook" onClose={() => setModalOpen(null)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Name</label>
              <input type="text" value={webhookForm.name} onChange={(e) => setWebhookForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Website Contact Form" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">URL</label>
              <input type="text" value={webhookForm.url} onChange={(e) => setWebhookForm((f) => ({ ...f, url: e.target.value }))} placeholder="https://app.agenthub.io/api/webhooks/..." className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm text-slate-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Type</label>
              <select value={webhookForm.type} onChange={(e) => setWebhookForm((f) => ({ ...f, type: e.target.value as 'inbound' | 'outbound' }))} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900">
                <option value="inbound">Inbound</option>
                <option value="outbound">Outbound</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setModalOpen(null)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
              <button type="button" onClick={saveWebhook} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500">Add</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50" onClick={onClose} aria-hidden />
      <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl" role="dialog" aria-modal aria-labelledby="modal-title">
        <h2 id="modal-title" className="text-lg font-semibold text-slate-900">{title}</h2>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  )
}

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onClick}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${on ? 'bg-indigo-600' : 'bg-slate-300'}`}
    >
      <span className={`absolute top-1 left-1 h-4 w-4 rounded-full bg-white shadow transition-transform ${on ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  )
}

function UserIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
    </svg>
  )
}
function ChatIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
    </svg>
  )
}
function LinkIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
    </svg>
  )
}
function WebhookIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
    </svg>
  )
}

function ChannelIcon({ key_ }: { key_: ChannelIconKey }) {
  const c = 'h-5 w-5 shrink-0'
  if (key_ === 'instagram') return <svg className={c} viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0z" /></svg>
  if (key_ === 'facebook') return <svg className={c} viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
  if (key_ === 'email') return <svg className={c} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" /></svg>
  if (key_ === 'website') return <svg className={c} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" /></svg>
  return <ChatIcon />
}

function ApiIcon({ key_ }: { key_: ApiIconKey }) {
  const c = 'h-5 w-5 shrink-0'
  if (key_ === 'meta') return <svg className={c} viewBox="0 0 24 24" fill="#1877F2" aria-hidden><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
  if (key_ === 'resend') return <svg className={c} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" /></svg>
  if (key_ === 'mindbody' || key_ === 'vagaro') return <svg className={c} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25a2.25 2.25 0 0 0 2.25 2.25h13.5A2.25 2.25 0 0 0 21.75 14.25V3m-18 0h18M5.25 3h.75m-.75 0h-.75m.75 0v.75m-.75 0h.75m-.75 0h.75m.75-3h.75m-.75 0h-.75m.75 0v.75m-.75 0h.75M5.25 9h.75m-.75 0h-.75m.75 0v6.75m-.75 0h.75m-.75 0h.75" /></svg>
  if (key_ === 'google') return <svg className={c} viewBox="0 0 24 24" aria-hidden><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
  if (key_ === 'stripe') return <svg className={c} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" /></svg>
  return <LinkIcon />
}

function CardIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
    </svg>
  )
}
