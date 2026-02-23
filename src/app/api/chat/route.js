import { generateText } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";

export async function POST(req) {
  try {
    const { messages } = await req.json();

    const systemMessage = messages.find((m) => m.role === "system")?.content;
    const userMessages = messages.filter((m) => m.role === "user");
    const lastUserMessage = userMessages[userMessages.length - 1]?.content;

    const hackclub = createOpenRouter({
      apiKey: process.env.HACK_CLUB_AI_KEY,
      baseUrl: "https://ai.hackclub.com/proxy/v1",
    });

    const result = await generateText({
      model: hackclub("google/gemini-3-flash-preview"),
      ...(systemMessage && { system: systemMessage }),
      prompt: lastUserMessage,
    });

    return Response.json({ text: result.text });
  } catch (error) {
    console.error("API /api/chat error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
