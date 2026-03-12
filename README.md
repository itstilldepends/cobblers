# Cobblers

A multi-LLM debate and consensus tool.

**The problem**: When tackling complex questions with no single right answer — like designing a system or choosing an implementation approach — you probably already do this manually: ask 3 different LLMs the same question, compare their answers, copy interesting disagreements back into each chat, go back and forth until you're satisfied. It works, but it's tedious.

**Cobblers automates that workflow.** Ask a question, pick your models, and let them debate through structured rounds. The tool extracts consensus and disagreements, feeds them back, and repeats until the models converge — or surface the exact points where they fundamentally disagree. You stay in control: edit the summary, steer the discussion, or fork in a new direction at any point.

## How it works

1. **Ask a question** and select which models participate (Claude, GPT-4o, Gemini, DeepSeek, etc.)
2. **Round 1** — Each model answers independently, without seeing others' responses
3. **Brief generation** — A judge model analyzes all responses and extracts consensus points, disagreements, and open questions. Models are anonymized (Model A/B/C) to the judge to prevent bias
4. **Rounds 2–N** — Models see the brief and respond again, refining positions and addressing disagreements
5. **Convergence** — After each round the judge checks if the debate has converged. If so, it stops early
6. **Review** — Browse every round's responses and briefs. Edit a brief and resume, or fork the debate from any round

## Quick start

```bash
./start.sh
```

This checks your environment (Python 3.11+, Node.js), creates a virtualenv, installs dependencies, and starts both backend and frontend. Then open http://localhost:5173.

### Manual setup

```bash
# Backend
cd backend
cp .env.example .env   # add API keys here, or configure in the UI
python3 -m venv .venv && source .venv/bin/activate
pip install -e .
uvicorn app.main:app --reload

# Frontend
cd frontend
npm install
npm run dev
```

## API keys

You need at least one provider key to run. Keys can be set in:
- `backend/.env` — shared across all sessions
- The UI settings panel — stored in browser localStorage, sent per request

| Provider | Key name | Models |
|----------|----------|--------|
| Anthropic | `ANTHROPIC_API_KEY` | claude-sonnet, claude-haiku |
| OpenAI | `OPENAI_API_KEY` | gpt-4o, gpt-4o-mini |
| Google | `GEMINI_API_KEY` | gemini-flash, gemini-pro |
| DeepSeek | `DEEPSEEK_API_KEY` | deepseek |

## Features

- **Multi-model debate** — Run 2+ models concurrently with structured rounds
- **Configurable judge** — Choose which model generates briefs and checks convergence, independent of debaters
- **Anonymous judging** — Judge sees Model A/B/C, not real names, to avoid brand bias
- **Edit & resume** — Edit any round's brief, then resume the debate from that point
- **Fork** — Branch a debate from any round with a new question or direction
- **Real-time updates** — WebSocket streaming of debate progress
- **Debate history** — Sidebar with all past debates, click to review or continue

## Tech stack

- **Backend**: Python, FastAPI, WebSocket, Pydantic v2
- **Frontend**: React, TypeScript, Vite, Zustand
- **Storage**: JSON files (MVP) — one file per debate in `backend/data/`
- **LLM SDKs**: anthropic, openai, google-genai

## Project structure

```
cobblers/
├── start.sh                    # One-command setup & launch
├── backend/
│   ├── app/
│   │   ├── adapters/           # LLM provider adapters (Claude, OpenAI, Gemini, DeepSeek)
│   │   ├── orchestrator/       # Debate engine, brief generation, convergence detection
│   │   ├── prompts/            # Prompt templates for each debate phase
│   │   ├── routes/             # REST + WebSocket endpoints
│   │   ├── storage/            # JSON file store
│   │   └── models/             # Pydantic data models
│   └── pyproject.toml
└── frontend/
    └── src/
        ├── components/         # UI components (DebateView, BriefView, etc.)
        ├── stores/             # Zustand state management
        ├── hooks/              # React hooks (WebSocket, debate lifecycle)
        └── api/                # REST + WebSocket clients
```

## License

MIT
