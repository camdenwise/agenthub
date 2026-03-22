// POST /api/messages/[businessId]
// Incoming customer messages from Zapier / integrations. Creates or updates conversations,
// runs Claude when configured, notifies manager on low confidence.

import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { notifyManager } from '@/lib/notify-manager'

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

async function parseIncomingBody(
  req: NextRequest
): Promise<Record<string, string>> {
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

function formatTime(): string {
  return new Date().toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
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
  const channelRaw = getString(raw, ['channel', 'Channel', 'source_channel', 'platform'])
  const externalThreadId =
    getString(raw, [
      'externalThreadId',
      'external_thread_id',
      'thread_id',
      'threadId',
      'conversation_id',
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
        { error: 'Missing required field: channel' },
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
    .select('id, name, manager_name, manager_email')
    .eq('id', businessId)
    .maybeSingle()

  if (bizError || !business) {
    return withCors(NextResponse.json({ error: 'Business not found' }, { status: 404 }))
  }

  const now = new Date().toISOString()
  const timeStr = formatTime()
  const customerMsg = {
    role: 'customer' as const,
    content: messageText,
    time: timeStr,
  }

  // Find existing conversation
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

  const { data: instructionRow } = await supabase
    .from('instruction_docs')
    .select('content')
    .eq('business_id', businessId)
    .eq('is_active', true)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle()

  const instructionDoc = instructionRow?.content?.trim() ?? ''
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

  if (!anthropicKey || !instructionDoc) {
    await logAgent({
      agent_type: 'zapier_dm',
      input_message: messageText,
      output_message: !anthropicKey
        ? 'Skipped AI: ANTHROPIC_API_KEY not set'
        : 'Skipped AI: no active instruction document',
      confidence: 'n/a',
      channel,
    })

    return withCors(
      NextResponse.json({
        success: true,
        conversationId,
        response: null,
        confidence: null,
        skipped: !anthropicKey ? 'anthropic' : 'instruction_doc',
      })
    )
  }

  const priorMessages = conversation.messages.slice(0, -1)
  const historyForApi = priorMessages.map((m) => ({
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

  const systemPrompt = `You are responding to a customer's social media DM, website chat, or similar message on behalf of a local business.

Style:
- Be conversational, warm, and concise — aim for 2-4 sentences.
- Write as a friendly staff member, not as an AI.

Rules:
- ONLY use information from the INSTRUCTION DOCUMENT below to answer. Do not invent facts, prices, hours, or policies that are not stated there.
- If you cannot fully answer from the instruction document alone, start your ENTIRE reply with exactly the characters [UNSURE] (including the brackets), then add a brief, friendly sentence offering to have someone follow up.
- Do not mention that you are an AI or that you read an internal document.

INSTRUCTION DOCUMENT:
---
${instructionDoc}
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
      agent_type: 'zapier_dm',
      input_message: messageText,
      output_message: `AI error: ${emsg}`,
      confidence: 'error',
      channel,
    })
    return withCors(
      NextResponse.json({
        success: true,
        conversationId,
        response: null,
        confidence: null,
        error: 'AI request failed',
      })
    )
  }

  const { content: replyBody, confidence } = parseAiResponse(rawAssistantText)

  const agentMsg = {
    role: 'agent' as const,
    content: replyBody,
    time: formatTime(),
    confidence,
  }

  const finalMessages = [...conversation.messages, agentMsg]
  const newStatus = confidence === 'high' ? 'active' : 'needs_human'

  await supabase
    .from('conversations')
    .update({
      messages: finalMessages,
      status: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', conversationId)

  let logOutput = rawAssistantText
  if (confidence === 'low') {
    if (process.env.RESEND_API_KEY && business.manager_email) {
      await notifyManager({
        managerEmail: business.manager_email,
        managerName: business.manager_name || 'Manager',
        businessName: business.name || 'Your business',
        customerName: customerName.trim(),
        channel,
        lastMessage: messageText,
        conversationId,
      })
      logOutput += '\n[notify: manager emailed]'
    } else {
      logOutput += !process.env.RESEND_API_KEY
        ? '\n[notify: skipped — RESEND_API_KEY not set]'
        : '\n[notify: skipped — manager_email not set]'
    }
  }

  await logAgent({
    agent_type: 'zapier_dm',
    input_message: messageText,
    output_message: logOutput,
    confidence,
    channel,
  })

  return withCors(
    NextResponse.json({
      success: true,
      conversationId,
      response: replyBody,
      confidence,
    })
  )
}
