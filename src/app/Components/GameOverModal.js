"use client";

export function GameOverModal({ players = [] }) {
  if (!players.length) return null;

  const winner = players.reduce(
    (best, p) => (p.score > best.score ? p : best),
    players[0],
  );
  const isTie = players.filter((p) => p.score === winner.score).length > 1;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-md">
      <div className="bg-white dark:bg-zinc-800 p-12 rounded-[40px] shadow-2xl border border-zinc-200 dark:border-zinc-700 flex flex-col items-center max-w-lg w-full text-center">
        <h2 className="text-5xl font-black mb-2 text-zinc-800 dark:text-zinc-100">
          Game Over
        </h2>
        <p className="text-zinc-500 dark:text-zinc-400 mb-8 uppercase tracking-[0.2em] font-bold">
          Final Results
        </p>

        <div className="flex gap-8 mb-12 flex-wrap justify-center">
          {players.map((p, i) => (
            <>
              {i > 0 && (
                <div
                  key={`sep-${i}`}
                  className="w-px h-16 bg-zinc-200 dark:bg-zinc-700 self-center"
                />
              )}
              <div key={`score-${i}`} className="flex flex-col">
                <span className="text-sm text-zinc-400 uppercase font-bold mb-1">
                  {p.name}
                </span>
                <span className="text-6xl font-black text-zinc-800 dark:text-zinc-100">
                  {p.score}
                </span>
              </div>
            </>
          ))}
        </div>

        {players.some((p) => p.numberBonuses?.length > 0) && (
          <div className="mb-6 text-sm text-zinc-600 dark:text-zinc-300 text-left w-full">
            <div className="font-semibold mb-2">City-number bonuses</div>
            {players.map((p, i) => (
              <div key={i}>
                {p.name}:{" "}
                {p.numberBonuses?.length > 0
                  ? [...p.numberBonuses].sort((a, b) => a - b).join(", ")
                  : "—"}
                {p.numberBonuses?.length > 0 && (
                  <span className="ml-2 text-zinc-500 dark:text-zinc-400">
                    (+{p.numberBonuses.reduce((a, b) => a + b, 0)})
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {players.some((p) => p.ticketResults?.length > 0) && (
          <div className="mb-6 text-sm text-zinc-600 dark:text-zinc-300 text-left w-full">
            <div className="font-semibold mb-2">Tickets</div>
            {players.map((p, i) => (
              <div key={i} className="mb-1">
                <span className="font-medium">{p.name}:</span>
                {!p.ticketResults?.length && " —"}
                {(p.ticketResults || []).map((t, j) => (
                  <span
                    key={j}
                    className={`ml-2 ${t.completed ? "text-green-500" : "text-red-500"}`}
                  >
                    {t.cityA}→{t.cityB} ({t.completed ? "+" : "-"}
                    {t.points})
                  </span>
                ))}
              </div>
            ))}
          </div>
        )}

        <div className="text-2xl font-bold mb-8">
          {isTie ? (
            <span className="text-blue-500">It&#39;s a Tie!</span>
          ) : winner.name.startsWith("Player") ? (
            <span className="text-green-500">{winner.name} Wins!</span>
          ) : (
            <span className="text-red-500">{winner.name} Wins!</span>
          )}
        </div>

        <button
          onClick={() => window.location.reload()}
          className="px-8 py-4 bg-zinc-800 cursor-pointer text-white rounded-2xl font-bold hover:scale-105 transition-transform"
        >
          Play Again
        </button>
      </div>
    </div>
  );
}
