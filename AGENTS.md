# AGENTS.md

## Workflow
- After every task/milestone is complete, commit the changes and push to the `main` branch of `origin` (git@github.com:alisatechstudio/livesportstv.git).
- Use a concise, descriptive commit message that matches the repo's `initial` style if unclear.
- Always run `git status` / `git diff` before committing; only stage intended project files. Never commit secrets or keys.

## Project
- Static site served at `livesportstv.store` (CNAME present).
- Entry point: `index.html` (the FreeTV clone). Assets: `freetv.css`, `freetv.js`.
- Channel/stream data: fetched at runtime from iptv-org public M3U (`https://iptv-org.github.io/iptv/index.m3u`).
- Country metadata: fetched from iptv-org API (`https://iptv-org.github.io/api/countries.json`).
- Player: HLS.js (with native HLS fallback in Safari).
