const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const config = require('./config');

console.log('🔧 Setting up Khan Automobiles Database...\n');

// Create database directory if it doesn't exist
const dbDir = path.dirname(config.database.path);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
    console.log('📁 Created database directory');
}

// Create backup directory
const backupDir = config.database.backupPath;
if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
    console.log('📁 Created backup directory');
}

// Initialize database
const db = new sqlite3.Database(config.database.path, (err) => {
    if (err) {
        console.error('❌ Error creating database:', err.message);
        process.exit(1);
    }
    console.log('✅ Database created successfully');
});

// Setup database schema
db.serialize(() => {
    console.log('🏗️  Creating database tables...\n');

    // Create users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'admin',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login DATETIME,
        is_active INTEGER DEFAULT 1
    )`, (err) => {
        if (err) {
            console.error('❌ Error creating users table:', err.message);
        } else {
            console.log('✅ Users table created');
        }
    });

    // Create sales table
    db.run(`CREATE TABLE IF NOT EXISTS sales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer TEXT NOT NULL,
        category TEXT NOT NULL,
        description TEXT NOT NULL,
        total REAL NOT NULL,
        payment_method TEXT NOT NULL,
        notes TEXT,
        sale_date DATE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_by INTEGER,
        FOREIGN KEY (created_by) REFERENCES users (id)
    )`, (err) => {
        if (err) {
            console.error('❌ Error creating sales table:', err.message);
        } else {
            console.log('✅ Sales table created');
        }
    });

    // Create purchases table
    db.run(`CREATE TABLE IF NOT EXISTS purchases (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        supplier TEXT NOT NULL,
        category TEXT NOT NULL,
        description TEXT NOT NULL,
        total REAL NOT NULL,
        invoice_number TEXT,
        notes TEXT,
        purchase_date DATE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_by INTEGER,
        FOREIGN KEY (created_by) REFERENCES users (id)
    )`, (err) => {
        if (err) {
            console.error('❌ Error creating purchases table:', err.message);
        } else {
            console.log('✅ Purchases table created');
        }
    });

    // Create audit log table
    db.run(`CREATE TABLE IF NOT EXISTS audit_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        action TEXT NOT NULL,
        table_name TEXT NOT NULL,
        record_id INTEGER,
        old_values TEXT,
        new_values TEXT,
        ip_address TEXT,
        user_agent TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )`, (err) => {
        if (err) {
            console.error('❌ Error creating audit_log table:', err.message);
        } else {
            console.log('✅ Audit log table created');
        }
    });

    // Create indexes for better performance
    db.run(`CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(sale_date)`, (err) => {
        if (err) {
            console.error('❌ Error creating sales date index:', err.message);
        } else {
            console.log('✅ Sales date index created');
        }
    });

    db.run(`CREATE INDEX IF NOT EXISTS idx_purchases_date ON purchases(purchase_date)`, (err) => {
        if (err) {
            console.error('❌ Error creating purchases date index:', err.message);
        } else {
            console.log('✅ Purchases date index created');
        }
    });

    db.run(`CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_log(user_id)`, (err) => {
        if (err) {
            console.error('❌ Error creating audit user index:', err.message);
        } else {
            console.log('✅ Audit user index created');
        }
    });

    // Create default admin user
    console.log('\n👤 Creating default admin user...');
    const hashedPassword = bcrypt.hashSync(config.defaultAdmin.password, config.security.bcryptRounds);
    
    db.run(`INSERT OR REPLACE INTO users (username, email, password_hash, role) 
            VALUES (?, ?, ?, 'admin')`, 
            [config.defaultAdmin.username, config.defaultAdmin.email, hashedPassword],
            function(err) {
                if (err) {
                    console.error('❌ Error creating default admin:', err.message);
                } else {
                    console.log('✅ Default admin user created/updated');
                    console.log(`📧 Username: ${config.defaultAdmin.username}`);
                    console.log(`🔑 Email: ${config.defaultAdmin.email}`);
                    console.log(`🔐 Password: ${config.defaultAdmin.password}`);
                }
            });

    // Add some sample data for testing (optional)
    console.log('\n📊 Adding sample data for testing...');
    
    const sampleSales = [
        {
            customer: 'Test Customer 1',
            category: 'bike-parts',
            description: 'Sample bike part sale',
            total: 1500.00,
            payment_method: 'Cash',
            notes: 'Sample data for testing',
            sale_date: new Date().toISOString().split('T')[0]
        },
        {
            customer: 'Test Customer 2',
            category: 'car-service',
            description: 'Sample car service',
            total: 3500.00,
            payment_method: 'Card',
            notes: 'Sample service data',
            sale_date: new Date().toISOString().split('T')[0]
        }
    ];

    const samplePurchases = [
        {
            supplier: 'Test Supplier',
            category: 'bike-parts',
            description: 'Sample bike part purchase',
            total: 800.00,
            invoice_number: 'INV001',
            notes: 'Sample purchase data',
            purchase_date: new Date().toISOString().split('T')[0]
        }
    ];

    // Insert sample sales
    const saleStmt = db.prepare(`INSERT INTO sales (customer, category, description, total, payment_method, notes, sale_date, created_by)
                                 VALUES (?, ?, ?, ?, ?, ?, ?, 1)`);
    
    sampleSales.forEach(sale => {
        saleStmt.run([sale.customer, sale.category, sale.description, sale.total, sale.payment_method, sale.notes, sale.sale_date]);
    });
    saleStmt.finalize();
    console.log(`✅ ${sampleSales.length} sample sales added`);

    // Insert sample purchases
    const purchaseStmt = db.prepare(`INSERT INTO purchases (supplier, category, description, total, invoice_number, notes, purchase_date, created_by)
                                     VALUES (?, ?, ?, ?, ?, ?, ?, 1)`);
    
    samplePurchases.forEach(purchase => {
        purchaseStmt.run([purchase.supplier, purchase.category, purchase.description, purchase.total, purchase.invoice_number, purchase.notes, purchase.purchase_date]);
    });
    purchaseStmt.finalize();
    console.log(`✅ ${samplePurchases.length} sample purchases added`);

    console.log('\n🎉 Database setup completed successfully!');
    console.log('\n📋 Next Steps:');
    console.log('1. Run: npm install');
    console.log('2. Run: npm start');
    console.log('3. Open: http://localhost:3000');
    console.log('4. Login with default credentials');
    console.log('5. IMMEDIATELY change the default password!');
    console.log('\n⚠️  SECURITY REMINDER: This system is now production-ready');
    console.log('   but you should change default credentials before use.\n');
});

// Close database connection
db.close((err) => {
    if (err) {
        console.error('❌ Error closing database:', err.message);
    } else {
        console.log('💾 Database connection closed');
    }
    process.exit(0);
}); 