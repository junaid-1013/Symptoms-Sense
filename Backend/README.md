# Symptoms Sense API

FastAPI backend for Symptoms Sense: authentication, doctors and clinics, appointments, medicine reminders, and the AI chat assistant.

## Requirements

- Python 3.11+ (Docker image uses 3.12)
- PostgreSQL 14+
- An OpenAI API key

## Setup

```bash
cd Backend
python -m venv venv && source venv/bin/activate     # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.sample .env                                 # then edit the values below
alembic upgrade head
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

- Health check: `GET http://127.0.0.1:8000/health`
- Interactive docs: `http://127.0.0.1:8000/docs` (disabled when `ENVIRONMENT=production`)
- Run **one** Uvicorn worker. The reminder scheduler runs inside the app process, and Uvicorn does not apply migrations for you, so run `alembic upgrade head` first.

## Configuration

Copy [`.env.sample`](.env.sample) to `.env`. Never commit `.env`.

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | yes | e.g. `postgresql+psycopg2://user:pass@localhost:5432/symptom-sense` |
| `SECRET_KEY` | yes | JWT signing secret. Generate one, e.g. `openssl rand -hex 32` |
| `OPENAI_API_KEY` | yes | Used by the chat assistant |
| `FRONTEND_URL` | yes | Exact frontend origin for CORS, e.g. `http://localhost:3000` |
| `ENVIRONMENT` | no | `development` (default) or `production` |
| `DEFAULT_TIMEZONE` | no | Time zone for reminder times, e.g. `Asia/Karachi` (default `UTC`) |
| `MAILER_USERNAME`, `MAILER_PASSWORD` | no | SMTP login for contact and reminder emails. Without them emails are skipped and a failure is logged |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` | no | Enable Google sign-in (set all three) |

All other options (mail host and port, token lifetimes, pool sizes, avatar storage) are listed in `.env.sample` and in the [operations guide](../docs/backend-operations.md).

## Project layout

```
app/
├── main.py, api.py        App factory and router registration
├── core/                  Config, security, mailer, email templates, scheduler
├── db/, models/           SQLAlchemy base, session and models
├── auth/, onboarding/     Sign-in, registration, patient/doctor/clinic profiles
├── doctors/, clinics/, schedules/, appointments/, patients/, prescriptions/
├── reminders/             Medicine reminders and their scheduled jobs
├── feedback/, contact/    Testimonials and the contact form
├── medical_chat/          AI assistant: agent loop, tools, saved conversations
└── services/              Symptom reasoning and doctor suggestions
alembic/                   Migrations
tests/                     pytest suite
```

Each feature module follows `controller.py` (routes), `service.py` (logic) and `schema.py` (Pydantic models).

## The chat assistant

`app/medical_chat/agent.py` runs an OpenAI function-calling loop over the tools in `tools.py` (search doctors, get slots, assess symptoms, propose booking / cancel / reschedule / reminder, list appointments and reminders). Write tools only create a *pending action*. It is committed by `POST /api/medical-chat/conversations/{id}/actions/{action_id}/confirm`, never by the model. The patient and user ids always come from the access token, not from model output.

## Database migrations

```bash
alembic revision --autogenerate -m "describe the change"   # review the generated file
alembic upgrade head
alembic downgrade -1                                       # undo the last migration
```

Commit the migration file with the model change that needs it.

## Tests

```bash
python -m pytest tests -q        # pytest is included in requirements.txt
```

Tests use disposable SQLite databases and fake OpenAI clients, so they need no network, Postgres or real keys (set dummy `DATABASE_URL`, `SECRET_KEY`, `OPENAI_API_KEY` if your shell has none).

## Docker

```bash
docker compose up --build          # API plus a Postgres container
```

For image builds, AWS notes, mail, timezone and avatar storage, see the [operations guide](../docs/backend-operations.md).
