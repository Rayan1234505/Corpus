import pg from "pg";
import { Session } from "@corpus/core";

const { Pool } = pg;

export const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    "postgres://agent:agent@localhost:5432/research_agent",
});

// A quick schema initialization for the DB.
export const initDb = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      surface VARCHAR(50) NOT NULL,
      discord_thread_id VARCHAR(255),
      paper_metadata JSONB NOT NULL,
      extracted_sections JSONB NOT NULL,
      full_text TEXT NOT NULL,
      gemini_file_uri TEXT,
      conversation_history JSONB NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `);
  // Try to add the column if it doesn't exist (since IF NOT EXISTS above won't alter existing tables)
  try {
    await pool.query(`ALTER TABLE sessions ADD COLUMN gemini_file_uri TEXT;`);
  } catch (e: any) {
    // Ignore error if column already exists
    if (e.code !== "42701") {
      console.error(e);
    }
  }
};

export const createSession = async (session: Session): Promise<string> => {
  const result = await pool.query(
    `INSERT INTO sessions (
      id, surface, discord_thread_id, paper_metadata, extracted_sections, full_text, gemini_file_uri, conversation_history, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
    [
      session.id,
      session.surface,
      session.discordThreadId || null,
      session.paperMetadata,
      session.extractedSections,
      session.fullText,
      session.geminiFileUri || null,
      JSON.stringify(session.conversationHistory),
      session.createdAt,
      session.updatedAt,
    ],
  );
  return result.rows[0].id;
};

export const getSession = async (id: string): Promise<Session | null> => {
  const result = await pool.query(`SELECT * FROM sessions WHERE id = $1`, [id]);
  if (result.rows.length === 0) return null;
  const row = result.rows[0];
  return {
    id: row.id,
    surface: row.surface,
    discordThreadId: row.discord_thread_id,
    paperMetadata: row.paper_metadata,
    extractedSections: row.extracted_sections,
    fullText: row.full_text,
    geminiFileUri: row.gemini_file_uri,
    conversationHistory: row.conversation_history,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

export const updateSessionHistory = async (id: string, history: any[]) => {
  await pool.query(
    `UPDATE sessions SET conversation_history = $1, updated_at = NOW() WHERE id = $2`,
    [JSON.stringify(history), id],
  );
};
