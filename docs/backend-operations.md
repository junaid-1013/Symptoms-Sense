# Backend operations guide

Deep-dive notes for running and deploying the API: environment, mail, reminders, avatars, Docker and AWS. For a quick start see [Backend/README.md](../Backend/README.md).

## Environment setup

Copy `.env.sample` to `.env` for local use and replace the database, JWT, and OpenAI placeholders. Set SMTP credentials to enable contact and medicine-reminder emails. The sample deliberately leaves mail credentials empty; the mailer logs a failure and skips delivery until they are configured.

### Local venv and Uvicorn

The local development setup uses `Backend/venv` and a locally accessible PostgreSQL database. From `Backend/`, after creating `.env` and installing `requirements.txt` into the venv, run:

```bash
source venv/bin/activate
alembic upgrade head
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Check `http://127.0.0.1:8000/health` before starting the frontend. Uvicorn starts the reminder scheduler through the FastAPI lifespan, but does **not** run Alembic automatically; apply migrations explicitly before starting it. Run one Uvicorn worker so only one process owns the scheduler. Local avatar uploads default to `Backend/uploads/avatars`, which is ignored by Git; keep that directory when preserving uploaded profile photos. The Docker instructions below apply only when choosing a container deployment.

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

At startup, the scheduler stays paused while reminder jobs are inspected. Missing active jobs are restored; stale time/timezone triggers and legacy email payloads are replaced; jobs for inactive, deleted, or missing reminders are removed. Unrelated jobs are preserved. If reconciliation fails, startup fails rather than running unverified schedules. Changing the timezone preserves the saved wall-clock time in the new zone; it does not preserve the old UTC instant. Inspect existing reminder records before changing a deployed timezone.

The form reads the scheduling zone from public `GET /api/reminders/config`; reminder list items also include `timezone`, and confirmation emails label it explicitly. Times use minute precision: `HH:MM` is canonical and legacy `HH:MM:00` is normalized. Other seconds, ISO dates, and malformed times are rejected. Medicine names/types cannot be blank, dosage must be a positive integer, and at least one valid weekday is required.

### Reminder persistence and failure handling

New reminders are saved inactive, registered with the job store, then activated. Registration or activation failure returns 503, attempts to soft-delete the inactive record and remove any partial job, and sends no added confirmation. An interrupted creation can leave an inactive record; it is excluded from the active list and its job is removed at reconciliation.

Scheduled jobs contain only a reminder ID. Each execution reads the current reminder, medicine details, and patient email from the database. Missing, inactive, or deleted reminders and unavailable patient/user accounts do not receive email. The legacy serialized function remains loadable for migration but will not send email from an old cached payload.

Deletion verifies ownership and persists deactivation before removing the job. A job-store cleanup failure is logged and retried on a repeated delete or the next startup; the stale job cannot pass the database activity check. Repeated deletes succeed without sending duplicate removal confirmations. SMTP failures are logged separately and do not undo a successful create/delete. Confirmation emails are best-effort background tasks, not durable delivery guarantees.

Cancellation cannot recall an email whose delivery has already passed the active-state check. SMTP delivery is not transactional with the application database. Keep the single-process scheduler restriction below.

Run exactly **one API worker/process** while APScheduler runs inside the FastAPI lifespan, whether using local Uvicorn or a container. The Docker entrypoint uses `--workers 1`; preserve that setting. Multiple processes must not share this job store without a separate scheduler ownership design. Jobs are stored in PostgreSQL and the scheduler creates its own job table at startup.

## Profile editing and avatar storage

`PATCH /api/auth/me` updates the authenticated user's name (2–100 characters after trimming). Other fields are rejected, and the existing avatar and authentication fields are preserved. `POST /api/auth/me/avatar` accepts an optional multipart `avatar` upload separately. Both endpoints derive ownership from the access token. The frontend updates cached user details without replacing tokens or reloading the page. If an image upload fails after the name was saved, it reports that partial outcome and lets the user retry.

Avatar uploads accept JPEG, PNG, or WebP up to 2 MB and 16 megapixels. Pillow validates and re-encodes images as WebP, strips source metadata, and resizes them to fit 1024×1024. Only a generated filename is used; client filenames are discarded. The database stores the public URL. Files are served publicly at `/api/auth/avatars/{filename}` because profile avatars also appear in public testimonials/reviews. Google sign-in copies a Google-hosted profile picture into the same storage when there is no custom avatar, and preserves a user-uploaded image on later sign-ins. If Google's image cannot be copied, sign-in still succeeds and the UI displays an avatar fallback when needed.

Locally, files default to `Backend/uploads/avatars`. In Docker, `AVATAR_STORAGE_DIR=/app/uploads/avatars` lives under the named uploads volume mounted at `/app/uploads` in both Compose configurations. The image creates that directory with ownership for the non-root app user. For a plain `docker run`, add `--mount source=symptoms-sense-uploads,target=/app/uploads` and `-e AVATAR_STORAGE_DIR=/app/uploads/avatars`; without a volume, container recreation loses uploads. Back up the uploads volume alongside PostgreSQL, and do not remove it with `docker compose down -v` if its data is needed.

Set `PUBLIC_BACKEND_URL` to the externally accessible backend origin without `/api` (local default: `http://localhost:8000`). Production Compose requires it explicitly. Configure the reverse proxy to serve the avatar route and allow a multipart request slightly above 2 MB; the application validates the file limit. Existing URLs should remain reachable if the origin changes. Replaced avatar files are retained so old URLs remain valid; file retention/cleanup is not automated. Files created by a failed database update are removed.

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

> The production Compose file is a deployment-specific template and is not part of this repository. The steps below describe what it contains so you can write your own for your environment.

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
