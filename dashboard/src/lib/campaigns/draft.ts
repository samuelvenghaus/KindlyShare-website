import "server-only";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { getAnthropicClient } from "@/lib/ai/client";

const DRAFT_MODEL = "claude-opus-5";

const DraftSchema = z.object({
  subject: z.string().describe("Korte, uitnodigende onderwerpregel in het Nederlands, max 60 tekens."),
  body: z
    .string()
    .describe(
      "Vriendelijke, korte e-mailtekst in het Nederlands die om feedback vraagt (3-5 zinnen). " +
        "Geen aanhef ('Hoi {naam}') en geen afsluiting/handtekening - die voegt de applicatie zelf toe."
    ),
});

export interface CampaignDraft {
  subject: string;
  body: string;
}

export async function generateCampaignDraft({ companyName }: { companyName: string }): Promise<CampaignDraft> {
  const response = await getAnthropicClient().messages.parse({
    model: DRAFT_MODEL,
    max_tokens: 400,
    system:
      "Je schrijft korte, warme e-mails namens Nederlandse MKB-bedrijven waarin klanten om feedback wordt " +
      "gevraagd. Toon: persoonlijk en oprecht, geen corporate jargon, geen overdreven superlatieven.",
    output_config: { format: zodOutputFormat(DraftSchema), effort: "low" },
    messages: [
      {
        role: "user",
        content: `Schrijf een conceptmail voor "${companyName}" om klanten te vragen naar hun ervaring, met een link naar een kort feedbackformulier.`,
      },
    ],
  });

  if (!response.parsed_output) {
    throw new Error("Kon de conceptmail van Claude niet parsen.");
  }

  return response.parsed_output;
}
