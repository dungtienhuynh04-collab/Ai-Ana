@echo off
cd /d "%~dp0"
echo ============================
echo    Nova Bot - Start
echo ============================
echo.
npm run electron:dev
pause
