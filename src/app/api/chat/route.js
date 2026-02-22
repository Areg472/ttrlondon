import { generateText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

export async function POST(req) {
  try {
    const { messages } = await req.json();

    const systemMessage = messages.find((m) => m.role === "system")?.content;
    const userMessages = messages.filter((m) => m.role === "user");
    const lastUserMessage = userMessages[userMessages.length - 1]?.content;

    const google = createGoogleGenerativeAI({
      apiKey: process.env.AI_GATEWAY_API_KEY,
    });

    const result = await generateText({
      model: "google/gemini-3-flash",
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
