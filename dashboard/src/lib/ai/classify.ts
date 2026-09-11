import "server-only";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { getAnthropicClient } from "./client";
import { prisma } from "@/lib/prisma";

const CLASSIFICATION_MODEL = "claude-opus-5";

const ReviewClassificationSchema = z.object({
  isRelevant: z
    .boolean()
    .describe(
      "false als dit geen daadwerkelijke feedback over het bedrijf/product is - bv. spam, een reactie die alleen " +
        "uit emoji's bestaat, een grapje, iemand die een vriend tagt, 'eerste!'-achtige reacties, of iets volledig " +
        "onrelevants. true bij elke, ook summiere, echte mening/ervaring/vraag/klacht over het bedrijf."
    ),
  sentiment: z.enum(["positive", "neutral", "negative"]),
  feedbackType: z.enum(["praise", "interest", "problem", "solution"]),
  topics: z
    .array(z.string())
    .max(3)
    .describe("1-3 korte Nederlandse onderwerpen, bv. 'Snelle levering', 'Klantenservice', 'Retourproces'."),
});

export type ReviewClassification = z.infer<typeof ReviewClassificationSchema>;

const SYSTEM_PROMPT = `Je classificeert klantfeedback voor KindlyShare, een Nederlands feedback-dashboard dat reviews
en social-media-comments (o.a. Instagram) van bedrijven centraliseert.

Voor elk stuk feedback bepaal je eerst:
- isRelevant: is dit daadwerkelijke feedback over het bedrijf/product, of ruis? Reviews met een sterrenscore
  (Google/Trustpilot/App Store) zijn vrijwel altijd relevant. Bij Instagram-comments moet je juist alert zijn op
  ruis: spam, losse emoji's, grapjes tussen volgers, iemand die een vriend tagt zonder verder commentaar,
  "eerste!"-reacties, of complimenten die alleen over de foto/video zelf gaan zonder iets over het bedrijf te
  zeggen. Twijfel je? Kies dan true - alleen overduidelijke ruis is false.
- sentiment: positive, neutral, of negative
- feedbackType:
  - praise: puur positieve feedback zonder actiepunt
  - interest: een vraag, suggestie, of interesse in een product/dienst
  - problem: een klacht of probleem dat wordt gemeld
  - solution: feedback waarin een eerder probleem is opgelost / positief is afgehandeld
- topics: 1-3 korte Nederlandse onderwerp-labels in zin-hoofdletters (bv. "Snelle levering",
  "Klantenservice", "Product kwaliteit", "Retourproces", "Wachttijden", "Prijs / kwaliteit",
  "Communicatie"). Hergebruik deze voorbeelden waar toepasselijk zodat onderwerpen consistent
  blijven; verzin alleen een nieuw label als geen van deze past. Gebruik "Algemeen" als er geen
  duidelijk onderwerp is. Vul sentiment/feedbackType/topics altijd in, ook als isRelevant false is
  (doe gewoon je beste inschatting) - de applicatie negeert deze velden dan verder.`;

function buildUserPrompt(text: string, rating: number | null, platform: string): string {
  const ratingLine = rating !== null ? `Sterrenscore: ${rating}/5\n` : "";
  return `Platform: ${platform}\n${ratingLine}Tekst: "${text}"`;
}

export async function classifyReview(
  text: string,
  rating: number | null,
  platform: string = "onbekend"
): Promise<ReviewClassification> {
  const client = getAnthropicClient();

  const response = await client.messages.parse({
    model: CLASSIFICATION_MODEL,
    max_tokens: 256,
    system: SYSTEM_PROMPT,
    output_config: {
      format: zodOutputFormat(ReviewClassificationSchema),
      effort: "low",
    },
    messages: [{ role: "user", content: buildUserPrompt(text, rating, platform) }],
  });

  if (!response.parsed_output) {
    throw new Error("Kon de classificatie van Claude niet parsen.");
  }

  return response.parsed_output;
}

function ratingOnlySentiment(rating: number | null): "positive" | "negative" | "neutral" | null {
  if (rating === null) return null;
  if (rating >= 4) return "positive";
  if (rating <= 2) return "negative";
  return "neutral";
}

export interface ClassifyPendingResult {
  classified: number;
  skipped: number;
  failed: number;
}

/** Classificeert nog niet-geclassificeerde reviews van een bedrijf (sentiment IS NULL). */
export async function classifyPendingReviews(companyId: string, limit = 25): Promise<ClassifyPendingResult> {
  const pending = await prisma.review.findMany({
    where: { companyId, sentiment: null },
    orderBy: { fetchedAt: "asc" },
    take: limit,
  });

  if (pending.length === 0) {
    return { classified: 0, skipped: 0, failed: 0 };
  }

  const existingTopics = await prisma.topic.findMany({ where: { companyId } });
  const topicIdByLabel = new Map(existingTopics.map((t) => [t.label.toLowerCase(), t.id]));

  let classified = 0;
  let skipped = 0;
  let failed = 0;

  for (const review of pending) {
    const rating = review.rating !== null ? Number(review.rating) : null;

    if (!review.text || !review.text.trim()) {
      const sentiment = ratingOnlySentiment(rating);
      if (sentiment) {
        await prisma.review.update({ where: { id: review.id }, data: { sentiment } });
      }
      skipped++;
      continue;
    }

    try {
      const result = await classifyReview(review.text, rating, review.platform);

      // Ruis (bv. een spam-comment onder een Instagram-post) krijgt geen onderwerp-labels -
      // die zouden de "Meest genoemde onderwerpen"-lijst alleen maar vervuilen.
      const topicIds: string[] = [];
      if (result.isRelevant) {
        for (const rawLabel of result.topics) {
          const label = rawLabel.trim();
          if (!label) continue;
          const key = label.toLowerCase();
          let topicId = topicIdByLabel.get(key);
          if (!topicId) {
            const topic = await prisma.topic.create({ data: { companyId, label } });
            topicId = topic.id;
            topicIdByLabel.set(key, topicId);
          }
          topicIds.push(topicId);
        }
      }

      await prisma.$transaction([
        prisma.review.update({
          where: { id: review.id },
          data: { sentiment: result.sentiment, feedbackType: result.feedbackType, isRelevant: result.isRelevant },
        }),
        prisma.reviewTopic.deleteMany({ where: { reviewId: review.id } }),
        ...topicIds.map((topicId) =>
          prisma.reviewTopic.upsert({
            where: { reviewId_topicId: { reviewId: review.id, topicId } },
            create: { reviewId: review.id, topicId },
            update: {},
          })
        ),
      ]);

      classified++;
    } catch (err) {
      console.error(`Classificatie mislukt voor review ${review.id}:`, err);
      failed++;
    }
  }

  return { classified, skipped, failed };
}
