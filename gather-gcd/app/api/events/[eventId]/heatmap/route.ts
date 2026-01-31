import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "edge";

// GET: Get heatmap data for an event
export async function GET(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const supabase = await createClient();

    // Check if event exists
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("id")
      .eq("id", eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { error: "活动不存在" },
        { status: 404 }
      );
    }

    // Get heatmap data using the function
    const { data: heatmap, error: heatmapError } = await supabase
      .rpc("get_event_heatmap", { target_event_id: eventId });

    if (heatmapError) {
      console.error("Heatmap error:", heatmapError);
      // Fallback: calculate heatmap from responses
      const { data: responses } = await supabase
        .from("responses")
        .select("nickname, availability")
        .eq("event_id", eventId);

      if (!responses) {
        return NextResponse.json({ heatmap: [] });
      }

      // Calculate heatmap manually
      const slotCounts: Record<string, { count: number; names: string[] }> = {};

      for (const response of responses) {
        const availability = response.availability as Record<string, string[]>;
        for (const [date, slots] of Object.entries(availability)) {
          for (const slot of slots) {
            const key = `${date}_${slot}`;
            if (!slotCounts[key]) {
              slotCounts[key] = { count: 0, names: [] };
            }
            slotCounts[key].count++;
            slotCounts[key].names.push(response.nickname);
          }
        }
      }

      const manualHeatmap = Object.entries(slotCounts)
        .map(([key, data]) => {
          const [date, slot] = key.split("_");
          return {
            slot_date: date,
            slot_type: slot,
            participant_count: data.count,
            names: data.names,
          };
        })
        .sort((a, b) => b.participant_count - a.participant_count);

      return NextResponse.json({ heatmap: manualHeatmap });
    }

    return NextResponse.json({ heatmap: heatmap || [] });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "服务器错误" },
      { status: 500 }
    );
  }
}
