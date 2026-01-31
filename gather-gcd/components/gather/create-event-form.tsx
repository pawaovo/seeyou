"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles, RefreshCw } from "lucide-react";

interface CreateEventFormProps {
  onSubmit: (title: string, nickname: string, passcode: string) => Promise<void>;
  isLoading?: boolean;
}

// Generate a random 4-digit passcode
function generatePasscode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

export function CreateEventForm({ onSubmit, isLoading = false }: CreateEventFormProps) {
  const [title, setTitle] = useState("");
  const [nickname, setNickname] = useState("");
  const [passcode, setPasscode] = useState("");
  const [passcodeMode, setPasscodeMode] = useState<"random" | "custom">("random");

  // Load saved nickname from localStorage and generate initial passcode
  useEffect(() => {
    const savedNickname = localStorage.getItem("gather_gcd_nickname");
    if (savedNickname) {
      setNickname(savedNickname);
    }
    setPasscode(generatePasscode());
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim().length < 1 || nickname.trim().length < 1 || passcode.length !== 4) return;
    await onSubmit(title.trim(), nickname.trim(), passcode);
  };

  const handleRegeneratePasscode = () => {
    setPasscode(generatePasscode());
  };

  const handlePasscodeChange = (value: string) => {
    // Only allow digits and max 4 characters
    const filtered = value.replace(/\D/g, "").slice(0, 4);
    setPasscode(filtered);
  };

  const isValid = title.trim().length >= 1 && nickname.trim().length >= 1 && passcode.length === 4;

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      onSubmit={handleSubmit}
      className="w-full max-w-md mx-auto space-y-6"
    >
      {/* Title input */}
      <div className="space-y-2">
        <label htmlFor="title" className="text-sm font-medium text-foreground">
          活动名称
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="例如：周末聚餐、团建活动"
          className="w-full px-4 py-3 rounded-2xl glass text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          maxLength={50}
          required
        />
        <p className="text-xs text-muted-foreground">
          {title.length}/50 字符
        </p>
      </div>

      {/* Nickname input */}
      <div className="space-y-2">
        <label htmlFor="nickname" className="text-sm font-medium text-foreground">
          你的昵称
        </label>
        <input
          id="nickname"
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="输入你的昵称"
          className="w-full px-4 py-3 rounded-2xl glass text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          maxLength={20}
          required
        />
        <p className="text-xs text-muted-foreground">
          {nickname.length}/20 字符
        </p>
      </div>

      {/* Passcode input */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          活动口令
        </label>

        {/* Mode toggle */}
        <div className="flex gap-2 mb-2">
          <button
            type="button"
            onClick={() => {
              setPasscodeMode("random");
              setPasscode(generatePasscode());
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-sm transition-all ${
              passcodeMode === "random"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            随机生成
          </button>
          <button
            type="button"
            onClick={() => setPasscodeMode("custom")}
            className={`flex-1 py-2 px-3 rounded-xl text-sm transition-all ${
              passcodeMode === "custom"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            自定义
          </button>
        </div>

        {passcodeMode === "random" ? (
          <div className="flex items-center gap-2">
            <div className="flex-1 px-4 py-3 rounded-2xl glass text-center font-serif text-2xl tracking-widest text-foreground">
              {passcode}
            </div>
            <motion.button
              type="button"
              onClick={handleRegeneratePasscode}
              className="p-3 rounded-2xl glass hover:bg-zen-sage/20 transition-colors"
              whileTap={{ scale: 0.95 }}
              aria-label="重新生成口令"
            >
              <RefreshCw className="w-5 h-5 text-muted-foreground" />
            </motion.button>
          </div>
        ) : (
          <input
            type="text"
            inputMode="numeric"
            value={passcode}
            onChange={(e) => handlePasscodeChange(e.target.value)}
            placeholder="输入4位数字口令"
            className="w-full px-4 py-3 rounded-2xl glass text-center font-serif text-2xl tracking-widest text-foreground placeholder:text-muted-foreground placeholder:text-base placeholder:tracking-normal focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            maxLength={4}
          />
        )}
        <p className="text-xs text-muted-foreground">
          4位数字口令，用于参与者进入活动
        </p>
      </div>

      {/* Preview */}
      <div className="glass rounded-2xl p-4 space-y-2">
        <p className="text-xs text-muted-foreground">预览</p>
        <p className="font-serif text-lg text-foreground">
          {title || "活动名称"}
        </p>
        <p className="text-sm text-muted-foreground">
          创建者: {nickname || "你的昵称"}
        </p>
        <p className="text-sm text-muted-foreground">
          口令: {passcode || "****"}
        </p>
      </div>

      {/* Submit button */}
      <motion.button
        type="submit"
        disabled={isLoading || !isValid}
        className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-medium text-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 flex items-center justify-center gap-2"
        whileTap={{ scale: 0.98 }}
      >
        {isLoading ? (
          <div className="w-5 h-5 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            创建活动
          </>
        )}
      </motion.button>
    </motion.form>
  );
}
