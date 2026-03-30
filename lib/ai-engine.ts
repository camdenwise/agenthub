// lib/ai-engine.ts
// Core AI Engine — powers all three agents (DM responder, Lead agent, Review agent)
 
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
 
// ============================================================
// TYPES
// ============================================================
 
export type AgentMode = "dm" | "lead" | "review";
export type Confidence = "high" | "low" | "error";
 
export interface Message {
  role: "customer" | "agent";
  content: string;
  time?: string;
}
 
export interface AIResponse {
  content: string;
  confidence: Confidence;
  isSpam?: boolean;
}
 
export interface DMRequest {
  mode: "dm";
  businessId: string;
  instructionDoc: string;
  conversationHistory: Message[];
  newMessage: string;
}
 
export interface LeadRequest {
  mode: "lead";
  businessId: string;
  instructionDoc: string;
  leadName: string;
  leadEmail: string;
  leadInterest: string;
  leadMessage: string;
  referralSource: string;
}
 
export interface ReviewRequest {
  mode: "review";
  businessId: string;
  instructionDoc: string;
  customerName: string;
  milestone: string;
  visitCount: number;
  reviewLink: string;
}
 
export type AIRequest = DMRequest | LeadRequest | ReviewRequest;
 
// ============================================================
// SPAM FILTER
// ============================================================
 
const SPAM_PATTERNS = [
  /\b(crypto|bitcoin|ethereum|nft|forex|trading signal)/i,
  /\b(make \$?\d+.*per (day|hour|week|month))/i,
  /\b(work from home.*\$)/i,
  /\b(click (here|this link)|tap (here|the link))\b/i,
  /\b(dm me for|check my bio|link in bio)\b/i,
  /\b(free money|cash ?app|venmo me|paypal me)\b/i,
  /\b(18\+|onlyfans|s[e3]xy|h[o0]t girls?|dating)\b/i,
  /\b(congratulations.*won|you'?ve been selected|claim your prize)\b/i,
  /\b(investment opportunity|guaranteed returns|passive income)\b/i,
  /\b(weight loss pill|diet pill|miracle cure)\b/i,
  /\b(follow (me|back)|f4f|follow for follow)\b/i,
  /\b(hot deals?|limited offer|act now)\b/i,
];
 
export function detectSpam(message: string): boolean {
  const normalized = message.toLowerCase().trim();
 
  // Very short messages with links are suspicious
  if (normalized.length < 20 && /https?:\/\//.test(normalized)) return true;
 
  // Check against spam patterns
  const matchCount = SPAM_PATTERNS.filter((p) => p.test(normalized)).length;
 
  // 2+ pattern matches = almost certainly spam
  if (matchCount >= 2) return true;
 
  // 1 match + link = likely spam
  if (matchCount >= 1 && /https?:\/\//.test(normalized)) return true;
 
  return false;
}
 
// ============================================================
// SUPABASE SERVICE CLIENT (bypasses RLS)
// ============================================================

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// ============================================================
// SYSTEM PROMPTS
// ============================================================
 
async function getActiveTemporaryNotes(businessId: string): Promise<string[]> {
  try {
    const supabase = getServiceClient();
    const nowIso = new Date().toISOString();

    const { data, error } = await supabase
      .from("temporary_notes")
      .select("content")
      .eq("business_id", businessId)
      .lte("starts_at", nowIso)
      .gt("expires_at", nowIso)
      .order("starts_at", { ascending: false });

    if (error) {
      console.error("Temporary notes fetch error:", error);
      return [];
    }

    return (data ?? [])
      .map((note) => note.content?.trim())
      .filter((content): content is string => Boolean(content));
  } catch (error) {
    console.error("Temporary notes client error:", error);
    return [];
  }
}

async function buildSystemPrompt(request: AIRequest): Promise<string> {
  const activeTemporaryNotes = await getActiveTemporaryNotes(request.businessId);
  console.log("TEMP NOTES DEBUG:", activeTemporaryNotes);

  const temporaryUpdatesSection =
    activeTemporaryNotes.length > 0
      ? `\n\nIMPORTANT CURRENT UPDATES:\n${activeTemporaryNotes.map((note) => `- ${note}`).join("\n")}\n`
      : "";

  const baseRules = `CRITICAL RULES:
1. You ONLY answer questions using information from the INSTRUCTION DOCUMENT below. Do NOT make up information, guess, or use general knowledge.
2. If the instruction document contains an "IMPORTANT CURRENT UPDATES" section, that information is the most current and accurate. It ALWAYS overrides and replaces any conflicting information elsewhere in the document. When a current update contradicts other information (such as hours, closures, schedules, or promotions), answer using ONLY the current update — do NOT flag it as a conflict or say you are unsure.
3. If a question cannot be answered from the instruction document (including current updates), you MUST start your response with exactly "[UNSURE]" followed by a brief, friendly explanation that you'll get someone to help.
4. Never mention that you are an AI, a bot, or that you're reading from a document. Respond as if you are a friendly staff member.
5. Match the tone described in the instruction document.
6. Never share internal business information not meant for customers (like pricing margins, staff details, etc.).`;
 
  switch (request.mode) {
    case "dm":
      return `You are responding to a customer's social media DM or message on behalf of a business. Be conversational, warm, and concise (2-4 sentences max). Use casual, friendly language like you're talking to a friend. If someone seems nervous or unsure, be extra encouraging and welcoming.
 
${baseRules}
 
INSTRUCTION DOCUMENT:
${temporaryUpdatesSection}${request.instructionDoc}`;
 
    case "lead":
      return `You are writing a follow-up email to a potential customer who submitted a contact form on the business website. Your goal is to convert them into a paying customer.
 
Guidelines:
- Be warm, professional, and personalized — reference their specific inquiry
- Always include a clear call-to-action with a specific link from the instruction document
- Create gentle urgency without being pushy
- Keep it concise but compelling (no more than 150 words for the body)
- Sign off with the business name
- Format your response as:
  Subject: [subject line here]
  
  [email body here]
 
${baseRules}
 
INSTRUCTION DOCUMENT:
${temporaryUpdatesSection}${request.instructionDoc}`;
 
    case "review":
      return `You are writing a personalized review request message to a valued customer. Your goal is to get them to leave a Google review.
 
Guidelines:
- Be warm and genuinely appreciative
- Congratulate them on their milestone (mention it specifically)
- Keep it short and friendly (3-5 sentences)
- Include the review link naturally
- Don't be pushy — make it feel like a personal note, not a marketing email
 
${baseRules}
 
INSTRUCTION DOCUMENT:
${temporaryUpdatesSection}${request.instructionDoc}`;
  }
}
 
function buildUserMessage(request: AIRequest): string {
  switch (request.mode) {
    case "dm":
      return request.newMessage;
 
    case "lead":
      return `A potential customer submitted a contact form. Here is their info:
 
Name: ${request.leadName}
Email: ${request.leadEmail}
Interest: ${request.leadInterest}
Message: "${request.leadMessage}"
Referral source: ${request.referralSource}
 
Write a follow-up email to this lead. Include a subject line on the first line prefixed with "Subject: ", then a blank line, then the email body. Reference their specific interest and include the appropriate call-to-action link from the instruction document.`;
 
    case "review":
      return `Write a review request for this customer:
 
Name: ${request.customerName}
Milestone: ${request.milestone}
Total visits: ${request.visitCount}
Review link: ${request.reviewLink}
 
Write a short, warm message congratulating them and asking them to leave a Google review. Include the review link.`;
  }
}
 
function buildMessages(request: AIRequest): { role: "user" | "assistant"; content: string }[] {
  if (request.mode === "dm" && request.conversationHistory.length > 0) {
    // Include conversation history for context
    const history = request.conversationHistory.map((m) => ({
      role: (m.role === "customer" ? "user" : "assistant") as "user" | "assistant",
      content: m.content,
    }));
    // Add the new message
    return [...history, { role: "user" as const, content: request.newMessage }];
  }
 
  return [{ role: "user" as const, content: buildUserMessage(request) }];
}
 
// ============================================================
// AI ENGINE
// ============================================================
 
// Create the client only when needed (so env vars are loaded first)
function getClient() {
  return new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });
}
 
export async function callAIEngine(request: AIRequest): Promise<AIResponse> {
  // Spam check for DM mode
  if (request.mode === "dm") {
    if (detectSpam(request.newMessage)) {
      return {
        content: "",
        confidence: "high",
        isSpam: true,
      };
    }
  }
 
  try {
    const systemPrompt = await buildSystemPrompt(request);
    const messages = buildMessages(request);
 
    const response = await getClient().messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: systemPrompt,
      messages,
    });
 
    // Extract text from response
    const text = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("\n");
 
    if (!text) {
      return {
        content: "I'm sorry, I wasn't able to generate a response. A team member will follow up shortly!",
        confidence: "error",
      };
    }
 
    // Check for [UNSURE] tag
    const isUnsure = text.startsWith("[UNSURE]");
    const cleanContent = text.replace(/^\[UNSURE\]\s*/i, "").trim();
 
    return {
      content: cleanContent,
      confidence: isUnsure ? "low" : "high",
    };
  } catch (error) {
    console.error("AI Engine error:", error);
    return {
      content: "We're experiencing a brief technical issue. A team member will follow up shortly!",
      confidence: "error",
    };
  }
}
 
// ============================================================
// HELPER: Parse lead email response
// ============================================================
 
export function parseLeadEmail(content: string): { subject: string; body: string } {
  const lines = content.split("\n");
  const subjectLine = lines.find((l) => l.toLowerCase().startsWith("subject:"));
  const subject = subjectLine?.replace(/^subject:\s*/i, "").trim() || "Thanks for reaching out!";
 
  // Everything after the subject line (skip blank lines between subject and body)
  const subjectIndex = lines.indexOf(subjectLine || "");
  const bodyLines = lines.slice(subjectIndex + 1);
  const body = bodyLines.join("\n").trim();
 
  return { subject, body };
}