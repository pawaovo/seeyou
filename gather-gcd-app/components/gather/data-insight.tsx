"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format, parseISO } from "date-fns";

interface TimeSlot {
  date: string;
  slot: "morning" | "afternoon" | "evening";
}

interface DataInsightProps {
  allSelections: Record<string, TimeSlot[]>;
  currentUser: string;
}

type ViewMode = "leaderboard" | "members";

const SLOT_LABELS: Record<string, string> = {
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening",
};

export function DataInsight({ allSelections, currentUser }: DataInsightProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("leaderboard");

  // Calculate leaderboard data
  const slotCounts: Record<string, number> = {};
  for (const [, slots] of Object.entries(allSelections)) {
    for (const slot of slots) {
      const key = `${slot.date}_${slot.slot}`;
      slotCounts[key] = (slotCounts[key] || 0) + 1;
    }
  }

  const leaderboard = Object.entries(slotCounts)
    .map(([key, count]) => {
      const [date, slot] = key.split("_");
      return { date, slot, count };
    })
    .sort((a, b) => b.count - a.count);

  const maxCount = Math.max(...Object.values(slotCounts), 1);
  const members = Object.entries(allSelections);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-3xl overflow-hidden"
    >
      {/* Tab header */}
      <div className="flex border-b border-border/50">
        <button
          type="button"
          onClick={() => setViewMode("leaderboard")}
          className={`flex-1 py-3 px-4 text-sm font-medium transition-all ${
            viewMode === "leaderboard"
              ? "text-foreground bg-card/50"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Best Times
        </button>
        <button
          type="button"
          onClick={() => setViewMode("members")}
          className={`flex-1 py-3 px-4 text-sm font-medium transition-all ${
            viewMode === "members"
              ? "text-foreground bg-card/50"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Members ({members.length})
        </button>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {viewMode === "leaderboard" ? (
          <motion.div
            key="leaderboard"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="p-4 space-y-2 max-h-80 overflow-y-auto"
          >
            {leaderboard.length === 0 ? (
              <p className="text-center text-muted-foreground py-8 text-sm">
                No times selected yet
              </p>
            ) : (
              leaderboard.map(({ date, slot, count }, index) => {
                const intensity = count / maxCount;
                return (
                  <motion.div
                    key={`${date}_${slot}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="relative overflow-hidden rounded-xl py-3 px-4"
                    style={{
                      background: `linear-gradient(90deg, rgba(117, 179, 145, ${intensity * 0.3}) 0%, transparent 100%)`,
                    }}
                  >
                    <div className="flex items-center justify-between relative z-10">
                      <div>
                        <span className="font-serif text-foreground">
                          {format(parseISO(date), "d EEE")}
                        </span>
                        <span className="text-muted-foreground mx-2">·</span>
                        <span className="text-muted-foreground text-sm">
                          {SLOT_LABELS[slot]}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-1">
                          {Array.from({ length: Math.min(count, 4) }).map((_, i) => (
                            <div
                              key={i}
                              className="w-5 h-5 rounded-full bg-zen-sage/50 border-2 border-card"
                            />
                          ))}
                        </div>
                        <span className="text-sm font-medium text-foreground">
                          {count}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </motion.div>
        ) : (
          <motion.div
            key="members"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="p-4 space-y-3 max-h-80 overflow-y-auto"
          >
            {members.length === 0 ? (
              <p className="text-center text-muted-foreground py-8 text-sm">
                No members yet
              </p>
            ) : (
              members.map(([name, slots], index) => (
                <motion.div
                  key={name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="rounded-xl p-4 bg-card/50"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-zen-sage to-zen-mist flex items-center justify-center text-primary-foreground font-medium text-sm">
                        {name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <span className="font-medium text-foreground">
                          {name}
                          {name === currentUser && (
                            <span className="text-xs text-muted-foreground ml-1.5">
                              (you)
                            </span>
                          )}
                        </span>
                        <p className="text-xs text-muted-foreground">
                          {slots.length} {slots.length === 1 ? "time" : "times"} selected
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Mini-map visualization */}
                  <MiniMap slots={slots} />
                </motion.div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function MiniMap({ slots }: { slots: TimeSlot[] }) {
  // Group slots by week (simplified - showing first 3 weeks)
  const weekData: Record<number, boolean[][]> = {};

  for (const slot of slots) {
    const date = parseISO(slot.date);
    const weekIndex = Math.floor(
      (date.getTime() - new Date().setHours(0, 0, 0, 0)) / (7 * 24 * 60 * 60 * 1000)
    );
    const dayIndex = date.getDay();
    const slotIndex = slot.slot === "morning" ? 0 : slot.slot === "afternoon" ? 1 : 2;

    if (!weekData[weekIndex]) {
      weekData[weekIndex] = Array.from({ length: 7 }, () => [false, false, false]);
    }
    if (weekData[weekIndex]?.[dayIndex]) {
      weekData[weekIndex][dayIndex][slotIndex] = true;
    }
  }

  const weeks = Object.entries(weekData)
    .slice(0, 3)
    .sort(([a], [b]) => Number(a) - Number(b));

  if (weeks.length === 0) {
    return (
      <div className="text-xs text-muted-foreground text-center py-2">
        No selections
      </div>
    );
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {weeks.map(([weekIndex, days]) => (
        <div key={weekIndex} className="flex gap-0.5">
          {days.map((daySlots, dayIndex) => (
            <div key={dayIndex} className="flex flex-col gap-0.5">
              {daySlots.map((selected, slotIndex) => (
                <div
                  key={slotIndex}
                  className={`w-2 h-2 rounded-sm ${
                    selected ? "bg-zen-sage" : "bg-border/50"
                  }`}
                />
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
