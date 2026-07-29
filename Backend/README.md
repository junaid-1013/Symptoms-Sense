# Symptoms Sense API (FastAPI Backend)

## Environment setup

Copy `.env.sample` to `.env` for local use and replace the database, JWT, and OpenAI placeholders. Set SMTP credentials to enable contact and medicine-reminder emails. The sample deliberately leaves mail credentials empty; the mailer logs a failure and skips delivery until they are configured.

`ENVIRONMENT` defaults to `development` when absent or blank. It is normalized to lowercase; `production` disables `/docs` and `/redoc`. Set `DEBUG=False` separately in production to disable SQL echo. The production Compose service sets both explicitly.

### Frontend connection

Copy `Frontend/.env.sample` to `Frontend/.env` when setting up a new checkout. `NEXT_PUBLIC_BACKEND_URL` must be a browser-accessible FastAPI URL including `/api/`, such as `http://localhost:8000/api/` locally or `https://api.example.com/api/` in production. Set it in the frontend host's build environment and rebuild after changing it; Next.js embeds public variables in the client bundle. Do not use a Docker-internal hostname for this browser URL.

Set backend `FRONTEND_URL` to the frontend's exact origin (scheme, host, and port, without a path), so CORS permits browser requests. MongoDB credentials, JWT signing secrets, and SMTP credentials must not be stored in frontend environment files. Backend `python-jose` remains required for JWT authentication.

### Mail configuration

- `MAILER_HOST` defaults to `smtp.gmail.com`; `MAILER_PORT` defaults to `587`.
- `MAILER_USE_TLS=True` enables STARTTLS. Use the SMTP provider's supported configuration.
- `MAILER_USERNAME` and `MAILER_PASSWORD` are required for delivery. For Gmail, supply an app password.
- `MAILER_FROM` is the sender address; when empty it uses `MAILER_USERNAME`.
- `CONTACT_EMAIL_TO` receives contact submissions; when empty it uses `MAILER_USERNAME`.

Contact requests queue background delivery; a successful API response does not confirm SMTP delivery. Verify delivery using a designated test mailbox during acceptance testing.

### Timezone and scheduler process

The sample and production Compose configuration explicitly use `DEFAULT_TIMEZONE=Asia/Karachi`. The Python fallback remains `UTC` if the variable is omitted. Reminder times are wall-clock times in this configured zone, not the browser's local zone.

At startup, the scheduler stays paused while active reminder jobs are inspected. Missing jobs are restored and stale time/timezone triggers are rebuilt from the saved weekday and clock time before execution resumes. If reconciliation fails, startup fails rather than running unverified schedules. Changing the timezone preserves the saved wall-clock time in the new zone; it does not preserve the old UTC instant. Inspect existing reminder records before changing a deployed timezone. Inactive/orphan job cleanup is still part of the pending scheduler consistency work.

The form reads the scheduling zone from public `GET /api/reminders/config`; reminder list items also include `timezone`, and confirmation emails label it explicitly. Times use minute precision: `HH:MM` is canonical and legacy `HH:MM:00` is normalized. Other seconds, ISO dates, and malformed times are rejected. Medicine names/types cannot be blank, dosage must be a positive integer, and at least one valid weekday is required.

Run exactly **one API worker and one API container/replica** while APScheduler runs inside the FastAPI lifespan. The existing entrypoint uses `--workers 1`; preserve that setting. Multiple processes must not share this job store without a separate scheduler ownership design. Jobs are stored in PostgreSQL and the scheduler creates its own job table at startup.

## Docker build and run

From the `Backend/` directory:

```bash
# Build the image
docker build -t symptoms-sense-api .

# Run with env file (do not bake .env into the image)
docker run -p 8000:8000 --env-file .env symptoms-sense-api
```

The container runs migrations on startup (`alembic upgrade head`) then starts Uvicorn with one worker. To skip migrations (e.g. when run elsewhere), set `ALEMBIC_RUN_MIGRATIONS=false`.

### Local dev with Docker Compose

```bash
docker compose up --build
```

This starts the API and a Postgres container. The API uses `DATABASE_URL=postgresql+psycopg2://postgres:postgres@postgres:5432/symptom_sense`. Ensure `.env` exists with other required vars (e.g. `SECRET_KEY`, `OPENAI_API_KEY`, `FRONTEND_URL`).

## AWS deployment (EC2 t3.micro / t3.small)

For the production Compose file, create a private `.env.production` from `.env.sample` and fill in real settings, including the production frontend origin. Also supply `ECR_REGISTRY`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, and `POSTGRES_DB` for Compose interpolation. Start it with:

```bash
docker compose --env-file .env.production -f docker-compose.production.yml up -d
```

Using `--env-file` supplies Compose interpolation variables as well as the service's `env_file`. Production Compose explicitly sets `ENVIRONMENT=production`, `DEBUG=false`, and defaults `DEFAULT_TIMEZONE` to `Asia/Karachi` unless overridden in its interpolation environment. Do not commit `.env.production`.

- **Compute:** One EC2 instance (t3.micro or t3.small). Install Docker, then either build the image on the instance (clone repo, `docker build -t symptoms-sense-api .`) or push from CI to ECR and pull on EC2.
- **Run:** `docker run -d -p 8000:8000 --restart unless-stopped --env-file /path/to/.env symptoms-sense-api` (or use ECR image and inject env via `--env` or SSM).
- **Secrets:** Do not bake `.env` into the image. Use a `.env` file on the host or AWS SSM Parameter Store / Secrets Manager and pass variables into `docker run`.
- **Database:** Use RDS PostgreSQL; set `DATABASE_URL` in env to the RDS endpoint. Optional: set `DB_POOL_SIZE=2` and `DB_MAX_OVERFLOW=3` on the container for a smaller connection footprint.
- **Health check:** `GET /health` for monitoring or ALB target group.

## Required environment variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection URL (e.g. `postgresql+psycopg2://user:pass@host:5432/db`) |
| `SECRET_KEY` | JWT signing secret |
| `OPENAI_API_KEY` | OpenAI API key |
| `FRONTEND_URL` | Allowed CORS origin (e.g. `https://your-frontend.com`) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GOOGLE_REDIRECT_URI` | Google OAuth2 (if used) |
| `DEBUG` | Optional; `True` for SQL echo and debug behavior |
| `DB_POOL_SIZE` | Optional; default `5` (use lower, e.g. `2`, on small EC2) |
| `DB_MAX_OVERFLOW` | Optional; default `10` (use lower, e.g. `3`, on small EC2) |
| `BCRYPT_ROUNDS` | Optional; default `12` (e.g. `10` in prod for less CPU) |
| `ALEMBIC_RUN_MIGRATIONS` | Optional; default `true`; set `false` to skip migrations in container |
