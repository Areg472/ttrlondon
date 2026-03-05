"use client";

import { useState, useEffect, useRef } from "react";

export function MoveLog({ entries = [] }) {
  const [open, setOpen] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    if (open && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [entries, open]);

  return (
    <div className="fixed bottom-4 left-4 z-40 flex flex-col items-start">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl px-4 py-2 shadow-lg text-sm font-bold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
      >
        <span>📋</span>
        <span>Move Log</span>
        {entries.length > 0 && (
          <span className="ml-1 bg-blue-500 text-white text-xs font-black rounded-full px-2 py-0.5">
            {entries.length}
          </span>
        )}
        <span className="ml-1 text-zinc-400">{open ? "▼" : "▲"}</span>
      </button>

      {open && (
        <div className="mt-2 w-72 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl shadow-xl flex flex-col overflow-hidden">
          <div className="px-4 py-2 border-b border-zinc-100 dark:border-zinc-700 text-xs font-bold uppercase tracking-widest text-zinc-400">
            Game History
          </div>
          <div
            ref={listRef}
            className="overflow-y-auto max-h-64 flex flex-col-reverse px-3 py-2 gap-1"
          >
            {entries.length === 0 ? (
              <div className="text-zinc-400 text-xs text-center py-4">
                No moves yet
              </div>
            ) : (
              [...entries].reverse().map((entry, i) => (
                <div
                  key={entries.length - 1 - i}
                  className="flex items-start gap-2 text-xs py-1 border-b border-zinc-50 dark:border-zinc-700 last:border-0"
                >
                  <span className="text-zinc-300 dark:text-zinc-600 font-mono shrink-0">
                    {String(entries.length - i).padStart(2, "0")}
                  </span>
                  <span className="font-semibold text-blue-600 dark:text-blue-400 shrink-0">
                    {entry.player}
                  </span>
                  <span className="text-zinc-600 dark:text-zinc-300">
                    {entry.text}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
