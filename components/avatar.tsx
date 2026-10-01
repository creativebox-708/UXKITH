"use client";

import { useState } from "react";

function initials(name: string) {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("") || "?";
}

export function Avatar({
  name,
  src,
  size = 44,
  className = "",
}: {
  name: string;
  src?: string | null;
  size?: number;
  className?: string;
}) {
  const [broken, setBroken] = useState(false);
  const showImage = Boolean(src) && !broken;

  return (
    <span
      className={`relative grid shrink-0 place-items-center overflow-hidden rounded-full border border-line-soft bg-surface-hi text-muted ${className}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}
    >
      {showImage ? (
        // LinkedIn CDN urls expire, so this falls back to initials rather than
        // failing the whole route through the image optimizer.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src!}
          alt=""
          width={size}
          height={size}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setBroken(true)}
          className="size-full object-cover"
        />
      ) : (
        <span className="font-semibold tracking-tight select-none" aria-hidden>
          {initials(name)}
        </span>
      )}
    </span>
  );
}
