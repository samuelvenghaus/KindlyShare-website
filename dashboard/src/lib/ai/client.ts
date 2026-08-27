import "server-only";
import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

export function isAiConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

/** Maakt de Anthropic-client pas aan bij het eerste gebruik, zodat een
 * ontbrekende ANTHROPIC_API_KEY nooit de hele app blokkeert - alleen de
 * AI-functies die 'm daadwerkelijk aanroepen. */
export function getAnthropicClient(): Anthropic {
  if (!isAiConfigured()) {
    throw new Error("ANTHROPIC_API_KEY ontbreekt in de omgevingsvariabelen.");
  }
  if (!client) {
    client = new Anthropic();
  }
  return client;
}
