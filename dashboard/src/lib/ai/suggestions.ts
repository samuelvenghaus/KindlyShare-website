import "server-only";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { getAnthropicClient } from "./client";

const SUGGESTION_MODEL = "claude-opus-5";

const SuggestionSchema = z.object({
  suggestion: z
    .string()
    .describe("Concrete, uitvoerbare oplossingssuggestie in het Nederlands, 2-4 zinnen."),
});

export async function generateAlertSuggestion({
  topicLabel,
  increasePercentage,
  windowDays,
  exampleTexts,
}: {
  topicLabel: string;
  increasePercentage: number;
  windowDays: number;
  exampleTexts: string[];
}): Promise<string> {
  const examples = exampleTexts.length > 0
    ? exampleTexts.map((t, i) => `${i + 1}. "${t}"`).join("\n")
    : "(geen voorbeeldteksten beschikbaar)";

  const response = await getAnthropicClient().messages.parse({
    model: SUGGESTION_MODEL,
    max_tokens: 500,
    system:
      "Je bent een adviseur die Nederlandse MKB-ondernemers helpt op basis van klantfeedback. " +
      "Je geeft korte, concrete, uitvoerbare adviezen - geen algemeenheden.",
    output_config: { format: zodOutputFormat(SuggestionSchema) },
    messages: [
      {
        role: "user",
        content:
          `Het onderwerp "${topicLabel}" komt ${increasePercentage}% vaker voor in negatieve/probleem-reviews ` +
          `in de afgelopen ${windowDays} dagen vergeleken met de ${windowDays} dagen daarvoor.\n\n` +
          `Voorbeeldreviews:\n${examples}\n\n` +
          "Geef een concrete oplossingssuggestie voor de ondernemer.",
      },
    ],
  });

  if (!response.parsed_output) {
    throw new Error("Kon de AI-suggestie van Claude niet parsen.");
  }

  return response.parsed_output.suggestion;
}
