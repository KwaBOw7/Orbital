@echo off
where py >nul 2>nul
if errorlevel 1 goto fallback
py -3 "%~dp0launcher.py" %*
set "ORBITAL_RESULT=%ERRORLEVEL%"
if not "%ORBITAL_RESULT%"=="0" pause
exit /b %ORBITAL_RESULT%
:fallback
where python >nul 2>nul
if errorlevel 1 goto missing
python "%~dp0launcher.py" %*
set "ORBITAL_RESULT=%ERRORLEVEL%"
if not "%ORBITAL_RESULT%"=="0" pause
exit /b %ORBITAL_RESULT%
:missing
echo Python 3 is required to verify NASA data and start ORBITAL.
pause
exit /b 1
