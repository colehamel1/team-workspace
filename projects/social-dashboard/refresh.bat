@echo off
cd /d "%~dp0"
py fetch_stats.py
if exist dashboard.html start "" dashboard.html
echo.
pause
