// app/api/signup/route.ts
// Creates a business record after signup using the service role key
// This bypasses RLS so the insert always works

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { userId, email, businessName } = await req.json();

    if (!userId || !email) {
      return NextResponse.json({ error: "Missing userId or email" }, { status: 400 });
    }

    // Check if business already exists for this user
    const { data: existing } = await supabase
      .from("businesses")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ success: true, businessId: existing.id, existing: true });
    }

    // Create the business record
    const { data: business, error } = await supabase
      .from("businesses")
      .insert({
        user_id: userId,
        name: businessName?.trim() || "My Business",
        manager_email: email,
        onboarded: false,
      })
      .select("id")
      .single();

    if (error) {
      console.error("Failed to create business:", error);
      return NextResponse.json({ error: "Failed to create business" }, { status: 500 });
    }

    // Create an empty instruction doc so the AI engine has something to work with
    await supabase.from("instruction_docs").insert({
      business_id: business.id,
      content: "",
      version: 1,
      is_active: true,
    });

    return NextResponse.json({ success: true, businessId: business.id, existing: false });
  } catch (error) {
    console.error("Signup route error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}