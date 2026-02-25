"use client";

export function GameOverModal({
  score,
  aiScores,
  playerNumberBonuses,
  aiNumberBonuses,
  playerTicketResults,
  aiTicketResults,
}) {
  const allScores = [
    { label: "Player", score },
    ...aiScores.map((s, i) => ({ label: `AI ${i + 1}`, score: s })),
  ];
  const winner = allScores.reduce(
    (best, cur) => (cur.score > best.score ? cur : best),
    allScores[0],
  );

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-md">
      <div className="bg-white dark:bg-zinc-900 p-12 rounded-[40px] shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col items-center max-w-lg w-full text-center">
        <h2 className="text-5xl font-black mb-2 text-zinc-800 dark:text-zinc-100">
          Game Over
        </h2>
        <p className="text-zinc-500 mb-8 uppercase tracking-[0.2em] font-bold">
          Final Results
        </p>

        <div className="flex gap-8 mb-12 flex-wrap justify-center">
          <div className="flex flex-col">
            <span className="text-sm text-zinc-400 uppercase font-bold mb-1">
              Player
            </span>
            <span className="text-6xl font-black text-zinc-800 dark:text-zinc-100">
              {score}
            </span>
          </div>
          {aiScores.map((s, i) => (
            <>
              <div
                key={`sep-${i}`}
                className="w-px h-16 bg-zinc-200 dark:bg-zinc-800 self-center"
              />
              <div key={`ai-${i}`} className="flex flex-col">
                <span className="text-sm text-zinc-400 uppercase font-bold mb-1">
                  AI {i + 1}
                </span>
                <span className="text-6xl font-black text-zinc-800 dark:text-zinc-100">
                  {s}
                </span>
              </div>
            </>
          ))}
        </div>

        {(playerNumberBonuses.length > 0 ||
          aiNumberBonuses.some((a) => a.length > 0)) && (
          <div className="mb-6 text-sm text-zinc-600 dark:text-zinc-300 text-left w-full">
            <div className="font-semibold mb-2">City-number bonuses</div>
            <div className="mb-1">
              Player:{" "}
              {playerNumberBonuses.length > 0
                ? [...playerNumberBonuses].sort((a, b) => a - b).join(", ")
                : "—"}
              {playerNumberBonuses.length > 0 && (
                <span className="ml-2 text-zinc-500">
                  (+{playerNumberBonuses.reduce((a, b) => a + b, 0)})
                </span>
              )}
            </div>
            {aiNumberBonuses.map((nums, i) => (
              <div key={i}>
                AI {i + 1}:{" "}
                {nums.length > 0
                  ? [...nums].sort((a, b) => a - b).join(", ")
                  : "—"}
                {nums.length > 0 && (
                  <span className="ml-2 text-zinc-500">
                    (+{nums.reduce((a, b) => a + b, 0)})
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {(playerTicketResults.length > 0 ||
          aiTicketResults.some((r) => r.length > 0)) && (
          <div className="mb-6 text-sm text-zinc-600 dark:text-zinc-300 text-left w-full">
            <div className="font-semibold mb-2">Tickets</div>
            <div className="mb-1">
              <span className="font-medium">Player:</span>
              {playerTicketResults.length === 0 && " —"}
              {playerTicketResults.map((t, i) => (
                <span
                  key={i}
                  className={`ml-2 ${t.completed ? "text-green-500" : "text-red-500"}`}
                >
                  {t.cityA}→{t.cityB} ({t.completed ? "+" : "-"}
                  {t.points})
                </span>
              ))}
            </div>
            {aiTicketResults.map((results, i) => (
              <div key={i}>
                <span className="font-medium">AI {i + 1}:</span>
                {results.length === 0 && " —"}
                {results.map((t, j) => (
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
          {winner.label === "Player" ? (
            <span className="text-green-500">Player Wins!</span>
          ) : allScores.filter((s) => s.score === winner.score).length > 1 ? (
            <span className="text-blue-500">It&#39;s a Tie!</span>
          ) : (
            <span className="text-red-500">{winner.label} Wins!</span>
          )}
        </div>

        <button
          onClick={() => window.location.reload()}
          className="px-8 py-4 bg-zinc-800 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-2xl font-bold hover:scale-105 transition-transform"
        >
          Play Again
        </button>
      </div>
    </div>
  );
}
