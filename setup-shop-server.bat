@echo off
echo.
echo =====================================================
echo  🚗 Khan Automobiles - Dedicated Shop Server Setup
echo =====================================================
echo.

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ Error: package.json not found!
    echo.
    echo Please run this script from the Khan Automobiles project directory
    echo Example: C:\Users\YourName\khan-automobiles-website
    echo.
    pause
    exit /b 1
)

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

REM Create data directory if it doesn't exist
if not exist "data" (
    echo 📁 Creating data directory...
    mkdir data
    echo ✅ Data directory created
    echo.
)

echo 🔐 SECURITY NOTICE:
echo =====================================
echo This system uses ENVIRONMENT VARIABLES for secure password management.
echo.
echo ⚠️  BEFORE PRODUCTION DEPLOYMENT:
echo    1. Set ADMIN_PASSWORD environment variable
echo    2. Use a strong password (12+ characters)
echo    3. Never use default passwords in production
echo.
echo 💡 For development, default password will be used
echo 🔒 For production, set: ADMIN_PASSWORD=YourSecurePassword123!
echo.

echo 🚀 Starting Khan Automobiles Shop Server...
echo.
echo 📡 Server will be available at: http://localhost:3000
echo 🔑 Login Credentials:
echo    Username: admin
echo    Password: [Set via ADMIN_PASSWORD environment variable]
echo.
echo 🛑 Press Ctrl+C to stop the server
echo.

REM Start the server
call npm start

pause 