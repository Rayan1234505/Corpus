# Corpus

Corpus is a full-stack, AI-powered document research assistant. It allows users to upload PDF documents and engage in dynamic, contextual conversations with their content using Google's Gemini AI. The project features a modern Web interface alongside a full-featured Discord bot integration, both backed by a robust monorepo architecture.

# Features

- Native AI PDF Processing: Directly utilizes Gemini's File API to read and understand complex PDF documents.
- Modern Web User Interface: A React-based frontend featuring a drag-and-drop dropzone, side-by-side native PDF rendering, and a conversational chat UI.
- Discord Server Integration: Discord bot leveraging Slash Commands to create dedicated discussion threads for uploaded papers.
- Smart Thread Management: Discord bot auto-maps answers to corresponding sessions without requiring users to memorize session IDs.
- Monorepo Architecture: Shared core logic packages via NPM workspaces.
- Seamless Deployment: Completely containerized using Docker and Docker Compose.

## System Architecture

The monorepo contains the following packages:

- `@corpus/core`: The central brain of the application. Handles native Gemini integrations, prompt engineering, and abstract reasoning logic.
- `@corpus/api`: An Express.js REST API that manages file uploads to MinIO S3, stores metadata in PostgreSQL, and streams server-side events.
- `@corpus/web`: A modern frontend application built with React and Vite. Hosted natively over an Nginx Docker container.
- `@corpus/discord`: A Discord.js bot that handles application commands (`/paper`) and thread management.

### Infrastructure (Docker Compose)

- PostgreSQL: Persistent relational storage for session metadata and chat conversation history.
- MinIO: Local S3-compatible blob storage used to securely house raw PDF files and stream them to the UI iframe viewer.

## Getting Started

### Prerequisites

- Node.js (v20+)
- Docker & Docker Compose
- Google Gemini API Key
- Discord Bot Token & Client ID (for bot integration)

### Installation & Setup

1. Configure Environment Variables
   Initialize your `.env` file based on the provided example. Add your API keys and tokens:

```bash
GEMINI_API_KEY=your_gemini_key
DISCORD_BOT_TOKEN=your_discord_bot_token
DISCORD_CLIENT_ID=your_discord_app_client_id
```

2. Build and Run the Stack
   Deploy the entire cluster using Docker Compose:

```bash
docker compose up -d --build
```

This action stands up the API, Web, Discord bot, Postgres Database, and MinIO storage containers.

3. Access the Clients

- Web Interface: Navigate to `http://localhost:80`
- Discord Interface: Invite the bot to your server and type `/paper upload`

## Discord Commands

The Discord bot provides the following slash commands:

- `/paper upload` [file]: Upload a new PDF to initialize a research session and open a targeted discussion thread.
- `/paper ask` [question]: Ask a question about the active paper within a thread.
- `/paper summary`: Instantly generate a unified, structured summary of the current text.
- `/paper status`: Fetch structural metadata about the active discussion session.
