// Configuration file for Khan Automobiles Secure System
// IMPORTANT: In production, use environment variables instead of hardcoded values

module.exports = {
    // Security Configuration
    jwt: {
        secret: process.env.JWT_SECRET || 'KhanAuto_2024_SecureKey_9876543210_ProductionReady',
        expiresIn: '30m'
    },
    
    session: {
        secret: process.env.SESSION_SECRET || 'KhanAuto_Session_SuperSecure_Key_2024_Business',
        timeout: parseInt(process.env.SESSION_TIMEOUT) || 1800000, // 30 minutes
        cookieMaxAge: parseInt(process.env.COOKIE_MAX_AGE) || 1800000
    },
    
    // Database Configuration
    database: {
        path: process.env.DB_PATH || './database/khan_automobiles.db',
        backupPath: process.env.DB_BACKUP_PATH || './database/backups/'
    },
    
    // Server Configuration
    server: {
        port: process.env.PORT || 3000,
        environment: process.env.NODE_ENV || 'production',
        trustProxy: process.env.TRUST_PROXY === 'true'
    },
    
    // Security Settings
    security: {
        bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,
        maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5,
        loginAttemptsWindow: parseInt(process.env.LOGIN_ATTEMPTS_WINDOW) || 15, // minutes
        apiRateLimit: parseInt(process.env.API_RATE_LIMIT) || 100,
        apiRateWindow: parseInt(process.env.API_RATE_WINDOW) || 15 // minutes
    },
    
    // Default Admin Credentials (SET VIA ENVIRONMENT VARIABLES!)
    defaultAdmin: {
        username: process.env.DEFAULT_ADMIN_USERNAME || 'admin',
        email: process.env.DEFAULT_ADMIN_EMAIL || 'admin@khanautomobiles.com',
        password: process.env.ADMIN_PASSWORD || '[SET_ADMIN_PASSWORD_ENV_VAR]'
    },
    
    // Business Information
    business: {
        name: process.env.BUSINESS_NAME || 'Khan Automobiles',
        email: process.env.BUSINESS_EMAIL || 'khanautomobiles1998@gmail.com',
        phone: process.env.BUSINESS_PHONE || '+91 9118819531'
    },
    
    // Allowed origins for CORS
    cors: {
        origins: ['http://localhost:3000', 'http://127.0.0.1:3000']
    }
}; 