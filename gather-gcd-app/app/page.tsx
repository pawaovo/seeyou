"use client";

import { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AuthGate } from "@/components/gather/auth-gate";
import { CollaborativeCanvas } from "@/components/gather/collaborative-canvas";

interface TimeSlot {
  date: string;
  slot: "morning" | "afternoon" | "evening";
}

// Demo event configuration
const EVENT_CONFIG = {
  code: "1234",
  title: "Team Retreat Planning",
  startDate: new Date(),
};

const STORAGE_KEYS = {
  user: "gather_gcd_user",
  selections: "gather_gcd_selections",
  allUsers: "gather_gcd_all_users",
};

export default function GatherGCD() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<string>("");
  const [userSelections, setUserSelections] = useState<TimeSlot[]>([]);
  const [allSelections, setAllSelections] = useState<Record<string, TimeSlot[]>>({});
  const [weeks, setWeeks] = useState(2);
  const [isLoading, setIsLoading] = useState(true);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [lastSavedSelections, setLastSavedSelections] = useState<TimeSlot[]>([]);

  // Load saved state from localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem(STORAGE_KEYS.user);
    const savedAllSelections = localStorage.getItem(STORAGE_KEYS.allUsers);

    if (savedAllSelections) {
      const parsed = JSON.parse(savedAllSelections);
      setAllSelections(parsed);
    }

    if (savedUser) {
      setCurrentUser(savedUser);
      const savedSelections = localStorage.getItem(`${STORAGE_KEYS.selections}_${savedUser}`);
      if (savedSelections) {
        setUserSelections(JSON.parse(savedSelections));
      }
      setIsAuthenticated(true);
    }

    setIsLoading(false);
  }, []);

  // Save selections to localStorage whenever they change
  useEffect(() => {
    if (currentUser && userSelections.length >= 0) {
      localStorage.setItem(
        `${STORAGE_KEYS.selections}_${currentUser}`,
        JSON.stringify(userSelections)
      );

      // Update all selections
      const newAllSelections = { ...allSelections, [currentUser]: userSelections };
      setAllSelections(newAllSelections);
      localStorage.setItem(STORAGE_KEYS.allUsers, JSON.stringify(newAllSelections));
    }
  }, [userSelections, currentUser]);

  const handleAuthenticated = useCallback((nickname: string) => {
    setCurrentUser(nickname);
    setIsAuthenticated(true);
    localStorage.setItem(STORAGE_KEYS.user, nickname);

    // Load existing selections for this user if any
    const savedSelections = localStorage.getItem(`${STORAGE_KEYS.selections}_${nickname}`);
    if (savedSelections) {
      setUserSelections(JSON.parse(savedSelections));
    }
  }, []);

  const handleToggleSlot = useCallback(
    (date: string, slot: "morning" | "afternoon" | "evening") => {
      setUserSelections((prev) => {
        const exists = prev.some((s) => s.date === date && s.slot === slot);
        if (exists) {
          return prev.filter((s) => !(s.date === date && s.slot === slot));
        }
        return [...prev, { date, slot }];
      });
      setIsDirty(true);
    },
    []
  );

  const handleBatchToggle = useCallback(
    (slots: Array<{ date: string; slot: "morning" | "afternoon" | "evening" }>, select: boolean) => {
      setUserSelections((prev) => {
        if (select) {
          // Add all slots that aren't already selected
          const newSlots = slots.filter(
            (newSlot) => !prev.some((s) => s.date === newSlot.date && s.slot === newSlot.slot)
          );
          return [...prev, ...newSlots];
        } else {
          // Remove all matching slots
          return prev.filter(
            (s) => !slots.some((removeSlot) => removeSlot.date === s.date && removeSlot.slot === s.slot)
          );
        }
      });
      setIsDirty(true);
    },
    []
  );

  const handleAddWeek = useCallback(() => {
    setWeeks((prev) => Math.min(prev + 1, 12)); // Max 12 weeks
  }, []);

  const handleSave = useCallback(() => {
    setLastSavedSelections([...userSelections]);
    setIsDirty(false);
    setIsSaved(true);
  }, [userSelections]);

  const handleEdit = useCallback(() => {
    setIsSaved(false);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="w-12 h-12 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-muted-foreground text-sm">Loading your gathering...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {!isAuthenticated ? (
        <motion.div
          key="auth"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <AuthGate onAuthenticated={handleAuthenticated} eventCode={EVENT_CONFIG.code} />
        </motion.div>
      ) : (
        <motion.div
          key="canvas"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <CollaborativeCanvas
            eventTitle={EVENT_CONFIG.title}
            startDate={EVENT_CONFIG.startDate}
            weeks={weeks}
            currentUser={currentUser}
            userSelections={userSelections}
            allSelections={allSelections}
            onToggleSlot={handleToggleSlot}
            onBatchToggle={handleBatchToggle}
            onAddWeek={handleAddWeek}
            isSaved={isSaved}
            onSave={handleSave}
            onEdit={handleEdit}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
