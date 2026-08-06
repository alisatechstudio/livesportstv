# AGENTS.md

## Workflow
- After every task/milestone is complete, commit the changes and push to the `main` branch of `origin` (git@github.com:alisatechstudio/livesportstv.git).
- Use a concise, descriptive commit message that matches the repo's `initial` style if unclear.
- Always run `git status` / `git diff` before committing; only stage intended project files. Never commit secrets or keys.

## Project
- Python Django webapp served at `livesportstv.store` (CNAME present).
- Entry point: `manage.py` (the FreeTV clone). Static assets: `static/css/freetv.css`, `static/js/freetv.js`.
- Django project package: `livesportstv/` (settings, urls, wsgi).
- Django app: `channels/` (views, urls, templates).
- Server-side M3U caching via `/api/channels` route with 1-hour TTL in `cache/` directory.
- Templates: `channels/templates/channels/base.html`, `channels/templates/channels/index.html` (Django templates).
- Country metadata: fetched from iptv-org API (`https://iptv-org.github.io/api/countries.json`).
- Player: HLS.js (with native HLS fallback in Safari).
- Ad monetization: Google AdSense + multiple ad network scripts embedded in base.html.
- Run with: `python manage.py runserver` for development or `gunicorn livesportstv.wsgi:application` for production.
