/**
 * BUDI monogram — transparent architectural mark: a hexagonal orbit in the
 * current text color, a bold B at its core, and a lime signal-node pinned
 * to the top vertex. No backdrop tile, so it floats clean on glass —
 * in both themes — with a soft lime aura.
 */
export default function Logo(): React.JSX.Element {
  return (
    <span
      className="relative flex h-10 w-10 items-center justify-center text-foreground"
      aria-hidden="true"
    >
      <svg
        width="40"
        height="40"
        viewBox="0 0 40 40"
        className="block h-10 w-10 transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-105"
        style={{ filter: "drop-shadow(0 0 10px rgba(255,61,0,0.35))" }}
      >
        <polygon
          points="20,4 33.5,11.8 33.5,27.2 20,35 6.5,27.2 6.5,11.8"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinejoin="round"
          opacity="0.9"
        />
        <text
          x="20"
          y="27.5"
          textAnchor="middle"
          fontSize="17"
          fontWeight="800"
          fontFamily="'Space Grotesk', Inter, sans-serif"
          fill="currentColor"
        >
          B
        </text>
        <circle cx="20" cy="4" r="5.5" fill="rgba(255,61,0,0.22)" />
        <circle cx="20" cy="4" r="2.6" style={{ fill: "var(--accent)" }} />
        <circle cx="20" cy="4" r="1.1" style={{ fill: "var(--background)" }} />
      </svg>
    </span>
  );
}
