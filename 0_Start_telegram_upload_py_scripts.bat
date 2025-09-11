@echo off
cd /d "%~dp0"  REM Change to the directory of the batch file

REM Run the first Python script (relative path, no need to repeat the directory)
start cmd /k "python testbot.py"


