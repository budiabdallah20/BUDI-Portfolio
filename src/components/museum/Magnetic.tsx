"use client";

import type { PointerEvent, ReactNode } from "react";
import { motion, useMotionValue, useSpring } from "motion/react";

type MagneticProps = {
  children: ReactNode;
  className?: string;
  href?: string;
  onClick?: () => void;
  ariaLabel?: string;
};

/** Spring-loaded magnetic wrapper used for the project action buttons. */
export default function Magnetic({ children, className, href, onClick, ariaLabel }: MagneticProps): React.JSX.Element {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 260, damping: 20, mass: 0.4 });
  const springY = useSpring(y, { stiffness: 260, damping: 20, mass: 0.4 });

  const move = (event: PointerEvent<HTMLElement>): void => {
    const bounds = event.currentTarget.getBoundingClientRect();
    x.set((event.clientX - bounds.left - bounds.width / 2) * 0.24);
    y.set((event.clientY - bounds.top - bounds.height / 2) * 0.24);
  };
  const reset = (): void => {
    x.set(0);
    y.set(0);
  };

  if (href) {
    return (
      <motion.a href={href} className={className} style={{ x: springX, y: springY }} onPointerMove={move} onPointerLeave={reset}
        target="_blank" rel="noreferrer" aria-label={ariaLabel}>
        {children}
      </motion.a>
    );
  }
  return (
    <motion.button type="button" className={className} style={{ x: springX, y: springY }} onPointerMove={move} onPointerLeave={reset}
      onClick={onClick} aria-label={ariaLabel}>
      {children}
    </motion.button>
  );
}
