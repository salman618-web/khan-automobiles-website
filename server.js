const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Import Firebase service
const firestoreService = require('./firebase-config');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());

// CORS headers (restricted if ALLOWED_ORIGINS is set)
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (allowedOrigins.length > 0) {
        if (origin && allowedOrigins.includes(origin)) {
            res.header('Access-Control-Allow-Origin', origin);
        }
    } else {
        res.header('Access-Control-Allow-Origin', '*');
    }
    res.header('Vary', 'Origin');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Session-Token');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// Block public access to data directory
app.use((req, res, next) => {
    if (req.path.startsWith('/data')) {
        return res.status(403).send('Forbidden');
    }
    next();
});

// In-memory sessions using random tokens
const sessions = new Map(); // token -> { username, expiry }
const SESSION_TTL_MS = 1000 * 60 * 60 * 8; // 8 hours

function createSession(username) {
    const token = crypto.randomBytes(48).toString('hex');
    sessions.set(token, { username, expiry: Date.now() + SESSION_TTL_MS });
    return token;
}

function authMiddleware(req, res, next) {
    const token = req.get('X-Session-Token');
    const s = token && sessions.get(token);
    if (!s || s.expiry < Date.now()) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    req.user = { username: s.username };
    next();
}

// Rate limiter for login
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false
});

// Serve static files
app.use(express.static('./', {
    index: 'index.html'
}));

// Database Configuration - Hybrid approach (Firestore + JSON fallback)
const DATA_DIR = process.env.DATA_DIR || './data';
const SALES_FILE = path.join(DATA_DIR, 'sales.json');  
const PURCHASES_FILE = path.join(DATA_DIR, 'purchases.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

// Environment variables for backup data
const PERSISTENT_SALES_DATA = process.env.PERSISTENT_SALES_DATA;
const PERSISTENT_PURCHASES_DATA = process.env.PERSISTENT_PURCHASES_DATA;

console.log('🔧 Database Configuration:');
console.log(`   - Firestore available: ${firestoreService.isAvailable()}`);
console.log(`   - DATA_DIR: ${DATA_DIR}`);
console.log(`   - NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`   - Backup env vars available: ${!!PERSISTENT_SALES_DATA && !!PERSISTENT_PURCHASES_DATA}`);

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    console.log('📁 Created data directory:', DATA_DIR);
}

// Initialize data storage
let sales = [];
let purchases = [];
let users = [];

// Hybrid data loading - Firestore first, then fallbacks
async function loadData() {
    console.log('📖 Loading data from multiple sources...');
    
    try {
        // Try to load from Firestore first
        if (firestoreService.isAvailable()) {
            console.log('🔥 Using Firebase Firestore as primary database');
            
            try {
                // Load from Firestore
                sales = await firestoreService.getSales();
                purchases = await firestoreService.getPurchases();
                users = await firestoreService.getUsers();
                
                console.log(`🔥 Loaded from Firestore: ${sales.length} sales, ${purchases.length} purchases, ${users.length} users`);
                
                // If Firestore is empty but we have fallback data, migrate it
                if (sales.length === 0 && purchases.length === 0 && users.length === 0) {
                    console.log('🔄 Firestore is empty, checking for migration data...');
                    await migrateToFirestore();
                }
                
                return;
            } catch (firestoreError) {
                console.error('❌ Firestore loading failed:', firestoreError.message);
                console.log('🔄 Falling back to JSON storage...');
            }
        }
        
        // Fallback to environment variables or JSON files
        await loadFromFallback();
        
    } catch (error) {
        console.error('❌ Critical error loading data:', error);
        // Create minimal default data
        await createDefaultData();
    }
}

// Load from environment variables or JSON files
async function loadFromFallback() {
    // Load sales with environment variable fallback
    try {
        if (PERSISTENT_SALES_DATA) {
            sales = JSON.parse(PERSISTENT_SALES_DATA);
            console.log(`📈 Loaded ${sales.length} sales records from environment variable`);
        } else if (fs.existsSync(SALES_FILE)) {
            const salesData = fs.readFileSync(SALES_FILE, 'utf8');
            sales = JSON.parse(salesData);
            console.log(`📈 Loaded ${sales.length} sales records from file`);
        } else {
            sales = [];
            console.log('📈 No existing sales data - starting fresh');
        }
    } catch (error) {
        console.error('❌ Error loading sales:', error);
        sales = [];
    }
    
    // Load purchases with environment variable fallback
    try {
        if (PERSISTENT_PURCHASES_DATA) {
            purchases = JSON.parse(PERSISTENT_PURCHASES_DATA);
            console.log(`📉 Loaded ${purchases.length} purchase records from environment variable`);
        } else if (fs.existsSync(PURCHASES_FILE)) {
            const purchasesData = fs.readFileSync(PURCHASES_FILE, 'utf8');
            purchases = JSON.parse(purchasesData);
            console.log(`📉 Loaded ${purchases.length} purchase records from file`);
        } else {
            purchases = [];
            console.log('📉 No existing purchase data - starting fresh');
        }
    } catch (error) {
        console.error('❌ Error loading purchases:', error);
        purchases = [];
    }
    
    // Load users
    try {
        if (fs.existsSync(USERS_FILE)) {
            const usersData = fs.readFileSync(USERS_FILE, 'utf8');
            users = JSON.parse(usersData);
            console.log(`👥 Loaded ${users.length} user records`);
        } else {
            await createDefaultData();
        }
    } catch (error) {
        console.error('❌ Error loading users:', error);
        await createDefaultData();
    }
}

// Create default admin user
async function createDefaultData() {
    const defaultAdminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    console.log('👤 Creating default admin user...');
    console.log('🔧 Using ADMIN_PASSWORD from env:', !!process.env.ADMIN_PASSWORD);
    console.log('🔐 Password length:', defaultAdminPassword.length);
    
    users = [
        {
            id: '1',
            username: 'admin',
            password: defaultAdminPassword,
            role: 'admin',
            created_at: new Date().toISOString()
        }
    ];
    
    console.log('✅ Default admin user created:', { 
        username: users[0].username, 
        role: users[0].role,
        passwordLength: users[0].password.length 
    });
    
    // Save to Firestore if available, otherwise to file
    if (firestoreService.isAvailable()) {
        try {
            await firestoreService.addUser(users[0]);
            console.log('👥 Created default admin user in Firestore');
        } catch (error) {
            console.error('❌ Error creating default user in Firestore:', error);
            saveUsers(); // Fallback to file
        }
    } else {
        saveUsers();
        console.log('👥 Created default admin user in file');
    }
}

// Migrate existing data to Firestore
async function migrateToFirestore() {
    if (!firestoreService.isAvailable()) {
        console.log('🔄 Firestore not available, skipping migration');
        return;
    }
    
    try {
        // Load fallback data first
        await loadFromFallback();
        
        if (sales.length > 0 || purchases.length > 0 || users.length > 0) {
            console.log('🔄 Found existing data, migrating to Firestore...');
            await firestoreService.migrateData(sales, purchases, users);
            
            // Reload from Firestore to get new IDs
            sales = await firestoreService.getSales();
            purchases = await firestoreService.getPurchases();
            users = await firestoreService.getUsers();
            
            console.log('✅ Migration completed successfully!');
        } else {
            console.log('📭 No existing data to migrate');
        }
    } catch (error) {
        console.error('❌ Migration failed:', error);
    }
}

// Save functions (fallback for when Firestore is not available)
function saveSales() {
    try {
        const data = JSON.stringify(sales, null, 2);
        fs.writeFileSync(SALES_FILE, data, 'utf8');
        console.log(`💾 Saved ${sales.length} sales records to ${SALES_FILE}`);
        
        if (process.env.NODE_ENV === 'production' && !PERSISTENT_SALES_DATA) {
            console.log('⚠️  WARNING: Consider using Firestore for permanent data persistence');
        }
    } catch (error) {
        console.error('❌ Error saving sales:', error);
    }
}

function savePurchases() {
    try {
        const data = JSON.stringify(purchases, null, 2);
        fs.writeFileSync(PURCHASES_FILE, data, 'utf8');
        console.log(`💾 Saved ${purchases.length} purchase records to ${PURCHASES_FILE}`);
        
        if (process.env.NODE_ENV === 'production' && !PERSISTENT_PURCHASES_DATA) {
            console.log('⚠️  WARNING: Consider using Firestore for permanent data persistence');
        }
    } catch (error) {
        console.error('❌ Error saving purchases:', error);
    }
}

function saveUsers() {
    try {
        const data = JSON.stringify(users, null, 2);
        fs.writeFileSync(USERS_FILE, data, 'utf8');
        console.log(`💾 Saved ${users.length} user records to ${USERS_FILE}`);
    } catch (error) {
        console.error('❌ Error saving users:', error);
    }
}

// API Routes

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        service: 'Khan Automobiles API',
        adminPasswordSet: !!process.env.ADMIN_PASSWORD
    });
});

// Simple login endpoint (rate-limited)
app.post('/api/login', loginLimiter, async (req, res) => {
    try {
        const { username, password } = req.body;
        console.log('🔐 Login request received:', { username });

        let user = null;
        
        if (firestoreService.isAvailable()) {
            // Try Firestore first
            try {
                user = await firestoreService.getUserByUsername(username);
            } catch (error) {
                console.error('Firestore login error:', error);
            }
        }
        
        // Fallback to local users array
        if (!user) {
            user = users.find(u => u.username === username);
        }
        
        console.log('👤 User found:', !!user);
 
        const adminPw = process.env.ADMIN_PASSWORD;
        const passwordMatch = (user && user.password === password) || (adminPw && password === adminPw);
        if (user && passwordMatch) {
            const token = createSession(user.username || username);
            res.json({
                success: true,
                message: 'Login successful',
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    role: user.role
                }
            });
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Protect all API routes except health and login
app.use('/api', (req, res, next) => {
    if (req.path === '/health' || req.path === '/login') return next();
    return authMiddleware(req, res, next);
});

// Sales endpoints
app.get('/api/sales', async (req, res) => {
    try {
        if (firestoreService.isAvailable()) {
            const salesData = await firestoreService.getSales();
            res.json(salesData);
        } else {
            res.json(sales);
        }
    } catch (error) {
        console.error('Error getting sales:', error);
        res.json(sales); // Fallback to local data
    }
});

app.post('/api/sales', async (req, res) => {
    try {
        if (firestoreService.isAvailable()) {
            const newSale = await firestoreService.addSale(req.body);
            res.status(201).json({ success: true, id: newSale.id, message: 'Sale added successfully' });
        } else {
            // Fallback to local storage
            const newSale = {
                id: Date.now().toString(),
                ...req.body,
                created_at: new Date().toISOString()
            };
            sales.push(newSale);
            saveSales();
            res.status(201).json({ success: true, id: newSale.id, message: 'Sale added successfully' });
        }
    } catch (error) {
        console.error('Error adding sale:', error);
        res.status(500).json({ error: 'Failed to add sale' });
    }
});

app.put('/api/sales/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        if (firestoreService.isAvailable()) {
            await firestoreService.updateSale(id, req.body);
            res.json({ success: true, message: 'Sale updated successfully' });
        } else {
            // Fallback to local storage
            const saleIndex = sales.findIndex(s => s.id == id);
            if (saleIndex !== -1) {
                sales[saleIndex] = { ...sales[saleIndex], ...req.body, updated_at: new Date().toISOString() };
                saveSales();
                res.json({ success: true, message: 'Sale updated successfully' });
            } else {
                res.status(404).json({ error: 'Sale not found' });
            }
        }
    } catch (error) {
        console.error('Error updating sale:', error);
        res.status(500).json({ error: 'Failed to update sale' });
    }
});

app.delete('/api/sales/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        if (firestoreService.isAvailable()) {
            await firestoreService.deleteSale(id);
            res.json({ success: true, message: 'Sale deleted successfully' });
        } else {
            // Fallback to local storage
            const saleIndex = sales.findIndex(s => s.id == id);
            if (saleIndex !== -1) {
                sales.splice(saleIndex, 1);
                saveSales();
                res.json({ success: true, message: 'Sale deleted successfully' });
            } else {
                res.status(404).json({ error: 'Sale not found' });
            }
        }
    } catch (error) {
        console.error('Error deleting sale:', error);
        res.status(500).json({ error: 'Failed to delete sale' });
    }
});

// Purchases endpoints
app.get('/api/purchases', async (req, res) => {
    try {
        if (firestoreService.isAvailable()) {
            const purchasesData = await firestoreService.getPurchases();
            res.json(purchasesData);
        } else {
            res.json(purchases);
        }
    } catch (error) {
        console.error('Error getting purchases:', error);
        res.json(purchases); // Fallback to local data
    }
});

app.post('/api/purchases', async (req, res) => {
    try {
        if (firestoreService.isAvailable()) {
            const newPurchase = await firestoreService.addPurchase(req.body);
            res.status(201).json({ success: true, id: newPurchase.id, message: 'Purchase added successfully' });
        } else {
            // Fallback to local storage
            const newPurchase = {
                id: Date.now().toString(),
                ...req.body,
                created_at: new Date().toISOString()
            };
            purchases.push(newPurchase);
            savePurchases();
            res.status(201).json({ success: true, id: newPurchase.id, message: 'Purchase added successfully' });
        }
    } catch (error) {
        console.error('Error adding purchase:', error);
        res.status(500).json({ error: 'Failed to add purchase' });
    }
});

app.put('/api/purchases/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        if (firestoreService.isAvailable()) {
            await firestoreService.updatePurchase(id, req.body);
            res.json({ success: true, message: 'Purchase updated successfully' });
        } else {
            // Fallback to local storage
            const purchaseIndex = purchases.findIndex(p => p.id == id);
            if (purchaseIndex !== -1) {
                purchases[purchaseIndex] = { ...purchases[purchaseIndex], ...req.body, updated_at: new Date().toISOString() };
                savePurchases();
                res.json({ success: true, message: 'Purchase updated successfully' });
            } else {
                res.status(404).json({ error: 'Purchase not found' });
            }
        }
    } catch (error) {
        console.error('Error updating purchase:', error);
        res.status(500).json({ error: 'Failed to update purchase' });
    }
});

app.delete('/api/purchases/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        if (firestoreService.isAvailable()) {
            await firestoreService.deletePurchase(id);
            res.json({ success: true, message: 'Purchase deleted successfully' });
        } else {
            // Fallback to local storage
            const purchaseIndex = purchases.findIndex(p => p.id == id);
            if (purchaseIndex !== -1) {
                purchases.splice(purchaseIndex, 1);
                savePurchases();
                res.json({ success: true, message: 'Purchase deleted successfully' });
            } else {
                res.status(404).json({ error: 'Purchase not found' });
            }
        }
    } catch (error) {
        console.error('Error deleting purchase:', error);
        res.status(500).json({ error: 'Failed to delete purchase' });
    }
});

// Dashboard endpoint
app.get('/api/dashboard', async (req, res) => {
    try {
        let currentSales = sales;
        let currentPurchases = purchases;
        
        if (firestoreService.isAvailable()) {
            try {
                currentSales = await firestoreService.getSales();
                currentPurchases = await firestoreService.getPurchases();
            } catch (error) {
                console.error('Firestore dashboard error:', error);
                // Use local data as fallback
            }
        }
        
        const totalSales = currentSales.reduce((sum, sale) => sum + parseFloat(sale.total_amount || sale.total || 0), 0);
        const totalPurchases = currentPurchases.reduce((sum, purchase) => sum + parseFloat(purchase.total_amount || purchase.total || 0), 0);
        const netProfit = totalSales - totalPurchases;
        
        // Today's data (timezone-aware local date calculation)
        const getTodayLocal = () => {
            const today = new Date();
            const localDate = new Date(today.getTime() - (today.getTimezoneOffset() * 60000));
            return localDate.toISOString().split('T')[0];
        };
        const today = getTodayLocal();
        console.log('📅 Server calculating today as:', today);
        console.log('📊 Total sales records:', currentSales.length);
        console.log('📊 Sample sales dates:', currentSales.slice(0, 3).map(s => ({
            id: s.id,
            sale_date: s.sale_date,
            date: s.date,
            total: s.total || s.total_amount
        })));
        
        const todaySales = currentSales
            .filter(sale => {
                const dateToCheck = sale.sale_date || sale.date || '';
                const match = dateToCheck.startsWith(today);
                if (match) console.log('📈 Found today\'s sale:', { id: sale.id, date: dateToCheck, amount: sale.total_amount || sale.total });
                return match;
            })
            .reduce((sum, sale) => sum + parseFloat(sale.total_amount || sale.total || 0), 0);
            
        console.log('📊 Total purchase records:', currentPurchases.length);
        console.log('📊 Sample purchase dates:', currentPurchases.slice(0, 3).map(p => ({
            id: p.id,
            purchase_date: p.purchase_date,
            date: p.date,
            total: p.total || p.total_amount
        })));
        
        const todayPurchases = currentPurchases
            .filter(purchase => {
                const dateToCheck = purchase.purchase_date || purchase.date || '';
                const match = dateToCheck.startsWith(today);
                if (match) console.log('📉 Found today\'s purchase:', { id: purchase.id, date: dateToCheck, amount: purchase.total_amount || purchase.total });
                return match;
            })
            .reduce((sum, purchase) => sum + parseFloat(purchase.total_amount || purchase.total || 0), 0);
            
        console.log('📊 Today\'s totals:', { sales: todaySales, purchases: todayPurchases });
        
        res.json({
            totalSales,
            totalPurchases,
            netProfit,
            todaySales,
            todayPurchases,
            salesCount: currentSales.length,
            purchasesCount: currentPurchases.length
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({ error: 'Failed to get dashboard data' });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: {
            firestore: firestoreService.isAvailable(),
            fallback: 'JSON files'
        },
        data: {
            sales: sales.length,
            purchases: purchases.length,
            users: users.length
        }
    });
});

// Initialize server
async function startServer() {
    try {
        console.log('🚀 Starting Khan Automobiles Server...');
        
        // Load data
        await loadData();
        
        // Start server
        app.listen(PORT, () => {
            console.log('');
            console.log('🎉 =================================');
            console.log('🚗 Khan Automobiles Server Running!');
            console.log(`🌐 Port: ${PORT}`);
            console.log(`🔥 Firestore: ${firestoreService.isAvailable() ? 'CONNECTED' : 'DISABLED'}`);
            console.log(`📊 Data: ${sales.length} sales, ${purchases.length} purchases`);
            console.log(`👥 Users: ${users.length} (${users.map(u => u.username).join(', ')})`);
            console.log(`🔐 ADMIN_PASSWORD set: ${!!process.env.ADMIN_PASSWORD}`);
            console.log('🎉 =================================');
            console.log('');
        });
        
    } catch (error) {
        console.error('❌ Server startup failed:', error);
        process.exit(1);
    }
}

// Start the server
startServer(); 