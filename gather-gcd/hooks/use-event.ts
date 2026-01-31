"use client";

import { useState, useEffect, useCallback } from "react";
import type { Event, EventResponse, TimeSlot, SlotType } from "@/types";

interface UseEventResult {
  event: Event | null;
  responses: EventResponse[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useEvent(eventId: string | null): UseEventResult {
  const [event, setEvent] = useState<Event | null>(null);
  const [responses, setResponses] = useState<EventResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvent = useCallback(async () => {
    if (!eventId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/events/${eventId}`);
      if (!response.ok) {
        if (response.status === 404) {
          setError("活动不存在");
        } else {
          setError("加载失败");
        }
        return;
      }

      const data = await response.json();
      setEvent(data.event);
      setResponses(data.responses || []);
    } catch {
      setError("网络错误");
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

  return {
    event,
    responses,
    isLoading,
    error,
    refetch: fetchEvent,
  };
}

// Convert responses to the format used by components
export function responsesToSelections(
  responses: EventResponse[]
): Record<string, TimeSlot[]> {
  const selections: Record<string, TimeSlot[]> = {};

  for (const response of responses) {
    const slots: TimeSlot[] = [];
    for (const [date, slotTypes] of Object.entries(response.availability)) {
      for (const slotType of slotTypes as SlotType[]) {
        slots.push({ date, slot: slotType });
      }
    }
    selections[response.nickname] = slots;
  }

  return selections;
}

// Convert TimeSlot[] to availability format
export function selectionsToAvailability(
  selections: TimeSlot[]
): Record<string, SlotType[]> {
  const availability: Record<string, SlotType[]> = {};

  for (const slot of selections) {
    if (!availability[slot.date]) {
      availability[slot.date] = [];
    }
    if (!availability[slot.date].includes(slot.slot)) {
      availability[slot.date].push(slot.slot);
    }
  }

  return availability;
}
