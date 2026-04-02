import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { initDb } from "./services/db.js";
import { initS3 } from "./services/s3.js";
import sessionRoutes from "./routes/sessions.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/sessions", sessionRoutes);

app.get("/health", (req, res) => {
  res.json({ status: "ok", version: "1.0.0" });
});

// Error handling logic
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    console.error("API Error: ", err.message);
    if (err.message === "no_text_content") {
      res.status(400).json({ error: "PDF has no extractable text." });
    } else if (err.message === "encrypted") {
      res.status(400).json({ error: "PDF is encrypted." });
    } else if (err.code === "LIMIT_FILE_SIZE") {
      res.status(413).json({ error: "File too large (max 50MB)" });
    } else {
      res.status(500).json({ error: "Internal Server Error" });
    }
  },
);

const PORT = process.env.PORT || 3000;

const start = async () => {
  try {
    await initS3();
    await initDb();
    console.log("Database and S3 initialized.");
    app.listen(PORT, () => {
      console.log(`API Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server", err);
    process.exit(1);
  }
};

start();
