@echo off
cd /d "%~dp0"
echo ============================
echo    Nova Bot - Build Release
echo ============================
echo.
node scripts/build-release.js
echo.
pause
