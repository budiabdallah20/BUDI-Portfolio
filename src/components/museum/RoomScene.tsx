/* eslint-disable @next/next/no-img-element */
/** Photographic architecture. Sources and adaptation licenses: ASSET_CREDITS.md. */
export default function RoomScene({ scene, priority = false }: { scene: string; priority?: boolean }) {
  return <div className={`room-scene room-scene--${scene}`} aria-hidden="true">
    {priority && <>
      <link rel="preload" as="image" href={`/images/museum/${scene}-640.webp`} media="(max-width: 640px)" />
      <link rel="preload" as="image" href={`/images/museum/${scene}-1600.webp`} media="(min-width: 641px)" />
    </>}
    <picture>
      <source media="(max-width: 640px)" srcSet={`/images/museum/${scene}-640.webp`} />
      <img src={`/images/museum/${scene}-1600.webp`} alt="" width={1600} height={1066}
        loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : "auto"} decoding="async" />
    </picture>
  </div>;
}
