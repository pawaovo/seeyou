import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "edge";

// GET: Get event details and responses
export async function GET(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const supabase = await createClient();

    // Get event
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("*")
      .eq("id", eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { error: "活动不存在" },
        { status: 404 }
      );
    }

    // Check if expired
    if (new Date(event.expires_at) < new Date()) {
      return NextResponse.json(
        { error: "活动已过期" },
        { status: 410 }
      );
    }

    // Get responses
    const { data: responses, error: responsesError } = await supabase
      .from("responses")
      .select("*")
      .eq("event_id", eventId)
      .order("updated_at", { ascending: false });

    if (responsesError) {
      console.error("Responses error:", responsesError);
    }

    // Don't expose passcode in the response
    const { passcode: _, creator_token: __, ...safeEvent } = event;

    return NextResponse.json({
      event: safeEvent,
      responses: responses || [],
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "服务器错误" },
      { status: 500 }
    );
  }
}
