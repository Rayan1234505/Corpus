import { Router } from "express";
import multer from "multer";
import crypto from "crypto";
import { parsePdfFromBuffer } from "@corpus/core";
import { uploadPdf, getPdfStream } from "../services/s3.js";
import {
  createSession,
  getSession,
  updateSessionHistory,
} from "../services/db.js";
import { runAgentStream } from "@corpus/core";

const router = Router();
const upload = multer({ limits: { fileSize: 50 * 1024 * 1024 } }); // 50MB limit

// POST /api/sessions -> upload PDF, parse, create session
router.post("/", upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "Missing uploaded file" });
      return;
    }

    const buffer = req.file.buffer;
    const fileName = req.file.originalname;

    // 1. Upload to S3
    const s3Key = await uploadPdf(buffer, fileName);

    // 2. Extract PDF details / Native upload to Gemini
    const parsed = await parsePdfFromBuffer(buffer, fileName);

    // 3. Create Session object
    const newSession = {
      id: crypto.randomUUID(),
      surface: "web" as const,
      paperMetadata: {
        ...parsed.metadata,
        s3Key, // Store the S3 Key here to fetch it later
      },
      extractedSections: {}, // Could pull from heuristic if needed
      fullText: parsed.fullText,
      geminiFileUri: parsed.geminiFileUri, // Save URI reference in Postgres!
      conversationHistory: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // 4. Save to DB
    await createSession(newSession);

    res.status(201).json({
      id: newSession.id,
      metadata: newSession.paperMetadata,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/sessions/:id
router.get("/:id", async (req, res, next) => {
  try {
    const session = await getSession(req.params.id);
    if (!session) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    // Return session but omit fullText to save bandwidth
    const { fullText, ...safeSession } = session;
    res.json(safeSession);
  } catch (error) {
    next(error);
  }
});

// GET /api/sessions/:id/pdf -> Stream the raw PDF from S3
router.get("/:id/pdf", async (req, res, next) => {
  try {
    const session = await getSession(req.params.id);
    if (!session || !session.paperMetadata.s3Key) {
      res.status(404).json({ error: "PDF not found" });
      return;
    }

    const stream = (await getPdfStream(session.paperMetadata.s3Key)) as any;
    res.setHeader("Content-Type", "application/pdf");
    stream.pipe(res);
  } catch (error) {
    next(error);
  }
});

// POST /api/sessions/:id/messages -> Ask agent via SSE logic
router.post("/:id/messages", async (req, res, next) => {
  try {
    const session = await getSession(req.params.id);
    if (!session) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    const { content } = req.body;
    if (!content) {
      res.status(400).json({ error: "Missing content" });
      return;
    }

    const userMessage = {
      id: crypto.randomUUID(),
      role: "user" as const,
      content,
      timestamp: new Date(),
    };

    session.conversationHistory.push(userMessage);

    // Execute agent turn
    const agentResponse = await runAgentStream({
      userMessage: content,
      session,
    });

    let finalResponseText = "";

    if (typeof agentResponse === "string") {
      finalResponseText = agentResponse;
    } else {
      // It's a stream! Handle full collection or send over SSE block depending on setup
      // For now, let's collect full response since real SSE requires headers setup.
      for await (const chunk of agentResponse.stream) {
        finalResponseText += chunk.text();
      }
    }

    const assistantMessage = {
      id: crypto.randomUUID(),
      role: "assistant" as const,
      content: finalResponseText,
      timestamp: new Date(),
    };

    session.conversationHistory.push(assistantMessage);
    await updateSessionHistory(session.id, session.conversationHistory);

    res.json({ message: assistantMessage });
  } catch (error) {
    next(error);
  }
});

export default router;
