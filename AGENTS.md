# AGENTS.md

## Workflow
- After every task/milestone is complete, commit the changes and push to the `main` branch of `origin` (git@github.com:alisatechstudio/livesportstv.git).
- Use a concise, descriptive commit message that matches the repo's `initial` style if unclear.
- Always run `git status` / `git diff` before committing; only stage intended project files. Never commit secrets or keys.

## Project
- Python Flask webapp served at `livesportstv.store` (CNAME present).
- Entry point: `app.py` (the FreeTV clone). Static assets: `static/css/freetv.css`, `static/js/freetv.js`.
- Server-side M3U caching via `/api/channels` route with 1-hour TTL in `cache/` directory.
- Templates: `templates/base.html`, `templates/index.html` (Jinja2).
- Country metadata: fetched from iptv-org API (`https://iptv-org.github.io/api/countries.json`).
- Player: HLS.js (with native HLS fallback in Safari).
- Ad monetization: Google AdSense + multiple ad network scripts embedded in base.html.
- Run with: `python app.py` or `gunicorn app:app` for production.
