"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface AuthGateProps {
  onAuthenticated: (nickname: string) => void;
  eventCode: string;
  eventTitle?: string;
  defaultNickname?: string;
}

export function AuthGate({ onAuthenticated, eventCode, eventTitle, defaultNickname = "" }: AuthGateProps) {
  const [code, setCode] = useState<string[]>(["", "", "", ""]);
  const [nickname, setNickname] = useState(defaultNickname);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isCodeCorrect, setIsCodeCorrect] = useState(false);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    if (defaultNickname) {
      setNickname(defaultNickname);
    }
  }, [defaultNickname]);

  const handleDigitPress = (digit: string) => {
    if (activeIndex >= 4) return;

    const newCode = [...code];
    newCode[activeIndex] = digit;
    setCode(newCode);

    if (activeIndex < 3) {
      setActiveIndex(activeIndex + 1);
    } else {
      // Check code
      const enteredCode = newCode.join("");
      if (enteredCode === eventCode) {
        setIsCodeCorrect(true);
      } else {
        setShake(true);
        setTimeout(() => {
          setShake(false);
          setCode(["", "", "", ""]);
          setActiveIndex(0);
        }, 500);
      }
    }
  };

  const handleBackspace = () => {
    if (activeIndex > 0) {
      const newCode = [...code];
      newCode[activeIndex - 1] = "";
      setCode(newCode);
      setActiveIndex(activeIndex - 1);
    }
  };

  const handleNicknameSubmit = () => {
    if (nickname.trim().length >= 2) {
      onAuthenticated(nickname.trim());
    }
  };

  const digits = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "←"];

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      {/* Ambient background elements */}
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
                className="font-serif text-4xl text-foreground mb-2"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {eventTitle || "聚会公约数"}
              </motion.h1>
              <motion.p
                className="text-muted-foreground text-sm mb-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                输入活动口令
              </motion.p>

              {/* Code display */}
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
                        ? {
                            scale: [1, 1.02, 1],
                          }
                        : {}
                    }
                    transition={{
                      repeat: index === activeIndex ? Number.POSITIVE_INFINITY : 0,
                      duration: 2,
                    }}
                  >
                    <span className="text-foreground">{digit}</span>
                  </motion.div>
                ))}
              </motion.div>

              {/* Circular keypad */}
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
                    disabled={!digit}
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
                  disabled={nickname.trim().length < 2}
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
