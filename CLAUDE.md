# Cobblers

Multi-LLM debate/consensus tool.

## Quick start
- `./start.sh` — checks env, sets up venv + npm, starts both services
- Or manually: backend `cd backend && uvicorn app.main:app --reload`, frontend `cd frontend && npm run dev`
- Frontend proxies /api to localhost:8000

## Architecture decisions
- API keys: never persisted server-side, frontend stores in localStorage, passed per-request. Also supports .env for convenience
- Storage: JSON files in backend/data/ (not SQLite), FileStore interface is narrow for future DB swap
- WebSocket is server-push only; mutations go through REST. Event bus (app/events.py) decouples REST routes from WS — routes publish events, WS subscribes and forwards
- Judge model (brief/convergence) is user-configurable, defaults to first debater. Judge sees anonymized model names (Model A/B/C) to avoid bias; real names restored in stored data and frontend display
- Python env: venv (not conda) — dependencies are simple, no scientific computing needed
- **Every user input treated equally**: Follow-ups are regular rounds with a `question` field on the Round model. Same pipeline: LLM responses → brief → convergence → continue if not converged. Round budget resets per question (each follow-up gets `max_rounds` additional rounds)
- **Convergence scoping**: Follow-up convergence only compares briefs from the current question's run. Prior discussion's final brief passed as background context only
- **Fork**: Copies ALL debate state (all rounds) into a new paused session. No round picker. User can edit the last brief then continue
- **Unified /continue endpoint**: Replaces old /follow-up and /resume. Optional `question` param — with question = follow-up, without = resume from paused state
- **OpenRouter**: Single API key covers all models. Model IDs prefixed with `or/` (e.g. `or/anthropic/claude-sonnet-4`). Uses OpenAI-compatible API with different base_url
- Frontend persists model selection, judge model, and max rounds to localStorage

## Code conventions
- Backend: Python 3.11+, FastAPI, Pydantic v2
- Frontend: React + TypeScript, Zustand, inline styles (no CSS-in-JS lib)
- LLM adapters implement the Protocol in adapters/base.py
- New models: add to MODEL_REGISTRY in adapters/registry.py

## Things to watch out for
- Orchestrator runs as asyncio.create_task (background), don't await it in route handlers
- WS handshake: client must send {api_keys: {...}} as first message after connect
- Event types: round_start, model_response, model_error, brief_generated, brief_error, convergence_check, converged, debate_complete, error
- Legacy data: Pydantic validator on DebateSession auto-migrates old `follow_ups` field into rounds
