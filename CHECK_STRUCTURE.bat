@echo off
cd /d "%~dp0"
if not exist "src\worker.js" echo MISSING src\worker.js & exit /b 1
if not exist "public\index.html" echo MISSING public\index.html & exit /b 1
if not exist "public\app.js" echo MISSING public\app.js & exit /b 1
if not exist "scripts\setup-telegram.mjs" echo MISSING scripts\setup-telegram.mjs & exit /b 1
echo OK: folder structure is correct.
pause
