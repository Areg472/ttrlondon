import { streamText, convertToModelMessages } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

export async function POST(req) {
  try {
    const { messages } = await req.json();

    const google = createGoogleGenerativeAI({
      apiKey: process.env.AI_GATEWAY_API_KEY,
    });

    console.log(
      "API /api/chat called with messages:",
      JSON.stringify(messages, null, 2),
    );

    const result = streamText({
      model: "google/gemini-3-flash",
      messages: convertToModelMessages(messages),
      onFinish: (result) => {
        console.log("AI Generation finished. Response content:", result.text);
      },
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("API /api/chat error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
