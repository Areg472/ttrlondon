import { useState } from "react";
import TicketCard from "./TicketCard";

export function TicketSelection({ tickets, onSelectionComplete }) {
  const [selected, setSelected] = useState([]);

  const toggle = (idx) => {
    setSelected((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx],
    );
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex gap-6">
        {tickets.map((t, i) => (
          <div
            key={i}
            onClick={() => toggle(i)}
            className={`cursor-pointer transition-all p-2 rounded-xl border-4 ${selected.includes(i) ? "border-blue-500 scale-105 shadow-lg" : "border-transparent opacity-80"}`}
          >
            <TicketCard cityA={t.cityA} cityB={t.cityB} points={t.points} />
          </div>
        ))}
      </div>
      <button
        disabled={selected.length < 1}
        onClick={() => onSelectionComplete(selected)}
        className="px-8 py-3 bg-zinc-800 cursor-pointer dark:bg-zinc-100 text-white dark:text-zinc-800 rounded-full font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:scale-105 transition-transform"
      >
        Confirm Selection ({selected.length})
      </button>
    </div>
  );
}
