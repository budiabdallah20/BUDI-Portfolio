"use client";

import { useEffect, useLayoutEffect, useRef, type MouseEvent, type ReactNode } from "react";
import { X } from "lucide-react";
import gsap from "gsap";
import { lockBodyScroll } from "@/hooks/useBodyScrollLock";
import styles from "./editorial-services.module.css";

export const dossierId = "services-details";
export const dossierTitleId = "services-detail-heading";

function DialogCornerBrackets() {
  return (
    <svg
      aria-hidden="true"
      className={styles.modalBrackets}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M 0 16 L 0 0 L 16 0" stroke="var(--budi-gold-400)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      <path d="M 84 0 L 100 0 L 100 16" stroke="var(--budi-gold-400)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      <path d="M 0 84 L 0 100 L 16 100" stroke="var(--budi-gold-400)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      <path d="M 84 100 L 100 100 L 100 84" stroke="var(--budi-gold-400)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export default function ServiceDossierWindow({
  serviceKey,
  caption,
  closeLabel,
  opener,
  onDismiss,
  children,
}: {
  serviceKey: string;
  caption: string;
  closeLabel: string;
  opener: HTMLButtonElement | null;
  onDismiss: () => void;
  children: ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const scroll = useRef<HTMLDivElement>(null);
  const releaseScroll = useRef<(() => void) | undefined>(undefined);
  const exit = useRef<gsap.core.Tween | undefined>(undefined);
  const outsideDown = useRef(false);

  useLayoutEffect(() => {
    const node = dialog.current;
    if (!node) return;
    releaseScroll.current = lockBodyScroll();
    node.showModal();
    return () => {
      exit.current?.kill();
      releaseScroll.current?.();
      if (node.open) node.close();
    };
  }, []);

  useLayoutEffect(() => {
    const viewport = scroll.current;
    if (!viewport) return;
    viewport.scrollTop = 0;
    viewport.querySelector<HTMLElement>("#" + dossierTitleId)?.focus({ preventScroll: true });
  }, [serviceKey]);

  useEffect(() => {
    const viewport = scroll.current;
    if (
      !viewport ||
      !("IntersectionObserver" in window) ||
      matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const { target, isIntersecting } of entries) {
          if (!isIntersecting) continue;
          target.setAttribute("data-dossier-visible", "");
          observer.unobserve(target);
        }
      },
      { root: viewport, threshold: 0.15 }
    );
    viewport.querySelectorAll("[data-dossier-reveal]").forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, [serviceKey]);

  function dismiss(afterClose?: () => void) {
    const node = dialog.current;
    if (!node?.open || node.dataset.closing === "true") return;
    const finish = () => {
      releaseScroll.current?.();
      node.close();
      opener?.focus({ preventScroll: true });
      onDismiss();
      afterClose?.();
    };
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      finish();
      return;
    }
    node.dataset.closing = "true";
    exit.current = gsap.to(node, {
      opacity: 0,
      y: 8,
      scale: 0.985,
      duration: 0.18,
      ease: "power2.in",
      onComplete: finish,
    });
  }

  function followFragment(event: MouseEvent<HTMLDialogElement>) {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey
    )
      return;
    const link =
      event.target instanceof Element && event.target.closest<HTMLAnchorElement>('a[href^="#"]');
    if (!link || !document.getElementById(link.hash.slice(1))) return;
    event.preventDefault();
    dismiss(() => {
      if (location.hash !== link.hash) location.hash = link.hash;
      else {
        const target = document.getElementById(link.hash.slice(1));
        target?.scrollIntoView({ block: "start" });
        target?.focus({ preventScroll: true });
      }
    });
  }

  return (
    <dialog
      ref={dialog}
      id={dossierId}
      className={styles.dossier}
      aria-labelledby={dossierTitleId}
      onCancel={(event) => {
        event.preventDefault();
        dismiss();
      }}
      onPointerDown={(event) => {
        outsideDown.current = event.target === event.currentTarget;
      }}
      onClick={(event) => {
        if (outsideDown.current && event.target === event.currentTarget) dismiss();
        else followFragment(event);
        outsideDown.current = false;
      }}
      onKeyDown={(event) => {
        if (event.key !== "Tab") return;
        const stops = event.currentTarget.querySelectorAll<HTMLElement>(
          "a[href], button:not([disabled])"
        );
        const first = stops[0];
        const last = stops[stops.length - 1];
        if (!first || !last) return;
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }}
    >
      <div className={styles.windowFrame}>
        <DialogCornerBrackets />
        <div className={styles.windowBar}>
          <div className={styles.windowBarLabel}>
            <span className={styles.windowBarDot} aria-hidden="true" />
            <span>{caption}</span>
          </div>
          <button
            className={styles.close}
            type="button"
            aria-label={closeLabel}
            onClick={() => dismiss()}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <div ref={scroll} className={styles.windowScroll} data-lenis-prevent>
          {children}
        </div>
      </div>
    </dialog>
  );
}
