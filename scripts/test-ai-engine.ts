// scripts/test-ai-engine.ts
// Run with: npx tsx scripts/test-ai-engine.ts
//
// Tests the AI engine directly (no server needed).
// Make sure ANTHROPIC_API_KEY is set in your .env.local
 
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
 
import { callAIEngine, detectSpam, parseLeadEmail } from "../lib/ai-engine";
 
const TEST_BUSINESS_ID = "00000000-0000-0000-0000-000000000000";

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
Free parking lot behind the building (entrance off 4th St).
 
AMENITIES:
Full locker rooms with showers and towel service, Sauna (6AM-9PM), Smoothie bar, Free WiFi, Childcare Mon-Fri 8AM-12PM (ages 6mo-8yr, free with membership).
 
TRIAL OFFER:
First-timers get a FREE 3-day pass. No credit card required.
 
LEAD CONVERSION:
- General inquiry → free 3-day pass: www.irontemple.com/free-trial
- Class interest → free first class: www.irontemple.com/schedule
- Personal training → free 30-min intro: www.irontemple.com/book-pt
- Family/childcare → tour: www.irontemple.com/tour
- Student → free week trial: www.irontemple.com/student-trial
 
TONE: Friendly, energetic, welcoming. Casual language.`;
 
async function runTests() {
  console.log("=".repeat(60));
  console.log("AgentHub AI Engine — Test Suite");
  console.log("=".repeat(60));
 
  // ---- SPAM FILTER TESTS ----
  console.log("\n📧 SPAM FILTER TESTS");
  console.log("-".repeat(40));
 
  const spamTests = [
    { msg: "What are your hours?", expected: false },
    { msg: "Do you have yoga classes?", expected: false },
    { msg: "🔥 Make $5000 per day from home! Click here: http://scam.com", expected: true },
    { msg: "Check my bio for hot deals 🔥", expected: true },
    { msg: "I want to try a class this Saturday", expected: false },
    { msg: "Free crypto airdrop! DM me for investment opportunity", expected: true },
    { msg: "http://spam.link", expected: true },
  ];
 
  for (const test of spamTests) {
    const result = detectSpam(test.msg);
    const pass = result === test.expected;
    console.log(`${pass ? "✅" : "❌"} "${test.msg.slice(0, 50)}..." → ${result ? "SPAM" : "OK"} (expected: ${test.expected ? "SPAM" : "OK"})`);
  }
 
  // ---- DM MODE TESTS ----
  console.log("\n💬 DM MODE TESTS");
  console.log("-".repeat(40));
 
  // Test 1: Simple hours question (should be high confidence)
  console.log("\nTest 1: Hours question");
  const dm1 = await callAIEngine({
    mode: "dm",
    businessId: TEST_BUSINESS_ID,
    instructionDoc: INSTRUCTION_DOC,
    conversationHistory: [],
    newMessage: "What time do you open on Saturday?",
  });
  console.log(`  Confidence: ${dm1.confidence}`);
  console.log(`  Response: ${dm1.content}`);
  console.log(`  ${dm1.confidence === "high" ? "✅" : "❌"} Expected high confidence`);
 
  // Test 2: Pricing question (should be high confidence)
  console.log("\nTest 2: Pricing question");
  const dm2 = await callAIEngine({
    mode: "dm",
    businessId: TEST_BUSINESS_ID,
    instructionDoc: INSTRUCTION_DOC,
    conversationHistory: [],
    newMessage: "How much is a monthly membership?",
  });
  console.log(`  Confidence: ${dm2.confidence}`);
  console.log(`  Response: ${dm2.content}`);
  console.log(`  ${dm2.confidence === "high" ? "✅" : "❌"} Expected high confidence`);
 
  // Test 3: Question NOT in instruction doc (should be low confidence)
  console.log("\nTest 3: Off-topic question (should trigger UNSURE)");
  const dm3 = await callAIEngine({
    mode: "dm",
    businessId: TEST_BUSINESS_ID,
    instructionDoc: INSTRUCTION_DOC,
    conversationHistory: [],
    newMessage: "Do you sell pre-workout supplements at the front desk?",
  });
  console.log(`  Confidence: ${dm3.confidence}`);
  console.log(`  Response: ${dm3.content}`);
  console.log(`  ${dm3.confidence === "low" ? "✅" : "⚠️"} Expected low confidence (AI may sometimes answer if it's close)`);
 
  // Test 4: Conversation with history
  console.log("\nTest 4: Follow-up question with conversation history");
  const dm4 = await callAIEngine({
    mode: "dm",
    businessId: TEST_BUSINESS_ID,
    instructionDoc: INSTRUCTION_DOC,
    conversationHistory: [
      { role: "customer", content: "Hi! I'm thinking about joining." },
      { role: "agent", content: "Hey! We'd love to have you! We've got memberships starting at $39/month. Want to try a free 3-day pass?" },
    ],
    newMessage: "Yeah that sounds great! Do you have parking?",
  });
  console.log(`  Confidence: ${dm4.confidence}`);
  console.log(`  Response: ${dm4.content}`);
  console.log(`  ${dm4.confidence === "high" ? "✅" : "❌"} Expected high confidence`);
 
  // ---- LEAD MODE TEST ----
  console.log("\n📨 LEAD MODE TEST");
  console.log("-".repeat(40));
 
  const lead1 = await callAIEngine({
    mode: "lead",
    businessId: TEST_BUSINESS_ID,
    instructionDoc: INSTRUCTION_DOC,
    leadName: "David Park",
    leadEmail: "david.p@gmail.com",
    leadInterest: "Annual membership + personal training",
    leadMessage: "I'm interested in joining your gym. I've been looking at the annual membership and would also love to learn more about personal training packages.",
    referralSource: "Google Search",
  });
  console.log(`  Confidence: ${lead1.confidence}`);
  const parsed = parseLeadEmail(lead1.content);
  console.log(`  Subject: ${parsed.subject}`);
  console.log(`  Body preview: ${parsed.body.slice(0, 200)}...`);
  console.log(`  ${lead1.confidence === "high" ? "✅" : "❌"} Expected high confidence`);
  console.log(`  ${parsed.body.includes("irontemple.com") ? "✅" : "❌"} Contains CTA link`);
 
  // ---- REVIEW MODE TEST ----
  console.log("\n⭐ REVIEW MODE TEST");
  console.log("-".repeat(40));
 
  const review1 = await callAIEngine({
    mode: "review",
    businessId: TEST_BUSINESS_ID,
    instructionDoc: INSTRUCTION_DOC,
    customerName: "Taylor Wright",
    milestone: "10th visit",
    visitCount: 10,
    reviewLink: "https://g.page/r/irontemple-clt/review",
  });
  console.log(`  Confidence: ${review1.confidence}`);
  console.log(`  Response: ${review1.content}`);
  console.log(`  ${review1.confidence === "high" ? "✅" : "❌"} Expected high confidence`);
  console.log(`  ${review1.content.includes("g.page") ? "✅" : "❌"} Contains review link`);
 
  console.log("\n" + "=".repeat(60));
  console.log("Tests complete!");
  console.log("=".repeat(60));
}
 
runTests().catch(console.error);