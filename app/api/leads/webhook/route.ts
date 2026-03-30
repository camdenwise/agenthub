// app/api/leads/webhook/route.ts
// Receives website contact form submissions and automatically:
// 1. Creates a lead in Supabase
// 2. Calls the AI engine to generate a follow-up email
// 3. Sends the follow-up email via Resend
// 4. Updates the lead record with the sent email
//
// Test with:
// curl -X POST http://localhost:3000/api/leads/webhook -H "Content-Type: application/json" -d '{"businessId":"YOUR_BUSINESS_ID","name":"Test Person","email":"test@example.com","phone":"(704) 555-0000","interest":"Monthly membership","message":"I want to join!","referral":"Google"}'

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { callAIEngine, parseLeadEmail } from "@/lib/ai-engine";
import { sendLeadFollowUp, notifyManager } from "@/lib/notify-manager";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { businessId, name, email, phone, interest, message, referral } = body;

    // Validate required fields
    if (!businessId || !name || !email) {
      return NextResponse.json(
        { error: "Missing required fields: businessId, name, email" },
        { status: 400 }
      );
    }

    // Verify the business exists
    const { data: business, error: bizError } = await supabase
      .from("businesses")
      .select("id, name, manager_name, manager_email")
      .eq("id", businessId)
      .single();

    if (bizError || !business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    // Get the active instruction doc
    const { data: instructionDoc } = await supabase
      .from("instruction_docs")
      .select("content")
      .eq("business_id", businessId)
      .eq("is_active", true)
      .order("version", { ascending: false })
      .limit(1)
      .single();

    // Create the lead in Supabase
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .insert({
        business_id: businessId,
        name,
        email,
        phone: phone || null,
        source: "website",
        interest: interest || "General inquiry",
        form_message: message || null,
        referral: referral || null,
        status: "new",
      })
      .select("id")
      .single();

    if (leadError) {
      console.error("Failed to create lead:", leadError);
      return NextResponse.json({ error: "Failed to create lead" }, { status: 500 });
    }

    console.log(`✅ Lead created: ${name} (${lead.id})`);

    // If we have an instruction doc, generate and send AI follow-up
    if (instructionDoc?.content) {
      const aiResult = await callAIEngine({
        mode: "lead",
        businessId,
        instructionDoc: instructionDoc.content,
        leadName: name,
        leadEmail: email,
        leadInterest: interest || "General inquiry",
        leadMessage: message || "",
        referralSource: referral || "Unknown",
      });

      // Log the AI interaction
      await supabase.from("agent_logs").insert({
        business_id: businessId,
        agent_type: "lead_agent",
        input_message: `Lead webhook: ${name} (${email}) - ${interest}`,
        output_message: aiResult.content,
        confidence: aiResult.confidence,
        channel: "email",
      });

      if (aiResult.confidence === "high") {
        const { subject, body: emailBody } = parseLeadEmail(aiResult.content);

        // Send the actual email
        const emailResult = await sendLeadFollowUp({
          toEmail: email,
          toName: name,
          subject,
          body: emailBody,
          businessName: business.name,
        });

        // Update the lead with the follow-up email
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
          .eq("id", lead.id);

        console.log(`✅ Follow-up email sent to ${email} (${emailResult.success ? "delivered" : "failed"})`);

        return NextResponse.json({
          success: true,
          leadId: lead.id,
          followUpSent: true,
          emailDelivered: emailResult.success,
        });
      } else {
        // AI wasn't confident — notify manager instead
        if (business.manager_email) {
          await notifyManager({
            managerEmail: business.manager_email,
            managerName: business.manager_name || "Manager",
            businessName: business.name,
            customerName: name,
            channel: "website form",
            lastMessage: message || interest || "New lead inquiry",
            conversationId: lead.id,
          });
        }

        return NextResponse.json({
          success: true,
          leadId: lead.id,
          followUpSent: false,
          reason: "AI confidence too low, manager notified",
        });
      }
    }

    // No instruction doc — just create the lead, no email
    return NextResponse.json({
      success: true,
      leadId: lead.id,
      followUpSent: false,
      reason: "No instruction document configured",
    });
  } catch (error) {
    console.error("Lead webhook error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}