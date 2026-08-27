import type {
  Alert,
  ChannelStat,
  DailyTrendPoint,
  FeedbackType,
  Platform,
  Review,
  Sentiment,
  TopicStat,
  TrendPoint,
} from "./types";

export const PLATFORM_LABELS: Record<Platform, string> = {
  google: "Google Reviews",
  trustpilot: "Trustpilot",
  facebook: "Facebook",
  tiktok: "TikTok",
  instagram: "Instagram",
  overig: "Overig",
};

export const PLATFORM_SHORT_LABELS: Record<Platform, string> = {
  google: "Google",
  trustpilot: "Trustpilot",
  facebook: "Facebook",
  tiktok: "TikTok",
  instagram: "Instagram",
  overig: "Overig",
};

export const SENTIMENT_LABELS: Record<Sentiment, string> = {
  positive: "Positief",
  neutral: "Neutraal",
  negative: "Negatief",
};

export const FEEDBACK_TYPE_LABELS: Record<FeedbackType, string> = {
  praise: "Praise",
  interest: "Interest",
  problem: "Problems",
  solution: "Solutions",
};

// ---- Dashboard ----

export const dashboardKpis = {
  totalFeedback: { value: 2847, changePercent: 12.5 },
  positiveFeedback: { value: 1846, changePercent: 64.9 },
  problems: { value: 623, changePercent: 21.9 },
  solutions: { value: 378, changePercent: 13.3 },
};

export const feedbackTypeBreakdown: { type: FeedbackType; count: number; percentage: number }[] = [
  { type: "praise", count: 1847, percentage: 64.9 },
  { type: "interest", count: 621, percentage: 21.8 },
  { type: "problem", count: 245, percentage: 8.6 },
  { type: "solution", count: 134, percentage: 4.7 },
];

const DUTCH_MONTHS_SHORT = ["jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];

function generateDailyTrend(startDate: string, days: number): DailyTrendPoint[] {
  const start = new Date(startDate);
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const base = 650 + (1500 - 650) * (i / (days - 1));
    const wave = 95 * Math.sin(i * 0.85) + 45 * Math.sin(i * 2.1 + 1);
    return {
      date: `${d.getDate()} ${DUTCH_MONTHS_SHORT[d.getMonth()]}`,
      value: Math.max(0, Math.round(base + wave)),
    };
  });
}

// 29 dagelijkse punten van 12 mei t/m 9 jun; labels op de weekgrenzen
// (index 0, 7, 14, 21, 28) tonen exact 12 mei, 19 mei, 26 mei, 2 jun, 9 jun.
export const dashboardFeedbackTrend: DailyTrendPoint[] = generateDailyTrend("2024-05-12", 29);
export const dashboardFeedbackTrendTickInterval = 6;

export const dashboardTopTopics: TopicStat[] = [
  { label: "Snelheid van service", count: 0, percentage: 76 },
  { label: "Vriendelijkheid", count: 0, percentage: 68 },
  { label: "Prijs / kwaliteit", count: 0, percentage: 46 },
  { label: "Communicatie", count: 0, percentage: 38 },
  { label: "Product kwaliteit", count: 0, percentage: 31 },
];

export const dashboardChannels: ChannelStat[] = [
  { platform: "google", count: 1234, percentage: 43.4 },
  { platform: "trustpilot", count: 856, percentage: 30.1 },
  { platform: "facebook", count: 432, percentage: 15.2 },
  { platform: "tiktok", count: 223, percentage: 7.8 },
  { platform: "overig", count: 102, percentage: 3.5 },
];

export const dashboardRecentFeedback: Review[] = [
  {
    id: "recent-1",
    platform: "google",
    author: "Lisa de Vries",
    rating: 5,
    text: "Snelle levering en top service!",
    sentiment: "positive",
    feedbackType: "praise",
    topics: ["Snelle levering"],
    minutesAgo: 2,
  },
  {
    id: "recent-2",
    platform: "tiktok",
    author: "@thomasv_",
    rating: 3,
    text: "Product is goed, maar retourproces kan beter.",
    sentiment: "negative",
    feedbackType: "problem",
    topics: ["Retourproces"],
    minutesAgo: 15,
  },
  {
    id: "recent-3",
    platform: "trustpilot",
    author: "Mark Jansen",
    rating: 5,
    text: "Geweldige klantenservice en snelle oplossing. Zeer tevreden!",
    sentiment: "positive",
    feedbackType: "praise",
    topics: ["Klantenservice"],
    minutesAgo: 32,
  },
];

// ---- Feedback-pagina: tabs (koppen tonen de "aantal reviews" uit de mockup) ----

export const feedbackTabCounts: { platform: Platform | "all"; count: number }[] = [
  { platform: "all", count: 2847 },
  { platform: "google", count: 1234 },
  { platform: "trustpilot", count: 856 },
  { platform: "facebook", count: 432 },
  { platform: "tiktok", count: 223 },
  { platform: "instagram", count: 98 },
  { platform: "overig", count: 102 },
];

// ---- Per-kanaal sentiment overzicht (voorbeeld: Google, zoals in de mockup) ----

export const platformSentiment: Record<
  Platform,
  { positive: number; negative: number; neutral: number }
> = {
  google: { positive: 78, negative: 14, neutral: 8 },
  trustpilot: { positive: 82, negative: 11, neutral: 7 },
  facebook: { positive: 70, negative: 20, neutral: 10 },
  tiktok: { positive: 65, negative: 24, neutral: 11 },
  instagram: { positive: 88, negative: 6, neutral: 6 },
  overig: { positive: 60, negative: 25, neutral: 15 },
};

export const platformSentimentCounts: Record<
  Platform,
  { positive: number; negative: number; neutral: number }
> = {
  google: { positive: 965, negative: 173, neutral: 96 },
  trustpilot: { positive: 702, negative: 94, neutral: 60 },
  facebook: { positive: 302, negative: 86, neutral: 44 },
  tiktok: { positive: 145, negative: 54, neutral: 24 },
  instagram: { positive: 86, negative: 6, neutral: 6 },
  overig: { positive: 61, negative: 26, neutral: 15 },
};

export const platformTrend: Record<Platform, TrendPoint[]> = {
  google: [
    { date: "12 mei", positive: 62, negative: 12, neutral: 8 },
    { date: "19 mei", positive: 70, negative: 15, neutral: 7 },
    { date: "26 mei", positive: 66, negative: 18, neutral: 9 },
    { date: "2 jun", positive: 82, negative: 14, neutral: 6 },
    { date: "9 jun", positive: 95, negative: 16, neutral: 8 },
  ],
  trustpilot: [
    { date: "12 mei", positive: 68, negative: 10, neutral: 6 },
    { date: "19 mei", positive: 74, negative: 9, neutral: 8 },
    { date: "26 mei", positive: 71, negative: 13, neutral: 7 },
    { date: "2 jun", positive: 85, negative: 11, neutral: 5 },
    { date: "9 jun", positive: 91, negative: 10, neutral: 6 },
  ],
  facebook: [
    { date: "12 mei", positive: 50, negative: 20, neutral: 10 },
    { date: "19 mei", positive: 55, negative: 22, neutral: 11 },
    { date: "26 mei", positive: 52, negative: 25, neutral: 9 },
    { date: "2 jun", positive: 60, negative: 21, neutral: 12 },
    { date: "9 jun", positive: 66, negative: 23, neutral: 10 },
  ],
  tiktok: [
    { date: "12 mei", positive: 40, negative: 18, neutral: 8 },
    { date: "19 mei", positive: 46, negative: 20, neutral: 9 },
    { date: "26 mei", positive: 44, negative: 24, neutral: 10 },
    { date: "2 jun", positive: 52, negative: 22, neutral: 8 },
    { date: "9 jun", positive: 58, negative: 26, neutral: 11 },
  ],
  instagram: [
    { date: "12 mei", positive: 30, negative: 4, neutral: 3 },
    { date: "19 mei", positive: 34, negative: 3, neutral: 4 },
    { date: "26 mei", positive: 32, negative: 5, neutral: 3 },
    { date: "2 jun", positive: 38, negative: 4, neutral: 5 },
    { date: "9 jun", positive: 42, negative: 6, neutral: 4 },
  ],
  overig: [
    { date: "12 mei", positive: 18, negative: 8, neutral: 5 },
    { date: "19 mei", positive: 20, negative: 9, neutral: 6 },
    { date: "26 mei", positive: 19, negative: 11, neutral: 5 },
    { date: "2 jun", positive: 23, negative: 10, neutral: 7 },
    { date: "9 jun", positive: 26, negative: 12, neutral: 6 },
  ],
};

export const platformScoreDistribution: Record<Platform, { stars: number; count: number; percentage: number }[]> = {
  google: [
    { stars: 5, count: 765, percentage: 62 },
    { stars: 4, count: 200, percentage: 16 },
    { stars: 3, count: 96, percentage: 8 },
    { stars: 2, count: 95, percentage: 8 },
    { stars: 1, count: 78, percentage: 6 },
  ],
  trustpilot: [
    { stars: 5, count: 540, percentage: 63 },
    { stars: 4, count: 145, percentage: 17 },
    { stars: 3, count: 60, percentage: 7 },
    { stars: 2, count: 60, percentage: 7 },
    { stars: 1, count: 51, percentage: 6 },
  ],
  facebook: [
    { stars: 5, count: 220, percentage: 51 },
    { stars: 4, count: 95, percentage: 22 },
    { stars: 3, count: 47, percentage: 11 },
    { stars: 2, count: 43, percentage: 10 },
    { stars: 1, count: 27, percentage: 6 },
  ],
  tiktok: [
    { stars: 5, count: 100, percentage: 45 },
    { stars: 4, count: 49, percentage: 22 },
    { stars: 3, count: 31, percentage: 14 },
    { stars: 2, count: 25, percentage: 11 },
    { stars: 1, count: 18, percentage: 8 },
  ],
  instagram: [
    { stars: 5, count: 66, percentage: 67 },
    { stars: 4, count: 18, percentage: 18 },
    { stars: 3, count: 8, percentage: 8 },
    { stars: 2, count: 4, percentage: 4 },
    { stars: 1, count: 2, percentage: 3 },
  ],
  overig: [
    { stars: 5, count: 45, percentage: 44 },
    { stars: 4, count: 22, percentage: 22 },
    { stars: 3, count: 15, percentage: 15 },
    { stars: 2, count: 12, percentage: 12 },
    { stars: 1, count: 8, percentage: 7 },
  ],
};

export const platformTopTopics: Record<Platform, TopicStat[]> = {
  google: [
    { label: "Snelle levering", count: 312, percentage: 25 },
    { label: "Klantenservice", count: 284, percentage: 23 },
    { label: "Product kwaliteit", count: 198, percentage: 16 },
    { label: "Retourproces", count: 121, percentage: 10 },
    { label: "Wachttijden", count: 98, percentage: 6 },
  ],
  trustpilot: [
    { label: "Klantenservice", count: 231, percentage: 27 },
    { label: "Snelle levering", count: 198, percentage: 23 },
    { label: "Prijs / kwaliteit", count: 137, percentage: 16 },
    { label: "Product kwaliteit", count: 94, percentage: 11 },
    { label: "Communicatie", count: 60, percentage: 7 },
  ],
  facebook: [
    { label: "Klantenservice", count: 108, percentage: 25 },
    { label: "Communicatie", count: 82, percentage: 19 },
    { label: "Product kwaliteit", count: 65, percentage: 15 },
    { label: "Lange wachttijden", count: 52, percentage: 12 },
    { label: "Retourproces", count: 35, percentage: 8 },
  ],
  tiktok: [
    { label: "Lange wachttijden", count: 56, percentage: 25 },
    { label: "Product kwaliteit", count: 42, percentage: 19 },
    { label: "Algemeen", count: 36, percentage: 16 },
    { label: "Klantenservice", count: 27, percentage: 12 },
    { label: "Snelle levering", count: 18, percentage: 8 },
  ],
  instagram: [
    { label: "Algemeen", count: 41, percentage: 42 },
    { label: "Product kwaliteit", count: 20, percentage: 20 },
    { label: "Klantenservice", count: 14, percentage: 14 },
    { label: "Snelle levering", count: 9, percentage: 9 },
  ],
  overig: [
    { label: "Algemeen", count: 38, percentage: 37 },
    { label: "Klantenservice", count: 22, percentage: 22 },
    { label: "Retourproces", count: 14, percentage: 14 },
  ],
};

const platformAuthors: Record<Platform, string[]> = {
  google: ["Lisa de Vries", "Peter van Dijk", "Annemiek Peters", "Bram Willems", "Sanne Koster"],
  trustpilot: ["Mark Jansen", "Femke Bakker", "Daan Hendriks", "Iris Mulder"],
  facebook: ["Sophie Bakker", "Ruben de Groot", "Nadia El Amrani"],
  tiktok: ["@thomasv_", "@lauraaa", "@kevin.nl"],
  instagram: ["@anne.dijkstra", "@merel.vh", "@joris_b"],
  overig: ["Tim Post", "Willemijn de Boer"],
};

const reviewTemplates: {
  text: string;
  sentiment: Sentiment;
  feedbackType: FeedbackType;
  topics: string[];
  rating: number;
}[] = [
  {
    text: "Super snelle levering en top service! Mijn bestelling was er de volgende dag al.",
    sentiment: "positive",
    feedbackType: "praise",
    topics: ["Snelle levering", "Klantenservice"],
    rating: 5,
  },
  {
    text: "Product is goed, maar retourproces kan beter.",
    sentiment: "negative",
    feedbackType: "problem",
    topics: ["Retourproces"],
    rating: 2,
  },
  {
    text: "Fijne ervaring met de klantenservice via chat. Heel vriendelijk geholpen!",
    sentiment: "positive",
    feedbackType: "praise",
    topics: ["Klantenservice"],
    rating: 4,
  },
  {
    text: "Mijn pakket is beschadigd aangekomen. Erg teleurgesteld.",
    sentiment: "negative",
    feedbackType: "problem",
    topics: ["Product kwaliteit"],
    rating: 1,
  },
  {
    text: "Love this! Zeker een aanrader.",
    sentiment: "positive",
    feedbackType: "praise",
    topics: ["Algemeen"],
    rating: 5,
  },
  {
    text: "Wachttijd was veel te lang, bijna 40 minuten moeten wachten.",
    sentiment: "negative",
    feedbackType: "problem",
    topics: ["Lange wachttijden"],
    rating: 2,
  },
  {
    text: "Prijs-kwaliteitverhouding is prima, zou zeker weer bestellen.",
    sentiment: "positive",
    feedbackType: "praise",
    topics: ["Prijs / kwaliteit"],
    rating: 4,
  },
  {
    text: "Ben benieuwd of jullie ook internationaal verzenden?",
    sentiment: "neutral",
    feedbackType: "interest",
    topics: ["Communicatie"],
    rating: 3,
  },
  {
    text: "Retour werd deze keer wel snel en probleemloos afgehandeld, fijn opgelost!",
    sentiment: "positive",
    feedbackType: "solution",
    topics: ["Retourproces"],
    rating: 5,
  },
  {
    text: "Klantenservice reageerde traag op mijn vraag, duurde 3 dagen.",
    sentiment: "negative",
    feedbackType: "problem",
    topics: ["Klantenservice", "Communicatie"],
    rating: 2,
  },
  {
    text: "Nette verpakking en alles compleet, top!",
    sentiment: "positive",
    feedbackType: "praise",
    topics: ["Product kwaliteit"],
    rating: 5,
  },
  {
    text: "Overweeg een abonnement, heeft iemand ervaring met de opzegtermijn?",
    sentiment: "neutral",
    feedbackType: "interest",
    topics: ["Algemeen"],
    rating: 3,
  },
  {
    text: "De app crasht af en toe bij het afrekenen, kan dit gefixt worden?",
    sentiment: "negative",
    feedbackType: "problem",
    topics: ["Product kwaliteit"],
    rating: 2,
  },
  {
    text: "Duidelijke tracking van mijn bestelling, wist precies wanneer het aankwam.",
    sentiment: "positive",
    feedbackType: "praise",
    topics: ["Communicatie"],
    rating: 5,
  },
  {
    text: "Redelijk prijzig vergeleken met concurrenten, kwaliteit is wel top.",
    sentiment: "neutral",
    feedbackType: "interest",
    topics: ["Prijs / kwaliteit"],
    rating: 3,
  },
  {
    text: "Medewerker dacht actief mee met een oplossing, heel fijn geholpen.",
    sentiment: "positive",
    feedbackType: "solution",
    topics: ["Klantenservice"],
    rating: 5,
  },
  {
    text: "Verpakking was beschadigd door lang transport, product zelf was gelukkig heel.",
    sentiment: "negative",
    feedbackType: "problem",
    topics: ["Product kwaliteit", "Snelle levering"],
    rating: 3,
  },
  {
    text: "Top communicatie tijdens het hele proces, altijd op de hoogte gehouden.",
    sentiment: "positive",
    feedbackType: "praise",
    topics: ["Communicatie"],
    rating: 5,
  },
];

const PLATFORM_INDEX: Record<Platform, number> = {
  google: 0,
  trustpilot: 1,
  facebook: 2,
  tiktok: 3,
  instagram: 4,
  overig: 5,
};

function buildReviewsForPlatform(platform: Platform, count: number): Review[] {
  const authors = platformAuthors[platform];
  const platformIndex = PLATFORM_INDEX[platform];
  const reviews: Review[] = [];
  for (let i = 0; i < count; i++) {
    const template = reviewTemplates[(i * 5 + platformIndex * 7) % reviewTemplates.length];
    const author = authors[(i + platformIndex) % authors.length];
    reviews.push({
      id: `${platform}-${i}`,
      platform,
      author,
      rating: template.rating,
      text: template.text,
      sentiment: template.sentiment,
      feedbackType: template.feedbackType,
      topics: template.topics,
      minutesAgo: 2 + platformIndex * 3 + i * 17,
      flagged: template.sentiment === "negative" && i % 4 === 0,
    });
  }
  return reviews;
}

export const platformReviews: Record<Platform, Review[]> = {
  google: buildReviewsForPlatform("google", 18),
  trustpilot: buildReviewsForPlatform("trustpilot", 14),
  facebook: buildReviewsForPlatform("facebook", 10),
  tiktok: buildReviewsForPlatform("tiktok", 8),
  instagram: buildReviewsForPlatform("instagram", 6),
  overig: buildReviewsForPlatform("overig", 5),
};

export const allReviews: Review[] = (
  Object.keys(platformReviews) as Platform[]
)
  .flatMap((platform) => platformReviews[platform])
  .sort((a, b) => a.minutesAgo - b.minutesAgo);

// ---- Probleemmelding ----

export const exampleAlert: Alert = {
  id: "alert-1",
  topicLabel: "Lange wachttijden",
  increasePercentage: 47,
  windowDays: 3,
  priority: "high",
  reviewCount: 56,
  impact:
    "Klanten noemen steeds vaker lange wachttijden bij de klantenservice. Dit kan leiden tot een dalende klanttevredenheid en meer negatieve reviews op korte termijn.",
  aiSuggestion:
    "Overweeg extra bezetting in te plannen tijdens piekmomenten en een chatbot in te zetten voor veelgestelde vragen, zodat de gemiddelde wachttijd daalt.",
};

export function formatTimeAgo(minutesAgo: number): string {
  if (minutesAgo < 60) return `${minutesAgo} min geleden`;
  const hours = Math.floor(minutesAgo / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? "uur" : "uur"} geleden`;
  const days = Math.floor(hours / 24);
  return `${days} ${days === 1 ? "dag" : "dagen"} geleden`;
}
