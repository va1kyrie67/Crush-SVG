@echo off
title CrushSVG - Local Dev Server
cd /d "%~dp0"
echo Starting CrushSVG on http://localhost:3000 ...
start "" "http://localhost:3000"
npm run dev
pause