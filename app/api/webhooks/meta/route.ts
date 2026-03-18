// app/api/webhooks/meta/route.ts
// Receives Instagram DMs and Facebook Messenger messages via Meta webhook
//
// Two endpoints:
// GET  — Meta verification challenge (required during app setup)
// POST — Incoming messages from Instagram/Facebook
//
// This endpoint is ready to go once Meta approves your app.
// Until then, you can test with fake POST requests from the terminal.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { callAIEngine } from "@/lib/ai-engine";
import { notifyManager } from "@/lib/notify-manager";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ============================================================
// GET — Meta webhook verification
// ============================================================
// When you set up the webhook in Meta Developer dashboard,
// Meta sends a GET request to verify you own this URL.

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.META_VERIFY_TOKEN) {
    console.log("✅ Meta webhook verified");
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Verification failed" }, { status: 403 });
}

// ============================================================
// POST — Incoming messages from Meta
// ============================================================

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Meta sends a specific structure for messaging webhooks
    const entries = body.entry ?? [];

    for (const entry of entries) {
      const messaging = entry.messaging ?? entry.changes ?? [];

      for (const event of messaging) {
        // Handle Instagram messages
        if (event.field === "messages" && event.value) {
          await handleInstagramMessage(event.value);
          continue;
        }

        // Handle Facebook Messenger messages
        if (event.message && event.sender) {
          await handleFacebookMessage(event);
          continue;
        }
      }
    }

    // Meta requires a 200 response quickly
    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("Meta webhook error:", error);
    // Still return 200 so Meta doesn't retry endlessly
    return NextResponse.json({ status: "error" }, { status: 200 });
  }
}

// ============================================================
// Instagram DM handler
// ============================================================

async function handleInstagramMessage(value: any) {
  const senderId = value.sender?.id;
  const messageText = value.message?.text;
  const pageId = value.recipient?.id;

  if (!senderId || !messageText || !pageId) return;

  // Find the business by their Meta page ID
  const { data: business } = await supabase
    .from("businesses")
    .select("id, name, manager_name, manager_email, meta_access_token")
    .eq("meta_page_id", pageId)
    .single();

  if (!business) {
    console.log(`No business found for page ID: ${pageId}`);
    return;
  }

  await processIncomingMessage({
    businessId: business.id,
    businessName: business.name,
    managerName: business.manager_name,
    managerEmail: business.manager_email,
    accessToken: business.meta_access_token,
    channel: "instagram",
    externalThreadId: senderId,
    customerName: `Instagram User ${senderId.slice(-4)}`,
    messageText,
    replyFunction: (text: string) => sendInstagramReply(senderId, text, business.meta_access_token),
  });
}

// ============================================================
// Facebook Messenger handler
// ============================================================

async function handleFacebookMessage(event: any) {
  const senderId = event.sender.id;
  const messageText = event.message?.text;
  const recipientId = event.recipient?.id;

  if (!senderId || !messageText || !recipientId) return;

  // Find the business by their Meta page ID
  const { data: business } = await supabase
    .from("businesses")
    .select("id, name, manager_name, manager_email, meta_access_token")
    .eq("meta_page_id", recipientId)
    .single();

  if (!business) {
    console.log(`No business found for page ID: ${recipientId}`);
    return;
  }

  await processIncomingMessage({
    businessId: business.id,
    businessName: business.name,
    managerName: business.manager_name,
    managerEmail: business.manager_email,
    accessToken: business.meta_access_token,
    channel: "facebook",
    externalThreadId: senderId,
    customerName: `Facebook User ${senderId.slice(-4)}`,
    messageText,
    replyFunction: (text: string) => sendFacebookReply(senderId, text, recipientId, business.meta_access_token),
  });
}

// ============================================================
// Shared message processing logic
// ============================================================

interface ProcessMessageParams {
  businessId: string;
  businessName: string;
  managerName: string | null;
  managerEmail: string | null;
  accessToken: string | null;
  channel: "instagram" | "facebook";
  externalThreadId: string;
  customerName: string;
  messageText: string;
  replyFunction: (text: string) => Promise<void>;
}

async function processIncomingMessage(params: ProcessMessageParams) {
  const {
    businessId, businessName, managerName, managerEmail,
    channel, externalThreadId, customerName, messageText, replyFunction,
  } = params;

  // Find or create conversation
  let { data: conversation } = await supabase
    .from("conversations")
    .select("*")
    .eq("business_id", businessId)
    .eq("external_thread_id", externalThreadId)
    .single();

  const now = new Date().toISOString();
  const timeStr = new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });

  const customerMsg = { role: "customer", content: messageText, time: timeStr };

  if (!conversation) {
    // Create new conversation
    const { data: newConvo } = await supabase
      .from("conversations")
      .insert({
        business_id: businessId,
        channel,
        external_thread_id: externalThreadId,
        customer_name: customerName,
        status: "active",
        messages: [customerMsg],
      })
      .select("*")
      .single();

    conversation = newConvo;
  } else {
    // Append message to existing conversation
    const updatedMessages = [...(conversation.messages || []), customerMsg];
    await supabase
      .from("conversations")
      .update({ messages: updatedMessages, updated_at: now })
      .eq("id", conversation.id);

    conversation.messages = updatedMessages;
  }

  if (!conversation) return;

  // Get instruction doc
  const { data: instructionDoc } = await supabase
    .from("instruction_docs")
    .select("content")
    .eq("business_id", businessId)
    .eq("is_active", true)
    .order("version", { ascending: false })
    .limit(1)
    .single();

  if (!instructionDoc?.content) return;

  // Call AI engine
  const aiResult = await callAIEngine({
    mode: "dm",
    instructionDoc: instructionDoc.content,
    conversationHistory: conversation.messages.slice(0, -1), // everything before the new message
    newMessage: messageText,
  });

  // Log the interaction
  await supabase.from("agent_logs").insert({
    business_id: businessId,
    agent_type: "dm_responder",
    input_message: messageText,
    output_message: aiResult.content,
    confidence: aiResult.confidence,
    channel,
  });

  if (aiResult.isSpam) {
    // Mark as spam, don't reply
    await supabase
      .from("conversations")
      .update({ status: "spam", updated_at: now })
      .eq("id", conversation.id);
    return;
  }

  if (aiResult.confidence === "high") {
    // Send the reply via Meta API
    try {
      await replyFunction(aiResult.content);
    } catch (err) {
      console.error("Failed to send reply via Meta:", err);
    }

    // Save AI response to conversation
    const agentMsg = { role: "agent", content: aiResult.content, time: timeStr, confidence: "high" };
    const finalMessages = [...conversation.messages, agentMsg];

    await supabase
      .from("conversations")
      .update({ messages: finalMessages, status: "active", updated_at: now })
      .eq("id", conversation.id);
  } else {
    // Low confidence — don't reply, flag for human, notify manager
    const agentMsg = { role: "agent", content: aiResult.content, time: timeStr, confidence: "low" };
    const finalMessages = [...conversation.messages, agentMsg];

    await supabase
      .from("conversations")
      .update({ messages: finalMessages, status: "needs_human", updated_at: now })
      .eq("id", conversation.id);

    if (managerEmail) {
      await notifyManager({
        managerEmail,
        managerName: managerName || "Manager",
        businessName,
        customerName,
        channel,
        lastMessage: messageText,
        conversationId: conversation.id,
      });
    }
  }
}

// ============================================================
// Meta API reply functions
// ============================================================

async function sendInstagramReply(recipientId: string, text: string, accessToken: string | null) {
  if (!accessToken) throw new Error("No Meta access token");

  await fetch(`https://graph.facebook.com/v18.0/me/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      recipient: { id: recipientId },
      message: { text },
    }),
  });
}

async function sendFacebookReply(recipientId: string, text: string, pageId: string, accessToken: string | null) {
  if (!accessToken) throw new Error("No Meta access token");

  await fetch(`https://graph.facebook.com/v18.0/${pageId}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      recipient: { id: recipientId },
      message: { text },
    }),
  });
}