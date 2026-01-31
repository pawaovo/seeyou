import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "edge";

// Simple in-memory rate limiting (resets on cold start, but provides basic protection)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_ATTEMPTS = 5; // Max 5 attempts per minute per IP+eventId

function getRateLimitKey(ip: string, eventId: string): string {
  return `${ip}:${eventId}`;
}

function checkRateLimit(ip: string, eventId: string): { allowed: boolean; remaining: number } {
  const key = getRateLimitKey(ip, eventId);
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return { allowed: true, remaining: MAX_ATTEMPTS - 1 };
  }

  if (record.count >= MAX_ATTEMPTS) {
    return { allowed: false, remaining: 0 };
  }

  record.count++;
  return { allowed: true, remaining: MAX_ATTEMPTS - record.count };
}

// POST: Verify passcode
export async function POST(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;

    // Get client IP for rate limiting
    const ip = request.headers.get("cf-connecting-ip") ||
               request.headers.get("x-forwarded-for")?.split(",")[0] ||
               "unknown";

    // Check rate limit
    const { allowed, remaining } = checkRateLimit(ip, eventId);
    if (!allowed) {
      return NextResponse.json(
        { valid: false, error: "尝试次数过多，请稍后再试" },
        {
          status: 429,
          headers: {
            "Retry-After": "60",
            "X-RateLimit-Remaining": "0"
          }
        }
      );
    }

    const body = await request.json();
    const { passcode } = body;

    // Support both 4-digit (legacy) and 6-digit passcodes
    if (!passcode || (passcode.length !== 4 && passcode.length !== 6)) {
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

    // Verify passcode (trim to handle char(6) padding)
    if (event.passcode.trim() !== passcode) {
      return NextResponse.json(
        { valid: false, error: "口令错误", remaining },
        {
          status: 401,
          headers: {
            "X-RateLimit-Remaining": remaining.toString()
          }
        }
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
