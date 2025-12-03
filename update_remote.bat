@echo off
echo ==========================================
echo      SAFI LAB - Update GitHub Repository
echo ==========================================
echo.
echo The current repository belongs to: AbdAllah-Amr-Ali
echo Your current user is: sfi7
echo.
echo You do not have permission to push to the old repository.
echo You need to create a NEW repository on your GitHub account (sfi7).
echo.
echo 1. Go to https://github.com/new
echo 2. Create a repository named "safi-lab" (or anything you like)
echo 3. Copy the HTTPS URL (e.g., https://github.com/sfi7/safi-lab.git)
echo.
set /p new_url="Paste the NEW Repository URL here: "

if "%new_url%"=="" (
    echo Error: URL cannot be empty.
    pause
    exit /b
)

:: Try to use system git, fallback to default path
set git_cmd=git
git --version >nul 2>&1
if %errorlevel% neq 0 (
    if exist "C:\Program Files\Git\cmd\git.exe" (
        set git_cmd="C:\Program Files\Git\cmd\git.exe"
    ) else (
        echo [ERROR] Git not found. Please install Git.
        pause
        exit /b
    )
)

echo.
echo Removing old remote...
%git_cmd% remote remove origin

echo Adding new remote: %new_url%
%git_cmd% remote add origin %new_url%

echo.
echo Pushing code to new repository...
%git_cmd% push -u origin master

echo.
echo Done!
pause
