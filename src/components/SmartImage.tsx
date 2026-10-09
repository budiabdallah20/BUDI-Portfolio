import Image from "next/image";
import type { CSSProperties } from "react";

interface SmartImageProps {
  src: string;
  alt: string;
  className?: string;
  /** Passed to next/image in fill mode (ignored for data: URLs). */
  sizes?: string;
  loading?: "lazy" | "eager";
  /** Above-the-fold images (hero) — eager load, no lazy delay. */
  priority?: boolean;
  /** Must be listed in next.config images.qualities — defaults to 75. */
  quality?: number;
  /** Fixed mode — renders next/image with explicit dimensions. */
  width?: number;
  height?: number;
  /** Fill mode — parent must be relative with a set size. */
  fill?: boolean;
  /** How the image fits its box (both paths). */
  fit?: "cover" | "contain";
}

/**
 * Image that never breaks the page:
 * - `data:` uploads and remote `http(s)` URLs render as a plain <img>
 *   (no next/image optimizer config needed, no hostname allowlist risk),
 * - local `/images/...` paths go through next/image as before.
 * No layout shift in either path — callers must size the box.
 */
export default function SmartImage({
  src,
  alt,
  className,
  sizes,
  loading,
  priority,
  quality,
  width,
  height,
  fill,
  fit,
}: SmartImageProps): React.JSX.Element {
  const load = priority ? "eager" : (loading ?? "lazy");
  if (src.startsWith("data:") || /^https?:\/\//i.test(src)) {
    if (fill) {
      const style: CSSProperties = {
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: fit ?? "cover",
      };
      // eslint-disable-next-line @next/next/no-img-element
      return <img src={src} alt={alt} loading={load} className={className} style={style} />;
    }
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} loading={load} className={className} />;
  }
  if (width && height) {
    return (
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={load}
        quality={quality}
        priority={priority}
        className={className}
      />
    );
  }
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes ?? "100vw"}
      loading={load}
      quality={quality}
      priority={priority}
      className={className}
    />
  );
}
