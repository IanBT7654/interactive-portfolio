@echo off
cd /d %~dp0

echo Finding the most recently modified file...

REM Use PowerShell to get the latest modified file
for /f "usebackq delims=" %%f in (`powershell -Command "Get-ChildItem -Recurse -File | Sort-Object LastWriteTime -Descending | Select-Object -First 1 | Select-Object -ExpandProperty FullName"`) do (
    set "lastFile=%%f"
)

if not defined lastFile (
    echo ❌ No file found to commit.
    pause
    exit /b
)

echo Adding: %lastFile%
git add "%lastFile%"

REM Optional: ask for commit message
set /p commitMsg=Enter commit message (or leave blank for auto): 
if "%commitMsg%"=="" set commitMsg=Auto commit of %lastFile% - %DATE% %TIME%

git commit -m "%commitMsg%"
git push

pause
