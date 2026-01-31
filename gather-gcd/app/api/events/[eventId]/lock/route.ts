import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "edge";

// POST: Lock event (creator only)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const body = await request.json();
    const { creator_token, final_slot } = body;

    if (!creator_token) {
      return NextResponse.json(
        { error: "需要创建者身份验证" },
        { status: 401 }
      );
    }

    const supabase = await createClient();

    // Verify creator token
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("creator_token, is_locked")
      .eq("id", eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { error: "活动不存在" },
        { status: 404 }
      );
    }

    if (event.creator_token !== creator_token) {
      return NextResponse.json(
        { error: "无权限锁定此活动" },
        { status: 403 }
      );
    }

    if (event.is_locked) {
      return NextResponse.json(
        { error: "活动已锁定" },
        { status: 400 }
      );
    }

    // Lock the event
    const { error: updateError } = await supabase
      .from("events")
      .update({
        is_locked: true,
        final_slot: final_slot || null,
      })
      .eq("id", eventId);

    if (updateError) {
      console.error("Update error:", updateError);
      return NextResponse.json(
        { error: "锁定失败" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "服务器错误" },
      { status: 500 }
    );
  }
}
