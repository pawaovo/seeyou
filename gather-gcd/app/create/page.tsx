"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { CreateEventForm } from "@/components/gather/create-event-form";
import { toast } from "sonner";
import Image from "next/image";

export default function CreatePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (title: string, nickname: string, passcode: string) => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          passcode,
          start_date: new Date().toISOString().split("T")[0],
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "创建失败");
      }

      const data = await response.json();

      // Store creator token in localStorage
      const creatorTokens = JSON.parse(
        localStorage.getItem("gather_gcd_creator_tokens") || "{}"
      );
      creatorTokens[data.id] = data.creator_token;
      localStorage.setItem(
        "gather_gcd_creator_tokens",
        JSON.stringify(creatorTokens)
      );

      // Store nickname in localStorage
      localStorage.setItem("gather_gcd_nickname", nickname);

      // Store verified event (so user doesn't need to enter passcode again)
      const verifiedEvents = JSON.parse(
        localStorage.getItem("gather_gcd_verified_events") || "{}"
      );
      verifiedEvents[data.id] = data.passcode;
      localStorage.setItem(
        "gather_gcd_verified_events",
        JSON.stringify(verifiedEvents)
      );

      toast.success("活动创建成功！");

      // Navigate directly to the event page
      router.push(`/e/${data.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "创建失败");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Ambient background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-zen-sage/10 blur-3xl animate-float" />
        <div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-zen-mist/20 blur-3xl animate-float"
          style={{ animationDelay: "1s" }}
        />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/50">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <motion.button
            type="button"
            onClick={() => router.back()}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>
          <h1 className="font-serif text-xl text-foreground">创建活动</h1>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-2xl mx-auto px-4 py-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center relative"
        >
          <p className="text-muted-foreground">
            创建新活动
          </p>
        </motion.div>

        <CreateEventFormWithIcons onSubmit={handleSubmit} isLoading={isLoading} />
      </main>
    </div>
  );
}

// Wrapper component that adds decorative icons within the form layout
function CreateEventFormWithIcons({
  onSubmit,
  isLoading
}: {
  onSubmit: (title: string, nickname: string, passcode: string) => Promise<void>;
  isLoading: boolean;
}) {
  return (
    <div className="relative w-full max-w-md mx-auto">
      {/* Icon 1: Top center-left area */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 0.5, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="absolute -top-4 left-[25%] pointer-events-none"
        style={{ transform: "rotate(-12deg)" }}
      >
        <Image src="/icons/decor-3.svg" alt="" width={38} height={38} />
      </motion.div>

      {/* Icon 2: Top center-right area */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 0.5, scale: 1 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="absolute -top-10 right-[15%] pointer-events-none"
        style={{ transform: "rotate(15deg)" }}
      >
        <Image src="/icons/decor-5.svg" alt="" width={36} height={36} />
      </motion.div>

      {/* Icon 3: Between title input and nickname label, center-left */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 0.45, scale: 1 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        className="absolute left-[40%] top-[33%] pointer-events-none"
        style={{ transform: "rotate(-8deg)" }}
      >
        <Image src="/icons/decor-6.svg" alt="" width={34} height={34} />
      </motion.div>

      <CreateEventForm onSubmit={onSubmit} isLoading={isLoading} />
    </div>
  );
}
