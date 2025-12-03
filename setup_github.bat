@echo off
echo ==========================================
echo      SAFI LAB - GitHub Setup Wizard
echo ==========================================
echo.

:: Check for Git
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Git is NOT installed or not in your PATH.
    echo Please install Git for Windows first: https://git-scm.com/download/win
    echo.
    pause
    exit /b
)

echo Git is installed! Now let's configure it.
echo.
set /p name="Enter your GitHub Name (e.g., SafiLab): "
set /p email="Enter your GitHub Email: "

git config --global user.name "%name%"
git config --global user.email "%email%"

echo.
echo Configuration saved!
echo.
echo Now we will try to connect to GitHub.
echo A browser window might open to ask for your password/permission.
echo.
pause

git push -u origin master

echo.
echo If you saw "Everything up-to-date" or a success message, you are ready!
pause
