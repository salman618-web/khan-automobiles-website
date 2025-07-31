const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
// Use environment variable for port (required for cloud hosting)
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static('./', {
    index: 'index.html'
}));

// Data file paths - Cloud-friendly data persistence
const DATA_DIR = process.env.DATA_DIR || './data';
const SALES_FILE = path.join(DATA_DIR, 'sales.json');  
const PURCHASES_FILE = path.join(DATA_DIR, 'purchases.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

// Environment variable for persistent data (for cloud deployments)
const PERSISTENT_SALES_DATA = process.env.PERSISTENT_SALES_DATA;
const PERSISTENT_PURCHASES_DATA = process.env.PERSISTENT_PURCHASES_DATA;

console.log('🔧 Data Configuration:');
console.log(`   - DATA_DIR: ${DATA_DIR}`);
console.log(`   - NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`   - PERSISTENT_SALES_DATA available: ${!!PERSISTENT_SALES_DATA}`);
console.log(`   - PERSISTENT_PURCHASES_DATA available: ${!!PERSISTENT_PURCHASES_DATA}`);

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    console.log('📁 Created data directory:', DATA_DIR);
}

// Enhanced data loading with fallback to environment variables
function loadData() {
    console.log('📖 Loading data from multiple sources...');
    
    // Load sales with environment variable fallback
    try {
        if (PERSISTENT_SALES_DATA) {
            // Load from environment variable (cloud-persistent)
            sales = JSON.parse(PERSISTENT_SALES_DATA);
            console.log(`📈 Loaded ${sales.length} sales records from environment variable`);
        } else if (fs.existsSync(SALES_FILE)) {
            // Load from file (local development)
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
            // Load from environment variable (cloud-persistent)
            purchases = JSON.parse(PERSISTENT_PURCHASES_DATA);
            console.log(`📉 Loaded ${purchases.length} purchase records from environment variable`);
        } else if (fs.existsSync(PURCHASES_FILE)) {
            // Load from file (local development)
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
            // Create default admin user
            const defaultAdminPassword = process.env.ADMIN_PASSWORD || 'admin123';
            users = [
                {
                    id: 1,
                    username: 'admin',
                    password: defaultAdminPassword,
                    role: 'admin',
                    created_at: new Date().toISOString()
                }
            ];
            saveUsers();
            console.log('👥 Created default admin user');
        }
    } catch (error) {
        console.error('❌ Error loading users:', error);
        const defaultAdminPassword = process.env.ADMIN_PASSWORD || 'admin123';
        users = [
            {
                id: 1,
                username: 'admin', 
                password: defaultAdminPassword,
                role: 'admin',
                created_at: new Date().toISOString()
            }
        ];
    }
    
    // Set next ID based on existing data
    const maxSalesId = sales.length > 0 ? Math.max(...sales.map(s => s.id || 0)) : 0;
    const maxPurchasesId = purchases.length > 0 ? Math.max(...purchases.map(p => p.id || 0)) : 0;
    const maxUsersId = users.length > 0 ? Math.max(...users.map(u => u.id || 0)) : 0;
    nextId = Math.max(maxSalesId, maxPurchasesId, maxUsersId) + 1;
    
    console.log(`🆔 Next ID will be: ${nextId}`);
    console.log(`📊 Data loaded successfully: ${sales.length} sales, ${purchases.length} purchases, ${users.length} users`);
}

// Enhanced save functions with better error handling
function saveSales() {
    try {
        const data = JSON.stringify(sales, null, 2);
        fs.writeFileSync(SALES_FILE, data, 'utf8');
        console.log(`💾 Saved ${sales.length} sales records to ${SALES_FILE}`);
        
        // Log a warning about data persistence in cloud deployments
        if (process.env.NODE_ENV === 'production' && !PERSISTENT_SALES_DATA) {
            console.log('⚠️  WARNING: In cloud deployment, consider using PERSISTENT_SALES_DATA environment variable for data persistence');
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
        
        // Log a warning about data persistence in cloud deployments
        if (process.env.NODE_ENV === 'production' && !PERSISTENT_PURCHASES_DATA) {
            console.log('⚠️  WARNING: In cloud deployment, consider using PERSISTENT_PURCHASES_DATA environment variable for data persistence');
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

// Initialize data storage
let sales = [];
let purchases = [];
let users = [];
let nextId = 1;

// Load existing data
loadData();

// Simple login endpoint
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
        res.json({
            success: true,
            message: 'Login successful',
            user: {
                id: user.id,
                username: user.username,
                role: user.role
            }
        });
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

// Get sales
app.get('/api/sales', (req, res) => {
    res.json(sales);
});

// Add sale
app.post('/api/sales', (req, res) => {
    const newSale = {
        id: nextId++,
        ...req.body,
        created_at: new Date().toISOString()
    };
    sales.push(newSale);
    saveSales();
    res.status(201).json({ success: true, id: newSale.id, message: 'Sale added successfully' });
});

// Update sale
app.put('/api/sales/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const index = sales.findIndex(s => s.id === id);
    
    if (index !== -1) {
        sales[index] = { ...sales[index], ...req.body, updated_at: new Date().toISOString() };
        saveSales();
        res.json({ success: true, message: 'Sale updated successfully' });
    } else {
        res.status(404).json({ error: 'Sale not found' });
    }
});

// Delete sale
app.delete('/api/sales/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const index = sales.findIndex(s => s.id === id);
    
    if (index !== -1) {
        sales.splice(index, 1);
        saveSales();
            res.json({ success: true, message: 'Sale deleted successfully' });
    } else {
        res.status(404).json({ error: 'Sale not found' });
    }
});

// Get purchases
app.get('/api/purchases', (req, res) => {
    res.json(purchases);
});

// Add purchase
app.post('/api/purchases', (req, res) => {
    const newPurchase = {
        id: nextId++,
        ...req.body,
        created_at: new Date().toISOString()
    };
    purchases.push(newPurchase);
    savePurchases();
    res.status(201).json({ success: true, id: newPurchase.id, message: 'Purchase added successfully' });
});

// Update purchase
app.put('/api/purchases/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const index = purchases.findIndex(p => p.id === id);
    
    if (index !== -1) {
        purchases[index] = { ...purchases[index], ...req.body, updated_at: new Date().toISOString() };
        savePurchases();
        res.json({ success: true, message: 'Purchase updated successfully' });
    } else {
        res.status(404).json({ error: 'Purchase not found' });
    }
});

// Delete purchase
app.delete('/api/purchases/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const index = purchases.findIndex(p => p.id === id);
    
    if (index !== -1) {
        purchases.splice(index, 1);
        savePurchases();
        res.json({ success: true, message: 'Purchase deleted successfully' });
    } else {
        res.status(404).json({ error: 'Purchase not found' });
    }
});

// Dashboard statistics
app.get('/api/dashboard', (req, res) => {
    try {
        console.log('📊 Dashboard API called');
        console.log('📈 Sales data count:', sales.length);
        console.log('📉 Purchases data count:', purchases.length);
        
        const totalSales = sales.reduce((sum, sale) => sum + parseFloat(sale.total || 0), 0);
        const totalPurchases = purchases.reduce((sum, purchase) => sum + parseFloat(purchase.total || 0), 0);
        
    const today = new Date().toISOString().split('T')[0];
        console.log('📅 Today\'s date:', today);
        
        const todaySales = sales
            .filter(sale => sale.sale_date === today)
            .reduce((sum, sale) => sum + parseFloat(sale.total || 0), 0);
        
        const todayPurchases = purchases
            .filter(purchase => purchase.purchase_date === today)
            .reduce((sum, purchase) => sum + parseFloat(purchase.total || 0), 0);

        console.log('💰 Today\'s Sales:', todaySales);
        console.log('💸 Today\'s Purchases:', todayPurchases);

        const dashboardData = {
            totalSales,
            totalPurchases,
            todaySales,
            todayPurchases,
            salesCount: sales.length,
            purchasesCount: purchases.length,
            netProfit: totalSales - totalPurchases
        };
        
        console.log('✅ Dashboard data prepared:', dashboardData);
        res.json(dashboardData);
        
    } catch (error) {
        console.error('❌ Dashboard API error:', error);
        res.status(500).json({ error: 'Internal server error', message: error.message });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString() 
    });
});

// Start server - Cloud ready configuration
app.listen(PORT, '0.0.0.0', () => {
    console.log('\n🚀 Khan Automobiles Server Started');
    console.log(`📡 Server running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📁 Data directory: ${DATA_DIR}`);
    
    // Show appropriate URL based on environment
    if (process.env.NODE_ENV === 'production') {
        console.log('🌐 Production deployment - accessible via your domain');
    } else {
        console.log(`📡 Local access: http://localhost:${PORT}`);
    }
    
    console.log('\n📋 Default Login Credentials:');
    console.log('   Username: admin');
    if (process.env.NODE_ENV === 'production') {
        console.log('   Password: [Set via ADMIN_PASSWORD environment variable]');
        } else {
        console.log('   Password: [Use ADMIN_PASSWORD env var or development fallback]');
    }
    console.log('\n✅ Server ready for cloud deployment!\n');
}); 