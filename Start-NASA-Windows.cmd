@echo off
where py >nul 2>nul
if errorlevel 1 goto fallback
py -3 "%~dp0launcher.py" %*
if errorlevel 1 pause
exit /b
:fallback
where python >nul 2>nul
if errorlevel 1 goto missing
python "%~dp0launcher.py" %*
if errorlevel 1 pause
exit /b
:missing
echo Python 3 is required for NASA reports. Install Python 3 or open index.html for offline play.
pause
exit /b 1
