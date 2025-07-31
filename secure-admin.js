// Clean Secure Admin JavaScript - Works with simple server
// No JWT tokens, no complex authentication - just working functionality

// Global variables
let currentUser = null;

// Application initialization
document.addEventListener('DOMContentLoaded', function() {
    initializeSecureApp();
});

async function initializeSecureApp() {
    try {
        console.log('🔄 Initializing admin app...');
        
        // Wait a moment for any pending localStorage operations to complete
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Check authentication with multiple attempts for timing issues
        let attempts = 0;
        const maxAttempts = 3;
        
        while (attempts < maxAttempts) {
            // Check both localStorage and sessionStorage
            const isLoggedInLocal = localStorage.getItem('isAdminLoggedIn');
            const usernameLocal = localStorage.getItem('adminUsername');
            const isLoggedInSession = sessionStorage.getItem('isAdminLoggedIn');
            const usernameSession = sessionStorage.getItem('adminUsername');
            
            console.log(`Attempt ${attempts + 1}:`);
            console.log(`  localStorage: isLoggedIn=${isLoggedInLocal}, username=${usernameLocal}`);
            console.log(`  sessionStorage: isLoggedIn=${isLoggedInSession}, username=${usernameSession}`);
            
            // Accept authentication from either storage method
            const isAuthenticated = (isLoggedInLocal === 'true' && usernameLocal) || (isLoggedInSession === 'true' && usernameSession);
            const authenticatedUsername = usernameLocal || usernameSession;
            
            if (isAuthenticated && authenticatedUsername) {
                currentUser = { username: authenticatedUsername, role: 'admin' };
                console.log('✅ User is authenticated, showing dashboard');
                
                // Ensure both storage methods have the values
                if (!isLoggedInLocal) {
                    localStorage.setItem('isAdminLoggedIn', 'true');
                    localStorage.setItem('adminUsername', authenticatedUsername);
                }
                if (!isLoggedInSession) {
                    sessionStorage.setItem('isAdminLoggedIn', 'true');
                    sessionStorage.setItem('adminUsername', authenticatedUsername);
                }
                
                showDashboard();
                return;
            }
            
            attempts++;
            if (attempts < maxAttempts) {
                console.log(`⏳ Retrying authentication check in 300ms...`);
                await new Promise(resolve => setTimeout(resolve, 300));
            }
        }
        
        // If we get here, user is not authenticated after all attempts
        console.log('❌ User not authenticated after multiple checks, redirecting to login page');
        showNotification('Please login to access the admin panel', 'error');
        
        // Redirect to index.html after a longer delay
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 3000);
        
    } catch (error) {
        console.error('Initialization error:', error);
        showNotification('Authentication error. Redirecting to login...', 'error');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
    }
}

// Authentication functions
function showLoginModal() {
    console.log('🔐 Attempting to show login modal...');
    const modal = document.getElementById('adminModal');
    if (modal) {
        modal.style.display = 'block';
        modal.style.visibility = 'visible';
        modal.style.opacity = '1';
        
        // Focus on username field after a brief delay
        setTimeout(() => {
            const usernameField = document.getElementById('username');
            if (usernameField) {
                usernameField.focus();
            }
        }, 100);
        
        console.log('✅ Login modal displayed successfully');
    } else {
        console.log('ℹ️ No login modal found - likely on admin page. User should login from index.html');
        showNotification('Please login from the main page first', 'error');
        
        // If on admin page without authentication, redirect to index
        if (window.location.pathname.includes('admin.html')) {
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
        }
    }
}

function hideLoginModal() {
    console.log('🔒 Attempting to hide login modal...');
    const modal = document.getElementById('adminModal');
    if (modal) {
        modal.style.display = 'none';
        modal.style.visibility = 'hidden';
        modal.style.opacity = '0';
        console.log('✅ Login modal hidden successfully');
    } else {
        console.log('ℹ️ No login modal to hide - likely on admin page');
    }
}

// Setup form handlers
function setupFormHandlers() {
    // Login form handler - only handle if we're on admin.html
    // On index.html, script.js handles the login form
    const adminForm = document.getElementById('adminForm');
    if (adminForm && window.location.pathname.includes('admin.html')) {
        console.log('ℹ️ Setting up admin form handler on admin.html');
        adminForm.addEventListener('submit', handleLogin);
    } else if (adminForm) {
        console.log('ℹ️ Login form found but on index.html - script.js will handle it');
    }

    // Sales form handler
    const salesForm = document.getElementById('salesForm');
    if (salesForm) {
        salesForm.addEventListener('submit', handleAddSale);
    }

    // Purchase form handler
    const purchaseForm = document.getElementById('purchaseForm');
    if (purchaseForm) {
        purchaseForm.addEventListener('submit', handleAddPurchase);
    }

    // Edit form handler
    const editForm = document.getElementById('editTransactionForm');
    if (editForm) {
        editForm.addEventListener('submit', handleEditTransaction);
    }

    // Close handlers for all modals
    const allCloseButtons = document.querySelectorAll('.modal .close, .close-btn');
    allCloseButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) {
                modal.style.display = 'none';
            }
        });
    });

    // Click outside modal to close
    window.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });
}

// Login handler
async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    
    if (!username || !password) {
        showNotification('Please enter both username and password', 'error');
        return;
    }

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    
    try {
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
        submitBtn.disabled = true;

        const loginResponse = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        const response = await loginResponse.json();
        
        if (response.success) {
            console.log('✅ Login successful on admin.html (unlikely scenario)');
            
            // Set authentication data
            localStorage.setItem('isAdminLoggedIn', 'true');
            localStorage.setItem('adminUsername', username);
            sessionStorage.setItem('isAdminLoggedIn', 'true');
            sessionStorage.setItem('adminUsername', username);
            currentUser = response.user;
            
            hideLoginModal();
            showNotification(`Welcome back, ${currentUser.username}!`, 'success');
            
            setTimeout(() => {
                showDashboard();
            }, 500);
        } else {
            throw new Error(response.error || 'Login failed');
        }
    } catch (error) {
        console.error('Login error:', error);
        showNotification(error.message || 'Login failed. Please check your credentials.', 'error');
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// Logout function
async function logout() {
    try {
        // Clear both storage methods
        localStorage.removeItem('isAdminLoggedIn');
        localStorage.removeItem('adminUsername');
        sessionStorage.removeItem('isAdminLoggedIn');
        sessionStorage.removeItem('adminUsername');
        currentUser = null;
        
        console.log('🚪 User logged out, clearing all authentication data');
        showNotification('Logged out successfully', 'success');
        setTimeout(() => window.location.href = 'index.html', 1000);
    } catch (error) {
        console.error('Logout error:', error);
    }
}

// Dashboard functions
async function showDashboard() {
    try {
        const adminNameElement = document.getElementById('adminName');
        if (adminNameElement && currentUser) {
            adminNameElement.textContent = currentUser.username;
        }

        await loadDashboard();
        setupFormHandlers();
        setSalesDefaults();
        setPurchaseDefaults();
        
    } catch (error) {
        console.error('Dashboard error:', error);
        showNotification('Error loading dashboard', 'error');
    }
}

// Load dashboard data
async function loadDashboard() {
    try {
        console.log('🔄 Loading dashboard data...');
        const response = await fetch('/api/dashboard');
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const dashboardData = await response.json();
        console.log('📊 Dashboard data received:', dashboardData);
        
        // Check if we have error in response
        if (dashboardData.error) {
            throw new Error(dashboardData.message || dashboardData.error);
        }
        
        if (document.getElementById('totalSales')) {
            document.getElementById('totalSales').textContent = `₹${dashboardData.totalSales.toLocaleString('en-IN')}`;
            document.getElementById('totalPurchases').textContent = `₹${dashboardData.totalPurchases.toLocaleString('en-IN')}`;
            document.getElementById('netProfit').textContent = `₹${dashboardData.netProfit.toLocaleString('en-IN')}`;
            document.getElementById('todaySales').textContent = `₹${dashboardData.todaySales.toLocaleString('en-IN')}`;
            document.getElementById('todayPurchases').textContent = `₹${dashboardData.todayPurchases.toLocaleString('en-IN')}`;
            console.log('✅ Dashboard stats updated successfully');
        }

        console.log('🔄 Loading chart and transactions...');
        await loadQuickChart();
        await loadRecentTransactions();
        updateDataCountInfo();
        console.log('✅ Dashboard fully loaded');
        
    } catch (error) {
        console.error('❌ Dashboard loading error:', error);
        showNotification(`Error loading dashboard data: ${error.message}`, 'error');
        
        // Show fallback message
        if (document.getElementById('totalSales')) {
            document.getElementById('totalSales').textContent = 'Error';
            document.getElementById('totalPurchases').textContent = 'Error';
            document.getElementById('netProfit').textContent = 'Error';
            document.getElementById('todaySales').textContent = 'Error';
            document.getElementById('todayPurchases').textContent = 'Error';
        }
    }
}

// Load quick chart for dashboard
async function loadQuickChart() {
    try {
        console.log('📈 Loading quick chart...');
        if (typeof Chart === 'undefined') {
            console.error('❌ Chart.js library not loaded');
            return;
        }
        
        const salesResponse = await fetch('/api/sales');
        if (!salesResponse.ok) {
            throw new Error(`Sales API error: ${salesResponse.status}`);
        }
        const salesData = await salesResponse.json();
        console.log('📊 Sales data for chart:', salesData.length, 'entries');
        
        const purchasesResponse = await fetch('/api/purchases');
        if (!purchasesResponse.ok) {
            throw new Error(`Purchases API error: ${purchasesResponse.status}`);
        }
        const purchaseData = await purchasesResponse.json();
        console.log('📊 Purchase data for chart:', purchaseData.length, 'entries');
        
        const monthlyData = {};
        
        salesData.forEach(sale => {
            const month = sale.sale_date ? sale.sale_date.substring(0, 7) : '';
            if (month && !monthlyData[month]) {
                monthlyData[month] = { sales: 0, purchases: 0 };
            }
            if (month) monthlyData[month].sales += parseFloat(sale.total || 0);
        });
        
        purchaseData.forEach(purchase => {
            const month = purchase.purchase_date ? purchase.purchase_date.substring(0, 7) : '';
            if (month && !monthlyData[month]) {
                monthlyData[month] = { sales: 0, purchases: 0 };
            }
            if (month) monthlyData[month].purchases += parseFloat(purchase.total || 0);
        });
        
        const sortedMonths = Object.keys(monthlyData).sort().slice(-6);
        console.log('📅 Chart months:', sortedMonths);
        
        const labels = sortedMonths.map(month => {
            const [year, monthNum] = month.split('-');
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            return `${monthNames[parseInt(monthNum) - 1]} ${year}`;
        });
        
        const salesValues = sortedMonths.map(month => monthlyData[month].sales);
        const purchaseValues = sortedMonths.map(month => monthlyData[month].purchases);
        
        console.log('📈 Chart data prepared - Labels:', labels);
        console.log('💚 Sales values:', salesValues);
        console.log('🔴 Purchase values:', purchaseValues);
        
        const ctx = document.getElementById('quickChart');
        if (!ctx) {
            console.error('❌ quickChart canvas element not found');
            return;
        }
        
        console.log('🎨 Creating chart...');
            if (window.quickChart && typeof window.quickChart.destroy === 'function') {
                window.quickChart.destroy();
            }
            
            window.quickChart = new Chart(ctx.getContext('2d'), {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Sales (₹)',
                        data: salesValues,
                        borderColor: '#22c55e',
                        backgroundColor: 'rgba(34, 197, 94, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4
                    }, {
                        label: 'Purchases (₹)',
                        data: purchaseValues,
                        borderColor: '#ef4444',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Monthly Sales vs Purchases',
                            font: { 
                                size: window.innerWidth < 768 ? 12 : 16, 
                                weight: 'bold' 
                            }
                        },
                        legend: { 
                            position: 'top',
                            labels: {
                                font: {
                                    size: window.innerWidth < 768 ? 10 : 12
                                },
                                padding: window.innerWidth < 768 ? 10 : 20
                            }
                        }
                    },
                    scales: {
                        x: {
                            ticks: {
                                font: {
                                    size: window.innerWidth < 768 ? 9 : 11
                                },
                                maxRotation: window.innerWidth < 768 ? 45 : 0
                            }
                        },
                        y: {
                            beginAtZero: true,
                            ticks: {
                                font: {
                                    size: window.innerWidth < 768 ? 9 : 11
                                },
                                callback: function(value) {
                                    return '₹' + value.toLocaleString('en-IN');
                                }
                            }
                        }
                    },
                    interaction: {
                        intersect: false,
                        mode: 'index'
                    }
                }
            });
        console.log('✅ Quick chart created successfully');
        
    } catch (error) {
        console.error('Error loading quick chart:', error);
        const chartContainer = document.getElementById('quickChart')?.parentElement;
        if (chartContainer) {
            chartContainer.innerHTML = '<p style="text-align: center; color: #666; padding: 2rem;">Chart loading failed. Data totals are shown above.</p>';
        }
    }
}

// Load recent transactions
async function loadRecentTransactions() {
    try {
        const salesResponse = await fetch('/api/sales');
        const salesData = await salesResponse.json();
        
        const purchasesResponse = await fetch('/api/purchases');
        const purchaseData = await purchasesResponse.json();
        
        const allTransactions = [
            ...salesData.map(sale => ({ 
                ...sale, 
                type: 'sale',
                date: sale.sale_date,
                contact: sale.customer,
                amount: sale.total,
                created_at: sale.created_at
            })),
            ...purchaseData.map(purchase => ({ 
                ...purchase, 
                type: 'purchase',
                date: purchase.purchase_date,
                contact: purchase.supplier,
                amount: purchase.total,
                created_at: purchase.created_at
            }))
        ];

        // Sort by creation time (most recent first), fallback to transaction date if no created_at
        allTransactions.sort((a, b) => {
            const dateA = new Date(a.created_at || a.date);
            const dateB = new Date(b.created_at || b.date);
            return dateB - dateA;
        });
        const recentTransactions = allTransactions.slice(0, 10);
        
        const container = document.getElementById('recentTransactions');
        if (container && recentTransactions.length > 0) {
            const transactionsList = recentTransactions.map(transaction => {
                const icon = transaction.type === 'sale' ? '📈' : '📉';
                const color = transaction.type === 'sale' ? '#22c55e' : '#ef4444';
                const sign = transaction.type === 'sale' ? '+' : '-';
                
                // Format creation time if available
                const createdDate = transaction.created_at ? new Date(transaction.created_at) : null;
                const displayDate = createdDate ? 
                    `Added: ${createdDate.toLocaleDateString('en-IN')} ${createdDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}` 
                    : `Date: ${transaction.date}`;
            
            return `
                    <div class="transaction-item" data-type="${transaction.type}">
                        <div class="transaction-header">
                            <span class="transaction-icon">${icon}</span>
                            <div class="transaction-contact">${transaction.contact}</div>
                            <div class="transaction-amount" style="color: ${color};">${sign}₹${parseFloat(transaction.amount || 0).toLocaleString('en-IN')}</div>
                        </div>
                        <div class="transaction-details">
                            <div>${transaction.description || 'No description'}</div>
                        </div>
                        <div class="transaction-meta">
                            <span>${displayDate}</span>
                        </div>
                    </div>
            `;
        }).join('');
        
            container.innerHTML = `
                <h3>Recent Transactions</h3>
                ${transactionsList}
            `;
        } else if (container) {
            container.innerHTML = '<p style="text-align: center; color: #666; padding: 2rem;">No recent transactions</p>';
        }
    } catch (error) {
        console.error('Error loading recent transactions:', error);
    }
}

// Update data count info
async function updateDataCountInfo() {
    try {
        const dataCountElement = document.getElementById('dataCountInfo');
        if (!dataCountElement) return;
        
        const salesResponse = await fetch('/api/sales');
        const salesData = await salesResponse.json();
        
        const purchasesResponse = await fetch('/api/purchases');
        const purchaseData = await purchasesResponse.json();
        
        const totalSales = salesData.reduce((sum, sale) => sum + parseFloat(sale.total || 0), 0);
        const totalPurchases = purchaseData.reduce((sum, purchase) => sum + parseFloat(purchase.total || 0), 0);
        
        dataCountElement.innerHTML = `
            <i class="fas fa-database"></i> 
            📊 ${salesData.length} Sales (₹${totalSales.toLocaleString('en-IN')}) • 
            📊 ${purchaseData.length} Purchases (₹${totalPurchases.toLocaleString('en-IN')})
        `;
    } catch (error) {
        console.error('Error updating data count:', error);
    }
}

// Form handlers
async function handleAddSale(e) {
    e.preventDefault();
    
    const saleData = {
        customer: document.getElementById('customerName').value,
        category: document.getElementById('saleCategory').value,
        description: document.getElementById('saleDescription').value,
        total: parseFloat(document.getElementById('saleTotal').value),
        paymentMethod: document.getElementById('paymentMethod').value,
        notes: document.getElementById('saleNotes').value,
        sale_date: document.getElementById('saleDate').value
    };
    
    try {
        const response = await fetch('/api/sales', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(saleData)
        });
        
        const result = await response.json();
        if (result.success) {
            showNotification('Sale added successfully! Redirecting to Dashboard...', 'success');
        e.target.reset();
        setSalesDefaults();
        await loadDashboard();
        
            // Update year options in case a new year was added
            populateYearOptions();
            
            // Navigate back to Dashboard
            setTimeout(() => {
                showSection('dashboard');
            }, 1500);
        } else {
            showNotification('Error adding sale', 'error');
        }
    } catch (error) {
        console.error('Add sale error:', error);
        showNotification('Error adding sale', 'error');
    }
}

async function handleAddPurchase(e) {
    e.preventDefault();
    
    const purchaseData = {
        supplier: document.getElementById('supplierName').value,
        category: document.getElementById('purchaseCategory').value,
        description: document.getElementById('purchaseDescription').value,
        total: parseFloat(document.getElementById('purchaseTotal').value),
        invoice_number: document.getElementById('invoiceNumber').value,
        notes: document.getElementById('purchaseNotes').value,
        purchase_date: document.getElementById('purchaseDate').value
    };
    
    try {
        const response = await fetch('/api/purchases', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(purchaseData)
        });
        
        const result = await response.json();
        if (result.success) {
            showNotification('Purchase added successfully! Redirecting to Dashboard...', 'success');
        e.target.reset();
        setPurchaseDefaults();
        await loadDashboard();
        
            // Update year options in case a new year was added
            populateYearOptions();
            
            // Navigate back to Dashboard
            setTimeout(() => {
                showSection('dashboard');
            }, 1500);
        } else {
            showNotification('Error adding purchase', 'error');
        }
    } catch (error) {
        console.error('Add purchase error:', error);
        showNotification('Error adding purchase', 'error');
    }
}

async function handleEditTransaction(e) {
    e.preventDefault();
    
    const id = document.getElementById('editTransactionId').value;
    const type = document.getElementById('editTransactionType').value;
    
    let endpoint = type === 'sale' ? '/api/sales' : '/api/purchases';
    let data = {};
    
    if (type === 'sale') {
        data = {
            customer: document.getElementById('editContact').value,
            category: document.getElementById('editCategory').value,
            description: document.getElementById('editDescription').value,
            total: parseFloat(document.getElementById('editTotal').value),
            paymentMethod: document.getElementById('editPaymentMethod').value,
            notes: document.getElementById('editNotes').value,
            sale_date: document.getElementById('editDate').value
        };
        } else {
        data = {
            supplier: document.getElementById('editContact').value,
            category: document.getElementById('editCategory').value,
            description: document.getElementById('editDescription').value,
            total: parseFloat(document.getElementById('editTotal').value),
            invoice_number: document.getElementById('editInvoiceNumber').value,
            notes: document.getElementById('editNotes').value,
            purchase_date: document.getElementById('editDate').value
        };
    }
    
    try {
        const response = await fetch(`${endpoint}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        if (result.success) {
            showNotification(`${type === 'sale' ? 'Sale' : 'Purchase'} updated successfully!`, 'success');
            closeEditModal();
        await loadDashboard();
        
            // Update year options in case the date was changed to a new year
            populateYearOptions();
            
            // If we're in the manage section, refresh the entries list
            const currentSection = document.querySelector('.admin-section.active');
            if (currentSection && currentSection.id === 'manage') {
                await searchAndFilterEntries();
            } else {
                // Navigate back to Dashboard only if not in manage section
                setTimeout(() => {
                    showSection('dashboard');
                }, 1500);
            }
        } else {
            showNotification(`Error updating ${type}`, 'error');
        }
    } catch (error) {
        console.error('Edit transaction error:', error);
        showNotification(`Error updating ${type}`, 'error');
    }
}

// Modal functions
function closeEditModal() {
    const modal = document.getElementById('editModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function populateEditForm(transaction, type) {
    document.getElementById('editDate').value = type === 'sale' ? transaction.sale_date || '' : transaction.purchase_date || '';
    document.getElementById('editContact').value = type === 'sale' ? transaction.customer || '' : transaction.supplier || '';
    document.getElementById('editCategory').value = transaction.category || '';
    document.getElementById('editDescription').value = transaction.description || '';
    document.getElementById('editTotal').value = transaction.total || '';
    document.getElementById('editNotes').value = transaction.notes || '';
    
    if (type === 'sale') {
        document.getElementById('editPaymentMethod').value = transaction.paymentMethod || transaction.payment_method || '';
        document.getElementById('editInvoiceNumber').value = '';
        document.getElementById('editInvoiceNumber').style.display = 'none';
        document.getElementById('editPaymentMethod').style.display = 'block';
    } else {
        document.getElementById('editPaymentMethod').value = '';
        document.getElementById('editPaymentMethod').style.display = 'none';
        document.getElementById('editInvoiceNumber').value = transaction.invoice_number || '';
        document.getElementById('editInvoiceNumber').style.display = 'block';
    }
    
    document.getElementById('editTransactionId').value = transaction.id;
    document.getElementById('editTransactionType').value = type;
}

// Utility functions
function setSalesDefaults() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('saleDate').value = today;
    document.getElementById('customerName').value = 'All Customers';
    document.getElementById('saleCategory').value = 'bike-parts';
    document.getElementById('saleDescription').value = 'Todays total sale including everything';
    document.getElementById('paymentMethod').value = 'Cash & Online Both';
}

function setPurchaseDefaults() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('purchaseDate').value = today;
    document.getElementById('supplierName').value = 'Lakhan Autoparts';
    document.getElementById('purchaseCategory').value = 'bike-parts';
    document.getElementById('purchaseDescription').value = 'Purchased this/these items today';
}

// Navigation functions
function setupNavigation() {
    window.showSection = function(sectionName) {
        const sections = document.querySelectorAll('.admin-section');
        sections.forEach(section => {
            section.classList.remove('active');
        });
        
        const navButtons = document.querySelectorAll('.nav-btn');
        navButtons.forEach(btn => {
            btn.classList.remove('active');
        });
        
        document.getElementById(sectionName).classList.add('active');
        
        // Find and activate the correct navigation button
        const targetButton = document.querySelector(`[onclick="showSection('${sectionName}')"]`);
        if (targetButton) {
            targetButton.classList.add('active');
        } else if (event && event.target) {
        event.target.classList.add('active');
        }
        
        if (sectionName === 'dashboard') {
            loadDashboard();
        } else if (sectionName === 'sales') {
            setSalesDefaults();
        } else if (sectionName === 'purchase') {
            setPurchaseDefaults();
        } else if (sectionName === 'manage') {
            loadManageEntries();
        } else if (sectionName === 'reports') {
            updateDataCountInfo();
            populateYearOptions(); // Refresh year options when entering reports
            generateReport();
        }
    };
}

// Report generation
async function generateReport() {
    try {
        const reportType = document.getElementById('reportType').value;
        const reportMonth = document.getElementById('reportMonth').value;
        const reportYear = document.getElementById('reportYear').value;
        
        // Get all data from server
        const salesResponse = await fetch('/api/sales');
        const salesData = await salesResponse.json();
        
        const purchasesResponse = await fetch('/api/purchases');
        const purchaseData = await purchasesResponse.json();
        
        // Apply filters client-side
        let filteredSales = salesData;
        let filteredPurchases = purchaseData;
        
        // Filter by month and year
        if (reportMonth || reportYear) {
            filteredSales = salesData.filter(sale => {
                const saleDate = sale.sale_date;
                if (!saleDate) return false;
                
                const [year, month] = saleDate.split('-');
                
                if (reportMonth && month !== reportMonth) return false;
                if (reportYear && year !== reportYear) return false;
                
                return true;
            });
            
            filteredPurchases = purchaseData.filter(purchase => {
                const purchaseDate = purchase.purchase_date;
                if (!purchaseDate) return false;
                
                const [year, month] = purchaseDate.split('-');
                
                if (reportMonth && month !== reportMonth) return false;
                if (reportYear && year !== reportYear) return false;
                
                return true;
            });
        }
        
        // Apply report type filter
        if (reportType === 'sales') {
            filteredPurchases = [];
        } else if (reportType === 'purchases') {
            filteredSales = [];
        }
        
        generateReportChart(filteredSales, filteredPurchases, reportType);
        generateReportTable(filteredSales, filteredPurchases, reportType);
        
    } catch (error) {
        console.error('Generate report error:', error);
        showNotification('Error generating report', 'error');
    }
}

function generateReportChart(salesData, purchaseData, reportType) {
    if (typeof Chart === 'undefined') {
        console.error('Chart.js library not loaded');
        return;
    }
    
    const ctx = document.getElementById('reportChart');
    if (!ctx) return;
    
    const dateData = {};
    
        salesData.forEach(sale => {
            const date = sale.sale_date;
        if (!dateData[date]) dateData[date] = { sales: 0, purchases: 0 };
        dateData[date].sales += parseFloat(sale.total || 0);
    });
    
        purchaseData.forEach(purchase => {
            const date = purchase.purchase_date;
        if (!dateData[date]) dateData[date] = { sales: 0, purchases: 0 };
        dateData[date].purchases += parseFloat(purchase.total || 0);
    });
    
    const sortedDates = Object.keys(dateData).sort();
    const salesValues = sortedDates.map(date => dateData[date].sales);
    const purchaseValues = sortedDates.map(date => dateData[date].purchases);
    
    // Calculate totals for the summary
    const totalSalesAmount = salesData.reduce((sum, sale) => sum + parseFloat(sale.total || 0), 0);
    const totalPurchasesAmount = purchaseData.reduce((sum, purchase) => sum + parseFloat(purchase.total || 0), 0);
    const netProfitAmount = totalSalesAmount - totalPurchasesAmount;
    
    // Update chart summary
    const chartSummary = document.getElementById('chartSummary');
    const totalSalesElement = document.getElementById('totalSalesAmount');
    const totalPurchasesElement = document.getElementById('totalPurchasesAmount');
    const netProfitElement = document.getElementById('netProfitAmount');
    
    if (chartSummary && totalSalesElement && totalPurchasesElement && netProfitElement) {
        chartSummary.style.display = 'block';
        totalSalesElement.textContent = `₹${totalSalesAmount.toLocaleString('en-IN')}`;
        totalPurchasesElement.textContent = `₹${totalPurchasesAmount.toLocaleString('en-IN')}`;
        netProfitElement.textContent = `₹${netProfitAmount.toLocaleString('en-IN')}`;
        
        // Color the net profit based on positive/negative
        if (netProfitAmount >= 0) {
            netProfitElement.style.color = '#22c55e';
        } else {
            netProfitElement.style.color = '#ef4444';
        }
    }
    
    if (window.reportChart && typeof window.reportChart.destroy === 'function') {
        window.reportChart.destroy();
    }
    
    window.reportChart = new Chart(ctx.getContext('2d'), {
        type: 'bar',
        data: {
            labels: sortedDates,
            datasets: [{
                label: 'Sales (₹)',
                data: salesValues,
                backgroundColor: 'rgba(34, 197, 94, 0.8)',
                borderColor: '#22c55e',
                borderWidth: 1
            }, {
                label: 'Purchases (₹)',
                data: purchaseValues,
                backgroundColor: 'rgba(239, 68, 68, 0.8)',
                borderColor: '#ef4444',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Performance Analysis',
                    font: { 
                        size: window.innerWidth < 768 ? 12 : 16, 
                        weight: 'bold' 
                    }
                },
                legend: {
                    labels: {
                        font: {
                            size: window.innerWidth < 768 ? 10 : 12
                        },
                        padding: window.innerWidth < 768 ? 10 : 20
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        font: {
                            size: window.innerWidth < 768 ? 9 : 11
                        },
                        maxRotation: window.innerWidth < 768 ? 45 : 0
                    }
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        font: {
                            size: window.innerWidth < 768 ? 9 : 11
                        },
                        callback: function(value) {
                            return '₹' + value.toLocaleString('en-IN');
                        }
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });
}

function generateReportTable(salesData, purchaseData, reportType) {
    const tableContainer = document.getElementById('reportTable');
    if (!tableContainer) return;
    
    const allData = [
        ...salesData.map(s => ({...s, type: 'Sale'})),
        ...purchaseData.map(p => ({...p, type: 'Purchase'}))
    ];
    
    if (allData.length === 0) {
        tableContainer.innerHTML = '<p style="text-align: center; color: #666; padding: 2rem;">No data found for selected filters</p>';
        return;
    }
    
    const tableHTML = `
        <table style="width: 100%; border-collapse: collapse; margin-top: 1rem;">
                <thead>
                <tr style="background: #f3f4f6;">
                    <th style="padding: 0.75rem; text-align: left; border: 1px solid #d1d5db;">Date</th>
                    <th style="padding: 0.75rem; text-align: left; border: 1px solid #d1d5db;">Type</th>
                    <th style="padding: 0.75rem; text-align: left; border: 1px solid #d1d5db;">Contact</th>
                    <th style="padding: 0.75rem; text-align: left; border: 1px solid #d1d5db;">Description</th>
                    <th style="padding: 0.75rem; text-align: right; border: 1px solid #d1d5db;">Amount</th>
                    </tr>
                </thead>
                <tbody>
                ${allData.map(item => `
                    <tr>
                        <td style="padding: 0.75rem; border: 1px solid #d1d5db;">${item.sale_date || item.purchase_date}</td>
                        <td style="padding: 0.75rem; border: 1px solid #d1d5db;">${item.type}</td>
                        <td style="padding: 0.75rem; border: 1px solid #d1d5db;">${item.customer || item.supplier}</td>
                        <td style="padding: 0.75rem; border: 1px solid #d1d5db;">${item.description}</td>
                        <td style="padding: 0.75rem; border: 1px solid #d1d5db; text-align: right;">₹${parseFloat(item.total || 0).toLocaleString('en-IN')}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
    `;
    
    tableContainer.innerHTML = tableHTML;
}

// Notification system
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#22c55e' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 10000;
        max-width: 400px;
        font-weight: 500;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        notification.style.transition = 'all 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Today's sales and purchases click functionality
function makeTodayStatsClickable() {
    const todaySalesElement = document.getElementById('todaySales');
    const todayPurchasesElement = document.getElementById('todayPurchases');
    
    if (todaySalesElement) {
        todaySalesElement.style.cursor = 'pointer';
        todaySalesElement.style.transition = 'transform 0.2s ease';
        todaySalesElement.addEventListener('click', function() {
            const today = new Date().toISOString().split('T')[0];
            showSection('reports');
            const reportType = document.getElementById('reportType');
            const reportMonth = document.getElementById('reportMonth');
            const reportYear = document.getElementById('reportYear');
            if (reportType && reportMonth && reportYear) {
                reportType.value = 'sales'; // Filter to sales only
                const [year, month] = today.split('-');
                reportMonth.value = month;
                reportYear.value = year;
                generateReport();
            }
        });
        
        // Hover effects
        todaySalesElement.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.05)';
        });
        todaySalesElement.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
        });
    }
    
    if (todayPurchasesElement) {
        todayPurchasesElement.style.cursor = 'pointer';
        todayPurchasesElement.style.transition = 'transform 0.2s ease';
        todayPurchasesElement.addEventListener('click', function() {
            const today = new Date().toISOString().split('T')[0];
            showSection('reports');
            const reportType = document.getElementById('reportType');
            const reportMonth = document.getElementById('reportMonth');
            const reportYear = document.getElementById('reportYear');
            if (reportType && reportMonth && reportYear) {
                reportType.value = 'purchases'; // Filter to purchases only
                const [year, month] = today.split('-');
                reportMonth.value = month;
                reportYear.value = year;
                generateReport();
            }
        });
        
        // Hover effects
        todayPurchasesElement.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.05)';
        });
        todayPurchasesElement.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
        });
    }
}

// Report Button State Management Functions
function setButtonState(buttonElement, state) {
    if (!buttonElement) return;
    
    // Remove all state classes
    buttonElement.classList.remove('active', 'pressed', 'loading', 'success', 'ripple');
    
    // Add the specified state
    if (state) {
        buttonElement.classList.add(state);
    }
    
    // Auto-remove some states after delay
    if (state === 'success') {
        setTimeout(() => {
            buttonElement.classList.remove('success');
        }, 2000);
    }
    
    if (state === 'pressed') {
        setTimeout(() => {
            buttonElement.classList.remove('pressed');
        }, 150);
    }
    
    if (state === 'ripple') {
        setTimeout(() => {
            buttonElement.classList.remove('ripple');
        }, 600);
    }
}

function addButtonClickEffects() {
    // Get report buttons
    const generateBtn = document.querySelector('[onclick="generateReport()"]');
    const exportBtn = document.querySelector('[onclick="exportToExcel()"]');
    
    // Add click effects to Generate Report button
    if (generateBtn) {
        generateBtn.addEventListener('mousedown', function() {
            setButtonState(this, 'pressed');
        });
        
        generateBtn.addEventListener('mouseup', function() {
            setButtonState(this, 'ripple');
        });
        
        generateBtn.addEventListener('click', function() {
            setButtonState(this, 'active');
        });
    }
    
    // Add click effects to Export Excel button  
    if (exportBtn) {
        exportBtn.addEventListener('mousedown', function() {
            setButtonState(this, 'pressed');
        });
        
        exportBtn.addEventListener('mouseup', function() {
            setButtonState(this, 'ripple');
        });
        
        exportBtn.addEventListener('click', function() {
            setButtonState(this, 'active');
        });
    }
}

// Enhanced Report Generation with Button States
async function generateReport() {
    const generateBtn = document.querySelector('[onclick="generateReport()"]');
    
    try {
        // Set loading state
        setButtonState(generateBtn, 'loading');
        
        const reportType = document.getElementById('reportType').value;
        const reportMonth = document.getElementById('reportMonth').value;
        const reportYear = document.getElementById('reportYear').value;
        
        // Get all data from server
        const salesResponse = await fetch('/api/sales');
        const salesData = await salesResponse.json();
        
        const purchasesResponse = await fetch('/api/purchases');
        const purchaseData = await purchasesResponse.json();
        
        // Apply filters client-side
        let filteredSales = salesData;
        let filteredPurchases = purchaseData;
        
        // Filter by month and year
        if (reportMonth || reportYear) {
            filteredSales = salesData.filter(sale => {
                const saleDate = sale.sale_date;
                if (!saleDate) return false;
                
                const [year, month] = saleDate.split('-');
                
                if (reportMonth && month !== reportMonth) return false;
                if (reportYear && year !== reportYear) return false;
                
                return true;
            });
            
            filteredPurchases = purchaseData.filter(purchase => {
                const purchaseDate = purchase.purchase_date;
                if (!purchaseDate) return false;
                
                const [year, month] = purchaseDate.split('-');
                
                if (reportMonth && month !== reportMonth) return false;
                if (reportYear && year !== reportYear) return false;
                
                return true;
            });
        }
        
        // Apply report type filter
        if (reportType === 'sales') {
            filteredPurchases = [];
        } else if (reportType === 'purchases') {
            filteredSales = [];
        }
        
        // Generate chart and table
        generateReportChart(filteredSales, filteredPurchases, reportType);
        generateReportTable(filteredSales, filteredPurchases, reportType);
        
        // Set success state
        setButtonState(generateBtn, 'success');
        
        console.log('✅ Report generated successfully');
        
    } catch (error) {
        console.error('Error generating report:', error);
        setButtonState(generateBtn, ''); // Remove loading state
        showNotification('Error generating report. Please try again.', 'error');
    }
}

// Enhanced Excel Export with Button States  
async function exportToExcel() {
    const exportBtn = document.querySelector('[onclick="exportToExcel()"]');
    
    try {
        // Set loading state
        setButtonState(exportBtn, 'loading');
        
        // Check if XLSX library is loaded
        if (typeof XLSX === 'undefined') {
            setButtonState(exportBtn, ''); // Remove loading state
            showNotification('Excel library not loaded. Please refresh the page.', 'error');
            return;
        }

        const reportType = document.getElementById('reportType').value;
        const reportMonth = document.getElementById('reportMonth').value;
        const reportYear = document.getElementById('reportYear').value;
        
        // Get filtered data using same logic as generateReport
        const salesResponse = await fetch('/api/sales');
        const salesData = await salesResponse.json();
        
        const purchasesResponse = await fetch('/api/purchases');
        const purchaseData = await purchasesResponse.json();
        
        let filteredSales = salesData;
        let filteredPurchases = purchaseData;
        
        // Apply filters
        if (reportMonth || reportYear) {
            filteredSales = salesData.filter(sale => {
                const saleDate = sale.sale_date;
                if (!saleDate) return false;
                const [year, month] = saleDate.split('-');
                if (reportMonth && month !== reportMonth) return false;
                if (reportYear && year !== reportYear) return false;
                return true;
            });
            
            filteredPurchases = purchaseData.filter(purchase => {
                const purchaseDate = purchase.purchase_date;
                if (!purchaseDate) return false;
                const [year, month] = purchaseDate.split('-');
                if (reportMonth && month !== reportMonth) return false;
                if (reportYear && year !== reportYear) return false;
                return true;
            });
        }
        
        // Apply report type filter (but still create both tabs for full Excel export)
        let salesForExport = filteredSales;
        let purchasesForExport = filteredPurchases;

        // Create workbook
        const wb = XLSX.utils.book_new();

        // Sales sheet
        if (salesForExport.length > 0) {
            const salesSheet = salesForExport.map(sale => ({
                'Date': sale.sale_date,
                'Customer': sale.customer_name,
                'Description': sale.product_description,
                'Quantity': sale.quantity,
                'Unit Price (₹)': parseFloat(sale.unit_price || 0),
                'Total Amount (₹)': parseFloat(sale.total_amount || 0),
                'Payment Method': sale.payment_method || 'N/A'
            }));
            
            const salesWS = XLSX.utils.json_to_sheet(salesSheet);
            XLSX.utils.book_append_sheet(wb, salesWS, "Sales");
        }

        // Purchases sheet  
        if (purchasesForExport.length > 0) {
            const purchasesSheet = purchasesForExport.map(purchase => ({
                'Date': purchase.purchase_date,
                'Supplier': purchase.supplier_name,
                'Description': purchase.product_description,
                'Quantity': purchase.quantity,
                'Unit Price (₹)': parseFloat(purchase.unit_price || 0),
                'Total Amount (₹)': parseFloat(purchase.total_amount || 0),
                'Payment Method': purchase.payment_method || 'N/A'
            }));
            
            const purchasesWS = XLSX.utils.json_to_sheet(purchasesSheet);
            XLSX.utils.book_append_sheet(wb, purchasesWS, "Purchases");
        }

        // Generate filename
        let filename = 'Khan_Automobiles_Report';
        if (reportMonth) filename += `_${getMonthName(reportMonth)}`;
        if (reportYear) filename += `_${reportYear}`;
        filename += '.xlsx';

        // Write file
        XLSX.writeFile(wb, filename);
        
        // Set success state
        setButtonState(exportBtn, 'success');
        
        console.log('✅ Excel export completed successfully');
        showNotification(`Excel file "${filename}" downloaded successfully!`, 'success');
        
    } catch (error) {
        console.error('Export to Excel error:', error);
        setButtonState(exportBtn, ''); // Remove loading state
        showNotification('Error exporting to Excel. Please try again.', 'error');
    }
}

function getMonthName(monthNumber) {
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[parseInt(monthNumber) - 1] || '';
}

// Populate year options dynamically based on actual data
async function populateYearOptions() {
    const yearSelect = document.getElementById('reportYear');
    if (!yearSelect) return;
    
    try {
        // Get all sales and purchase data to find the year range
        const salesResponse = await fetch('/api/sales');
        const salesData = await salesResponse.json();
        
        const purchasesResponse = await fetch('/api/purchases');
        const purchaseData = await purchasesResponse.json();
        
        // Extract all years from the data
        const allYears = new Set();
        
        // Add years from sales data
        salesData.forEach(sale => {
            if (sale.sale_date) {
                const year = new Date(sale.sale_date).getFullYear();
                if (year && !isNaN(year)) {
                    allYears.add(year);
                }
            }
        });
        
        // Add years from purchase data
        purchaseData.forEach(purchase => {
            if (purchase.purchase_date) {
                const year = new Date(purchase.purchase_date).getFullYear();
                if (year && !isNaN(year)) {
                    allYears.add(year);
                }
            }
        });
        
        // Add current year if no data exists yet
        const currentYear = new Date().getFullYear();
        allYears.add(currentYear);
        
        // Convert to sorted array (newest first)
        const years = Array.from(allYears).sort((a, b) => b - a);
        
        // Clear existing options except "All Years"
        yearSelect.innerHTML = '<option value="">All Years</option>';
        
        // Add all years that have data
        years.forEach(year => {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            yearSelect.appendChild(option);
        });
        
        console.log(`Populated year filter with years: ${years.join(', ')}`);
        
    } catch (error) {
        console.error('Error populating year options:', error);
        
        // Fallback: Use current year and 2 previous years if API call fails
        const currentYear = new Date().getFullYear();
        const fallbackYears = [currentYear, currentYear - 1, currentYear - 2];
        
        yearSelect.innerHTML = '<option value="">All Years</option>';
        fallbackYears.forEach(year => {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            yearSelect.appendChild(option);
        });
    }
}

// Initialize everything
document.addEventListener('DOMContentLoaded', function() {
    setupNavigation();
    setTimeout(makeTodayStatsClickable, 1000);
    setTimeout(async () => {
        await populateYearOptions();
    }, 500);
    setTimeout(addButtonClickEffects, 1000); // Add button effects after DOM is ready
});

// Manage Entries functionality
let allEntries = [];
let filteredEntries = [];
let currentPage = 1;
const entriesPerPage = 20;

async function loadManageEntries() {
    try {
        // Load all entries when entering manage section
        await searchAndFilterEntries();
    } catch (error) {
        console.error('Error loading manage entries:', error);
        showNotification('Error loading entries', 'error');
    }
}

async function searchAndFilterEntries() {
    try {
        // Get all data
        const salesResponse = await fetch('/api/sales');
        const salesData = await salesResponse.json();
        
        const purchasesResponse = await fetch('/api/purchases');
        const purchaseData = await purchasesResponse.json();
        
        // Combine all entries
        allEntries = [
            ...salesData.map(sale => ({
                ...sale,
                type: 'sale',
                contact: sale.customer,
                date: sale.sale_date,
                created_at: sale.created_at
            })),
            ...purchaseData.map(purchase => ({
                ...purchase,
                type: 'purchase',
                contact: purchase.supplier,
                date: purchase.purchase_date,
                created_at: purchase.created_at
            }))
        ];
        
        // Apply filters
        const searchTerm = document.getElementById('searchEntries').value.toLowerCase();
        const filterType = document.getElementById('filterType').value;
        const filterCategory = document.getElementById('filterCategory').value;
        
        filteredEntries = allEntries.filter(entry => {
            // Search filter
            if (searchTerm && !entry.contact?.toLowerCase().includes(searchTerm) && 
                !entry.description?.toLowerCase().includes(searchTerm)) {
                return false;
            }
            
            // Type filter
            if (filterType !== 'all' && entry.type !== filterType.slice(0, -1)) {
                return false;
            }
            
            // Category filter
            if (filterCategory && entry.category !== filterCategory) {
                return false;
            }
            
            return true;
        });
        
        // Sort by creation time (most recent first), fallback to transaction date if no created_at
        filteredEntries.sort((a, b) => {
            const dateA = new Date(a.created_at || a.date);
            const dateB = new Date(b.created_at || b.date);
            return dateB - dateA;
        });
        
        currentPage = 1;
        displayEntries();
        updatePagination();
        
    } catch (error) {
        console.error('Error searching entries:', error);
        showNotification('Error searching entries', 'error');
    }
}

function displayEntries() {
    const tableBody = document.getElementById('entriesTableBody');
    
    if (filteredEntries.length === 0) {
        tableBody.innerHTML = `
            <div style="padding: 3rem; text-align: center; color: #6b7280;">
                <i class="fas fa-inbox" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;"></i>
                <p>No entries found matching your criteria.</p>
            </div>
        `;
        return;
    }
    
    const startIndex = (currentPage - 1) * entriesPerPage;
    const endIndex = startIndex + entriesPerPage;
    const pageEntries = filteredEntries.slice(startIndex, endIndex);
    
    tableBody.innerHTML = pageEntries.map(entry => {
        // Format creation date/time
        const createdDate = entry.created_at ? new Date(entry.created_at) : null;
        const createdDisplay = createdDate ? 
            `${createdDate.toLocaleDateString('en-IN')} ${createdDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}` 
            : 'N/A';
        
        return `
        <div style="padding: 1rem; border-bottom: 1px solid #e2e8f0; display: grid; grid-template-columns: 100px 120px 130px 150px 180px 120px 120px 130px; gap: 1rem; align-items: center; transition: background-color 0.2s;" 
             onmouseover="this.style.backgroundColor='#f8fafc'" 
             onmouseout="this.style.backgroundColor='white'">
            <div style="font-size: 14px;">${entry.date || 'N/A'}</div>
            <div>
                <span class="badge ${entry.type === 'sale' ? 'badge-success' : 'badge-danger'}" style="display: inline-block; padding: 0.25rem 0.5rem; border-radius: 12px; font-size: 12px; font-weight: 600; color: white; background: ${entry.type === 'sale' ? '#22c55e' : '#ef4444'};">
                    ${entry.type === 'sale' ? 'Sale' : 'Purchase'}
                </span>
            </div>
            <div style="font-size: 14px; font-weight: 500;">${entry.contact || 'N/A'}</div>
            <div style="font-size: 14px;">${entry.category || 'N/A'}</div>
            <div style="font-size: 14px;" title="${entry.description || ''}">${(entry.description || 'N/A').length > 25 ? (entry.description || 'N/A').substring(0, 25) + '...' : (entry.description || 'N/A')}</div>
            <div style="font-size: 14px; font-weight: 600;">₹${parseFloat(entry.total || 0).toLocaleString('en-IN')}</div>
            <div style="font-size: 12px; color: #6b7280;" title="${createdDisplay}">${createdDisplay}</div>
            <div style="display: flex; gap: 0.5rem;">
                <button onclick="editEntry(${entry.id}, '${entry.type}')" class="btn-sm btn-primary" style="padding: 0.25rem 0.5rem; font-size: 12px; border-radius: 6px;" title="Edit Entry">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteEntry(${entry.id}, '${entry.type}')" class="btn-sm btn-danger" style="padding: 0.25rem 0.5rem; font-size: 12px; border-radius: 6px; background: #ef4444; border: none; color: white;" title="Delete Entry">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
        `;
    }).join('');
}

function updatePagination() {
    const totalPages = Math.ceil(filteredEntries.length / entriesPerPage);
    const pagination = document.getElementById('entriesPagination');
    const pageInfo = document.getElementById('pageInfo');
    const prevBtn = document.getElementById('prevPageBtn');
    const nextBtn = document.getElementById('nextPageBtn');
    
    if (totalPages <= 1) {
        pagination.style.display = 'none';
        return;
    }
    
    pagination.style.display = 'flex';
    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages;
    
    prevBtn.style.opacity = currentPage === 1 ? '0.5' : '1';
    nextBtn.style.opacity = currentPage === totalPages ? '0.5' : '1';
}

function previousPage() {
    if (currentPage > 1) {
        currentPage--;
        displayEntries();
        updatePagination();
    }
}

function nextPage() {
    const totalPages = Math.ceil(filteredEntries.length / entriesPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        displayEntries();
        updatePagination();
    }
}

async function editEntry(id, type) {
    try {
        // Find the entry in our local data
        const entry = allEntries.find(e => e.id === id && e.type === type);
        if (!entry) {
            showNotification('Entry not found', 'error');
            return;
        }
        
        // Use the existing populateEditForm function
        populateEditForm(entry, type);
        
        // Show the existing edit modal
        document.getElementById('editModal').style.display = 'block';
        
    } catch (error) {
        console.error('Error editing entry:', error);
        showNotification('Error loading entry for editing', 'error');
    }
}

async function deleteEntry(id, type) {
    if (!confirm(`Are you sure you want to delete this ${type}?\n\nThis action cannot be undone.`)) {
        return;
    }
    
    try {
        const endpoint = type === 'sale' ? '/api/sales' : '/api/purchases';
        const response = await fetch(`${endpoint}/${id}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        if (result.success) {
            showNotification(`${type === 'sale' ? 'Sale' : 'Purchase'} deleted successfully!`, 'success');
            
            // Refresh the entries list
            await searchAndFilterEntries();
            
            // Refresh dashboard
            await loadDashboard();
            
            // Update year options in case we deleted all entries from a year
            populateYearOptions();
        } else {
            showNotification(`Error deleting ${type}`, 'error');
        }
    } catch (error) {
        console.error('Delete entry error:', error);
        showNotification(`Error deleting ${type}`, 'error');
    }
}

// Make functions globally available
window.logout = logout;
window.populateEditForm = populateEditForm;
window.closeEditModal = closeEditModal;
window.showSection = showSection;
window.generateReport = generateReport;
window.exportToExcel = exportToExcel;
window.searchAndFilterEntries = searchAndFilterEntries;
window.previousPage = previousPage;
window.nextPage = nextPage;
window.editEntry = editEntry;
window.deleteEntry = deleteEntry; 