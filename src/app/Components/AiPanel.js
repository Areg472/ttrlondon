"use client";

export function AiPanel({
  index,
  hand,
  score,
  placedTiles,
  tickets,
  lastAction,
  isThinking,
  gameOver,
}) {
  return (
    <div>
      <div className="flex gap-4 mb-4">
        <div
          className={`text-white p-4 rounded-xl shadow-lg flex gap-8 ${
            isThinking && !gameOver ? "bg-red-700" : "bg-zinc-800"
          }`}
        >
          <div className="flex flex-col items-center">
            <span className="text-[10px] uppercase font-bold text-zinc-400">
              AI {index + 1} Points
            </span>
            <span className="text-2xl font-black">{score}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[10px] uppercase font-bold text-zinc-400">
              AI {index + 1} Train Pieces
            </span>
            <span className="text-2xl font-black">
              {17 - (placedTiles || 0)}
            </span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[10px] uppercase font-bold text-zinc-400">
              AI {index + 1} Train Cards
            </span>
            <span className="text-2xl font-black">
              {Object.values(hand).reduce((a, b) => a + b, 0)}
            </span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[10px] uppercase font-bold text-zinc-400">
              AI {index + 1} Tickets
            </span>
            <span className="text-2xl font-black">
              {(tickets || []).length}
            </span>
          </div>
        </div>
      </div>
      <div className="flex gap-4 justify-center mb-4">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          <span className="font-bold text-zinc-700 dark:text-zinc-200">
            AI {index + 1} last action:
          </span>{" "}
          {lastAction ?? "None yet"}
        </p>
      </div>
    </div>
  );
}
