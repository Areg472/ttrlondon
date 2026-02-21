"use client";

export function TrainCards({
  color = "#e5e7eb",
  rainbow = false,
  opposite = false,
  width = 176,
  height = 120,
}) {
  const faceStyle = rainbow
    ? {
        backgroundImage:
          "conic-gradient(from 0deg at 50% 50%, #ef4444, #f59e0b, #eab308, #22c55e, #3b82f6, #8b5cf6, #ef4444)",
        backgroundSize: "200% 200%",
      }
    : { backgroundColor: color };

  return (
    <div
      className="relative rounded-lg shadow-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 overflow-hidden select-none"
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
          <span className="text-2xl font-black tracking-widest text-zinc-800 dark:text-zinc-100 opacity-20 transform -rotate-6 select-none">
            TRAIN
          </span>
        </div>
      ) : (
        <div
          className="absolute inset-0 transition-transform hover:scale-105 cursor-pointer flex items-center justify-center"
          style={faceStyle}
        >
          <div className="w-10 h-10 rounded-full bg-white/60 dark:bg-zinc-200/40 border border-zinc-400 dark:border-zinc-500 shadow-inner" />
        </div>
      )}
    </div>
  );
}
