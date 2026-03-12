#!/usr/bin/env bash
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"
BACKEND="$ROOT/backend"
FRONTEND="$ROOT/frontend"
VENV="$BACKEND/.venv"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

info()  { echo -e "${GREEN}[✓]${NC} $1"; }
warn()  { echo -e "${YELLOW}[!]${NC} $1"; }
fail()  { echo -e "${RED}[✗]${NC} $1"; exit 1; }

# ── Python ──────────────────────────────────────────
echo ""
echo "=== Checking environment ==="

if command -v python3 &>/dev/null; then
    PY=$(python3 --version 2>&1)
    PYMAJOR=$(python3 -c 'import sys; print(sys.version_info.minor)')
    if [ "$PYMAJOR" -lt 11 ]; then
        fail "Python 3.11+ required, got $PY"
    fi
    info "Python: $PY"
else
    fail "python3 not found. Install Python 3.11+"
fi

# ── Node ────────────────────────────────────────────
if command -v node &>/dev/null; then
    NODE=$(node --version)
    info "Node: $NODE"
else
    fail "node not found. Install Node.js 18+"
fi

if ! command -v npm &>/dev/null; then
    fail "npm not found"
fi

# ── Backend venv ────────────────────────────────────
echo ""
echo "=== Setting up backend ==="

if [ ! -d "$VENV" ]; then
    warn "Creating Python venv at $VENV ..."
    python3 -m venv "$VENV"
    info "venv created"
else
    info "venv exists"
fi

source "$VENV/bin/activate"

# Check if backend package is installed
if ! python -c "import fastapi" &>/dev/null; then
    warn "Installing backend dependencies..."
    pip install -e "$BACKEND" --quiet
    info "Backend dependencies installed"
else
    info "Backend dependencies ready"
fi

# ── .env ────────────────────────────────────────────
if [ ! -f "$BACKEND/.env" ]; then
    cp "$BACKEND/.env.example" "$BACKEND/.env"
    warn "Created backend/.env from template — edit it to add your API keys"
else
    info "backend/.env exists"
fi

# Check if at least one API key is configured
KEYS_SET=0
while IFS='=' read -r key value; do
    if [[ "$key" == *_API_KEY && -n "$value" ]]; then
        KEYS_SET=$((KEYS_SET + 1))
    fi
done < "$BACKEND/.env"

if [ "$KEYS_SET" -eq 0 ]; then
    warn "No API keys in backend/.env — you can also set them in the UI"
fi

# ── Frontend ────────────────────────────────────────
echo ""
echo "=== Setting up frontend ==="

if [ ! -d "$FRONTEND/node_modules" ]; then
    warn "Installing frontend dependencies..."
    (cd "$FRONTEND" && npm install --silent)
    info "Frontend dependencies installed"
else
    info "Frontend dependencies ready"
fi

# ── Start ───────────────────────────────────────────
echo ""
echo "=== Starting services ==="
echo ""

cleanup() {
    echo ""
    info "Shutting down..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    wait $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    info "Done"
}
trap cleanup EXIT INT TERM

# Backend
(cd "$BACKEND" && "$VENV/bin/uvicorn" app.main:app --reload --port 8000) &
BACKEND_PID=$!
info "Backend starting on http://localhost:8000"

# Frontend
(cd "$FRONTEND" && npm run dev -- --port 5173) &
FRONTEND_PID=$!
info "Frontend starting on http://localhost:5173"

echo ""
echo -e "${GREEN}══════════════════════════════════════${NC}"
echo -e "${GREEN}  Open http://localhost:5173 in browser ${NC}"
echo -e "${GREEN}  Press Ctrl+C to stop both services   ${NC}"
echo -e "${GREEN}══════════════════════════════════════${NC}"
echo ""

wait
