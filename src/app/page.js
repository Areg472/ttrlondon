"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { RoomProvider } from "../liveblocks.config";
import { LobbyScreen } from "./Components/LobbyScreen";
import { ROUTES } from "./data/gameData";
import {
  getRouteConnects,
  isConnectedViaEdges,
  getClaimedEdges,
  getInitialState,
  fetchAiTicketChoice,
  isTicketBlocked,
  refillDisplay,
} from "./utils/gameUtils";
import { shuffle } from "./utils/shuffle";
import { RulesPanel } from "./Components/RulesPanel";
import { StartScreen } from "./Components/StartScreen";
import { GameOverModal } from "./Components/GameOverModal";
import { GameHeader } from "./Components/GameHeader";
import { OpponentPanel } from "./Components/OpponentPanel";
import { PlayerBoard } from "./Components/PlayerBoard";
import { OnlineGame } from "./Components/OnlineGame";
import { MoveLog } from "./Components/MoveLog";
import { useTTRGame, applyEndGameScoring } from "./hooks/useTTRGame";

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

  const [numAIs, setNumAIs] = useState(0);
  const [numExtraManual, setNumExtraManual] = useState(0);
  const [aiDifficulty, setAiDifficulty] = useState("medium");
  const [rulesShown, setRulesShown] = useState(false);
  const [gameState, setGameState] = useState(null);

  const updateGameState = useCallback((updater) => {
    setGameState((prev) => {
      if (!prev) return prev;
      return typeof updater === "function"
        ? updater(JSON.parse(JSON.stringify(prev)))
        : updater;
    });
  }, []);

  // Derive current player index (player 0 = human, rest = AI or extra manual)
  const currentPlayerIndex = gameState?.currentPlayerIndex ?? 0;
  const currentPlayer = gameState?.players?.[currentPlayerIndex];
  const isAiTurn = !!currentPlayer?.name?.startsWith("AI");
  const isExtraManualTurn =
    !isAiTurn &&
    currentPlayerIndex > 0 &&
    !currentPlayer?.name?.startsWith("AI");
  const isPlayer1Turn = currentPlayerIndex === 0;

  const {
    drawFromDisplay,
    drawFromDeck,
    drawTickets,
    selectTickets,
    claimRoute,
    incrementTurn,
  } = useTTRGame(
    gameState,
    updateGameState,
    currentPlayerIndex,
    currentPlayer?.name,
  );

  const [aiSelectingTickets, setAiSelectingTickets] = useState(false);
  const isAiThinkingRef = useRef(false);
  const lastProcessedAiAction = useRef("");

  const startGame = (n, extraManual = 0, difficulty = "medium") => {
    setAiDifficulty(difficulty);
    const playerNames = ["Player"];
    for (let i = 0; i < extraManual; i++) playerNames.push(`Player ${i + 2}`);
    for (let i = 0; i < n; i++) playerNames.push(`AI ${i + 1}`);
    setNumAIs(n);
    setNumExtraManual(extraManual);
    setGameState(getInitialState(1 + n + extraManual, playerNames));
    setLocalMode(true);
  };

  // ─── AI helpers ──────────────────────────────────────────────────────────────

  const getUsefulRoutesForTicket = (
    cityA,
    cityB,
    claimedRoutes,
    aiIdentifier,
  ) => {
    const adj = new Map();
    const addEdge = (city, neighbor, routeId, side, color, trainCount) => {
      if (!adj.has(city)) adj.set(city, []);
      adj.get(city).push({ neighbor, routeId, side, color, trainCount });
    };
    for (const route of ROUTES) {
      const connects = getRouteConnects(route);
      if (!connects?.[0] || !connects?.[1]) continue;
      const [a, b] = connects;
      if (route.isDouble) {
        for (const side of ["even", "odd"]) {
          const claimer = claimedRoutes[`${route.id}_${side}`];
          if (!claimer || claimer === aiIdentifier) {
            const tileColor =
              route.tiles[side === "even" ? 0 : 1]?.color || "gray";
            addEdge(a, b, route.id, side, tileColor, route.trainCount);
            addEdge(b, a, route.id, side, tileColor, route.trainCount);
          }
        }
      } else {
        const claimer = claimedRoutes[`${route.id}_single`];
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
    const usefulRoutes = [],
      seen = new Set();
    for (const [city, edges] of adj.entries()) {
      const cityDist = dist.get(city);
      if (cityDist === undefined || cityDist >= targetDist) continue;
      for (const { neighbor, routeId, side, color, trainCount } of edges) {
        const neighborDist = dist.get(neighbor);
        if (neighborDist === cityDist + 1) {
          const key = `${routeId}_${side}`;
          if (!seen.has(key)) {
            seen.add(key);
            const claimer = claimedRoutes[key];
            if (!claimer)
              usefulRoutes.push({
                routeId,
                side,
                color,
                trainCount,
                alreadyOwned: false,
              });
            else if (claimer === aiIdentifier)
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
    return usefulRoutes;
  };

  const playAiTurn = useCallback(async () => {
    if (isAiThinkingRef.current || gameState?.gameOver || !isAiTurn) return;
    isAiThinkingRef.current = true;

    const idx = currentPlayerIndex;
    const aiIdentifier = currentPlayer.name.startsWith("AI")
      ? `player${idx + 1}` // AI players use player2, player3... keys? No — let's check
      : `player${idx}`;
    // Actually AI claimer key: index 0 = "player", index N = `player${N+1}` — but AIs start at index 1+
    // From useTTRGame claimRoute: myPlayerIndex===0 ? "player" : `player${myPlayerIndex+1}`
    const aiClaimerKey = idx === 0 ? "player" : `player${idx + 1}`;

    const myHand = currentPlayer.hand || {};
    const myTickets = currentPlayer.tickets || [];
    const claimedRoutes = gameState.claimedRoutes;
    const cardsDrawn = gameState.cardsDrawn;
    const displayCards = gameState.displayCards;

    const ticketAnalysis = myTickets.map((ticket) => {
      const myEdges = getClaimedEdges(claimedRoutes, aiClaimerKey);
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
            aiClaimerKey,
          );
      const affordableRoutes = usefulRoutes.filter(
        ({ color, trainCount, alreadyOwned }) => {
          if (alreadyOwned) return true;
          const wilds = myHand.rainbow || 0;
          if (color === "gray") {
            return (
              ["orange", "yellow", "blue", "green", "black", "red"].some(
                (c) => (myHand[c] || 0) + wilds >= trainCount,
              ) || wilds >= trainCount
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
          else
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

    const player0 = gameState.players[0];
    const aiGameState = {
      aiHand: myHand,
      aiTickets: myTickets,
      aiScore: currentPlayer.score || 0,
      aiPlacedTiles: currentPlayer.placedTiles || 0,
      cardsDrawn,
      playerHandCount: Object.values(player0.hand || {}).reduce(
        (a, b) => a + b,
        0,
      ),
      playerScore: player0.score || 0,
      displayCardOptions,
      trainDeckCount: gameState.trainDeck.length,
      ticketDeckCount: gameState.ticketDeck.length,
      claimedRoutes,
      ticketAnalysis,
      allUnclaimedRoutes,
    };

    const difficultyPrompt =
      aiDifficulty === "easy"
        ? `You are playing randomly. ${cardsDrawn === 1 ? "draw_deck." : "draw_deck unless you can place_tiles on an affordable route."}`
        : aiDifficulty === "hard"
          ? `You are a highly strategic expert player.
${
  cardsDrawn === 1
    ? `cardsDrawn=1: draw ONE more card. Pick display card where isNeeded=true AND canDrawNow=true AND isRainbow=false. If none, draw_deck.`
    : `cardsDrawn=0:
1. BLOCK opponents: claim critical bottleneck routes even if not on your ticket path.
2. Complete tickets: claim affordable routes, prefer longer ones.
3. Draw needed colors from display. Take rainbow if cardsDrawn=0.
4. draw_tickets if you have 10+ trains left and no clear path.
5. Otherwise draw_deck.`
}`
          : `You are a balanced player.
${
  cardsDrawn === 1
    ? `cardsDrawn=1: draw ONE more card. Pick display card where isNeeded=true AND canDrawNow=true AND isRainbow=false. If none, draw_deck.`
    : `cardsDrawn=0:
1. If you can complete a ticket with an affordable route, do it.
2. Draw needed colors from display.
3. If no needed colors, draw_deck.
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
                "You are an AI playing Ticket to Ride London. Respond ONLY with a valid JSON object. No other text.",
            },
            {
              role: "user",
              content: `State: ${JSON.stringify(aiGameState)}\n\n${difficultyPrompt}\n\nActions: {"action":"draw_display","index":0-4} | {"action":"draw_deck"} | {"action":"draw_tickets"} | {"action":"place_tiles","routeId":N,"side":"single"|"even"|"odd","color":"colorname"}\nRespond with ONE JSON object only.`,
            },
          ],
        }),
      });
      const data = await response.json();
      const content = data.text || "";
      if (!content.trim()) {
        incrementTurn();
        return;
      }
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const action = JSON.parse(jsonMatch[0]);
          if (action.error) {
            incrementTurn();
            return;
          }
          await executeAiAction(action, idx, aiClaimerKey);
        } catch {
          incrementTurn();
        }
      } else {
        incrementTurn();
      }
    } finally {
      isAiThinkingRef.current = false;
    }
  }, [
    gameState,
    isAiTurn,
    currentPlayerIndex,
    currentPlayer,
    aiDifficulty,
    incrementTurn,
  ]);

  const executeAiAction = async (action, idx, aiClaimerKey) => {
    const gs = gameState;
    const cardsDrawn = gs.cardsDrawn;
    switch (action.action) {
      case "draw_display": {
        const card = gs.displayCards[action.index];
        if (!card || (card.rainbow && cardsDrawn >= 1)) {
          incrementTurn();
          return;
        }
        updateGameState((state) => {
          const k = card.rainbow ? "rainbow" : card.color;
          state.players[idx].hand[k] = (state.players[idx].hand[k] || 0) + 1;
          state.players[idx].lastAction = "Drew from the display";
          state.moveLog.push({
            player: state.players[idx].name,
            text: "drew a card from display",
          });
          const result = refillDisplay(
            state.displayCards,
            state.trainDeck,
            state.discardPile,
            action.index,
          );
          state.displayCards = result.display;
          state.trainDeck = result.deck;
          state.discardPile = result.discard;
          const draws = card.rainbow ? 2 : 1;
          state.cardsDrawn = state.cardsDrawn + draws;
          return state;
        });
        if (cardsDrawn + (card.rainbow ? 2 : 1) >= 2)
          setTimeout(incrementTurn, 0);
        break;
      }
      case "draw_deck": {
        updateGameState((state) => {
          let d = [...state.trainDeck],
            dis = [...state.discardPile];
          if (d.length === 0 && dis.length > 0) {
            d = shuffle(dis);
            dis = [];
          }
          if (d.length === 0) return state;
          const c = d[0];
          const k = c.rainbow ? "rainbow" : c.color;
          state.players[idx].hand[k] = (state.players[idx].hand[k] || 0) + 1;
          state.players[idx].lastAction = "Drew from the deck";
          state.moveLog.push({
            player: state.players[idx].name,
            text: "drew a card from deck",
          });
          state.trainDeck = d.slice(1);
          state.discardPile = dis;
          state.cardsDrawn++;
          return state;
        });
        if (cardsDrawn + 1 >= 2) setTimeout(incrementTurn, 0);
        break;
      }
      case "draw_tickets": {
        if (cardsDrawn > 0 || gs.ticketDeck.length === 0) {
          incrementTurn();
          return;
        }
        const drawn = gs.ticketDeck.slice(0, 2);
        const currentHand = gs.players[idx].hand || {};
        const currentTickets = gs.players[idx].tickets || [];
        const keepIndices = await fetchAiTicketChoice(
          drawn,
          currentHand,
          currentTickets,
          aiDifficulty,
        );
        const kept = keepIndices.map((i) => drawn[i]);
        updateGameState((state) => {
          state.ticketDeck = state.ticketDeck.slice(2);
          state.players[idx].tickets = [...state.players[idx].tickets, ...kept];
          state.players[idx].lastAction = `Drew tickets, kept ${kept.length}`;
          state.moveLog.push({
            player: state.players[idx].name,
            text: `kept ${kept.length} tickets`,
          });
          return state;
        });
        setTimeout(incrementTurn, 0);
        break;
      }
      case "place_tiles": {
        if (cardsDrawn > 0) {
          incrementTurn();
          return;
        }
        const route = ROUTES.find((r) => r.id === action.routeId);
        if (!route) {
          incrementTurn();
          return;
        }
        // Double route check
        if (route.isDouble) {
          const otherSide = action.side === "even" ? "odd" : "even";
          const otherClaimer = gs.claimedRoutes[`${route.id}_${otherSide}`];
          const totalPlayers = gs.players.length;
          if (
            otherClaimer &&
            (totalPlayers <= 2 || otherClaimer === aiClaimerKey)
          ) {
            incrementTurn();
            return;
          }
        }
        const length = route.trainCount;
        const myHand = gs.players[idx].hand || {};
        const wilds = myHand.rainbow || 0;
        const color = action.color;
        let deduction = null;
        if (color === "gray") {
          const baseColors = [
            "orange",
            "yellow",
            "blue",
            "green",
            "black",
            "red",
          ];
          let best = null;
          for (const c of baseColors) {
            const have = myHand[c] || 0;
            const useColor = Math.min(have, length);
            const needWild = length - useColor;
            if (needWild <= wilds && (!best || needWild < best.needWild))
              best = { color: c, useColor, needWild };
          }
          if (!best && wilds >= length)
            best = { color: null, useColor: 0, needWild: length };
          if (best) {
            deduction = {};
            if (best.color) deduction[best.color] = best.useColor;
            if (best.needWild) deduction.rainbow = best.needWild;
          }
        } else {
          const have = myHand[color] || 0;
          const useColor = Math.min(have, length);
          const needWild = length - useColor;
          if (needWild <= wilds) {
            deduction = {};
            if (useColor) deduction[color] = useColor;
            if (needWild) deduction.rainbow = needWild;
          }
        }
        if (!deduction) {
          incrementTurn();
          return;
        }
        const points = { 1: 1, 2: 2, 3: 4, 4: 7 }[length] || 0;
        updateGameState((state) => {
          const p = state.players[idx];
          state.claimedRoutes[`${route.id}_${action.side}`] = aiClaimerKey;
          p.score += points;
          const spent = [];
          for (const [k, v] of Object.entries(deduction)) {
            p.hand[k] = Math.max(0, (p.hand[k] ?? 0) - v);
            for (let i = 0; i < v; i++)
              spent.push(k === "rainbow" ? { rainbow: true } : { color: k });
          }
          state.discardPile = [...state.discardPile, ...spent];
          p.placedTiles += length;
          if (p.placedTiles >= 15 && !state.lastRoundTriggered) {
            state.lastRoundTriggered = true;
            state.finalTurnsLeft = state.players.length - 1;
          }
          p.lastAction = `Claimed route (${length} trains)`;
          state.moveLog.push({
            player: p.name,
            text: `claimed a route (${length} trains)`,
          });
          return state;
        });
        setTimeout(incrementTurn, 0);
        break;
      }
      default:
        incrementTurn();
    }
  };

  useEffect(() => {
    if (gameState?.gameOver || !isAiTurn) return;
    const key = `${gameState?.turn}-${currentPlayerIndex}-${gameState?.cardsDrawn}`;
    if (lastProcessedAiAction.current !== key) {
      lastProcessedAiAction.current = key;
      playAiTurn();
    }
  }, [
    isAiTurn,
    currentPlayerIndex,
    gameState?.turn,
    gameState?.cardsDrawn,
    gameState?.gameOver,
    playAiTurn,
  ]);

  // Initial ticket selection for AI players
  useEffect(() => {
    if (!gameState || gameState.gameStarted === false) return;
    const aiPlayersWithTickets = gameState.players.filter(
      (p, i) =>
        i > 0 && p.name.startsWith("AI") && p.drawingTickets?.length > 0,
    );
    if (aiPlayersWithTickets.length === 0) return;
    setAiSelectingTickets(true);
    (async () => {
      for (const p of aiPlayersWithTickets) {
        const idx = gameState.players.indexOf(p);
        const keepIndices = await fetchAiTicketChoice(
          p.drawingTickets,
          p.hand,
          [],
          aiDifficulty,
        );
        updateGameState((state) => {
          const player = state.players[idx];
          const kept = keepIndices.map((i) => player.drawingTickets[i]);
          player.tickets = [...player.tickets, ...kept];
          player.drawingTickets = null;
          return state;
        });
      }
      setAiSelectingTickets(false);
    })();
  }, [gameState?.gameStarted]);

  // End game scoring
  useEffect(() => {
    if (gameState?.gameOver && !gameState?._scoringApplied) {
      updateGameState((state) => {
        const scored = applyEndGameScoring(state);
        scored._scoringApplied = true;
        return scored;
      });
    }
  }, [gameState?.gameOver]);

  // ─── Routing ─────────────────────────────────────────────────────────────────

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
        initialPresence={{ name: playerName, isHost }}
        initialStorage={{ gameState: null, playerSlots: null }}
      >
        <OnlineGame roomId={roomId} playerName={playerName} isHost={isHost} />
      </RoomProvider>
    );
  }

  if (!rulesShown) return <RulesPanel onFinish={() => setRulesShown(true)} />;
  if (!gameState) return <StartScreen onStart={startGame} />;

  const gs = gameState;
  const totalPlayers = gs.players.length;
  const gameOver = gs.gameOver;
  const claimedRoutes = gs.claimedRoutes;
  const moveLog = gs.moveLog || [];

  const playerClaimerKey = isExtraManualTurn
    ? `player${currentPlayerIndex + 1}`
    : "player";
  const currentPlayerData = gs.players[currentPlayerIndex];
  const player0 = gs.players[0];

  const playerTickets = (() => {
    const tickets = currentPlayerData?.tickets || [];
    const edges = getClaimedEdges(claimedRoutes, playerClaimerKey);
    return tickets.map((t) => ({
      ...t,
      blocked: isTicketBlocked(t, playerClaimerKey, claimedRoutes),
      completed: isConnectedViaEdges(edges, t.cityA, t.cityB),
    }));
  })();

  return (
    <div className="flex min-h-screen flex-col items-center bg-zinc-100 dark:bg-zinc-900 font-sans p-8">
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
          players={gs.players}
          numAIs={numAIs}
          numExtraManual={numExtraManual}
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
        score={player0.score}
        turn={gs.turn}
        isAiTurn={isAiTurn}
        isPersonTurn={isPlayer1Turn}
        currentAiIndex={isAiTurn ? currentPlayerIndex - 1 - numExtraManual : -1}
        isExtraManualTurn={isExtraManualTurn}
        currentExtraManualIndex={
          isExtraManualTurn ? currentPlayerIndex - 1 : -1
        }
        lastRoundTriggered={gs.lastRoundTriggered}
        gameOver={gameOver}
      />

      <div className="flex flex-row flex-wrap gap-4">
        {!isPlayer1Turn && (
          <OpponentPanel
            label="Player 1"
            score={player0.score}
            placedTiles={player0.placedTiles}
            hand={player0.hand}
            tickets={player0.tickets}
            lastAction={player0.lastAction || "None yet"}
            isActiveTurn={false}
            isThinking={false}
            gameOver={gameOver}
          />
        )}
        {gs.players.slice(1).map((p, i) => {
          const pi = i + 1;
          const isActive = currentPlayerIndex === pi;
          if (isActive && !isAiTurn) return null; // hide current extra manual player (shown in PlayerBoard)
          return (
            <OpponentPanel
              key={pi}
              label={p.name}
              score={p.score}
              placedTiles={p.placedTiles}
              hand={p.hand}
              tickets={p.tickets}
              lastAction={p.lastAction || "None yet"}
              isActiveTurn={isActive}
              isThinking={isActive && isAiTurn}
              gameOver={gameOver}
            />
          );
        })}
      </div>

      <PlayerBoard
        playerHand={currentPlayerData?.hand || {}}
        playerTickets={playerTickets}
        placedTiles={currentPlayerData?.placedTiles || 0}
        drawingTickets={currentPlayerData?.drawingTickets || null}
        playerLabel={isPlayer1Turn ? "Player 1" : currentPlayerData?.name}
        selectTickets={selectTickets}
        cardsDrawn={gs.cardsDrawn}
        isAiTurn={isAiTurn || aiSelectingTickets}
        numAIs={numAIs}
        totalPlayers={totalPlayers}
        claimedRoutes={claimedRoutes}
        claimRoute={claimRoute}
        playerClaimerKey={playerClaimerKey}
        ticketDeck={gs.ticketDeck}
        trainDeck={gs.trainDeck}
        discardPile={gs.discardPile}
        drawTickets={drawTickets}
        drawFromDeck={drawFromDeck}
        displayCards={gs.displayCards}
        onDrawFromDisplay={drawFromDisplay}
      />

      <MoveLog entries={moveLog} />
    </div>
  );
}
