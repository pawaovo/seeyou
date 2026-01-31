"use client";

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { addDays, format } from "date-fns";
import { WeekCard } from "./week-card";
import { StickyHeader } from "./sticky-header";
import { DataInsight } from "./data-insight";
import { Plus } from "lucide-react";

interface TimeSlot {
  date: string;
  slot: "morning" | "afternoon" | "evening";
}

interface CollaborativeCanvasProps {
  eventTitle: string;
  startDate: Date;
  weeks: number;
  currentUser: string;
  userSelections: TimeSlot[];
  allSelections: Record<string, TimeSlot[]>;
  onToggleSlot: (date: string, slot: "morning" | "afternoon" | "evening") => void;
  onBatchToggle: (slots: Array<{ date: string; slot: "morning" | "afternoon" | "evening" }>, select: boolean) => void;
  onAddWeek: () => void;
  isSaved: boolean;
  onSave: () => void;
  onEdit: () => void;
}

export function CollaborativeCanvas({
  eventTitle,
  startDate,
  weeks,
  currentUser,
  userSelections,
  allSelections,
  onToggleSlot,
  onBatchToggle,
  onAddWeek,
  isSaved,
  onSave,
  onEdit,
}: CollaborativeCanvasProps) {
  // Check which weeks have selections (from any user)
  const weeksWithData = useMemo(() => {
    const allSlots = Object.values(allSelections).flat();
    const weeksSet = new Set<number>();
    
    for (let weekIndex = 0; weekIndex < weeks; weekIndex++) {
      const weekStart = addDays(startDate, weekIndex * 7);
      for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
        const date = addDays(weekStart, dayOffset);
        const dateStr = format(date, "yyyy-MM-dd");
        if (allSlots.some((slot) => slot.date === dateStr)) {
          weeksSet.add(weekIndex);
          break;
        }
      }
    }
    
    return weeksSet;
  }, [allSelections, weeks, startDate]);

  // Display weeks based on save state
  const displayWeeks = useMemo(() => {
    if (!isSaved) {
      // Edit mode: show all weeks
      return Array.from({ length: weeks }, (_, i) => i);
    }
    // Saved mode: only show weeks with data
    return Array.from(weeksWithData).sort((a, b) => a - b);
  }, [isSaved, weeks, weeksWithData]);

  const displayedWeekCount = isSaved ? displayWeeks.length : weeks;

  return (
    <div className="min-h-screen bg-background">
      <StickyHeader
        eventTitle={eventTitle}
        totalWeeks={displayedWeekCount}
        allSelections={allSelections}
        currentUser={currentUser}
        isSaved={isSaved}
        onSave={onSave}
        onEdit={onEdit}
      />

      <main className="max-w-2xl mx-auto px-4 py-6 pb-32">
        {/* Week cards */}
        <AnimatePresence mode="popLayout">
          <div className="space-y-4 mb-6">
            {displayWeeks.length > 0 ? (
              displayWeeks.map((weekIndex) => (
                <motion.div
                  key={weekIndex}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                >
                  <WeekCard
                    weekIndex={weekIndex}
                    startDate={startDate}
                    selectedSlots={userSelections}
                    allSelections={allSelections}
                    currentUser={currentUser}
                    onToggleSlot={isSaved ? () => {} : onToggleSlot}
                    onBatchToggle={isSaved ? () => {} : onBatchToggle}
                  />
                </motion.div>
              ))
            ) : isSaved ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <p className="text-muted-foreground">No selections yet.</p>
                <button
                  type="button"
                  onClick={onEdit}
                  className="mt-4 text-primary hover:underline text-sm"
                >
                  Start selecting available times
                </button>
              </motion.div>
            ) : null}
          </div>
        </AnimatePresence>

        {/* Add week button - always visible */}
        <motion.button
          type="button"
          onClick={onAddWeek}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-full py-4 rounded-2xl border-2 border-dashed border-border hover:border-primary/50 transition-colors flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground group"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          <motion.div
            className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center group-hover:bg-zen-sage/20 transition-colors"
            animate={{
              scale: [1, 1.05, 1],
            }}
            transition={{
              repeat: Number.POSITIVE_INFINITY,
              duration: 3,
              ease: "easeInOut",
            }}
          >
            <Plus className="w-4 h-4" />
          </motion.div>
          <span className="text-sm font-medium">Add another week</span>
        </motion.button>

        {/* Data insight section */}
        <div className="mt-8">
          <h2 className="font-serif text-xl text-foreground mb-4">Insights</h2>
          <DataInsight allSelections={allSelections} currentUser={currentUser} />
        </div>
      </main>
    </div>
  );
}
