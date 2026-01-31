"use client";

import { useRef, useState, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { format, addDays, startOfWeek, getDay } from "date-fns";
import { zhCN } from "date-fns/locale";

import Image from "next/image";

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
  { key: "morning", label: "上午", icon: "/icons/morning.svg" },
  { key: "afternoon", label: "下午", icon: "/icons/afternoon.svg" },
  { key: "evening", label: "晚上", icon: "/icons/evening.svg" },
];

// 星期一到星期日
const DAYS = ["一", "二", "三", "四", "五", "六", "日"];

// Generate stable random offsets for number display
function getNumberOffset(dateStr: string, slot: string): { x: number; y: number } {
  // Use a simple hash to generate consistent offsets
  const hash = (dateStr + slot).split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const x = ((hash % 7) - 3) * 0.5; // -1.5 to 1.5
  const y = (((hash * 7) % 7) - 3) * 0.5; // -1.5 to 1.5
  return { x, y };
}

export function WeekCard({
  weekIndex,
  startDate,
  selectedSlots,
  allSelections,
  currentUser,
  onToggleSlot,
  onBatchToggle,
}: WeekCardProps) {
  // 获取该周的星期一作为起始日
  const weekStart = startOfWeek(addDays(startDate, weekIndex * 7), { weekStartsOn: 1 });

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

  // Get users who selected a specific slot
  const getSlotUsers = (dateStr: string, slot: "morning" | "afternoon" | "evening"): string[] => {
    const users: string[] = [];
    for (const [user, slots] of Object.entries(allSelections)) {
      if (slots.some((s) => s.date === dateStr && s.slot === slot)) {
        users.push(user);
      }
    }
    // Add current user if selected (and not already in list from allSelections)
    if (isSelected(dateStr, slot) && !users.includes(currentUser)) {
      users.push(currentUser);
    }
    return users;
  };

  const getParticipantCount = (dateStr: string, slot: "morning" | "afternoon" | "evening") => {
    return getSlotUsers(dateStr, slot).length;
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
          {format(weekStart, "M.d", { locale: zhCN })} — {format(addDays(weekStart, 6), "M.d", { locale: zhCN })}
          <span className="text-sm text-muted-foreground ml-2">
            第 {weekIndex + 1} 周
          </span>
        </h3>
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
              <Image
                src={slot.icon}
                alt={slot.label}
                width={20}
                height={20}
                className="opacity-70"
              />
            </div>
            {[0, 1, 2, 3, 4, 5, 6].map((dayOffset) => {
              const date = addDays(weekStart, dayOffset);
              const dateStr = format(date, "yyyy-MM-dd");
              const selected = isSelected(dateStr, slot.key);
              const slotUsers = getSlotUsers(dateStr, slot.key);
              const participantCount = slotUsers.length;
              const othersSelected = participantCount > 0 && !selected;
              const slotKey = getSlotKey(dateStr, slot.key);
              const isBeingDragged = draggedSlots.has(slotKey);

              // Preview state during drag
              const previewSelected = isDragging && isBeingDragged
                ? dragMode === "select"
                : selected;

              // Get offset for number display
              const numberOffset = getNumberOffset(dateStr, slot.key);

              return (
                <motion.div
                  key={dayOffset}
                  data-slot={`${dateStr}|${slot.key}`}
                  onPointerDown={handlePointerDown(dateStr, slot.key)}
                  className={`relative aspect-square rounded-xl transition-all duration-150 cursor-pointer overflow-hidden ${
                    previewSelected
                      ? "bg-gradient-to-br from-zen-sage/60 to-zen-sage/40 shadow-inner"
                      : othersSelected
                        ? "bg-card border border-zen-sage/50"
                        : "bg-card hover:bg-zen-sand/30"
                  } ${isBeingDragged ? "ring-2 ring-primary/50 scale-95" : ""}`}
                  whileTap={{ scale: 0.92 }}
                  whileHover={!isDragging ? { scale: 1.05 } : undefined}
                  role="button"
                  tabIndex={0}
                  aria-label={`${format(date, "M月d日 EEEE", { locale: zhCN })} ${slot.label}`}
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

                  {/* User avatars - positioned at bottom edge */}
                  {participantCount > 0 && (
                    <div className="absolute bottom-0.5 left-0.5 right-0.5 flex justify-center pointer-events-none">
                      <div className="flex -space-x-1.5">
                        {slotUsers.slice(0, 3).map((userName, i) => (
                          <div
                            key={i}
                            className="w-3 h-3 rounded-full bg-gradient-to-br from-zen-sage to-zen-mist border border-card flex items-center justify-center text-[6px] text-primary-foreground font-medium"
                            style={{
                              transform: `translateY(${(i % 2) * -1}px)`,
                            }}
                          >
                            {userName.charAt(0).toUpperCase()}
                          </div>
                        ))}
                        {slotUsers.length > 3 && (
                          <div className="w-3 h-3 rounded-full bg-gradient-to-br from-zen-sage to-zen-mist border border-card flex items-center justify-center text-[6px] text-primary-foreground font-medium">
                            +{slotUsers.length - 3}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Centered count number with slight offset */}
                  {participantCount > 0 && (
                    <span
                      className={`absolute inset-0 flex items-center justify-center font-serif text-base pointer-events-none z-10 ${previewSelected ? "text-zen-stone" : "text-zen-sage"}`}
                      style={{
                        transform: `translate(${numberOffset.x}px, ${numberOffset.y - 2}px)`,
                      }}
                    >
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
