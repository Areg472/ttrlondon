"use client";

import React from "react";
import { CITIES } from "../data/gameData";

export function TicketCard({
  cityA,
  cityB,
  cityAPos,
  cityBPos,
  points,
  width = 210,
  height = 120,
  opposite = false,
}) {
  const getCityData = (name, manualPos) => {
    const city = CITIES.find((c) => c.name === name);
    const pos = manualPos || city || { x: 0, y: 0 };
    return {
      pos: { x: (pos.x / 1200) * width, y: (pos.y / 666.6) * height },
      number: city?.number,
    };
  };

  const dataA = getCityData(cityA, cityAPos),
    dataB = getCityData(cityB, cityBPos);
  const clamp = (val, min, max) => Math.max(min, Math.min(max, val));

  const ax = clamp(dataA.pos.x, 8, width - 8),
    ay = clamp(dataA.pos.y, 8, height - 8);
  const bx = clamp(dataB.pos.x, 8, width - 8),
    by = clamp(dataB.pos.y, 8, height - 8);

  return (
    <div
      className="rounded-lg shadow-md border border-zinc-300 dark:border-zinc-700 bg-amber-50 dark:bg-zinc-800 relative overflow-hidden select-none"
      style={{ width, height }}
    >
      <div
        className="absolute inset-0 opacity-[0.06] dark:opacity-[0.08] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(#000 1px, transparent 1px)",
          backgroundSize: "10px 10px",
        }}
      />

      {opposite ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-3xl font-black tracking-widest text-zinc-800 dark:text-zinc-100 opacity-20 transform -rotate-12 select-none">
            TICKET
          </span>
        </div>
      ) : (
        <>
          <div className="absolute top-2 right-4 text-lg font-bold text-zinc-800 dark:text-zinc-100 z-10">
            {points}
          </div>

          <svg width={width} height={height} className="absolute inset-0">
            <line
              x1={ax}
              y1={ay}
              x2={bx}
              y2={by}
              stroke="#374151"
              strokeOpacity="0.9"
              strokeWidth="2"
            />
            <circle
              cx={ax}
              cy={ay}
              r="3"
              fill="#ef4444"
              stroke="#1f2937"
              strokeWidth="1"
            />
            <circle
              cx={bx}
              cy={by}
              r="3"
              fill="#3b82f6"
              stroke="#1f2937"
              strokeWidth="1"
            />
          </svg>

          <div
            className="absolute text-[12px] font-semibold flex flex-col"
            style={{
              top: 85,
              left: 5,
              color: "#ef4444",
              textShadow: "0 1px 0 rgba(255,255,255,0.6)",
            }}
          >
            <span>{cityA}</span>
          </div>
          <div
            className="absolute text-[12px] font-semibold flex flex-col"
            style={{
              left: 5,
              top: 98,
              color: "#3b82f6",
              textShadow: "0 1px 0 rgba(255,255,255,0.6)",
              textAlign: bx < width / 2 ? "left" : "right",
            }}
          >
            <span>{cityB}</span>
          </div>
        </>
      )}
    </div>
  );
}

export default TicketCard;
