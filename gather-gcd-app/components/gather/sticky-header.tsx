"use client";

import { motion } from "framer-motion";

interface TimeSlot {
  date: string;
  slot: "morning" | "afternoon" | "evening";
}

interface StickyHeaderProps {
  eventTitle: string;
  totalWeeks: number;
  allSelections: Record<string, TimeSlot[]>;
  currentUser: string;
  isDirty: boolean;
  onSave: () => void;
  onEdit: () => void; // Declare onEdit function
  isSaved: boolean; // Declare isSaved variable
}

export function StickyHeader({
  eventTitle,
  totalWeeks,
  allSelections,
  currentUser,
  isDirty,
  onSave,
  onEdit,
  isSaved,
}: StickyHeaderProps) {
  const participantCount = Object.keys(allSelections).length;
  const userSlotCount = allSelections[currentUser]?.length || 0;

  // Generate bubble indicators for activity
  const bubbles = Array.from({ length: Math.min(participantCount, 5) }, (_, i) => ({
    id: i,
    size: 8 + Math.random() * 8,
    x: 20 + i * 18 + Math.random() * 10,
    delay: i * 0.2,
  }));

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-50 glass-strong border-b border-border/50"
    >
      <div className="max-w-2xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="font-serif text-2xl text-foreground text-balance truncate">
              {eventTitle}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {totalWeeks} {totalWeeks === 1 ? "week" : "weeks"} · {participantCount}{" "}
              {participantCount === 1 ? "participant" : "participants"}
            </p>
          </div>

          {/* Dynamic activity indicators */}
          <div className="relative h-10 w-16 flex items-center justify-center shrink-0">
            {bubbles.map((bubble) => (
              <motion.div
                key={bubble.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 0.5 }}
                transition={{ delay: bubble.delay, type: "spring" }}
                className="absolute rounded-full bg-zen-sage"
                style={{
                  width: bubble.size,
                  height: bubble.size,
                  right: bubble.x - 20,
                }}
              />
            ))}
            <div className="relative z-10 flex items-center gap-1.5 bg-secondary/80 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-zen-sage animate-pulse" />
              <span className="text-xs font-medium text-foreground">{userSlotCount}</span>
            </div>
          </div>

          {/* Save / Edit Button */}
          <motion.button
            type="button"
            onClick={isSaved ? onEdit : onSave}
            disabled={!isSaved && userSlotCount === 0}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
              isSaved
                ? "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                : userSlotCount > 0
                  ? "bg-primary text-primary-foreground shadow-md hover:shadow-lg"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
            }`}
          >
            {isSaved ? "Edit" : "Save"}
          </motion.button>
        </div>
      </div>
    </motion.header>
  );
}
