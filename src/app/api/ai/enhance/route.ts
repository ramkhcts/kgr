import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { askClaude, AI_ENABLED } from "@/lib/ai";

const SCOPE_LABELS: Record<string, string> = {
  SITE_SUPPORT_SERVICES: "Site Support Services",
  SERVICE_DESK: "Service Desk",
  REMOTE_COMMAND_CENTER: "Remote Command Center",
  FIELD_SERVICES: "Field Services",
};

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!AI_ENABLED) {
    return NextResponse.json({ enabled: false, error: "AI not configured" }, { status: 503 });
  }

  const { description, projectName, scopeOfWork } = await request.json();
  if (!description) return NextResponse.json({ error: "description required" }, { status: 400 });

  const systemPrompt = `You are a professional technical writer helping clients of KGR End User Services articulate their IT project requirements clearly and completely. You transform vague or informal project descriptions into professional, structured requirement summaries.

Your enhanced descriptions:
- Are written in clear business English
- Include specific details about what success looks like
- Mention scale/volume where relevant (number of users, locations, devices)
- Are 100–200 words — detailed but concise
- Do NOT invent facts — only expand on what the client provided
- Do NOT use bullet points — write in flowing paragraphs`;

  const userPrompt = `Enhance this project description for a "${SCOPE_LABELS[scopeOfWork] ?? scopeOfWork}" engagement named "${projectName || "IT Services Project"}".

Original description:
"${description}"

Return ONLY the enhanced description text — no intro, no labels, no markdown.`;

  try {
    const enhanced = await askClaude(userPrompt, systemPrompt, 400);
    return NextResponse.json({ enabled: true, enhanced: enhanced.trim() });
  } catch (err) {
    console.error("AI enhance error:", err);
    return NextResponse.json({ error: "AI enhancement failed" }, { status: 500 });
  }
}
