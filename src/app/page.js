"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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

const checkThreeRainbows = (currentDisplay, currentDeck, currentDiscard) => {
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
};

export default function Home() {
  const getInitialGameState = () => {
    const initialTrainDeck = [...INITIAL_TRAIN_CARDS_DECK];
    const {
      display: initialDisplay,
      deck: initialDeck,
      discard: initialDiscard,
    } = checkThreeRainbows(
      initialTrainDeck.slice(0, 5),
      initialTrainDeck.slice(5),
      [],
    );

    const initialTicketDeck = [...TICKETS];
    const playerInitialTickets = initialTicketDeck.slice(0, 2);
    const aiInitialTickets = initialTicketDeck.slice(2, 4);
    const remainingTicketDeck = initialTicketDeck.slice(4);

    const playerInitialTrain = initialDeck.slice(0, 2);
    const aiInitialTrain = initialDeck.slice(2, 4);
    const remainingTrainDeck = initialDeck.slice(4);

    const initialPlayerHand = {
      orange: 0,
      blue: 0,
      black: 0,
      red: 0,
      yellow: 0,
      green: 0,
      rainbow: 0,
    };
    const initialAiHand = { ...initialPlayerHand };

    playerInitialTrain.forEach((c) => {
      const key = c.rainbow ? "rainbow" : c.color;
      initialPlayerHand[key]++;
    });
    aiInitialTrain.forEach((c) => {
      const key = c.rainbow ? "rainbow" : c.color;
      initialAiHand[key]++;
    });

    return {
      display: initialDisplay,
      trainDeck: remainingTrainDeck,
      discard: initialDiscard,
      playerHand: initialPlayerHand,
      aiHand: initialAiHand,
      drawingTickets: playerInitialTickets,
      aiTickets: aiInitialTickets,
      ticketDeck: remainingTicketDeck,
    };
  };

  const [initialState] = useState(getInitialGameState);

  const [playerHand, setPlayerHand] = useState(initialState.playerHand);
  const [aiHand, setAiHand] = useState(initialState.aiHand);
  const [score, setScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);
  const [turn, setTurn] = useState(1);
  const [isAiTurn, setIsAiTurn] = useState(false);
  const [cardsDrawn, setCardsDrawn] = useState(0);
  const [placedTiles, setPlacedTiles] = useState(0);
  const [aiPlacedTiles, setAiPlacedTiles] = useState(0);
  const [discardPile, setDiscardPile] = useState(initialState.discard);
  const [displayCards, setDisplayCards] = useState(initialState.display);
  const [trainDeck, setTrainDeck] = useState(initialState.trainDeck);
  const [ticketDeck, setTicketDeck] = useState(initialState.ticketDeck);
  const [playerTickets, setPlayerTickets] = useState([]);
  const [aiTickets, setAiTickets] = useState(initialState.aiTickets);
  const [drawingTickets, setDrawingTickets] = useState(
    initialState.drawingTickets,
  );
  const [claimedRoutes, setClaimedRoutes] = useState({});
  const [playerTurnActions, setPlayerTurnActions] = useState([]);

  const [playerTicketResults, setPlayerTicketResults] = useState([]);
  const [aiTicketResults, setAiTicketResults] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  const [lastRoundTriggered, setLastRoundTriggered] = useState(false);
  const [finalTurnsLeft, setFinalTurnsLeft] = useState(-1);
  const [playerNumberBonuses, setPlayerNumberBonuses] = useState([]);
  const [aiNumberBonuses, setAiNumberBonuses] = useState([]);
  const [finalBonusesApplied, setFinalBonusesApplied] = useState(false);
  const [aiLastAction, setAiLastAction] = useState(null);
  const isAiThinkingRef = useRef(false);
  const lastProcessedAiAction = useRef("");

  const drawFromDisplay = (index) => {
    if (gameOver || isAiTurn || cardsDrawn >= 2 || drawingTickets) return;
    const card = displayCards[index];
    if (!card) return;

    logPlayerAction({
      action: "draw_display",
      color: card.rainbow ? "rainbow" : card.color,
      index,
    });

    const colorKey = card.rainbow ? "rainbow" : card.color;
    setPlayerHand((prev) => ({
      ...prev,
      [colorKey]: (prev[colorKey] ?? 0) + 1,
    }));

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
    if (gameOver || isAiTurn || cardsDrawn >= 2 || drawingTickets) return;
    let currentDeck = [...trainDeck],
      currentDiscard = [...discardPile];
    if (currentDeck.length === 0 && currentDiscard.length > 0) {
      currentDeck = shuffle(currentDiscard);
      currentDiscard = [];
    }
    if (currentDeck.length === 0) return;
    const card = currentDeck[0];
    logPlayerAction({
      action: "draw_deck",
      color: card.rainbow ? "rainbow" : card.color,
    });
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
    if (lastRoundTriggered) {
      if (finalTurnsLeft === 0) {
        setGameOver(true);
        return;
      }
      setFinalTurnsLeft((prev) => prev - 1);
    }

    if (!isAiTurn) {
      setIsAiTurn(true);
    } else {
      setIsAiTurn(false);
      setTurn((prev) => prev + 1);
      setPlayerTurnActions([]);
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
    const tilesToAdd = Number(n) || 0;
    if (isAiTurn) {
      setAiPlacedTiles((prev) => {
        const nextPlaced = prev + tilesToAdd;

        if (nextPlaced >= 15 && !lastRoundTriggered) {
          setLastRoundTriggered(true);
          setFinalTurnsLeft(2);
        }
        return nextPlaced;
      });
    } else {
      setPlacedTiles((prev) => {
        const nextPlaced = prev + tilesToAdd;

        if (nextPlaced >= 15 && !lastRoundTriggered) {
          setLastRoundTriggered(true);
          setFinalTurnsLeft(2);
        }
        return nextPlaced;
      });
    }
  };

  const drawTickets = () => {
    if (gameOver || isAiTurn || cardsDrawn > 0 || drawingTickets) return;
    if (ticketDeck.length === 0) return;
    const drawn = ticketDeck.slice(0, 2);
    setTicketDeck((prev) => prev.slice(2));
    setDrawingTickets(drawn);
  };

  const selectTickets = (selectedIndices) => {
    if (selectedIndices.length < 1) return;
    const selected = selectedIndices.map((idx) => drawingTickets[idx]);
    logPlayerAction({ action: "select_tickets", tickets: selected });
    setPlayerTickets((prev) => [...prev, ...selected]);
    setDrawingTickets(null);
    if (!gameOver) incrementTurn();
  };

  const canPlaceMore = (needed) => {
    const n = Number(needed) || 0;
    const currentPlaced = isAiTurn ? aiPlacedTiles : placedTiles;
    return currentPlaced + n <= 17;
  };

  const claimRoute = (routeId, side, type) => {
    if (type === "player") {
      logPlayerAction({ action: "claim_route", routeId, side });
    }
    setClaimedRoutes((prev) => ({
      ...prev,
      [`${routeId}_${side}`]: type,
    }));
  };

  const routeConnectCache = { cache: {} };

  const inferRouteConnectsByGeometry = (route) => {
    if (!route) return null;
    const cached = routeConnectCache.cache[route.id];
    if (cached) return cached;

    const start = { x: route.x, y: route.y };
    let dx = 0;
    let dy = 0;
    (route.tiles || []).forEach((tile) => {
      const ang = Number(tile.angle) || 0;
      const rad = (ang * Math.PI) / 180;
      dx += 80 * Math.cos(rad);
      dy += 80 * Math.sin(rad);
    });
    const end = { x: start.x + dx, y: start.y + dy };

    const nearestCityTo = (pt) => {
      let best = null;
      for (const c of CITIES) {
        const ddx = (c.x ?? 0) - pt.x;
        const ddy = (c.y ?? 0) - pt.y;
        const d2 = ddx * ddx + ddy * ddy;
        if (!best || d2 < best.d2) best = { name: c.name, d2 };
      }
      return best ? best.name : null;
    };

    const a = nearestCityTo(start);
    let b = nearestCityTo(end);
    if (b === a) {
      let bestAlt = null;
      for (const c of CITIES) {
        if (c.name === a) continue;
        const ddx = (c.x ?? 0) - end.x;
        const ddy = (c.y ?? 0) - end.y;
        const d2 = ddx * ddx + ddy * ddy;
        if (!bestAlt || d2 < bestAlt.d2) bestAlt = { name: c.name, d2 };
      }
      if (bestAlt) b = bestAlt.name;
    }

    const connects = a && b ? [a, b] : null;
    if (connects) routeConnectCache.cache[route.id] = connects;
    return connects;
  };

  const getClaimedEdges = (claimer) => {
    const edges = [];
    for (const [k, v] of Object.entries(claimedRoutes)) {
      if (v !== claimer) continue;
      const [routeIdStr] = k.split("_");
      const id = Number(routeIdStr);
      const route = ROUTES.find((r) => r.id === id);
      if (!route) continue;
      let connects = null;
      if (Array.isArray(route.connects) && route.connects.length === 2) {
        connects = route.connects;
      } else {
        connects = inferRouteConnectsByGeometry(route);
      }
      if (connects && connects[0] && connects[1]) {
        edges.push([connects[0], connects[1]]);
      }
    }
    return edges;
  };

  const isConnectedViaEdges = (edges, start, goal) => {
    if (start === goal) return true;

    const adj = new Map();
    const add = (u, v) => {
      if (!adj.has(u)) adj.set(u, new Set());
      adj.get(u).add(v);
    };
    for (const [a, b] of edges) {
      add(a, b);
      add(b, a);
    }
    const visited = new Set([start]);
    const q = [start];
    while (q.length) {
      const u = q.shift();
      if (u === goal) return true;
      const nbrs = adj.get(u) || new Set();
      for (const v of nbrs) {
        if (!visited.has(v)) {
          visited.add(v);
          q.push(v);
        }
      }
    }
    return false;
  };

  const groupCitiesByNumber = () => {
    const groups = new Map();
    for (const c of CITIES) {
      const n = Number(c.number) || 0;
      if (!groups.has(n)) groups.set(n, []);
      groups.get(n).push(c.name);
    }
    return groups;
  };

  const isSetFullyConnected = (edges, names) => {
    if (!names || names.length <= 1) return false;
    const start = names[0];
    for (let i = 1; i < names.length; i++) {
      if (!isConnectedViaEdges(edges, start, names[i])) return false;
    }
    return true;
  };

  const applyNumberBonuses = () => {
    const groups = groupCitiesByNumber();
    const playerEdges = getClaimedEdges("player");
    const aiEdges = getClaimedEdges("ai");

    const playerNums = [];
    const aiNums = [];

    for (const [num, names] of groups.entries()) {
      if (names.length < 2) continue;
      if (isSetFullyConnected(playerEdges, names)) playerNums.push(num);
      if (isSetFullyConnected(aiEdges, names)) aiNums.push(num);
    }

    const add = (arr) => arr.reduce((a, b) => a + b, 0);

    if (playerNums.length) setScore((prev) => prev + add(playerNums));
    if (aiNums.length) setAiScore((prev) => prev + add(aiNums));

    setPlayerNumberBonuses(playerNums);
    setAiNumberBonuses(aiNums);

    // Apply ticket scoring
    const playerResults = playerTickets.map((t) => {
      const completed = isConnectedViaEdges(playerEdges, t.cityA, t.cityB);
      return { ...t, completed };
    });
    const aiResults = aiTickets.map((t) => {
      const completed = isConnectedViaEdges(aiEdges, t.cityA, t.cityB);
      return { ...t, completed };
    });

    const playerTicketDelta = playerResults.reduce(
      (sum, t) => sum + (t.completed ? t.points : -t.points),
      0,
    );
    const aiTicketDelta = aiResults.reduce(
      (sum, t) => sum + (t.completed ? t.points : -t.points),
      0,
    );

    setScore((prev) => prev + playerTicketDelta);
    setAiScore((prev) => prev + aiTicketDelta);

    setPlayerTicketResults(playerResults);
    setAiTicketResults(aiResults);
  };

  useEffect(() => {
    if (gameOver && !finalBonusesApplied) {
      applyNumberBonuses();
      setFinalBonusesApplied(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameOver, finalBonusesApplied, claimedRoutes]);

  const logPlayerAction = (action) => {
    setPlayerTurnActions((prev) => [...prev, action]);
  };

  const playAiTurn = useCallback(async () => {
    if (isAiThinkingRef.current || gameOver || !isAiTurn) return;
    isAiThinkingRef.current = true;

    const gameState = {
      aiHand,
      aiTickets,
      aiScore,
      aiPlacedTiles,
      cardsDrawn,
      playerHandCount: Object.values(playerHand).reduce((a, b) => a + b, 0),
      playerTicketsCount: playerTickets.length,
      playerScore: score,
      playerTurnActions,
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
              1. { "action": "draw_display", "index": number } - draw a card from display (index 0-4). If you draw a rainbow (and cardsDrawn is 0), turn ends. If you draw a non-rainbow, you can draw again.
              2. { "action": "draw_deck" } - draw a card from deck.
              3. { "action": "draw_tickets" } - draw 2 tickets (only if cardsDrawn is 0).
              4. { "action": "place_tiles", "routeId": number, "side": "single"|"even"|"odd", "color": string } - place tiles on a route (only if cardsDrawn is 0).
              
              Rules for the current turn (cardsDrawn = ${gameState.cardsDrawn}):
              - If cardsDrawn is 0: you can draw_display, draw_deck, draw_tickets, or place_tiles.
              - If cardsDrawn is 1: you can ONLY draw_display (non-rainbow) or draw_deck. You CANNOT draw_tickets or place_tiles.
              - Drawing a rainbow from the display costs 2 actions and ends your turn immediately.
              
              Choose exactly one action based on these rules.`,
            },
          ],
        }),
      });

      const data = await response.json();
      const content = data.text || "";

      console.log("AI Raw Response:", content);
      if (!content.trim()) {
        if (data.error) {
          console.error("AI Server Error:", data.error);
        } else {
          console.error("AI returned an empty response");
        }
        incrementTurn();
        return;
      }

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
    } finally {
      isAiThinkingRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    gameOver,
    isAiTurn,
    aiHand,
    aiTickets,
    aiScore,
    aiPlacedTiles,
    cardsDrawn,
    playerHand,
    playerTickets,
    score,
    playerTurnActions,
    displayCards,
    trainDeck,
    ticketDeck,
    claimedRoutes,
  ]);

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

  useEffect(() => {
    if (gameOver || !isAiTurn) return;

    const currentKey = `${turn}-${cardsDrawn}`;
    if (lastProcessedAiAction.current !== currentKey) {
      lastProcessedAiAction.current = currentKey;
      playAiTurn();
    }
  }, [isAiTurn, turn, cardsDrawn, gameOver, playAiTurn]);

  const drawAiFromDisplay = (index) => {
    if (gameOver || !isAiTurn || cardsDrawn >= 2) {
      incrementTurn();
      return;
    }
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

    if (nextDeck.length === 0 && nextDiscard.length > 0) {
      nextDeck = shuffle(nextDiscard);
      nextDiscard = [];
    }

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

    setAiLastAction("Drew from the display");
    const draws = card.rainbow ? 2 : 1;
    const total = cardsDrawn + draws;
    if (total >= 2) {
      incrementTurn();
    } else {
      setCardsDrawn(total);
    }
  };

  const drawAiFromDeck = () => {
    if (gameOver || !isAiTurn || cardsDrawn >= 2) {
      incrementTurn();
      return;
    }
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
    setAiLastAction("Drew from the deck");
    const total = cardsDrawn + 1;
    if (total >= 2) {
      incrementTurn();
    } else {
      setCardsDrawn(total);
    }
  };

  const drawAiTickets = () => {
    if (gameOver || !isAiTurn || cardsDrawn > 0) {
      incrementTurn();
      return;
    }
    if (ticketDeck.length === 0) {
      incrementTurn();
      return;
    }
    const drawn = ticketDeck.slice(0, 2);
    setTicketDeck((prev) => prev.slice(2));

    setAiTickets((prev) => [...prev, ...drawn]);
    setAiLastAction(
      `Drew ${drawn.length} ticket card${drawn.length !== 1 ? "s" : ""}`,
    );
    if (!gameOver) incrementTurn();
  };

  const executeAiPlaceTiles = (routeId, side, color) => {
    if (gameOver || !isAiTurn || cardsDrawn > 0) {
      incrementTurn();
      return;
    }
    const route = ROUTES.find((r) => r.id === routeId);
    if (!route) {
      incrementTurn();
      return;
    }

    if (route.isDouble) {
      const otherSide = side === "even" ? "odd" : "even";
      if (claimedRoutes[`${routeId}_${otherSide}`]) {
        drawAiFromDeck();
        return;
      }
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
      setAiLastAction(
        `Claimed route (${length} train${length !== 1 ? "s" : ""}, ${color} cards)`,
      );
      incrementTurn();
    } else {
      console.log("AI couldn't place tiles, drawing from deck instead");
      drawAiFromDeck();
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center bg-zinc-100 font-sans dark:bg-zinc-900 p-8">
      {gameOver && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-md">
          <div className="bg-white dark:bg-zinc-900 p-12 rounded-[40px] shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col items-center max-w-lg w-full text-center">
            <h2 className="text-5xl font-black mb-2 text-zinc-800 dark:text-zinc-100">
              Game Over
            </h2>
            <p className="text-zinc-500 mb-8 uppercase tracking-[0.2em] font-bold">
              Final Results
            </p>

            <div className="flex gap-12 mb-12">
              <div className="flex flex-col">
                <span className="text-sm text-zinc-400 uppercase font-bold mb-1">
                  Player
                </span>
                <span className="text-6xl font-black text-zinc-800 dark:text-zinc-100">
                  {score}
                </span>
              </div>
              <div className="w-px h-16 bg-zinc-200 dark:bg-zinc-800 self-center" />
              <div className="flex flex-col">
                <span className="text-sm text-zinc-400 uppercase font-bold mb-1">
                  AI
                </span>
                <span className="text-6xl font-black text-zinc-800 dark:text-zinc-100">
                  {aiScore}
                </span>
              </div>
            </div>

            {(playerNumberBonuses.length > 0 || aiNumberBonuses.length > 0) && (
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
                <div>
                  AI:{" "}
                  {aiNumberBonuses.length > 0
                    ? [...aiNumberBonuses].sort((a, b) => a - b).join(", ")
                    : "—"}
                  {aiNumberBonuses.length > 0 && (
                    <span className="ml-2 text-zinc-500">
                      (+{aiNumberBonuses.reduce((a, b) => a + b, 0)})
                    </span>
                  )}
                </div>
              </div>
            )}

            {(playerTicketResults.length > 0 || aiTicketResults.length > 0) && (
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
                <div>
                  <span className="font-medium">AI:</span>
                  {aiTicketResults.length === 0 && " —"}
                  {aiTicketResults.map((t, i) => (
                    <span
                      key={i}
                      className={`ml-2 ${t.completed ? "text-green-500" : "text-red-500"}`}
                    >
                      {t.cityA}→{t.cityB} ({t.completed ? "+" : "-"}
                      {t.points})
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="text-2xl font-bold mb-8">
              {score > aiScore ? (
                <span className="text-green-500">Player Wins!</span>
              ) : score < aiScore ? (
                <span className="text-red-500">AI Wins!</span>
              ) : (
                <span className="text-blue-500">It&#39;s a Tie!</span>
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
      )}
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
            {isAiTurn && !gameOver && (
              <span className="text-[10px] uppercase font-black text-red-500 mt-1">
                AI Thinking...
              </span>
            )}
            {lastRoundTriggered && !gameOver && (
              <span className="text-[10px] uppercase font-black text-amber-500 mt-1">
                Last Round!
              </span>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-row space-x-4">
        <div>
          <div className="flex gap-4 mb-4">
            <div className="bg-zinc-800 text-white p-4 rounded-xl shadow-lg flex gap-8">
              <div className="flex flex-col items-center">
                <span className="text-[10px] uppercase font-bold text-zinc-400">
                  AI Points
                </span>
                <span className="text-2xl font-black">{aiScore}</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[10px] uppercase font-bold text-zinc-400">
                  AI Train Pieces
                </span>
                <span className="text-2xl font-black">
                  {17 - aiPlacedTiles}
                </span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[10px] uppercase font-bold text-zinc-400">
                  AI Train Cards
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
          <div className="flex gap-4 justify-center mb-4">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              <span className="font-bold text-zinc-700 dark:text-zinc-200">
                AI last action:
              </span>{" "}
              {aiLastAction ?? "None yet"}
            </p>
          </div>
        </div>
        <div>
          <div className="flex gap-4 mb-4">
            <div className="bg-zinc-800 text-white p-4 rounded-xl shadow-lg flex gap-8">
              <div className="flex flex-col items-center">
                <span className="text-[10px] uppercase font-bold text-zinc-400">
                  AI 2 Points
                </span>
                <span className="text-2xl font-black">ETA</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[10px] uppercase font-bold text-zinc-400">
                  AI 2 Train Pieces
                </span>
                <span className="text-2xl font-black">ETA</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[10px] uppercase font-bold text-zinc-400">
                  AI 2 Train Cards
                </span>
                <span className="text-2xl font-black">ETA</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[10px] uppercase font-bold text-zinc-400">
                  AI 2 Tickets
                </span>
                <span className="text-2xl font-black">ETA</span>
              </div>
            </div>
          </div>
          <div className="flex gap-4 justify-center mb-4">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              <span className="font-bold text-zinc-700 dark:text-zinc-200">
                AI last action:
              </span>{" "}
              ETA
            </p>
          </div>
        </div>
      </div>

      <main className="w-full flex justify-center gap-8 p-4">
        <div className="flex flex-col items-center">
          <div className="relative w-200 h-150 overflow-auto shadow-2xl rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-black">
            <div
              className="relative min-w-300 aspect-18/10  bg-black"
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
                  .map(([color, count]) => {
                    return (
                      <div key={color} className="flex flex-col relative h-35">
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
            className="relative w-52.5 h-30 mt-10 cursor-pointer"
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
            className="relative w-44 h-30 mt-16 cursor-pointer"
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

          <div className="relative w-44 mt-10">
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
    </div>
  );
}
