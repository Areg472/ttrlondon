"use client";

import Image from "next/image";
import { useState } from "react";

const PANELS = [
  <div key={0} className="flex flex-col items-center gap-4">
    <p className="text-zinc-200 font-semibold">
      Ticket To Ride London is a game where you complete tickets to score points
      and WIN THE GAME!! This digital version has different graphics than the
      real life version, but is played in the same way.
    </p>
    <Image
      src="/The-Game.jpg"
      alt="Ticket To Ride London irl"
      width={3742}
      height={3072}
    />
    <p className="text-zinc-400 text-sm">
      This is what Ticket To Ride London looks like in real life
    </p>
  </div>,
  <div key={1} className="flex flex-col items-center gap-4">
    <p className="text-zinc-200 font-semibold">
      At the start of the game, you will be given 2 tickets. You will have to
      keep at least one of them, but you can keep both. You will also receive 2
      &quot;train&quot; cards after choosing your tickets.
    </p>
    <div className="flex flex-col gap-4">
      <Image
        src="/Tickets.jpg"
        alt="TTR London Tickets"
        width={4080}
        height={3072}
      />
      <Image
        src="/Trains.jpg"
        alt="TTR London Tickets"
        width={4080}
        height={3072}
      />
    </div>
  </div>,
  <div key={2} className="flex flex-col items-center gap-4">
    <p className="text-zinc-200 font-semibold">
      By completing tickets you will get the points that&apos;s displayed on
      them. <br />
      There are 3 actions to do during your turn <br />
      1. Drawing train cards <br />
      2. Claiming a route <br />
      3. Drawing tickets <br />
      To complete your tickets you will need to claim routes. You can claim
      routes by spending the train cards of the matching color, such as 2
      yellows for a 2 yellow route. Wild-rainbow cards can replace any color(for
      example one green and one rainbow for a 2 green route) Gray routes can be
      claimed by spending any colored cards, but the cards should be the same
      color such as 2 greens or 2 reds.
    </p>
    <Image src="/Route.jpg" alt="TTR London Route" width={4080} height={3072} />
  </div>,
  <div key={3} className="flex flex-col items-center gap-4">
    <p className="text-zinc-200 font-semibold">
      During the game you can also draw 2 cards from the deck or the display or
      both. If there&#39;s a wild rainbow card on the display, and you want to
      draw that card, you can only draw a single card.
      <br />
      You can also draw new tickets. You will draw 2 tickets and just like
      during the beginning of the game you need to keep at least one ticket, but
      you can keep both.
    </p>
    <Image
      src="/TrainCards.jpg"
      alt="TTR London Train Cards"
      width={4080}
      height={3072}
    />
  </div>,
  <div key={4} className="flex flex-col items-center gap-4">
    <p className="text-zinc-200 font-semibold">
      In 3-4 player games, there will also be double routes. After you place one
      of them, the other players can use the other route or vice versa! You
      cannot place your tiles in both the routes, the other route may be used by
      your opponent instead.
    </p>
    <Image
      src="/DoubleRoutes.jpg"
      alt="TTR London Double Routes"
      width={4080}
      height={3072}
    />
  </div>,
  <div key={5} className="flex flex-col items-center gap-4">
    <p className="text-zinc-200 font-semibold">
      When a player has 2 or fewer train tiles, every player gets one more turn
      and the game ends. Ticket points are calculated at the end.
      <br />
      There&#39;s also an end game bonus for connecting all of the numbered
      cities. The bonus is the amount of points shown on the city. In the
      example below you will receive 2 points for connecting all the 2 numbered
      cities.
      <br />
      THE PLAYER WITH THE MOST POINTS AT THE END WINS!!!
    </p>
    <Image
      src="/NumberedCities.jpg"
      alt="TTR London Numbered Cities"
      width={4080}
      height={3072}
    />
  </div>,
];

export function RulesPanel({ onFinish }) {
  const [page, setPage] = useState(0);
  const isLast = page === PANELS.length - 1;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-100 font-sans dark:bg-zinc-900 p-8">
      <div className="relative bg-white dark:bg-zinc-800 p-12 rounded-[40px] shadow-2xl border border-zinc-200 dark:border-zinc-700 flex flex-col items-center max-w-md w-full text-center min-h-64">
        <button
          onClick={onFinish}
          className="absolute top-4 left-4 w-8 h-8 cursor-pointer flex items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-600 font-bold text-sm transition-colors"
        >
          ✕
        </button>
        <h1 className="text-2xl font-semibold">Rules</h1>
        <div className="flex gap-2 mb-8 mt-4">
          {PANELS.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-colors ${i === page ? "bg-zinc-800 dark:bg-zinc-100" : "bg-zinc-300 dark:bg-zinc-600"}`}
            />
          ))}
        </div>

        <div className="flex-1 flex items-center justify-center w-full">
          {PANELS[page]}
        </div>

        <div className="mt-10 flex gap-4">
          {page > 0 && (
            <button
              onClick={() => setPage((p) => p - 1)}
              className="px-8 py-3 cursor-pointer rounded-2xl bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-100 font-black text-sm uppercase tracking-widest hover:scale-105 transition-transform shadow-lg"
            >
              Previous
            </button>
          )}
          {isLast ? (
            <button
              onClick={onFinish}
              className="px-8 py-3 cursor-pointer rounded-2xl bg-zinc-800 dark:bg-zinc-100 text-white dark:text-zinc-900 font-black text-sm uppercase tracking-widest hover:scale-105 transition-transform shadow-lg"
            >
              Finish
            </button>
          ) : (
            <button
              onClick={() => setPage((p) => p + 1)}
              className="px-8 py-3 cursor-pointer rounded-2xl bg-zinc-800 dark:bg-zinc-100 text-white dark:text-zinc-900 font-black text-sm uppercase tracking-widest hover:scale-105 transition-transform shadow-lg"
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
