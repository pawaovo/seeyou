"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format, parseISO, getDay } from "date-fns";
import { zhCN } from "date-fns/locale";

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
  morning: "上午",
  afternoon: "下午",
  evening: "晚上",
};

const DAY_NAMES = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

// Calculate intensity with min/max limits
function getIntensity(count: number, maxCount: number): number {
  if (maxCount <= 0) return 0;
  const minIntensity = 0.15;
  const maxIntensity = 0.6;
  const ratio = count / maxCount;
  return minIntensity + ratio * (maxIntensity - minIntensity);
}

// Get color based on intensity level
function getIntensityColor(intensity: number): string {
  return `rgba(117, 179, 145, ${intensity})`;
}

export function DataInsight({ allSelections, currentUser }: DataInsightProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("leaderboard");

  // Calculate leaderboard data with user names
  const { slotData, maxCount } = useMemo(() => {
    const data: Record<string, { count: number; users: string[] }> = {};
    for (const [userName, slots] of Object.entries(allSelections)) {
      for (const slot of slots) {
        const key = `${slot.date}_${slot.slot}`;
        if (!data[key]) {
          data[key] = { count: 0, users: [] };
        }
        data[key].count += 1;
        data[key].users.push(userName);
      }
    }
    const max = Math.max(...Object.values(data).map(d => d.count), 1);
    return { slotData: data, maxCount: max };
  }, [allSelections]);

  const leaderboard = useMemo(() => {
    return Object.entries(slotData)
      .map(([key, data]) => {
        const [date, slot] = key.split("_");
        return { date, slot, count: data.count, users: data.users };
      })
      .sort((a, b) => b.count - a.count);
  }, [slotData]);

  const members = Object.entries(allSelections);

  // Calculate slot count for member's slot tags
  const getSlotCount = (date: string, slot: string): number => {
    const key = `${date}_${slot}`;
    return slotData[key]?.count || 0;
  };

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
          时间
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
          成员 ({members.length})
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
                还没有选择时间
              </p>
            ) : (
              leaderboard.map(({ date, slot, count, users }, index) => {
                const intensity = getIntensity(count, maxCount);
                return (
                  <motion.div
                    key={`${date}_${slot}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="relative overflow-hidden rounded-xl py-3 px-4"
                    style={{
                      background: `linear-gradient(90deg, ${getIntensityColor(intensity)} 0%, ${getIntensityColor(intensity * 0.3)} 60%, transparent 100%)`,
                    }}
                  >
                    <div className="flex items-center justify-between relative z-10">
                      <div>
                        <span className="font-serif text-foreground">
                          {format(parseISO(date), "M.d", { locale: zhCN })}{DAY_NAMES[getDay(parseISO(date))]}
                        </span>
                        <span className="text-muted-foreground mx-2">·</span>
                        <span className="text-muted-foreground text-sm">
                          {SLOT_LABELS[slot]}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-1">
                          {users.slice(0, 4).map((userName, i) => (
                            <div
                              key={i}
                              className="w-5 h-5 rounded-full bg-gradient-to-br from-zen-sage to-zen-mist border-2 border-card flex items-center justify-center text-[10px] text-primary-foreground font-medium"
                            >
                              {userName.charAt(0).toUpperCase()}
                            </div>
                          ))}
                          {users.length > 4 && (
                            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-zen-sage to-zen-mist border-2 border-card flex items-center justify-center text-[10px] text-primary-foreground font-medium">
                              +{users.length - 4}
                            </div>
                          )}
                        </div>
                        <span className="text-sm font-medium text-foreground min-w-[1.5rem] text-right">
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
                还没有成员
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
                              (我)
                            </span>
                          )}
                        </span>
                        <p className="text-xs text-muted-foreground">
                          已选择 {slots.length} 个时段
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Text-based slot list with intensity */}
                  <SlotList slots={slots} maxCount={maxCount} getSlotCount={getSlotCount} />
                </motion.div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function SlotList({
  slots,
  maxCount,
  getSlotCount
}: {
  slots: TimeSlot[];
  maxCount: number;
  getSlotCount: (date: string, slot: string) => number;
}) {
  if (slots.length === 0) {
    return (
      <div className="text-xs text-muted-foreground text-center py-2">
        暂无选择
      </div>
    );
  }

  // Sort slots by date and time
  const sortedSlots = [...slots].sort((a, b) => {
    const dateCompare = a.date.localeCompare(b.date);
    if (dateCompare !== 0) return dateCompare;
    const slotOrder = { morning: 0, afternoon: 1, evening: 2 };
    return slotOrder[a.slot] - slotOrder[b.slot];
  });

  return (
    <div className="flex flex-wrap gap-1.5">
      {sortedSlots.map((slot, index) => {
        const date = parseISO(slot.date);
        const dayName = DAY_NAMES[getDay(date)];
        const count = getSlotCount(slot.date, slot.slot);
        const intensity = getIntensity(count, maxCount);

        return (
          <span
            key={index}
            className="text-xs px-2 py-1 rounded-lg text-foreground transition-colors"
            style={{
              backgroundColor: getIntensityColor(intensity * 0.5),
            }}
          >
            {format(date, "M.d", { locale: zhCN })}{dayName} {SLOT_LABELS[slot.slot]}
          </span>
        );
      })}
    </div>
  );
}
