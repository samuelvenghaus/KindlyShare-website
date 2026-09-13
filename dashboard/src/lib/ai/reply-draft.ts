import "server-only";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { getAnthropicClient } from "./client";

const REPLY_MODEL = "claude-opus-5";

const ReplyDraftSchema = z.object({
  reply: z.string().describe("Het conceptantwoord in het Nederlands, 2-4 zinnen, klaar om te versturen."),
});

export async function generateReviewReplyDraft({
  companyName,
  reviewText,
  rating,
  sentiment,
}: {
  companyName: string;
  reviewText: string;
  rating: number | null;
  sentiment: "positive" | "neutral" | "negative" | null;
}): Promise<string> {
  const ratingLine = rating !== null ? `Sterrenscore: ${rating}/5\n` : "";
  const sentimentLine = sentiment ? `Sentiment: ${sentiment}\n` : "";

  const response = await getAnthropicClient().messages.parse({
    model: REPLY_MODEL,
    max_tokens: 400,
    system:
      `Je schrijft namens "${companyName}" een kort, persoonlijk antwoord op een klantreview, in het Nederlands. ` +
      "Bij een positieve review: bedank kort en oprecht, zonder overdreven te doen. Bij een negatieve review: " +
      "erken het probleem, verontschuldig je waar gepast, en nodig uit tot verder contact zonder concrete " +
      "beloftes te doen die het bedrijf niet kan waarmaken. Nooit defensief of belerend. Onderteken niet met " +
      "een naam - dat voegt de ondernemer er zelf aan toe.",
    output_config: { format: zodOutputFormat(ReplyDraftSchema), effort: "low" },
    messages: [
      {
        role: "user",
        content: `${ratingLine}${sentimentLine}Reviewtekst: "${reviewText}"\n\nSchrijf een conceptantwoord.`,
      },
    ],
  });

  if (!response.parsed_output) {
    throw new Error("Kon het conceptantwoord van Claude niet parsen.");
  }

  return response.parsed_output.reply;
}
