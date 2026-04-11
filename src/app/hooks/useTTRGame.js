import { useCallback } from "react";
import {
  refillDisplay,
  groupCitiesByNumber,
  getClaimedEdges,
  isSetFullyConnected,
  isConnectedViaEdges,
} from "../utils/gameUtils";
import { ROUTES } from "../data/gameData";
import { shuffle } from "../utils/shuffle";

/**
 * Encapsulates the core game logic for Ticket to Ride: London.
 * This can be used with both local state and Liveblocks storage.
 */
export function useTTRGame(gameState, updateState, myPlayerIndex, playerName) {
  const isMyTurn =
    gameState &&
    gameState.currentPlayerIndex === myPlayerIndex &&
    !gameState.gameOver;

  const incrementTurn = useCallback(() => {
    updateState((state) => {
      const numPlayers = state.players.length;
      if (state.lastRoundTriggered) {
        if (state.finalTurnsLeft === 0) {
          state.gameOver = true;
          return state;
        }
        if (state.finalTurnsLeft > 0) state.finalTurnsLeft -= 1;
      }

      // Add 15s bonus to the player who just completed their turn (capped at 2:30)
      if (state.playerTimers) {
        const current = state.currentPlayerIndex;
        state.playerTimers[current] = Math.min(
          150,
          state.playerTimers[current] + 15,
        );
        state.lastTimerUpdate = Date.now();
      }

      const next = (state.currentPlayerIndex + 1) % numPlayers;
      state.currentPlayerIndex = next;
      if (next === 0) state.turn += 1;
      state.cardsDrawn = 0;
      return state;
    });
  }, [updateState]);

  const drawFromDisplay = useCallback(
    (index) => {
      if (!isMyTurn || (gameState?.cardsDrawn ?? 0) >= 2) return;
      const card = gameState.displayCards[index];
      if (!card || (card.rainbow && (gameState?.cardsDrawn ?? 0) >= 1)) return;

      updateState((state) => {
        const p = state.players[myPlayerIndex];
        const k = card.rainbow ? "rainbow" : card.color;
        p.hand[k] = (p.hand[k] || 0) + 1;
        p.lastAction = "Drew from the display";
        state.moveLog.push({
          player: playerName,
          text: "drew a card from display",
        });

        const result = refillDisplay(
          state.displayCards,
          state.trainDeck,
          state.discardPile,
          index,
        );
        state.displayCards = result.display;
        state.trainDeck = result.deck;
        state.discardPile = result.discard;
        const draws = card.rainbow ? 2 : 1;
        const total = state.cardsDrawn + draws;
        state.cardsDrawn = total >= 2 ? 0 : total;
        return state;
      });
      if ((gameState?.cardsDrawn ?? 0) + (card.rainbow ? 2 : 1) >= 2) {
        setTimeout(incrementTurn, 0);
      }
    },
    [
      isMyTurn,
      gameState,
      updateState,
      myPlayerIndex,
      playerName,
      incrementTurn,
    ],
  );

  const drawFromDeck = useCallback(() => {
    if (!isMyTurn || (gameState?.cardsDrawn ?? 0) >= 2) return;
    updateState((state) => {
      let d = [...state.trainDeck],
        dis = [...state.discardPile];
      if (d.length === 0 && dis.length > 0) {
        d = shuffle(dis);
        dis = [];
      }
      if (d.length === 0) return state;
      const c = d[0];
      const k = c.rainbow ? "rainbow" : c.color;
      state.players[myPlayerIndex].hand[k] =
        (state.players[myPlayerIndex].hand[k] || 0) + 1;
      state.players[myPlayerIndex].lastAction = "Drew from the deck";
      state.moveLog.push({ player: playerName, text: "drew a card from deck" });
      state.trainDeck = d.slice(1);
      state.discardPile = dis;
      state.cardsDrawn++;
      return state;
    });
    if ((gameState?.cardsDrawn ?? 0) + 1 >= 2) {
      setTimeout(incrementTurn, 0);
    }
  }, [
    isMyTurn,
    gameState,
    updateState,
    myPlayerIndex,
    playerName,
    incrementTurn,
  ]);

  const drawTickets = useCallback(() => {
    if (
      !isMyTurn ||
      (gameState?.cardsDrawn ?? 0) > 0 ||
      !gameState.ticketDeck.length
    )
      return;
    updateState((state) => {
      const drawn = state.ticketDeck.slice(0, 2);
      state.ticketDeck = state.ticketDeck.slice(2);
      state.players[myPlayerIndex].drawingTickets = drawn;
      return state;
    });
  }, [isMyTurn, gameState, updateState, myPlayerIndex]);

  const selectTickets = useCallback(
    (indices, isMidGame = false) => {
      if (!indices.length) return;
      updateState((state) => {
        const p = state.players[myPlayerIndex];
        const selected = indices.map((i) => p.drawingTickets[i]);
        p.tickets = [...p.tickets, ...selected];
        p.drawingTickets = null;
        p.lastAction = `Drew tickets, kept ${selected.length}`;
        if (isMidGame) {
          state.moveLog.push({
            player: playerName,
            text: `kept ${selected.length} tickets`,
          });
          state.cardsDrawn = 0;
        }
        return state;
      });
      setTimeout(incrementTurn, 0);
    },
    [updateState, myPlayerIndex, playerName, incrementTurn],
  );

  const claimRoute = useCallback(
    (routeId, side, deduction, points, trainCount) => {
      updateState((state) => {
        const myClaimerKey =
          myPlayerIndex === 0 ? "player" : `player${myPlayerIndex + 1}`;
        state.claimedRoutes[`${routeId}_${side}`] = myClaimerKey;
        const p = state.players[myPlayerIndex];
        p.score += points;
        const spent = [];
        for (const [k, v] of Object.entries(deduction || {})) {
          p.hand[k] = Math.max(0, (p.hand[k] ?? 0) - v);
          for (let i = 0; i < v; i++)
            spent.push(k === "rainbow" ? { rainbow: true } : { color: k });
        }
        state.discardPile = [...state.discardPile, ...spent];
        p.placedTiles += trainCount;
        if (p.placedTiles >= 15 && !state.lastRoundTriggered) {
          state.lastRoundTriggered = true;
          state.finalTurnsLeft = state.players.length - 1;
        }
        state.moveLog.push({
          player: playerName,
          text: `claimed a route (${trainCount} trains)`,
        });
        return state;
      });
      setTimeout(incrementTurn, 0);
    },
    [updateState, myPlayerIndex, playerName, incrementTurn],
  );

  return {
    drawFromDisplay,
    drawFromDeck,
    drawTickets,
    selectTickets,
    claimRoute,
    incrementTurn,
  };
}

export const applyEndGameScoring = (state) => {
  const groups = groupCitiesByNumber();
  const add = (arr) => arr.reduce((a, b) => a + b, 0);
  state.players = state.players.map((player, pi) => {
    const claimer = pi === 0 ? "player" : `player${pi + 1}`;
    const edges = getClaimedEdges(state.claimedRoutes, claimer);
    const numberBonuses = [];
    for (const [num, names] of groups.entries()) {
      if (names.length >= 2 && isSetFullyConnected(edges, names))
        numberBonuses.push(num);
    }
    const ticketResults = player.tickets.map((t) => ({
      ...t,
      completed: isConnectedViaEdges(edges, t.cityA, t.cityB),
    }));
    const ticketDelta = ticketResults.reduce(
      (sum, t) => sum + (t.completed ? t.points : -t.points),
      0,
    );
    const numBonus = add(numberBonuses);
    return {
      ...player,
      score: player.score + ticketDelta + numBonus,
      ticketResults,
      numberBonuses,
    };
  });
  return state;
};
