@echo off
cd /d %~dp0
echo Looking for modified files...

REM Use PowerShell to find files modified in last 12 hours
powershell -Command "Get-ChildItem -Recurse -File | Where-Object { $_.LastWriteTime -gt (Get-Date).AddHours(-12) } | ForEach-Object { $_.FullName }" > files.txt

REM Add them to git
for /f "delims=" %%f in (files.txt) do (
    git add "%%f"
)

REM Clean up the temp file
del files.txt

REM Create default commit message with timestamp
set commitMsg=Auto commit - %DATE% %TIME%

git commit -m "%commitMsg%"
git push

pause

