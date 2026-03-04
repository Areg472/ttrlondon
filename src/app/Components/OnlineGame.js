"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  useStorage,
  useMutation,
  useOthers,
  useSelf,
} from "../../liveblocks.config";
import { shuffle } from "../utils/shuffle";
import {
  CITIES,
  TICKETS,
  INITIAL_TRAIN_CARDS_DECK,
  ROUTES,
} from "../data/gameData";
import { GameHeader } from "./GameHeader";
import { PlayerBoard } from "./PlayerBoard";
import { GameOverModal } from "./GameOverModal";
import { TicketSelection } from "./TicketSelection";

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

const routeConnectCache = {};

const inferRouteConnectsByGeometry = (route) => {
  if (!route) return null;
  if (routeConnectCache[route.id]) return routeConnectCache[route.id];
  const start = { x: route.x, y: route.y };
  let dx = 0,
    dy = 0;
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
      const ddx = (c.x ?? 0) - pt.x,
        ddy = (c.y ?? 0) - pt.y;
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
      const ddx = (c.x ?? 0) - end.x,
        ddy = (c.y ?? 0) - end.y;
      const d2 = ddx * ddx + ddy * ddy;
      if (!bestAlt || d2 < bestAlt.d2) bestAlt = { name: c.name, d2 };
    }
    if (bestAlt) b = bestAlt.name;
  }
  const connects = a && b ? [a, b] : null;
  if (connects) routeConnectCache[route.id] = connects;
  return connects;
};

const getRouteConnects = (route) => {
  if (Array.isArray(route.connects) && route.connects.length === 2)
    return route.connects;
  return inferRouteConnectsByGeometry(route);
};

const getClaimedEdges = (claimedRoutes, claimer) => {
  const edges = [];
  for (const [k, v] of Object.entries(claimedRoutes || {})) {
    if (v !== claimer) continue;
    const [routeIdStr] = k.split("_");
    const route = ROUTES.find((r) => r.id === Number(routeIdStr));
    if (!route) continue;
    const connects = getRouteConnects(route);
    if (connects && connects[0] && connects[1])
      edges.push([connects[0], connects[1]]);
  }
  return edges;
};

const isConnectedViaEdges = (edges, start, goal) => {
  if (start === goal) return true;
  const adj = new Map();
  for (const [a, b] of edges) {
    if (!adj.has(a)) adj.set(a, new Set());
    if (!adj.has(b)) adj.set(b, new Set());
    adj.get(a).add(b);
    adj.get(b).add(a);
  }
  const visited = new Set([start]);
  const q = [start];
  while (q.length) {
    const u = q.shift();
    if (u === goal) return true;
    for (const v of adj.get(u) || []) {
      if (!visited.has(v)) {
        visited.add(v);
        q.push(v);
      }
    }
  }
  return false;
};

const isTicketBlocked = (ticket, playerKey, claimedRoutes) => {
  const adj = new Map();
  for (const route of ROUTES) {
    const connects = getRouteConnects(route);
    if (!connects || !connects[0] || !connects[1]) continue;
    const [a, b] = connects;
    const sides = route.isDouble ? ["even", "odd"] : ["single"];
    for (const side of sides) {
      const claimer = (claimedRoutes || {})[`${route.id}_${side}`];
      if (!claimer || claimer === playerKey) {
        if (!adj.has(a)) adj.set(a, new Set());
        if (!adj.has(b)) adj.set(b, new Set());
        adj.get(a).add(b);
        adj.get(b).add(a);
      }
    }
  }
  const visited = new Set([ticket.cityA]);
  const q = [ticket.cityA];
  while (q.length) {
    const u = q.shift();
    if (u === ticket.cityB) return false;
    for (const v of adj.get(u) || []) {
      if (!visited.has(v)) {
        visited.add(v);
        q.push(v);
      }
    }
  }
  return true;
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

const buildInitialState = (numPlayers) => {
  const rawDeck = [...INITIAL_TRAIN_CARDS_DECK];
  const {
    display,
    deck: deckAfterDisplay,
    discard,
  } = checkThreeRainbows(rawDeck.slice(0, 5), rawDeck.slice(5), []);

  const ticketDeckShuffled = shuffle([...TICKETS]);
  const emptyHand = {
    orange: 0,
    blue: 0,
    black: 0,
    red: 0,
    yellow: 0,
    green: 0,
    rainbow: 0,
  };

  let deckOffset = 0;
  const players = [];
  for (let i = 0; i < numPlayers; i++) {
    const trainCards = deckAfterDisplay.slice(deckOffset, deckOffset + 2);
    deckOffset += 2;
    const hand = { ...emptyHand };
    trainCards.forEach((c) => {
      const k = c.rainbow ? "rainbow" : c.color;
      hand[k]++;
    });
    const tickets = ticketDeckShuffled.slice(i * 2, i * 2 + 2);
    players.push({
      hand,
      tickets: [],
      drawingTickets: tickets,
      score: 0,
      placedTiles: 0,
      lastAction: null,
      ticketResults: [],
      numberBonuses: [],
    });
  }

  const remainingDeck = deckAfterDisplay.slice(deckOffset);
  const remainingTicketDeck = ticketDeckShuffled.slice(numPlayers * 2);

  return {
    players,
    displayCards: display,
    trainDeck: remainingDeck,
    ticketDeck: remainingTicketDeck,
    discardPile: discard,
    claimedRoutes: {},
    currentPlayerIndex: 0,
    cardsDrawn: 0,
    turn: 1,
    gameOver: false,
    lastRoundTriggered: false,
    finalTurnsLeft: -1,
    gameStarted: true,
  };
};

function WaitingForPlayers({ children, roomId }) {
  const others = useOthers();
  if (others.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-100 dark:bg-zinc-900 font-sans p-8">
        <div className="bg-white dark:bg-zinc-800 p-12 rounded-[40px] shadow-2xl border border-zinc-200 dark:border-zinc-700 flex flex-col items-center max-w-md w-full text-center gap-6">
          <h1 className="text-4xl font-black text-zinc-800 dark:text-zinc-100 ">
            Waiting for players…
          </h1>
          <p className="text-zinc-400 text-sm font-semibold">
            Share this room code with a friend to start playing.
          </p>
          {roomId && (
            <div className="bg-zinc-100 dark:bg-zinc-900 rounded-2xl px-8 py-4">
              <span className="text-3xl font-black tracking-widest text-zinc-800 dark:text-zinc-100 ">
                {roomId}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return children;
}

function RoomLobby({ roomId, playerName, isHost, onStart }) {
  const others = useOthers();
  const self = useSelf();
  const totalPlayers = 1 + others.length;

  const buildSlotsAndStart = () => {
    const allNames = [
      self?.presence?.name || playerName,
      ...others.map((o) => o.presence?.name || "Player"),
    ];
    const slots = {};
    allNames.forEach((name, i) => {
      slots[name] = i;
    });
    onStart(totalPlayers, slots);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-100 dark:bg-zinc-900 font-sans p-8">
      <div className="bg-white dark:bg-zinc-800 p-12 rounded-[40px] shadow-2xl border border-zinc-200 dark:border-zinc-700 flex flex-col items-center max-w-md w-full text-center gap-6">
        <h1 className="text-4xl font-black text-zinc-800 dark:text-zinc-100 ">
          Room Lobby
        </h1>
        <div className="bg-zinc-100 dark:bg-zinc-900 rounded-2xl px-8 py-4">
          <span className="text-xs uppercase font-bold text-zinc-400 tracking-widest block mb-1">
            Room Code
          </span>
          <span className="text-3xl font-black tracking-widest text-zinc-800 dark:text-zinc-100 ">
            {roomId}
          </span>
        </div>
        <div className="w-full flex flex-col gap-2">
          <div className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl px-4 py-3">
            <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>
            <span className="font-semibold text-zinc-800 dark:text-zinc-100 ">
              {self?.presence?.name || playerName} (you)
            </span>
          </div>
          {others.map((o) => (
            <div
              key={o.connectionId}
              className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl px-4 py-3"
            >
              <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>
              <span className="font-semibold text-zinc-800 dark:text-zinc-100 ">
                {o.presence?.name || "Player"}
              </span>
            </div>
          ))}
        </div>
        <p className="text-zinc-400 text-sm">
          {totalPlayers} player{totalPlayers !== 1 ? "s" : ""} in room (2–4
          supported)
        </p>
        {isHost ? (
          <button
            onClick={buildSlotsAndStart}
            disabled={totalPlayers < 2}
            className="w-full py-4 rounded-2xl bg-zinc-800 text-white font-black hover:scale-105 transition-transform shadow-lg cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {totalPlayers < 2
              ? "Waiting for players…"
              : `Start Game (${totalPlayers} players)`}
          </button>
        ) : (
          <p className="text-zinc-500 dark:text-zinc-400 text-sm font-semibold">
            Waiting for host to start the game…
          </p>
        )}
      </div>
    </div>
  );
}

export function OnlineGame({ roomId, playerName, isHost }) {
  const gameState = useStorage((root) => root.gameState);
  const playerSlots = useStorage((root) => root.playerSlots);
  const others = useOthers();
  const self = useSelf();

  const myPlayerIndex = playerSlots
    ? (playerSlots[playerName] ?? -1)
    : isHost
      ? 0
      : -1;

  useEffect(() => {
    if (myPlayerIndex >= 0 && gameState?.gameStarted) {
      try {
        localStorage.setItem(
          "ttr_session",
          JSON.stringify({
            roomId,
            playerName,
            isHost,
            playerIndex: myPlayerIndex,
          }),
        );
      } catch (_) {}
    }
  }, [myPlayerIndex, gameState?.gameStarted, roomId, playerName, isHost]);

  useEffect(() => {
    if (gameState?.gameOver) {
      try {
        localStorage.removeItem("ttr_session");
      } catch (_) {}
    }
  }, [gameState?.gameOver]);

  const onlinePlayerIndices = new Set();
  if (self && myPlayerIndex >= 0) onlinePlayerIndices.add(myPlayerIndex);
  for (const o of others) {
    const idx = playerSlots ? (playerSlots[o.presence?.name] ?? -1) : -1;
    if (idx >= 0) onlinePlayerIndices.add(idx);
  }
  const disconnectedPlayers = gameState?.gameStarted
    ? (gameState.players || [])
        .map((_, i) => i)
        .filter((i) => !onlinePlayerIndices.has(i))
    : [];

  const disconnectTimerRef = useRef(null);

  useEffect(() => {
    if (disconnectedPlayers.length > 0 && !gameState?.gameOver) {
      if (!disconnectTimerRef.current) {
        disconnectTimerRef.current = setTimeout(() => {
          try {
            localStorage.removeItem("ttr_session");
          } catch (_) {}
          window.location.reload();
        }, 60000);
      }
    } else {
      if (disconnectTimerRef.current) {
        clearTimeout(disconnectTimerRef.current);
        disconnectTimerRef.current = null;
      }
    }
    return () => {
      if (disconnectTimerRef.current) {
        clearTimeout(disconnectTimerRef.current);
        disconnectTimerRef.current = null;
      }
    };
  }, [disconnectedPlayers.length, gameState?.gameOver]);

  const initGame = useMutation(({ storage }, numPlayers, slots) => {
    const state = buildInitialState(numPlayers);
    storage.set("gameState", state);
    storage.set("playerSlots", slots);
  }, []);

  const updateGameState = useMutation(({ storage }, updater) => {
    const current = storage.get("gameState");
    if (!current) return;
    const updated = updater(JSON.parse(JSON.stringify(current)));
    storage.set("gameState", updated);
  }, []);

  const finalBonusesApplied = useRef(false);

  const applyEndGameBonuses = useCallback(() => {
    finalBonusesApplied.current = true;
    updateGameState((state) => {
      const groups = groupCitiesByNumber();
      const add = (arr) => arr.reduce((a, b) => a + b, 0);

      state.players = state.players.map((player, pi) => {
        const claimer = pi === 0 ? "player" : `player${pi + 1}`;
        const edges = getClaimedEdges(state.claimedRoutes, claimer);

        const numberBonuses = [];
        for (const [num, names] of groups.entries()) {
          if (names.length < 2) continue;
          if (isSetFullyConnected(edges, names)) numberBonuses.push(num);
        }

        const ticketResults = player.tickets.map((t) => ({
          ...t,
          completed: isConnectedViaEdges(edges, t.cityA, t.cityB),
        }));

        const ticketDelta = ticketResults.reduce(
          (sum, t) => sum + (t.completed ? t.points : -t.points),
          0,
        );
        const numBonus = numberBonuses.length ? add(numberBonuses) : 0;

        return {
          ...player,
          score: player.score + ticketDelta + numBonus,
          ticketResults,
          numberBonuses,
        };
      });

      return state;
    });
  }, [updateGameState]);

  useEffect(() => {
    if (gameState?.gameOver && !finalBonusesApplied.current && isHost) {
      applyEndGameBonuses();
    }
  }, [gameState?.gameOver, isHost, applyEndGameBonuses]);

  const isMyTurn =
    gameState &&
    gameState.currentPlayerIndex === myPlayerIndex &&
    !gameState.gameOver;

  const prevIsMyTurnRef = useRef(false);
  useEffect(() => {
    if (isMyTurn && !prevIsMyTurnRef.current) {
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.4, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.5);
        osc.onended = () => ctx.close();
      } catch (_) {}
    }
    prevIsMyTurnRef.current = !!isMyTurn;
  }, [isMyTurn]);
  const myClaimerKey =
    myPlayerIndex === 0 ? "player" : `player${myPlayerIndex + 1}`;

  const incrementTurn = useCallback(() => {
    updateGameState((state) => {
      const numPlayers = state.players.length;
      const cur = state.currentPlayerIndex;

      if (state.lastRoundTriggered) {
        if (state.finalTurnsLeft === 0) {
          state.gameOver = true;
          return state;
        }
        if (state.finalTurnsLeft > 0) state.finalTurnsLeft -= 1;
      }

      const next = (cur + 1) % numPlayers;
      state.currentPlayerIndex = next;
      if (next === 0) state.turn += 1;
      state.cardsDrawn = 0;
      return state;
    });
  }, [updateGameState]);

  const selectTickets = useCallback(
    (selectedIndices) => {
      if (selectedIndices.length < 1) return;
      updateGameState((state) => {
        const pi = myPlayerIndex;
        const player = state.players[pi];
        const drawn = player.drawingTickets || [];
        const selected = selectedIndices.map((i) => drawn[i]);
        state.players[pi] = {
          ...player,
          tickets: [...player.tickets, ...selected],
          drawingTickets: null,
          lastAction: `Drew tickets, kept ${selected.length}`,
        };
        return state;
      });
      setTimeout(() => incrementTurn(), 0);
    },
    [updateGameState, myPlayerIndex, incrementTurn],
  );

  const drawFromDisplay = useCallback(
    (index) => {
      if (!isMyTurn || (gameState?.cardsDrawn ?? 0) >= 2) return;
      const display = gameState.displayCards;
      const card = display[index];
      if (!card) return;
      if (card.rainbow && (gameState?.cardsDrawn ?? 0) >= 1) return;

      updateGameState((state) => {
        const pi = myPlayerIndex;
        const colorKey = card.rainbow ? "rainbow" : card.color;
        const player = state.players[pi];
        const newHand = {
          ...player.hand,
          [colorKey]: (player.hand[colorKey] ?? 0) + 1,
        };

        let nextDisplay = [...state.displayCards];
        let nextDeck = [...state.trainDeck];
        let nextDiscard = [...state.discardPile];

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

        const draws = card.rainbow ? 2 : 1;
        const total = state.cardsDrawn + draws;

        state.players[pi] = {
          ...player,
          hand: newHand,
          lastAction: "Drew from the display",
        };
        state.displayCards = result.display;
        state.trainDeck = result.deck;
        state.discardPile = result.discard;
        state.cardsDrawn = total >= 2 ? 0 : total;

        return state;
      });

      const draws = card.rainbow ? 2 : 1;
      const total = (gameState?.cardsDrawn ?? 0) + draws;
      if (total >= 2) {
        setTimeout(() => incrementTurn(), 0);
      }
    },
    [isMyTurn, gameState, updateGameState, myPlayerIndex, incrementTurn],
  );

  const drawFromDeck = useCallback(() => {
    if (!isMyTurn || (gameState?.cardsDrawn ?? 0) >= 2) return;
    const deck = gameState.trainDeck;
    const discard = gameState.discardPile;
    let currentDeck = [...deck],
      currentDiscard = [...discard];
    if (currentDeck.length === 0 && currentDiscard.length > 0) {
      currentDeck = shuffle(currentDiscard);
      currentDiscard = [];
    }
    if (currentDeck.length === 0) return;
    const card = currentDeck[0];
    const colorKey = card.rainbow ? "rainbow" : card.color;

    updateGameState((state) => {
      const pi = myPlayerIndex;
      let d = [...state.trainDeck],
        dis = [...state.discardPile];
      if (d.length === 0 && dis.length > 0) {
        d = shuffle(dis);
        dis = [];
      }
      if (d.length === 0) return state;
      const c = d[0];
      const ck = c.rainbow ? "rainbow" : c.color;
      const player = state.players[pi];
      state.players[pi] = {
        ...player,
        hand: { ...player.hand, [ck]: (player.hand[ck] ?? 0) + 1 },
        lastAction: "Drew from the deck",
      };
      state.trainDeck = d.slice(1);
      state.discardPile = dis;
      const total = state.cardsDrawn + 1;
      state.cardsDrawn = total >= 2 ? 0 : total;
      return state;
    });

    const total = (gameState?.cardsDrawn ?? 0) + 1;
    if (total >= 2) {
      setTimeout(() => incrementTurn(), 0);
    }
  }, [isMyTurn, gameState, updateGameState, myPlayerIndex, incrementTurn]);

  const drawTickets = useCallback(() => {
    if (!isMyTurn || (gameState?.cardsDrawn ?? 0) > 0) return;
    if (!gameState.ticketDeck || gameState.ticketDeck.length === 0) return;
    updateGameState((state) => {
      const pi = myPlayerIndex;
      const drawn = state.ticketDeck.slice(0, 2);
      state.ticketDeck = state.ticketDeck.slice(2);
      state.players[pi] = { ...state.players[pi], drawingTickets: drawn };
      return state;
    });
  }, [isMyTurn, gameState, updateGameState, myPlayerIndex]);

  const selectDrawnTickets = useCallback(
    (selectedIndices) => {
      if (selectedIndices.length < 1) return;
      updateGameState((state) => {
        const pi = myPlayerIndex;
        const player = state.players[pi];
        const drawn = player.drawingTickets || [];
        const selected = selectedIndices.map((i) => drawn[i]);
        state.players[pi] = {
          ...player,
          tickets: [...player.tickets, ...selected],
          drawingTickets: null,
          lastAction: `Drew tickets, kept ${selected.length}`,
        };
        state.cardsDrawn = 0;
        return state;
      });
      setTimeout(() => incrementTurn(), 0);
    },
    [updateGameState, myPlayerIndex, incrementTurn],
  );

  const claimRoute = useCallback(
    (routeId, side, type) => {
      updateGameState((state) => {
        state.claimedRoutes = {
          ...state.claimedRoutes,
          [`${routeId}_${side}`]: myClaimerKey,
        };
        return state;
      });
    },
    [updateGameState, myClaimerKey],
  );

  const spendCards = useCallback(
    (deduction) => {
      updateGameState((state) => {
        const pi = myPlayerIndex;
        const player = state.players[pi];
        const newHand = { ...player.hand };
        const spent = [];
        for (const [k, v] of Object.entries(deduction || {})) {
          newHand[k] = Math.max(0, (newHand[k] ?? 0) - v);
          for (let i = 0; i < v; i++)
            spent.push(k === "rainbow" ? { rainbow: true } : { color: k });
        }
        state.players[pi] = { ...player, hand: newHand };
        state.discardPile = [...state.discardPile, ...spent];
        return state;
      });
    },
    [updateGameState, myPlayerIndex],
  );

  const addPoints = useCallback(
    (points) => {
      updateGameState((state) => {
        const pi = myPlayerIndex;
        state.players[pi] = {
          ...state.players[pi],
          score: state.players[pi].score + points,
        };
        return state;
      });
    },
    [updateGameState, myPlayerIndex],
  );

  const incrementPlaced = useCallback(
    (n) => {
      const tilesToAdd = Number(n) || 0;
      updateGameState((state) => {
        const pi = myPlayerIndex;
        const player = state.players[pi];
        const nextPlaced = player.placedTiles + tilesToAdd;
        state.players[pi] = { ...player, placedTiles: nextPlaced };
        if (nextPlaced >= 15 && !state.lastRoundTriggered) {
          state.lastRoundTriggered = true;
          const numPlayers = state.players.length;
          state.finalTurnsLeft = numPlayers - 1;
        }
        return state;
      });
    },
    [updateGameState, myPlayerIndex],
  );

  const canPlaceMore = useCallback(
    (needed) => {
      if (!gameState) return false;
      const n = Number(needed) || 0;
      const player = gameState.players[myPlayerIndex];
      return (player?.placedTiles || 0) + n <= 17;
    },
    [gameState, myPlayerIndex],
  );

  if (!gameState || !gameState.gameStarted) {
    return (
      <WaitingForPlayers roomId={roomId}>
        <RoomLobby
          roomId={roomId}
          playerName={playerName}
          isHost={isHost}
          onStart={(numPlayers, slots) => initGame(numPlayers, slots)}
        />
      </WaitingForPlayers>
    );
  }

  const myPlayer = gameState.players[myPlayerIndex];
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const isInitialTicketSelection =
    myPlayer && myPlayer.drawingTickets && myPlayer.tickets.length === 0;
  const isDrawingTickets =
    myPlayer && myPlayer.drawingTickets && myPlayer.tickets.length > 0;

  const myTicketsDisplay = (myPlayer?.tickets || []).map((t) => {
    const edges = getClaimedEdges(gameState.claimedRoutes, myClaimerKey);
    return {
      ...t,
      blocked: isTicketBlocked(t, myClaimerKey, gameState.claimedRoutes),
      completed: isConnectedViaEdges(edges, t.cityA, t.cityB),
    };
  });

  const anyoneSelectingInitial = gameState.players.some(
    (p) => p.drawingTickets && p.tickets.length === 0,
  );

  return (
    <div className="flex min-h-screen flex-col items-center bg-zinc-100 dark:bg-zinc-900 font-sans p-8">
      {gameState.gameOver && (
        <GameOverModal
          score={myPlayer?.score ?? 0}
          aiScores={[]}
          extraManualScores={gameState.players
            .filter((_, i) => i !== myPlayerIndex)
            .map((p) => p.score)}
          playerNumberBonuses={myPlayer?.numberBonuses ?? []}
          aiNumberBonuses={[]}
          extraManualNumberBonuses={gameState.players
            .filter((_, i) => i !== myPlayerIndex)
            .map((p) => p.numberBonuses ?? [])}
          playerTicketResults={myPlayer?.ticketResults ?? []}
          aiTicketResults={[]}
          extraManualTicketResults={gameState.players
            .filter((_, i) => i !== myPlayerIndex)
            .map((p) => p.ticketResults ?? [])}
          extraManualTickets={gameState.players
            .filter((_, i) => i !== myPlayerIndex)
            .map((p) => p.tickets)}
        />
      )}

      {disconnectedPlayers.length > 0 && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-red-600 text-white rounded-2xl px-6 py-3 shadow-xl flex items-center gap-3">
          <span className="text-lg">⚠️</span>
          <span className="font-bold text-sm">
            {disconnectedPlayers.map((i) => `Player ${i + 1}`).join(", ")}{" "}
            disconnected — waiting for them to reconnect…
          </span>
        </div>
      )}

      <div className="fixed top-4 right-4 z-50 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl px-4 py-2 shadow-lg flex flex-col items-center">
        <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-widest">
          Room
        </span>
        <span className="text-xl font-black text-zinc-800 dark:text-zinc-100 tracking-widest">
          {roomId}
        </span>
      </div>

      <GameHeader
        score={myPlayer?.score ?? 0}
        turn={gameState.turn}
        isAiTurn={false}
        isPersonTurn={isMyTurn && !anyoneSelectingInitial}
        currentAiIndex={-1}
        isExtraManualTurn={false}
        currentExtraManualIndex={-1}
        lastRoundTriggered={gameState.lastRoundTriggered}
        gameOver={gameState.gameOver}
      />

      <div className="flex flex-row flex-wrap gap-4 mb-4">
        {gameState.players.map((player, pi) => {
          if (pi === myPlayerIndex) return null;
          const label = pi === 0 ? "Player 1" : `Player ${pi + 1}`;
          const isTheirTurn = gameState.currentPlayerIndex === pi;
          return (
            <div key={pi} className="flex gap-4 mb-4">
              <div
                className={`p-4 rounded-xl shadow-lg flex gap-8 ${isTheirTurn ? "bg-blue-600 text-white" : "bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100"}`}
              >
                <div className="flex flex-col items-center">
                  <span
                    className={`text-[10px] uppercase font-bold ${isTheirTurn ? "text-blue-200" : "text-zinc-500 dark:text-zinc-400"}`}
                  >
                    {label} Points
                  </span>
                  <span className="text-2xl font-black">{player.score}</span>
                </div>
                <div className="flex flex-col items-center">
                  <span
                    className={`text-[10px] uppercase font-bold ${isTheirTurn ? "text-blue-200" : "text-zinc-500 dark:text-zinc-400"}`}
                  >
                    {label} Trains
                  </span>
                  <span className="text-2xl font-black">
                    {17 - (player.placedTiles || 0)}
                  </span>
                </div>
                <div className="flex flex-col items-center">
                  <span
                    className={`text-[10px] uppercase font-bold ${isTheirTurn ? "text-blue-200" : "text-zinc-500 dark:text-zinc-400"}`}
                  >
                    {label} Cards
                  </span>
                  <span className="text-2xl font-black">
                    {Object.values(player.hand || {}).reduce(
                      (a, b) => a + b,
                      0,
                    )}
                  </span>
                </div>
                <div className="flex flex-col items-center">
                  <span
                    className={`text-[10px] uppercase font-bold ${isTheirTurn ? "text-blue-200" : "text-zinc-500 dark:text-zinc-400"}`}
                  >
                    {label} Tickets
                  </span>
                  <span className="text-2xl font-black">
                    {(player.tickets || []).length}
                  </span>
                </div>
                <div className="flex flex-col items-center justify-center">
                  <span
                    className={`text-xs font-bold text-blue-200 animate-pulse ${isTheirTurn ? "opacity-100" : "opacity-0"}`}
                  >
                    THEIR TURN
                  </span>
                </div>
              </div>
              {player.lastAction && (
                <div className="flex items-center">
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 ">
                    <span className="font-bold text-zinc-700 dark:text-zinc-200 ">
                      {label} last action:
                    </span>{" "}
                    {player.lastAction}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {isInitialTicketSelection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-white dark:bg-zinc-800 rounded-3xl p-10 shadow-2xl flex flex-col items-center gap-4 w-full max-w-2xl mx-4">
            <div className="text-2xl font-black text-zinc-800 dark:text-zinc-100 ">
              Choose your starting tickets
            </div>
            <div className="text-zinc-500 dark:text-zinc-400 text-sm">
              Keep at least 1 ticket
            </div>
            <TicketSelection
              tickets={myPlayer.drawingTickets}
              onSelectionComplete={selectTickets}
            />
          </div>
        </div>
      )}

      {isDrawingTickets && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-white dark:bg-zinc-800 rounded-3xl p-10 shadow-2xl flex flex-col items-center gap-4 w-full max-w-2xl mx-4">
            <div className="text-2xl font-black text-zinc-800 dark:text-zinc-100 ">
              Choose tickets to keep
            </div>
            <TicketSelection
              tickets={myPlayer.drawingTickets}
              onSelectionComplete={selectDrawnTickets}
            />
          </div>
        </div>
      )}

      <PlayerBoard
        playerHand={
          myPlayer?.hand ?? {
            orange: 0,
            blue: 0,
            black: 0,
            red: 0,
            yellow: 0,
            green: 0,
            rainbow: 0,
          }
        }
        playerTickets={myTicketsDisplay}
        placedTiles={myPlayer?.placedTiles ?? 0}
        drawingTickets={null}
        playerLabel={
          myPlayerIndex === 0 ? "Player 1" : `Player ${myPlayerIndex + 1}`
        }
        selectTickets={selectDrawnTickets}
        spendCards={spendCards}
        addPoints={addPoints}
        canPlaceMore={canPlaceMore}
        incrementPlaced={incrementPlaced}
        incrementTurn={incrementTurn}
        cardsDrawn={gameState?.cardsDrawn ?? 0}
        isAiTurn={!isMyTurn || anyoneSelectingInitial}
        numAIs={0}
        claimedRoutes={gameState.claimedRoutes ?? {}}
        claimRoute={claimRoute}
        playerClaimerKey={myClaimerKey}
        ticketDeck={gameState.ticketDeck ?? []}
        trainDeck={gameState.trainDeck ?? []}
        discardPile={gameState.discardPile ?? []}
        drawTickets={drawTickets}
        drawFromDeck={drawFromDeck}
        displayCards={gameState.displayCards ?? []}
        onDrawFromDisplay={drawFromDisplay}
      />
    </div>
  );
}
