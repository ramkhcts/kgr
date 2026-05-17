import Anthropic from "@anthropic-ai/sdk";

export const AI_ENABLED = !!process.env.ANTHROPIC_API_KEY;

let _client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!_client) {
    _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return _client;
}

/**
 * Send a single-turn prompt to Claude and return the text response.
 * Throws if ANTHROPIC_API_KEY is not set.
 */
export async function askClaude(
  userPrompt: string,
  systemPrompt?: string,
  maxTokens = 1500
): Promise<string> {
  if (!AI_ENABLED) throw new Error("ANTHROPIC_API_KEY is not configured");

  const client = getClient();

  const msg = await client.messages.create({
    model: "claude-opus-4-5",
    max_tokens: maxTokens,
    ...(systemPrompt ? { system: systemPrompt } : {}),
    messages: [{ role: "user", content: userPrompt }],
  });

  const block = msg.content[0];
  if (block.type !== "text") throw new Error("Unexpected content type from Claude");
  return block.text;
}
