import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { AI_ENABLED } from "@/lib/ai";
import { getAIEnabledSetting, setAIEnabled } from "@/lib/ai-settings";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userRole = (session.user as { role: string }).role;
  if (userRole !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  return NextResponse.json({
    apiKeyConfigured: AI_ENABLED,
    aiEnabled: getAIEnabledSetting(),
    active: AI_ENABLED && getAIEnabledSetting(),
  });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userRole = (session.user as { role: string }).role;
  if (userRole !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { aiEnabled } = await request.json();
  if (typeof aiEnabled !== "boolean") {
    return NextResponse.json({ error: "aiEnabled must be a boolean" }, { status: 400 });
  }

  setAIEnabled(aiEnabled);

  return NextResponse.json({
    apiKeyConfigured: AI_ENABLED,
    aiEnabled,
    active: AI_ENABLED && aiEnabled,
  });
}
