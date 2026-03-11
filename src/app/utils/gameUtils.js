import { shuffle } from "./shuffle";
import {
  CITIES,
  TICKETS,
  INITIAL_TRAIN_CARDS_DECK,
  ROUTES,
} from "../data/gameData";

// ─── Constants ───────────────────────────────────────────────────────────────

export const EMPTY_HAND = {
  orange: 0,
  blue: 0,
  black: 0,
  red: 0,
  yellow: 0,
  green: 0,
  rainbow: 0,
};

// ─── Train card display helpers ───────────────────────────────────────────────

export const refillDisplay = (display, deck, discard, index) => {
  let nextDisplay = [...display],
    nextDeck = [...deck],
    nextDiscard = [...discard];
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
  return checkThreeRainbows(nextDisplay, nextDeck, nextDiscard);
};

export const checkThreeRainbows = (
  currentDisplay,
  currentDeck,
  currentDiscard,
) => {
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

// ─── Route geometry helpers ───────────────────────────────────────────────────

const routeConnectCache = {};

export const inferRouteConnectsByGeometry = (route) => {
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

export const getRouteConnects = (route) => {
  if (Array.isArray(route.connects) && route.connects.length === 2)
    return route.connects;
  return inferRouteConnectsByGeometry(route);
};

export const isConnectedViaEdges = (edges, start, goal) => {
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
    for (const v of adj.get(u) || new Set()) {
      if (!visited.has(v)) {
        visited.add(v);
        q.push(v);
      }
    }
  }
  return false;
};

export const getClaimedEdges = (claimedRoutes, claimer) => {
  const edges = [];
  for (const [k, v] of Object.entries(claimedRoutes || {})) {
    if (v !== claimer) continue;
    const [routeIdStr] = k.split("_");
    const route = ROUTES.find((r) => r.id === Number(routeIdStr));
    if (!route) continue;
    const connects = getRouteConnects(route);
    if (connects?.[0] && connects?.[1]) edges.push([connects[0], connects[1]]);
  }
  return edges;
};

// ─── Ticket / connectivity helpers ───────────────────────────────────────────

export const isTicketBlocked = (ticket, playerKey, claimedRoutes) => {
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

export const isSetFullyConnected = (edges, names) => {
  if (!names || names.length <= 1) return false;
  const start = names[0];
  for (let i = 1; i < names.length; i++) {
    if (!isConnectedViaEdges(edges, start, names[i])) return false;
  }
  return true;
};

// ─── City number groups ──────────────────────────────────────────────────────

export const groupCitiesByNumber = () => {
  const groups = new Map();
  for (const c of CITIES) {
    const n = Number(c.number) || 0;
    if (!groups.has(n)) groups.set(n, []);
    groups.get(n).push(c.name);
  }
  return groups;
};

// ─── Game initialisation ──────────────────────────────────────────────────────

export const getInitialState = (numPlayers, playerNames = []) => {
  const rawDeck = shuffle([...INITIAL_TRAIN_CARDS_DECK]);
  const {
    display,
    deck: deckAfterDisplay,
    discard,
  } = checkThreeRainbows(rawDeck.slice(0, 5), rawDeck.slice(5), []);

  const ticketDeckShuffled = shuffle([...TICKETS]);
  let deckOffset = 0;
  const players = [];
  for (let i = 0; i < numPlayers; i++) {
    const trainCards = deckAfterDisplay.slice(deckOffset, deckOffset + 2);
    deckOffset += 2;
    const hand = { ...EMPTY_HAND };
    trainCards.forEach((c) => {
      hand[c.rainbow ? "rainbow" : c.color]++;
    });
    const tickets = ticketDeckShuffled.slice(i * 2, i * 2 + 2);
    players.push({
      name: playerNames[i] || (i === 0 ? "Player" : `AI ${i}`),
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

  return {
    players,
    displayCards: display,
    trainDeck: deckAfterDisplay.slice(deckOffset),
    ticketDeck: ticketDeckShuffled.slice(numPlayers * 2),
    discardPile: discard,
    claimedRoutes: {},
    currentPlayerIndex: 0,
    cardsDrawn: 0,
    turn: 1,
    gameOver: false,
    lastRoundTriggered: false,
    finalTurnsLeft: -1,
    gameStarted: true,
    moveLog: [],
  };
};

export const fetchAiTicketChoice = async (
  drawnTickets,
  hand,
  existingTickets = [],
  difficulty = "medium",
) => {
  const difficultyInstruction =
    difficulty === "easy"
      ? "Pick tickets randomly — just keep index 0 always."
      : difficulty === "hard"
        ? "You are highly strategic: keep both tickets if they share cities or overlap routes with your existing tickets, maximising total points. Only discard if completely incompatible."
        : "Choose which tickets to keep based on synergy with existing tickets, your hand, and point value.";

  const context =
    existingTickets.length > 0
      ? `Your current tickets: ${JSON.stringify(existingTickets)}. You drew these 2 new tickets: ${JSON.stringify(drawnTickets)}.`
      : `You have been dealt these 2 tickets: ${JSON.stringify(drawnTickets)}.`;

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
            content: `${context} Your hand: ${JSON.stringify(hand)}. You MUST keep at least 1 ticket. ${difficultyInstruction} Respond with: { "keepIndices": [0] } or { "keepIndices": [0, 1] }`,
          },
        ],
      }),
    });
    const data = await response.json();
    const jsonMatch = (data.text || "").match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (Array.isArray(parsed.keepIndices) && parsed.keepIndices.length >= 1) {
        const valid = parsed.keepIndices.filter((i) => i === 0 || i === 1);
        if (valid.length > 0) return valid;
      }
    }
  } catch (_) {}
  return [0];
};
