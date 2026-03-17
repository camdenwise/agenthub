// scripts/seed-database.ts
// Run with: npx tsx scripts/seed-database.ts
//
// Creates a test business (Iron Temple Gym), instruction doc, sample conversations,
// and sample leads in your Supabase database.
// Safe to run multiple times — it checks for existing data first.

import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const INSTRUCTION_DOC = `Business: Iron Temple Gym
Location: 4521 Trade Street, Charlotte, NC 28203
Website: www.irontemple.com

HOURS:
Monday-Friday: 5:00 AM - 10:00 PM
Saturday: 7:00 AM - 8:00 PM
Sunday: 8:00 AM - 6:00 PM

MEMBERSHIP OPTIONS:
- Day Pass: $15
- Monthly (No Contract): $49/month
- Annual Membership: $39/month (billed annually at $468)
- Student Rate: $35/month (valid .edu email required)
- Family Plan: $79/month (up to 4 members)
All memberships include full gym access, locker rooms, and free WiFi.

CLASSES (included with membership):
- Spin: Mon/Wed/Fri 6AM & 6PM
- Yoga: Tue/Thu 7AM & 5:30PM
- HIIT: Mon/Wed/Fri 12PM & 5PM
- Boxing Fundamentals: Tue/Thu 6PM
- Saturday Boot Camp: 9AM

PERSONAL TRAINING:
- Single Session: $65
- 5-Pack: $300 ($60/session)
- 10-Pack: $550 ($55/session)
Free 30-min intro session with any new membership.

PARKING:
Free parking lot behind the building (entrance off 4th St). Street parking also available. We validate parking at the Trade Street deck for up to 2 hours.

AMENITIES:
Full locker rooms with showers and towel service, Sauna (6AM-9PM), Smoothie bar (7AM-7PM weekdays, 8AM-4PM weekends), Free WiFi, Childcare Mon-Fri 8AM-12PM (ages 6mo-8yr, free with membership).

TRIAL OFFER:
First-timers get a FREE 3-day pass. No credit card required. Just stop by the front desk with a valid ID.

LEAD CONVERSION:
When someone inquires, always try to get them to take a specific next step. Based on their interest:
- General inquiry → Offer free 3-day pass, link: www.irontemple.com/free-trial
- Class interest → Offer free first class, link: www.irontemple.com/schedule
- Personal training → Highlight free 30-min intro session, link: www.irontemple.com/book-pt
- Family/childcare → Invite for a tour, link: www.irontemple.com/tour
- Student → Offer free week trial, link: www.irontemple.com/student-trial
Always include the relevant link. Create urgency but don't be pushy.

TONE: Friendly, energetic, welcoming. Casual language like talking to a friend. If someone seems nervous, be extra encouraging.`;

async function seed() {
  console.log("=".repeat(60));
  console.log("AgentHub — Database Seed Script");
  console.log("=".repeat(60));

  // Step 1: Find or identify the auth user
  console.log("\n1. Looking for existing auth user...");
  const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();

  if (usersError) {
    console.error("❌ Could not list users:", usersError.message);
    console.log("   Make sure SUPABASE_SERVICE_ROLE_KEY is set correctly in .env.local");
    return;
  }

  if (!users || users.length === 0) {
    console.log("❌ No auth users found. Please sign up at your app first (localhost:3000/signup),");
    console.log("   then run this script again.");
    return;
  }

  const user = users[0];
  console.log(`✅ Found user: ${user.email} (${user.id})`);

  // Step 2: Check if business already exists
  console.log("\n2. Checking for existing business...");
  const { data: existingBiz } = await supabase
    .from("businesses")
    .select("id, name")
    .eq("user_id", user.id)
    .maybeSingle();

  let businessId: string;

  if (existingBiz) {
    console.log(`✅ Business already exists: ${existingBiz.name} (${existingBiz.id})`);
    businessId = existingBiz.id;
  } else {
    console.log("   Creating Iron Temple Gym...");
    const { data: newBiz, error: bizErr } = await supabase
      .from("businesses")
      .insert({
        user_id: user.id,
        name: "Iron Temple Gym",
        address: "4521 Trade Street, Charlotte, NC 28203",
        phone: "(704) 555-0100",
        website: "www.irontemple.com",
        industry: "gym",
        manager_name: "Mike Reynolds",
        manager_email: user.email,
        review_link: "https://g.page/r/irontemple-clt/review",
        onboarded: true,
      })
      .select("id")
      .single();

    if (bizErr) {
      console.error("❌ Failed to create business:", bizErr.message);
      console.log("   This might be an RLS issue. Check your Supabase policies.");
      return;
    }

    businessId = newBiz.id;
    console.log(`✅ Created business: Iron Temple Gym (${businessId})`);
  }

  // Step 3: Create instruction doc (if none exists)
  console.log("\n3. Setting up instruction document...");
  const { data: existingDoc } = await supabase
    .from("instruction_docs")
    .select("id")
    .eq("business_id", businessId)
    .eq("is_active", true)
    .maybeSingle();

  if (existingDoc) {
    console.log("✅ Active instruction doc already exists");
  } else {
    const { error: docErr } = await supabase.from("instruction_docs").insert({
      business_id: businessId,
      content: INSTRUCTION_DOC,
      version: 1,
      is_active: true,
    });

    if (docErr) {
      console.error("❌ Failed to create instruction doc:", docErr.message);
    } else {
      console.log("✅ Created instruction document (Iron Temple Gym)");
    }
  }

  // Step 4: Create sample conversations
  console.log("\n4. Creating sample conversations...");
  const { data: existingConvos } = await supabase
    .from("conversations")
    .select("id")
    .eq("business_id", businessId)
    .limit(1);

  if (existingConvos && existingConvos.length > 0) {
    console.log("✅ Conversations already exist, skipping");
  } else {
    const conversations = [
      {
        business_id: businessId,
        channel: "instagram",
        customer_name: "Sarah Mitchell",
        status: "active",
        messages: [
          { role: "customer", content: "Hey! I've been thinking about joining a gym. What do you guys offer?", time: "10:15 AM" },
          { role: "agent", content: "Hey Sarah! We'd love to have you! We've got a full gym with classes like Spin, Yoga, HIIT, and Boxing. Memberships start at just $39/month. First-timers get a FREE 3-day pass — no credit card needed! Check it out: www.irontemple.com/free-trial", time: "10:15 AM", confidence: "high" },
          { role: "customer", content: "What time do your spin classes start?", time: "10:22 AM" },
        ],
      },
      {
        business_id: businessId,
        channel: "facebook",
        customer_name: "James Rodriguez",
        status: "needs_human",
        messages: [
          { role: "customer", content: "Hi, I'm the HR director at Lumen Technologies. Do you offer corporate wellness programs or group rates for employees?", time: "9:45 AM" },
          { role: "agent", content: "That's a great question! I'm not sure about specific corporate programs, but let me get someone from our team to reach out to you directly.", time: "9:46 AM", confidence: "low" },
        ],
      },
      {
        business_id: businessId,
        channel: "instagram",
        customer_name: "Alex Chen",
        status: "active",
        messages: [
          { role: "customer", content: "Is there parking?", time: "9:05 AM" },
        ],
      },
      {
        business_id: businessId,
        channel: "email",
        customer_name: "Maria Santos",
        status: "resolved",
        messages: [
          { role: "customer", content: "Do you have childcare?", time: "7:12 AM" },
          { role: "agent", content: "Yes! We have childcare Mon-Fri 8AM-12PM for ages 6 months to 8 years — completely free with membership!", time: "7:12 AM", confidence: "high" },
          { role: "customer", content: "Thanks so much! See you Saturday!", time: "7:15 AM" },
        ],
      },
    ];

    const { error: convoErr } = await supabase.from("conversations").insert(conversations);

    if (convoErr) {
      console.error("❌ Failed to create conversations:", convoErr.message);
    } else {
      console.log(`✅ Created ${conversations.length} sample conversations`);
    }
  }

  // Step 5: Create sample leads
  console.log("\n5. Creating sample leads...");
  const { data: existingLeads } = await supabase
    .from("leads")
    .select("id")
    .eq("business_id", businessId)
    .limit(1);

  if (existingLeads && existingLeads.length > 0) {
    console.log("✅ Leads already exist, skipping");
  } else {
    const leads = [
      {
        business_id: businessId,
        name: "David Park",
        email: "david.p@gmail.com",
        phone: "(704) 555-0192",
        source: "website",
        interest: "Annual membership + personal training",
        form_message: "Hi, I'm interested in joining your gym. I've been looking at the annual membership and would also love to learn more about personal training packages. I'm a beginner and want to make sure I'm doing exercises with proper form.",
        referral: "Google Search",
        status: "new",
      },
      {
        business_id: businessId,
        name: "Emily Tran",
        email: "emilyt@outlook.com",
        phone: "(980) 555-0287",
        source: "website",
        interest: "Student membership",
        form_message: "I'm a student at UNCC. Do you offer student discounts? I mainly want to use the gym for weightlifting and maybe try some classes.",
        referral: "Friend",
        status: "contacted",
        follow_up_email: {
          subject: "Your Student Membership at Iron Temple",
          body: "Hi Emily!\n\nThanks so much for reaching out! Great news — we offer a student rate at just $35/month with a valid .edu email. That gets you full gym access plus all our classes.\n\nSince you're into weightlifting, you'd love our free weight area — and every new member gets a free 30-min intro session with a trainer to get your form dialed in.\n\nWe'd love to get you started with a free week trial — no commitment, just come see if it's the right fit:\n\n→ Claim your free student trial: www.irontemple.com/student-trial\n\nSee you soon!\n— Iron Temple Gym",
          sent_at: new Date(Date.now() - 86400000).toISOString(),
        },
      },
      {
        business_id: businessId,
        name: "Marcus Johnson",
        email: "marcus.j@yahoo.com",
        phone: "(704) 555-0341",
        source: "website",
        interest: "Family plan",
        form_message: "My wife and I are looking for a gym we can go to together. We have two kids (ages 4 and 7). Do you have any family plans or childcare options?",
        referral: "Instagram",
        status: "follow_up",
        follow_up_email: {
          subject: "Iron Temple Family Plan — Perfect for Your Crew!",
          body: "Hey Marcus!\n\nThanks for reaching out! Our Family Plan is $79/month and covers up to 4 members — perfect for you and your wife.\n\nAnd yes — we have childcare! Our childcare room is open Mon-Fri 8AM-12PM for ages 6 months to 8 years, completely free with membership. Your kids are right in our age range.\n\nWe'd love to have you all come in and see the space. Book a quick tour and we'll walk you through everything:\n\n→ Schedule a family tour: www.irontemple.com/tour\n\nLooking forward to meeting the family!\n— Iron Temple Gym",
          sent_at: new Date(Date.now() - 86400000 * 3).toISOString(),
        },
      },
      {
        business_id: businessId,
        name: "Rachel Kim",
        email: "rkim@gmail.com",
        phone: "(980) 555-0118",
        source: "website",
        interest: "Free trial",
        form_message: "I just moved to Charlotte and looking for a gym near Trade Street. Can I try a class before signing up?",
        referral: "Google Maps",
        status: "converted",
        follow_up_email: {
          subject: "Welcome to Charlotte! Your Free 3-Day Pass",
          body: "Hi Rachel!\n\nWelcome to Charlotte — you're going to love it here! We're right at 4521 Trade Street, super easy to find with free parking behind the building.\n\nAbsolutely — we'd love for you to try us out. Here's a free 3-day pass, no credit card needed:\n\n→ Claim your free 3-day pass: www.irontemple.com/free-trial\n\nIf you want to jump into a class, our Saturday Boot Camp at 9AM is a great intro. Just bring a valid ID to the front desk and you're in!\n\nSee you soon!\n— Iron Temple Gym",
          sent_at: new Date(Date.now() - 86400000 * 5).toISOString(),
        },
      },
    ];

    const { error: leadsErr } = await supabase.from("leads").insert(leads);

    if (leadsErr) {
      console.error("❌ Failed to create leads:", leadsErr.message);
    } else {
      console.log(`✅ Created ${leads.length} sample leads`);
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("✅ Seed complete! Your database has test data.");
  console.log("   Start your dev server (npm run dev) and check the dashboard.");
  console.log("=".repeat(60));
}

seed().catch(console.error);