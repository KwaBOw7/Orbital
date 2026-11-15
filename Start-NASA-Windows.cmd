@echo off
setlocal
where py >nul 2>nul
if errorlevel 1 goto fallback
py -3 "%~dp0launcher.py" --refresh-on-start %*
set "RESULT=%ERRORLEVEL%"
goto finished
:fallback
where python >nul 2>nul
if errorlevel 1 goto missing
python "%~dp0launcher.py" --refresh-on-start %*
set "RESULT=%ERRORLEVEL%"
:finished
if not "%RESULT%"=="0" pause
exit /b %RESULT%
:missing
echo Python 3 is required by Play. Install Python 3 or open index.html for offline play.
pause
exit /b 1
