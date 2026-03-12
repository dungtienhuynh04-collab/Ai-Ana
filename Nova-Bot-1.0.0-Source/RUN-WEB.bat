@echo off
cd /d "%~dp0"
echo Starting Nova Bot...
start "" cmd /c "timeout /t 4 /nobreak >nul && start http://localhost:5173"
npm run dev:web
pause
