// app/api/notify/route.ts
// Standalone endpoint for triggering manager notifications
// Used by webhooks and external services that need to alert the manager
 
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { notifyManager } from "@/lib/notify-manager";
 
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
 
export async function POST(req: NextRequest) {
  try {
    const { businessId, customerName, channel, message, conversationId } = await req.json();
 
    if (!businessId) {
      return NextResponse.json({ error: "Missing businessId" }, { status: 400 });
    }
 
    // Fetch the business
    const { data: business, error } = await supabase
      .from("businesses")
      .select("name, manager_name, manager_email")
      .eq("id", businessId)
      .single();
 
    if (error || !business || !business.manager_email) {
      return NextResponse.json({ error: "Business not found or no manager email" }, { status: 404 });
    }
 
    const result = await notifyManager({
      managerEmail: business.manager_email,
      managerName: business.manager_name || "Manager",
      businessName: business.name,
      customerName: customerName || "A customer",
      channel: channel || "unknown",
      lastMessage: message || "New message requires attention",
      conversationId: conversationId || "",
    });
 
    return NextResponse.json(result);
  } catch (error) {
    console.error("Notify route error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}