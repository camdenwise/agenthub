// POST /api/messages/[businessId]
// Incoming customer messages from Zapier webhooks. Creates or updates conversations,
// runs Claude when configured, notifies manager on low confidence.
// Uses the same Supabase URL + keys as lib/supabase.ts; server routes should set
// SUPABASE_SERVICE_ROLE_KEY in .env for inserts that bypass RLS (falls back to anon key).

import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
}

type Channel = 'instagram' | 'facebook' | 'email' | 'web_chat'

function withCors(res: NextResponse) {
  Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v))
  return res
}

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient(url, key)
}

function getString(
  raw: Record<string, string>,
  keys: string[]
): string | undefined {
  for (const k of keys) {
    const v = raw[k]
    if (v != null && String(v).trim() !== '') return String(v).trim()
    const lower = raw[k.toLowerCase()]
    if (lower != null && String(lower).trim() !== '') return String(lower).trim()
  }
  return undefined
}

/** Normalize JSON or flat form fields into a single string map. */
async function parseIncomingBody(req: NextRequest): Promise<Record<string, string>> {
  const contentType = req.headers.get('content-type') ?? ''

  if (contentType.includes('application/json')) {
    try {
      const json = (await req.json()) as Record<string, unknown>
      const out: Record<string, string> = {}
      for (const [k, v] of Object.entries(json)) {
        if (v == null) continue
        if (typeof v === 'object') out[k] = JSON.stringify(v)
        else out[k] = String(v)
      }
      return out
    } catch {
      return {}
    }
  }

  if (
    contentType.includes('application/x-www-form-urlencoded') ||
    contentType.includes('multipart/form-data')
  ) {
    const fd = await req.formData()
    const out: Record<string, string> = {}
    fd.forEach((value, key) => {
      if (typeof value === 'string') out[key] = value
    })
    return out
  }

  // Fallback: try JSON
  try {
    const text = await req.text()
    if (!text.trim()) return {}
    const json = JSON.parse(text) as Record<string, unknown>
    const out: Record<string, string> = {}
    for (const [k, v] of Object.entries(json)) {
      if (v == null) continue
      out[k] = typeof v === 'object' ? JSON.stringify(v) : String(v)
    }
    return out
  } catch {
    return {}
  }
}

function normalizeChannel(raw: string): Channel | null {
  const n = raw.trim().toLowerCase().replace(/[-\s]/g, '_')
  if (n === 'instagram' || n === 'ig') return 'instagram'
  if (n === 'facebook' || n === 'fb' || n === 'messenger') return 'facebook'
  if (n === 'email' || n === 'e_mail') return 'email'
  if (
    n === 'web_chat' ||
    n === 'webchat' ||
    n === 'website' ||
    n === 'chat' ||
    n === 'widget'
  )
    return 'web_chat'
  return null
}

function buildCustomerName(raw: Record<string, string>): string | undefined {
  return getString(raw, [
    'customerName',
    'customer_name',
    'name',
    'sender_name',
    'senderName',
    'from',
    'From',
    'full_name',
    'contact_name',
  ])
}

function buildMessageText(raw: Record<string, string>): string | undefined {
  return getString(raw, [
    'message',
    'text',
    'body',
    'content',
    'Message',
    'Body',
  ])
}

function parseAiResponse(raw: string): { content: string; confidence: 'high' | 'low' } {
  const trimmed = raw.trim()
  const unsure = /^\[UNSURE\]/i.test(trimmed)
  const confidence: 'high' | 'low' = unsure ? 'low' : 'high'
  const content = unsure
    ? trimmed.replace(/^\[UNSURE\]\s*/i, '').trim() || trimmed
    : trimmed
  return { content, confidence }
}

type RouteContext = { params: Promise<{ businessId: string }> }

export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }))
}

export async function POST(req: NextRequest, context: RouteContext) {
  const { businessId } = await context.params
  if (!businessId) {
    return withCors(
      NextResponse.json({ error: 'Missing businessId' }, { status: 400 })
    )
  }

  const raw = await parseIncomingBody(req)
  const customerName = buildCustomerName(raw)
  const messageText = buildMessageText(raw)
  const channelRaw = getString(raw, [
    'channel',
    'Channel',
    'platform',
    'Platform',
    'source',
    'Source',
    'source_channel',
  ])
  const externalThreadId =
    getString(raw, [
      'externalThreadId',
      'external_thread_id',
      'threadId',
      'thread_id',
      'conversationId',
      'conversation_id',
      'sender_id',
      'senderId',
    ]) ?? null

  if (!customerName || !messageText) {
    return withCors(
      NextResponse.json(
        {
          error:
            'Missing required fields: message (or text/body/content) and customer name',
        },
        { status: 400 }
      )
    )
  }

  if (!channelRaw) {
    return withCors(
      NextResponse.json(
        { error: 'Missing required field: channel (or platform/source)' },
        { status: 400 }
      )
    )
  }

  const channel = normalizeChannel(channelRaw)
  if (!channel) {
    return withCors(
      NextResponse.json(
        {
          error:
            'Invalid channel. Use instagram, facebook, email, or web_chat (or web chat).',
        },
        { status: 400 }
      )
    )
  }

  const supabase = getSupabase()

  const { data: business, error: bizError } = await supabase
    .from('businesses')
    .select('id, name, manager_email, manager_name')
    .eq('id', businessId)
    .maybeSingle()

  if (bizError || !business) {
    return withCors(NextResponse.json({ error: 'Business not found' }, { status: 404 }))
  }

  const now = new Date().toISOString()
  const customerMsg = {
    role: 'customer' as const,
    content: messageText,
    time: now,
  }

  let conversation: {
    id: string
    messages: Array<{
      role: string
      content: string
      time: string
      confidence?: string
    }>
  } | null = null

  if (externalThreadId) {
    const { data } = await supabase
      .from('conversations')
      .select('id, messages')
      .eq('business_id', businessId)
      .eq('external_thread_id', externalThreadId)
      .maybeSingle()
    conversation = data
  } else {
    const { data: rows } = await supabase
      .from('conversations')
      .select('id, messages')
      .eq('business_id', businessId)
      .eq('channel', channel)
      .ilike('customer_name', customerName.trim())
      .is('external_thread_id', null)
      .order('updated_at', { ascending: false })
      .limit(1)
    conversation = rows?.[0] ?? null
  }

  if (!conversation) {
    const { data: newConvo, error: insertErr } = await supabase
      .from('conversations')
      .insert({
        business_id: businessId,
        channel,
        external_thread_id: externalThreadId,
        customer_name: customerName.trim(),
        status: 'active',
        messages: [customerMsg],
        updated_at: now,
      })
      .select('id, messages')
      .single()

    if (insertErr || !newConvo) {
      console.error('Failed to create conversation:', insertErr)
      return withCors(
        NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 })
      )
    }
    conversation = newConvo
  } else {
    const prev = Array.isArray(conversation.messages) ? conversation.messages : []
    const updatedMessages = [...prev, customerMsg]
    const { error: upErr } = await supabase
      .from('conversations')
      .update({ messages: updatedMessages, updated_at: now })
      .eq('id', conversation.id)

    if (upErr) {
      console.error('Failed to update conversation:', upErr)
      return withCors(
        NextResponse.json({ error: 'Failed to save message' }, { status: 500 })
      )
    }
    conversation = { ...conversation, messages: updatedMessages }
  }

  const conversationId = conversation.id

  const { data: instructionDoc } = await supabase
    .from('instruction_docs')
    .select('id, content')
    .eq('business_id', businessId)
    .eq('is_active', true)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle()

  const anthropicKey = process.env.ANTHROPIC_API_KEY

  const logAgent = async (row: {
    agent_type: string
    input_message: string
    output_message: string
    confidence?: string | null
    channel?: string
  }) => {
    await supabase.from('agent_logs').insert({
      business_id: businessId,
      agent_type: row.agent_type,
      input_message: row.input_message,
      output_message: row.output_message,
      confidence: row.confidence ?? null,
      channel: row.channel ?? channel,
    })
  }

  const respond = (
    body: Record<string, unknown>,
    status = 200
  ) => withCors(NextResponse.json(body, { status }))

  if (!instructionDoc?.content?.trim()) {
    await logAgent({
      agent_type: 'dm_responder',
      input_message: messageText,
      output_message:
        'Warning: No active instruction document — AI response skipped.',
      confidence: 'error',
      channel,
    })

    return respond({
      success: true,
      conversationId,
      aiResponse: '',
      confidence: null,
      needsHuman: false,
      warning: 'No active instruction document; message saved without AI response.',
    })
  }

  if (!anthropicKey) {
    await logAgent({
      agent_type: 'dm_responder',
      input_message: messageText,
      output_message: 'Error: ANTHROPIC_API_KEY is not configured.',
      confidence: 'error',
      channel,
    })
    return respond({
      success: true,
      conversationId,
      aiResponse: '',
      confidence: null,
      needsHuman: false,
      warning: 'AI not configured; message saved.',
    })
  }

  const priorMessages = conversation.messages.slice(0, -1)
  const historySlice = priorMessages.slice(-10)
  const historyForApi = historySlice.map((m) => ({
    role: (m.role === 'customer' ? 'user' : 'assistant') as 'user' | 'assistant',
    content: m.content,
  }))

  const anthropicMessages = [
    ...historyForApi.map((m) => ({
      role: m.role,
      content: m.content,
    })),
    { role: 'user' as const, content: messageText },
  ]

  const instructionContent = instructionDoc.content.trim()
  const systemPrompt = `You are responding to a social media DM for a local business. Be conversational, warm, and concise (2-4 sentences). You ONLY answer based on the instruction document provided. If a question cannot be answered from this document, respond with exactly: [UNSURE] followed by a brief explanation.

INSTRUCTION DOCUMENT:
---
${instructionContent}
---`

  let rawAssistantText: string
  try {
    const anthropic = new Anthropic({ apiKey: anthropicKey })
    const msg = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages: anthropicMessages,
    })

    const textBlock = msg.content.find((b) => b.type === 'text')
    rawAssistantText =
      textBlock && textBlock.type === 'text' ? textBlock.text : ''
  } catch (err) {
    const emsg = err instanceof Error ? err.message : String(err)
    console.error('Anthropic error (messages route):', err)
    await logAgent({
      agent_type: 'dm_responder',
      input_message: messageText,
      output_message: `AI error: ${emsg}`,
      confidence: 'error',
      channel,
    })
    return respond({
      success: true,
      conversationId,
      aiResponse: '',
      confidence: null,
      needsHuman: false,
      warning: 'AI request failed; customer message saved.',
    })
  }

  const { content: replyBody, confidence } = parseAiResponse(rawAssistantText)
  const agentTime = new Date().toISOString()

  const agentMsg = {
    role: 'agent' as const,
    content: replyBody,
    time: agentTime,
    confidence,
  }

  const finalMessages = [...conversation.messages, agentMsg]
  const newStatus = confidence === 'high' ? 'active' : 'needs_human'

  await supabase
    .from('conversations')
    .update({
      messages: finalMessages,
      status: newStatus,
      updated_at: agentTime,
    })
    .eq('id', conversationId)

  let notifyNote = ''
  if (confidence === 'low' && business.manager_email && process.env.RESEND_API_KEY) {
    const domain = process.env.RESEND_DOMAIN || 'agenthub.io'
    const resend = new Resend(process.env.RESEND_API_KEY)
    const channelLabel =
      channel === 'web_chat'
        ? 'web chat'
        : channel.charAt(0).toUpperCase() + channel.slice(1)
    const plain = `${customerName.trim()} sent a message on ${channelLabel} that the AI couldn't confidently answer. Their message: ${messageText}. Please log into AgentHub to respond.`
    const { error: sendErr } = await resend.emails.send({
      from: `AgentHub <notifications@${domain}>`,
      to: business.manager_email,
      subject: `[Action needed] ${customerName.trim()} — ${business.name || 'AgentHub'}`,
      html: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;"><p style="font-size: 15px; color: #374151; line-height: 1.6;">${plain
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')}</p></div>`,
    })
    if (sendErr) {
      console.error('Resend notify error:', sendErr)
      notifyNote = `\n[notify failed: ${sendErr.message}]`
    } else {
      notifyNote = '\n[notify: manager emailed]'
    }
  } else if (confidence === 'low') {
    notifyNote = !process.env.RESEND_API_KEY
      ? '\n[notify: skipped — RESEND_API_KEY not set]'
      : '\n[notify: skipped — manager_email not set]'
  }

  await logAgent({
    agent_type: 'dm_responder',
    input_message: messageText,
    output_message: rawAssistantText + notifyNote,
    confidence,
    channel,
  })

  return respond({
    success: true,
    conversationId,
    aiResponse: replyBody,
    confidence,
    needsHuman: confidence === 'low',
    ...(notifyNote.includes('failed') ? { warning: 'Manager notification email failed to send.' } : {}),
  })
}
