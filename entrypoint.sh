#!/bin/sh
set -e

if [ ! -f /app/uploads/avatars/default.png ]; then
    mkdir -p /app/uploads/avatars
    cp /app/assets/default.png /app/uploads/avatars/default.png
fi

exec uvicorn app.app:main_app --host 0.0.0.0 --port 8000 --workers 2
