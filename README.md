# TRUSTRACE — Zero-Trust Explainable AI Assistant (v2.0)

**Tagline**: *Ask. Trace. Verify.*

TRUSTRACE is a production-quality Zero-Trust Explainable AI Assistant built for enterprises. It enforces strict attribute-based access control (ABAC) and role-level security **BEFORE** information reaches the AI model context.

---

## 🛡️ Core Security Invariant

> **"Restricted information must never enter the LLM context."**

Every query computes a **Context Manifest** containing the exact chunk IDs sent to the model. The computed metric `Restricted Chunks Sent To LLM` must **ALWAYS equal 0**. If it ever exceeds 0, the system automatically:
1. Revokes the context manifest (`CRITICAL_VIOLATION`)
2. Zeros out the Trust Score (0 / 100)
3. Raises a Critical SOC Incident event

---

## 🚀 Delivery Modes & Configuration

TRUSTRACE supports two delivery modes configured via environment variable (`VITE_API_MODE`):

- **DEMO MODE (`VITE_API_MODE=mock`)**: Complete, working frontend with a real Zero-Trust policy engine running against seeded enterprise data behind MSW (Mock Service Worker). Includes demo login role-switcher with a "Demo login" badge.
- **PRODUCTION MODE (`VITE_API_MODE=live`)**: Identical API contract served by a production FastAPI Python backend with PostgreSQL 16 + pgvector Row-Level Security (RLS) policies.

---

## 💻 Tech Stack & Design System

- **Frontend**: React 18, TypeScript (Strict), Vite, Tailwind CSS, Framer Motion, Lucide Icons, Recharts, React Router v6, TanStack Query v5, Zustand, MSW, Vitest.
- **Design System**: Dark Cybersecurity Enterprise Aesthetic (`#0B1020` Background, `#111936` Surface, `#172242` Glass Cards, `#4F46E5` Brand Indigo, `#7C3AED` Accent Purple, `#10B981` Success Emerald, `#EF4444` Threat Danger).
- **Backend Scaffolding**: Python FastAPI, PostgreSQL 16 (`pgvector` & HNSW Indexing), Redis, ClickHouse audit schemas.

---

## 📁 16 Complete Pages & Features

1. **Login (`/login`)**: Glass role picker cards (Finance Intern, Finance Manager, CEO/Admin) with permission summaries and "Demo login" badge.
2. **Dashboard (`/`)**: Real-time KPI cards, Query Activity area chart, Security Events stacked bar chart, Department Access donut, Recent Hash-Chain Audit activity feed, and Trust Score Widget.
3. **AI Chat (`/chat`)**: Streaming prompt interface, suggested prompts, conversation memory sidebar, Trust Score ring, Permission Verified badge, clickable Sources Used chips, and 1-line Security Strip.
4. **Prove Answer (`/prove/:queryId`)**: Itemized evidence breakdown, matched snippet highlights, confidence scores, classification badges, and PDF Evidence Report export.
5. **Trust Trace (`/trace/:queryId`)**: Vertical animated pipeline (Question -> User -> Gate 1 Permission Filter -> Documents Searched -> Authorized/Blocked Sources -> Gate 2 Context Manifest -> Gate 3 Output Guard -> Answer Generated) with SHA-256 Hash Viewer.
6. **Security Center (`/security`)**: SOC metrics, threat analytics, user risk leaderboard, and Immutable Append-Only Hash-Chained Audit Log table with CSV export and Hash-Chain Integrity Verification.
7. **Attack Simulator (`/simulator`)**: Adversarial attack sandbox (Direct Prompt Injection, Role Spoofing, Base64 Payloads, Indirect Chunk Injection, Aggregation Attacks, Canary Probes) plus a 50+ Red-Team Automated Test Suite.
8. **Document Management (`/documents`)**: Upload simulation with 6 processing stages, metadata table, Public/Confidential/Restricted badges, and ACL Permission Editor Drawer.
9. **Conflict Detection (`/conflicts`)**: Metric version discrepancy detector (e.g., Q2 Revenue ₹48.2 Cr vs ₹46.8 Cr) with side-by-side comparison and authoritative source resolution.
10. **AI Forensics (`/forensics/:queryId`)**: Replay view with What-If role simulation engine and signed forensic report export.
11. **Policy Studio (`/policies`)**: Declarative ABAC policy rules editor and "Why Was I Denied?" explainer tool.
12. **Access Requests (`/requests`)**: Time-bound access request creation form and approval workflow table.
13. **Users & Roles (`/admin/users`)**: Identity management table with clearance levels, session IP tracking, and revoke access actions.
14. **Compliance Reports (`/compliance`)**: SOC 2, GDPR, and DPDP compliance attestations and audit summary generator.
15. **Quality Lab (`/quality`)**: Continuous RAG evaluation (Faithfulness, Answer Relevance, Context Precision, Abstention Rate gauges) and latency/cost analytics.
16. **Settings & Integrations (`/settings`)**: Theme toggle, API mode toggle, SIEM Slack/Teams webhooks, and API keys management.

---

## 🛠️ Quick Start Instructions

```bash
# 1. Install dependencies
npm install

# 2. Run unit & policy tests
npm run test

# 3. Start development server
npm run dev

# 4. Build production bundle
npm run build
```

---

## ✉️ Employee invitation email (live mode)

The **Provision New Employee** button sends real email only in `VITE_API_MODE=live` with the FastAPI server running. In mock mode it creates a browser-only demo account and explicitly says *no email sent*.

1. Set `VITE_API_MODE=live` in the frontend `.env`; restart Vite after editing. During local development, Vite proxies `/api/v1` to FastAPI on `127.0.0.1:8000` so browser logins work without cross-origin cookies. For a deployed build, set `VITE_API_URL` to the deployed API URL and configure the appropriate `CORS_ORIGINS`/cookie settings.
2. Install backend packages: `python -m pip install -r backend/requirements.txt`.
3. Configure the **backend process environment** using `backend/.env.example` as a reference. These values are *not* read from the frontend `.env` or from `backend/.env.example` automatically. For example, in the PowerShell window that will start FastAPI, set `$env:ADMIN_EMAIL='owner@example.com'`, `$env:ADMIN_PASSWORD='<your-strong-password>'`, `$env:SMTP_USERNAME='your-sender@gmail.com'`, `$env:SMTP_PASSWORD='<your-Gmail-app-password>'`, `$env:APP_LOGIN_URL='http://localhost:3000/login'` (and optionally `SMTP_FROM`, `CORS_ORIGINS`). For Gmail, enable 2-Step Verification and create a Gmail **App Password** (not your normal Gmail password); SMTP host is `smtp.gmail.com`, port `587`. Keep secrets out of `VITE_*`, source control and the browser.
4. From `backend/`, start the API with `python -m uvicorn app.main:app --host 127.0.0.1 --port 8000`. Start the frontend with `npm run dev`, use **Admin Login** at the bottom-left of the Company Overview page (not the Employee Sign In portal), sign in using `ADMIN_EMAIL`/`ADMIN_PASSWORD`, open **User Admin Panel**, and enter the employee's real email address (including Gmail). You should see **Invitation emailed** only after SMTP accepts the message. If SMTP fails, no account is created; correct the error and retry.
5. Employees receive an email containing their username and a **unique temporary password**. Their account is saved in `backend/employees.sqlite3` (or `EMPLOYEE_DB_PATH`), so they can sign in from a different browser/device. First login requires a password change; the database stores only a salted password hash. Use HTTPS and `COOKIE_SECURE=true` when deployed; back up the SQLite file securely. `APP_LOGIN_URL` must be a URL that employees can actually reach, not localhost when used remotely.

The new employee email/login endpoints authenticate against this server database, but the **other FastAPI demo routes and frontend policy/data workflows remain demos**, not production authorization. Server-backed employee editing, revocation, and a full cross-device document/policy system are not implemented yet.

## 🔒 Security Gate Architecture

1. **Gate 1 (Pre-Retrieval)**: Permission filters applied *inside* vector & keyword queries (WHERE clause). Restricted documents are never retrieved first to be filtered afterwards.
2. **Gate 2 (Context Assembly)**: Re-verifies every chunk ID against the policy engine and constructs a Context Manifest with a SHA-256 cryptographic hash.
3. **Gate 3 (Output Guard)**: Scans generated text for PII/secret leaks and verifies all claims against cited chunks.
