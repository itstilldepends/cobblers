# Cobblers

Multi-LLM debate/consensus tool.

## Quick start
- `./start.sh` — checks env, sets up venv + npm, starts both services
- Or manually: backend `cd backend && uvicorn app.main:app --reload`, frontend `cd frontend && npm run dev`
- Frontend proxies /api to localhost:8000

## Architecture decisions
- API keys: never persisted server-side, frontend stores in localStorage, passed per-request. Also supports .env for convenience
- Storage: JSON files in backend/data/ (not SQLite), FileStore interface is narrow for future DB swap
- WebSocket is server-push only; mutations go through REST
- Judge model (brief/convergence) is user-configurable, defaults to first debater. Judge sees anonymized model names (Model A/B/C) to avoid bias; real names restored in stored data and frontend display
- Python env: venv (not conda) — dependencies are simple, no scientific computing needed
- **Follow-ups vs rounds**: Completely separate concepts. Debate rounds have convergence logic and multi-round progression. Follow-ups are single-round Q&A after convergence, with own numbering (1, 2, 3...), own data model (`FollowUp`), own prompt (anchored on final debate brief + previous follow-up summaries), and own WS events
- **Fork**: Purely "branch from round N" — no new question. Creates a new DebateSession with rounds truncated at fork point, then resumes the debate loop
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
- Debate event types: round_start, model_response, model_error, brief_generated, brief_error, convergence_check, converged, debate_complete, error
- Follow-up event types: follow_up_start, token (shared), follow_up_response, follow_up_brief, follow_up_complete
