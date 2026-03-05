"use client";

export function OpponentPanel({
  label,
  score,
  placedTiles,
  hand,
  tickets,
  lastAction,
  isActiveTurn,
  isThinking,
  gameOver,
}) {
  const active = (isActiveTurn || isThinking) && !gameOver;
  return (
    <div className="flex gap-4 mb-4">
      <div
        className={`p-4 rounded-xl shadow-lg flex gap-8 ${
          active
            ? "bg-blue-600 text-white"
            : "bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100"
        }`}
      >
        <div className="flex flex-col items-center">
          <span
            className={`text-[10px] uppercase font-bold ${active ? "text-blue-200" : "text-zinc-500 dark:text-zinc-400"}`}
          >
            {label} Points
          </span>
          <span className="text-2xl font-black">{score ?? 0}</span>
        </div>
        <div className="flex flex-col items-center">
          <span
            className={`text-[10px] uppercase font-bold ${active ? "text-blue-200" : "text-zinc-500 dark:text-zinc-400"}`}
          >
            {label} Trains
          </span>
          <span className="text-2xl font-black">{17 - (placedTiles || 0)}</span>
        </div>
        <div className="flex flex-col items-center">
          <span
            className={`text-[10px] uppercase font-bold ${active ? "text-blue-200" : "text-zinc-500 dark:text-zinc-400"}`}
          >
            {label} Cards
          </span>
          <span className="text-2xl font-black">
            {Object.values(hand || {}).reduce((a, b) => a + b, 0)}
          </span>
        </div>
        <div className="flex flex-col items-center">
          <span
            className={`text-[10px] uppercase font-bold ${active ? "text-blue-200" : "text-zinc-500 dark:text-zinc-400"}`}
          >
            {label} Tickets
          </span>
          <span className="text-2xl font-black">{(tickets || []).length}</span>
        </div>
        <div className="flex flex-col items-center justify-center">
          {isThinking && !gameOver ? (
            <span className="text-xs font-bold text-blue-200 animate-pulse">
              THINKING…
            </span>
          ) : (
            <span
              className={`text-xs font-bold text-blue-200 animate-pulse ${active ? "opacity-100" : "opacity-0"}`}
            >
              THEIR TURN
            </span>
          )}
        </div>
      </div>
      {lastAction && (
        <div className="flex items-center">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            <span className="font-bold text-zinc-700 dark:text-zinc-200">
              {label} last action:
            </span>{" "}
            {lastAction}
          </p>
        </div>
      )}
    </div>
  );
}
