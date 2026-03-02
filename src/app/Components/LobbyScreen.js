"use client";

import { useState } from "react";

export function LobbyScreen({ onJoin, onPlayLocal }) {
  const [name, setName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [mode, setMode] = useState(null); // "create" | "join"

  const createRoom = () => {
    const code = Math.random().toString(36).slice(2, 7).toUpperCase();
    onJoin(code, name || "Player 1", true);
  };

  const joinRoom = () => {
    if (!roomCode.trim()) return;
    onJoin(roomCode.trim().toUpperCase(), name || "Player", false);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-100 font-sans dark:bg-zinc-900 p-8">
      <div className="bg-white dark:bg-zinc-900 p-12 rounded-[40px] shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col items-center max-w-md w-full text-center gap-6">
        <h1 className="text-4xl font-black text-zinc-800 dark:text-zinc-100">
          Ticket to Ride
        </h1>
        <p className="text-zinc-400 uppercase tracking-[0.2em] font-bold text-sm">
          London 🇬🇧
        </p>

        <input
          className="w-full border border-zinc-300 dark:border-zinc-600 rounded-xl px-4 py-3 text-zinc-800 dark:text-zinc-100 bg-zinc-50 dark:bg-zinc-800 font-semibold outline-none focus:ring-2 focus:ring-zinc-400"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        {!mode && (
          <div className="flex flex-col gap-3 w-full">
            <div className="flex gap-4 w-full">
              <button
                onClick={() => setMode("create")}
                className="flex-1 py-4 rounded-2xl bg-zinc-800 dark:bg-zinc-100 text-white dark:text-zinc-900 font-black hover:scale-105 transition-transform shadow-lg cursor-pointer"
              >
                Create Room
              </button>
              <button
                onClick={() => setMode("join")}
                className="flex-1 py-4 rounded-2xl bg-zinc-800 dark:bg-zinc-100 text-white dark:text-zinc-900 font-black hover:scale-105 transition-transform shadow-lg cursor-pointer"
              >
                Join Room
              </button>
            </div>
            <button
              onClick={onPlayLocal}
              className="w-full py-4 rounded-2xl bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-100 font-black hover:scale-105 transition-transform shadow-lg cursor-pointer"
            >
              Play Locally
            </button>
          </div>
        )}

        {mode === "create" && (
          <div className="flex flex-col gap-3 w-full">
            <p className="text-zinc-500 dark:text-zinc-400 text-sm">
              A room code will be generated — share it with your friends.
            </p>
            <button
              onClick={createRoom}
              className="w-full py-4 rounded-2xl bg-zinc-800 dark:bg-zinc-100 text-white dark:text-zinc-900 font-black hover:scale-105 transition-transform shadow-lg cursor-pointer"
            >
              Create Room
            </button>
          </div>
        )}

        {mode === "join" && (
          <div className="flex flex-col gap-3 w-full">
            <input
              className="w-full border border-zinc-300 dark:border-zinc-600 rounded-xl px-4 py-3 text-zinc-800 dark:text-zinc-100 bg-zinc-50 dark:bg-zinc-800 font-semibold uppercase tracking-widest outline-none focus:ring-2 focus:ring-zinc-400"
              placeholder="Room code"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
            />
            <button
              onClick={joinRoom}
              className="w-full py-4 rounded-2xl bg-zinc-800 dark:bg-zinc-100 text-white dark:text-zinc-900 font-black hover:scale-105 transition-transform shadow-lg cursor-pointer"
            >
              Join Room
            </button>
          </div>
        )}

        {mode && (
          <button
            onClick={() => setMode(null)}
            className="text-sm text-zinc-800 cursor-pointer rounded-2xl w-20 h-10 hover:bg-zinc-400 transition-colors bg-zinc-100 font-semibold"
          >
            ← Back
          </button>
        )}
      </div>
    </div>
  );
}
