"use client"

import Image from "next/image";
import {TrainCards} from "./Components/Cards";
import {TrainTile, TrainTileCont} from "./Components/TrainTile";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black p-8">
      <main className="flex min-h-screen w-full max-w-4xl flex-col items-center justify-center py-12 px-16 bg-white dark:bg-black gap-12 shadow-xl rounded-2xl">
        <div className="flex flex-col items-center gap-6 p-6 border-2 border-dashed border-gray-100 rounded-xl">
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Train Tile</p>
          <div className="flex items-center justify-center p-2">
            <TrainTileCont trainCount={3}>
              <TrainTile color="#cccccc" trainColor="yellow" />
              <TrainTile color="#cccccc" trainColor="yellow" />
              <TrainTile color="#cccccc" trainColor="yellow" />
            </TrainTileCont>
          </div>
          <p className="text-xs text-gray-400">Click to toggle train</p>
        </div>

        <div className="flex flex-col items-center gap-6 p-6 border-2 border-dashed border-gray-100 rounded-xl">
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Train Card</p>
          <div className="flex-shrink-0">
            <TrainCards color="yellow"/>
          </div>
        </div>

        <div className="flex flex-col items-center gap-6 text-center">
          <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
            Component Preview
          </h1>
        </div>
      </main>
    </div>
  );
}
