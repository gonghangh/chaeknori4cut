@echo off
chcp 65001 > nul
title 책놀이네컷 (Chaeknori 4-Cuts)
echo ==================================================
echo   🌿 책놀이네컷 (Chaeknori 4-Cuts) 포토부스 시작
echo ==================================================
echo.
echo 브라우저를 열고 로컬 서버를 실행합니다...
echo.

set PORT=8895
start http://localhost:%PORT%/

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0server.ps1" -Port %PORT%

pause
