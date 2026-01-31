"use client";

import { motion } from "framer-motion";
import { Share2 } from "lucide-react";
import Image from "next/image";

interface TimeSlot {
  date: string;
  slot: "morning" | "afternoon" | "evening";
}

interface StickyHeaderProps {
  eventTitle: string;
  totalWeeks: number;
  allSelections: Record<string, TimeSlot[]>;
  currentUser: string;
  hasUnsavedChanges: boolean;
  onSave: () => void;
  onShare?: () => void;
}

export function StickyHeader({
  eventTitle,
  totalWeeks,
  allSelections,
  currentUser,
  hasUnsavedChanges,
  onSave,
  onShare,
}: StickyHeaderProps) {
  const participantCount = Object.keys(allSelections).length;

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/50"
    >
      <div className="max-w-2xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="font-serif text-2xl text-foreground text-balance truncate">
              {eventTitle}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {totalWeeks} 周内，{participantCount} 个人
            </p>
          </div>

          {/* Decorative icon in center */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5, rotate: 0 }}
            animate={{ opacity: 0.7, scale: 1, rotate: -8 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="shrink-0"
          >
            <Image
              src="/icons/decor-8.svg"
              alt=""
              width={40}
              height={40}
              className="opacity-70"
            />
          </motion.div>

          {/* Save Button */}
          <div className="flex items-center gap-2">
            {onShare && (
              <motion.button
                type="button"
                onClick={onShare}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="shrink-0 p-2 rounded-xl bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
                aria-label="分享"
              >
                <Share2 className="w-4 h-4" />
              </motion.button>
            )}
            <motion.button
              type="button"
              onClick={onSave}
              disabled={!hasUnsavedChanges}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                hasUnsavedChanges
                  ? "bg-primary text-primary-foreground shadow-md hover:shadow-lg"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              }`}
            >
              保存
            </motion.button>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
