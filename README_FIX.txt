FORMA 2.3 - FIX FOR GITHUB / BOTHOST
===================================

This archive has 3 code files with exact required paths:
  package.json
  app.js
  src/worker.js

1. Extract this ZIP on your computer (do not upload the ZIP itself into GitHub).
2. Open your FORMA GitHub repository, main branch.
3. Replace package.json in repository ROOT with package.json from this archive.
4. Replace app.js in repository ROOT with app.js from this archive.
5. Replace worker.js INSIDE src directory with src/worker.js from this archive.
   IMPORTANT: DO NOT put worker.js in repository root.
6. Commit changes, then rebuild (redeploy) the app in BotHost from GitHub.
7. Reopen https://YOUR-DOMAIN/api/health and test Telegram Mini App.

DO NOT change BOT_TOKEN, OWNER_TELEGRAM_ID or webhook settings.
DO NOT upload API keys to GitHub. Keep them in BotHost environment variables.
DO NOT delete /app/data; it contains your SQLite data and private photos.
README_FIX.txt is just an instruction, not an app file. No need to upload it.
