#!/bin/sh
set -e
if [ "${ALEMBIC_RUN_MIGRATIONS:-true}" = "true" ]; then
  retries=5
  while [ $retries -gt 0 ]; do
    if python -m alembic upgrade head; then
      break
    fi
    retries=$((retries - 1))
    if [ $retries -eq 0 ]; then
      echo "Alembic migrations failed after retries"
      exit 1
    fi
    echo "DB not ready, retrying in 5s..."
    sleep 5
  done
fi
exec python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 1