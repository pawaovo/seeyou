"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Copy, Check, QrCode, Link2, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  passcode: string;
  eventTitle: string;
}

export function ShareDialog({
  open,
  onOpenChange,
  eventId,
  passcode,
  eventTitle,
}: ShareDialogProps) {
  const router = useRouter();
  const [copied, setCopied] = useState<"link" | "passcode" | null>(null);

  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/e/${eventId}`
    : `/e/${eventId}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied("link");
      toast.success("链接已复制");
      setTimeout(() => setCopied(null), 2000);
    } catch {
      toast.error("复制失败");
    }
  };

  const handleCopyPasscode = async () => {
    try {
      await navigator.clipboard.writeText(passcode);
      setCopied("passcode");
      toast.success("口令已复制");
      setTimeout(() => setCopied(null), 2000);
    } catch {
      toast.error("复制失败");
    }
  };

  const handleCopyAll = async () => {
    const text = `${eventTitle}\n\n链接: ${shareUrl}\n口令: ${passcode}`;
    try {
      await navigator.clipboard.writeText(text);
      toast.success("已复制链接和口令");
    } catch {
      toast.error("复制失败");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-3xl">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">分享活动</DialogTitle>
          <DialogDescription>
            将链接和口令分享给参与者
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Event title */}
          <div className="text-center py-4 glass rounded-2xl">
            <p className="font-serif text-lg text-foreground">{eventTitle}</p>
          </div>

          {/* Share link */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Link2 className="w-4 h-4" />
              活动链接
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1 px-4 py-3 rounded-xl bg-secondary text-sm text-foreground truncate"
              />
              <motion.button
                type="button"
                onClick={handleCopyLink}
                whileTap={{ scale: 0.95 }}
                className="p-3 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors"
              >
                {copied === "link" ? (
                  <Check className="w-4 h-4 text-zen-sage" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </motion.button>
            </div>
          </div>

          {/* Passcode */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <QrCode className="w-4 h-4" />
              活动口令
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 px-4 py-3 rounded-xl bg-secondary flex items-center justify-center gap-1">
                {passcode.split("").map((digit, index) => (
                  <span
                    key={index}
                    className="w-8 h-10 rounded-lg bg-card flex items-center justify-center text-xl font-serif text-foreground"
                  >
                    {digit}
                  </span>
                ))}
              </div>
              <motion.button
                type="button"
                onClick={handleCopyPasscode}
                whileTap={{ scale: 0.95 }}
                className="p-3 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors"
              >
                {copied === "passcode" ? (
                  <Check className="w-4 h-4 text-zen-sage" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </motion.button>
            </div>
          </div>

          {/* Copy all button */}
          <motion.button
            type="button"
            onClick={handleCopyAll}
            whileTap={{ scale: 0.98 }}
            className="w-full py-3 rounded-xl border-2 border-foreground/20 text-foreground font-medium transition-all hover:border-foreground/40 hover:bg-foreground/5"
          >
            一键复制链接和口令
          </motion.button>

          {/* Create new event button */}
          <motion.button
            type="button"
            onClick={() => {
              onOpenChange(false);
              router.push("/create");
            }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-3 rounded-xl bg-secondary text-secondary-foreground font-medium transition-all hover:bg-secondary/80 flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            创建新活动
          </motion.button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
