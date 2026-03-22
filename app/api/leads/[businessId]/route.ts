// POST /api/leads/[businessId]
// Lead intake for Zapier webhooks and HTML contact forms (JSON or form-urlencoded).
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

function buildLeadName(raw: Record<string, string>): string | undefined {
  const first = getString(raw, ['firstName', 'first_name', 'FirstName', 'first'])
  const last = getString(raw, ['lastName', 'last_name', 'LastName', 'last'])
  const full = getString(raw, ['name', 'fullName', 'full_name', 'Name', 'contact_name'])
  if (full) return full
  if (first && last) return `${first} ${last}`.trim()
  if (first) return first
  if (last) return last
  return undefined
}

function buildLeadEmail(raw: Record<string, string>): string | undefined {
  return getString(raw, [
    'email',
    'Email',
    'emailAddress',
    'email_address',
    'mail',
    'contact_email',
  ])
}

function parseAnthropicEmail(text: string): { subject: string; body: string } {
  const lines = text.trim().split('\n')
  let subject = 'Thank you for reaching out'
  let start = 0
  const first = lines[0]?.trim() ?? ''
  const subjectMatch = first.match(/^Subject:\s*(.+)$/i)
  if (subjectMatch) {
    subject = subjectMatch[1].trim()
    start = 1
  }
  const body = lines.slice(start).join('\n').trim()
  return { subject, body }
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
  const name = buildLeadName(raw)
  const email = buildLeadEmail(raw)?.toLowerCase()

  if (!name || !email) {
    return withCors(
      NextResponse.json(
        { error: 'Missing required fields: name (or firstName/lastName) and email' },
        { status: 400 }
      )
    )
  }

  const phone = getString(raw, ['phone', 'Phone', 'phoneNumber', 'phone_number', 'tel'])
  const message =
    getString(raw, ['message', 'Message', 'body', 'notes', 'comments', 'description']) ??
    undefined
  const interest =
    getString(raw, ['interest', 'Interest', 'topic', 'service', 'inquiry_type']) ??
    'General inquiry'
  const referral = getString(raw, ['referral', 'Referral', 'source_detail', 'how_heard']) ?? null
  const source =
    getString(raw, ['source', 'Source', 'utm_source']) ?? 'webhook'

  const supabase = getSupabase()

  const { data: business, error: bizError } = await supabase
    .from('businesses')
    .select('id, name, manager_email, manager_name')
    .eq('id', businessId)
    .maybeSingle()

  if (bizError || !business) {
    return withCors(NextResponse.json({ error: 'Business not found' }, { status: 404 }))
  }

  const { data: instructionDoc } = await supabase
    .from('instruction_docs')
    .select('id, content')
    .eq('business_id', businessId)
    .eq('is_active', true)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle()

  const { data: lead, error: leadError } = await supabase
    .from('leads')
    .insert({
      business_id: businessId,
      name,
      email,
      phone: phone ?? null,
      source,
      interest,
      form_message: message ?? null,
      referral,
      status: 'new',
    })
    .select('id')
    .single()

  if (leadError || !lead) {
    console.error('Lead insert failed:', leadError)
    return withCors(
      NextResponse.json({ error: 'Failed to create lead' }, { status: 500 })
    )
  }

  const leadId = lead.id as string

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
      channel: row.channel ?? 'email',
    })
  }

  if (!instructionDoc?.content?.trim()) {
    await logAgent({
      agent_type: 'lead_intake',
      input_message: `Lead created: ${name} <${email}>`,
      output_message:
        'Warning: No active instruction document — follow-up email skipped.',
      confidence: 'n/a',
      channel: 'email',
    })

    return withCors(
      NextResponse.json({
        success: true,
        leadId,
        followUpSent: false,
        warning: 'No active instruction document; lead saved without AI follow-up.',
      })
    )
  }

  const anthropicKey = process.env.ANTHROPIC_API_KEY
  if (!anthropicKey) {
    await logAgent({
      agent_type: 'lead_intake',
      input_message: `Lead created: ${name} <${email}>`,
      output_message: 'Error: ANTHROPIC_API_KEY is not configured.',
      confidence: 'error',
      channel: 'email',
    })
    return withCors(
      NextResponse.json({
        success: true,
        leadId,
        followUpSent: false,
        warning: 'AI not configured; lead saved.',
      })
    )
  }

  const systemPrompt = `You write follow-up emails for a local business. You will receive:
1) The business instruction document (brand voice, offers, and important links / CTAs).
2) Details about a new lead and their inquiry.

Write a warm, professional follow-up email that:
- References their specific interest and any message they left.
- Sounds human and helpful, not robotic.
- Includes a clear call-to-action using a relevant link or next step from the instruction document (e.g. booking, trial, schedule). If the document mentions multiple links, pick the best match for this lead.
- Keeps the email concise (roughly 3–6 short paragraphs or fewer).

Output format (required):
- The FIRST line must be the subject line, exactly like: Subject: Your subject here
- After that, a blank line, then the email body (plain text, no markdown).`

  const userContent = `## Instruction document (business context)
${instructionDoc.content}

## Lead
- Name: ${name}
- Email: ${email}
${phone ? `- Phone: ${phone}` : ''}
- Interest: ${interest}
${message ? `- Message:\n${message}` : ''}
${referral ? `- Referral / how they heard: ${referral}` : ''}

Write the follow-up email now.`

  let subject: string
  let body: string

  try {
    const anthropic = new Anthropic({ apiKey: anthropicKey })
    const msg = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: 'user', content: userContent }],
    })

    const textBlock = msg.content.find((b) => b.type === 'text')
    const rawText =
      textBlock && textBlock.type === 'text' ? textBlock.text : ''
    const parsed = parseAnthropicEmail(rawText)
    subject = parsed.subject
    body = parsed.body

    await logAgent({
      agent_type: 'lead_intake',
      input_message: `Lead: ${name} (${email}) — ${interest}`,
      output_message: rawText,
      confidence: 'high',
      channel: 'email',
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('Anthropic lead follow-up error:', err)
    await logAgent({
      agent_type: 'lead_intake',
      input_message: `Lead created: ${name} <${email}>`,
      output_message: `AI follow-up failed: ${msg}`,
      confidence: 'error',
      channel: 'email',
    })
    return withCors(
      NextResponse.json({
        success: true,
        leadId,
        followUpSent: false,
        warning: 'AI follow-up failed; lead saved.',
      })
    )
  }

  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) {
    await logAgent({
      agent_type: 'lead_intake',
      input_message: `Lead: ${name} <${email}>`,
      output_message: 'Error: RESEND_API_KEY is not configured.',
      confidence: 'error',
      channel: 'email',
    })
    return withCors(
      NextResponse.json({
        success: true,
        leadId,
        followUpSent: false,
        warning: 'Email not configured; lead saved.',
      })
    )
  }

  const domain = process.env.RESEND_DOMAIN || 'agenthub.io'
  const fromName = business.name || 'Our team'
  const fromAddress = `hello@${domain}`

  const resend = new Resend(resendKey)
  const htmlBody = body
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>')
    .replace(
      /(https?:\/\/[^\s<]+)/g,
      '<a href="$1" style="color: #4F46E5; text-decoration: underline;">$1</a>'
    )

  const { error: sendErr } = await resend.emails.send({
    from: `${fromName} <${fromAddress}>`,
    to: email,
    subject,
    html: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;"><p style="font-size: 15px; color: #374151; line-height: 1.7;">${htmlBody}</p></div>`,
    ...(business.manager_email
      ? { replyTo: business.manager_email }
      : {}),
  })

  const sentAt = new Date().toISOString()
  const followUpPayload = {
    subject,
    body,
    sentAt,
    sent_at: sentAt,
  }

  if (sendErr) {
    console.error('Resend error:', sendErr)
    await logAgent({
      agent_type: 'lead_intake',
      input_message: `Lead: ${name} <${email}>`,
      output_message: `Email send failed: ${sendErr.message}`,
      confidence: 'error',
      channel: 'email',
    })
    return withCors(
      NextResponse.json({
        success: true,
        leadId,
        followUpSent: false,
        warning: 'Follow-up email could not be sent; lead saved.',
      })
    )
  }

  await supabase
    .from('leads')
    .update({
      status: 'contacted',
      follow_up_email: followUpPayload,
      updated_at: sentAt,
    })
    .eq('id', leadId)

  return withCors(
    NextResponse.json({
      success: true,
      leadId,
      followUpSent: true,
    })
  )
}
