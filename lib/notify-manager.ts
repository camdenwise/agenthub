// lib/notify-manager.ts
// Sends email notifications to the business manager when AI needs human help
 
import { Resend } from "resend";
 
const resend = new Resend(process.env.RESEND_API_KEY);
 
interface NotifyManagerParams {
  managerEmail: string;
  managerName: string;
  businessName: string;
  customerName: string;
  channel: string;
  lastMessage: string;
  conversationId: string;
}
 
export async function notifyManager({
  managerEmail,
  managerName,
  businessName,
  customerName,
  channel,
  lastMessage,
  conversationId,
}: NotifyManagerParams): Promise<{ success: boolean; error?: string }> {
  try {
    // Truncate the message for the email preview
    const truncatedMessage =
      lastMessage.length > 200 ? lastMessage.slice(0, 200) + "..." : lastMessage;
 
    const { error } = await resend.emails.send({
      from: `AgentHub <notifications@${process.env.RESEND_DOMAIN || "agenthub.io"}>`,
      to: managerEmail,
      subject: `[Action Needed] ${customerName} needs a human response — ${businessName}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
          <div style="background: linear-gradient(135deg, #4F46E5, #7C3AED); border-radius: 12px; padding: 20px 24px; margin-bottom: 24px;">
            <h1 style="color: #fff; font-size: 18px; margin: 0;">⚡ AgentHub Alert</h1>
          </div>
          
          <p style="font-size: 15px; color: #374151; line-height: 1.6;">
            Hi ${managerName},
          </p>
          
          <p style="font-size: 15px; color: #374151; line-height: 1.6;">
            Your AI agent received a message it couldn't confidently answer. The customer is waiting for a response.
          </p>
          
          <div style="background: #F7F8FA; border: 1px solid #E8ECF1; border-radius: 10px; padding: 18px; margin: 20px 0;">
            <div style="font-size: 13px; color: #8A919E; margin-bottom: 4px;">Customer</div>
            <div style="font-size: 15px; font-weight: 600; color: #1A1F36; margin-bottom: 12px;">${customerName}</div>
            
            <div style="font-size: 13px; color: #8A919E; margin-bottom: 4px;">Channel</div>
            <div style="font-size: 15px; font-weight: 600; color: #1A1F36; margin-bottom: 12px; text-transform: capitalize;">${channel}</div>
            
            <div style="font-size: 13px; color: #8A919E; margin-bottom: 4px;">Their message</div>
            <div style="font-size: 15px; color: #374151; line-height: 1.5; background: #fff; border: 1px solid #E8ECF1; border-radius: 8px; padding: 12px;">${truncatedMessage}</div>
          </div>
          
          <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://app.agenthub.io"}/messages?id=${conversationId}" 
             style="display: inline-block; background: #4F46E5; color: #fff; font-weight: 600; font-size: 15px; padding: 12px 28px; border-radius: 10px; text-decoration: none; margin-top: 8px;">
            View & Respond →
          </a>
          
          <p style="font-size: 13px; color: #8A919E; margin-top: 24px; line-height: 1.5;">
            This notification was sent by AgentHub because your AI agent flagged this conversation for human review. The customer has not received a response yet.
          </p>
        </div>
      `,
    });
 
    if (error) {
      console.error("Resend error:", error);
      return { success: false, error: error.message };
    }
 
    return { success: true };
  } catch (error) {
    console.error("Notify manager error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
 
// ============================================================
// Send lead follow-up email to the actual lead
// ============================================================
 
interface SendLeadEmailParams {
  toEmail: string;
  toName: string;
  subject: string;
  body: string;
  businessName: string;
}
 
export async function sendLeadFollowUp({
  toEmail,
  toName,
  subject,
  body,
  businessName,
}: SendLeadEmailParams): Promise<{ success: boolean; error?: string }> {
  try {
    // Convert plain text body to HTML (preserve line breaks and links)
    const htmlBody = body
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\n/g, "<br>")
      .replace(
        /(https?:\/\/[^\s<]+)/g,
        '<a href="$1" style="color: #4F46E5; text-decoration: underline;">$1</a>'
      );
 
    const { error } = await resend.emails.send({
      from: `${businessName} <hello@${process.env.RESEND_DOMAIN || "agenthub.io"}>`,
      to: toEmail,
      subject,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
          <p style="font-size: 15px; color: #374151; line-height: 1.7;">
            ${htmlBody}
          </p>
        </div>
      `,
    });
 
    if (error) {
      console.error("Resend lead email error:", error);
      return { success: false, error: error.message };
    }
 
    return { success: true };
  } catch (error) {
    console.error("Send lead follow-up error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
 
// ============================================================
// Send review request email
// ============================================================
 
interface SendReviewRequestParams {
  toEmail: string;
  toName: string;
  body: string;
  businessName: string;
}
 
export async function sendReviewRequest({
  toEmail,
  toName,
  body,
  businessName,
}: SendReviewRequestParams): Promise<{ success: boolean; error?: string }> {
  try {
    const htmlBody = body
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\n/g, "<br>")
      .replace(
        /(https?:\/\/[^\s<]+)/g,
        '<a href="$1" style="color: #4F46E5; text-decoration: underline;">$1</a>'
      );
 
    const { error } = await resend.emails.send({
      from: `${businessName} <hello@${process.env.RESEND_DOMAIN || "agenthub.io"}>`,
      to: toEmail,
      subject: `${toName}, we'd love your feedback! ⭐`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
          <p style="font-size: 15px; color: #374151; line-height: 1.7;">
            ${htmlBody}
          </p>
        </div>
      `,
    });
 
    if (error) {
      console.error("Resend review email error:", error);
      return { success: false, error: error.message };
    }
 
    return { success: true };
  } catch (error) {
    console.error("Send review request error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}