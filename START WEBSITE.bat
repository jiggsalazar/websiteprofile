@echo off
cd /d "%~dp0static-site"
start "" http://127.0.0.1:8765/
node static-server.js
pause
