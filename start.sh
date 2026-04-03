#!/usr/bin/env bash
set -e

# Root start script for Railpack / Railway
# - Start backend FastAPI service
# - If you want to run frontend from one container, adjust accordingly

cd backend

# Install dependencies if they are not already installed (optional for some platforms)
# Uncomment if needed:
# pip install -r requirements.txt

exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
