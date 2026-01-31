import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "edge";

// POST: Submit or update response
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { event_id, nickname, user_fingerprint, availability } = body;

    // Validate input
    if (!event_id) {
      return NextResponse.json(
        { error: "缺少活动 ID" },
        { status: 400 }
      );
    }

    if (!nickname || nickname.length < 1 || nickname.length > 20) {
      return NextResponse.json(
        { error: "昵称长度需要在 1-20 字符之间" },
        { status: 400 }
      );
    }

    if (!user_fingerprint) {
      return NextResponse.json(
        { error: "缺少用户标识" },
        { status: 400 }
      );
    }

    if (!availability || typeof availability !== "object") {
      return NextResponse.json(
        { error: "无效的可用时间数据" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Check if event exists and is not locked
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("id, is_locked, expires_at")
      .eq("id", event_id)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { error: "活动不存在" },
        { status: 404 }
      );
    }

    if (event.is_locked) {
      return NextResponse.json(
        { error: "活动已锁定，无法修改" },
        { status: 403 }
      );
    }

    if (new Date(event.expires_at) < new Date()) {
      return NextResponse.json(
        { error: "活动已过期" },
        { status: 410 }
      );
    }

    // Check if response already exists for this nickname
    const { data: existingResponse } = await supabase
      .from("responses")
      .select("id, user_fingerprint")
      .eq("event_id", event_id)
      .eq("nickname", nickname)
      .single();

    if (existingResponse) {
      // Update existing response
      // Only allow update if fingerprint matches or if it's the same user
      if (existingResponse.user_fingerprint !== user_fingerprint) {
        return NextResponse.json(
          { error: "此昵称已被其他用户使用" },
          { status: 409 }
        );
      }

      const { error: updateError } = await supabase
        .from("responses")
        .update({
          availability,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingResponse.id);

      if (updateError) {
        console.error("Update error:", updateError);
        return NextResponse.json(
          { error: "更新失败" },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, updated: true });
    }

    // Create new response
    const { error: insertError } = await supabase
      .from("responses")
      .insert({
        event_id,
        nickname,
        user_fingerprint,
        availability,
      });

    if (insertError) {
      console.error("Insert error:", insertError);
      if (insertError.code === "23505") {
        // Unique constraint violation
        return NextResponse.json(
          { error: "此昵称已被使用" },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: "保存失败" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, created: true });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "服务器错误" },
      { status: 500 }
    );
  }
}
