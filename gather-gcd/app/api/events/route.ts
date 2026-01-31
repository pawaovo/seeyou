import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "edge";

// Generate a random 6-digit passcode
function generatePasscode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// POST: Create a new event
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, passcode: customPasscode, start_date } = body;

    if (!title || title.length < 1 || title.length > 50) {
      return NextResponse.json(
        { error: "标题长度需要在 1-50 字符之间" },
        { status: 400 }
      );
    }

    if (!start_date) {
      return NextResponse.json(
        { error: "请选择开始日期" },
        { status: 400 }
      );
    }

    // Use custom passcode if provided and valid (6 digits), otherwise generate one
    let passcode = customPasscode;
    if (!passcode || !/^\d{6}$/.test(passcode)) {
      passcode = generatePasscode();
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("events")
      .insert({
        title,
        passcode,
        start_date,
      })
      .select("id, passcode, creator_token")
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "创建活动失败" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      id: data.id,
      passcode: data.passcode,
      creator_token: data.creator_token,
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "服务器错误" },
      { status: 500 }
    );
  }
}
