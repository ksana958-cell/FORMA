@echo off
cd /d "%~dp0"
for %%F in ("app.js" "src\worker.js" "public\index.html" "public\app.js" "public\v2.js" "scripts\setup-telegram.mjs") do (
  if not exist %%F (
    echo MISSING %%F
    exit /b 1
  )
)
echo OK: folder structure is correct.
pause
