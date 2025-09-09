@echo off
cd /d %~dp0
echo 💡 Syncing local repo and force pushing to GitHub...

REM Stage everything, including deletions
git add -A

REM Optional: Let user enter commit message
set /p commitMsg=Enter commit message (or leave blank for auto): 
if "%commitMsg%"=="" set commitMsg=Force sync with GitHub - %DATE% %TIME%

git commit -m "%commitMsg%"

REM Force push to remote
git push --force origin main

pause
