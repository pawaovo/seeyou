import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "edge";

// POST: Verify passcode
export async function POST(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const body = await request.json();
    const { passcode } = body;

    if (!passcode || passcode.length !== 4) {
      return NextResponse.json(
        { valid: false, error: "口令格式错误" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data: event, error } = await supabase
      .from("events")
      .select("id, title, start_date, is_locked, final_slot, created_at, expires_at, passcode")
      .eq("id", eventId)
      .single();

    if (error || !event) {
      return NextResponse.json(
        { valid: false, error: "活动不存在" },
        { status: 404 }
      );
    }

    // Check if expired
    if (new Date(event.expires_at) < new Date()) {
      return NextResponse.json(
        { valid: false, error: "活动已过期" },
        { status: 410 }
      );
    }

    // Verify passcode
    if (event.passcode !== passcode) {
      return NextResponse.json(
        { valid: false, error: "口令错误" },
        { status: 401 }
      );
    }

    // Return event without passcode
    const { passcode: _, ...safeEvent } = event;

    return NextResponse.json({
      valid: true,
      event: safeEvent,
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { valid: false, error: "服务器错误" },
      { status: 500 }
    );
  }
}
