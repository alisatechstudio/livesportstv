# AGENTS.md

## Workflow
- After every task/milestone is complete, commit the changes and push to the `main` branch of `origin` (git@github.com:alisatechstudio/livesportstv.git).
- Use a concise, descriptive commit message that matches the repo's `initial` style if unclear.
- Always run `git status` / `git diff` before committing; only stage intended project files. Never commit secrets or keys.

## Project
- PHP site served at `livesportstv.store` (CNAME present).
- Entry point: `index.php` (the FreeTV clone). Assets: `freetv.css`, `freetv.js`.
- Server-side M3U caching via `api/channels.php` with 1-hour TTL in `cache/` directory.
- PHP includes: `includes/header.php`, `includes/footer.php`, `includes/config.php`.
- Country metadata: fetched from iptv-org API (`https://iptv-org.github.io/api/countries.json`).
- Player: HLS.js (with native HLS fallback in Safari).
- URL rewriting via `.htaccess` for Apache.
