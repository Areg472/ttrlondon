import { getRouteConnects, isTicketBlocked } from "./gameUtils";
import { ROUTES } from "../data/gameData";

export const getAiTurnAction = async (gameState, aiIndex, difficulty) => {
  const p = gameState.players[aiIndex];
  const myHand = p.hand;
  const myTickets = p.tickets;
  const claimedRoutes = gameState.claimedRoutes;
  const ticketDeckCount = gameState.ticketDeck.length;

  const ticketAnalysis = myTickets.map((t) => ({
    ...t,
    isBlocked: isTicketBlocked(t, `player${aiIndex + 1}`, claimedRoutes),
  }));

  const displayCardOptions = gameState.displayCards.map((c, i) => ({
    index: i,
    color: c.color,
    isRainbow: !!c.rainbow,
    isNeeded: true,
    canDrawNow: !(c.rainbow && gameState.cardsDrawn >= 1),
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

  const aiState = {
    aiHand: myHand,
    aiTickets: myTickets,
    displayCardOptions,
    cardsDrawn: gameState.cardsDrawn,
    ticketDeckCount,
    claimedRoutes,
    ticketAnalysis,
    allUnclaimedRoutes,
  };

  const difficultyPrompt =
    difficulty === "easy"
      ? "You are a casual player. Pick actions almost randomly, with a slight preference for drawing cards."
      : difficulty === "hard"
        ? "You are a strategic expert: Priority 1: BLOCK opponents. Priority 2: Complete tickets efficiently. Priority 3: Draw needed colors."
        : "You are a balanced player focusing on completing tickets.";

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [
          {
            role: "system",
            content:
              "You are an AI playing Ticket to Ride London. Respond ONLY with valid JSON.",
          },
          {
            role: "user",
            content: `${difficultyPrompt} State: ${JSON.stringify(aiState)}. Possible actions: { "action": "draw_display", "index": 0 }, { "action": "draw_deck" }, { "action": "draw_tickets" }, { "action": "place_tiles", "routeId": 1, "side": "single", "cards": { "color": 3 } }`,
          },
        ],
      }),
    });
    const data = await response.json();
    const jsonMatch = (data.text || "").match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
  } catch (_) {}
  return { action: "draw_deck" };
};
