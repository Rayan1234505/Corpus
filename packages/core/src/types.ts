export type Citation = {
  passageText: string;
  sectionName: string;
  pageNumber: number | null;
  paragraphIndex: number | null;
};

export type Message = {
  id: string;
  role: "user" | "assistant" | "tool";
  content: string;
  toolName?: string;
  toolInput?: Record<string, unknown>;
  toolResult?: string;
  citations?: Citation[];
  timestamp: Date;
};

export type PaperMetadata = {
  title: string;
  authors: string[];
  year: number | null;
  venue: string | null;
  abstract: string;
  keyContributions: string[];
  pageCount: number;
  fileName: string;
  fileHash: string;
  s3Key?: string;
};

export type Session = {
  id: string;
  surface: "discord" | "web";
  discordThreadId?: string;
  paperMetadata: PaperMetadata;
  extractedSections: Record<string, string>;
  fullText: string;
  geminiFileUri?: string;
  conversationHistory: Message[];
  createdAt: Date;
  updatedAt: Date;
};
