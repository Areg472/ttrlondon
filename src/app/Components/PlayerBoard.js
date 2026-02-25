"use client";

import { TrainTile, TrainTileCont, PlayerHandContext } from "./TrainTile";
import { City } from "./City";
import { TrainCards } from "./Cards";
import TicketCard from "./TicketCard";
import { TicketSelection } from "./TicketSelection";
import { ROUTES, CITIES } from "../data/gameData";

export function PlayerBoard({
  playerHand,
  playerTickets,
  placedTiles,
  drawingTickets,
  selectTickets,
  spendCards,
  addPoints,
  canPlaceMore,
  incrementPlaced,
  incrementTurn,
  cardsDrawn,
  isAiTurn,
  numAIs,
  claimedRoutes,
  claimRoute,
  ticketDeck,
  trainDeck,
  discardPile,
  drawTickets,
  drawFromDeck,
  displayCards,
  onDrawFromDisplay,
}) {
  return (
    <main className="w-full flex justify-center gap-8 p-4">
      <div className="flex flex-col items-center">
        <div className="relative w-200 h-150 overflow-auto shadow-2xl rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-black">
          <div
            className="relative min-w-300 aspect-18/10 bg-black"
            style={{ paddingBottom: "64px" }}
          >
            <PlayerHandContext.Provider
              value={{
                ...playerHand,
                spendCards,
                addPoints,
                placedTiles,
                canPlaceMore,
                incrementPlaced,
                incrementTurn,
                cardsDrawn,
                isAiTurn,
                numAIs,
                claimedRoutes,
                claimRoute,
              }}
            >
              <div
                className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none"
                style={{
                  backgroundImage: "radial-gradient(#000 1px, transparent 1px)",
                  backgroundSize: "20px 20px",
                }}
              />
              {ROUTES.map((route) => (
                <TrainTileCont
                  key={route.id}
                  routeId={route.id}
                  trainCount={route.trainCount}
                  x={route.x}
                  y={route.y}
                  isDouble={route.isDouble}
                >
                  {route.tiles.map((tile, i) => (
                    <TrainTile key={i} color={tile.color} angle={tile.angle} />
                  ))}
                </TrainTileCont>
              ))}
              {CITIES.map((city) => (
                <City key={city.name} {...city} />
              ))}
            </PlayerHandContext.Provider>
          </div>
        </div>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400 italic">
          Scroll to explore the map
        </p>
        <p className="mt-10 text-lg text-zinc-500 dark:text-zinc-400">
          Player board ({17 - placedTiles} train pieces left)
        </p>

        {drawingTickets && (
          <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col items-center max-w-2xl w-full mt-10">
            <h2 className="text-2xl font-bold mb-6 text-zinc-800 dark:text-zinc-100">
              Select 1-2 Ticket Cards
            </h2>
            <div className="flex gap-6 mb-8 overflow-auto py-2">
              <TicketSelection
                tickets={drawingTickets}
                onSelectionComplete={selectTickets}
              />
            </div>
          </div>
        )}

        <div className="flex flex-row mt-10" style={{ gap: "2.5rem" }}>
          <div className="gap-2 flex flex-col justify-center max-w-150">
            <p className="text-sm text-zinc-500 dark:text-zinc-400 font-bold mb-2">
              Train Cards
            </p>
            <div className="grid grid-cols-3 border-2 border-dashed p-4 gap-x-8 gap-y-16 min-w-125 min-h-50">
              {Object.entries(playerHand)
                .filter(([_, count]) => count > 0)
                .map(([color, count]) => (
                  <div key={color} className="flex flex-col relative h-35">
                    {Array.from({ length: count }).map((_, i) => (
                      <div
                        key={i}
                        className="absolute transition-all"
                        style={{ zIndex: i, top: i * 20 }}
                      >
                        <TrainCards
                          color={color === "rainbow" ? undefined : color}
                          rainbow={color === "rainbow"}
                          width={140}
                          height={96}
                        />
                      </div>
                    ))}
                  </div>
                ))}
            </div>
          </div>

          <div className="gap-2 flex flex-col justify-center">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Ticket Cards
            </p>
            <div className="flex flex-col justify-center border-2 border-dashed">
              {playerTickets.map((c, i) => (
                <div
                  key={i}
                  className="transition-transform hover:-translate-y-1"
                >
                  <TicketCard
                    cityA={c.cityA}
                    cityB={c.cityB}
                    points={c.points}
                    opposite={false}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-12">
        <div
          className="relative w-52.5 h-30 mt-10 cursor-pointer"
          onClick={drawTickets}
        >
          {ticketDeck.map((t, i) => (
            <div
              key={i}
              className="absolute transition-transform hover:-translate-y-1"
              style={{ top: -i * 2, left: i * 0.5, zIndex: i }}
            >
              <TicketCard
                cityA={t.cityA}
                cityB={t.cityB}
                points={t.points}
                opposite={true}
              />
            </div>
          ))}
          <div className="absolute -bottom-8 left-0 right-0 text-center text-xs font-bold uppercase tracking-wider text-zinc-500">
            Ticket Deck ({ticketDeck.length})
          </div>
        </div>

        <div
          className={`relative w-44 h-30 mt-16 ${cardsDrawn >= 2 ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
          onClick={cardsDrawn >= 2 ? undefined : drawFromDeck}
        >
          {trainDeck.map((c, i) => (
            <div
              key={i}
              className="absolute transition-transform hover:-translate-y-1"
              style={{ top: -i * 1.2, left: i * 0.5, zIndex: i }}
            >
              <TrainCards
                color={c.color}
                rainbow={!!c.rainbow}
                opposite={true}
              />
            </div>
          ))}
          <div className="absolute -bottom-8 left-0 right-0 text-center text-xs font-bold uppercase tracking-wider text-zinc-500">
            Train Deck ({trainDeck.length})
          </div>
        </div>

        <div className="relative w-44 mt-10">
          <div className="mb-4 text-center text-xs font-bold uppercase tracking-wider text-zinc-500">
            Cards on Display
          </div>
          <div className="flex flex-col gap-4">
            {(displayCards || []).map((c, i) => {
              const isDisabled =
                cardsDrawn >= 2 || (c.rainbow && cardsDrawn >= 1);
              return (
                <div
                  key={i}
                  className={`transition-transform ${isDisabled ? "opacity-40 cursor-not-allowed" : "hover:-translate-y-1 cursor-pointer"}`}
                  onClick={() => !isDisabled && onDrawFromDisplay(i)}
                >
                  <TrainCards
                    color={c.color}
                    rainbow={!!c.rainbow}
                    opposite={false}
                  />
                </div>
              );
            })}
          </div>
        </div>

        <div className="relative w-44 mt-10">
          <div className="mb-4 text-center text-xs font-bold uppercase tracking-wider text-zinc-500">
            Discard Pile ({discardPile.length})
          </div>
          <div className="flex flex-col gap-4">
            {discardPile.slice(-1).map((c, i) => (
              <div key={i} className="opacity-60">
                <TrainCards
                  color={c.color}
                  rainbow={!!c.rainbow}
                  opposite={false}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
