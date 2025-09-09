@echo off
cd /d %~dp0

echo Adding changes...
git add index.html

echo Committing...
git commit -m "Auto: update index.html"

echo Pushing to GitHub...
git push

pause
