@echo off
echo.
echo =====================================================
echo  🚗 Khan Automobiles - Secure Server Startup
echo =====================================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed!
    echo.
    echo 📥 Please install Node.js first:
    echo    1. Go to: https://nodejs.org
    echo    2. Download and install Node.js LTS version
    echo    3. Restart this script after installation
    echo.
    pause
    exit /b 1
)

echo ✅ Node.js detected
node --version
npm --version
echo.

REM Check if dependencies are installed
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo ❌ Failed to install dependencies
        pause
        exit /b 1
    )
    echo ✅ Dependencies installed successfully
    echo.
)

REM Setup database if it doesn't exist
if not exist "database\khan_automobiles.db" (
    echo 💾 Setting up database...
    call npm run setup
    if %errorlevel% neq 0 (
        echo ❌ Failed to setup database
        pause
        exit /b 1
    )
    echo ✅ Database setup complete
    echo.
)

echo 🚀 Starting Khan Automobiles Secure Server...
echo.
echo 📡 Server will be available at: http://localhost:3000
echo 🔑 Default Login: admin / [Password set via environment variable]
echo 🔐 ⚠️  CHANGE DEFAULT PASSWORD IMMEDIATELY!
echo.
echo 🛑 Press Ctrl+C to stop the server
echo.

REM Start the server
call npm start

pause 