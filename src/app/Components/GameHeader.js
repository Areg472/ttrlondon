"use client";

export function GameHeader({
  score,
  turn,
  isAiTurn,
  isPersonTurn,
  currentAiIndex,
  isExtraManualTurn,
  currentExtraManualIndex,
  lastRoundTriggered,
  gameOver,
}) {
  return (
    <header className="mb-8 text-center flex items-center justify-center gap-12">
      <h1 className="text-4xl font-bold text-zinc-800 dark:text-zinc-100 mb-2">
        Ticket to Ride London 🇬🇧
      </h1>
      <div className="z-50 select-none">
        <div className="backdrop-blur-sm border-2 border-zinc-800 rounded-2xl px-6 py-3 shadow-lg flex flex-col items-center">
          <span className="text-[10px] uppercase font-black tracking-[0.2em] text-zinc-400 mb-0.5">
            Points
          </span>
          <span className="text-3xl text-zinc-100 tabular-nums leading-none">
            {score}
          </span>
        </div>
      </div>
      <div className="z-50 select-none">
        <div className="backdrop-blur-sm border-2 border-zinc-800 rounded-2xl px-6 py-3 shadow-lg flex flex-col items-center">
          <span className="text-[10px] uppercase font-black tracking-[0.2em] text-zinc-400 mb-0.5">
            Turn
          </span>
          <span className="text-3xl text-zinc-100 tabular-nums leading-none">
            {turn}
          </span>
          {isAiTurn && !gameOver && (
            <span className="text-[10px] uppercase font-black text-red-500 mt-1">
              AI {currentAiIndex + 1} Thinking...
            </span>
          )}
          {isExtraManualTurn && !gameOver && (
            <span className="text-[15px] uppercase font-black text-blue-400 mt-1">
              Player {currentExtraManualIndex + 2}&apos;s Turn!
            </span>
          )}
          {isPersonTurn && !gameOver && (
            <span className="text-[15px] uppercase font-black text-red-400 mt-1">
              Player 1&apos;s Turn!
            </span>
          )}
          {lastRoundTriggered && !gameOver && (
            <span className="text-[10px] uppercase font-black text-amber-500 mt-1">
              Last Round!
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
