"use client";

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WeekCard } from "./week-card";
import { StickyHeader } from "./sticky-header";
import { DataInsight } from "./data-insight";
import { Plus } from "lucide-react";
import Image from "next/image";

interface TimeSlot {
  date: string;
  slot: "morning" | "afternoon" | "evening";
}

interface CollaborativeCanvasProps {
  eventTitle: string;
  startDate: Date;
  displayWeekIndices: Set<number>;
  weeksWithData: number;
  currentUser: string;
  userSelections: TimeSlot[];
  allSelections: Record<string, TimeSlot[]>;
  hasUnsavedChanges: boolean;
  onToggleSlot: (date: string, slot: "morning" | "afternoon" | "evening") => void;
  onBatchToggle: (slots: Array<{ date: string; slot: "morning" | "afternoon" | "evening" }>, select: boolean) => void;
  onAddWeek: () => void;
  onSave: () => void;
  onShare?: () => void;
}

export function CollaborativeCanvas({
  eventTitle,
  startDate,
  displayWeekIndices,
  weeksWithData,
  currentUser,
  userSelections,
  allSelections,
  hasUnsavedChanges,
  onToggleSlot,
  onBatchToggle,
  onAddWeek,
  onSave,
  onShare,
}: CollaborativeCanvasProps) {
  // Convert Set to sorted array for rendering
  const displayWeeks = useMemo(() => {
    return Array.from(displayWeekIndices).sort((a, b) => a - b);
  }, [displayWeekIndices]);

  // Check if can add more weeks (max 4 weeks, indices 0-3)
  const canAddWeek = displayWeekIndices.size < 4;

  return (
    <div className="min-h-screen bg-background">
      <StickyHeader
        eventTitle={eventTitle}
        totalWeeks={weeksWithData || 1}
        allSelections={allSelections}
        currentUser={currentUser}
        hasUnsavedChanges={hasUnsavedChanges}
        onSave={onSave}
        onShare={onShare}
      />

      <main className="max-w-2xl mx-auto px-4 py-6 pb-32">
        {/* Week cards */}
        <AnimatePresence mode="popLayout">
          <div className="space-y-4 mb-6">
            {displayWeeks.map((weekIndex) => (
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
                  onToggleSlot={onToggleSlot}
                  onBatchToggle={onBatchToggle}
                />
              </motion.div>
            ))}
          </div>
        </AnimatePresence>

        {/* Add week button - only show if can add more weeks */}
        {canAddWeek && (
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
            <span className="text-sm font-medium">添加一周</span>
          </motion.button>
        )}

        {/* Data insight section */}
        <div className="mt-8">
          <div className="flex items-center mb-4">
            <h2 className="font-serif text-xl text-foreground">ok不ok</h2>
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 0.6, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="ml-auto mr-8"
              style={{ transform: "rotate(12deg)" }}
            >
              <Image src="/icons/decor-7.svg" alt="" width={32} height={32} />
            </motion.div>
          </div>
          <DataInsight allSelections={allSelections} currentUser={currentUser} />
        </div>
      </main>
    </div>
  );
}
