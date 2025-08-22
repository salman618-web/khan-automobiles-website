const express = require('express');
const path = require('path');
const fs = require('fs');

// deploy: no-op marker 2

// Security middleware (feature-flagged for non-breaking rollout)
const helmet = require('helmet');
const session = require('express-session');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const bcrypt = require('bcryptjs');

// Import Firebase service
const firestoreService = require('./firebase-config');

const app = express();
const PORT = process.env.PORT || 3000;

// Feature flags (default off to preserve behavior)
const SECURITY_ENFORCE = process.env.SECURITY_ENFORCE === 'true';
const ENFORCE_HTTPS = process.env.ENFORCE_HTTPS === 'true';

// Trust proxy for Render/Heroku to get client IP and proto
app.set('trust proxy', 1);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Helmet (CSP disabled to avoid blocking current CDNs). Safe even when not enforcing.
app.use(helmet({ contentSecurityPolicy: false }));

// Optional HTTPS-only enforcement (off by default)
if (ENFORCE_HTTPS) {
	app.use((req, res, next) => {
		if (req.secure || req.headers['x-forwarded-proto'] === 'https') return next();
		return res.redirect('https://' + req.headers.host + req.originalUrl);
	});
}

// CORS: allowlist via ALLOWED_ORIGINS; default allow-all (non-breaking)
const allowedOrigins = process.env.ALLOWED_ORIGINS
	? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim()).filter(Boolean)
	: null; // null -> allow all
app.use(cors({
	origin: function(origin, callback) {
		if (!origin) return callback(null, true); // same-origin or curl
		if (!allowedOrigins || allowedOrigins.includes(origin)) return callback(null, true);
		return callback(new Error('Not allowed by CORS'));
	},
	credentials: true
}));

// Basic rate limiting with mild defaults (safe)
const limiter = rateLimit({
	windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 min
	max: parseInt(process.env.RATE_LIMIT_MAX || '300', 10),
	standardHeaders: true,
	legacyHeaders: false
});
app.use(limiter);

// Sessions for server-side authentication (enforced only if SECURITY_ENFORCE=true)
const sessionSecret = process.env.SESSION_SECRET || 'CHANGE_ME_SESSION_SECRET';
app.use(session({
	secret: sessionSecret,
	resave: false,
	saveUninitialized: false,
	proxy: true,
	cookie: {
		secure: process.env.NODE_ENV === 'production',
		httpOnly: true,
		sameSite: 'lax',
		maxAge: 1000 * 60 * 60 * 8
	}
}));

// Block direct static access to /data from the web
app.use('/data', (req, res) => res.status(403).send('Forbidden'));

// Gate admin and admin.html behind session only when enforcing
app.get(['/admin', '/admin.html'], (req, res, next) => {
	if (!SECURITY_ENFORCE) return next();
	if (req.session && req.session.user) return next();
	return res.redirect('/');
});

// Canonical clean URLs
app.get('/admin', (req, res) => {
	return res.sendFile(path.join(__dirname, 'admin.html'));
});

// Redirect old .html paths to clean URLs
app.get('/admin.html', (req, res) => res.redirect(301, '/admin'));
app.get('/index.html', (req, res) => res.redirect(301, '/'));

// Serve static files
app.use(express.static('./', {
	index: 'index.html'
}));

// Database Configuration - Hybrid approach (Firestore + JSON fallback)
// Dummy update: Optimized file handling for better performance
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

// Helper: API auth guard (enforced only when SECURITY_ENFORCE=true)
function ensureAuthenticated(req, res, next) {
	if (!SECURITY_ENFORCE) return next();
	if (req.session && req.session.user) return next();
	return res.status(401).json({ error: 'Unauthorized' });
}

// Minimal validators (used only when enforcing to avoid breakage)
function isNonEmptyString(v) { return typeof v === 'string' && v.trim().length > 0; }
function isValidMoney(n) { const num = typeof n === 'number' ? n : parseFloat(n); return Number.isFinite(num) && num >= 0; }

// Password helpers (bcrypt)
function isBcryptHash(value) {
	return typeof value === 'string' && value.startsWith('$2');
}
async function hashPassword(plain) {
	const rounds = parseInt(process.env.BCRYPT_ROUNDS || '10', 10);
	return await bcrypt.hash(plain, rounds);
}

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

// Create default admin user (store bcrypt hash, not plaintext)
async function createDefaultData() {
	const defaultAdminPassword = process.env.ADMIN_PASSWORD || 'admin123';
	const hashed = await hashPassword(defaultAdminPassword);
	users = [
		{
			id: '1',
			username: 'admin',
			password: hashed,
			role: 'admin',
			created_at: new Date().toISOString()
		}
	];
	
	// Save to Firestore if available, otherwise to file
	if (firestoreService.isAvailable()) {
		try {
			await firestoreService.addUser(users[0]);
			console.log('👥 Created default admin user in Firestore (hashed)');
		} catch (error) {
			console.error('❌ Error creating default user in Firestore:', error);
			saveUsers();
		}
	} else {
		saveUsers();
		console.log('👥 Created default admin user in file (hashed)');
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
	} catch (error) {
		console.error('❌ Error saving sales:', error);
	}
}

function savePurchases() {
	try {
		const data = JSON.stringify(purchases, null, 2);
		fs.writeFileSync(PURCHASES_FILE, data, 'utf8');
		console.log(`💾 Saved ${purchases.length} purchase records to ${PURCHASES_FILE}`);
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

// Login: preserves current payload, sets session only when enforcing
app.post('/api/login', async (req, res) => {
	try {
		const { username, password } = req.body || {};
		let user = null;
		
		if (firestoreService.isAvailable()) {
			try { user = await firestoreService.getUserByUsername(username); } catch (e) {}
		}
		if (!user) {
			user = users.find(u => u.username === username);
		}
		if (!user) return res.status(401).json({ error: 'Invalid credentials' });
		
		let ok = false;
		if (isBcryptHash(user.password)) {
			ok = await bcrypt.compare(password || '', user.password);
		} else {
			// Legacy plaintext support with seamless upgrade
			ok = user.password === password;
			if (ok) {
				try {
					const newHash = await hashPassword(password || '');
					if (firestoreService.isAvailable()) {
						try { await firestoreService.updateUser(user.id, { password: newHash }); } catch (_) {}
					} else {
						const idx = users.findIndex(u => u.id === user.id);
						if (idx !== -1) { users[idx].password = newHash; saveUsers(); }
					}
				} catch (_) {}
			}
		}

		// Fallback: allow admin to login using ADMIN_PASSWORD from env if configured
		if (!ok && process.env.ADMIN_PASSWORD) {
			try {
				const envOk = await bcrypt.compare(password || '', isBcryptHash(process.env.ADMIN_PASSWORD) ? process.env.ADMIN_PASSWORD : await hashPassword(process.env.ADMIN_PASSWORD));
				if (envOk && (username === user.username || username === 'admin')) {
					ok = true;
				}
			} catch (_) {}
		}
		
		if (ok) {
			if (SECURITY_ENFORCE) {
				req.session.user = { id: user.id, username: user.username, role: user.role };
			}
			return res.json({ success: true, message: 'Login successful', user: { id: user.id, username: user.username, role: user.role } });
		}
		return res.status(401).json({ error: 'Invalid credentials' });
	} catch (error) {
		return res.status(500).json({ error: 'Internal server error' });
	}
});

app.post('/api/logout', (req, res) => {
	try { req.session.destroy(() => res.json({ success: true })); } catch (_) { res.json({ success: true }); }
});

// Enforce auth on api routes (except health/login) only when enforcing
app.use((req, res, next) => {
	if (!SECURITY_ENFORCE) return next();
	const open = ['/api/health', '/api/login'];
	if (open.includes(req.path)) return next();
	if (req.path.startsWith('/api/')) return ensureAuthenticated(req, res, next);
	return next();
});

// Sales endpoints
app.get('/api/sales', async (req, res) => {
	try {
		const { page, limit, search, category, customer } = req.query;
		
		if (firestoreService.isAvailable()) {
			// If pagination parameters provided, use paginated endpoint
			if (page || limit || search || category || customer) {
				const pageNum = parseInt(page) || 1;
				const limitNum = parseInt(limit) || 50;
				const filters = {};
				if (category) filters.category = category;
				if (customer) filters.customer = customer;
				
				const result = await firestoreService.searchSales(search || '', filters, pageNum, limitNum);
				res.json(result);
			} else {
				// Default behavior - return all data (backward compatibility)
				const salesData = await firestoreService.getSales();
				res.json(salesData);
			}
		} else {
			// Fallback to local data with optional client-side filtering
			let filteredSales = sales;
			
			if (search) {
				const searchTerm = search.toLowerCase();
				filteredSales = sales.filter(sale => 
					Object.values(sale).some(value => 
						value && value.toString().toLowerCase().includes(searchTerm)
					)
				);
			}
			
			if (category) {
				filteredSales = filteredSales.filter(sale => sale.category === category);
			}
			
			if (customer) {
				filteredSales = filteredSales.filter(sale => sale.customer === customer);
			}
			
			// Apply pagination if requested
			if (page || limit) {
				const pageNum = parseInt(page) || 1;
				const limitNum = parseInt(limit) || 50;
				const offset = (pageNum - 1) * limitNum;
				const paginatedSales = filteredSales.slice(offset, offset + limitNum);
				
				res.json({
					data: paginatedSales,
					pagination: {
						page: pageNum,
						limit: limitNum,
						total: filteredSales.length,
						totalPages: Math.ceil(filteredSales.length / limitNum),
						hasNext: (pageNum * limitNum) < filteredSales.length,
						hasPrev: pageNum > 1
					}
				});
			} else {
				// Default behavior - return all filtered data
				res.json(filteredSales);
			}
		}
	} catch (error) {
		console.error('Error getting sales:', error);
		res.json(sales); // Fallback to local data
	}
});

app.post('/api/sales', async (req, res) => {
	try {
		const b = req.body || {};
		if (SECURITY_ENFORCE) {
			if (!isNonEmptyString(b.customer) || !isNonEmptyString(b.category) || !isNonEmptyString(b.description) || !isValidMoney(b.total) || !isNonEmptyString(b.sale_date)) {
				return res.status(400).json({ error: 'Invalid sale payload' });
			}
		}
		if (firestoreService.isAvailable()) {
			const newSale = await firestoreService.addSale(b);
			res.status(201).json({ success: true, id: newSale.id, message: 'Sale added successfully' });
		} else {
			const newSale = { id: Date.now().toString(), ...b, created_at: new Date().toISOString() };
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
		const b = req.body || {};
		if (firestoreService.isAvailable()) {
			await firestoreService.updateSale(id, b);
			res.json({ success: true, message: 'Sale updated successfully' });
		} else {
			const idx = sales.findIndex(s => s.id == id);
			if (idx !== -1) {
				sales[idx] = { ...sales[idx], ...b, updated_at: new Date().toISOString() };
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
			const idx = sales.findIndex(s => s.id == id);
			if (idx !== -1) {
				sales.splice(idx, 1);
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

// Bulk deletion endpoint for sales by year
app.delete('/api/sales/year/:year', async (req, res) => {
	try {
		const { year } = req.params;
		
		// Validate year parameter
		const yearNum = parseInt(year);
		if (!year || isNaN(yearNum) || yearNum < 2000 || yearNum > 2100) {
			return res.status(400).json({ error: 'Invalid year. Please provide a valid year between 2000 and 2100.' });
		}
		
		if (firestoreService.isAvailable()) {
			const result = await firestoreService.deleteSalesByYear(year);
			res.json({ success: true, ...result });
		} else {
			// Fallback: Delete from local array
			const originalLength = sales.length;
			sales = sales.filter(sale => {
				if (!sale.sale_date) return true;
				const saleYear = new Date(sale.sale_date).getFullYear();
				return saleYear.toString() !== year;
			});
			
			const deleted = originalLength - sales.length;
			saveSales();
			
			res.json({ 
				success: true, 
				deleted: deleted, 
				message: `Successfully deleted ${deleted} sales records for year ${year}` 
			});
		}
	} catch (error) {
		console.error('Error deleting sales by year:', error);
		res.status(500).json({ error: 'Failed to delete sales records' });
	}
});

// Purchases endpoints
app.get('/api/purchases', async (req, res) => {
	try {
		const { page, limit, search, category, supplier } = req.query;
		
		if (firestoreService.isAvailable()) {
			// If pagination parameters provided, use paginated endpoint
			if (page || limit || search || category || supplier) {
				const pageNum = parseInt(page) || 1;
				const limitNum = parseInt(limit) || 50;
				const filters = {};
				if (category) filters.category = category;
				if (supplier) filters.supplier = supplier;
				
				const result = await firestoreService.searchPurchases(search || '', filters, pageNum, limitNum);
				res.json(result);
			} else {
				// Default behavior - return all data (backward compatibility)
				const purchasesData = await firestoreService.getPurchases();
				res.json(purchasesData);
			}
		} else {
			// Fallback to local data with optional client-side filtering
			let filteredPurchases = purchases;
			
			if (search) {
				const searchTerm = search.toLowerCase();
				filteredPurchases = purchases.filter(purchase => 
					Object.values(purchase).some(value => 
						value && value.toString().toLowerCase().includes(searchTerm)
					)
				);
			}
			
			if (category) {
				filteredPurchases = filteredPurchases.filter(purchase => purchase.category === category);
			}
			
			if (supplier) {
				filteredPurchases = filteredPurchases.filter(purchase => purchase.supplier === supplier);
			}
			
			// Apply pagination if requested
			if (page || limit) {
				const pageNum = parseInt(page) || 1;
				const limitNum = parseInt(limit) || 50;
				const offset = (pageNum - 1) * limitNum;
				const paginatedPurchases = filteredPurchases.slice(offset, offset + limitNum);
				
				res.json({
					data: paginatedPurchases,
					pagination: {
						page: pageNum,
						limit: limitNum,
						total: filteredPurchases.length,
						totalPages: Math.ceil(filteredPurchases.length / limitNum),
						hasNext: (pageNum * limitNum) < filteredPurchases.length,
						hasPrev: pageNum > 1
					}
				});
			} else {
				// Default behavior - return all filtered data
				res.json(filteredPurchases);
			}
		}
	} catch (error) {
		console.error('Error getting purchases:', error);
		res.json(purchases); // Fallback to local data
	}
});

app.post('/api/purchases', async (req, res) => {
	try {
		const b = req.body || {};
		if (SECURITY_ENFORCE) {
			if (!isNonEmptyString(b.supplier) || !isNonEmptyString(b.category) || !isNonEmptyString(b.description) || !isValidMoney(b.total) || !isNonEmptyString(b.purchase_date)) {
				return res.status(400).json({ error: 'Invalid purchase payload' });
			}
		}
		if (firestoreService.isAvailable()) {
			const newPurchase = await firestoreService.addPurchase(b);
			res.status(201).json({ success: true, id: newPurchase.id, message: 'Purchase added successfully' });
		} else {
			const newPurchase = { id: Date.now().toString(), ...b, created_at: new Date().toISOString() };
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
		const b = req.body || {};
		if (firestoreService.isAvailable()) {
			await firestoreService.updatePurchase(id, b);
			res.json({ success: true, message: 'Purchase updated successfully' });
		} else {
			const idx = purchases.findIndex(p => p.id == id);
			if (idx !== -1) {
				purchases[idx] = { ...purchases[idx], ...b, updated_at: new Date().toISOString() };
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
			const idx = purchases.findIndex(p => p.id == id);
			if (idx !== -1) {
				purchases.splice(idx, 1);
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

// Bulk deletion endpoint for purchases by year
app.delete('/api/purchases/year/:year', async (req, res) => {
	try {
		const { year } = req.params;
		
		// Validate year parameter
		const yearNum = parseInt(year);
		if (!year || isNaN(yearNum) || yearNum < 2000 || yearNum > 2100) {
			return res.status(400).json({ error: 'Invalid year. Please provide a valid year between 2000 and 2100.' });
		}
		
		if (firestoreService.isAvailable()) {
			const result = await firestoreService.deletePurchasesByYear(year);
			res.json({ success: true, ...result });
		} else {
			// Fallback: Delete from local array
			const originalLength = purchases.length;
			purchases = purchases.filter(purchase => {
				if (!purchase.purchase_date) return true;
				const purchaseYear = new Date(purchase.purchase_date).getFullYear();
				return purchaseYear.toString() !== year;
			});
			
			const deleted = originalLength - purchases.length;
			savePurchases();
			
			res.json({ 
				success: true, 
				deleted: deleted, 
				message: `Successfully deleted ${deleted} purchases records for year ${year}` 
			});
		}
	} catch (error) {
		console.error('Error deleting purchases by year:', error);
		res.status(500).json({ error: 'Failed to delete purchases records' });
	}
});

// Dashboard endpoint (unchanged)
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
		
		const getTodayLocal = () => {
			const today = new Date();
			const localDate = new Date(today.getTime() - (today.getTimezoneOffset() * 60000));
			return localDate.toISOString().split('T')[0];
		};
		const today = getTodayLocal();
		
		const todaySales = currentSales
			.filter(sale => {
				const dateToCheck = sale.sale_date || sale.date || '';
				return dateToCheck.startsWith(today);
			})
			.reduce((sum, sale) => sum + parseFloat(sale.total_amount || sale.total || 0), 0);
		
		const todayPurchases = currentPurchases
			.filter(purchase => {
				const dateToCheck = purchase.purchase_date || purchase.date || '';
				return dateToCheck.startsWith(today);
			})
			.reduce((sum, purchase) => sum + parseFloat(purchase.total_amount || purchase.total || 0), 0);
		
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

// Health (duplicate legacy) endpoint retained
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

		// Optional: one-time startup sync to align stored admin hash with ADMIN_PASSWORD
		if (process.env.SYNC_ADMIN_PASSWORD === 'true' && process.env.ADMIN_PASSWORD) {
			try {
				const targetUsername = process.env.ADMIN_USERNAME || 'admin';
				let adminUser = null;
				if (firestoreService.isAvailable()) {
					try { adminUser = await firestoreService.getUserByUsername(targetUsername); } catch(_) {}
				}
				if (!adminUser) adminUser = users.find(u => u.username === targetUsername);
				if (adminUser) {
					const newHash = await hashPassword(process.env.ADMIN_PASSWORD);
					if (firestoreService.isAvailable()) {
						try { await firestoreService.updateUser(adminUser.id, { password: newHash }); } catch(_) {}
					} else {
						const idx = users.findIndex(u => u.id === adminUser.id);
						if (idx !== -1) { users[idx].password = newHash; saveUsers(); }
					}
					console.log('🔐 Admin password hash synced with ADMIN_PASSWORD');
				}
			} catch (syncErr) {
				console.warn('⚠️ Admin password sync skipped:', syncErr.message);
			}
		}
		
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
			console.log(`🔁 SYNC_ADMIN_PASSWORD: ${process.env.SYNC_ADMIN_PASSWORD === 'true'}`);
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