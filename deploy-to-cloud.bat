@echo off
echo.
echo =====================================================
echo  ☁️ Khan Automobiles - Cloud Deployment Helper
echo =====================================================
echo.

REM Check if Git is installed
where git >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Git is not installed!
    echo.
    echo 📥 Please install Git first:
    echo    1. Go to: https://git-scm.com/download/win
    echo    2. Download and install Git
    echo    3. Restart this script after installation
    echo.
    pause
    exit /b 1
)

echo ✅ Git is installed
git --version

REM Check if this is already a Git repository
if not exist ".git" (
    echo.
    echo 📁 Initializing Git repository...
    git init
    
    echo 📄 Adding files to Git...
    git add .
    
    echo 💾 Creating initial commit...
    git commit -m "Initial commit - Khan Automobiles Cloud Ready"
    
    echo ✅ Git repository initialized successfully!
) else (
    echo ✅ Git repository already exists
    
    echo 📄 Adding any new changes...
    git add .
    
    echo 💾 Committing changes...
    git commit -m "Updated for cloud deployment - %date% %time%"
)

echo.
echo =====================================================
echo  🚀 DEPLOYMENT OPTIONS
echo =====================================================
echo.
echo 1. Railway (Recommended - ₹500-1500/month)
echo    - Fastest setup (15 minutes)
echo    - Auto-deployment
echo    - Global CDN
echo.
echo 2. Render (Free tier available)
echo    - Start free, upgrade later
echo    - Easy scaling
echo    - Great for testing
echo.
echo 3. Heroku (Industry standard)
echo    - Rich ecosystem
echo    - Extensive documentation
echo    - Enterprise grade
echo.
echo =====================================================

set /p choice="Choose deployment option (1-3): "

if "%choice%"=="1" (
    echo.
    echo 🚂 RAILWAY DEPLOYMENT STEPS:
    echo.
    echo 1. Go to: https://railway.app
    echo 2. Sign up with GitHub
    echo 3. Create new project
    echo 4. Connect this repository
    echo 5. Deploy automatically
    echo.
    echo 📋 Environment Variables to set in Railway:
    echo    NODE_ENV = production
    echo    DATA_DIR = /app/data
    echo.
    start https://railway.app
) else if "%choice%"=="2" (
    echo.
    echo 🎨 RENDER DEPLOYMENT STEPS:
    echo.
    echo 1. Go to: https://render.com
    echo 2. Sign up with GitHub
    echo 3. New Web Service
    echo 4. Connect repository
    echo 5. Configure build settings
    echo.
    echo 📋 Configuration:
    echo    Build Command: npm install
    echo    Start Command: npm start
    echo    Environment: NODE_ENV=production
    echo.
    start https://render.com
) else if "%choice%"=="3" (
    echo.
    echo 🟪 HEROKU DEPLOYMENT STEPS:
    echo.
    echo 1. Install Heroku CLI: https://devcenter.heroku.com/articles/heroku-cli
    echo 2. Run: heroku login
    echo 3. Run: heroku create khan-automobiles-system
    echo 4. Run: git push heroku main
    echo.
    echo 📋 After CLI installation, run these commands:
    echo    heroku config:set NODE_ENV=production
    echo    heroku config:set DATA_DIR=/app/data
    echo.
    start https://devcenter.heroku.com/articles/heroku-cli
) else (
    echo.
    echo ❌ Invalid choice. Please run the script again.
)

echo.
echo =====================================================
echo  📁 Files prepared for cloud deployment:
echo =====================================================
echo.
echo ✅ server.js - Updated for cloud hosting
echo ✅ package.json - Added engines and scripts
echo ✅ .gitignore - Configured for Node.js
echo ✅ data/ - Your existing data will be preserved
echo.
echo 💡 Next steps:
echo 1. Push code to GitHub repository
echo 2. Connect repository to chosen cloud platform
echo 3. Set environment variables
echo 4. Deploy and test
echo.
echo 🌍 After deployment, your managers can access from anywhere!
echo    New URL will be like: https://your-app-name.railway.app
echo.
pause 