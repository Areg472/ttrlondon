"use client";

export function StartScreen({ onStart }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-100 font-sans dark:bg-zinc-900 p-8">
      <div className="bg-white dark:bg-zinc-900 p-12 rounded-[40px] shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col items-center max-w-md w-full text-center">
        <h1 className="text-4xl font-black mb-2 text-zinc-800 dark:text-zinc-100">
          Ticket to Ride
        </h1>
        <p className="text-zinc-400 mb-10 uppercase tracking-[0.2em] font-bold text-sm">
          London
        </p>
        <p className="text-zinc-600 dark:text-zinc-300 font-semibold mb-6 text-lg">
          How many AI opponents?
        </p>
        <div className="flex gap-4">
          {[1, 2, 3].map((n) => (
            <button
              key={n}
              onClick={() => onStart(n)}
              className="w-16 h-16 cursor-pointer rounded-2xl bg-zinc-800 dark:bg-zinc-100 text-white dark:text-zinc-900 text-2xl font-black hover:scale-110 transition-transform shadow-lg"
            >
              {n}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
