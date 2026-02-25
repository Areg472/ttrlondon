"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { shuffle } from "./utils/shuffle";
import {
  CITIES,
  TICKETS,
  INITIAL_TRAIN_CARDS_DECK,
  ROUTES,
} from "./data/gameData";
import { RulesPanel } from "./Components/RulesPanel";
import { StartScreen } from "./Components/StartScreen";
import { GameOverModal } from "./Components/GameOverModal";
import { GameHeader } from "./Components/GameHeader";
import { AiPanel } from "./Components/AiPanel";
import { PlayerBoard } from "./Components/PlayerBoard";

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
  const [numAIs, setNumAIs] = useState(null);

  const getInitialGameState = (n) => {
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

    const initialTicketDeck = shuffle([...TICKETS]);
    const playerInitialTickets = initialTicketDeck.slice(0, 2);
    const remainingTicketDeck = initialTicketDeck.slice(2 + n * 2);

    const emptyHand = {
      orange: 0,
      blue: 0,
      black: 0,
      red: 0,
      yellow: 0,
      green: 0,
      rainbow: 0,
    };

    const playerInitialTrain = initialDeck.slice(0, 2);
    const initialPlayerHand = { ...emptyHand };
    playerInitialTrain.forEach((c) => {
      const key = c.rainbow ? "rainbow" : c.color;
      initialPlayerHand[key]++;
    });

    const aiHands = [];
    const aiTicketsArr = [];
    let deckOffset = 2;
    for (let i = 0; i < n; i++) {
      const aiTrain = initialDeck.slice(deckOffset, deckOffset + 2);
      deckOffset += 2;
      const hand = { ...emptyHand };
      aiTrain.forEach((c) => {
        const key = c.rainbow ? "rainbow" : c.color;
        hand[key]++;
      });
      aiHands.push(hand);
      aiTicketsArr.push(initialTicketDeck.slice(2 + i * 2, 2 + i * 2 + 2));
    }

    const remainingTrainDeck = initialDeck.slice(deckOffset);

    return {
      display: initialDisplay,
      trainDeck: remainingTrainDeck,
      discard: initialDiscard,
      playerHand: initialPlayerHand,
      aiHands,
      drawingTickets: playerInitialTickets,
      aiTickets: aiTicketsArr,
      ticketDeck: remainingTicketDeck,
    };
  };

  const [rulesShown, setRulesShown] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [initialState, setInitialState] = useState(null);
  const [aiSelectingTickets, setAiSelectingTickets] = useState(false);

  const [playerHand, setPlayerHand] = useState({
    orange: 0,
    blue: 0,
    black: 0,
    red: 0,
    yellow: 0,
    green: 0,
    rainbow: 0,
  });
  const [aiHands, setAiHands] = useState([]);
  const [score, setScore] = useState(0);
  const [aiScores, setAiScores] = useState([]);
  const [turn, setTurn] = useState(1);
  const [currentAiIndex, setCurrentAiIndex] = useState(-1);
  const [cardsDrawn, setCardsDrawn] = useState(0);
  const [placedTiles, setPlacedTiles] = useState(0);
  const [aiPlacedTiles, setAiPlacedTiles] = useState([]);
  const [discardPile, setDiscardPile] = useState([]);
  const [displayCards, setDisplayCards] = useState([]);
  const [trainDeck, setTrainDeck] = useState([]);
  const [ticketDeck, setTicketDeck] = useState([]);
  const [playerTickets, setPlayerTickets] = useState([]);
  const [aiTickets, setAiTickets] = useState([]);
  const [drawingTickets, setDrawingTickets] = useState(null);
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
  const [aiLastActions, setAiLastActions] = useState([]);
  const isAiThinkingRef = useRef(false);
  const lastProcessedAiAction = useRef("");

  const isAiTurn = currentAiIndex >= 0;
  const isPersonTurn = currentAiIndex < 0;

  const askAiToSelectTickets = async (drawnTickets, hand) => {
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content:
                "You are an AI playing Ticket to Ride London. Respond ONLY with a valid JSON object. Do not include any other text.",
            },
            {
              role: "user",
              content: `You are choosing starting tickets. You have been dealt these 2 tickets: ${JSON.stringify(drawnTickets)}. Your starting hand is: ${JSON.stringify(hand)}. You MUST keep at least 1 ticket. Choose which tickets to keep based on which are easier to complete given your hand and which score more points. Respond with: { "keepIndices": [0] } or { "keepIndices": [0, 1] }`,
            },
          ],
        }),
      });
      const data = await response.json();
      const content = data.text || "";
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (
          Array.isArray(parsed.keepIndices) &&
          parsed.keepIndices.length >= 1
        ) {
          return parsed.keepIndices.filter((i) => i === 0 || i === 1);
        }
      }
    } catch (_) {}
    return [0];
  };

  const startGame = async (n) => {
    const state = getInitialGameState(n);
    setNumAIs(n);
    setInitialState(state);
    setPlayerHand(state.playerHand);
    setAiHands(state.aiHands);
    setAiScores(Array(n).fill(0));
    setAiPlacedTiles(Array(n).fill(0));
    setAiLastActions(Array(n).fill(null));
    setDiscardPile(state.discard);
    setDisplayCards(state.display);
    setTrainDeck(state.trainDeck);
    setTicketDeck(state.ticketDeck);
    setDrawingTickets(state.drawingTickets);
    setAiSelectingTickets(true);
    setGameStarted(true);

    const chosenTickets = [];
    for (let i = 0; i < n; i++) {
      const drawn = state.aiTickets[i];
      const kept = await askAiToSelectTickets(drawn, state.aiHands[i]);
      chosenTickets.push(kept.map((idx) => drawn[idx]));
    }
    setAiTickets(chosenTickets);
    setAiSelectingTickets(false);
  };

  const drawFromDisplay = (index) => {
    if (gameOver || isAiTurn || cardsDrawn >= 2 || drawingTickets) return;
    const card = displayCards[index];
    if (!card) return;
    if (card.rainbow && cardsDrawn >= 1) return;

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
    if (isAiTurn) {
      const idx = currentAiIndex;
      setAiHands((prev) => {
        const next = prev.map((h, i) => {
          if (i !== idx) return h;
          const nh = { ...h };
          const spent = [];
          for (const [k, v] of Object.entries(deduction || {})) {
            nh[k] = Math.max(0, (nh[k] ?? 0) - v);
            for (let j = 0; j < v; j++)
              spent.push(k === "rainbow" ? { rainbow: true } : { color: k });
          }
          setDiscardPile((prevDiscard) => [...prevDiscard, ...spent]);
          return nh;
        });
        return next;
      });
      return;
    }
    setPlayerHand((prev) => {
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

    if (currentAiIndex < 0) {
      setCurrentAiIndex(0);
    } else if (currentAiIndex < numAIs - 1) {
      setCurrentAiIndex((prev) => prev + 1);
    } else {
      setCurrentAiIndex(-1);
      setTurn((prev) => prev + 1);
      setPlayerTurnActions([]);
    }
    setCardsDrawn(0);
  };

  const addPoints = (points) => {
    if (isAiTurn) {
      const idx = currentAiIndex;
      setAiScores((prev) => prev.map((s, i) => (i === idx ? s + points : s)));
    } else {
      setScore((prev) => prev + points);
    }
  };

  const incrementPlaced = (n) => {
    const tilesToAdd = Number(n) || 0;
    if (isAiTurn) {
      const idx = currentAiIndex;
      setAiPlacedTiles((prev) => {
        const next = prev.map((p, i) => (i === idx ? p + tilesToAdd : p));
        const nextPlaced = next[idx];
        if (nextPlaced >= 15 && !lastRoundTriggered) {
          setLastRoundTriggered(true);
          setFinalTurnsLeft(numAIs - idx);
        }
        return next;
      });
    } else {
      setPlacedTiles((prev) => {
        const nextPlaced = prev + tilesToAdd;
        if (nextPlaced >= 15 && !lastRoundTriggered) {
          setLastRoundTriggered(true);
          setFinalTurnsLeft(numAIs);
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
    const currentPlaced = isAiTurn
      ? aiPlacedTiles[currentAiIndex] || 0
      : placedTiles;
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

  const applyNumberBonuses = (
    finalClaimedRoutes,
    finalPlayerTickets,
    finalAiTickets,
  ) => {
    const groups = groupCitiesByNumber();
    const getEdges = (claimer) => {
      const edges = [];
      for (const [k, v] of Object.entries(finalClaimedRoutes)) {
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
    const playerEdges = getEdges("player");

    const playerNums = [];
    for (const [num, names] of groups.entries()) {
      if (names.length < 2) continue;
      if (isSetFullyConnected(playerEdges, names)) playerNums.push(num);
    }

    const add = (arr) => arr.reduce((a, b) => a + b, 0);
    if (playerNums.length) setScore((prev) => prev + add(playerNums));
    setPlayerNumberBonuses(playerNums);

    const allAiNums = [];
    const allAiResults = [];
    for (let i = 0; i < (numAIs || 0); i++) {
      const aiEdges = getEdges(`ai${i}`);
      const aiNums = [];
      for (const [num, names] of groups.entries()) {
        if (names.length < 2) continue;
        if (isSetFullyConnected(aiEdges, names)) aiNums.push(num);
      }
      allAiNums.push(aiNums);
      if (aiNums.length)
        setAiScores((prev) =>
          prev.map((s, idx) => (idx === i ? s + add(aiNums) : s)),
        );

      const aiResults = (finalAiTickets[i] || []).map((t) => {
        const completed = isConnectedViaEdges(aiEdges, t.cityA, t.cityB);
        return { ...t, completed };
      });
      allAiResults.push(aiResults);
      const aiTicketDelta = aiResults.reduce(
        (sum, t) => sum + (t.completed ? t.points : -t.points),
        0,
      );
      if (aiTicketDelta)
        setAiScores((prev) =>
          prev.map((s, idx) => (idx === i ? s + aiTicketDelta : s)),
        );
    }

    setAiNumberBonuses(allAiNums);

    const playerResults = finalPlayerTickets.map((t) => {
      const completed = isConnectedViaEdges(playerEdges, t.cityA, t.cityB);
      return { ...t, completed };
    });
    const playerTicketDelta = playerResults.reduce(
      (sum, t) => sum + (t.completed ? t.points : -t.points),
      0,
    );
    setScore((prev) => prev + playerTicketDelta);
    setPlayerTicketResults(playerResults);
    setAiTicketResults(allAiResults);
  };

  useEffect(() => {
    if (gameOver && !finalBonusesApplied) {
      applyNumberBonuses(claimedRoutes, playerTickets, aiTickets);
      setFinalBonusesApplied(true);
    }
  }, [gameOver, finalBonusesApplied, claimedRoutes, playerTickets, aiTickets]);

  const logPlayerAction = (action) => {
    setPlayerTurnActions((prev) => [...prev, action]);
  };

  const getUsefulRoutesForTicket = (
    cityA,
    cityB,
    currentClaimedRoutes,
    aiIdentifier,
  ) => {
    const adj = new Map();
    const addEdge = (city, neighbor, routeId, side, color, trainCount) => {
      if (!adj.has(city)) adj.set(city, []);
      adj.get(city).push({ neighbor, routeId, side, color, trainCount });
    };

    for (const route of ROUTES) {
      let connects = null;
      if (Array.isArray(route.connects) && route.connects.length === 2) {
        connects = route.connects;
      } else {
        connects = inferRouteConnectsByGeometry(route);
      }
      if (!connects || !connects[0] || !connects[1]) continue;
      const [a, b] = connects;

      if (route.isDouble) {
        for (const side of ["even", "odd"]) {
          const key = `${route.id}_${side}`;
          const claimer = currentClaimedRoutes[key];
          if (!claimer || claimer === aiIdentifier) {
            const tileColor =
              route.tiles[side === "even" ? 0 : 1]?.color || "gray";
            addEdge(a, b, route.id, side, tileColor, route.trainCount);
            addEdge(b, a, route.id, side, tileColor, route.trainCount);
          }
        }
      } else {
        const key = `${route.id}_single`;
        const claimer = currentClaimedRoutes[key];
        if (!claimer || claimer === aiIdentifier) {
          const tileColor = route.tiles[0]?.color || "gray";
          addEdge(a, b, route.id, "single", tileColor, route.trainCount);
          addEdge(b, a, route.id, "single", tileColor, route.trainCount);
        }
      }
    }

    const dist = new Map();
    dist.set(cityA, 0);
    const queue = [cityA];
    while (queue.length) {
      const cur = queue.shift();
      const curDist = dist.get(cur);
      for (const { neighbor } of adj.get(cur) || []) {
        if (!dist.has(neighbor)) {
          dist.set(neighbor, curDist + 1);
          queue.push(neighbor);
        }
      }
    }

    if (!dist.has(cityB)) return [];

    const targetDist = dist.get(cityB);

    const usefulRoutes = [];
    const seen = new Set();
    for (const [city, edges] of adj.entries()) {
      const cityDist = dist.get(city);
      if (cityDist === undefined || cityDist >= targetDist) continue;
      for (const { neighbor, routeId, side, color, trainCount } of edges) {
        const neighborDist = dist.get(neighbor);
        if (neighborDist === cityDist + 1) {
          const key = `${routeId}_${side}`;
          if (!seen.has(key)) {
            seen.add(key);
            if (!currentClaimedRoutes[key]) {
              usefulRoutes.push({ routeId, side, color, trainCount });
            }
          }
        }
      }
    }
    return usefulRoutes;
  };

  const playAiTurn = useCallback(async () => {
    if (isAiThinkingRef.current || gameOver || !isAiTurn) return;
    isAiThinkingRef.current = true;

    const idx = currentAiIndex;
    const myTickets = aiTickets[idx] || [];
    const myHand = aiHands[idx] || {};
    const aiIdentifier = `ai${idx}`;

    const ticketAnalysis = myTickets.map((ticket) => {
      const myEdges = getClaimedEdges(aiIdentifier);
      const completed = isConnectedViaEdges(
        myEdges,
        ticket.cityA,
        ticket.cityB,
      );
      const usefulRoutes = completed
        ? []
        : getUsefulRoutesForTicket(
            ticket.cityA,
            ticket.cityB,
            claimedRoutes,
            aiIdentifier,
          );
      const affordableRoutes = usefulRoutes.filter(({ color, trainCount }) => {
        const wilds = myHand.rainbow || 0;
        if (color === "gray") {
          const baseColors = [
            "orange",
            "yellow",
            "blue",
            "green",
            "black",
            "red",
          ];
          return (
            baseColors.some((c) => (myHand[c] || 0) + wilds >= trainCount) ||
            wilds >= trainCount
          );
        }
        return (myHand[color] || 0) + wilds >= trainCount;
      });
      return {
        cityA: ticket.cityA,
        cityB: ticket.cityB,
        points: ticket.points,
        completed,
        usefulRoutes,
        affordableRoutes,
      };
    });

    const neededColors = new Set();
    for (const t of ticketAnalysis) {
      if (!t.completed) {
        for (const r of t.usefulRoutes) {
          if (r.color !== "gray") neededColors.add(r.color);
          else {
            for (const c of [
              "orange",
              "yellow",
              "blue",
              "green",
              "black",
              "red",
            ])
              neededColors.add(c);
          }
        }
      }
    }
    const displayCardOptions = displayCards.map((c, i) => ({
      index: i,
      color: c.rainbow ? "rainbow" : c.color,
      isRainbow: !!c.rainbow,
      isNeeded: c.rainbow || neededColors.has(c.rainbow ? "rainbow" : c.color),
      canDrawNow: !(c.rainbow && cardsDrawn >= 1),
    }));

    const gameState = {
      aiHand: myHand,
      aiTickets: myTickets,
      aiScore: aiScores[idx] || 0,
      aiPlacedTiles: aiPlacedTiles[idx] || 0,
      aiIndex: idx,
      cardsDrawn,
      playerHandCount: Object.values(playerHand).reduce((a, b) => a + b, 0),
      playerTicketsCount: playerTickets.length,
      playerScore: score,
      playerTurnActions,
      displayCardOptions,
      trainDeckCount: trainDeck.length,
      ticketDeckCount: ticketDeck.length,
      claimedRoutes,
      ticketAnalysis,
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
              content: `State: ${JSON.stringify(gameState)}

cardsDrawn=${gameState.cardsDrawn}. displayCardOptions=${JSON.stringify(gameState.displayCardOptions)} (index=position, isNeeded=helps your tickets, canDrawNow=allowed by rules).

Follow EXACTLY:
${
  gameState.cardsDrawn === 1
    ? `cardsDrawn=1: draw ONE more card. Priority: pick the display card with the highest index where isNeeded=true AND canDrawNow=true AND isRainbow=false. If none, draw_deck.`
    : `cardsDrawn=0 priority order (stop at first that applies):
1. affordableRoutes non-empty for any incomplete ticket? → place_tiles on that route (highest points ticket first). Use routeId, side, color from affordableRoutes entry.
2. usefulRoutes non-empty but none affordable? → draw the display card where isNeeded=true AND canDrawNow=true (prefer rainbow if available and cardsDrawn=0, else pick the needed color with lowest trainCount requirement). If no such display card, draw_deck.
3. All incomplete tickets have empty usefulRoutes AND ticketDeckCount>0? → draw_tickets.
4. Otherwise → draw_deck.`
}

Actions: {"action":"draw_display","index":0-4} | {"action":"draw_deck"} | {"action":"draw_tickets"} | {"action":"place_tiles","routeId":N,"side":"single"|"even"|"odd","color":"colorname"}
Respond with ONE JSON object only.`,
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
  }, [
    gameOver,
    isAiTurn,
    currentAiIndex,
    aiHands,
    aiTickets,
    aiScores,
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

    const currentKey = `${turn}-${currentAiIndex}-${cardsDrawn}`;
    if (lastProcessedAiAction.current !== currentKey) {
      lastProcessedAiAction.current = currentKey;
      playAiTurn();
    }
  }, [isAiTurn, currentAiIndex, turn, cardsDrawn, gameOver, playAiTurn]);

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
    if (card.rainbow && cardsDrawn >= 1) {
      drawAiFromDeck();
      return;
    }

    const colorKey = card.rainbow ? "rainbow" : card.color;
    const aidx = currentAiIndex;
    setAiHands((prev) =>
      prev.map((h, i) =>
        i === aidx ? { ...h, [colorKey]: (h[colorKey] ?? 0) + 1 } : h,
      ),
    );

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

    setAiLastActions((prev) =>
      prev.map((a, i) => (i === currentAiIndex ? "Drew from the display" : a)),
    );
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
    const aidx2 = currentAiIndex;
    setAiHands((prev) =>
      prev.map((h, i) =>
        i === aidx2 ? { ...h, [colorKey]: (h[colorKey] ?? 0) + 1 } : h,
      ),
    );
    setTrainDeck(currentDeck.slice(1));
    setDiscardPile(currentDiscard);
    setAiLastActions((prev) =>
      prev.map((a, i) => (i === currentAiIndex ? "Drew from the deck" : a)),
    );
    const total = cardsDrawn + 1;
    if (total >= 2) {
      incrementTurn();
    } else {
      setCardsDrawn(total);
    }
  };

  const drawAiTickets = async () => {
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

    const aidx3 = currentAiIndex;
    const currentTickets = aiTickets[aidx3] || [];
    const currentHand = aiHands[aidx3] || {};

    let keepIndices = [0];
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content:
                "You are an AI playing Ticket to Ride London. Respond ONLY with a valid JSON object. Do not include any other text.",
            },
            {
              role: "user",
              content: `You are choosing new tickets mid-game. Your current tickets: ${JSON.stringify(currentTickets)}. You drew these 2 new tickets: ${JSON.stringify(drawn)}. Your hand: ${JSON.stringify(currentHand)}. You MUST keep at least 1 of the new tickets. Choose which new tickets to keep based on synergy with existing tickets, your hand, and point value. Respond with: { "keepIndices": [0] } or { "keepIndices": [0, 1] }`,
            },
          ],
        }),
      });
      const data = await response.json();
      const content = data.text || "";
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (
          Array.isArray(parsed.keepIndices) &&
          parsed.keepIndices.length >= 1
        ) {
          keepIndices = parsed.keepIndices.filter((i) => i === 0 || i === 1);
          if (keepIndices.length === 0) keepIndices = [0];
        }
      }
    } catch (_) {}

    const keptTickets = keepIndices.map((i) => drawn[i]);
    setAiTickets((prev) =>
      prev.map((t, i) => (i === aidx3 ? [...t, ...keptTickets] : t)),
    );
    setAiLastActions((prev) =>
      prev.map((a, i) =>
        i === currentAiIndex ? `Drew tickets, kept ${keptTickets.length}` : a,
      ),
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
      const otherClaimer = claimedRoutes[`${routeId}_${otherSide}`];
      if (otherClaimer) {
        if (numAIs <= 1 || otherClaimer === `ai${currentAiIndex}`) {
          drawAiFromDeck();
          return;
        }
      }
    }

    const length = route.trainCount;
    const currentAiHand = aiHands[currentAiIndex] || {};
    const wilds = currentAiHand.rainbow || 0;
    const have = currentAiHand[color] || 0;

    let deduction = null;
    if (color === "gray") {
      const baseColors = ["orange", "yellow", "blue", "green", "black", "red"];
      let best = null;
      for (const c of baseColors) {
        const cHave = currentAiHand[c] || 0;
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
      claimRoute(routeId, side, `ai${currentAiIndex}`);
      setAiLastActions((prev) =>
        prev.map((a, i) =>
          i === currentAiIndex
            ? `Claimed route (${length} train${length !== 1 ? "s" : ""}, ${color} cards)`
            : a,
        ),
      );
      incrementTurn();
    } else {
      console.log("AI couldn't place tiles, drawing from deck instead");
      drawAiFromDeck();
    }
  };

  if (!rulesShown) {
    return <RulesPanel onFinish={() => setRulesShown(true)} />;
  }

  if (!gameStarted) {
    return <StartScreen onStart={startGame} />;
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-zinc-100 font-sans dark:bg-zinc-900 p-8">
      {aiSelectingTickets && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-white dark:bg-zinc-800 rounded-3xl p-10 shadow-2xl flex flex-col items-center gap-4">
            <div className="text-2xl font-black text-zinc-800 dark:text-zinc-100">
              AIs are choosing tickets…
            </div>
            <div className="text-zinc-500 dark:text-zinc-400 text-sm">
              Please wait
            </div>
          </div>
        </div>
      )}
      {gameOver && (
        <GameOverModal
          score={score}
          aiScores={aiScores}
          playerNumberBonuses={playerNumberBonuses}
          aiNumberBonuses={aiNumberBonuses}
          playerTicketResults={playerTicketResults}
          aiTicketResults={aiTicketResults}
        />
      )}

      <GameHeader
        score={score}
        turn={turn}
        isAiTurn={isAiTurn}
        isPersonTurn={isPersonTurn}
        currentAiIndex={currentAiIndex}
        lastRoundTriggered={lastRoundTriggered}
        gameOver={gameOver}
      />

      <div className="flex flex-row flex-wrap gap-4">
        {aiHands.map((hand, i) => (
          <AiPanel
            key={i}
            index={i}
            hand={hand}
            score={aiScores[i]}
            placedTiles={aiPlacedTiles[i]}
            tickets={aiTickets[i]}
            lastAction={aiLastActions[i]}
            isThinking={currentAiIndex === i}
            gameOver={gameOver}
          />
        ))}
      </div>

      <PlayerBoard
        playerHand={playerHand}
        playerTickets={playerTickets}
        placedTiles={placedTiles}
        drawingTickets={drawingTickets}
        selectTickets={selectTickets}
        spendCards={spendCards}
        addPoints={addPoints}
        canPlaceMore={canPlaceMore}
        incrementPlaced={incrementPlaced}
        incrementTurn={incrementTurn}
        cardsDrawn={cardsDrawn}
        isAiTurn={isAiTurn || aiSelectingTickets}
        numAIs={numAIs}
        claimedRoutes={claimedRoutes}
        claimRoute={claimRoute}
        ticketDeck={ticketDeck}
        trainDeck={trainDeck}
        discardPile={discardPile}
        drawTickets={drawTickets}
        drawFromDeck={drawFromDeck}
        displayCards={displayCards}
        onDrawFromDisplay={drawFromDisplay}
      />
    </div>
  );
}
