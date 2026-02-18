"use client"

import React from 'react'
import { CITIES } from '../page'

// Ticket-to-Ride style destination ticket
// Props:
// - cityA (string, required) - first city name
// - cityB (string, required) - second city name
// - cityAPos ({x:number,y:number}, optional) - manual override coordinates
// - cityBPos ({x:number,y:number}, optional) - manual override coordinates
// - points (number|string, required) - points shown at bottom-right
// - width (number, optional, default 176)
// - height (number, optional, default 120)
// - opposite (boolean, optional, default false) - if true, shows the back of the card
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
  const padding = 8; // inner padding for safe area

  // Board dimensions for coordinate mapping
  const BOARD_WIDTH = 1200;
  const BOARD_HEIGHT = 666.6; // Based on aspect-18/10

  // Helper to find city coordinates and data from board
  const getCityData = (name, manualPos) => {
    const city = CITIES.find(c => c.name === name);
    const pos = manualPos || (city ? { x: city.x, y: city.y } : { x: 0, y: 0 });
    
    // Scale board coordinates to card coordinates
    return {
      pos: {
        x: (pos.x / BOARD_WIDTH) * width,
        y: (pos.y / BOARD_HEIGHT) * height
      },
      number: city?.number
    };
  };

  const dataA = getCityData(cityA, cityAPos);
  const dataB = getCityData(cityB, cityBPos);

  const posA = dataA.pos;
  const posB = dataB.pos;
  const numA = dataA.number;
  const numB = dataB.number;

  // Clamp helper to keep items inside the card
  const clamp = (val, min, max) => Math.max(min, Math.min(max, val));

  // Safe coordinates (prevent labels from spilling out)
  const ax = clamp(posA.x, padding, width - padding);
  const ay = clamp(posA.y, padding, height - padding);
  const bx = clamp(posB.x, padding, width - padding);
  const by = clamp(posB.y, padding, height - padding);

  return (
    <div
      className="rounded-lg shadow-md border border-zinc-300 dark:border-zinc-700 bg-amber-50 dark:bg-zinc-800 relative overflow-hidden select-none"
      style={{ width, height }}
    >
      {/* subtle paper texture dots */}
      <div
        className="absolute inset-0 opacity-[0.06] dark:opacity-[0.08] pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '10px 10px' }}
      />

      {opposite ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-3xl font-black tracking-widest text-zinc-800 dark:text-zinc-100 opacity-20 transform -rotate-12 select-none">
            TICKET
          </span>
        </div>
      ) : (
        <>
          {/* Points in top-right */}
          <div className="absolute top-2 right-4 text-lg font-bold text-zinc-800 dark:text-zinc-100 z-10">
            {points}
          </div>

          {/* Drawing layer */}
          <svg width={width} height={height} className="absolute inset-0">
            {/* connection line */}
            <line x1={ax} y1={ay} x2={bx} y2={by} stroke="#374151" strokeOpacity="0.9" strokeWidth="2" />
            {/* end dots */}
            <circle cx={ax} cy={ay} r="3" fill="#ef4444" stroke="#1f2937" strokeWidth="1" />
            <circle cx={bx} cy={by} r="3" fill="#3b82f6" stroke="#1f2937" strokeWidth="1" />
          </svg>

          {/* City labels */}
          <div
            className="absolute text-[12px] font-semibold flex flex-col"
            style={{ 
              left: ax < width / 2 ? ax + 6 : 'auto', 
              right: ax < width / 2 ? 'auto' : (width - ax) + 6,
              top: ay - 2, 
              color: '#ef4444', 
              textShadow: '0 1px 0 rgba(255,255,255,0.6)',
              textAlign: ax < width / 2 ? 'left' : 'right'
            }}
          >
            <span>{cityA}</span>
          </div>
          <div
            className="absolute text-[12px] font-semibold flex flex-col"
            style={{ 
              left: bx < width / 2 ? bx + 6 : 'auto', 
              right: bx < width / 2 ? 'auto' : (width - bx) + 6,
              top: by - 2, 
              color: '#3b82f6', 
              textShadow: '0 1px 0 rgba(255,255,255,0.6)',
              textAlign: bx < width / 2 ? 'left' : 'right'
            }}
          >
            <span>{cityB}</span>
          </div>
        </>
      )}

    </div>
  )
}

export default TicketCard
