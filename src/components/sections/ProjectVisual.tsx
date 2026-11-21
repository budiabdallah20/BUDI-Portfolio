"use client";

import Image from "next/image";
import { useState } from "react";
import { isProjectMedia, raqibPhone } from "./ProjectPresentation";

function ProjectImage({ src, alt, sizes, eager, stamp }: {
  src: string;
  alt: string;
  sizes: string;
  eager?: boolean;
  stamp?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  if (failed || !isProjectMedia(src)) return null;
  return <Image src={src} alt={alt} {...(stamp ? { width: 56, height: 56 } : { fill: true, sizes })}
    unoptimized={!src.startsWith("/")}
    loading={eager ? "eager" : "lazy"} onError={() => setFailed(true)} />;
}

export function ProjectVisual({ source, title, category, caption, phone, eager, wide }: {
  source?: string;
  title: string;
  category?: string;
  caption: string;
  phone?: boolean;
  eager?: boolean;
  wide?: boolean;
}) {
  const identity = !source || /\.svg(?:[?#]|$)/i.test(source);
  const sizes = wide ? "(max-width: 760px) 94vw, (max-width: 1320px) 70vw, 1060px" :
    "(max-width: 760px) 88vw, (max-width: 1320px) 44vw, 620px";

  return (
    <figure className="project-visual" data-identity={identity}>
      <div className="project-visual-mat" data-device={phone ? "paired" : undefined}>
        <div className="project-visual-screen">
          <div className="project-visual-fallback" aria-hidden={!identity}>
            <span>{category}</span><strong>{title}</strong>
          </div>
          {source && <ProjectImage key={source} src={source} alt={identity ? "" : caption} sizes={sizes} eager={eager} stamp={identity} />}
        </div>
        {phone && (
          <div className="project-visual-phone">
            <ProjectImage src={raqibPhone} alt="" sizes="(max-width: 760px) 16vw, 155px" eager={eager} />
          </div>
        )}
      </div>
    </figure>
  );
}
