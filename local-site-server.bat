@echo off
setlocal

set "SITE_DIR=%~dp0static-site"
set "NODE_EXE=C:\Users\Jigg Salazar\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"

cd /d "%SITE_DIR%"

if exist "%NODE_EXE%" (
  "%NODE_EXE%" static-server.js
) else (
  node static-server.js
)
