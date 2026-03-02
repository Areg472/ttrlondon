import { Liveblocks } from "@liveblocks/node";
import { NextResponse } from "next/server";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY,
});

export async function POST(request) {
  const { room, playerName } = await request.json();

  const session = liveblocks.prepareSession(
    `user-${Math.random().toString(36).slice(2, 8)}`,
    { userInfo: { name: playerName || "Player" } },
  );

  session.allow(room, session.FULL_ACCESS);

  const { status, body } = await session.authorize();
  return new NextResponse(body, { status });
}
