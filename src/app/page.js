"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { RoomProvider } from "../liveblocks.config";
import { LobbyScreen } from "./Components/LobbyScreen";
import { shuffle } from "./utils/shuffle";
import { ROUTES } from "./data/gameData";
import {
  EMPTY_HAND,
  checkThreeRainbows,
  refillDisplay,
  getRouteConnects,
  isConnectedViaEdges,
  getClaimedEdges,
  groupCitiesByNumber,
  getInitialGameState,
  fetchAiTicketChoice,
  isTicketBlocked,
  isSetFullyConnected,
} from "./utils/gameUtils";
import { RulesPanel } from "./Components/RulesPanel";
import { StartScreen } from "./Components/StartScreen";
import { GameOverModal } from "./Components/GameOverModal";
import { GameHeader } from "./Components/GameHeader";
import { OpponentPanel } from "./Components/OpponentPanel";
import { PlayerBoard } from "./Components/PlayerBoard";
import { TicketSelection } from "./Components/TicketSelection";
import { OnlineGame } from "./Components/OnlineGame";
import { MoveLog } from "./Components/MoveLog";

export default function Home() {
  const [roomId, setRoomId] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [playerName, setPlayerName] = useState("Player");
  const [localMode, setLocalMode] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("ttr_session");
      if (saved) {
        const { roomId: r, playerName: n, isHost: h } = JSON.parse(saved);
        if (r && n) {
          setRoomId(r);
          setPlayerName(n);
          setIsHost(!!h);
        }
      }
    } catch (_) {}
  }, []);

  const [numAIs, setNumAIs] = useState(null);
  const [numExtraManual, setNumExtraManual] = useState(0);
  const [aiDifficulty, setAiDifficulty] = useState("medium");

  const [rulesShown, setRulesShown] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [aiSelectingTickets, setAiSelectingTickets] = useState(false);

  const [playerHand, setPlayerHand] = useState({ ...EMPTY_HAND });
  const [aiHands, setAiHands] = useState([]);
  const [extraManualHands, setExtraManualHands] = useState([]);
  const [extraManualScores, setExtraManualScores] = useState([]);
  const [extraManualLastActions, setExtraManualLastActions] = useState([]);
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
  const [moveLog, setMoveLog] = useState([]);
  const isAiThinkingRef = useRef(false);
  const lastProcessedAiAction = useRef("");
  const claimedRoutesRef = useRef({});
  const playerTicketsRef = useRef([]);
  const aiTicketsRef = useRef([]);

  const isAiTurn = currentAiIndex >= 0;
  const isExtraManualTurn = currentAiIndex < 0 && currentExtraManualIndex >= 0;
  const isPlayer1Turn = currentAiIndex < 0 && currentExtraManualIndex < 0;

  const startGame = async (n, extraManual = 0, difficulty = "medium") => {
    setAiDifficulty(difficulty);
    const state = getInitialGameState(n, extraManual);
    setNumAIs(n);
    setNumExtraManual(extraManual);
    setPlayerHand(state.playerHand);
    setExtraManualHands(state.extraManualHands);
    setExtraManualScores(Array(extraManual).fill(0));
    setExtraManualLastActions(Array(extraManual).fill(null));
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
      const kept = await fetchAiTicketChoice(
        drawn,
        state.aiHands[i],
        [],
        difficulty,
      );
      chosenTickets.push(kept.map((idx) => drawn[idx]));
    }
    aiTicketsRef.current = chosenTickets;
    setAiTickets(chosenTickets);
    setAiSelectingTickets(false);

    setDrawingTickets(state.drawingTickets);
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
      addMoveLogEntry(
        "Player 1",
        `drew a ${card.rainbow ? "rainbow" : card.color} card from the display`,
      );
    } else {
      addMoveLogEntry(
        `Player ${currentExtraManualIndex + 2}`,
        `drew a ${card.rainbow ? "rainbow" : card.color} card from the display`,
      );
    }

    const colorKey = card.rainbow ? "rainbow" : card.color;
    if (isExtraManualTurn) {
      const emIdx = currentExtraManualIndex;
      setExtraManualHands((prev) =>
        prev.map((h, i) =>
          i === emIdx ? { ...h, [colorKey]: (h[colorKey] ?? 0) + 1 } : h,
        ),
      );
      setExtraManualLastActions((prev) =>
        prev.map((a, i) => (i === emIdx ? "Drew from the display" : a)),
      );
    } else {
      setPlayerHand((prev) => ({
        ...prev,
        [colorKey]: (prev[colorKey] ?? 0) + 1,
      }));
    }

    const result = refillDisplay(displayCards, trainDeck, discardPile, index);
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
      addMoveLogEntry("Player 1", "drew a card from the deck");
    } else {
      addMoveLogEntry(
        `Player ${currentExtraManualIndex + 2}`,
        "drew a card from the deck",
      );
    }
    const colorKey = card.rainbow ? "rainbow" : card.color;
    if (isExtraManualTurn) {
      const idx = currentExtraManualIndex;
      setExtraManualHands((prev) =>
        prev.map((h, i) =>
          i === idx ? { ...h, [colorKey]: (h[colorKey] ?? 0) + 1 } : h,
        ),
      );
      setExtraManualLastActions((prev) =>
        prev.map((a, i) => (i === idx ? "Drew from the deck" : a)),
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
      const emIdx = currentExtraManualIndex;
      setExtraManualHands((prev) => {
        const next = prev.map((h, i) => {
          if (i !== emIdx) return h;
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
      setExtraManualLastActions((prev) =>
        prev.map((a, i) =>
          i === emIdx ? `Drew tickets, kept ${selected.length}` : a,
        ),
      );
      addMoveLogEntry(
        `Player ${emIdx + 2}`,
        `kept ${selected.length} ticket${selected.length !== 1 ? "s" : ""}`,
      );
      if (!gameOver) incrementTurn();
      return;
    }
    const selected = selectedIndices.map((idx) => drawingTickets[idx]);
    logPlayerAction({ action: "select_tickets", tickets: selected });
    addMoveLogEntry(
      "Player 1",
      `kept ${selected.length} ticket${selected.length !== 1 ? "s" : ""}`,
    );
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
    if (drawingTickets || extraManualDrawingTickets || aiSelectingTickets)
      return;
    const claimRouteData = ROUTES.find((r) => r.id === routeId);
    const claimLen = claimRouteData ? claimRouteData.trainCount : 0;
    if (type === "player" || type.startsWith("player")) {
      logPlayerAction({ action: "claim_route", routeId, side });
      const claimLabel =
        type === "player"
          ? "Player 1"
          : `Player ${parseInt(type.replace("player", ""), 10) + 1}`;
      addMoveLogEntry(
        claimLabel,
        `claimed a route (${claimLen} train${claimLen !== 1 ? "s" : ""})`,
      );
    } else if (type.startsWith("ai")) {
      const aiIdx = parseInt(type.replace("ai", ""), 10);
      addMoveLogEntry(
        `AI ${aiIdx + 1}`,
        `claimed a route (${claimLen} train${claimLen !== 1 ? "s" : ""})`,
      );
    }
    if (isExtraManualTurn) {
      const emIdx = currentExtraManualIndex;
      setExtraManualLastActions((prev) =>
        prev.map((a, i) =>
          i === emIdx
            ? `Claimed route (${claimLen} train${claimLen !== 1 ? "s" : ""})`
            : a,
        ),
      );
    }
    const next = { ...claimedRoutesRef.current, [`${routeId}_${side}`]: type };
    claimedRoutesRef.current = next;
    setClaimedRoutes(next);
  };

  const applyNumberBonuses = (
    finalClaimedRoutes,
    finalPlayerTickets,
    finalAiTickets,
    finalExtraManualTickets,
  ) => {
    const groups = groupCitiesByNumber();
    const getEdges = (claimer) => getClaimedEdges(finalClaimedRoutes, claimer);
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

  const addMoveLogEntry = (player, text) => {
    setMoveLog((prev) => [...prev, { player, text }]);
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
      const connects = getRouteConnects(route);
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
      const myEdges = getClaimedEdges(claimedRoutes, aiIdentifier);
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

    const allUnclaimedRoutes = ROUTES.filter(
      (r) =>
        !claimedRoutes[`${r.id}_single`] &&
        !claimedRoutes[`${r.id}_even`] &&
        !claimedRoutes[`${r.id}_odd`],
    ).map((r) => ({
      id: r.id,
      color: r.color,
      trainCount: r.trainCount,
      connects: getRouteConnects(r),
      isDouble: !!r.isDouble,
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
      allUnclaimedRoutes,
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
    ? `cardsDrawn=1: draw ONE more card. Pick the display card where isNeeded=true AND canDrawNow=true AND isRainbow=false. If none, draw_deck.`
    : `cardsDrawn=0 — follow this priority:
1. BLOCK opponents strategically: 
   - Check playerTurnActions. If a player recently claimed a route, identify if they are building towards a certain area.
   - Look at ALL unclaimed routes. If a route is critical (e.g., a short bottleneck like 'gray' routes or routes connecting major cities), and you have the cards, CLAIM it even if it's not on your direct ticket path, ESPECIALLY if the player needs it.
   - If player has high score or many cards, prioritize blocking their potential long paths.
2. Complete your tickets: if affordableRoutes has any entry for an incomplete ticket, claim it. Prefer longer routes (more points) or bottleneck routes.
3. Draw cards efficiently: if usefulRoutes exists, draw needed colors from display. If a rainbow is available and cardsDrawn=0, ALWAYS take it if you need flexibility.
4. If no clear path, draw_tickets to find new opportunities, but only if you have at least 10 trains left.
5. Otherwise → draw_deck.`
}`
          : `You are a balanced player.
${
  gameState.cardsDrawn === 1
    ? `cardsDrawn=1: draw ONE more card. Pick the display card where isNeeded=true AND canDrawNow=true AND isRainbow=false. If none, draw_deck.`
    : `cardsDrawn=0 priority:
1. If you can complete a ticket with an affordable route, do it.
2. If you need specific colors for your tickets, draw them from the display.
3. If no needed colors in display, draw_deck.
4. If all tickets done, draw_tickets.`
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
    setAiHands((prev) =>
      prev.map((h, i) =>
        i === currentAiIndex ? { ...h, [colorKey]: (h[colorKey] ?? 0) + 1 } : h,
      ),
    );

    const result = refillDisplay(displayCards, trainDeck, discardPile, index);
    setDisplayCards(result.display);
    setTrainDeck(result.deck);
    setDiscardPile(result.discard);

    setAiLastActions((prev) =>
      prev.map((a, i) => (i === currentAiIndex ? "Drew from the display" : a)),
    );
    addMoveLogEntry(`AI ${currentAiIndex + 1}`, `drew a card from the display`);
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
    setAiHands((prev) =>
      prev.map((h, i) =>
        i === currentAiIndex ? { ...h, [colorKey]: (h[colorKey] ?? 0) + 1 } : h,
      ),
    );
    setTrainDeck(currentDeck.slice(1));
    setDiscardPile(currentDiscard);
    setAiLastActions((prev) =>
      prev.map((a, i) => (i === currentAiIndex ? "Drew from the deck" : a)),
    );
    addMoveLogEntry(`AI ${currentAiIndex + 1}`, "drew a card from the deck");
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

    const currentTickets = aiTickets[currentAiIndex] || [];
    const currentHand = aiHands[currentAiIndex] || {};

    const keepIndices = await fetchAiTicketChoice(
      drawn,
      currentHand,
      currentTickets,
      aiDifficulty,
    );

    const keptTickets = keepIndices.map((i) => drawn[i]);
    const nextAT = aiTicketsRef.current.map((t, i) =>
      i === currentAiIndex ? [...t, ...keptTickets] : t,
    );
    aiTicketsRef.current = nextAT;
    setAiTickets(nextAT);
    setAiLastActions((prev) =>
      prev.map((a, i) =>
        i === currentAiIndex ? `Drew tickets, kept ${keptTickets.length}` : a,
      ),
    );
    addMoveLogEntry(
      `AI ${currentAiIndex + 1}`,
      `kept ${keptTickets.length} ticket${keptTickets.length !== 1 ? "s" : ""}`,
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

  if (!roomId && !localMode) {
    return (
      <LobbyScreen
        onJoin={(code, name, host) => {
          setRoomId(code);
          setPlayerName(name);
          setIsHost(host);
        }}
        onPlayLocal={() => setLocalMode(true)}
      />
    );
  }

  if (!localMode) {
    return (
      <RoomProvider
        id={roomId}
        initialPresence={{ name: playerName, isHost: isHost }}
        initialStorage={{ gameState: null, playerSlots: null }}
      >
        <OnlineGame roomId={roomId} playerName={playerName} isHost={isHost} />
      </RoomProvider>
    );
  }

  if (!rulesShown) {
    return <RulesPanel onFinish={() => setRulesShown(true)} />;
  }

  if (!gameStarted) {
    return <StartScreen onStart={startGame} />;
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-zinc-100 dark:bg-zinc-900 font-sans p-8">
      {aiSelectingTickets && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-white dark:bg-zinc-800 rounded-3xl p-10 shadow-2xl flex flex-col items-center gap-4">
            <div className="text-2xl font-black text-zinc-800 dark:text-zinc-100 ">
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

      {roomId && (
        <div className="fixed top-4 right-4 z-50 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl px-4 py-2 shadow-lg flex flex-col items-center">
          <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-widest">
            Room Code
          </span>
          <span className="text-xl font-black text-zinc-800 dark:text-zinc-100 tracking-widest">
            {roomId}
          </span>
        </div>
      )}

      <GameHeader
        score={score}
        turn={turn}
        isAiTurn={isAiTurn}
        isPersonTurn={isPlayer1Turn}
        currentAiIndex={currentAiIndex}
        isExtraManualTurn={isExtraManualTurn}
        currentExtraManualIndex={currentExtraManualIndex}
        lastRoundTriggered={lastRoundTriggered}
        gameOver={gameOver}
      />

      <div className="flex flex-row flex-wrap gap-4">
        {!isPlayer1Turn && (
          <OpponentPanel
            label="Player 1"
            score={score}
            placedTiles={placedTiles}
            hand={playerHand}
            tickets={playerTickets}
            lastAction={
              playerTurnActions.length > 0
                ? (() => {
                    const last =
                      playerTurnActions[playerTurnActions.length - 1];
                    if (last.action === "draw_display")
                      return "Drew from the display";
                    if (last.action === "draw_deck")
                      return "Drew from the deck";
                    if (last.action === "select_tickets")
                      return `Drew tickets, kept ${last.tickets?.length ?? 1}`;
                    if (last.action === "claim_route") return "Claimed a route";
                    return "None yet";
                  })()
                : "None yet"
            }
            isActiveTurn={false}
            isThinking={false}
            gameOver={gameOver}
          />
        )}
        {extraManualHands.map((hand, i) =>
          isExtraManualTurn && currentExtraManualIndex === i ? null : (
            <OpponentPanel
              key={i}
              label={`Player ${i + 2}`}
              score={extraManualScores[i] ?? 0}
              placedTiles={extraManualPlacedTiles[i]}
              hand={hand}
              tickets={extraManualTickets[i]}
              lastAction={extraManualLastActions[i] ?? "None yet"}
              isActiveTurn={false}
              isThinking={false}
              gameOver={gameOver}
            />
          ),
        )}
        {aiHands.map((hand, i) => (
          <OpponentPanel
            key={i}
            label={`AI ${i + 1}`}
            score={aiScores[i]}
            placedTiles={aiPlacedTiles[i]}
            hand={hand}
            tickets={aiTickets[i]}
            lastAction={aiLastActions[i] ?? "None yet"}
            isActiveTurn={currentAiIndex === i}
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
          const edges = getClaimedEdges(claimedRoutes, key);
          return tickets.map((t) => ({
            ...t,
            blocked: isTicketBlocked(t, key, claimedRoutes),
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
        totalPlayers={1 + (numAIs || 0) + (numExtraManual || 0)}
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

      <MoveLog entries={moveLog} />
    </div>
  );
}
