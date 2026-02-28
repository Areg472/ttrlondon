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
  const [numAIs, setNumAIs] = useState(null);
  const [numExtraManual, setNumExtraManual] = useState(0);
  const [aiDifficulty, setAiDifficulty] = useState("medium");

  const getInitialGameState = (n, extraManual = 0) => {
    const totalPlayers = 1 + extraManual + n;
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
    const remainingTicketDeck = initialTicketDeck.slice(
      2 + (extraManual + n) * 2,
    );

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

    const extraManualHands = [];
    const extraManualTicketsArr = [];
    let deckOffset = 2;
    for (let i = 0; i < extraManual; i++) {
      const train = initialDeck.slice(deckOffset, deckOffset + 2);
      deckOffset += 2;
      const hand = { ...emptyHand };
      train.forEach((c) => {
        const key = c.rainbow ? "rainbow" : c.color;
        hand[key]++;
      });
      extraManualHands.push(hand);
      extraManualTicketsArr.push(
        initialTicketDeck.slice(2 + i * 2, 2 + i * 2 + 2),
      );
    }

    const aiHands = [];
    const aiTicketsArr = [];
    for (let i = 0; i < n; i++) {
      const aiTrain = initialDeck.slice(deckOffset, deckOffset + 2);
      deckOffset += 2;
      const hand = { ...emptyHand };
      aiTrain.forEach((c) => {
        const key = c.rainbow ? "rainbow" : c.color;
        hand[key]++;
      });
      aiHands.push(hand);
      aiTicketsArr.push(
        initialTicketDeck.slice(
          2 + (extraManual + i) * 2,
          2 + (extraManual + i) * 2 + 2,
        ),
      );
    }

    const remainingTrainDeck = initialDeck.slice(deckOffset);

    return {
      display: initialDisplay,
      trainDeck: remainingTrainDeck,
      discard: initialDiscard,
      playerHand: initialPlayerHand,
      extraManualHands,
      extraManualTickets: extraManualTicketsArr,
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
  const [extraManualHands, setExtraManualHands] = useState([]);
  const [extraManualScores, setExtraManualScores] = useState([]);
  const [extraManualPlacedTiles, setExtraManualPlacedTiles] = useState([]);
  const [extraManualTickets, setExtraManualTickets] = useState([]);
  const [extraManualDrawingTickets, setExtraManualDrawingTickets] =
    useState(null);
  const [currentExtraManualIndex, setCurrentExtraManualIndex] = useState(-1);
  const [
    initialExtraManualSelectingIndex,
    setInitialExtraManualSelectingIndex,
  ] = useState(-1);
  const initialExtraManualTicketsRef = useRef([]);
  const extraManualTicketsRef = useRef([]);
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
  const claimedRoutesRef = useRef({});
  const playerTicketsRef = useRef([]);
  const aiTicketsRef = useRef([]);

  const isAiTurn = currentAiIndex >= 0;
  const isExtraManualTurn = currentAiIndex < 0 && currentExtraManualIndex >= 0;
  const isPlayer1Turn = currentAiIndex < 0 && currentExtraManualIndex < 0;
  const isPersonTurn = isPlayer1Turn;

  const askAiToSelectTickets = async (
    drawnTickets,
    hand,
    difficulty = "medium",
  ) => {
    const difficultyInstruction =
      difficulty === "easy"
        ? "Pick tickets randomly — just keep index 0 always."
        : difficulty === "hard"
          ? "You are a highly strategic player. Keep both tickets if they share cities or overlap in route paths, maximising total points. Only discard a ticket if it is completely incompatible with your hand and the other ticket."
          : "Choose which tickets to keep based on which are easier to complete given your hand and which score more points.";
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
              content: `You are choosing starting tickets. You have been dealt these 2 tickets: ${JSON.stringify(drawnTickets)}. Your starting hand is: ${JSON.stringify(hand)}. You MUST keep at least 1 ticket. ${difficultyInstruction} Respond with: { "keepIndices": [0] } or { "keepIndices": [0, 1] }`,
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

  const startGame = async (n, extraManual = 0, difficulty = "medium") => {
    setAiDifficulty(difficulty);
    const state = getInitialGameState(n, extraManual);
    setNumAIs(n);
    setNumExtraManual(extraManual);
    setInitialState(state);
    setPlayerHand(state.playerHand);
    setExtraManualHands(state.extraManualHands);
    setExtraManualScores(Array(extraManual).fill(0));
    setExtraManualPlacedTiles(Array(extraManual).fill(0));
    extraManualTicketsRef.current = Array(extraManual).fill([]);
    setExtraManualTickets(Array(extraManual).fill([]));
    initialExtraManualTicketsRef.current = state.extraManualTickets;
    setAiHands(state.aiHands);
    setAiScores(Array(n).fill(0));
    setAiPlacedTiles(Array(n).fill(0));
    setAiLastActions(Array(n).fill(null));
    setDiscardPile(state.discard);
    setDisplayCards(state.display);
    setTrainDeck(state.trainDeck);
    setTicketDeck(state.ticketDeck);
    setDrawingTickets(null);
    setAiSelectingTickets(true);
    setGameStarted(true);

    const chosenTickets = [];
    for (let i = 0; i < n; i++) {
      const drawn = state.aiTickets[i];
      const kept = await askAiToSelectTickets(
        drawn,
        state.aiHands[i],
        difficulty,
      );
      chosenTickets.push(kept.map((idx) => drawn[idx]));
    }
    aiTicketsRef.current = chosenTickets;
    setAiTickets(chosenTickets);
    setAiSelectingTickets(false);

    setDrawingTickets(state.drawingTickets);
    // Reset initial extra manual state
    setInitialExtraManualSelectingIndex(-1);
    setCurrentExtraManualIndex(-1);
  };

  const drawFromDisplay = (index) => {
    if (
      gameOver ||
      isAiTurn ||
      cardsDrawn >= 2 ||
      drawingTickets ||
      extraManualDrawingTickets
    )
      return;
    const card = displayCards[index];
    if (!card) return;
    if (card.rainbow && cardsDrawn >= 1) return;

    if (!isExtraManualTurn) {
      logPlayerAction({
        action: "draw_display",
        color: card.rainbow ? "rainbow" : card.color,
        index,
      });
    }

    const colorKey = card.rainbow ? "rainbow" : card.color;
    if (isExtraManualTurn) {
      const idx = currentExtraManualIndex;
      setExtraManualHands((prev) =>
        prev.map((h, i) =>
          i === idx ? { ...h, [colorKey]: (h[colorKey] ?? 0) + 1 } : h,
        ),
      );
    } else {
      setPlayerHand((prev) => ({
        ...prev,
        [colorKey]: (prev[colorKey] ?? 0) + 1,
      }));
    }

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
    if (
      gameOver ||
      isAiTurn ||
      cardsDrawn >= 2 ||
      drawingTickets ||
      extraManualDrawingTickets
    )
      return;
    let currentDeck = [...trainDeck],
      currentDiscard = [...discardPile];
    if (currentDeck.length === 0 && currentDiscard.length > 0) {
      currentDeck = shuffle(currentDiscard);
      currentDiscard = [];
    }
    if (currentDeck.length === 0) return;
    const card = currentDeck[0];
    if (!isExtraManualTurn) {
      logPlayerAction({
        action: "draw_deck",
        color: card.rainbow ? "rainbow" : card.color,
      });
    }
    const colorKey = card.rainbow ? "rainbow" : card.color;
    if (isExtraManualTurn) {
      const idx = currentExtraManualIndex;
      setExtraManualHands((prev) =>
        prev.map((h, i) =>
          i === idx ? { ...h, [colorKey]: (h[colorKey] ?? 0) + 1 } : h,
        ),
      );
    } else {
      setPlayerHand((prev) => ({
        ...prev,
        [colorKey]: (prev[colorKey] ?? 0) + 1,
      }));
    }
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
    if (isExtraManualTurn) {
      const idx = currentExtraManualIndex;
      setExtraManualHands((prev) => {
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

    // Turn order: Player 1 → Extra Manual players → AI players → repeat
    if (isPlayer1Turn) {
      if (numExtraManual > 0) {
        setCurrentExtraManualIndex(0);
      } else if (numAIs > 0) {
        setCurrentAiIndex(0);
      } else {
        setTurn((prev) => prev + 1);
        setPlayerTurnActions([]);
      }
    } else if (isExtraManualTurn) {
      if (currentExtraManualIndex < numExtraManual - 1) {
        setCurrentExtraManualIndex((prev) => prev + 1);
      } else {
        setCurrentExtraManualIndex(-1);
        if (numAIs > 0) {
          setCurrentAiIndex(0);
        } else {
          setTurn((prev) => prev + 1);
          setPlayerTurnActions([]);
        }
      }
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
    } else if (isExtraManualTurn) {
      const idx = currentExtraManualIndex;
      setExtraManualScores((prev) =>
        prev.map((s, i) => (i === idx ? s + points : s)),
      );
    } else {
      setScore((prev) => prev + points);
    }
  };

  const incrementPlaced = (n) => {
    const tilesToAdd = Number(n) || 0;
    const totalNonPlayer1 = numExtraManual + numAIs;
    if (isAiTurn) {
      const idx = currentAiIndex;
      setAiPlacedTiles((prev) => {
        const next = prev.map((p, i) => (i === idx ? p + tilesToAdd : p));
        const nextPlaced = next[idx];
        if (nextPlaced >= 15 && !lastRoundTriggered) {
          setLastRoundTriggered(true);
          setFinalTurnsLeft(numAIs - idx - 1);
        }
        return next;
      });
    } else if (isExtraManualTurn) {
      const idx = currentExtraManualIndex;
      setExtraManualPlacedTiles((prev) => {
        const next = prev.map((p, i) => (i === idx ? p + tilesToAdd : p));
        const nextPlaced = next[idx];
        if (nextPlaced >= 15 && !lastRoundTriggered) {
          setLastRoundTriggered(true);
          setFinalTurnsLeft(numExtraManual - idx - 1 + numAIs);
        }
        return next;
      });
    } else {
      setPlacedTiles((prev) => {
        const nextPlaced = prev + tilesToAdd;
        if (nextPlaced >= 15 && !lastRoundTriggered) {
          setLastRoundTriggered(true);
          setFinalTurnsLeft(totalNonPlayer1);
        }
        return nextPlaced;
      });
    }
  };

  const drawTickets = () => {
    if (
      gameOver ||
      isAiTurn ||
      cardsDrawn > 0 ||
      drawingTickets ||
      extraManualDrawingTickets
    )
      return;
    if (ticketDeck.length === 0) return;
    const drawn = ticketDeck.slice(0, 2);
    setTicketDeck((prev) => prev.slice(2));
    if (isExtraManualTurn) {
      setExtraManualDrawingTickets(drawn);
    } else {
      setDrawingTickets(drawn);
    }
  };

  const selectTickets = (selectedIndices) => {
    if (selectedIndices.length < 1) return;
    if (isExtraManualTurn) {
      const selected = selectedIndices.map(
        (idx) => extraManualDrawingTickets[idx],
      );
      const emIdx = currentExtraManualIndex;
      const nextET = extraManualTicketsRef.current.map((t, i) =>
        i === emIdx ? [...t, ...selected] : t,
      );
      extraManualTicketsRef.current = nextET;
      setExtraManualTickets(nextET);
      setExtraManualDrawingTickets(null);
      if (!gameOver) incrementTurn();
      return;
    }
    const selected = selectedIndices.map((idx) => drawingTickets[idx]);
    logPlayerAction({ action: "select_tickets", tickets: selected });
    const nextPT = [...playerTicketsRef.current, ...selected];
    playerTicketsRef.current = nextPT;
    setPlayerTickets(nextPT);
    setDrawingTickets(null);
    if (
      numExtraManual > 0 &&
      initialExtraManualSelectingIndex === -1 &&
      extraManualTicketsRef.current.every((t) => t.length === 0)
    ) {
      setInitialExtraManualSelectingIndex(0);
      setCurrentExtraManualIndex(0);
      setExtraManualDrawingTickets(initialExtraManualTicketsRef.current[0]);
      return;
    }
    if (!gameOver) incrementTurn();
  };

  const canPlaceMore = (needed) => {
    const n = Number(needed) || 0;
    const currentPlaced = isAiTurn
      ? aiPlacedTiles[currentAiIndex] || 0
      : isExtraManualTurn
        ? extraManualPlacedTiles[currentExtraManualIndex] || 0
        : placedTiles;
    return currentPlaced + n <= 17;
  };

  const claimRoute = (routeId, side, type) => {
    if (type === "player" || type.startsWith("player")) {
      logPlayerAction({ action: "claim_route", routeId, side });
    }
    const next = { ...claimedRoutesRef.current, [`${routeId}_${side}`]: type };
    claimedRoutesRef.current = next;
    setClaimedRoutes(next);
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

  const isTicketBlocked = (ticket, playerKey) => {
    // Build graph of routes that are unclaimed OR owned by this player
    const adj = new Map();
    const addEdge = (u, v) => {
      if (!adj.has(u)) adj.set(u, new Set());
      adj.get(u).add(v);
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
          const claimer = claimedRoutes[key];
          if (!claimer || claimer === playerKey) {
            addEdge(a, b);
            addEdge(b, a);
          }
        }
      } else {
        const key = `${route.id}_single`;
        const claimer = claimedRoutes[key];
        if (!claimer || claimer === playerKey) {
          addEdge(a, b);
          addEdge(b, a);
        }
      }
    }
    // BFS to check reachability
    const visited = new Set([ticket.cityA]);
    const q = [ticket.cityA];
    while (q.length) {
      const u = q.shift();
      if (u === ticket.cityB) return false; // still reachable → not blocked
      for (const v of adj.get(u) || []) {
        if (!visited.has(v)) {
          visited.add(v);
          q.push(v);
        }
      }
    }
    return true; // cityB unreachable → blocked
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
    finalExtraManualTickets,
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

    const allExtraManualNums = [];
    const allExtraManualResults = [];
    for (let i = 0; i < (numExtraManual || 0); i++) {
      const emEdges = getEdges(`player${i + 2}`);
      const emNums = [];
      for (const [num, names] of groups.entries()) {
        if (names.length < 2) continue;
        if (isSetFullyConnected(emEdges, names)) emNums.push(num);
      }
      allExtraManualNums.push(emNums);
      if (emNums.length)
        setExtraManualScores((prev) =>
          prev.map((s, idx) => (idx === i ? s + add(emNums) : s)),
        );

      const emResults = (finalExtraManualTickets[i] || []).map((t) => {
        const completed = isConnectedViaEdges(emEdges, t.cityA, t.cityB);
        return { ...t, completed };
      });
      allExtraManualResults.push(emResults);
      const emTicketDelta = emResults.reduce(
        (sum, t) => sum + (t.completed ? t.points : -t.points),
        0,
      );
      if (emTicketDelta)
        setExtraManualScores((prev) =>
          prev.map((s, idx) => (idx === i ? s + emTicketDelta : s)),
        );
    }

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
      applyNumberBonuses(
        claimedRoutesRef.current,
        playerTicketsRef.current,
        aiTicketsRef.current,
        extraManualTicketsRef.current,
      );
      setFinalBonusesApplied(true);
    }
  }, [gameOver, finalBonusesApplied]);

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
            const claimer = currentClaimedRoutes[key];
            if (!claimer) {
              usefulRoutes.push({
                routeId,
                side,
                color,
                trainCount,
                alreadyOwned: false,
              });
            } else if (claimer === aiIdentifier) {
              usefulRoutes.push({
                routeId,
                side,
                color,
                trainCount,
                alreadyOwned: true,
              });
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
      const affordableRoutes = usefulRoutes.filter(
        ({ color, trainCount, alreadyOwned }) => {
          if (alreadyOwned) return true;
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
        },
      );
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

    const difficultyPrompt =
      aiDifficulty === "easy"
        ? `You are playing randomly and poorly. Ignore strategy completely.
${
  gameState.cardsDrawn === 1
    ? `cardsDrawn=1: just draw_deck.`
    : `cardsDrawn=0: always draw_deck unless you happen to have enough cards to place_tiles on any affordable route, in which case place_tiles on the first one you find.`
}`
        : aiDifficulty === "hard"
          ? `You are a highly strategic expert player. Your goals in order:
${
  gameState.cardsDrawn === 1
    ? `cardsDrawn=1: draw ONE more card. Pick the display card where isNeeded=true AND canDrawNow=true AND isRainbow=false with the highest trainCount (hardest to collect = most valuable). If none, draw_deck.`
    : `cardsDrawn=0 — follow this priority:
1. BLOCK opponents: if playerTurnActions shows the player just claimed a route, check if any of your incomplete tickets share cities with the player's claimed routes. If a key connecting route for your ticket is still unclaimed and affordable, claim it immediately to secure it before the player does.
2. affordableRoutes has any entry with alreadyOwned=false for any incomplete ticket? → place_tiles on the route that completes the highest-points ticket first. Among ties, prefer routes with higher trainCount (more points). Use routeId, side, color from affordableRoutes.
3. usefulRoutes non-empty but none affordable? → draw the display card where isNeeded=true AND canDrawNow=true, preferring rainbow first (cardsDrawn=0), then the color needed by the highest-points incomplete ticket. If no such display card, draw_deck.
4. All incomplete tickets have empty usefulRoutes AND ticketDeckCount>0? → draw_tickets to get more objectives.
5. Otherwise → draw_deck.`
}`
          : `cardsDrawn=${gameState.cardsDrawn}. displayCardOptions=${JSON.stringify(gameState.displayCardOptions)} (index=position, isNeeded=helps your tickets, canDrawNow=allowed by rules).

Follow EXACTLY:
${
  gameState.cardsDrawn === 1
    ? `cardsDrawn=1: draw ONE more card. Priority: pick the display card with the highest index where isNeeded=true AND canDrawNow=true AND isRainbow=false. If none, draw_deck.`
    : `cardsDrawn=0 priority order (stop at first that applies):
1. affordableRoutes has any entry with alreadyOwned=false for any incomplete ticket? → place_tiles on that unowned route (highest points ticket first, prefer routes with alreadyOwned=false). Use routeId, side, color from that affordableRoutes entry. NOTE: routes with alreadyOwned=true are already claimed by you and count toward multiple tickets for free — never place_tiles on them.
2. usefulRoutes non-empty but none affordable? → draw the display card where isNeeded=true AND canDrawNow=true (prefer rainbow if available and cardsDrawn=0, else pick the needed color with lowest trainCount requirement). If no such display card, draw_deck.
3. All incomplete tickets have empty usefulRoutes AND ticketDeckCount>0? → draw_tickets.
4. Otherwise → draw_deck.`
}`;

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

${difficultyPrompt}

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
    aiDifficulty,
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
              content: `You are choosing new tickets mid-game. Your current tickets: ${JSON.stringify(currentTickets)}. You drew these 2 new tickets: ${JSON.stringify(drawn)}. Your hand: ${JSON.stringify(currentHand)}. You MUST keep at least 1 of the new tickets. ${aiDifficulty === "easy" ? "Just keep index 0 always." : aiDifficulty === "hard" ? "You are highly strategic: keep both tickets if they share cities or overlap routes with your existing tickets, maximising total points. Only discard if completely incompatible." : "Choose which new tickets to keep based on synergy with existing tickets, your hand, and point value."} Respond with: { "keepIndices": [0] } or { "keepIndices": [0, 1] }`,
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
    const nextAT = aiTicketsRef.current.map((t, i) =>
      i === aidx3 ? [...t, ...keptTickets] : t,
    );
    aiTicketsRef.current = nextAT;
    setAiTickets(nextAT);
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

  const selectInitialExtraManualTickets = (selectedIndices) => {
    if (selectedIndices.length < 1) return;
    const idx = initialExtraManualSelectingIndex;
    const drawn = initialExtraManualTicketsRef.current[idx];
    const selected = selectedIndices.map((i) => drawn[i]);
    const nextET = extraManualTicketsRef.current.map((t, i) =>
      i === idx ? [...t, ...selected] : t,
    );
    extraManualTicketsRef.current = nextET;
    setExtraManualTickets(nextET);
    setExtraManualDrawingTickets(null);
    const nextIdx = idx + 1;
    if (nextIdx < numExtraManual) {
      setInitialExtraManualSelectingIndex(nextIdx);
      setCurrentExtraManualIndex(nextIdx);
      setExtraManualDrawingTickets(
        initialExtraManualTicketsRef.current[nextIdx],
      );
    } else {
      setInitialExtraManualSelectingIndex(-1);
      setCurrentExtraManualIndex(-1);
      if (!gameOver) incrementTurn();
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
          extraManualScores={extraManualScores}
          playerNumberBonuses={playerNumberBonuses}
          aiNumberBonuses={aiNumberBonuses}
          playerTicketResults={playerTicketResults}
          aiTicketResults={aiTicketResults}
          extraManualTickets={extraManualTickets}
        />
      )}

      <GameHeader
        score={score}
        turn={turn}
        isAiTurn={isAiTurn}
        isPersonTurn={isPersonTurn}
        currentAiIndex={currentAiIndex}
        isExtraManualTurn={isExtraManualTurn}
        currentExtraManualIndex={currentExtraManualIndex}
        lastRoundTriggered={lastRoundTriggered}
        gameOver={gameOver}
      />

      <div className="flex flex-row flex-wrap gap-4">
        {extraManualHands.map((hand, i) => (
          <div key={i}>
            <div className="flex gap-4 mb-4">
              <div
                className={`text-white p-3 rounded-xl shadow-lg flex gap-6 ${
                  isExtraManualTurn &&
                  currentExtraManualIndex === i &&
                  !gameOver
                    ? "bg-blue-700"
                    : "bg-zinc-500"
                }`}
              >
                <div className="flex flex-col items-center">
                  <span className="text-[9px] uppercase font-bold text-zinc-400">
                    P{i + 2} Points
                  </span>
                  <span className="text-lg font-black">
                    {extraManualScores[i] ?? 0}
                  </span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-[9px] uppercase font-bold text-zinc-400">
                    P{i + 2} Pieces
                  </span>
                  <span className="text-lg font-black">
                    {17 - (extraManualPlacedTiles[i] || 0)}
                  </span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-[9px] uppercase font-bold text-zinc-400">
                    P{i + 2} Cards
                  </span>
                  <span className="text-lg font-black">
                    {Object.values(hand).reduce((a, b) => a + b, 0)}
                  </span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-[9px] uppercase font-bold text-zinc-400">
                    P{i + 2} Tickets
                  </span>
                  <span className="text-lg font-black">
                    {(extraManualTickets[i] || []).length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
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
        playerHand={
          isExtraManualTurn
            ? extraManualHands[currentExtraManualIndex]
            : playerHand
        }
        playerTickets={(() => {
          const tickets = isExtraManualTurn
            ? extraManualTickets[currentExtraManualIndex] || []
            : playerTickets;
          const key = isExtraManualTurn
            ? `player${currentExtraManualIndex + 2}`
            : "player";
          const edges = getClaimedEdges(key);
          return tickets.map((t) => ({
            ...t,
            blocked: isTicketBlocked(t, key),
            completed: isConnectedViaEdges(edges, t.cityA, t.cityB),
          }));
        })()}
        placedTiles={
          isExtraManualTurn
            ? extraManualPlacedTiles[currentExtraManualIndex] || 0
            : placedTiles
        }
        drawingTickets={
          isExtraManualTurn ? extraManualDrawingTickets : drawingTickets
        }
        playerLabel={
          isExtraManualTurn
            ? `Player ${currentExtraManualIndex + 2}`
            : "Player 1"
        }
        selectTickets={
          initialExtraManualSelectingIndex >= 0
            ? selectInitialExtraManualTickets
            : selectTickets
        }
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
        playerClaimerKey={
          isExtraManualTurn ? `player${currentExtraManualIndex + 2}` : "player"
        }
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
