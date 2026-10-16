"use client";

import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useModalScroll } from "@/hooks/useModalScroll";
import { useBodyScrollLock, useTopmostEscape } from "@/hooks/useBodyScrollLock";
import { cn } from "@/lib/utils";

/**
 * GlassModal — the shared glass-dossier language (BUDI × reference):
 * reference cards are `rounded-3xl border-white/10 bg-black/40 backdrop-blur-xl
 * cursor-pointer` with zoom images + orange glow — this modal is the same
 * recipe, one size bigger: blurred dark backdrop + frosted panel + accent
 * crown + ESC/backdrop to close. Skills / Projects / Services / Certificates
 * all open through here, so every detail window feels like one product.
 */
export default function GlassModal({
  open,
  onClose,
  label,
  accent = "#ff3d00",
  wide,
  children,
}: {
  open: boolean;
  onClose: () => void;
  label: string;
  accent?: string;
  wide?: boolean;
  children: React.ReactNode;
}): React.JSX.Element {
  const reduced = useReducedMotion();
  const scroll = useModalScroll<HTMLDivElement>(open);
  // Counted lock (stacked dossier + image preview can't wedge the page)
  // + topmost-wins Escape (stacked layers peel off one press at a time).
  useBodyScrollLock(open);
  useTopmostEscape(open, onClose);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={label}
          initial={reduced ? { opacity: 0 } : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          onClick={onClose}
          className="fixed inset-0 z-[95] flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-xl sm:p-8"
        >
          <motion.div
            initial={reduced ? false : { scale: 0.95, y: 18 }}
            animate={{ scale: 1, y: 0 }}
            exit={reduced ? undefined : { scale: 0.95, y: 18 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            ref={scroll.ref}
            tabIndex={-1}
            onKeyDown={scroll.onKeyDown}
            className={cn(
              // Reference recipe: rounded-3xl + border-white/10 + bg-black/40 + backdrop-blur-xl
              "group/modal relative max-h-[90vh] w-full overflow-y-auto rounded-3xl border border-white/10 bg-black/40 shadow-[0_10px_40px_rgba(0,0,0,0.4)] backdrop-blur-xl focus:outline-none",
              wide ? "max-w-3xl" : "max-w-xl",
            )}
            style={{
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%), rgba(10,10,11,0.86)",
              boxShadow: `0 40px 120px -20px rgba(0,0,0,0.9), 0 20px 50px -20px ${accent}40`,
            }}
          >
            {/* Hover wash — same as reference cert-card gradient overlay */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 rounded-3xl opacity-0 transition duration-500 group-hover/modal:opacity-100"
              style={{ background: `linear-gradient(135deg, ${accent}14 0%, transparent 55%)` }}
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 rounded-3xl"
              style={{ background: `linear-gradient(180deg, ${accent}26 0%, transparent 22%)` }}
            />
            <span
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-[3px] rounded-t-3xl"
              style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)`, boxShadow: `0 0 18px ${accent}88` }}
            />
            {/* Inner hairline — reference hover border glow, always on here */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 rounded-3xl border border-white/[0.06]"
            />
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute top-3 right-3 z-20 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-white/15 bg-black/60 text-white/70 backdrop-blur-md transition-all hover:rotate-90 hover:border-[#ff3d00] hover:text-[#ff3d00]"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="relative p-6 sm:p-8">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
