@echo off
cd /d "%~dp0"
if exist "release\win-unpacked\Nova Bot.exe" (
    start "" "release\win-unpacked\Nova Bot.exe"
) else (
    echo Exe not found. Run: npm run dist
    pause
)
