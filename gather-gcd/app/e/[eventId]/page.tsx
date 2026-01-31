"use client";

import { useState, useEffect, useCallback, use, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { startOfWeek, differenceInWeeks } from "date-fns";
import { CollaborativeCanvas } from "@/components/gather/collaborative-canvas";
import { ShareDialog } from "@/components/gather/share-dialog";
import { useEvent, responsesToSelections, selectionsToAvailability } from "@/hooks/use-event";
import { getOrCreateFingerprint } from "@/lib/fingerprint";
import { toast } from "sonner";
import type { TimeSlot, SlotType } from "@/types";

export const runtime = "edge";

const STORAGE_KEYS = {
  nickname: "gather_gcd_nickname",
  creatorTokens: "gather_gcd_creator_tokens",
  verifiedEvents: "gather_gcd_verified_events",
};

export default function EventPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(params);
  const router = useRouter();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<string>("");
  const [userFingerprint, setUserFingerprint] = useState<string>("");
  const [userSelections, setUserSelections] = useState<TimeSlot[]>([]);
  const [savedSelections, setSavedSelections] = useState<TimeSlot[]>([]);
  const [addedWeeks, setAddedWeeks] = useState<Set<number>>(new Set());
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [eventPasscode, setEventPasscode] = useState<string>("");
  const [isCreator, setIsCreator] = useState(false);
  const [isFirstSave, setIsFirstSave] = useState(true);

  const { event, responses, isLoading, error, refetch } = useEvent(eventId);

  // Convert responses to selections format
  const allSelections = responsesToSelections(responses);

  // Calculate weeks with data from all selections
  const weeksWithData = useMemo(() => {
    if (!event) return new Set<number>();

    const startDate = new Date(event.start_date);
    const baseWeekStart = startOfWeek(startDate, { weekStartsOn: 1 });
    const weeksSet = new Set<number>();

    // Check all selections from all users
    const allSlots = Object.values(allSelections).flat();
    for (const slot of allSlots) {
      const slotDate = new Date(slot.date);
      const slotWeekStart = startOfWeek(slotDate, { weekStartsOn: 1 });
      const weekIndex = differenceInWeeks(slotWeekStart, baseWeekStart);
      if (weekIndex >= 0) {
        weeksSet.add(weekIndex);
      }
    }

    // Also check current user's unsaved selections
    for (const slot of userSelections) {
      const slotDate = new Date(slot.date);
      const slotWeekStart = startOfWeek(slotDate, { weekStartsOn: 1 });
      const weekIndex = differenceInWeeks(slotWeekStart, baseWeekStart);
      if (weekIndex >= 0) {
        weeksSet.add(weekIndex);
      }
    }

    return weeksSet;
  }, [event, allSelections, userSelections]);

  // Calculate which weeks to display (only weeks with data + explicitly added weeks)
  const displayWeekIndices = useMemo(() => {
    const weeksSet = new Set<number>();

    // Add weeks that have data (limit to 0-3)
    for (const weekIndex of weeksWithData) {
      if (weekIndex >= 0 && weekIndex <= 3) {
        weeksSet.add(weekIndex);
      }
    }

    // Add explicitly added weeks
    for (const weekIndex of addedWeeks) {
      if (weekIndex >= 0 && weekIndex <= 3) {
        weeksSet.add(weekIndex);
      }
    }

    // If no weeks, default to week 0
    if (weeksSet.size === 0) {
      weeksSet.add(0);
    }

    return weeksSet;
  }, [weeksWithData, addedWeeks]);

  // Check if there are unsaved changes
  const hasUnsavedChanges = useCallback(() => {
    if (userSelections.length !== savedSelections.length) return true;
    const sortedCurrent = [...userSelections].sort((a, b) =>
      `${a.date}-${a.slot}`.localeCompare(`${b.date}-${b.slot}`)
    );
    const sortedSaved = [...savedSelections].sort((a, b) =>
      `${a.date}-${a.slot}`.localeCompare(`${b.date}-${b.slot}`)
    );
    return JSON.stringify(sortedCurrent) !== JSON.stringify(sortedSaved);
  }, [userSelections, savedSelections]);

  // Initialize fingerprint
  useEffect(() => {
    getOrCreateFingerprint().then(setUserFingerprint);
  }, []);

  // Check if user has already verified this event
  useEffect(() => {
    if (!eventId) return;

    const verifiedEvents = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.verifiedEvents) || "{}"
    );
    const savedNickname = localStorage.getItem(STORAGE_KEYS.nickname);

    if (verifiedEvents[eventId] && savedNickname) {
      setCurrentUser(savedNickname);
      setIsAuthenticated(true);
      setEventPasscode(verifiedEvents[eventId]);
    }

    // Check if user is creator
    const creatorTokens = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.creatorTokens) || "{}"
    );
    if (creatorTokens[eventId]) {
      setIsCreator(true);
    }
  }, [eventId]);

  // Load user's existing selections from responses
  useEffect(() => {
    if (!currentUser || !responses.length) return;

    const userResponse = responses.find((r) => r.nickname === currentUser);
    if (userResponse) {
      const slots: TimeSlot[] = [];
      for (const [date, slotTypes] of Object.entries(userResponse.availability)) {
        for (const slotType of slotTypes as SlotType[]) {
          slots.push({ date, slot: slotType });
        }
      }
      setUserSelections(slots);
      setSavedSelections(slots);
      setIsFirstSave(false);
    }
  }, [currentUser, responses]);

  const handleAuthenticated = useCallback(
    async (nickname: string) => {
      setCurrentUser(nickname);
      setIsAuthenticated(true);
      localStorage.setItem(STORAGE_KEYS.nickname, nickname);

      // Store verified event
      const verifiedEvents = JSON.parse(
        localStorage.getItem(STORAGE_KEYS.verifiedEvents) || "{}"
      );
      verifiedEvents[eventId] = eventPasscode;
      localStorage.setItem(
        STORAGE_KEYS.verifiedEvents,
        JSON.stringify(verifiedEvents)
      );
    },
    [eventId, eventPasscode]
  );

  const handleVerifyPasscode = useCallback(
    async (passcode: string): Promise<boolean> => {
      try {
        const response = await fetch(`/api/events/${eventId}/verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ passcode }),
        });

        if (response.ok) {
          setEventPasscode(passcode);
          return true;
        }
        return false;
      } catch {
        return false;
      }
    },
    [eventId]
  );

  const handleToggleSlot = useCallback(
    (date: string, slot: SlotType) => {
      setUserSelections((prev) => {
        const exists = prev.some((s) => s.date === date && s.slot === slot);
        if (exists) {
          return prev.filter((s) => !(s.date === date && s.slot === slot));
        }
        return [...prev, { date, slot }];
      });
    },
    []
  );

  const handleBatchToggle = useCallback(
    (slots: Array<{ date: string; slot: SlotType }>, select: boolean) => {
      setUserSelections((prev) => {
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

  const handleAddWeek = useCallback(() => {
    // Find next available week (0-3) not already shown
    const allShownWeeks = new Set([...weeksWithData, ...addedWeeks]);
    for (let i = 0; i <= 3; i++) {
      if (!allShownWeeks.has(i)) {
        setAddedWeeks(prev => new Set([...prev, i]));
        break;
      }
    }
  }, [weeksWithData, addedWeeks]);

  const handleSave = useCallback(async () => {
    if (!currentUser || !userFingerprint) return;

    try {
      const availability = selectionsToAvailability(userSelections);

      const response = await fetch("/api/responses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_id: eventId,
          nickname: currentUser,
          user_fingerprint: userFingerprint,
          availability,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "保存失败");
      }

      setSavedSelections([...userSelections]);
      // Clear added weeks - they will be recalculated from database data
      setAddedWeeks(new Set());
      toast.success("保存成功！");
      refetch();

      // Show share dialog on first save for creator
      if (isCreator && isFirstSave) {
        setIsFirstSave(false);
        setShowShareDialog(true);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "保存失败");
    }
  }, [eventId, currentUser, userFingerprint, userSelections, refetch, isCreator, isFirstSave]);

  const handleShare = useCallback(() => {
    setShowShareDialog(true);
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="w-12 h-12 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-muted-foreground text-sm">加载中...</p>
        </motion.div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="font-serif text-2xl text-foreground mb-4">{error}</h1>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="text-primary hover:underline"
          >
            返回首页
          </button>
        </motion.div>
      </div>
    );
  }

  // Auth gate with custom passcode verification
  if (!isAuthenticated && event) {
    return (
      <AuthGateWithVerification
        eventTitle={event.title}
        onVerify={handleVerifyPasscode}
        onAuthenticated={handleAuthenticated}
        defaultNickname={localStorage.getItem(STORAGE_KEYS.nickname) || ""}
      />
    );
  }

  if (!event) return null;

  return (
    <>
      <AnimatePresence mode="wait">
        <motion.div
          key="canvas"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <CollaborativeCanvas
            eventTitle={event.title}
            startDate={new Date(event.start_date)}
            displayWeekIndices={displayWeekIndices}
            weeksWithData={weeksWithData.size}
            currentUser={currentUser}
            userSelections={userSelections}
            allSelections={allSelections}
            hasUnsavedChanges={hasUnsavedChanges()}
            onToggleSlot={handleToggleSlot}
            onBatchToggle={handleBatchToggle}
            onAddWeek={handleAddWeek}
            onSave={handleSave}
            onShare={handleShare}
          />
        </motion.div>
      </AnimatePresence>

      <ShareDialog
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
        eventId={eventId}
        passcode={eventPasscode}
        eventTitle={event.title}
      />
    </>
  );
}

// Custom auth gate with passcode verification
function AuthGateWithVerification({
  eventTitle,
  onVerify,
  onAuthenticated,
  defaultNickname,
}: {
  eventTitle: string;
  onVerify: (passcode: string) => Promise<boolean>;
  onAuthenticated: (nickname: string) => void;
  defaultNickname: string;
}) {
  const [code, setCode] = useState<string[]>(["", "", "", ""]);
  const [nickname, setNickname] = useState(defaultNickname);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isCodeCorrect, setIsCodeCorrect] = useState(false);
  const [shake, setShake] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleDigitPress = async (digit: string) => {
    if (activeIndex >= 4 || isVerifying) return;

    const newCode = [...code];
    newCode[activeIndex] = digit;
    setCode(newCode);

    if (activeIndex < 3) {
      setActiveIndex(activeIndex + 1);
    } else {
      // Verify code
      setIsVerifying(true);
      const enteredCode = newCode.join("");
      const isValid = await onVerify(enteredCode);

      if (isValid) {
        setIsCodeCorrect(true);
      } else {
        setShake(true);
        setTimeout(() => {
          setShake(false);
          setCode(["", "", "", ""]);
          setActiveIndex(0);
        }, 500);
      }
      setIsVerifying(false);
    }
  };

  const handleBackspace = () => {
    if (activeIndex > 0 && !isVerifying) {
      const newCode = [...code];
      newCode[activeIndex - 1] = "";
      setCode(newCode);
      setActiveIndex(activeIndex - 1);
    }
  };

  const handleNicknameSubmit = () => {
    if (nickname.trim().length >= 1) {
      onAuthenticated(nickname.trim());
    }
  };

  const digits = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "←"];

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-zen-sage/10 blur-3xl animate-float" />
        <div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-zen-mist/20 blur-3xl animate-float"
          style={{ animationDelay: "1s" }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 w-full max-w-sm"
      >
        <AnimatePresence mode="wait">
          {!isCodeCorrect ? (
            <motion.div
              key="code-entry"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, x: -20 }}
              className="text-center"
            >
              <motion.h1
                className="font-serif text-3xl text-foreground mb-2"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {eventTitle}
              </motion.h1>
              <motion.p
                className="text-muted-foreground text-sm mb-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                输入活动口令
              </motion.p>

              <motion.div
                className={`flex justify-center gap-4 mb-10 ${shake ? "animate-shake" : ""}`}
                animate={shake ? { x: [0, -10, 10, -10, 10, 0] } : {}}
                transition={{ duration: 0.4 }}
              >
                {code.map((digit, index) => (
                  <motion.div
                    key={index}
                    className={`w-14 h-14 rounded-2xl glass flex items-center justify-center text-2xl font-serif transition-all duration-300 ${
                      index === activeIndex
                        ? "ring-2 ring-primary/50 shadow-lg"
                        : digit
                          ? "bg-zen-sage/20"
                          : ""
                    }`}
                    animate={
                      index === activeIndex
                        ? { scale: [1, 1.02, 1] }
                        : {}
                    }
                    transition={{
                      repeat: index === activeIndex ? Infinity : 0,
                      duration: 2,
                    }}
                  >
                    <span className="text-foreground">{digit}</span>
                  </motion.div>
                ))}
              </motion.div>

              <div className="grid grid-cols-3 gap-3 max-w-[240px] mx-auto">
                {digits.map((digit, index) => (
                  <motion.button
                    key={index}
                    type="button"
                    onClick={() => {
                      if (digit === "←") {
                        handleBackspace();
                      } else if (digit) {
                        handleDigitPress(digit);
                      }
                    }}
                    className={`w-16 h-16 rounded-full glass text-xl font-sans transition-all duration-200 ${
                      digit ? "hover:bg-zen-sage/20 active:scale-95" : "opacity-0 pointer-events-none"
                    }`}
                    whileTap={{ scale: 0.9 }}
                    whileHover={{ boxShadow: "0 0 20px rgba(117, 179, 145, 0.3)" }}
                    disabled={!digit || isVerifying}
                  >
                    <span className="text-foreground">{digit}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="nickname-entry"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", duration: 0.6 }}
                className="w-16 h-16 rounded-full bg-zen-sage/30 mx-auto mb-6 flex items-center justify-center"
              >
                <svg
                  className="w-8 h-8 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </motion.div>

              <h2 className="font-serif text-3xl text-foreground mb-2">
                欢迎
              </h2>
              <p className="text-muted-foreground text-sm mb-8">
                请输入你的昵称
              </p>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleNicknameSubmit()}
                  placeholder="你的昵称"
                  className="w-full px-6 py-4 rounded-2xl glass text-center text-lg font-sans text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  autoFocus
                  maxLength={20}
                />

                <motion.button
                  type="button"
                  onClick={handleNicknameSubmit}
                  disabled={nickname.trim().length < 1}
                  className="mt-6 w-full py-4 rounded-2xl bg-primary text-primary-foreground font-sans text-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
                  whileTap={{ scale: 0.98 }}
                >
                  进入聚会
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
