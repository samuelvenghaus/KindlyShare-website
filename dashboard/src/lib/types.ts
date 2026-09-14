export type Platform =
  | "google"
  | "trustpilot"
  | "app_store"
  | "facebook"
  | "tiktok"
  | "instagram"
  | "overig"
  | "email_campaign"
  | "widget";

export type Sentiment = "positive" | "neutral" | "negative";

export type FeedbackType = "praise" | "interest" | "problem" | "solution";

export type Priority = "low" | "medium" | "high";

export interface Review {
  id: string;
  platform: Platform;
  author: string;
  rating: number | null;
  text: string;
  sentiment: Sentiment;
  feedbackType: FeedbackType | null;
  topics: string[];
  minutesAgo: number;
  flagged?: boolean;
  canReply: boolean;
  replyText: string | null;
  repliedAt: number | null;
  assignedToId: string | null;
}

export interface TopicStat {
  label: string;
  count: number;
  percentage: number;
}

export interface ChannelStat {
  platform: Platform;
  count: number;
  percentage: number;
}

export interface TrendPoint {
  date: string;
  positive: number;
  negative: number;
  neutral: number;
}

export interface DailyTrendPoint {
  date: string;
  value: number;
}

export interface KpiStat {
  label: string;
  value: number;
  changePercent: number;
}

export interface Alert {
  id: string;
  topicLabel: string;
  increasePercentage: number;
  windowDays: number;
  priority: Priority;
  impact: string;
  aiSuggestion: string;
  reviewCount: number;
}
