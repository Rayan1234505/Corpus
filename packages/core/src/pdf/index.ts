import crypto from "crypto";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import { PaperMetadata } from "../types.js";
import fs from "fs";
import os from "os";
import path from "path";

type ParseResult = {
  fullText: string;
  geminiFileUri?: string;
  metadata: PaperMetadata;
};

export const parsePdfFromBuffer = async (
  buffer: Buffer,
  fileName: string,
): Promise<ParseResult> => {
  const fileHash = crypto.createHash("sha256").update(buffer).digest("hex");

  // Write the file to a temporary location for Gemini to upload
  const tempFilePath = path.join(os.tmpdir(), `${fileHash}-paper.pdf`);
  fs.writeFileSync(tempFilePath, buffer);

  // Initialize the File Manager using the GEMINI_API_KEY
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set.");
  }
  const fileManager = new GoogleAIFileManager(apiKey);

  try {
    // Upload the file to Gemini Server
    const uploadResponse = await fileManager.uploadFile(tempFilePath, {
      mimeType: "application/pdf",
      displayName: fileName,
    });

    // Attempting rudimentary fallback text/details extraction if you ever need it
    // But now we will strictly rely on Gemini for reading the PDF context
    const fullText =
      "PDF uploaded directly to Gemini API. Text stored at Google Cloud for agent analysis.";

    return {
      fullText,
      geminiFileUri: uploadResponse.file.uri,
      metadata: {
        title: fileName.replace(".pdf", ""),
        authors: [],
        year: null,
        venue: null,
        abstract: "Extracting natively via Gemini.",
        keyContributions: [],
        pageCount: 0,
        fileName,
        fileHash,
      },
    };
  } catch (error) {
    console.error("Gemini Upload Error:", error);
    throw new Error("no_text_content");
  } finally {
    // Clean up temporary file
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
  }
};
