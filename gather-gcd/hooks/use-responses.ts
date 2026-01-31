"use client";

import { useState, useCallback } from "react";
import type { TimeSlot, SlotType } from "@/types";
import { selectionsToAvailability } from "./use-event";

interface UseResponsesResult {
  selections: TimeSlot[];
  setSelections: React.Dispatch<React.SetStateAction<TimeSlot[]>>;
  toggleSlot: (date: string, slot: SlotType) => void;
  batchToggle: (slots: Array<{ date: string; slot: SlotType }>, select: boolean) => void;
  saveSelections: () => Promise<boolean>;
  isSaving: boolean;
}

interface UseResponsesOptions {
  eventId: string;
  nickname: string;
  userFingerprint: string;
  initialSelections?: TimeSlot[];
  onSaved?: () => void;
}

export function useResponses({
  eventId,
  nickname,
  userFingerprint,
  initialSelections = [],
  onSaved,
}: UseResponsesOptions): UseResponsesResult {
  const [selections, setSelections] = useState<TimeSlot[]>(initialSelections);
  const [isSaving, setIsSaving] = useState(false);

  const toggleSlot = useCallback((date: string, slot: SlotType) => {
    setSelections((prev) => {
      const exists = prev.some((s) => s.date === date && s.slot === slot);
      if (exists) {
        return prev.filter((s) => !(s.date === date && s.slot === slot));
      }
      return [...prev, { date, slot }];
    });
  }, []);

  const batchToggle = useCallback(
    (slots: Array<{ date: string; slot: SlotType }>, select: boolean) => {
      setSelections((prev) => {
        if (select) {
          const newSlots = slots.filter(
            (newSlot) =>
              !prev.some((s) => s.date === newSlot.date && s.slot === newSlot.slot)
          );
          return [...prev, ...newSlots];
        } else {
          return prev.filter(
            (s) =>
              !slots.some(
                (removeSlot) =>
                  removeSlot.date === s.date && removeSlot.slot === s.slot
              )
          );
        }
      });
    },
    []
  );

  const saveSelections = useCallback(async (): Promise<boolean> => {
    if (!eventId || !nickname || !userFingerprint) {
      return false;
    }

    setIsSaving(true);

    try {
      const availability = selectionsToAvailability(selections);

      const response = await fetch("/api/responses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          event_id: eventId,
          nickname,
          user_fingerprint: userFingerprint,
          availability,
        }),
      });

      if (!response.ok) {
        throw new Error("保存失败");
      }

      onSaved?.();
      return true;
    } catch {
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [eventId, nickname, userFingerprint, selections, onSaved]);

  return {
    selections,
    setSelections,
    toggleSlot,
    batchToggle,
    saveSelections,
    isSaving,
  };
}
