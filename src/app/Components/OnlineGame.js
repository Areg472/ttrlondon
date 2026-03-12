"use client";

import { useEffect, useRef, useCallback } from "react";
import {
  useStorage,
  useMutation,
  useOthers,
  useSelf,
  shallow,
} from "@/liveblocks.config";
import {
  EMPTY_HAND,
  isConnectedViaEdges,
  getClaimedEdges,
  isTicketBlocked,
  getInitialState,
} from "../utils/gameUtils";
import { GameHeader } from "./GameHeader";
import { PlayerBoard } from "./PlayerBoard";
import { GameOverModal } from "./GameOverModal";
import { TicketSelection } from "./TicketSelection";
import { OpponentPanel } from "./OpponentPanel";
import { MoveLog } from "./MoveLog";
import { useTTRGame, applyEndGameScoring } from "../hooks/useTTRGame";

function WaitingForPlayers({ children, roomId }) {
  const others = useOthers((others) => others, shallow);
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
  const others = useOthers((others) => others, shallow);
  const self = useSelf();
  const totalPlayers = 1 + others.length;

  const buildSlotsAndStart = () => {
    const slots = {};
    slots[self?.connectionId] = 0;
    others.forEach((o, i) => {
      slots[o.connectionId] = i + 1;
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
  /** @type {{gameStarted: boolean, gameOver: boolean, players: Array, displayCards: Array, trainDeck: Array, ticketDeck: Array, discardPile: Array, claimedRoutes: Object, currentPlayerIndex: number, cardsDrawn: number, turn: number, lastRoundTriggered: boolean, finalTurnsLeft: number, moveLog: Array}|null} */
  const gameState = useStorage((root) => root.gameState, shallow);
  const playerSlots = useStorage((root) => root.playerSlots, shallow);
  /** @type {Array<{presence: {name: string}}>} */
  const others = useOthers((others) => others, shallow);
  const self = useSelf();

  const myPlayerIndex = playerSlots
    ? (playerSlots[self?.connectionId] ?? -1)
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
    const idx = playerSlots ? (playerSlots[o.connectionId] ?? -1) : -1;
    if (idx >= 0) onlinePlayerIndices.add(idx);
  }
  const disconnectedPlayers = gameState?.gameStarted
    ? (gameState.players || [])
        .map((_, i) => i)
        .filter((i) => !onlinePlayerIndices.has(i))
    : [];

  const disconnectedPlayersKey = JSON.stringify(disconnectedPlayers);
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
  }, [disconnectedPlayersKey, gameState?.gameOver]);

  const initGame = useMutation(({ storage }, numPlayers, slots) => {
    const state = getInitialState(numPlayers);
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
    updateGameState((state) => applyEndGameScoring(state));
  }, [updateGameState]);

  useEffect(() => {
    if (gameState?.gameOver && !finalBonusesApplied.current && isHost) {
      applyEndGameBonuses();
    }
  }, [gameState?.gameOver, isHost, applyEndGameBonuses]);

  const {
    drawFromDisplay,
    drawFromDeck,
    drawTickets,
    selectTickets,
    claimRoute,
  } = useTTRGame(gameState, updateGameState, myPlayerIndex, playerName);

  const isMyTurn =
    gameState &&
    gameState.currentPlayerIndex === myPlayerIndex &&
    !gameState.gameOver;

  const prevIsMyTurnRef = useRef(false);
  useEffect(() => {
    if (isMyTurn && !prevIsMyTurnRef.current) {
      try {
        const AudioCtx =
          window.AudioContext ||
          /** @type {typeof AudioContext} */ (window["webkitAudioContext"]);
        const ctx = new AudioCtx();
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

  const myClaimerKey =
    myPlayerIndex === 0 ? "player" : `player${myPlayerIndex + 1}`;

  const myPlayer = gameState.players[myPlayerIndex];
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
      {gameState.gameOver && <GameOverModal players={gameState.players} />}

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
          return (
            <OpponentPanel
              key={pi}
              label={label}
              score={player.score}
              placedTiles={player.placedTiles}
              hand={player.hand}
              tickets={player.tickets}
              lastAction={player.lastAction}
              isActiveTurn={gameState.currentPlayerIndex === pi}
              isThinking={false}
              gameOver={gameState.gameOver}
            />
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
              onSelectionComplete={(i) => selectTickets(i, true)}
            />
          </div>
        </div>
      )}

      <PlayerBoard
        playerHand={myPlayer?.hand ?? EMPTY_HAND}
        playerTickets={myTicketsDisplay}
        placedTiles={myPlayer?.placedTiles ?? 0}
        drawingTickets={null}
        playerLabel={
          myPlayerIndex === 0 ? "Player 1" : `Player ${myPlayerIndex + 1}`
        }
        selectTickets={(i) => selectTickets(i, true)}
        cardsDrawn={gameState?.cardsDrawn ?? 0}
        isAiTurn={!isMyTurn || anyoneSelectingInitial}
        numAIs={0}
        totalPlayers={gameState.players.length}
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

      <MoveLog entries={gameState.moveLog ?? []} />
    </div>
  );
}
