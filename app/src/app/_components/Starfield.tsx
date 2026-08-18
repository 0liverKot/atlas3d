'use client'
import { useMemo } from "react";

interface Star {
  top: string;
  left: string;
  size: number;
  duration: number;
  delay: number;
  glow: boolean;
}

const STAR_COUNT = 150;

export default function Starfield() {
  const stars = useMemo<Star[]>(
    () =>
      Array.from({ length: STAR_COUNT }, () => ({
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
        size: Math.random() * 1.5 + 1,
        duration: Math.random() * 4 + 2,
        delay: -Math.random() * 6,
        glow: Math.random() > 0.8,
      })),
    []
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      {stars.map((star, i) => (
        <span
          key={i}
          className="star absolute rounded-full bg-white"
          style={{
            top: star.top,
            left: star.left,
            width: star.size,
            height: star.size,
            boxShadow: star.glow ? `0 0 ${star.size * 4}px ${star.size}px rgba(255,255,255,0.4)` : undefined,
            animationDuration: `${star.duration}s`,
            animationDelay: `${star.delay}s`,
          }}
        />
      ))}
    </div>
  );
}