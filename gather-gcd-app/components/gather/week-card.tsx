"use client";

import React from "react"

import { motion } from "framer-motion";
import { format, addDays } from "date-fns";
import { useRef, useState, useCallback } from "react";

interface TimeSlot {
  date: string;
  slot: "morning" | "afternoon" | "evening";
}

interface WeekCardProps {
  weekIndex: number;
  startDate: Date;
  selectedSlots: TimeSlot[];
  allSelections: Record<string, TimeSlot[]>;
  currentUser: string;
  onToggleSlot: (date: string, slot: "morning" | "afternoon" | "evening") => void;
  onBatchToggle?: (slots: Array<{ date: string; slot: "morning" | "afternoon" | "evening" }>, select: boolean) => void;
}

const SLOTS: Array<{ key: "morning" | "afternoon" | "evening"; label: string; icon: string }> = [
  { key: "morning", label: "AM", icon: "☀️" },
  { key: "afternoon", label: "PM", icon: "🌤" },
  { key: "evening", label: "EVE", icon: "🌙" },
];

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function WeekCard({
  weekIndex,
  startDate,
  selectedSlots,
  allSelections,
  currentUser,
  onToggleSlot,
  onBatchToggle,
}: WeekCardProps) {
  const weekStart = addDays(startDate, weekIndex * 7);
  
  // Drag selection state
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState<"select" | "deselect">("select");
  const [draggedSlots, setDraggedSlots] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);

  const getSlotKey = (date: string, slot: "morning" | "afternoon" | "evening") => `${date}:${slot}`;
  
  const parseSlotKey = (key: string): { date: string; slot: "morning" | "afternoon" | "evening" } => {
    const [date, slot] = key.split(":");
    return { date, slot: slot as "morning" | "afternoon" | "evening" };
  };

  const handleDragStart = useCallback((dateStr: string, slot: "morning" | "afternoon" | "evening") => {
    const currentlySelected = isSelected(dateStr, slot);
    setIsDragging(true);
    setDragMode(currentlySelected ? "deselect" : "select");
    setDraggedSlots(new Set([getSlotKey(dateStr, slot)]));
  }, [selectedSlots]);

  const handleDragEnter = useCallback((dateStr: string, slot: "morning" | "afternoon" | "evening") => {
    if (!isDragging) return;
    const key = getSlotKey(dateStr, slot);
    setDraggedSlots(prev => {
      const next = new Set(prev);
      next.add(key);
      return next;
    });
  }, [isDragging]);

  const handleDragEnd = useCallback(() => {
    if (!isDragging) return;
    
    if (onBatchToggle && draggedSlots.size > 0) {
      const slots = Array.from(draggedSlots).map(parseSlotKey);
      onBatchToggle(slots, dragMode === "select");
    } else {
      // Fallback: toggle each slot individually
      for (const key of draggedSlots) {
        const { date, slot } = parseSlotKey(key);
        const currentlySelected = isSelected(date, slot);
        if ((dragMode === "select" && !currentlySelected) || (dragMode === "deselect" && currentlySelected)) {
          onToggleSlot(date, slot);
        }
      }
    }
    
    setIsDragging(false);
    setDraggedSlots(new Set());
  }, [isDragging, draggedSlots, dragMode, onBatchToggle, onToggleSlot]);

  // Handle touch/mouse events for drag selection
  const handlePointerDown = (dateStr: string, slot: "morning" | "afternoon" | "evening") => (e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    handleDragStart(dateStr, slot);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !containerRef.current) return;
    
    const element = document.elementFromPoint(e.clientX, e.clientY);
    if (element) {
      const slotData = element.getAttribute("data-slot");
      if (slotData) {
        const [dateStr, slot] = slotData.split("|");
        handleDragEnter(dateStr, slot as "morning" | "afternoon" | "evening");
      }
    }
  };

  const handlePointerUp = () => {
    handleDragEnd();
  };

  const isSelected = (dateStr: string, slot: "morning" | "afternoon" | "evening") => {
    return selectedSlots.some((s) => s.date === dateStr && s.slot === slot);
  };

  const getParticipantCount = (dateStr: string, slot: "morning" | "afternoon" | "evening") => {
    let count = 0;
    for (const [user, slots] of Object.entries(allSelections)) {
      if (user !== currentUser && slots.some((s) => s.date === dateStr && s.slot === slot)) {
        count++;
      }
    }
    if (isSelected(dateStr, slot)) count++;
    return count;
  };

  const getSlotStyle = (dateStr: string, slot: "morning" | "afternoon" | "evening") => {
    const selected = isSelected(dateStr, slot);
    const participantCount = getParticipantCount(dateStr, slot);

    if (selected) {
      return "bg-gradient-to-br from-zen-sage/60 to-zen-sage/40 shadow-inner";
    }
    if (participantCount > 0) {
      const opacity = Math.min(0.15 + participantCount * 0.1, 0.4);
      return `bg-zen-mist/${Math.round(opacity * 100)}`;
    }
    return "bg-card hover:bg-zen-sand/30";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: weekIndex * 0.1 }}
      className="glass rounded-3xl p-5 shadow-sm"
    >
      {/* Week header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-serif text-lg text-foreground">
          {format(weekStart, "MMM d")} — {format(addDays(weekStart, 6), "MMM d")}
        </h3>
        <span className="text-xs text-muted-foreground px-3 py-1 rounded-full bg-secondary">
          Week {weekIndex + 1}
        </span>
      </div>

      {/* Bento grid with drag support */}
      <div 
        ref={containerRef}
        className="space-y-2 touch-none select-none"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {/* Header row */}
        <div className="grid grid-cols-8 gap-1.5">
          <div className="h-8" />
          {[0, 1, 2, 3, 4, 5, 6].map((dayOffset) => {
            const date = addDays(weekStart, dayOffset);
            const isToday = format(date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
            return (
              <div
                key={dayOffset}
                className={`h-8 flex flex-col items-center justify-center text-xs ${
                  isToday ? "text-primary font-medium" : "text-muted-foreground"
                }`}
              >
                <span>{DAYS[dayOffset]}</span>
                <span className="font-serif text-sm">{format(date, "d")}</span>
              </div>
            );
          })}
        </div>

        {/* Slot rows */}
        {SLOTS.map((slot) => (
          <div key={slot.key} className="grid grid-cols-8 gap-1.5">
            <div className="flex items-center justify-center text-xs text-muted-foreground">
              <span className="sr-only">{slot.label}</span>
              <span aria-hidden="true">{slot.icon}</span>
            </div>
            {[0, 1, 2, 3, 4, 5, 6].map((dayOffset) => {
              const date = addDays(weekStart, dayOffset);
              const dateStr = format(date, "yyyy-MM-dd");
              const selected = isSelected(dateStr, slot.key);
              const participantCount = getParticipantCount(dateStr, slot.key);
              const slotKey = getSlotKey(dateStr, slot.key);
              const isBeingDragged = draggedSlots.has(slotKey);
              
              // Preview state during drag
              const previewSelected = isDragging && isBeingDragged 
                ? dragMode === "select" 
                : selected;

              return (
                <motion.div
                  key={dayOffset}
                  data-slot={`${dateStr}|${slot.key}`}
                  onPointerDown={handlePointerDown(dateStr, slot.key)}
                  className={`relative aspect-square rounded-xl transition-all duration-150 cursor-pointer ${
                    previewSelected 
                      ? "bg-gradient-to-br from-zen-sage/60 to-zen-sage/40 shadow-inner" 
                      : participantCount > 0 
                        ? `bg-zen-mist/${Math.round(Math.min(0.15 + participantCount * 0.1, 0.4) * 100)}`
                        : "bg-card hover:bg-zen-sand/30"
                  } ${isBeingDragged ? "ring-2 ring-primary/50 scale-95" : ""}`}
                  whileTap={{ scale: 0.92 }}
                  whileHover={!isDragging ? { scale: 1.05 } : undefined}
                  role="button"
                  tabIndex={0}
                  aria-label={`${format(date, "EEEE, MMMM d")} ${slot.label}`}
                  aria-pressed={previewSelected}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onToggleSlot(dateStr, slot.key);
                    }
                  }}
                >
                  {previewSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute inset-0 rounded-xl animate-soft-glow pointer-events-none"
                    />
                  )}
                  {participantCount > 1 && (
                    <span className="absolute bottom-0.5 right-0.5 text-[10px] text-zen-stone font-medium pointer-events-none">
                      {participantCount}
                    </span>
                  )}
                </motion.div>
              );
            })}
          </div>
        ))}
      </div>
    </motion.div>
  );
}
