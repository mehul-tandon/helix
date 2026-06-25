# ⚡ Forge 2 — AI-Powered Kanban Workspace

> A multi-agent AI system where **Hermes** (brain) and **OpenClaw** (hands) collaborate via Slack to plan, build, and ship a full-stack Kanban application — autonomously, with a human-in-the-loop approval gate.

[![Security Gate](https://github.com/YOUR_USERNAME/forge-2/actions/workflows/security.yml/badge.svg)](https://github.com/YOUR_USERNAME/forge-2/actions/workflows/security.yml)

---

## 🚀 Quick Start (Docker — no PHP/Node required)

```bash
git clone https://github.com/YOUR_USERNAME/forge-2.git
cd forge-2
docker compose up
```

Then open:
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:8000/api
- **Agent Audit Log:** http://localhost:5173/audit

Demo credentials: `demo@forge2.dev` / `password`

---

## 📋 Features

### Kanban App (5 Required Features)
| Feature | Status |
|---------|--------|
| Boards → Lists view | ✅ |
| Card creation with details (title, description) | ✅ |
| Drag-and-drop card movement between lists | ✅ |
| Color-coded tags / labels | ✅ |
| Member assignment + Due dates (red when overdue) | ✅ |

### Agent System
| Feature | Implementation |
|---------|----------------|
| Hermes (Brain) | Goal decomposition, status reports, memory |
| OpenClaw (Hands) | Code execution, file writes, git ops |
| Slack integration | `#sprint-main` (Hermes) + `#agent-coder` (OpenClaw) |
| Model router | Task-type routing with provider failover |
| Human approval gate | 👍 reaction or `/approve` before merge/deploy |
| Audit log | Live event stream at `/audit` |
| Security CI | Composer + npm audit + Trivy on every push |

---

## 🛠️ Local Development (without Docker)

### Backend (Laravel + SQLite)
```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan db:seed          # Seeds demo user + Sprint 1 board
php artisan serve --port=8000
```

### Frontend (Vite + React)
```bash
cd frontend
npm install
npm run dev                   # http://localhost:5173
```

### Model Router
```bash
export GROQ_API_KEY=your_key
export GEMINI_API_KEY=your_key
python3 agents/router.py plan "Decompose this sprint goal: build a Kanban app"
```

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | PHP 8.2 + Laravel 11 + Sanctum |
| Database | SQLite (file-based, no setup) |
| Frontend | React 18 + Vite + @hello-pangea/dnd |
| Agents | Python 3 + Slack API |
| CI | GitHub Actions (security gate) |
| Deploy | Vercel (frontend) + Render (backend) |

---

## 📁 Project Structure

```
forge-2/
├── backend/              # Laravel API
│   ├── app/Models/       # Board, BoardList, Card, Tag
│   ├── app/Http/Controllers/
│   └── routes/api.php
├── frontend/             # Vite + React
│   └── src/
│       ├── pages/        # AuthPage, BoardsPage, BoardPage, AuditPage
│       └── components/   # CardModal
├── agents/
│   ├── router.py         # Model router with failover
│   ├── hermes/           # Hermes agent + SKILL.md
│   └── openclaw/         # OpenClaw agent
├── agent-log/
│   └── events.jsonl      # Append-only structured log
├── .github/workflows/
│   └── security.yml      # Composer + npm + Trivy scan
├── docker-compose.yml
├── ARCHITECTURE.md
└── agent-log.md          # Human-readable agent run log
```

---

## 📖 Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) — System design, agent flow diagrams, model router, approval gate
- [agent-log.md](./agent-log.md) — Chronicle of agent actions during the qualifier build

---

## 🔐 Security

Every push triggers the security gate:
1. `composer audit` — PHP dependency vulnerability check
2. `npm audit` — Node dependency vulnerability check  
3. Trivy filesystem scan — Container + file system CVEs

Results are uploaded as GitHub Actions artifacts and reported by Hermes in `#sprint-main`.

---

## 👤 Author

Built by **Mehul** for the NMG Labs Forge 2 Qualifier.
