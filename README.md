# Meeting Mind — Technical Take-Home

## Overview

You're building **Meeting Mind**, an AI-powered meeting debrief tool. Teams have too many meetings and constantly lose track of what was decided, who owns what, and what questions are still open. Your job is to build a tool that takes raw meeting transcripts and turns them into structured, actionable insights.

**Time limit: 5 hours.** We respect your time. Focus on demonstrating your thinking and skills, not on perfection. A well-considered partial solution beats a rushed complete one.

---

## The Problem

After every meeting, someone is supposed to send out notes. In practice, what exists is a messy transcript from a recording tool — full of filler, cross-talk, and tangents. Important decisions get buried. Action items get lost. Two weeks later, nobody remembers what was agreed on.

Build a tool that solves this.

---

## Core Requirements

These are the baseline expectations. Every submission should include:

1. **Transcript Ingestion** — A way to input meeting transcripts (paste text or upload a file) along with a title and date. Three sample transcripts are provided in `sample-data/` for testing.

2. **AI-Powered Analysis** — Process each transcript with an LLM to extract structured data:
   - A concise summary (2–4 sentences)
   - Action items (with assignees where mentioned)
   - Key decisions that were made
   - Open questions or unresolved items

3. **Meetings Dashboard** — A view showing all processed meetings with their extracted data. Users should be able to browse past meetings and see what came out of each one.

4. **Database Persistence** — Meetings and their extracted data must be persisted. PostgreSQL is provided via Docker Compose in the starter, but you may use any database you prefer (SQLite, etc.).

5. **REST API** — A backend API that powers all features. The frontend should not call LLM APIs directly.

---

## Stretch Goals

If you finish the core requirements and want to go further, consider any of these (in no particular order):

- **Interactive Chat** — A chat interface where users can ask follow-up questions about a specific meeting ("What did we decide about the timeline?", "Who owns the migration task?")
- **Streaming Responses** — Stream AI responses to the frontend in real-time
- **Cross-Meeting Queries** — Ask questions across multiple meetings ("What has Sarah committed to this month?")
- **Edit & Correct** — Let users correct or refine AI-extracted data
- **Multiple LLM Providers** — Support more than one LLM provider
- **Testing** — Unit and/or integration tests
- **Error Handling & Loading States** — Thoughtful handling of failures, loading indicators, and edge cases

You are free to pursue stretch goals not on this list if you think they demonstrate your skills well.

---

## Getting Started

### Prerequisites

- Node.js 20+
- Docker and Docker Compose
- An LLM API key (OpenAI, Anthropic, or Google — your choice)

### Setup

```bash
# Clone and install
git clone <this-repo>
cd meeting-mind
npm install

# Copy environment variables
cp .env.example .env
# Edit .env and add your LLM API key

# Start PostgreSQL (skip if using a different database)
docker compose up -d

# Start development servers
npx turbo dev
```

The API will be running at `http://localhost:3001` and the web app at `http://localhost:3000`.

### Starter Template

We've provided a monorepo starter so you can focus on the actual problem instead of boilerplate:

- **`apps/api/`** — NestJS backend with TypeORM configured for PostgreSQL, a working health check endpoint, and a simple auth middleware
- **`apps/web/`** — React Router v7 frontend with SSR, Tailwind CSS v4, and a basic layout shell
- **`packages/shared/`** — Shared TypeScript types package, already wired into both apps
- **`sample-data/`** — Three meeting transcripts of varying complexity for testing

You're welcome to modify any part of the starter, swap out libraries, or restructure as you see fit. The starter is a convenience, not a constraint.

---

## What You Should Submit

### 1. Working Code
A git repository with your complete solution. It should run locally with the setup instructions you provide.

### 2. `APPROACH.md`
A brief document (aim for 1–2 pages) covering:
- Your key technical decisions and why you made them
- What you'd improve or do differently with more time
- Any trade-offs you made consciously
- How you approached the AI integration (prompt strategy, structured output, etc.)

### 3. AI Coding Transcripts

**AI fluency is a core part of how we work.** We expect you to use AI coding tools throughout this project — Claude Code, Cursor, GitHub Copilot, ChatGPT, or whatever you prefer. This is not optional.

Save all AI conversations used during development and include them in the `transcripts/` directory. We accept any format:

- **Claude Code**: Run `claude export` or copy from `~/.claude/projects/`
- **Cursor**: Copy conversations from the chat panel into markdown files
- **GitHub Copilot Chat**: Copy chat history from the VS Code panel
- **ChatGPT / Claude web**: Share conversation links or copy/paste into markdown
- **Other tools**: Screenshots, exported logs, or markdown transcripts

**What we're looking for:** We're not scoring whether you used AI — we already know you will. We're evaluating *how* you use it. Your transcripts help us understand how you decompose problems, guide AI tools, validate outputs, and make decisions. This is a window into your engineering thinking.

**Submissions without AI transcripts will not be reviewed.**

### 4. Run Instructions
Clear steps to get your project running from a clean clone. If you deviated from the starter's setup, document what changed.

---

## What We Evaluate

We're transparent about how we assess submissions:

| Dimension | Weight | What We Look For |
|---|---|---|
| **AI Integration** | 20% | Prompt quality, structured extraction accuracy, goes beyond a simple API wrapper |
| **API Design** | 20% | Clean endpoint structure, good TypeScript types, separation of concerns |
| **Frontend & UX** | 20% | Visual appeal, usability, polish — does it feel like a real product? |
| **Code Quality** | 20% | TypeScript usage, architecture, readability, pragmatic choices |
| **Problem Solving** | 20% | Decision quality, approach clarity, effective AI tool usage (from transcripts + APPROACH.md) |

We value **pragmatism over perfection**. A clean, working solution that handles the core requirements well will score higher than a sprawling attempt to cover everything.

---

## Sample Transcripts

The `sample-data/` directory contains three meeting transcripts of increasing complexity:

1. **`product-planning.md`** — A product planning meeting with clear decisions and named action items. Good for validating your baseline extraction works.

2. **`technical-review.md`** — An architecture review with back-and-forth debate, nuanced trade-offs, and implicit action items. Tests how your AI handles ambiguity.

3. **`team-retrospective.md`** — A team retro with informal tone, suggestions vs. real commitments, and emotional undercurrents. Tests whether your AI can distinguish venting from action items.

Use all three to test and demonstrate your solution.

---

## Tech Stack Reference

The starter uses the technologies we use in production. You don't need to be an expert in all of them — we're more interested in how you learn and adapt.

- **TypeScript** — throughout
- **NestJS** — backend framework
- **React Router v7** — frontend with SSR
- **TypeORM** — database ORM (PostgreSQL provided, or use your preferred DB)
- **Tailwind CSS v4** — styling
- **Turborepo** — monorepo tooling

---

## FAQ

**Can I use a different frontend/backend framework?**
You can, but we recommend using the provided starter. It reflects our actual stack and saves you setup time.

**Which LLM should I use?**
Whichever you're most comfortable with. OpenAI, Anthropic, and Google all work. We care about how you use it, not which one you pick.

**Do I need to deploy this?**
No. It just needs to run locally.

**What if I can't finish everything in 5 hours?**
That's fine. Document what you'd do next in your APPROACH.md. We'd rather see thoughtful work on fewer features than rushed work on everything.

**Can I use additional libraries?**
Absolutely. Use whatever helps you build a better solution.

**What if I have questions during the project?**
Email me at stuart@soar.com. I am happy to clarify requirements, but we intentionally leave room for you to make your own decisions.
