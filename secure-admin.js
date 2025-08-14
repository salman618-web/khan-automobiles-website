// Clean Secure Admin JavaScript - Works with simple server
// No JWT tokens, no complex authentication - just working functionality
// deploy: no-op 5

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
        
        // Redirect to home after a longer delay
        setTimeout(() => {
            window.location.href = '/';
        }, 1000);
        
    } catch (error) {
        console.error('Initialization error:', error);
        showNotification('Authentication error. Redirecting to login...', 'error');
        setTimeout(() => {
            window.location.href = '/';
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
        
        // If on admin page without authentication, redirect to home
        if (window.location.pathname === '/admin' || window.location.pathname.endsWith('/admin.html')) {
            setTimeout(() => {
                window.location.href = '/';
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
    // Login form handler - only handle if we're on admin
    // On home (/), script.js handles the login form
    const adminForm = document.getElementById('adminForm');
    if (adminForm && (window.location.pathname === '/admin' || window.location.pathname.endsWith('/admin.html'))) {
        console.log('ℹ️ Setting up admin form handler on /admin');
        adminForm.addEventListener('submit', handleLogin);
    } else if (adminForm) {
        console.log('ℹ️ Login form found but on home - script.js will handle it');
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
            console.log('✅ Login successful on /admin (unlikely scenario)');
            
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
        setTimeout(() => window.location.href = '/', 1000);
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
        console.log('📊 Loading dashboard data...');
        const response = await fetch('/api/dashboard');
        const dashboardData = await response.json();
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
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
        await loadSalesPieChart();
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
        if (typeof echarts === 'undefined') {
            console.error('❌ ECharts library not loaded');
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
        
        // Helper to normalize to YYYY-MM from various date strings
        function toYearMonth(dateStr) {
            if (!dateStr) return '';
            if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) return dateStr.substring(0, 7);
            const d = new Date(dateStr);
            if (Number.isNaN(d.getTime())) return '';
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            return `${y}-${m}`;
        }
        
        // Aggregate by YYYY-MM
        const monthly = {};
        salesData.forEach(sale => {
            const ym = toYearMonth(sale.sale_date || sale.date);
            if (!ym) return;
            if (!monthly[ym]) monthly[ym] = { sales: 0, purchases: 0, saleCount: 0 };
            const total = parseFloat(sale.total || 0) || 0;
            monthly[ym].sales += total;
            monthly[ym].saleCount += 1;
        });
        purchaseData.forEach(p => {
            const ym = toYearMonth(p.purchase_date || p.date);
            if (!ym) return;
            if (!monthly[ym]) monthly[ym] = { sales: 0, purchases: 0, saleCount: 0 };
            const total = parseFloat(p.total || 0) || 0;
            monthly[ym].purchases += total;
        });
        
        const months = Object.keys(monthly).sort().slice(-3);
        if (months.length === 0) {
            const c = document.getElementById('quickChart');
            if (c) c.innerHTML = '<p style="text-align:center;color:#666;padding:2rem;">No data to chart yet</p>';
            return;
        }
        
        const labels = months.map(m => {
            const [year, monthNum] = m.split('-');
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            return `${monthNames[parseInt(monthNum) - 1]} ${year}`;
        });
        const salesBarData = months.map(m => ({ value: Number(monthly[m].sales || 0), saleCount: monthly[m].saleCount || 0 }));
const purchaseValues = months.map(m => Number(monthly[m].purchases || 0));
const avgSaleValues = months.map(m => {
    const count = monthly[m].saleCount || 0;
    return count > 0 ? Number(monthly[m].sales) / count : null; // null hides points with no data
});
        
        const el = document.getElementById('quickChart');
        if (!el) {
            console.error('❌ quickChart element not found');
            return;
        }
        
        // If container has too small height due to layout, ensure a reasonable minimum
        try {
            const rect = el.getBoundingClientRect();
            if (rect.height < 260) {
                el.style.minHeight = '360px';
            }
        } catch (_) {}
        
        // Init or reuse chart instance
        if (!window._quickEChart) {
            window._quickEChart = echarts.init(el, null, { renderer: 'canvas' });
        }
        const chart = window._quickEChart;
        
        const isSmall = window.innerWidth < 768;
        
        const option = {
            backgroundColor: 'transparent',
            title: {
                text: 'Monthly Sales vs Purchases',
                left: 'center',
                top: 6,
                textStyle: { fontSize: isSmall ? 14 : 16, fontWeight: 'bold' }
            },
            grid: { left: isSmall ? 48 : 56, right: isSmall ? 28 : 40, top: isSmall ? 54 : 80, bottom: isSmall ? 72 : 50, containLabel: true },
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'cross' },
                formatter: params => {
                    let s = `<strong>${params[0]?.axisValueLabel || ''}</strong><br/>`;
                    params.forEach(p => {
                        const raw = p.data && typeof p.data === 'object' && 'value' in p.data ? p.data.value : p.value;
                        const val = raw == null ? '-' : `₹${Number(raw).toLocaleString('en-IN')}`;
                        const countSuffix = (p.seriesName === 'Sales (₹)' && p.data && typeof p.data.saleCount === 'number') ? ` (${p.data.saleCount} sales)` : '';
                        s += `${p.marker} ${p.seriesName}: ${val}${countSuffix}<br/>`;
                    });
                    return s;
                }
            },
            legend: {
                type: isSmall ? 'scroll' : 'plain',
                top: isSmall ? null : 34,
                bottom: isSmall ? 6 : undefined,
                left: 'center',
                orient: 'horizontal',
                itemGap: isSmall ? 8 : 20,
                textStyle: { fontSize: isSmall ? 11 : 12 },
                data: ['Sales (₹)', 'Purchases (₹)', 'Avg Sale (₹)']
            },
            xAxis: [{
                type: 'category',
                data: labels,
                boundaryGap: true,
                axisTick: { alignWithLabel: true },
                axisLabel: { rotate: isSmall ? 45 : 0, fontSize: isSmall ? 10 : 12, hideOverlap: true }
            }],
            yAxis: [
                {
                    type: 'value',
                    name: 'Amount (₹)',
                    min: 0,
                    axisLabel: { formatter: val => `₹${Number(val).toLocaleString('en-IN')}`, fontSize: isSmall ? 10 : 12, hideOverlap: true },
                    splitLine: { show: true }
                }
            ],
            series: [
                {
                    name: 'Sales (₹)',
                    type: 'bar',
                    data: salesBarData,
                    itemStyle: { color: '#22c55e', borderRadius: [6, 6, 0, 0] },
                    barWidth: isSmall ? 8 : 12,
                    barGap: '0%',
                    barCategoryGap: '45%',
                    label: { show: !isSmall, position: 'top', formatter: (p) => (p.data && typeof p.data.saleCount === 'number' && p.data.saleCount > 0) ? `${p.data.saleCount}` : '' }
                },
                {
                    name: 'Purchases (₹)',
                    type: 'bar',
                    data: purchaseValues,
                    itemStyle: { color: '#ef4444', borderRadius: [6, 6, 0, 0] },
                    barWidth: isSmall ? 8 : 12,
                    barGap: '0%',
                    barCategoryGap: '45%'
                },
                {
                    name: 'Avg Sale (₹)',
                    type: 'line',
                    data: avgSaleValues,
                    smooth: true,
                    symbol: 'circle',
                    symbolSize: isSmall ? 6 : 8,
                    z: 3,
                    lineStyle: { width: isSmall ? 2 : 3, color: '#3b82f6' },
                    itemStyle: { color: '#3b82f6' }
                }
            ],
            animationDuration: 600,
            media: [
                {
                    query: { maxWidth: 480 },
                    option: {
                        grid: { left: 42, right: 20, top: 50, bottom: 80, containLabel: true },
                        title: { textStyle: { fontSize: 13 } },
                        legend: { type: 'scroll', bottom: 6, top: null, textStyle: { fontSize: 10 } }
                    }
                }
            ]
        };
        
        chart.setOption(option, true);
        // Resize on window and when container size changes
        window.addEventListener('resize', () => chart.resize());
        if (!window._quickChartResizeObs) {
            try {
                window._quickChartResizeObs = new ResizeObserver(() => chart.resize());
                window._quickChartResizeObs.observe(el);
            } catch (_) {}
        }
        console.log('✅ ECharts quick chart rendered');
        
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
            const getValidDate = (item) => {
                if (item.created_at) {
                    const date = new Date(item.created_at);
                    if (!isNaN(date.getTime())) return date;
                }
                return new Date(item.date);
            };
            
            const dateA = getValidDate(a);
            const dateB = getValidDate(b);
            return dateB - dateA;
        });
        const recentTransactions = allTransactions.slice(0, 10);
        
        const container = document.getElementById('recentTransactions');
        if (container && recentTransactions.length > 0) {
            const transactionsList = recentTransactions.map(transaction => {
                const icon = transaction.type === 'sale' ? '📈' : '📉';
                const color = transaction.type === 'sale' ? '#22c55e' : '#ef4444';
                const sign = transaction.type === 'sale' ? '+' : '-';
                
                // Format creation time if available (with robust date handling)
                let displayDate = `Date: ${transaction.date}`;
                
                if (transaction.created_at) {
                    try {
                        const createdDate = new Date(transaction.created_at);
                        if (!isNaN(createdDate.getTime())) {
                            displayDate = `Added: ${createdDate.toLocaleDateString('en-IN')} ${createdDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
                        }
                    } catch (error) {
                        console.warn('Invalid created_at date for transaction:', transaction.id, error);
                    }
                }
            
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
        
        const totalSales = salesData.reduce((sum, sale) => sum + parseFloat(sale.total_amount || sale.total || 0), 0);
        const totalPurchases = purchaseData.reduce((sum, purchase) => sum + parseFloat(purchase.total_amount || purchase.total || 0), 0);
        
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
    
    // Get submit button for loading state
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    
    // Show immediate loading feedback
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding Sale...';
    submitBtn.disabled = true;
    
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
            showNotification('Sale added successfully!', 'success');
            
            // Reset form immediately for better UX
            e.target.reset();
            setSalesDefaults();
            
            // Navigate back to Dashboard immediately (no delay!)
            showSection('dashboard');
            
            // Refresh dashboard data in background (parallel operations)
            Promise.all([
                loadDashboard(),
                populateYearOptions()
            ]).catch(error => {
                console.error('Background refresh error:', error);
                // Still works, just logs error
            });
            
        } else {
            showNotification('Error adding sale', 'error');
        }
    } catch (error) {
        console.error('Add sale error:', error);
        showNotification('Error adding sale', 'error');
    } finally {
        // Restore button state
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

async function handleAddPurchase(e) {
    e.preventDefault();
    
    // Get submit button for loading state
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    
    // Show immediate loading feedback
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding Purchase...';
    submitBtn.disabled = true;
    
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
            showNotification('Purchase added successfully!', 'success');
            
            // Reset form immediately for better UX
            e.target.reset();
            setPurchaseDefaults();
            
            // Navigate back to Dashboard immediately (no delay!)
            showSection('dashboard');
            
            // Refresh dashboard data in background (parallel operations)
            Promise.all([
                loadDashboard(),
                populateYearOptions()
            ]).catch(error => {
                console.error('Background refresh error:', error);
                // Still works, just logs error
            });
            
        } else {
            showNotification('Error adding purchase', 'error');
        }
    } catch (error) {
        console.error('Add purchase error:', error);
        showNotification('Error adding purchase', 'error');
    } finally {
        // Restore button state
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
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
// Helper function to get today's date in local timezone (fixes timezone issues)
function getTodayLocalDate() {
    const today = new Date();
    const localDate = new Date(today.getTime() - (today.getTimezoneOffset() * 60000));
    return localDate.toISOString().split('T')[0];
}

// Helper function to get today's date in IST (Asia/Kolkata) as YYYY-MM-DD
function getTodayISTDate() {
    try {
        if (typeof Intl !== 'undefined' && Intl.DateTimeFormat) {
            // en-CA gives ISO-like YYYY-MM-DD
            return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
        }
    } catch (_) { /* fallback below */ }
    const now = new Date();
    const utcTimeMs = now.getTime() + (now.getTimezoneOffset() * 60000);
    const istTimeMs = utcTimeMs + (330 * 60000); // IST = UTC+5:30 -> 330 minutes
    const ist = new Date(istTimeMs);
    const yyyy = ist.getUTCFullYear();
    const mm = String(ist.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(ist.getUTCDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

// Helper to generate IST timestamp for invoice number: DDMMYYYY-HHMM
function getISTInvoiceNumber() {
    try {
        // Prefer Intl for correctness across DST edge cases (IST has no DST but safe practice)
        const parts = new Intl.DateTimeFormat('en-GB', {
            timeZone: 'Asia/Kolkata',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        }).formatToParts(new Date());
        const map = Object.fromEntries(parts.map(p => [p.type, p.value]));
        const dd = map.day || '01';
        const MM = map.month || '01';
        const yyyy = map.year || '1970';
        const HH = (map.hour || '00').padStart(2, '0');
        const mm = (map.minute || '00').padStart(2, '0');
        const ss = (map.second || '00').padStart(2, '0');
        return `${dd}${MM}${yyyy}-${HH}${mm}${ss}`;
    } catch (_) {
        // Fallback manual IST computation
        const now = new Date();
        const utcTimeMs = now.getTime() + (now.getTimezoneOffset() * 60000);
        const istTimeMs = utcTimeMs + (330 * 60000);
        const d = new Date(istTimeMs);
        const dd = String(d.getUTCDate()).padStart(2, '0');
        const MM = String(d.getUTCMonth() + 1).padStart(2, '0');
        const yyyy = String(d.getUTCFullYear());
        const HH = String(d.getUTCHours()).padStart(2, '0');
        const mm = String(d.getUTCMinutes()).padStart(2, '0');
        const ss = String(d.getUTCSeconds()).padStart(2, '0');
        return `${dd}${MM}${yyyy}-${HH}${mm}${ss}`;
    }
}

function setSalesDefaults() {
    // Get today's date in local timezone (fixes timezone issue for Indian users)
    const todayString = getTodayLocalDate();
    
    document.getElementById('saleDate').value = todayString;
    document.getElementById('customerName').value = 'All Customers';
    document.getElementById('saleCategory').value = 'bike-parts';
    document.getElementById('saleDescription').value = 'Todays total sale including everything';
    document.getElementById('paymentMethod').value = 'Cash & Online Both';
}

function setPurchaseDefaults() {
    // Get today's date in local timezone (fixes timezone issue for Indian users)
    const todayString = getTodayLocalDate();
    
    document.getElementById('purchaseDate').value = todayString;
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
            try { ensureOverallChart(); } catch (_) {}
        }
    };
}

// Report generation
async function generateReport() {
    try {
        const type = document.getElementById('reportType').value;
        const month = document.getElementById('reportMonth').value;
        const year = document.getElementById('reportYear').value;
        
        // Get all data from server
        const salesResponse = await fetch('/api/sales');
        const salesData = await salesResponse.json();
        
        const purchasesResponse = await fetch('/api/purchases');
        const purchaseData = await purchasesResponse.json();
        
        // Apply filters client-side
        let filteredSales = salesData;
        let filteredPurchases = purchaseData;
        
        // Filter by month and year
        if (month || year) {
            filteredSales = salesData.filter(sale => {
                const saleDate = sale.sale_date;
                if (!saleDate) return false;
                
                const [yy, mm] = saleDate.split('-');
                if (month && mm !== month) return false;
                if (year && yy !== year) return false;
                
                return true;
            });
            
            filteredPurchases = purchaseData.filter(purchase => {
                const purchaseDate = purchase.purchase_date;
                if (!purchaseDate) return false;
                
                const [yy, mm] = purchaseDate.split('-');
                if (month && mm !== month) return false;
                if (year && yy !== year) return false;
                
                return true;
            });
        }
        
        // Apply report type filter
        if (type === 'sales') {
            filteredPurchases = [];
        } else if (type === 'purchases') {
            filteredSales = [];
        }
        
        generateReportChart(filteredSales, filteredPurchases, type);
        generateReportTable(filteredSales, filteredPurchases, type);
        
        updateDataCountInfo();
        // also refresh overall chart contextually
        ensureOverallChart();
        
    } catch (error) {
        console.error('Report generation error:', error);
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
            const today = getTodayLocalDate();
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
            const today = getTodayLocalDate();
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

        // Calculate totals once for reuse
        const totalSalesAmount = salesForExport.reduce((sum, sale) => sum + parseFloat(sale.total || sale.total_amount || 0), 0);
        const totalPurchasesAmount = purchasesForExport.reduce((sum, purchase) => sum + parseFloat(purchase.total || purchase.total_amount || 0), 0);

        // Create workbook
        const wb = XLSX.utils.book_new();

        // Sales sheet (using correct field names)
        if (salesForExport.length > 0) {
            const salesSheet = salesForExport.map(sale => ({
                'Date': sale.sale_date || sale.date,
                'Customer': sale.customer || sale.customer_name || 'N/A',
                'Category': sale.category || 'N/A',
                'Description': sale.description || sale.product_description || 'N/A',
                'Total Amount (₹)': parseFloat(sale.total || sale.total_amount || 0),
                'Payment Method': sale.paymentMethod || sale.payment_method || 'N/A',
                'Notes': sale.notes || 'N/A'
            }));
            
            // Add empty row and total row
            salesSheet.push({
                'Date': '',
                'Customer': '',
                'Category': '',
                'Description': '',
                'Total Amount (₹)': '',
                'Payment Method': '',
                'Notes': ''
            });
            
            salesSheet.push({
                'Date': '',
                'Customer': '',
                'Category': '',
                'Description': '🔷 TOTAL SALES AMOUNT',
                'Total Amount (₹)': totalSalesAmount,
                'Payment Method': '',
                'Notes': `${salesForExport.length} transactions`
            });
            
            console.log('📊 Excel Sales Data Preview:', salesSheet.slice(0, 2));
            console.log('💰 Total Sales Amount:', totalSalesAmount.toLocaleString('en-IN'));
            
            const salesWS = XLSX.utils.json_to_sheet(salesSheet);
            
            // Style the total row (make it bold and colored)
            const totalRowIndex = salesSheet.length; // 1-based indexing for Excel
            if (salesWS[`D${totalRowIndex}`]) {
                salesWS[`D${totalRowIndex}`].s = {
                    font: { bold: true, color: { rgb: "FFFFFF" } },
                    fill: { fgColor: { rgb: "4472C4" } }
                };
            }
            if (salesWS[`E${totalRowIndex}`]) {
                salesWS[`E${totalRowIndex}`].s = {
                    font: { bold: true, color: { rgb: "FFFFFF" } },
                    fill: { fgColor: { rgb: "4472C4" } }
                };
            }
            
            XLSX.utils.book_append_sheet(wb, salesWS, "Sales");
        }

        // Purchases sheet (using correct field names)
        if (purchasesForExport.length > 0) {
            const purchasesSheet = purchasesForExport.map(purchase => ({
                'Date': purchase.purchase_date || purchase.date,
                'Supplier': purchase.supplier || purchase.supplier_name || 'N/A',
                'Category': purchase.category || 'N/A',
                'Description': purchase.description || purchase.product_description || 'N/A',
                'Total Amount (₹)': parseFloat(purchase.total || purchase.total_amount || 0),
                'Invoice Number': purchase.invoice_number || purchase.invoiceNumber || 'N/A',
                'Notes': purchase.notes || 'N/A'
            }));
            

            
            // Add empty row and total row
            purchasesSheet.push({
                'Date': '',
                'Supplier': '',
                'Category': '',
                'Description': '',
                'Total Amount (₹)': '',
                'Invoice Number': '',
                'Notes': ''
            });
            
            purchasesSheet.push({
                'Date': '',
                'Supplier': '',
                'Category': '',
                'Description': '🔶 TOTAL PURCHASES AMOUNT',
                'Total Amount (₹)': totalPurchasesAmount,
                'Invoice Number': '',
                'Notes': `${purchasesForExport.length} transactions`
            });
            
            console.log('📊 Excel Purchases Data Preview:', purchasesSheet.slice(0, 2));
            console.log('💰 Total Purchases Amount:', totalPurchasesAmount.toLocaleString('en-IN'));
            
            const purchasesWS = XLSX.utils.json_to_sheet(purchasesSheet);
            
            // Style the total row (make it bold and colored)
            const totalRowIndex = purchasesSheet.length; // 1-based indexing for Excel
            if (purchasesWS[`D${totalRowIndex}`]) {
                purchasesWS[`D${totalRowIndex}`].s = {
                    font: { bold: true, color: { rgb: "FFFFFF" } },
                    fill: { fgColor: { rgb: "E74C3C" } }
                };
            }
            if (purchasesWS[`E${totalRowIndex}`]) {
                purchasesWS[`E${totalRowIndex}`].s = {
                    font: { bold: true, color: { rgb: "FFFFFF" } },
                    fill: { fgColor: { rgb: "E74C3C" } }
                };
            }
            
            XLSX.utils.book_append_sheet(wb, purchasesWS, "Purchases");
        }

        // Add Summary Sheet with overall totals
        const summaryData = [];
        const netProfit = totalSalesAmount - totalPurchasesAmount;
        
        summaryData.push({ 'Metric': '📊 BUSINESS SUMMARY', 'Value (₹)': '', 'Details': '' });
        summaryData.push({ 'Metric': '', 'Value (₹)': '', 'Details': '' });
        summaryData.push({ 'Metric': '🔷 Total Sales', 'Value (₹)': totalSalesAmount, 'Details': `${salesForExport.length} transactions` });
        summaryData.push({ 'Metric': '🔶 Total Purchases', 'Value (₹)': totalPurchasesAmount, 'Details': `${purchasesForExport.length} transactions` });
        summaryData.push({ 'Metric': '', 'Value (₹)': '', 'Details': '' });
        summaryData.push({ 
            'Metric': '💰 Net Profit', 
            'Value (₹)': netProfit, 
            'Details': netProfit >= 0 ? '✅ Profitable' : '⚠️ Loss' 
        });
        summaryData.push({ 'Metric': '', 'Value (₹)': '', 'Details': '' });
        summaryData.push({ 'Metric': '📅 Report Generated', 'Value (₹)': '', 'Details': new Date().toLocaleString('en-IN') });
        summaryData.push({ 'Metric': '🏢 Business', 'Value (₹)': '', 'Details': 'Khan Automobiles' });
        
        const summaryWS = XLSX.utils.json_to_sheet(summaryData);
        
        // Style the summary sheet
        summaryWS['A1'].s = { font: { bold: true, size: 14, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "2E86AB" } } };
        if (summaryWS['A3']) summaryWS['A3'].s = { font: { bold: true, color: { rgb: "4472C4" } } };
        if (summaryWS['A4']) summaryWS['A4'].s = { font: { bold: true, color: { rgb: "E74C3C" } } };
        if (summaryWS['A6']) summaryWS['A6'].s = { font: { bold: true, color: { rgb: "27AE60" } } };
        
        XLSX.utils.book_append_sheet(wb, summaryWS, "Summary");

        // Generate filename with current date and time
        const now = new Date();
        const dateTime = now.toISOString().slice(0, 19).replace(/T/g, '_').replace(/:/g, '-');
        
        let filename = `Khan_Automobiles_Report_${dateTime}`;
        if (reportMonth) filename += `_${getMonthName(reportMonth)}`;
        if (reportYear) filename += `_${reportYear}`;
        filename += '.xlsx';

        // Write file
        XLSX.writeFile(wb, filename);
        
        // Set success state
        setButtonState(exportBtn, 'success');
        
        console.log('✅ Excel export completed successfully');
        console.log('💰 Export totals - Sales: ₹' + totalSalesAmount.toLocaleString('en-IN') + ', Purchases: ₹' + totalPurchasesAmount.toLocaleString('en-IN'));
        
        showNotification(`Excel file "${filename}" downloaded successfully! 📊 Includes: ${salesForExport.length} sales (₹${totalSalesAmount.toLocaleString('en-IN')}), ${purchasesForExport.length} purchases (₹${totalPurchasesAmount.toLocaleString('en-IN')}) + Summary sheet with totals!`, 'success');
        
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

// Simple mobile browser detection
function isMobileBrowser() {
    try {
        return /Android|iPhone|iPad|iPod|IEMobile|Opera Mini|Mobile/i.test(navigator.userAgent || '');
    } catch (_) {
        return false;
    }
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
            const getValidDate = (item) => {
                if (item.created_at) {
                    const date = new Date(item.created_at);
                    if (!isNaN(date.getTime())) return date;
                }
                return new Date(item.date);
            };
            
            const dateA = getValidDate(a);
            const dateB = getValidDate(b);
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
        // Format creation date/time (with robust date handling)
        let createdDisplay = 'N/A';
        
        if (entry.created_at) {
            try {
                const createdDate = new Date(entry.created_at);
                if (!isNaN(createdDate.getTime())) {
                    createdDisplay = `${createdDate.toLocaleDateString('en-IN')} ${createdDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
                }
            } catch (error) {
                console.warn('Invalid created_at date for entry:', entry.id, error);
            }
        }
        
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
                <button onclick="editEntry('${entry.id}', '${entry.type}')" class="btn-sm btn-primary" style="padding: 0.25rem 0.5rem; font-size: 12px; border-radius: 6px;" title="Edit Entry">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteEntry('${entry.id}', '${entry.type}')" class="btn-sm btn-danger" style="padding: 0.25rem 0.5rem; font-size: 12px; border-radius: 6px; background: #ef4444; border: none; color: white;" title="Delete Entry">
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
        console.log('🔍 Editing entry:', { id, type, idType: typeof id });
        
        // Find the entry in our local data (handle both string and numeric IDs)
        const entry = allEntries.find(e => {
            const match = (String(e.id) === String(id)) && e.type === type;
            console.log('  Checking entry:', { entryId: e.id, entryIdType: typeof e.id, entryType: e.type, match });
            return match;
        });
        
        if (!entry) {
            console.error('❌ Entry not found:', { searchId: id, searchType: type, availableEntries: allEntries.length });
            showNotification('Entry not found', 'error');
            return;
        }
        
        console.log('✅ Found entry for editing:', entry);
        
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
    console.log('🗑️ Deleting entry:', { id, type, idType: typeof id });
    
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

// Invoice / PO Modal Helpers
function openInvoiceModal() {
    const modal = document.getElementById('invoiceModal');
    if (!modal) return;

    // Hard reset first to avoid stale values without page refresh
    resetInvoiceForm();

    // Set today's date
    const dateInput = document.getElementById('invoiceDate');
    if (dateInput) {
        dateInput.value = getTodayISTDate();
    }
    // Autopopulate invoice number using IST date-time DDMMYYYY-HHMM
    try {
        const invEl = document.getElementById('invoiceNumber');
        if (invEl) invEl.value = getISTInvoiceNumber();
    } catch (e) {}

    // Ensure at least one blank row
    const tbody = document.getElementById('invoiceItemsBody');
    if (tbody && tbody.children.length === 0) {
        addInvoiceItemRow();
    }

    // Clear buyer fields explicitly on open as well
    ['billToName','billToContact','billToAddress','billToGstin','billToState'].forEach(id=>{
        const el = document.getElementById(id);
        if (el) el.value = '';
    });

    // Clear numeric fields by default; set unit to pcs
    tbody?.querySelectorAll('.qty, .rate, .disc, .gst').forEach(inp => inp.value = '');
    tbody?.querySelectorAll('.unit').forEach(inp => { inp.value = 'pcs'; });

    modal.style.display = 'block';
}

function resetInvoiceForm() {
    try {
        const form = document.getElementById('invoiceForm');
        const tbody = document.getElementById('invoiceItemsBody');
        if (form) form.reset();
        // Explicitly clear buyer fields to avoid browser autofill retaining values
        const clear = (id) => { const el = document.getElementById(id); if (el) el.value = ''; };
        clear('billToName');
        clear('billToContact');
        clear('billToAddress');
        clear('billToGstin');
        clear('billToState');
        clear('invoiceDate');
        const invEl = document.getElementById('invoiceNumber'); if (invEl) invEl.value = '';
        if (tbody) tbody.innerHTML = '';
        const zero = (id) => { const el = document.getElementById(id); if (el) el.textContent = '₹0.00'; };
        zero('invoiceSubtotal');
        const discEl = document.getElementById('invoiceDiscountTotal'); if (discEl) discEl.textContent = '₹0.00';
        zero('invoiceTaxTotal');
        zero('invoiceGrandTotal');
    } catch (_) {}
}

// Format YYYY-MM-DD to 20-August-2025
function formatFriendlyDate(isoString) {
    try {
        if (!isoString) return '';
        const parts = isoString.split('-');
        const monthNames = [
            'January','February','March','April','May','June',
            'July','August','September','October','November','December'
        ];
        if (parts.length === 3) {
            const year = parts[0];
            const monthIndex = Math.max(0, Math.min(11, parseInt(parts[1], 10) - 1));
            const day = String(parseInt(parts[2], 10));
            return `${day}-${monthNames[monthIndex]}-${year}`;
        }
        const d = new Date(isoString);
        if (!isNaN(d.getTime())) {
            return `${d.getDate()}-${monthNames[d.getMonth()]}-${d.getFullYear()}`;
        }
        return isoString;
    } catch (_) {
        return isoString || '';
    }
}

// Convert amount to words (Indian numbering)
function amountToWordsIndian(amountNumber) {
    try {
        const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
        const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
        function twoDigits(n) {
            if (n < 20) return ones[n];
            const t = Math.floor(n / 10), o = n % 10;
            return `${tens[t]}${o ? ' ' + ones[o] : ''}`.trim();
        }
        function threeDigits(n) {
            const h = Math.floor(n / 100), r = n % 100;
            return `${h ? ones[h] + ' Hundred' + (r ? ' ' : '') : ''}${twoDigits(r)}`.trim();
        }
        function sectionToWords(num) {
            if (num === 0) return 'Zero';
            let result = '';
            const crore = Math.floor(num / 10000000); num %= 10000000;
            const lakh = Math.floor(num / 100000); num %= 100000;
            const thousand = Math.floor(num / 1000); num %= 1000;
            const hundred = num; // up to 999
            if (crore) result += `${twoDigits(crore)} Crore `;
            if (lakh) result += `${twoDigits(lakh)} Lakh `;
            if (thousand) result += `${twoDigits(thousand)} Thousand `;
            if (hundred) result += `${threeDigits(hundred)} `;
            return result.trim();
        }
        const n = Math.floor(Math.abs(amountNumber));
        const fraction = Math.round((Math.abs(amountNumber) - n) * 100); // paise
        let words = sectionToWords(n) + ' Rupees';
        if (fraction > 0) words += ` and ${twoDigits(fraction)} Paise`;
        return words + ' only';
    } catch (e) {
        return 'Rupees only';
    }
}

// Basic validation for invoice before printing
function validateInvoiceForm() {
    const errors = [];
    const getVal = (id) => (document.getElementById(id)?.value || '').toString().trim();

    const billToName = getVal('billToName');
    const billToContact = getVal('billToContact');
    const invoiceDate = getVal('invoiceDate');
    const invoiceNumber = getVal('invoiceNumber');

    if (!billToName) errors.push('Buyer Name is required');
    if (!billToContact) errors.push('Contact No. is required');
    if (!invoiceDate) errors.push('Invoice Date is required');
    if (!invoiceNumber) errors.push('Invoice Number is required');

    const tbody = document.getElementById('invoiceItemsBody');
    if (!tbody || tbody.children.length === 0) {
        errors.push('Add at least one item');
    } else {
        [...tbody.querySelectorAll('tr')].forEach((tr, idx) => {
            const qty = parseFloat(tr.querySelector('.qty')?.value || '0');
            const rate = parseFloat(tr.querySelector('.rate')?.value || '0');
            if (!(qty > 0)) errors.push(`Row ${idx + 1}: Quantity must be greater than 0`);
            if (!(rate > 0)) errors.push(`Row ${idx + 1}: Rate must be greater than 0`);
        });
    }

    if (errors.length > 0) {
        if (typeof showNotification === 'function') {
            showNotification(errors.join('\n'), 'error');
        } else {
            alert(errors.join('\n'));
        }
        return false;
    }
    return true;
}

function closeInvoiceModal() {
    const modal = document.getElementById('invoiceModal');
    if (!modal) return;
    resetInvoiceForm();
    // Force clear through form reset event and microtask flush
    const form = document.getElementById('invoiceForm');
    if (form) {
        form.reset();
        ['billToName','billToContact','billToAddress','billToGstin','billToState','invoiceDate','invoiceNumber'].forEach(id=>{
            const el = document.getElementById(id); if (el) el.value='';
        });
    }
    modal.style.display = 'none';
}

function addInvoiceItemRow() {
    const tbody = document.getElementById('invoiceItemsBody');
    if (!tbody) return;
    const tr = document.createElement('tr');
    const index = (tbody.querySelectorAll('tr').length || 0) + 1;
    tr.innerHTML = `
        <td class="num">${index}</td>
        <td><input type="text" class="desc" placeholder="Item name" required></td>
        <td><input type="text" class="hsn" placeholder="HSN/SAC"></td>
         <td><input type="number" class="gst num" min="0" step="0.01" placeholder="0" value="0"></td>
          <td><input type="text" class="unit" placeholder="pcs" value="pcs"></td>
        <td><input type="number" class="qty num" min="0" step="1" value=""></td>
       
        <td><input type="number" class="rate num" min="0" step="0.01" value=""></td>
        <td><input type="number" class="disc num" min="0" step="0.01" value="" placeholder="%"></td>
       
        <td class="amount num">₹0.00</td>
        <td><button type="button" class="btn-secondary remove-row" title="Remove" style="padding: 6px 10px; border-radius: 6px;">✕</button></td>
    `;
    tbody.appendChild(tr);
    tr.querySelectorAll('input').forEach(inp => inp.addEventListener('input', recalcInvoiceTotals));
    tr.querySelector('.remove-row').addEventListener('click', () => { tr.remove(); recalcInvoiceTotals(); });
    recalcInvoiceTotals();
}

function recalcInvoiceTotals() {
    const tbody = document.getElementById('invoiceItemsBody');
    if (!tbody) return;
    let subtotal = 0;
    let taxTotal = 0;
    let discountTotal = 0;
    let qtyTotal = 0;
    let amountTotal = 0;
    [...tbody.querySelectorAll('tr')].forEach(tr => {
        const qty = parseFloat(tr.querySelector('.qty')?.value || '0');
        const rate = parseFloat(tr.querySelector('.rate')?.value || '0');
        const discPct = parseFloat(tr.querySelector('.disc')?.value || '0');
        const gst = parseFloat(tr.querySelector('.gst')?.value || '0');
        const gross = qty * rate;
        const discountValue = gross * (discPct / 100);
        const lineBase = Math.max(gross - discountValue, 0);
        const lineTax = lineBase * (gst / 100);
        const lineAmount = lineBase + lineTax;
        subtotal += lineBase;
        taxTotal += lineTax;
        discountTotal += discountValue;
        qtyTotal += qty || 0;
        amountTotal += lineAmount || 0;
        const amountCell = tr.querySelector('.amount');
        if (amountCell) amountCell.textContent = `₹${lineAmount.toFixed(2)}`;
    });
    const grand = subtotal + taxTotal;
    const fmt = (n) => `₹${n.toFixed(2)}`;
    const subEl = document.getElementById('invoiceSubtotal');
    const discEl = document.getElementById('invoiceDiscountTotal');
    const taxEl = document.getElementById('invoiceTaxTotal');
    const grandEl = document.getElementById('invoiceGrandTotal');
    if (subEl) subEl.textContent = fmt(subtotal);
    if (discEl) discEl.textContent = fmt(discountTotal);
    if (taxEl) taxEl.textContent = fmt(taxTotal);
    if (grandEl) grandEl.textContent = fmt(grand);

}

function printInvoice() {
    // Validate required fields before attempting to print
    if (!validateInvoiceForm()) return;
    const printStyles = `
        <style>
            @page { size: A4; margin: 12mm; }
            body { font-family: Inter, Arial, sans-serif; margin: 0; }
            * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .pdf-root { width: 190mm; margin: 0 auto; }
            .avoid-break { break-inside: avoid; page-break-inside: avoid; }
            .inv-header { display:flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
            .inv-h1 { font-size: 24px; margin: 0 0 4px 0; }
            .inv-meta { font-size: 12px; color: #444; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #ddd; padding: 6px 8px; font-size: 12px; }
            th { background: #e6e6f5 !important; text-align: left; }
            .total-row td { background: #ededed !important; }
            .words-header { background: #ededed; font-weight: 700; text-align:left; padding: 6px; }
            .words-header-TC { background: #ffffff; font-weight: 700; text-align: left; padding: 9x; }
            .words-text { padding: 8px; font-size: 12px; }
            .right { text-align: right; }
            .summary { width: 280px; margin-left: auto; margin-top: 10px; }
            .summary td { border: none; }
            .summary tr td:first-child { text-align: left; }
            .summary tr td:last-child { text-align: right; font-weight: 600; }
            img.logo { max-width: 180px; width: 100%; height: auto; }
            img.sign { max-width: 160px; width: 100%; height: auto; margin: 10px 0; }
        </style>
    `;

    // Build printable content
    const invNo = document.getElementById('invoiceNumber')?.value || '';
    const invDate = document.getElementById('invoiceDate')?.value || '';
    const veh = document.getElementById('vehicleNumber')?.value || '';
    const billToName = document.getElementById('billToName')?.value || '';

    const billToAddress = document.getElementById('billToAddress')?.value || '';
    const billToContact = document.getElementById('billToContact')?.value || '';
    const billToGstin = document.getElementById('billToGstin')?.value || '';
    const billToState = document.getElementById('billToState')?.value || '';
    const shopName = document.getElementById('shopName')?.value || 'Khan Automobiles';
    const shopPhone = document.getElementById('shopPhone')?.value || '';
    const shopEmail = document.getElementById('shopEmail')?.value || '';
    const shopGstin = document.getElementById('shopGstin')?.value || '';
    const shopAddress = document.getElementById('shopAddress')?.value || '';
    const shopState = document.getElementById('shopState')?.value || '';

    let rowsHtml = '';
    let qtyTotalPrint = 0;
    let amountTotalPrint = 0;
    document.querySelectorAll('#invoiceItemsBody tr').forEach((tr, idx) => {
        const desc = tr.querySelector('.desc')?.value || '';
        const hsn = tr.querySelector('.hsn')?.value || '';
        const gst = tr.querySelector('.gst')?.value || '0';
        const unit = tr.querySelector('.unit')?.value || 'pcs';
        const qty = tr.querySelector('.qty')?.value || '0';
        
        const rate = tr.querySelector('.rate')?.value || '0';
        const discPct = tr.querySelector('.disc')?.value || '0';
        
        const amount = tr.querySelector('.amount')?.textContent || '';
        rowsHtml += `<tr>
            <td>${idx + 1}</td>
            <td>${desc}</td>
            <td>${hsn}</td>
            <td class="right">${parseFloat(gst).toFixed(1)}%</td>
            <td class="right">${unit}</td>
            <td class="right">${qty}</td>
            <td class="right">${parseFloat(rate).toFixed(2)}</td>
            <td class="right">${parseFloat(discPct).toFixed(1)}%</td>
            
            <td class="right">${amount.replace('₹','')}</td>
        </tr>`;
        qtyTotalPrint += parseFloat(qty || '0');
        amountTotalPrint += parseFloat((amount || '0').toString().replace('₹','')) || 0;
    });

    const subtotal = document.getElementById('invoiceSubtotal')?.textContent || '₹0.00';
    const taxTotal = document.getElementById('invoiceTaxTotal')?.textContent || '₹0.00';
    const grand = document.getElementById('invoiceGrandTotal')?.textContent || '₹0.00';
    const grandNumeric = parseFloat((grand || '0').toString().replace(/[^0-9.]/g,'')) || 0;
    const amountInWords = amountToWordsIndian(grandNumeric);

    const printable = `
        <div class="pdf-root">
        <table style="border:1px solid #000; border-collapse:collapse;">
            <tr>
                <td style="border:1px solid #000; padding:6px; vertical-align:top; width:70%;">
                    <div><strong>Company Name:</strong> ${shopName || ''}</div>
                    <div><strong>Address :</strong> ${shopAddress || ''}</div>
                    <div><strong>Phone No.:</strong> ${shopPhone || ''}</div>
                    <div><strong>Email ID:</strong> ${shopEmail || ''}</div>
                    <div><strong>GSTIN:</strong> ${shopGstin || ''}</div>
                    <div><strong>State:</strong> ${shopState || ''}</div>
                </td>
                <td style="border:1px solid #000; padding:6px; vertical-align:top; width:30%; text-align:right;">
                    <img class="logo" src="assets/khan-automobiles-logo.jpg" alt="Company Logo">
                </td>
            </tr>
            <tr>
                <td colspan="2" style="border:1px solid #000; background:#ededed; text-align:center; font-weight:700; font-size:22px; padding:6px;">Tax Invoice</td>
            </tr>
            <tr>
                <td class="avoid-break" style="border:1px solid #000; padding:6px; vertical-align:top;">
                    <div><h3>Buyer (Bill To)</h3></div>
                    <div><strong>Name:</strong> ${billToName || ''}</div>
                     <div><strong>Mobile No.:</strong> ${billToContact || ''}</div>
                    <div><strong>Address:</strong> ${billToAddress || ''}</div>
                   
                    <div><strong>GSTIN No.:</strong> ${billToGstin || ''}</div>
                </td>
                <td style="border:1px solid #000; padding:6px; vertical-align:top;">
                    <div><strong>Invoice No.:</strong> ${invNo}</div>
                    <div><strong>Date:</strong> ${formatFriendlyDate(invDate)}</div>
                    ${veh ? `<div><strong>Vehicle:</strong> ${veh}</div>` : ''}
                </td>
            </tr>
        </table>
        <table class="avoid-break">
            <thead>
                <tr>
                    <th style="width:40px;">#</th>
                    <th>Item name</th>
                    <th>HSN/SAC</th>
                    <th class="right">GST</th>
                    <th class="right">Unit</th>
                    <th class="right">Quantity</th>
                    
                    <th class="right">Rate</th>
                    <th class="right">Discount %</th>
                    
                    <th class="right">Amount</th>
                </tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
            <tfoot>
                <tr class="total-row">
                    <td colspan="5" style="font-weight:700;"><b>Total</b></td>
                    <td class="right"><b>${Number.isInteger(qtyTotalPrint) ? qtyTotalPrint : qtyTotalPrint}</b></td>
                    <td></td>
                    <td></td>
                    <td class="right"><b>₹${amountTotalPrint.toFixed(2)}</b></td>
                </tr>
            </tfoot>
        </table>
        <table class="summary avoid-break">
            <tr><td>Subtotal</td><td>${subtotal}</td></tr>
            <tr><td>Discount</td><td>${document.getElementById('invoiceDiscountTotal')?.textContent || '₹0.00'}</td></tr>
            <tr><td>Total GST</td><td>${taxTotal}</td></tr>
            <tr><td><strong>Grand Total</strong></td><td><strong>${grand}</strong></td></tr>
        </table>
        <table class="avoid-break" style="border-collapse: collapse; margin-top: 10px;">
            <tr>
                <td style="width:70%; border:1px solid #000; vertical-align: top;">
                    <div class="words-header">Amount in words:</div>
                    <div class="words-text">${amountInWords}</div> <br><br>
                    <div class="words-header-TC">Terms & Conditions:</div>
           <div class="words-text">*Thanks for doing business with us.<br>*We look forward to serving you again in the future.</div>
                    </td>
                <td style="width:30%; border:1px solid #000; vertical-align: top; text-align:center;">
                    <div class="words-header">For Khan Automobiles</div>
                    <img class="sign" src="assets/khan_sign.jpg" alt="Signature">
                    <div class="words-text">Authorized Signatory</div>
                </td>
            </tr>
        </table>
        </div>
    `;

    // System print dialog (restored) using hidden iframe for reliability
    const fname = `${(billToName||'Buyer')}_${billToContact}_${invDate}`.replace(/\s+/g,'_');
    const prevTitle = document.title;
    try { document.title = fname; } catch (_) {}

    // Prefer new window on mobile to avoid printing the dashboard content
    if (isMobileBrowser()) {
        const w = window.open('', '_blank');
        if (w && w.document) {
            w.document.write('<!doctype html><html><head><title>' + fname + '</title>' + printStyles + '</head><body>' + printable + '</body></html>');
            w.document.close();
            // Give time to render before print
            setTimeout(() => { try { w.focus(); w.print(); } catch(_) {} }, 250);
            return; // Do not continue to iframe path on mobile
        }
        // If popup blocked, fall through to iframe method
    }

    try {
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        document.body.appendChild(iframe);

        const doc = iframe.contentWindow || iframe.contentDocument;
        const docEl = doc.document || doc;
        docEl.open();
        docEl.write('<!doctype html><html><head><title>'+fname+'</title>' + printStyles + '</head><body>' + printable + '</body></html>');
        docEl.close();

        iframe.onload = () => {
            // Give the browser a moment to render before printing
            setTimeout(() => {
                try {
                    iframe.contentWindow.focus();
                    iframe.contentWindow.print();
                } catch (e) {}
                // Remove after a delay to avoid closing too early on some browsers
                setTimeout(() => {
                    try { document.body.removeChild(iframe); } catch (_) {}
                    try { document.title = prevTitle; } catch (_) {}
                }, 1500);
            }, 250);
        };
    } catch (err) {
        // Fallback window.open path
        const w = window.open('', 'PRINT', 'height=800,width=800');
        if (!w) return;
        w.document.write('<!doctype html><html><head><title>'+fname+'</title>' + printStyles + '</head><body>' + printable + '</body></html>');
        w.document.close();
        w.focus();
        setTimeout(() => { try { w.print(); } catch (e) {} }, 250);
        // Do not auto-close immediately; let the user close after saving
    }
}

function bindInvoiceUi() {
    const openBtn = document.getElementById('openInvoiceBtn');
    if (openBtn && !openBtn.dataset.bound) {
        openBtn.addEventListener('click', openInvoiceModal);
        openBtn.dataset.bound = '1';
    }
    const closeBtn = document.getElementById('invoiceModalClose');
    if (closeBtn && !closeBtn.dataset.bound) {
        closeBtn.addEventListener('click', closeInvoiceModal);
        closeBtn.dataset.bound = '1';
    }
    // Close on outside click
    const invoiceModal = document.getElementById('invoiceModal');
    if (invoiceModal && !invoiceModal.dataset.bound) {
        invoiceModal.addEventListener('click', (e) => {
            if (e.target === invoiceModal) closeInvoiceModal();
        });
        // Also wire the top-right X close icon if present
        const xBtn = document.getElementById('invoiceModalClose');
        if (xBtn && !xBtn.dataset.bound) {
            xBtn.addEventListener('click', closeInvoiceModal);
            xBtn.dataset.bound = '1';
        }
        invoiceModal.dataset.bound = '1';
    }
    const cancelBtn = document.getElementById('invoiceCancelBtn');
    if (cancelBtn && !cancelBtn.dataset.bound) {
        cancelBtn.addEventListener('click', closeInvoiceModal);
        cancelBtn.dataset.bound = '1';
    }
    // Reset form on ESC
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && invoiceModal && invoiceModal.style.display === 'block') {
            closeInvoiceModal();
        }
    });
    const addItemBtn = document.getElementById('addInvoiceItemBtn');
    if (addItemBtn && !addItemBtn.dataset.bound) {
        addItemBtn.addEventListener('click', addInvoiceItemRow);
        addItemBtn.dataset.bound = '1';
    }
    // Print button uses inline onclick to guarantee a direct user gesture for pop-up allowance
    // No extra event listeners are attached here to avoid conflicts on some browsers.
}

// Ensure invoice UI is bound after dashboard loads
const _origShowDashboardForInvoice = showDashboard;
showDashboard = async function() {
    await _origShowDashboardForInvoice.apply(this, arguments);
    bindInvoiceUi();
};

// Also bind on DOM ready in case dashboard is already visible
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindInvoiceUi);
} else {
    bindInvoiceUi();
}

// Export for potential future use
window.openInvoiceModal = openInvoiceModal;
window.closeInvoiceModal = closeInvoiceModal;
window.addInvoiceItemRow = addInvoiceItemRow;
window.printInvoice = printInvoice; 

// Load pie chart: Monthly Sales totals for current year
async function loadSalesPieChart() {
    try {
        if (typeof echarts === 'undefined') return;
        const el = document.getElementById('salesPieChart');
        if (!el) return;
        
        const salesResponse = await fetch('/api/sales');
        if (!salesResponse.ok) throw new Error(`Sales API error: ${salesResponse.status}`);
        const sales = await salesResponse.json();
        
        // Current year filter
        const now = new Date();
        const currentYear = now.getFullYear();
        const months = Array.from({ length: 12 }, (_, i) => i); // 0..11
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const totals = new Array(12).fill(0);
        
        function parseDateToYM(d) {
            if (!d) return null;
            if (/^\d{4}-\d{2}-\d{2}/.test(d)) {
                const y = Number(d.substring(0, 4));
                const m = Number(d.substring(5, 7)) - 1;
                return { y, m };
            }
            const dt = new Date(d);
            if (Number.isNaN(dt.getTime())) return null;
            return { y: dt.getFullYear(), m: dt.getMonth() };
        }
        
        sales.forEach(s => {
            const ym = parseDateToYM(s.sale_date || s.date);
            if (!ym) return;
            if (ym.y !== currentYear) return;
            const amt = parseFloat(s.total || 0) || 0;
            totals[ym.m] += amt;
        });
        
        const data = months.map(i => ({ name: monthNames[i], value: totals[i] }));
        
        if (!window._salesPieChart) {
            window._salesPieChart = echarts.init(el, null, { renderer: 'canvas' });
        }
        const chart = window._salesPieChart;
        
        const isSmall = window.innerWidth < 768;
        const option = {
            title: { text: 'Montly Sale Amount', left: 'center', top: 6, textStyle: { fontSize: isSmall ? 14 : 16, fontWeight: 'bold' } },
            tooltip: {
                trigger: 'item',
                formatter: info => {
                    const v = Number(info.value || 0).toLocaleString('en-IN');
                    const p = info.percent != null ? info.percent : '-';
                    return `${info.marker} ${info.name}<br/>₹${v} (${p}%)`;
                }
            },
            legend: { type: 'scroll', bottom: 6, left: 'center', textStyle: { fontSize: isSmall ? 11 : 12 } },
            series: [
                {
                    name: 'Sales',
                    type: 'pie',
                    radius: isSmall ? ['35%', '70%'] : ['40%', '70%'],
                    center: ['50%', isSmall ? '48%' : '50%'],
                    avoidLabelOverlap: true,
                    data: data,
                    label: {
                        show: true,
                        position: isSmall ? 'inside' : 'outside',
                        formatter: params => {
                            const amount = Number(params.value || 0);
                            if (amount <= 0) return '';
                            return isSmall ? `${params.name.substring(0,3)}\n₹${amount.toLocaleString('en-IN')}` : `${params.name}: ₹${amount.toLocaleString('en-IN')} (${params.percent}%)`;
                        },
                        fontSize: isSmall ? 10 : 12
                    },
                    labelLine: { length: isSmall ? 6 : 12, length2: isSmall ? 6 : 10 }
                }
            ]
        };
        chart.setOption(option, true);
        window.addEventListener('resize', () => chart.resize());
        if (!window._salesPieChartResizeObs) {
            try {
                window._salesPieChartResizeObs = new ResizeObserver(() => chart.resize());
                window._salesPieChartResizeObs.observe(el);
            } catch (_) {}
        }
    } catch (error) {
        console.error('Pie chart error:', error);
        const el = document.getElementById('salesPieChart');
        if (el) el.innerHTML = '<p style="text-align:center;color:#666;padding:2rem;">Unable to load sales pie chart</p>';
    }
}

// Build overall 10-year chart
async function loadOverallTimelineChart() {
    try {
        if (typeof echarts === 'undefined') return;
        const el = document.getElementById('overallTimelineChart');
        if (!el) return;
        
        // Fetch all sales and purchases
        const [salesRes, purchasesRes] = await Promise.all([
            fetch('/api/sales'),
            fetch('/api/purchases')
        ]);
        if (!salesRes.ok || !purchasesRes.ok) throw new Error('API error');
        const [sales, purchases] = await Promise.all([salesRes.json(), purchasesRes.json()]);
        
        // Helper to year
        const getYear = d => {
            if (!d) return null;
            if (/^\d{4}-\d{2}-\d{2}/.test(d)) return Number(d.substring(0,4));
            const dt = new Date(d); return Number.isNaN(dt.getTime()) ? null : dt.getFullYear();
        };
        
        // Determine the last 10 years range based on current year
        const currentYear = new Date().getFullYear();
        const years = Array.from({ length: 10 }, (_, i) => currentYear - 9 + i);
        const salesByYear = Object.fromEntries(years.map(y => [y, 0]));
        const purchasesByYear = Object.fromEntries(years.map(y => [y, 0]));
        
        sales.forEach(s => {
            const y = getYear(s.sale_date || s.date);
            if (y && salesByYear[y] != null) salesByYear[y] += parseFloat(s.total || 0) || 0;
        });
        purchases.forEach(p => {
            const y = getYear(p.purchase_date || p.date);
            if (y && purchasesByYear[y] != null) purchasesByYear[y] += parseFloat(p.total || 0) || 0;
        });
        
        // Build monthly data per year for timeline
        const monthNamesShort = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        const initYearArrays = () => ({ sales: new Array(12).fill(0), purchases: new Array(12).fill(0), saleCount: new Array(12).fill(0) });
        const byYear = Object.fromEntries(years.map(y => [y, initYearArrays()]));
        const getYM = d => {
            if (!d) return null;
            if (/^\d{4}-\d{2}-\d{2}/.test(d)) return { y: Number(d.substring(0,4)), m: Number(d.substring(5,7)) - 1 };
            const dt = new Date(d); if (Number.isNaN(dt.getTime())) return null; return { y: dt.getFullYear(), m: dt.getMonth() };
        };
        sales.forEach(s => { const ym = getYM(s.sale_date || s.date); if (!ym) return; if (byYear[ym.y]) { byYear[ym.y].sales[ym.m] += parseFloat(s.total||0)||0; byYear[ym.y].saleCount[ym.m] += 1; } });
        purchases.forEach(p => { const ym = getYM(p.purchase_date || p.date); if (!ym) return; if (byYear[ym.y]) byYear[ym.y].purchases[ym.m] += parseFloat(p.total||0)||0; });
        
        if (!window._overallChart) window._overallChart = echarts.init(el);
        const chart = window._overallChart;
        const isSmall = window.innerWidth < 768;
        
        const timelineYears = years.map(String);
        const baseOption = {
            backgroundColor: 'transparent',
            timeline: {
                axisType: 'category',
                autoPlay: false,
                playInterval: 2500,
                data: timelineYears,
                bottom: 6,
                label: { formatter: s => s }
            },
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'cross' },
                formatter: (params) => {
                    let s = `<strong>${params[0]?.axisValueLabel || ''}</strong><br/>`;
                    params.forEach(p => {
                        const val = `₹${Number(p.value || (p.data && p.data.value) || 0).toLocaleString('en-IN')}`;
                        const countSuffix = (p.seriesName === 'Sales (₹)' && p.data && typeof p.data.saleCount === 'number') ? ` (${p.data.saleCount} sales)` : '';
                        s += `${p.marker} ${p.seriesName}: ${val}${countSuffix}<br/>`;
                    });
                    return s;
                }
            },
            legend: { top: 34, left: 'center', data: ['Sales (₹)', 'Purchases (₹)', 'Net Profit (₹)', 'Avg Sale (₹)'], textStyle: { fontSize: isSmall ? 11 : 12 } },
            grid: { left: isSmall ? 32 : 56, right: isSmall ? 18 : 40, top: isSmall ? 72 : 80, bottom: isSmall ? 80 : 100, containLabel: true },
            xAxis: [{ type: 'category', data: monthNamesShort, axisLabel: { fontSize: isSmall ? 10 : 12, hideOverlap: true } }],
            yAxis: [{ type: 'value', axisLabel: { formatter: v => `₹${Number(v).toLocaleString('en-IN')}` } }],
            dataZoom: [
                { type: 'inside', xAxisIndex: [0], filterMode: 'none' }
            ],
            series: [
                { name: 'Sales (₹)', type: 'bar', itemStyle: { color: '#22c55e' }, barWidth: isSmall ? 8 : 12, barGap: '30%', label: { show: !isSmall, position: 'top', formatter: (p) => (p.data && typeof p.data.saleCount === 'number' && p.data.saleCount > 0) ? `${p.data.saleCount}` : '' } },
                { name: 'Purchases (₹)', type: 'bar', itemStyle: { color: '#ef4444' }, barWidth: isSmall ? 8 : 12, barGap: '30%' },
                { name: 'Net Profit (₹)', type: 'line', smooth: true, lineStyle: { width: isSmall ? 2 : 3, color: '#FA5827' }, itemStyle: { color: '#FA5827' }, symbol: 'circle', symbolSize: isSmall ? 6 : 8 },
                { name: 'Avg Sale (₹)', type: 'line', smooth: true, lineStyle: { width: isSmall ? 2 : 3, color: '#3b82f6' }, itemStyle: { color: '#3b82f6' }, symbol: 'circle', symbolSize: isSmall ? 6 : 8 }
            ]
        };
        
        const options = years.map(y => ({
            title: { text: `Overalll Report — ${y}`, left: 'center', top: 6, textStyle: { fontSize: isSmall ? 14 : 16, fontWeight: 'bold' } },
            series: [
                { data: byYear[y].sales.map((v, i) => ({ value: v, saleCount: byYear[y].saleCount[i] || 0 })) },
                { data: byYear[y].purchases },
                { data: byYear[y].sales.map((v, i) => Math.max(0, v - (byYear[y].purchases[i]||0))) },
                { data: byYear[y].sales.map((v, i) => { const c = byYear[y].saleCount[i] || 0; return c > 0 ? v / c : null; }) }
            ]
        }));
        
        const option = { baseOption, options };
        chart.setOption(option, true);
        // Enable pinch zoom on mobile by toggling dataZoom only for small screens
        try {
            if (isSmall) {
                chart.dispatchAction({ type: 'takeGlobalCursor', key: 'dataZoomSelect', dataZoomSelectActive: true });
            } else {
                chart.dispatchAction({ type: 'takeGlobalCursor', key: 'dataZoomSelect', dataZoomSelectActive: false });
            }
        } catch (_) {}
        // Jump to latest year by default
        try { chart.dispatchAction({ type: 'timelineChange', currentIndex: timelineYears.length - 1 }); } catch(_) {}
 
        window.addEventListener('resize', () => chart.resize());
        // Also observe container size for true 100% responsiveness
        if (!window._overallChartResizeObs) {
            try {
                window._overallChartResizeObs = new ResizeObserver(() => chart.resize());
                window._overallChartResizeObs.observe(el);
            } catch (_) {}
        }
        
    } catch (error) {
        console.error('Overall chart error:', error);
        const el = document.getElementById('overallTimelineChart');
        if (el) el.innerHTML = '<p style="text-align:center;color:#666;padding:2rem;">Unable to load 10-year overall report</p>';
    }
}

// Hook overall chart when user views reports or generates reports
async function ensureOverallChart() { try { await loadOverallTimelineChart(); } catch(_){} }

