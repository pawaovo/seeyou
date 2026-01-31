"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Calendar, Users, Sparkles } from "lucide-react";
import Image from "next/image";

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 overflow-hidden">
      {/* Ambient background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-zen-sage/10 blur-3xl animate-float" />
        <div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-zen-mist/20 blur-3xl animate-float"
          style={{ animationDelay: "1s" }}
        />
        <div
          className="absolute top-1/2 right-1/3 w-48 h-48 rounded-full bg-zen-sand/15 blur-3xl animate-float"
          style={{ animationDelay: "2s" }}
        />
      </div>

      {/* Decorative SVG icons - distributed around title area */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 0.6, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="absolute top-[20%] left-[22%]"
          style={{ transform: "rotate(-12deg)" }}
        >
          <Image src="/icons/decor-1.svg" alt="" width={56} height={56} />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 0.5, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="absolute top-[16%] right-[10%]"
          style={{ transform: "rotate(15deg)" }}
        >
          <Image src="/icons/decor-2.svg" alt="" width={48} height={48} />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 0.55, scale: 1 }}
          transition={{ delay: 0.7, duration: 0.8 }}
          className="absolute top-[38%] left-[15%]"
          style={{ transform: "rotate(8deg)" }}
        >
          <Image src="/icons/decor-4.svg" alt="" width={52} height={52} />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 0.5, scale: 1 }}
          transition={{ delay: 0.9, duration: 0.8 }}
          className="absolute top-[32%] right-[15%]"
          style={{ transform: "rotate(-18deg)" }}
        >
          <Image src="/icons/decor-10.svg" alt="" width={60} height={60} />
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md text-center"
      >
        {/* Logo / Title */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="font-serif text-5xl text-foreground mb-3">
            约不约
          </h1>
        </motion.div>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-muted-foreground mb-12 text-balance"
        >
          ok不ok
        </motion.p>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-3 gap-4 mb-12"
        >
          <div className="glass rounded-2xl p-4 flex flex-col items-center gap-2">
            <Calendar className="w-6 h-6 text-zen-sage" />
            <span className="text-xs text-muted-foreground">创建活动</span>
          </div>
          <div className="glass rounded-2xl p-4 flex flex-col items-center gap-2">
            <Users className="w-6 h-6 text-zen-sage" />
            <span className="text-xs text-muted-foreground">日期选择</span>
          </div>
          <div className="glass rounded-2xl p-4 flex flex-col items-center gap-2">
            <Sparkles className="w-6 h-6 text-zen-sage" />
            <span className="text-xs text-muted-foreground">找到最佳</span>
          </div>
        </motion.div>

        {/* CTA Button - simple text only, no icon, no fill */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          onClick={() => router.push("/create")}
          className="w-full py-4 rounded-2xl border-2 border-foreground/20 text-foreground font-medium text-lg transition-all hover:border-foreground/40 hover:bg-foreground/5"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          创建新活动
        </motion.button>
      </motion.div>
    </div>
  );
}
