"use client";

import { useState, useCallback, useEffect } from "react";
import {
  TrainTile,
  TrainTileCont,
  PlayerHandContext,
} from "./Components/TrainTile";
import { City } from "./Components/City";
import TicketCard from "./Components/TicketCard";
import { TrainCards } from "./Components/Cards";
import { shuffle } from "./utils/shuffle";
import {
  CITIES,
  TICKETS,
  INITIAL_TRAIN_CARDS_DECK,
  ROUTES,
} from "./data/gameData";
import { TicketSelection } from "./Components/TicketSelection";

export default function Home() {
  const [playerHand, setPlayerHand] = useState({
    orange: 0,
    blue: 0,
    black: 0,
    red: 0,
    yellow: 0,
    green: 0,
    rainbow: 0,
  });
  const [aiHand, setAiHand] = useState({
    orange: 0,
    blue: 0,
    black: 0,
    red: 0,
    yellow: 0,
    green: 0,
    rainbow: 0,
  });
  const [score, setScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);
  const [turn, setTurn] = useState(1);
  const [isAiTurn, setIsAiTurn] = useState(false);
  const [cardsDrawn, setCardsDrawn] = useState(0);
  const [placedTiles, setPlacedTiles] = useState(0);
  const [aiPlacedTiles, setAiPlacedTiles] = useState(0);
  const [discardPile, setDiscardPile] = useState([]);
  const [displayCards, setDisplayCards] = useState([]);
  const [trainDeck, setTrainDeck] = useState(INITIAL_TRAIN_CARDS_DECK);
  const [ticketDeck, setTicketDeck] = useState(TICKETS);
  const [playerTickets, setPlayerTickets] = useState([]);
  const [aiTickets, setAiTickets] = useState([]);
  const [drawingTickets, setDrawingTickets] = useState(null);
  const [claimedRoutes, setClaimedRoutes] = useState({}); // { routeId_side: 'player' | 'ai' }

  const checkThreeRainbows = useCallback(
    (currentDisplay, currentDeck, currentDiscard) => {
      let display = [...currentDisplay],
        deck = [...currentDeck],
        discard = [...currentDiscard];
      while (display.filter((c) => c.rainbow).length >= 3) {
        discard = [...discard, ...display];
        if (deck.length < 5 && discard.length > 0) {
          deck = [...deck, ...shuffle(discard)];
          discard = [];
        }
        display = deck.slice(0, 5);
        deck = deck.slice(5);
        if (display.length === 0) break;
      }
      return { display, deck, discard };
    },
    [],
  );

  const [hasInitialized, setHasInitialized] = useState(false);
  if (!hasInitialized) {
    const { display, deck, discard } = checkThreeRainbows(
      INITIAL_TRAIN_CARDS_DECK.slice(0, 5),
      INITIAL_TRAIN_CARDS_DECK.slice(5),
      [],
    );
    setDisplayCards(display);
    setTrainDeck(deck);
    setDiscardPile(discard);
    setHasInitialized(true);
  }

  const drawFromDisplay = (index) => {
    if (cardsDrawn >= 2 || drawingTickets) return;
    const card = displayCards[index];
    if (!card) return;

    const colorKey = card.rainbow ? "rainbow" : card.color;
    setPlayerHand((prev) => ({
      ...prev,
      [colorKey]: (prev[colorKey] ?? 0) + 1,
    }));

    let nextDisplay = [...displayCards],
      nextDeck = [...trainDeck],
      nextDiscard = [...discardPile];
    if (nextDeck.length > 0) {
      nextDisplay[index] = nextDeck[0];
      nextDeck = nextDeck.slice(1);
    } else {
      nextDisplay.splice(index, 1);
    }

    const result = checkThreeRainbows(nextDisplay, nextDeck, nextDiscard);
    setDisplayCards(result.display);
    setTrainDeck(result.deck);
    setDiscardPile(result.discard);

    const draws = card.rainbow ? 2 : 1;
    const total = cardsDrawn + draws;
    if (total >= 2) {
      incrementTurn();
    } else {
      setCardsDrawn(total);
    }
  };

  const drawFromDeck = () => {
    if (cardsDrawn >= 2 || drawingTickets) return;
    let currentDeck = [...trainDeck],
      currentDiscard = [...discardPile];
    if (currentDeck.length === 0 && currentDiscard.length > 0) {
      currentDeck = shuffle(currentDiscard);
      currentDiscard = [];
    }
    if (currentDeck.length === 0) return;
    const card = currentDeck[0];
    const colorKey = card.rainbow ? "rainbow" : card.color;
    setPlayerHand((prev) => ({
      ...prev,
      [colorKey]: (prev[colorKey] ?? 0) + 1,
    }));
    setTrainDeck(currentDeck.slice(1));
    setDiscardPile(currentDiscard);
    const total = cardsDrawn + 1;
    if (total >= 2) {
      incrementTurn();
    } else {
      setCardsDrawn(total);
    }
  };

  const spendCards = (deduction) => {
    const setHand = isAiTurn ? setAiHand : setPlayerHand;
    setHand((prev) => {
      const next = { ...prev },
        spent = [];
      for (const [k, v] of Object.entries(deduction || {})) {
        next[k] = Math.max(0, (next[k] ?? 0) - v);
        for (let i = 0; i < v; i++)
          spent.push(k === "rainbow" ? { rainbow: true } : { color: k });
      }
      setDiscardPile((prevDiscard) => [...prevDiscard, ...spent]);
      return next;
    });
  };

  const incrementTurn = () => {
    if (!isAiTurn) {
      setIsAiTurn(true);
    } else {
      setIsAiTurn(false);
      setTurn((prev) => prev + 1);
    }
    setCardsDrawn(0);
  };

  const addPoints = (points) => {
    if (isAiTurn) {
      setAiScore((prev) => prev + points);
    } else {
      setScore((prev) => prev + points);
    }
  };

  const incrementPlaced = (n) => {
    if (isAiTurn) {
      setAiPlacedTiles((prev) => prev + (Number(n) || 0));
    } else {
      setPlacedTiles((prev) => prev + (Number(n) || 0));
    }
  };

  const drawTickets = () => {
    if (cardsDrawn > 0 || drawingTickets) return;
    if (ticketDeck.length === 0) return;
    const drawn = ticketDeck.slice(0, 2);
    setTicketDeck((prev) => prev.slice(2));
    setDrawingTickets(drawn);
  };

  const selectTickets = (selectedIndices) => {
    if (selectedIndices.length < 1) return;
    const selected = selectedIndices.map((idx) => drawingTickets[idx]);
    setPlayerTickets((prev) => [...prev, ...selected]);
    setDrawingTickets(null);
    incrementTurn();
  };

  const canPlaceMore = (needed) => {
    const n = Number(needed) || 0;
    const currentPlaced = isAiTurn ? aiPlacedTiles : placedTiles;
    return currentPlaced + n <= 17;
  };

  const claimRoute = (routeId, side, type) => {
    setClaimedRoutes((prev) => ({
      ...prev,
      [`${routeId}_${side}`]: type,
    }));
  };

  useEffect(() => {
    if (isAiTurn) {
      playAiTurn();
    }
  }, [isAiTurn]);

  const playAiTurn = async () => {
    // Collect game state
    const gameState = {
      aiHand,
      aiTickets,
      aiScore,
      aiPlacedTiles,
      playerHandCount: Object.values(playerHand).reduce((a, b) => a + b, 0),
      playerTicketsCount: playerTickets.length,
      playerScore: score,
      displayCards,
      trainDeckCount: trainDeck.length,
      ticketDeckCount: ticketDeck.length,
      claimedRoutes,
      routes: ROUTES,
      cities: CITIES,
    };

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content:
                "You are an AI playing Ticket to Ride London. Respond ONLY with a valid JSON object representing your action. Do not include any other text or explanation.",
            },
            {
              role: "user",
              content: `Current Game State: ${JSON.stringify(gameState)}. 
              Available actions: 
              1. { "action": "draw_display", "index": number } - draw a card from display (index 0-4). If you draw a rainbow, turn ends. Otherwise you draw twice.
              2. { "action": "draw_deck" } - draw a card from deck. You draw twice unless it's the last card.
              3. { "action": "draw_tickets" } - draw 2 tickets, then you must choose at least 1. (This will trigger a second step)
              4. { "action": "place_tiles", "routeId": number, "side": "single"|"even"|"odd", "color": string } - place tiles on a route.
              
              Important rules:
              - To claim a route, you must have enough cards of that color (or rainbows).
              - If you have 0 cards drawn, you can draw from display, draw from deck, or draw tickets.
              - If you have 1 card drawn, you can only draw from display (non-rainbow) or draw from deck.
              - If you have 0 cards drawn, you can also place tiles.
              
              Choose one action based on the state.`,
            },
          ],
        }),
      });

      const reader = response.body.getReader();
      let content = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        content += new TextDecoder().decode(value);
      }

      console.log("AI Raw Response:", content);
      if (!content.trim()) {
        console.error("AI returned an empty response");
        incrementTurn();
        return;
      }

      // Check for server-side error object
      if (content.startsWith('{"error":')) {
        try {
          const errorObj = JSON.parse(content);
          console.error("AI Server Error:", errorObj.error);
          incrementTurn();
          return;
        } catch (e) {
          // Fall through to normal parsing
        }
      }

      // Basic cleanup of potential markdown if the AI didn't follow instructions perfectly
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const action = JSON.parse(jsonMatch[0]);
          if (action.error) {
            console.error("AI returned an error:", action.error);
            incrementTurn();
            return;
          }
          executeAiAction(action);
        } catch (parseError) {
          console.error("AI JSON Parse Error:", parseError, content);
          incrementTurn();
        }
      } else {
        console.error("Failed to parse AI action (no JSON found):", content);
        incrementTurn();
      }
    } catch (error) {
      console.error("AI Turn Error:", error);
      incrementTurn();
    }
  };

  const executeAiAction = (action) => {
    console.log("AI Action:", action);
    switch (action.action) {
      case "draw_display":
        drawAiFromDisplay(action.index);
        break;
      case "draw_deck":
        drawAiFromDeck();
        break;
      case "draw_tickets":
        drawAiTickets();
        break;
      case "place_tiles":
        executeAiPlaceTiles(action.routeId, action.side, action.color);
        break;
      default:
        incrementTurn();
    }
  };

  const drawAiFromDisplay = (index) => {
    const card = displayCards[index];
    if (!card) {
      incrementTurn();
      return;
    }

    const colorKey = card.rainbow ? "rainbow" : card.color;
    setAiHand((prev) => ({
      ...prev,
      [colorKey]: (prev[colorKey] ?? 0) + 1,
    }));

    let nextDisplay = [...displayCards],
      nextDeck = [...trainDeck],
      nextDiscard = [...discardPile];
    if (nextDeck.length > 0) {
      nextDisplay[index] = nextDeck[0];
      nextDeck = nextDeck.slice(1);
    } else {
      nextDisplay.splice(index, 1);
    }

    const result = checkThreeRainbows(nextDisplay, nextDeck, nextDiscard);
    setDisplayCards(result.display);
    setTrainDeck(result.deck);
    setDiscardPile(result.discard);

    const draws = card.rainbow ? 2 : 1;
    const total = cardsDrawn + draws;
    if (total >= 2) {
      incrementTurn();
    } else {
      setCardsDrawn(total);
      // AI gets another draw, call AI again or just draw another one randomly?
      // For simplicity, let's call AI again if they need to draw another card
      playAiTurn();
    }
  };

  const drawAiFromDeck = () => {
    let currentDeck = [...trainDeck],
      currentDiscard = [...discardPile];
    if (currentDeck.length === 0 && currentDiscard.length > 0) {
      currentDeck = shuffle(currentDiscard);
      currentDiscard = [];
    }
    if (currentDeck.length === 0) {
      incrementTurn();
      return;
    }
    const card = currentDeck[0];
    const colorKey = card.rainbow ? "rainbow" : card.color;
    setAiHand((prev) => ({
      ...prev,
      [colorKey]: (prev[colorKey] ?? 0) + 1,
    }));
    setTrainDeck(currentDeck.slice(1));
    setDiscardPile(currentDiscard);
    const total = cardsDrawn + 1;
    if (total >= 2) {
      incrementTurn();
    } else {
      setCardsDrawn(total);
      playAiTurn();
    }
  };

  const drawAiTickets = () => {
    if (ticketDeck.length === 0) {
      incrementTurn();
      return;
    }
    const drawn = ticketDeck.slice(0, 2);
    setTicketDeck((prev) => prev.slice(2));
    // AI chooses at least 1 ticket. Simple AI: take both.
    setAiTickets((prev) => [...prev, ...drawn]);
    incrementTurn();
  };

  const executeAiPlaceTiles = (routeId, side, color) => {
    const route = ROUTES.find((r) => r.id === routeId);
    if (!route) {
      incrementTurn();
      return;
    }

    const length = route.trainCount;
    const wilds = aiHand.rainbow;
    const have = aiHand[color] || 0;

    let deduction = null;
    if (color === "gray") {
      const baseColors = ["orange", "yellow", "blue", "green", "black", "red"];
      let best = null;
      for (const c of baseColors) {
        const cHave = aiHand[c] || 0;
        const useColor = Math.min(cHave, length);
        const needWild = length - useColor;
        if (needWild <= wilds) {
          if (
            !best ||
            needWild < best.needWild ||
            (needWild === best.needWild && useColor > best.useColor)
          ) {
            best = { color: c, useColor, needWild };
          }
        }
      }
      if (!best && wilds >= length) {
        best = { color: null, useColor: 0, needWild: length };
      }
      if (best) {
        deduction = {};
        if (best.color) deduction[best.color] = best.useColor;
        if (best.needWild) deduction["rainbow"] = best.needWild;
      }
    } else {
      const useColor = Math.min(have, length);
      const needWild = length - useColor;
      if (needWild <= wilds) {
        deduction = {};
        if (useColor) deduction[color] = useColor;
        if (needWild) deduction["rainbow"] = needWild;
      }
    }

    if (deduction) {
      spendCards(deduction);
      const points = { 1: 1, 2: 2, 3: 4, 4: 7 }[length] || 0;
      addPoints(points);
      incrementPlaced(length);
      claimRoute(routeId, side, "ai");
      incrementTurn();
    } else {
      // AI made an invalid move or doesn't have cards
      console.log("AI couldn't place tiles, drawing from deck instead");
      drawAiFromDeck();
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center bg-zinc-100 font-sans dark:bg-zinc-900 p-8">
      <header className="mb-8 text-center flex items-center justify-center gap-12">
        <h1 className="text-4xl font-bold text-zinc-800 dark:text-zinc-100 mb-2">
          Ticket to Ride London
        </h1>

        <div className="z-50 select-none">
          <div className="backdrop-blur-sm border-2  border-zinc-800 rounded-2xl px-6 py-3 shadow-lg flex flex-col items-center">
            <span className="text-[10px] uppercase font-black tracking-[0.2em] text-zinc-400 mb-0.5">
              Points
            </span>
            <span className="text-3xl  text-zinc-100 tabular-nums leading-none">
              {score}
            </span>
          </div>
        </div>
        <div className="z-50 select-none">
          <div className="backdrop-blur-sm border-2  border-zinc-800 rounded-2xl px-6 py-3 shadow-lg flex flex-col items-center">
            <span className="text-[10px] uppercase font-black tracking-[0.2em] text-zinc-400 mb-0.5">
              Turn
            </span>
            <span className="text-3xl  text-zinc-100 tabular-nums leading-none">
              {turn}
            </span>
            {isAiTurn && (
              <span className="text-[10px] uppercase font-black text-red-500 mt-1">
                AI Thinking...
              </span>
            )}
          </div>
        </div>
      </header>

      <div className="flex gap-4 mb-4">
        <div className="bg-zinc-800 text-white p-4 rounded-xl shadow-lg flex gap-8">
          <div className="flex flex-col items-center">
            <span className="text-[10px] uppercase font-bold text-zinc-400">
              AI Score
            </span>
            <span className="text-2xl font-black">{aiScore}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[10px] uppercase font-bold text-zinc-400">
              AI Cards
            </span>
            <span className="text-2xl font-black">
              {Object.values(aiHand).reduce((a, b) => a + b, 0)}
            </span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[10px] uppercase font-bold text-zinc-400">
              AI Tickets
            </span>
            <span className="text-2xl font-black">{aiTickets.length}</span>
          </div>
        </div>
      </div>

      <main className="w-full flex justify-center gap-8 p-4">
        <div className="flex flex-col items-center">
          <div className="relative w-[800px] h-[600px] overflow-auto shadow-2xl rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-zinc-200 dark:bg-zinc-800">
            <div className="relative min-w-[1200px] aspect-[18/10] bg-white dark:bg-black overflow-hidden">
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
                  claimedRoutes,
                  claimRoute,
                }}
              >
                <div
                  className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none"
                  style={{
                    backgroundImage:
                      "radial-gradient(#000 1px, transparent 1px)",
                    backgroundSize: "20px 20px",
                  }}
                ></div>

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
                      <TrainTile
                        key={i}
                        color={tile.color}
                        angle={tile.angle}
                      />
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
            Player board
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
            <div className="gap-2 flex flex-col justify-center max-w-[600px]">
              <p className="text-sm text-zinc-500 dark:text-zinc-400 font-bold mb-2">
                Train Cards
              </p>
              <div className="grid grid-cols-3 border-2 border-dashed p-4 gap-x-8 gap-y-16 min-w-[500px] min-h-[200px]">
                {Object.entries(playerHand)
                  .filter(([_, count]) => count > 0)
                  .map(([color, count]) => {
                    return (
                      <div
                        key={color}
                        className="flex flex-col relative h-[140px]"
                      >
                        {Array.from({ length: count }).map((_, i) => (
                          <div
                            key={i}
                            className="absolute transition-all"
                            style={{
                              zIndex: i,
                              top: i * 20,
                            }}
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
                    );
                  })}
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
            className="relative w-[210px] h-[120px] mt-10 cursor-pointer"
            onClick={drawTickets}
          >
            {ticketDeck.map((t, i) => (
              <div
                key={i}
                className="absolute transition-transform hover:-translate-y-1"
                style={{
                  top: -i * 2,
                  left: i * 0.5,
                  zIndex: i,
                }}
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
            className="relative w-[176px] h-[120px] mt-16 cursor-pointer"
            onClick={drawFromDeck}
          >
            {trainDeck.map((c, i) => (
              <div
                key={i}
                className="absolute transition-transform hover:-translate-y-1"
                style={{
                  top: -i * 1.2,
                  left: i * 0.5,
                  zIndex: i,
                }}
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

          <div className="relative w-[176px] mt-10">
            <div className="mb-4 text-center text-xs font-bold uppercase tracking-wider text-zinc-500">
              Cards on Display
            </div>
            <div className="flex flex-col gap-4">
              {displayCards.map((c, i) => (
                <div
                  key={i}
                  className="transition-transform hover:-translate-y-1 cursor-pointer"
                  onClick={() => drawFromDisplay(i)}
                >
                  <TrainCards
                    color={c.color}
                    rainbow={!!c.rainbow}
                    opposite={false}
                  />
                </div>
              ))}
            </div>
          </div>
          <div className="relative w-[176px] mt-10">
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
    </div>
  );
}
