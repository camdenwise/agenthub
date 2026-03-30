// app/api/ai/respond/route.ts
// Main API endpoint for all AI agent interactions
// Called by: Messages page (DM mode), Leads page (lead mode), Reviews page (review mode)
 
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { callAIEngine, parseLeadEmail } from "@/lib/ai-engine";
import type { DMRequest, LeadRequest, ReviewRequest } from "@/lib/ai-engine";
import { notifyManager, sendLeadFollowUp, sendReviewRequest } from "@/lib/notify-manager";
 
// Use service role key for server-side operations (bypasses RLS)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
 
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { mode, businessId } = body;
 
    if (!mode || !businessId) {
      return NextResponse.json({ error: "Missing mode or businessId" }, { status: 400 });
    }
 
    // Fetch the business and its active instruction doc
    const { data: business, error: bizError } = await supabase
      .from("businesses")
      .select("*")
      .eq("id", businessId)
      .single();
 
    if (bizError || !business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }
 
    const { data: instructionDoc } = await supabase
      .from("instruction_docs")
      .select("content")
      .eq("business_id", businessId)
      .eq("is_active", true)
      .order("version", { ascending: false })
      .limit(1)
      .single();
 
    if (!instructionDoc?.content) {
      return NextResponse.json(
        { error: "No active instruction document found. Please add one in Instruction Files." },
        { status: 400 }
      );
    }
 
    // ============================================================
    // DM MODE
    // ============================================================
    if (mode === "dm") {
      const { conversationId, conversationHistory, newMessage, channel, customerName } = body;
 
      if (!newMessage) {
        return NextResponse.json({ error: "Missing newMessage" }, { status: 400 });
      }
 
      const request: DMRequest = {
        mode: "dm",
        businessId,
        instructionDoc: instructionDoc.content,
        conversationHistory: conversationHistory || [],
        newMessage,
      };
 
      const result = await callAIEngine(request);
 
      // If spam, mark conversation as spam and return
      if (result.isSpam) {
        if (conversationId) {
          await supabase
            .from("conversations")
            .update({ status: "spam", updated_at: new Date().toISOString() })
            .eq("id", conversationId);
        }
        return NextResponse.json({ content: "", confidence: "high", isSpam: true });
      }
 
      // Log the interaction
      await supabase.from("agent_logs").insert({
        business_id: businessId,
        agent_type: "dm_responder",
        input_message: newMessage,
        output_message: result.content,
        confidence: result.confidence,
        channel: channel || "unknown",
      });
 
      // If low confidence, flag conversation and notify manager
      if (result.confidence === "low") {
        if (conversationId) {
          await supabase
            .from("conversations")
            .update({ status: "needs_human", updated_at: new Date().toISOString() })
            .eq("id", conversationId);
        }
 
        // Send manager notification email
        if (business.manager_email) {
          await notifyManager({
            managerEmail: business.manager_email,
            managerName: business.manager_name || "Manager",
            businessName: business.name,
            customerName: customerName || "A customer",
            channel: channel || "message",
            lastMessage: newMessage,
            conversationId: conversationId || "",
          });
        }
      }
 
      // If high confidence, update conversation with the AI response
      if (result.confidence === "high" && conversationId) {
        // Append the AI response to the messages array
        const updatedMessages = [
          ...(conversationHistory || []),
          { role: "customer", content: newMessage, time: new Date().toISOString() },
          { role: "agent", content: result.content, time: new Date().toISOString(), confidence: "high" },
        ];
 
        await supabase
          .from("conversations")
          .update({
            messages: updatedMessages,
            status: "active",
            updated_at: new Date().toISOString(),
          })
          .eq("id", conversationId);
      }
 
      return NextResponse.json({
        content: result.content,
        confidence: result.confidence,
      });
    }
 
    // ============================================================
    // LEAD MODE
    // ============================================================
    if (mode === "lead") {
      const { leadId, leadName, leadEmail, leadInterest, leadMessage, referralSource } = body;
 
      if (!leadName || !leadEmail) {
        return NextResponse.json({ error: "Missing lead info" }, { status: 400 });
      }
 
      const request: LeadRequest = {
        mode: "lead",
        businessId,
        instructionDoc: instructionDoc.content,
        leadName,
        leadEmail,
        leadInterest: leadInterest || "General inquiry",
        leadMessage: leadMessage || "",
        referralSource: referralSource || "Unknown",
      };
 
      const result = await callAIEngine(request);
 
      // Log the interaction
      await supabase.from("agent_logs").insert({
        business_id: businessId,
        agent_type: "lead_agent",
        input_message: `Lead: ${leadName} (${leadEmail}) - ${leadInterest}`,
        output_message: result.content,
        confidence: result.confidence,
        channel: "email",
      });
 
      if (result.confidence === "high") {
        // Parse the email subject and body
        const { subject, body: emailBody } = parseLeadEmail(result.content);
 
        // Send the actual follow-up email
        const emailResult = await sendLeadFollowUp({
          toEmail: leadEmail,
          toName: leadName,
          subject,
          body: emailBody,
          businessName: business.name,
        });
 
        // Update the lead record
        if (leadId) {
          await supabase
            .from("leads")
            .update({
              status: "contacted",
              follow_up_email: {
                subject,
                body: emailBody,
                sent_at: new Date().toISOString(),
                delivery_success: emailResult.success,
              },
              updated_at: new Date().toISOString(),
            })
            .eq("id", leadId);
        }
 
        return NextResponse.json({
          content: result.content,
          confidence: result.confidence,
          emailSent: emailResult.success,
          subject,
          body: emailBody,
        });
      }
 
      // Low confidence or error — don't send email, notify manager
      if (business.manager_email) {
        await notifyManager({
          managerEmail: business.manager_email,
          managerName: business.manager_name || "Manager",
          businessName: business.name,
          customerName: leadName,
          channel: "website form",
          lastMessage: leadMessage || leadInterest || "New lead inquiry",
          conversationId: leadId || "",
        });
      }
 
      return NextResponse.json({
        content: result.content,
        confidence: result.confidence,
        emailSent: false,
      });
    }
 
    // ============================================================
    // REVIEW MODE
    // ============================================================
    if (mode === "review") {
      const { customerName, customerEmail, milestone, visitCount } = body;
 
      if (!customerName || !customerEmail) {
        return NextResponse.json({ error: "Missing customer info" }, { status: 400 });
      }
 
      const reviewLink = business.review_link || "https://g.page/review";
 
      const request: ReviewRequest = {
        mode: "review",
        businessId,
        instructionDoc: instructionDoc.content,
        customerName,
        milestone: milestone || "milestone",
        visitCount: visitCount || 0,
        reviewLink,
      };
 
      const result = await callAIEngine(request);
 
      // Log the interaction
      await supabase.from("agent_logs").insert({
        business_id: businessId,
        agent_type: "review_agent",
        input_message: `Review request: ${customerName} - ${milestone}`,
        output_message: result.content,
        confidence: result.confidence,
        channel: "email",
      });
 
      if (result.confidence === "high") {
        // Send the review request email
        const emailResult = await sendReviewRequest({
          toEmail: customerEmail,
          toName: customerName,
          body: result.content,
          businessName: business.name,
        });
 
        return NextResponse.json({
          content: result.content,
          confidence: result.confidence,
          emailSent: emailResult.success,
        });
      }
 
      return NextResponse.json({
        content: result.content,
        confidence: result.confidence,
        emailSent: false,
      });
    }
 
    return NextResponse.json({ error: "Invalid mode. Use: dm, lead, or review" }, { status: 400 });
  } catch (error) {
    console.error("AI respond route error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}