// Clean Secure Admin JavaScript - Works with simple server
// No JWT tokens, no complex authentication - just working functionality

// Initialize insights data globally at the top
let insightsData = { sales: [], purchases: [], bucketByYear: {}, goalAmount: 0 };

// Temporary showSection function until setupNavigation() is called
window.showSection = function(sectionName) {
    console.log('Temporary showSection called for:', sectionName);
    // This will be replaced by setupNavigation()
};

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
        
        // Initialize year-wise section if it exists
        if (document.getElementById('yearwiseFilter')) {
            await syncDataFromServer();
            populateYearwiseFilter();
            updateYearwiseData();
        }
        
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

// Load data from server into localStorage
async function syncDataFromServer() {
    try {
        console.log('🔄 Syncing data from server...');
        
        const [salesResponse, purchasesResponse] = await Promise.all([
            fetch('/api/sales'),
            fetch('/api/purchases')
        ]);
        
        if (salesResponse.ok && purchasesResponse.ok) {
            const salesData = await salesResponse.json();
            const purchaseData = await purchasesResponse.json();
            
            // Save to localStorage
            localStorage.setItem('salesData', JSON.stringify(salesData));
            localStorage.setItem('purchaseData', JSON.stringify(purchaseData));
            
            console.log(`✅ Synced ${salesData.length} sales and ${purchaseData.length} purchases from server`);
            return true;
        } else {
            console.error('Failed to sync data from server');
            return false;
        }
    } catch (error) {
        console.error('Error syncing data from server:', error);
        return false;
    }
}

// Optional: Enhanced data loading with pagination support
// Usage: const result = await loadSalesData({ page: 1, limit: 50, search: 'term' });
// Updated: Added dummy comment for testing git commit functionality
async function loadSalesData(options = {}) {
    try {
        const { page, limit, search, category, customer } = options;
        
        // Build query parameters
        const params = new URLSearchParams();
        if (page) params.append('page', page);
        if (limit) params.append('limit', limit);
        if (search) params.append('search', search);
        if (category) params.append('category', category);
        if (customer) params.append('customer', customer);
        
        const queryString = params.toString();
        const url = queryString ? `/api/sales?${queryString}` : '/api/sales';
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('📊 Sales data loaded:', Array.isArray(result) ? `${result.length} records` : `Page ${result.pagination?.page} of ${result.pagination?.totalPages}`);
        
        return result;
    } catch (error) {
        console.error('Error loading sales data:', error);
        throw error;
    }
}

// Optional: Enhanced purchases loading with pagination support
// Usage: const result = await loadPurchasesData({ page: 1, limit: 50, search: 'term' });
async function loadPurchasesData(options = {}) {
    try {
        const { page, limit, search, category, supplier } = options;
        
        // Build query parameters
        const params = new URLSearchParams();
        if (page) params.append('page', page);
        if (limit) params.append('limit', limit);
        if (search) params.append('search', search);
        if (category) params.append('category', category);
        if (supplier) params.append('supplier', supplier);
        
        const queryString = params.toString();
        const url = queryString ? `/api/purchases?${queryString}` : '/api/purchases';
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('📊 Purchases data loaded:', Array.isArray(result) ? `${result.length} records` : `Page ${result.pagination?.page} of ${result.pagination?.totalPages}`);
        
        return result;
    } catch (error) {
        console.error('Error loading purchases data:', error);
        throw error;
    }
}

// Populate year filter dropdown for year-wise section
function populateYearwiseFilter() {
    console.log('🔧 Populating year-wise filter...');
    
    const yearSelect = document.getElementById('yearwiseFilter');
    if (!yearSelect) {
        console.error('❌ yearwiseFilter dropdown not found!');
        return;
    }
    
    console.log('✅ Found yearwiseFilter dropdown');
    
    // Get data from localStorage
    const salesData = JSON.parse(localStorage.getItem('salesData') || '[]');
    const purchaseData = JSON.parse(localStorage.getItem('purchaseData') || '[]');
    
    console.log('📊 Data loaded:', {
        salesCount: salesData.length,
        purchasesCount: purchaseData.length
    });
    
    // Extract unique years from both sales and purchase data
    const allYears = new Set();
    
    salesData.forEach(sale => {
        if (sale.sale_date) {
            const year = new Date(sale.sale_date).getFullYear();
            console.log(`Sale date: ${sale.sale_date} → Year: ${year}`);
            if (!isNaN(year)) allYears.add(year);
        }
    });
    
    purchaseData.forEach(purchase => {
        if (purchase.purchase_date) {
            const year = new Date(purchase.purchase_date).getFullYear();
            console.log(`Purchase date: ${purchase.purchase_date} → Year: ${year}`);
            if (!isNaN(year)) allYears.add(year);
        }
    });
    
    console.log('📅 Unique years found:', Array.from(allYears));
    
    // Clear existing options except "All Years"
    while (yearSelect.children.length > 1) {
        yearSelect.removeChild(yearSelect.lastChild);
    }
    
    // Sort years in descending order and add to dropdown
    const sortedYears = Array.from(allYears).sort((a, b) => b - a);
    sortedYears.forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearSelect.appendChild(option);
        console.log(`✅ Added year option: ${year}`);
    });
    
    // Set current year as default selection
    const currentYear = new Date().getFullYear();
    if (sortedYears.includes(currentYear)) {
        yearSelect.value = currentYear;
        console.log(`🎯 Set default year to current year: ${currentYear}`);
    } else if (sortedYears.length > 0) {
        // If current year doesn't exist in data, select the most recent year
        yearSelect.value = sortedYears[0];
        console.log(`🎯 Current year not found, set to most recent year: ${sortedYears[0]}`);
    }
    
    console.log(`🎯 Total options in dropdown: ${yearSelect.children.length}`);
    
    // Add event listener for year changes if not already added
    if (!yearSelect.dataset.listenerAdded) {
        yearSelect.addEventListener('change', () => {
            console.log('🔄 Year-wise filter changed, updating data and bulk delete options...');
            updateYearwiseData();
        });
        yearSelect.dataset.listenerAdded = 'true';
        console.log('🎧 Event listener added to year-wise filter dropdown');
    }
}

// Update year-wise data based on selected year
function updateYearwiseData() {
    console.log('🔄 Updating year-wise data...');
    
    const yearSelect = document.getElementById('yearwiseFilter');
    const selectedYear = yearSelect?.value;
    
    console.log('📅 Selected year:', selectedYear || 'All Years');
    
    // Get data from localStorage
    const salesData = JSON.parse(localStorage.getItem('salesData') || '[]');
    const purchaseData = JSON.parse(localStorage.getItem('purchaseData') || '[]');
    
    console.log('📊 Raw data:', {
        salesCount: salesData.length,
        purchasesCount: purchaseData.length
    });
    
    let filteredSales = salesData;
    let filteredPurchases = purchaseData;
    
    // Filter data by selected year if a year is selected
    if (selectedYear) {
        console.log('🔍 Filtering by year:', selectedYear);
        
        filteredSales = salesData.filter(sale => {
            if (!sale.sale_date) return false;
            const saleYear = new Date(sale.sale_date).getFullYear();
            const match = saleYear.toString() === selectedYear;
            console.log(`Sale: ${sale.sale_date} → Year: ${saleYear} → Match: ${match}`);
            return match;
        });
        
        filteredPurchases = purchaseData.filter(purchase => {
            if (!purchase.purchase_date) return false;
            const purchaseYear = new Date(purchase.purchase_date).getFullYear();
            const match = purchaseYear.toString() === selectedYear;
            console.log(`Purchase: ${purchase.purchase_date} → Year: ${purchaseYear} → Match: ${match}`);
            return match;
        });
    }
    
    console.log('🎯 Filtered data:', {
        salesCount: filteredSales.length,
        purchasesCount: filteredPurchases.length
    });
    
    // Calculate totals
    const totalSales = filteredSales.reduce((sum, sale) => sum + (sale.total || 0), 0);
    const totalPurchases = filteredPurchases.reduce((sum, purchase) => sum + (purchase.total || 0), 0);
    
    console.log('💰 Calculated totals:', {
        totalSales: totalSales,
        totalPurchases: totalPurchases
    });
    
    // Update the cards
    const salesElement = document.getElementById('yearwiseSales');
    const purchasesElement = document.getElementById('yearwisePurchases');
    const salesLabelElement = document.getElementById('yearwiseSalesLabel');
    const purchasesLabelElement = document.getElementById('yearwisePurchasesLabel');
    
    if (salesElement) {
        salesElement.textContent = `₹${totalSales.toLocaleString('en-IN')}`;
        console.log('✅ Updated sales element:', salesElement.textContent);
    } else {
        console.error('❌ yearwiseSales element not found!');
    }
    
    if (purchasesElement) {
        purchasesElement.textContent = `₹${totalPurchases.toLocaleString('en-IN')}`;
        console.log('✅ Updated purchases element:', purchasesElement.textContent);
    } else {
        console.error('❌ yearwisePurchases element not found!');
    }
    
    // Update labels to show the selected year
    const yearLabel = selectedYear ? ` (${selectedYear})` : '';
    if (salesLabelElement) {
        salesLabelElement.textContent = `Total Sales${yearLabel}`;
        console.log('✅ Updated sales label:', salesLabelElement.textContent);
    }
    
    if (purchasesLabelElement) {
        purchasesLabelElement.textContent = `Total Purchases${yearLabel}`;
        console.log('✅ Updated purchases label:', purchasesLabelElement.textContent);
    }
    
    // Show/hide bulk delete buttons based on year selection
    updateBulkDeleteButtons(selectedYear, filteredSales.length, filteredPurchases.length);
}

// Show or hide bulk delete buttons based on selected year and available data
function updateBulkDeleteButtons(selectedYear, salesCount, purchasesCount) {
    const deleteButtonsContainer = document.getElementById('bulkDeleteButtons');
    
    if (!deleteButtonsContainer) {
        // Create the buttons container if it doesn't exist
        const container = document.createElement('div');
        container.id = 'bulkDeleteButtons';
        container.style.cssText = `
            margin-top: 1.5rem;
            padding: 1.25rem;
            border: 2px dashed #ef4444;
            border-radius: 12px;
            background: linear-gradient(135deg, #fef2f2 0%, #fdf2f2 100%);
            display: none;
            position: relative;
            box-shadow: 0 4px 12px rgba(239, 68, 68, 0.1);
            max-width: 100%;
            overflow: hidden;
        `;
        
        // Add responsive CSS for mobile and tablet
        if (!document.getElementById('danger-zone-responsive-css')) {
            const responsiveStyle = document.createElement('style');
            responsiveStyle.id = 'danger-zone-responsive-css';
            responsiveStyle.textContent = `
                /* Mobile Portrait - Very Small Screens */
                @media (max-width: 480px) {
                    #bulkDeleteButtons {
                        padding: 1rem !important;
                        margin-top: 1rem !important;
                        border-radius: 8px !important;
                    }
                    
                    .danger-zone-header strong {
                        font-size: 1rem !important;
                    }
                    
                    .danger-zone-info {
                        font-size: 13px !important;
                        margin-bottom: 1rem !important;
                        padding: 0 0.5rem;
                    }
                    
                    .danger-zone-buttons {
                        grid-template-columns: 1fr !important;
                        gap: 0.75rem !important;
                        max-width: 100% !important;
                    }
                    
                    .danger-btn {
                        font-size: 13px !important;
                        padding: 0.75rem 0.5rem !important;
                        max-width: 100% !important;
                        min-height: 50px !important;
                    }
                    
                    .danger-btn span {
                        display: block !important;
                        text-align: center !important;
                    }
                    
                    .danger-btn i {
                        margin-right: 0.25rem !important;
                    }
                }
                
                /* Mobile Landscape & Small Tablets */
                @media (min-width: 481px) and (max-width: 768px) {
                    #bulkDeleteButtons {
                        padding: 1.25rem !important;
                        margin-top: 1.25rem !important;
                    }
                    
                    .danger-zone-buttons {
                        grid-template-columns: repeat(2, 1fr) !important;
                        gap: 0.75rem !important;
                    }
                    
                    .danger-btn-all {
                        grid-column: 1 / -1 !important;
                        max-width: 280px !important;
                        justify-self: center !important;
                    }
                    
                    .danger-btn {
                        font-size: 13px !important;
                        padding: 0.75rem 0.75rem !important;
                        max-width: 180px !important;
                    }
                }
                
                /* Tablets */
                @media (min-width: 769px) and (max-width: 1024px) {
                    #bulkDeleteButtons {
                        padding: 1.5rem !important;
                        max-width: 90% !important;
                        margin-left: auto !important;
                        margin-right: auto !important;
                    }
                    
                    .danger-zone-buttons {
                        grid-template-columns: repeat(2, 1fr) !important;
                        gap: 1rem !important;
                        max-width: 600px !important;
                    }
                    
                    .danger-btn-all {
                        grid-column: 1 / -1 !important;
                        max-width: 300px !important;
                        justify-self: center !important;
                    }
                    
                    .danger-btn {
                        max-width: 240px !important;
                    }
                }
                
                /* Desktop - Large Screens */
                @media (min-width: 1025px) {
                    #bulkDeleteButtons {
                        max-width: 800px !important;
                        margin-left: auto !important;
                        margin-right: auto !important;
                    }
                    
                    .danger-zone-buttons {
                        grid-template-columns: repeat(3, 1fr) !important;
                        gap: 1rem !important;
                        max-width: 720px !important;
                    }
                    
                    .danger-btn-all {
                        grid-column: 1 / -1 !important;
                        max-width: 280px !important;
                        justify-self: center !important;
                        margin-top: 0.5rem !important;
                    }
                }
                
                /* Ultra-wide Screens */
                @media (min-width: 1400px) {
                    #bulkDeleteButtons {
                        max-width: 900px !important;
                    }
                    
                    .danger-zone-buttons {
                        max-width: 800px !important;
                    }
                }
                
                /* Touch Device Improvements */
                @media (hover: none) and (pointer: coarse) {
                    .danger-btn {
                        min-height: 52px !important;
                        font-size: 15px !important;
                        padding: 0.875rem 1rem !important;
                    }
                    
                    .danger-zone-buttons {
                        gap: 1rem !important;
                    }
                }
                
                /* High DPI Screens */
                @media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
                    #bulkDeleteButtons {
                        border-width: 1.5px !important;
                    }
                    
                    .danger-btn {
                        border: 0.5px solid rgba(255,255,255,0.1) !important;
                    }
                }
                
                /* Reduced Motion Preference */
                @media (prefers-reduced-motion: reduce) {
                    .danger-btn {
                        transition: none !important;
                    }
                }
                
                /* Dark Mode Support */
                @media (prefers-color-scheme: dark) {
                    #bulkDeleteButtons {
                        background: linear-gradient(135deg, #450a0a 0%, #431614 100%) !important;
                        border-color: #dc2626 !important;
                        color: #fca5a5 !important;
                    }
                    
                    .danger-zone-header strong {
                        color: #fca5a5 !important;
                    }
                    
                    .danger-zone-info {
                        color: #fca5a5 !important;
                    }
                }
            `;
            document.head.appendChild(responsiveStyle);
        }
        
        container.innerHTML = `
            <div class="danger-zone-header" style="margin-bottom: 0.75rem; text-align: center;">
                <strong style="color: #dc2626; font-size: 1.1rem; display: block;">⚠️ Danger Zone - Bulk Delete Records</strong>
            </div>
            <div class="danger-zone-info" style="margin-bottom: 1.25rem; text-align: center; font-size: 14px; color: #7f1d1d; line-height: 1.4;">
                <span id="bulkDeleteInfo">Select a specific year to enable bulk deletion</span>
            </div>
            <div class="danger-zone-buttons" style="
                display: grid; 
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
                gap: 0.75rem; 
                max-width: 100%; 
                margin: 0 auto;
                place-items: center;
            ">
                <button id="bulkDeleteSales" onclick="confirmBulkDeleteSales()" 
                        class="danger-btn danger-btn-sales"
                        style="
                            background: #dc2626; 
                            color: white; 
                            border: none; 
                            padding: 0.75rem 1rem; 
                            border-radius: 8px; 
                            cursor: pointer; 
                            font-size: 14px;
                            font-weight: 500;
                            width: 100%;
                            max-width: 220px;
                            min-height: 48px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            gap: 0.5rem;
                            transition: all 0.2s ease;
                            box-shadow: 0 2px 4px rgba(220, 38, 38, 0.2);
                        "
                        onmouseover="this.style.background='#b91c1c'; this.style.transform='translateY(-1px)'; this.style.boxShadow='0 4px 8px rgba(220, 38, 38, 0.3)';"
                        onmouseout="this.style.background='#dc2626'; this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 4px rgba(220, 38, 38, 0.2)';">
                    <i class="fas fa-trash-alt"></i> 
                    <span>Delete All Sales</span>
                </button>
                <button id="bulkDeletePurchases" onclick="confirmBulkDeletePurchases()" 
                        class="danger-btn danger-btn-purchases"
                        style="
                            background: #dc2626; 
                            color: white; 
                            border: none; 
                            padding: 0.75rem 1rem; 
                            border-radius: 8px; 
                            cursor: pointer; 
                            font-size: 14px;
                            font-weight: 500;
                            width: 100%;
                            max-width: 220px;
                            min-height: 48px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            gap: 0.5rem;
                            transition: all 0.2s ease;
                            box-shadow: 0 2px 4px rgba(220, 38, 38, 0.2);
                        "
                        onmouseover="this.style.background='#b91c1c'; this.style.transform='translateY(-1px)'; this.style.boxShadow='0 4px 8px rgba(220, 38, 38, 0.3)';"
                        onmouseout="this.style.background='#dc2626'; this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 4px rgba(220, 38, 38, 0.2)';">
                    <i class="fas fa-trash-alt"></i> 
                    <span>Delete All Purchases</span>
                </button>
                <button id="bulkDeleteBoth" onclick="confirmBulkDeleteBoth()" 
                        class="danger-btn danger-btn-all"
                        style="
                            background: #991b1b; 
                            color: white; 
                            border: none; 
                            padding: 0.75rem 1rem; 
                            border-radius: 8px; 
                            cursor: pointer; 
                            font-size: 14px;
                            font-weight: 600;
                            width: 100%;
                            max-width: 220px;
                            min-height: 48px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            gap: 0.5rem;
                            transition: all 0.2s ease;
                            box-shadow: 0 2px 4px rgba(153, 27, 27, 0.3);
                            grid-column: 1 / -1;
                        "
                        onmouseover="this.style.background='#7f1d1d'; this.style.transform='translateY(-1px)'; this.style.boxShadow='0 4px 8px rgba(153, 27, 27, 0.4)';"
                        onmouseout="this.style.background='#991b1b'; this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 4px rgba(153, 27, 27, 0.3)';">
                    <i class="fas fa-exclamation-triangle"></i> 
                    <span>Delete All Records</span>
                </button>
            </div>
        `;
        
        // Add to yearwise section (find a good location)
        const yearwiseSection = document.querySelector('.yearwise-stats');
        if (yearwiseSection) {
            yearwiseSection.appendChild(container);
        }
    }
    
    const container = document.getElementById('bulkDeleteButtons');
    const infoElement = document.getElementById('bulkDeleteInfo');
    const salesButton = document.getElementById('bulkDeleteSales');
    const purchasesButton = document.getElementById('bulkDeletePurchases');
    const bothButton = document.getElementById('bulkDeleteBoth');
    
    if (selectedYear && (salesCount > 0 || purchasesCount > 0)) {
        // Show the danger zone with specific year information
        container.style.display = 'block';
        // Create mobile-friendly info text
        const isMobile = window.innerWidth <= 768;
        if (isMobile) {
            infoElement.innerHTML = `<strong>${selectedYear}:</strong> ${salesCount} sales, ${purchasesCount} purchases<br><em>Will be permanently deleted</em>`;
        } else {
            infoElement.textContent = `Year ${selectedYear}: ${salesCount} sales, ${purchasesCount} purchases will be permanently deleted.`;
        }
        
        // Enable/disable buttons based on available data
        salesButton.disabled = salesCount === 0;
        purchasesButton.disabled = purchasesCount === 0;
        bothButton.disabled = salesCount === 0 && purchasesCount === 0;
        
        // Update button text with counts (maintaining responsive structure)
        salesButton.innerHTML = `<i class="fas fa-trash-alt"></i> <span>Delete ${salesCount} Sales</span>`;
        purchasesButton.innerHTML = `<i class="fas fa-trash-alt"></i> <span>Delete ${purchasesCount} Purchases</span>`;
        bothButton.innerHTML = `<i class="fas fa-exclamation-triangle"></i> <span>Delete All ${salesCount + purchasesCount} Records</span>`;
        
        // Style disabled buttons with responsive enhancements
        if (salesCount === 0) {
            salesButton.style.opacity = '0.5';
            salesButton.style.cursor = 'not-allowed';
            salesButton.style.transform = 'none';
            salesButton.onmouseover = null;
            salesButton.onmouseout = null;
        } else {
            salesButton.style.opacity = '1';
            salesButton.style.cursor = 'pointer';
        }
        
        if (purchasesCount === 0) {
            purchasesButton.style.opacity = '0.5';
            purchasesButton.style.cursor = 'not-allowed';
            purchasesButton.style.transform = 'none';
            purchasesButton.onmouseover = null;
            purchasesButton.onmouseout = null;
        } else {
            purchasesButton.style.opacity = '1';
            purchasesButton.style.cursor = 'pointer';
        }
        
        if (salesCount === 0 && purchasesCount === 0) {
            bothButton.style.opacity = '0.5';
            bothButton.style.cursor = 'not-allowed';
            bothButton.style.transform = 'none';
            bothButton.onmouseover = null;
            bothButton.onmouseout = null;
        } else {
            bothButton.style.opacity = '1';
            bothButton.style.cursor = 'pointer';
        }
        
    } else {
        // Hide the danger zone
        container.style.display = 'none';
    }
}

// Bulk delete confirmation and execution functions
async function confirmBulkDeleteSales() {
    const yearSelect = document.getElementById('yearwiseFilter');
    const selectedYear = yearSelect?.value;
    
    if (!selectedYear) {
        showNotification('Please select a specific year first', 'error');
        return;
    }
    
    const salesCount = getRecordCountForYear(selectedYear, 'sales');
    
    if (salesCount === 0) {
        showNotification(`No sales records found for year ${selectedYear}`, 'info');
        return;
    }
    
    const confirmMessage = `⚠️ DANGER: You are about to permanently delete ALL ${salesCount} sales records from year ${selectedYear}.\n\nThis action CANNOT be undone!\n\nType "DELETE ${selectedYear}" to confirm:`;
    
    const userInput = prompt(confirmMessage);
    
    if (userInput === `DELETE ${selectedYear}`) {
        try {
            showNotification('Deleting sales records... Please wait', 'info');
            const result = await bulkDeleteSalesByYear(selectedYear);
            
            if (result.success) {
                showNotification(`✅ Successfully deleted ${result.deleted} sales records for year ${selectedYear}`, 'success');
                
                // Refresh data
                await Promise.all([
                    syncDataFromServer(),
                    loadDashboard()
                ]);
                
                // Update year-wise view
                populateYearwiseFilter();
                updateYearwiseData();
                
            } else {
                showNotification('Failed to delete sales records', 'error');
            }
        } catch (error) {
            console.error('Error during bulk delete:', error);
            showNotification('Error deleting sales records', 'error');
        }
    } else if (userInput !== null) {
        showNotification('Deletion cancelled - confirmation text did not match', 'info');
    }
}

async function confirmBulkDeletePurchases() {
    const yearSelect = document.getElementById('yearwiseFilter');
    const selectedYear = yearSelect?.value;
    
    if (!selectedYear) {
        showNotification('Please select a specific year first', 'error');
        return;
    }
    
    const purchasesCount = getRecordCountForYear(selectedYear, 'purchases');
    
    if (purchasesCount === 0) {
        showNotification(`No purchase records found for year ${selectedYear}`, 'info');
        return;
    }
    
    const confirmMessage = `⚠️ DANGER: You are about to permanently delete ALL ${purchasesCount} purchase records from year ${selectedYear}.\n\nThis action CANNOT be undone!\n\nType "DELETE ${selectedYear}" to confirm:`;
    
    const userInput = prompt(confirmMessage);
    
    if (userInput === `DELETE ${selectedYear}`) {
        try {
            showNotification('Deleting purchase records... Please wait', 'info');
            const result = await bulkDeletePurchasesByYear(selectedYear);
            
            if (result.success) {
                showNotification(`✅ Successfully deleted ${result.deleted} purchase records for year ${selectedYear}`, 'success');
                
                // Refresh data
                await Promise.all([
                    syncDataFromServer(),
                    loadDashboard()
                ]);
                
                // Update year-wise view
                populateYearwiseFilter();
                updateYearwiseData();
                
            } else {
                showNotification('Failed to delete purchase records', 'error');
            }
        } catch (error) {
            console.error('Error during bulk delete:', error);
            showNotification('Error deleting purchase records', 'error');
        }
    } else if (userInput !== null) {
        showNotification('Deletion cancelled - confirmation text did not match', 'info');
    }
}

async function confirmBulkDeleteBoth() {
    const yearSelect = document.getElementById('yearwiseFilter');
    const selectedYear = yearSelect?.value;
    
    if (!selectedYear) {
        showNotification('Please select a specific year first', 'error');
        return;
    }
    
    const salesCount = getRecordCountForYear(selectedYear, 'sales');
    const purchasesCount = getRecordCountForYear(selectedYear, 'purchases');
    const totalCount = salesCount + purchasesCount;
    
    if (totalCount === 0) {
        showNotification(`No records found for year ${selectedYear}`, 'info');
        return;
    }
    
    const confirmMessage = `🚨 EXTREME DANGER: You are about to permanently delete ALL records from year ${selectedYear}:\n\n• ${salesCount} sales records\n• ${purchasesCount} purchase records\n• Total: ${totalCount} records\n\nThis action CANNOT be undone!\n\nType "DELETE ALL ${selectedYear}" to confirm:`;
    
    const userInput = prompt(confirmMessage);
    
    if (userInput === `DELETE ALL ${selectedYear}`) {
        try {
            showNotification('Deleting all records... Please wait', 'info');
            
            // Delete both sales and purchases in parallel
            const [salesResult, purchasesResult] = await Promise.all([
                salesCount > 0 ? bulkDeleteSalesByYear(selectedYear) : Promise.resolve({ success: true, deleted: 0 }),
                purchasesCount > 0 ? bulkDeletePurchasesByYear(selectedYear) : Promise.resolve({ success: true, deleted: 0 })
            ]);
            
            if (salesResult.success && purchasesResult.success) {
                const totalDeleted = (salesResult.deleted || 0) + (purchasesResult.deleted || 0);
                showNotification(`✅ Successfully deleted all ${totalDeleted} records for year ${selectedYear}`, 'success');
                
                // Refresh data
                await Promise.all([
                    syncDataFromServer(),
                    loadDashboard()
                ]);
                
                // Update year-wise view
                populateYearwiseFilter();
                updateYearwiseData();
                
            } else {
                showNotification('Failed to delete all records', 'error');
            }
        } catch (error) {
            console.error('Error during bulk delete:', error);
            showNotification('Error deleting records', 'error');
        }
    } else if (userInput !== null) {
        showNotification('Deletion cancelled - confirmation text did not match', 'info');
    }
}

// Helper function to get record count for a specific year
function getRecordCountForYear(year, type) {
    const dataKey = type === 'sales' ? 'salesData' : 'purchaseData';
    const dateField = type === 'sales' ? 'sale_date' : 'purchase_date';
    
    const data = JSON.parse(localStorage.getItem(dataKey) || '[]');
    
    return data.filter(record => {
        if (!record[dateField]) return false;
        const recordYear = new Date(record[dateField]).getFullYear();
        return recordYear.toString() === year;
    }).length;
}

// API call functions for bulk deletion
async function bulkDeleteSalesByYear(year) {
    try {
        const response = await fetch(`/api/sales/year/${year}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error deleting sales by year:', error);
        throw error;
    }
}

async function bulkDeletePurchasesByYear(year) {
    try {
        const response = await fetch(`/api/purchases/year/${year}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error deleting purchases by year:', error);
        throw error;
    }
}

// Test function for debugging year-wise section
window.testYearwiseSection = function() {
    console.log('🧪 TESTING YEAR-WISE SECTION...');
    
    // Check if elements exist
    const yearSelect = document.getElementById('yearwiseFilter');
    const salesElement = document.getElementById('yearwiseSales');
    const purchasesElement = document.getElementById('yearwisePurchases');
    
    console.log('🔍 Element check:', {
        yearSelect: !!yearSelect,
        salesElement: !!salesElement,
        purchasesElement: !!purchasesElement
    });
    
    if (yearSelect) {
        console.log('📊 Current dropdown options:', Array.from(yearSelect.options).map(opt => opt.value));
    }
    
    // Check localStorage data
    const salesData = JSON.parse(localStorage.getItem('salesData') || '[]');
    const purchaseData = JSON.parse(localStorage.getItem('purchaseData') || '[]');
    
    console.log('💾 LocalStorage data:', {
        salesCount: salesData.length,
        purchasesCount: purchaseData.length,
        sampleSale: salesData[0],
        samplePurchase: purchaseData[0]
    });
    
    // Try to populate and update
    populateYearwiseFilter();
    updateYearwiseData();
};

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
        
        // Aggregate by YYYY-MM and track monthly extremes for tooltip
        const monthly = {};
        const monthlyExtremes = {};
        const monthNamesFull = ['January','February','March','April','May','June','July','August','September','October','November','December'];
        const ordinal = n => {
            const j = n % 10, k = n % 100;
            if (j === 1 && k !== 11) return 'st';
            if (j === 2 && k !== 12) return 'nd';
            if (j === 3 && k !== 13) return 'rd';
            return 'th';
        };
        const formatDayMonth = dstr => {
            try {
                const d = new Date(dstr);
                if (Number.isNaN(d.getTime())) return '';
                const day = d.getDate();
                return `${day}${ordinal(day)} ${monthNamesFull[d.getMonth()]}`;
            } catch (_) { return ''; }
        };
        salesData.forEach(sale => {
            const ym = toYearMonth(sale.sale_date || sale.date);
            if (!ym) return;
            if (!monthly[ym]) monthly[ym] = { sales: 0, purchases: 0, saleCount: 0 };
            const total = parseFloat(sale.total || 0) || 0;
            monthly[ym].sales += total;
            monthly[ym].saleCount += 1;
            if (!monthlyExtremes[ym]) monthlyExtremes[ym] = { max: null, min: null };
            const curr = monthlyExtremes[ym];
            if (!curr.max || total > curr.max.value) curr.max = { value: total, date: sale.sale_date || sale.date, label: formatDayMonth(sale.sale_date || sale.date) };
            if (!curr.min || total < curr.min.value) curr.min = { value: total, date: sale.sale_date || sale.date, label: formatDayMonth(sale.sale_date || sale.date) };
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
                confine: true,
                extraCssText: isSmall ? 'max-width:92vw; white-space: normal; line-height:1.3;' : '',
                axisPointer: { type: 'cross', label: { show: !isSmall } },
                formatter: params => {
                    const label = params[0]?.axisValueLabel || '';
                    const key = months[params[0]?.dataIndex] || '';
                    const ex = monthlyExtremes[key];
                    let s = `<strong>${label}</strong><br/>`;
                    params.forEach(p => {
                        const raw = p.data && typeof p.data === 'object' && 'value' in p.data ? p.data.value : p.value;
                        const val = raw == null ? '-' : `₹${Number(raw).toLocaleString('en-IN')}`;
                        const countSuffix = (p.seriesName === 'Sales (₹)' && p.data && typeof p.data.saleCount === 'number') ? ` (${p.data.saleCount} sales)` : '';
                        s += `${p.marker} ${p.seriesName}: ${val}${countSuffix}<br/>`;
                    });
                    if (ex) {
                        const hi = ex.max ? `<strong>Highest:</strong> ₹${Number(ex.max.value).toLocaleString('en-IN')} (${ex.max.label})` : '';
                        const lo = ex.min ? `<strong>Lowest:</strong> ₹${Number(ex.min.value).toLocaleString('en-IN')} (${ex.min.label})` : '';
                        if (hi || lo) s += `${hi}${hi && lo ? '<br/>' : ''}${lo}`;
                    }
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
        
            // Show last 20 transactions only
            const limitedList = recentTransactions.slice(0, 20).map(() => '').join('');
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
    window.showSection = async function(sectionName) {
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
        } else if (sectionName === 'insights') {
            try { await loadInsights(); } catch (e) { console.error(e); }
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
                borderWidth: 1,
                hidden: true
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
    const limitedData = allData
        .sort((a, b) => {
            const da = new Date(a.sale_date || a.purchase_date || a.date || 0);
            const db = new Date(b.sale_date || b.purchase_date || b.date || 0);
            return db - da; // newest first
        })
        .slice(0, 20);
    
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
                ${limitedData.map(item => `
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
    // setTimeout(makeTodayStatsClickable, 1000); // DISABLED: Today's stats should not be clickable
    setTimeout(async () => {
        await populateYearOptions();
    }, 500);
    setTimeout(addButtonClickEffects, 1000); // Add button effects after DOM is ready
});

// ========================================
// BULK SALES ENTRY FUNCTIONALITY
// ========================================

let bulkSalesRowCounter = 0;

// Initialize bulk sales section
function initializeBulkSales() {
    bulkSalesRowCounter = 0;
    addBulkSalesResponsiveCSS(); // Add responsive CSS
    addBulkSaleRow(); // Add initial row
}

// Add responsive CSS for bulk sales table
function addBulkSalesResponsiveCSS() {
    // Check if CSS is already added
    if (document.getElementById('bulk-sales-responsive-css')) {
        return;
    }
    
    const style = document.createElement('style');
    style.id = 'bulk-sales-responsive-css';
    style.textContent = `
        /* Mobile info banner for bulk sales */
        .bulk-sales-mobile-info {
            background: #e1f5fe;
            border: 1px solid #0288d1;
            border-radius: 6px;
            padding: 0.75rem;
            margin-bottom: 1rem;
            font-size: 13px;
            color: #01579b;
            display: none;
        }
        
        .bulk-sales-mobile-info strong {
            color: #006064;
        }
        
        /* Responsive bulk sales table - hide columns on portrait mobile and very small screens */
        @media only screen and (max-width: 768px), 
               only screen and (max-height: 900px) and (max-width: 600px),
               only screen and (orientation: portrait) and (max-width: 600px) {
            
            .bulk-hide-mobile {
                display: none !important;
            }
            
            .bulk-sales-mobile-info {
                display: block !important;
            }
            
            /* Make remaining columns take full width */
            .bulk-date-col {
                width: 25%;
                min-width: 100px;
            }
            
            .bulk-description-col {
                width: 40%;
                min-width: 150px;
            }
            
            .bulk-amount-col {
                width: 25%;
                min-width: 100px;
            }
            
            .bulk-actions-col {
                width: 10%;
                min-width: 50px;
            }
            
            /* Hide header columns by position to match hidden data columns */
            #bulkSalesTable thead th:nth-child(2), /* Customer */
            #bulkSalesTable thead th:nth-child(3), /* Category */
            #bulkSalesTable thead th:nth-child(6), /* Payment Method */
            #bulkSalesTable thead th:nth-child(7)  /* Notes */ {
                display: none !important;
            }
        }
        
        /* For very small screens (phones in portrait) - additional optimizations */
        @media only screen and (max-width: 480px) {
            .bulk-date-col input,
            .bulk-description-col input,
            .bulk-amount-col input {
                padding: 0.3rem !important;
                font-size: 14px !important;
            }
            
            .bulk-description-col input {
                font-size: 12px !important;
            }
            
            .bulk-actions-col button {
                padding: 0.2rem 0.4rem !important;
                font-size: 12px !important;
            }
            
            /* Reduce table cell padding on very small screens */
            .bulk-date-col,
            .bulk-description-col,
            .bulk-amount-col,
            .bulk-actions-col {
                padding: 0.25rem !important;
            }
            
            .bulk-sales-mobile-info {
                font-size: 12px !important;
                padding: 0.5rem !important;
            }
        }
    `;
    
    document.head.appendChild(style);
    
    // Add mobile info banner to bulk sales section if it doesn't exist
    addMobileInfoBanner();
    
    console.log('✅ Bulk sales responsive CSS added');
}

// Add mobile info banner
function addMobileInfoBanner() {
    // Find bulk sales section container (look for the table container)
    const bulkSalesTable = document.getElementById('bulkSalesTableBody')?.closest('table');
    if (!bulkSalesTable || document.getElementById('bulk-sales-mobile-info')) {
        return; // Already exists or can't find table
    }
    
    const infoBanner = document.createElement('div');
    infoBanner.id = 'bulk-sales-mobile-info';
    infoBanner.className = 'bulk-sales-mobile-info';
    infoBanner.innerHTML = `
        <strong>📱 Mobile View:</strong> Some fields are hidden for better viewing. 
        <br><strong>Auto-filled values:</strong> Customer: "All Customers", Category: "Bike Parts", Payment: "Cash & Online Both"
    `;
    
    // Insert before the table
    bulkSalesTable.parentNode.insertBefore(infoBanner, bulkSalesTable);
}

// Add a new row to bulk sales table
function addBulkSaleRow() {
    bulkSalesRowCounter++;
    const tbody = document.getElementById('bulkSalesTableBody');
    if (!tbody) return;

    const row = document.createElement('tr');
    row.id = `bulkSaleRow_${bulkSalesRowCounter}`;
    row.innerHTML = `
        <td class="bulk-date-col" style="padding: 0.5rem; border: 1px solid #dee2e6;">
            <input type="date" id="bulkDate_${bulkSalesRowCounter}" 
                   style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 3px;" 
                   value="${getTodayLocalDate()}" required>
        </td>
        <td class="bulk-customer-col bulk-hide-mobile" style="padding: 0.5rem; border: 1px solid #dee2e6;">
            <input type="text" id="bulkCustomer_${bulkSalesRowCounter}" 
                   placeholder="Customer Name" 
                   value="All Customers"
                   style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 3px;" required>
        </td>
        <td class="bulk-category-col bulk-hide-mobile" style="padding: 0.5rem; border: 1px solid #dee2e6;">
            <select id="bulkCategory_${bulkSalesRowCounter}" 
                    style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 3px;" required>
                <option value="">Select Category</option>
                <option value="bike-parts" selected>Bike Parts</option>
                <option value="car-parts">Car Parts</option>
                <option value="bike-service">Bike Service</option>
                <option value="car-service">Car Service</option>
            </select>
        </td>
        <td class="bulk-description-col" style="padding: 0.5rem; border: 1px solid #dee2e6;">
            <input type="text" id="bulkDescription_${bulkSalesRowCounter}" 
                   placeholder="Item/Service Description" 
                   value="Todays total sale including everything"
                   style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 3px;" required>
        </td>
        <td class="bulk-amount-col" style="padding: 0.5rem; border: 1px solid #dee2e6;">
            <input type="number" id="bulkAmount_${bulkSalesRowCounter}" 
                   placeholder="Total Amount (₹)" min="0" step="0.01" 
                   style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 3px;"
                   onchange="updateBulkSalesTotal()" required>
        </td>
        <td class="bulk-payment-col bulk-hide-mobile" style="padding: 0.5rem; border: 1px solid #dee2e6;">
            <input type="text" id="bulkPayment_${bulkSalesRowCounter}" 
                   placeholder="Payment Method" 
                   value="Cash & Online Both"
                   style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 3px;" required>
        </td>
        <td class="bulk-notes-col bulk-hide-mobile" style="padding: 0.5rem; border: 1px solid #dee2e6;">
            <textarea id="bulkNotes_${bulkSalesRowCounter}" 
                   placeholder="Notes (optional)" 
                   style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 3px; resize: none; height: 2rem;"></textarea>
        </td>
        <td class="bulk-actions-col" style="padding: 0.5rem; border: 1px solid #dee2e6; text-align: center;">
            <button type="button" onclick="removeBulkSaleRow(${bulkSalesRowCounter})" 
                    style="background: #dc3545; color: white; border: none; padding: 0.3rem 0.6rem; border-radius: 3px; cursor: pointer;">
                <i class="fas fa-trash"></i>
            </button>
        </td>
    `;
    
    tbody.appendChild(row);
    updateBulkSalesTotal();
}

// Remove a row from bulk sales table
function removeBulkSaleRow(rowId) {
    const row = document.getElementById(`bulkSaleRow_${rowId}`);
    if (row) {
        row.remove();
        updateBulkSalesTotal();
    }
}

// Update the total amount for all bulk sales
function updateBulkSalesTotal() {
    const tbody = document.getElementById('bulkSalesTableBody');
    if (!tbody) return;
    
    let grandTotal = 0;
    const rows = tbody.querySelectorAll('tr');
    
    rows.forEach(row => {
        const amountInput = row.querySelector('input[id^="bulkAmount_"]');
        if (amountInput) {
            grandTotal += parseFloat(amountInput.value) || 0;
        }
    });
    
    const totalElement = document.getElementById('bulkSalesTotalAmount');
    if (totalElement) {
        totalElement.textContent = grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 });
    }
}

// Copy first row's date to all rows
function copyDateToAll() {
    const firstDateInput = document.querySelector('#bulkSalesTableBody input[id^="bulkDate_"]');
    if (!firstDateInput || !firstDateInput.value) {
        showNotification('Please enter a date in the first row first.', 'warning');
        return;
    }
    
    const allDateInputs = document.querySelectorAll('#bulkSalesTableBody input[id^="bulkDate_"]');
    allDateInputs.forEach(input => {
        input.value = firstDateInput.value;
    });
    
    showNotification('Date copied to all rows!', 'success');
}

// Clear all bulk sales entries
function clearBulkSales() {
    if (confirm('Are you sure you want to clear all entries? This cannot be undone.')) {
        const tbody = document.getElementById('bulkSalesTableBody');
        if (tbody) {
            tbody.innerHTML = '';
            bulkSalesRowCounter = 0;
            addBulkSaleRow(); // Add one empty row
            updateBulkSalesTotal();
        }
        showNotification('All entries cleared!', 'info');
    }
}

// Submit all bulk sales
async function submitBulkSales() {
    const tbody = document.getElementById('bulkSalesTableBody');
    if (!tbody) return;
    
    const rows = tbody.querySelectorAll('tr');
    const salesData = [];
    let hasErrors = false;
    
    // Validate and collect data from each row
    rows.forEach((row, index) => {
        const rowNumber = index + 1;
        const dateInput = row.querySelector('input[id^="bulkDate_"]');
        const customerInput = row.querySelector('input[id^="bulkCustomer_"]');
        const categoryInput = row.querySelector('select[id^="bulkCategory_"]');
        const descriptionInput = row.querySelector('input[id^="bulkDescription_"]');
        const amountInput = row.querySelector('input[id^="bulkAmount_"]');
        const paymentInput = row.querySelector('input[id^="bulkPayment_"]');
        const notesInput = row.querySelector('textarea[id^="bulkNotes_"]');
        
        // Ensure hidden fields have default values (mobile responsiveness support)
        if (!customerInput.value.trim()) {
            customerInput.value = 'All Customers';
        }
        if (!categoryInput.value) {
            categoryInput.value = 'bike-parts';
        }
        if (!paymentInput.value.trim()) {
            paymentInput.value = 'Cash & Online Both';
        }
        
        // Basic validation - same as regular Add Sale form (Notes is optional)
        if (!dateInput.value || !customerInput.value || !categoryInput.value || 
            !descriptionInput.value || !amountInput.value || !paymentInput.value) {
            showNotification(`Row ${rowNumber}: Please fill all required fields (Date, Customer, Category, Description, Amount, Payment Method). Notes are optional.`, 'error');
            hasErrors = true;
            return;
        }
        
        const amount = parseFloat(amountInput.value);
        
        if (amount <= 0) {
            showNotification(`Row ${rowNumber}: Amount must be greater than 0.`, 'error');
            hasErrors = true;
            return;
        }
        
        salesData.push({
            sale_date: dateInput.value,
            customer: customerInput.value.trim(),
            category: categoryInput.value,
            description: descriptionInput.value.trim(),
            total: amount,
            paymentMethod: paymentInput.value.trim(),
            notes: notesInput.value.trim()
        });
    });
    
    if (hasErrors || salesData.length === 0) {
        return;
    }
    
    // Show confirmation
    const confirmMessage = `You are about to submit ${salesData.length} sales entries with a total value of ₹${salesData.reduce((sum, sale) => sum + sale.total, 0).toLocaleString('en-IN')}. Continue?`;
    
    if (!confirm(confirmMessage)) {
        return;
    }
    
    // Submit all sales one by one
    try {
        showNotification('Submitting bulk sales... Please wait.', 'info');
        let successCount = 0;
        let errorCount = 0;
        
        for (let i = 0; i < salesData.length; i++) {
            const sale = salesData[i];
            try {
                const response = await fetch('/api/sales', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(sale)
                });
                
                if (response.ok) {
                    successCount++;
                } else {
                    errorCount++;
                    console.error(`Failed to submit sale ${i + 1}:`, await response.text());
                }
            } catch (error) {
                errorCount++;
                console.error(`Error submitting sale ${i + 1}:`, error);
            }
        }
        
        // Show results
        if (errorCount === 0) {
            showNotification(`✅ Successfully submitted all ${successCount} sales!`, 'success');
            clearBulkSales(); // Clear the form
            
            // Refresh dashboard data in background (same as regular Add Sale form)
            Promise.all([
                loadDashboard(),
                populateYearOptions()
            ]).catch(error => {
                console.error('Background refresh error:', error);
            });
            
            // Update year-wise filter if visible
            if (document.getElementById('yearwiseFilter')) {
                await syncDataFromServer(); // Sync fresh data
                populateYearwiseFilter();
                updateYearwiseData();
            }
        } else {
            showNotification(`⚠️ Submitted ${successCount} sales successfully, ${errorCount} failed. Check console for details.`, 'warning');
        }
        
    } catch (error) {
        console.error('Bulk sales submission error:', error);
        showNotification('❌ Error during bulk submission. Please try again.', 'error');
    }
}

// Initialize bulk sales when DOM is ready
setTimeout(() => {
    if (document.getElementById('bulkSalesTableBody')) {
        initializeBulkSales();
    }
}, 1500);

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
        const searchTerm = document.getElementById('searchEntries')?.value || '';
        const filterType = document.getElementById('filterType')?.value || 'all';
        const filterCategory = document.getElementById('filterCategory')?.value || '';
        
        // For large datasets (detected by checking localStorage size), use server-side search
        const salesDataSize = localStorage.getItem('salesData')?.length || 0;
        const purchaseDataSize = localStorage.getItem('purchaseData')?.length || 0;
        const totalDataSize = salesDataSize + purchaseDataSize;
        
        // If data is large (>1MB) or search term provided, use server-side pagination
        if (totalDataSize > 1000000 || searchTerm) {
            console.log('📊 Using server-side search for large dataset or search query');
            await searchEntriesWithPagination(searchTerm, filterType, filterCategory);
        } else {
            console.log('📊 Using client-side filtering for smaller dataset');
            await searchEntriesClientSide(searchTerm, filterType, filterCategory);
        }
        
    } catch (error) {
        console.error('Error searching entries:', error);
        showNotification('Error searching entries', 'error');
    }
}

// Server-side search with pagination (for large datasets)
async function searchEntriesWithPagination(searchTerm, filterType, filterCategory) {
    try {
        // Prepare search options for both sales and purchases
        const salesOptions = { page: 1, limit: 25 };
        const purchasesOptions = { page: 1, limit: 25 };
        
        if (searchTerm) {
            salesOptions.search = searchTerm;
            purchasesOptions.search = searchTerm;
        }
        if (filterCategory) {
            salesOptions.category = filterCategory;
            purchasesOptions.category = filterCategory;
        }
        
        // Load data with pagination
        const [salesResult, purchasesResult] = await Promise.all([
            filterType === 'purchases' ? { data: [], pagination: { total: 0 } } : loadSalesData(salesOptions),
            filterType === 'sales' ? { data: [], pagination: { total: 0 } } : loadPurchasesData(purchasesOptions)
        ]);
        
        // Handle both array responses (no pagination) and paginated responses
        const salesData = Array.isArray(salesResult) ? salesResult : salesResult.data || [];
        const purchaseData = Array.isArray(purchasesResult) ? purchasesResult : purchasesResult.data || [];
        
        // Combine entries
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
        
        filteredEntries = allEntries;
        currentPage = 1;
        displayEntries();
        updatePagination();
        
        console.log(`📊 Server-side search completed: ${filteredEntries.length} entries found`);
        
    } catch (error) {
        console.error('Error in server-side search:', error);
        // Fallback to client-side search
        await searchEntriesClientSide(searchTerm, filterType, filterCategory);
    }
}

// Original client-side search (for smaller datasets)
async function searchEntriesClientSide(searchTerm, filterType, filterCategory) {
    try {
        // Get all data (original behavior)
        const salesResponse = await fetch('/api/sales');
        const salesData = await salesResponse.json();
        
        const purchasesResponse = await fetch('/api/purchases');
        const purchaseData = await purchasesResponse.json();
        
        // Handle both array responses and paginated responses
        const actualSalesData = Array.isArray(salesData) ? salesData : salesData.data || [];
        const actualPurchaseData = Array.isArray(purchaseData) ? purchaseData : purchaseData.data || [];
        
        // Combine all entries
        allEntries = [
            ...actualSalesData.map(sale => ({
                ...sale,
                type: 'sale',
                contact: sale.customer,
                date: sale.sale_date,
                created_at: sale.created_at
            })),
            ...actualPurchaseData.map(purchase => ({
                ...purchase,
                type: 'purchase',
                contact: purchase.supplier,
                date: purchase.purchase_date,
                created_at: purchase.created_at
            }))
        ];
        
        // Apply client-side filters (original logic)
        filteredEntries = allEntries.filter(entry => {
            // Search filter
            if (searchTerm && !entry.contact?.toLowerCase().includes(searchTerm.toLowerCase()) && 
                !entry.description?.toLowerCase().includes(searchTerm.toLowerCase())) {
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
        
        console.log(`📊 Client-side search completed: ${filteredEntries.length} entries found`);
        
    } catch (error) {
        console.error('Error in client-side search:', error);
        throw error;
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
// showSection is defined in setupNavigation()
window.generateReport = generateReport;
window.exportToExcel = exportToExcel;
window.searchAndFilterEntries = searchAndFilterEntries;
window.previousPage = previousPage;
window.nextPage = nextPage;
window.editEntry = editEntry;
window.deleteEntry = deleteEntry;
// Bulk delete functions
window.confirmBulkDeleteSales = confirmBulkDeleteSales;
window.confirmBulkDeletePurchases = confirmBulkDeletePurchases;
window.confirmBulkDeleteBoth = confirmBulkDeleteBoth;

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
        const monthNamesFull = ['January','February','March','April','May','June','July','August','September','October','November','December'];
        const ordinal = n => { const j=n%10,k=n%100; if(j===1&&k!==11) return 'st'; if(j===2&&k!==12) return 'nd'; if(j===3&&k!==13) return 'rd'; return 'th'; };
        const formatDayMonth = dstr => { try { const d=new Date(dstr); if(Number.isNaN(d.getTime())) return ''; const day=d.getDate(); return `${day}${ordinal(day)} ${monthNamesFull[d.getMonth()]}`; } catch(_) { return ''; } };
        const initYearArrays = () => ({ sales: new Array(12).fill(0), purchases: new Array(12).fill(0), saleCount: new Array(12).fill(0) });
        const byYear = Object.fromEntries(years.map(y => [y, initYearArrays()]));
        const extremesByYearMonth = {};
        const getYM = d => {
            if (!d) return null;
            if (/^\d{4}-\d{2}-\d{2}/.test(d)) return { y: Number(d.substring(0,4)), m: Number(d.substring(5,7)) - 1 };
            const dt = new Date(d); if (Number.isNaN(dt.getTime())) return null; return { y: dt.getFullYear(), m: dt.getMonth() };
        };
        sales.forEach(s => { const ym = getYM(s.sale_date || s.date); if (!ym) return; if (byYear[ym.y]) { byYear[ym.y].sales[ym.m] += parseFloat(s.total||0)||0; byYear[ym.y].saleCount[ym.m] += 1; }
            const key = `${ym.y}-${ym.m}`; if (!extremesByYearMonth[key]) extremesByYearMonth[key] = { max: null, min: null };
            const val = parseFloat(s.total||0)||0; const label = formatDayMonth(s.sale_date || s.date);
            if (!extremesByYearMonth[key].max || val > extremesByYearMonth[key].max.value) extremesByYearMonth[key].max = { value: val, label };
            if (!extremesByYearMonth[key].min || val < extremesByYearMonth[key].min.value) extremesByYearMonth[key].min = { value: val, label };
        });
        purchases.forEach(p => { const ym = getYM(p.purchase_date || p.date); if (!ym) return; if (byYear[ym.y]) byYear[ym.y].purchases[ym.m] += parseFloat(p.total||0)||0; });
        
        if (!window._overallChart) window._overallChart = echarts.init(el);
        const chart = window._overallChart;
        const isSmall = window.innerWidth < 768;
        
        const timelineYears = years.map(String);
        const baseOption = {
            backgroundColor: 'transparent',
            // Precomputed extremes per year for monthly sales
            // Build once for all years to use in tooltip
            __extremesByYear: (function(){
                const map = {};
                years.forEach(y => {
                    const arr = byYear[y].sales.map((v, idx) => ({ v, idx }));
                    let max = null, min = null;
                    arr.forEach(({ v, idx }) => {
                        if (max === null || v > arr[max].v) max = idx;
                        if (min === null || v < arr[min].v) min = idx;
                    });
                    map[y] = { maxIdx: max, minIdx: min };
                });
                return map;
            })(),
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
                confine: true,
                extraCssText: isSmall ? 'max-width:92vw; white-space: normal; line-height:1.3;' : '',
                axisPointer: { type: 'cross', label: { show: !isSmall } },
                formatter: (params) => {
                    const label = params[0]?.axisValueLabel || '';
                    const idx = params[0]?.dataIndex ?? 0;
                    const yearIdx = chart?.getOption()?.timeline?.[0]?.currentIndex ?? (timelineYears.length - 1);
                    const year = years[yearIdx];
                    const key = `${year}-${idx}`;
                    const ex = extremesByYearMonth[key];
                    let s = `<strong>${label}</strong><br/>`;
                    params.forEach(p => {
                        const val = `₹${Number(p.value || (p.data && p.data.value) || 0).toLocaleString('en-IN')}`;
                        const countSuffix = (p.seriesName === 'Sales (₹)' && p.data && typeof p.data.saleCount === 'number') ? ` (${p.data.saleCount} sales)` : '';
                        s += `${p.marker} ${p.seriesName}: ${val}${countSuffix}<br/>`;
                    });
                    if (ex) {
                        const hi = ex.max ? `<strong>Highest:</strong> ₹${Number(ex.max.value).toLocaleString('en-IN')} (${ex.max.label})` : '';
                        const lo = ex.min ? `<strong>Lowest:</strong> ₹${Number(ex.min.value).toLocaleString('en-IN')} (${ex.min.label})` : '';
                        if (hi || lo) s += `${hi}${hi && lo ? '<br/>' : ''}${lo}`;
                    }
                    return s;
                }
            },
            legend: { top: isSmall ? 34 : 46, left: 'center', itemGap: isSmall ? 10 : 20, data: ['Sales (₹)', 'Purchases (₹)', 'Net Profit (₹)', 'Avg Sale (₹)'], textStyle: { fontSize: isSmall ? 11 : 12 }, padding: isSmall ? [2, 6, 2, 6] : 5, backgroundColor: isSmall ? 'rgba(255,255,255,0.7)' : 'transparent' },
            grid: { left: isSmall ? 36 : 56, right: isSmall ? 20 : 40, top: isSmall ? 88 : 96, bottom: isSmall ? 86 : 100, containLabel: true },
            xAxis: [{ type: 'category', data: monthNamesShort, axisLabel: { fontSize: isSmall ? 10 : 12, hideOverlap: true } }],
            yAxis: [{ type: 'value', axisLabel: { formatter: v => `₹${Number(v).toLocaleString('en-IN')}` } }],
            series: [
                { name: 'Sales (₹)', type: 'bar', itemStyle: { color: '#22c55e' }, barWidth: isSmall ? 8 : 12, barGap: '30%', label: { show: !isSmall, position: 'top', formatter: (p) => (p.data && typeof p.data.saleCount === 'number' && p.data.saleCount > 0) ? `${p.data.saleCount}` : '' } },
                { name: 'Purchases (₹)', type: 'bar', itemStyle: { color: '#ef4444' }, barWidth: isSmall ? 8 : 12, barGap: '30%' },
                { name: 'Net Profit (₹)', type: 'line', smooth: true, lineStyle: { width: isSmall ? 2 : 3, color: '#FA5827' }, itemStyle: { color: '#FA5827' }, symbol: 'circle', symbolSize: isSmall ? 6 : 8 },
                { name: 'Avg Sale (₹)', type: 'line', smooth: true, lineStyle: { width: isSmall ? 2 : 3, color: '#3b82f6' }, itemStyle: { color: '#3b82f6' }, symbol: 'circle', symbolSize: isSmall ? 6 : 8 }
            ]
        };
        
        const options = years.map(y => ({
            title: { text: `Overalll Report — ${y}`, left: 'center', top: 8, textStyle: { fontSize: isSmall ? 15 : 18, fontWeight: 'bold' } },
            series: [
                { data: byYear[y].sales.map((v, i) => ({ value: v, saleCount: byYear[y].saleCount[i] || 0 })) },
                { data: byYear[y].purchases },
                { data: byYear[y].sales.map((v, i) => Math.max(0, v - (byYear[y].purchases[i]||0))) },
                { data: byYear[y].sales.map((v, i) => { const c = byYear[y].saleCount[i] || 0; return c > 0 ? v / c : null; }) }
            ]
        }));
        
        const option = { baseOption, options };
        chart.setOption(option, true);
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

async function loadInsights() {
    try {
        // Check if ECharts is loaded
        if (typeof echarts === 'undefined') {
            console.error('ECharts library not loaded');
            const containers = ['insightsChart', 'seasonalHeatmap', 'growthChart', 'goalGauge', 'cashFlowForecast', 'revenueForecast'];
            containers.forEach(id => {
                const el = document.getElementById(id);
                if (el) el.innerHTML = '<p style="text-align:center;color:#666;padding:2rem;">ECharts library not loaded</p>';
            });
            return;
        }
        
        const [salesRes, purchasesRes] = await Promise.all([
            fetch('/api/sales'), fetch('/api/purchases')
        ]);
        
        if (!salesRes.ok || !purchasesRes.ok) {
            console.error('Failed to fetch data');
            return;
        }
        
        const [sales, purchases] = await Promise.all([salesRes.json(), purchasesRes.json()]);
        insightsData.sales = sales; insightsData.purchases = purchases;
        console.log('🔍 Insights Debug: Sales data:', sales.length, 'records');
        console.log('🔍 Insights Debug: Sample sale:', sales[0]);

        // Aggregate data with better validation
        const now = new Date(); const yThis = now.getFullYear(); const yPrev = yThis - 1;
        const makeBuckets = () => ({ 
            values: Array(12).fill(0), 
            days: Array.from({length:12}, ()=>({}))
        });
        
        // Initialize with safe defaults
        insightsData.bucketByYear = { 
            [yThis]: makeBuckets(), 
            [yPrev]: makeBuckets() 
        };

        // Validate and process sales data
        if (Array.isArray(sales)) {
            sales.forEach(s => {
                if (!s || typeof s !== 'object') return;
                
                const dateStr = s.sale_date || s.date;
                if (!dateStr) return;
                
                const d = new Date(dateStr); 
                if (isNaN(d.getTime())) return;
                
                const y = d.getFullYear(); 
                const m = d.getMonth();
                
                // Validate year and month ranges
                if (m < 0 || m > 11) return;
                if (y < 2020 || y > 2030) return;
                
                if (!insightsData.bucketByYear[y]) {
                    insightsData.bucketByYear[y] = makeBuckets();
                }
                
                const val = parseFloat(s.total || 0) || 0;
                if (val >= 0) { // Only add positive values
                    insightsData.bucketByYear[y].values[m] += val;
                    const key = d.toISOString().slice(0,10);
                    if (!insightsData.bucketByYear[y].days[m]) {
                        insightsData.bucketByYear[y].days[m] = {};
                    }
                    insightsData.bucketByYear[y].days[m][key] = (insightsData.bucketByYear[y].days[m][key] || 0) + val;
                }
            });
        } else {
            console.error('❌ Sales data is not an array:', sales);
        }

        console.log('🔍 Insights Debug: Bucket data after processing:', insightsData.bucketByYear);
        
        // Load all sub-sections with proper error handling
        const loadPromises = [
            loadMainChart(),
            loadSeasonalHeatmap(),
            loadGrowthIndicators(),
            loadGoalGauge(),
            loadHealthScore(),
            loadCashFlowForecast(),
            loadRevenueForecast(),
            setupInteractiveFilters()
        ];
        
        const results = await Promise.allSettled(loadPromises);
        console.log('🔍 Insights Debug: Load results:', results.map(r => r.status));
        
        // Test if interactive elements are working after a short delay
        setTimeout(() => {
            testInteractiveElements();
        }, 1000);
    } catch (e) {
        console.error('Insights load error', e);
    }
}

async function loadMainChart() {
    const container = document.getElementById('insightsChart');
    if (!container) {
        console.error('Main chart container not found');
        return;
    }
    
    // Dispose existing chart if any
    if (container._chartInstance) {
        try {
            container._chartInstance.dispose();
        } catch (e) {
            console.warn('Warning disposing chart:', e);
        }
        container._chartInstance = null;
    }
    
    // Validate that we have data before initializing chart
    if (!insightsData || !insightsData.bucketByYear) {
        console.error('❌ No insights data available for chart');
        container.innerHTML = '<p style="text-align:center;color:#666;padding:2rem;">No data available</p>';
        return;
    }
    
    const chart = echarts.init(container);
    if (!chart) {
        console.error('❌ Failed to initialize ECharts');
        return;
    }
    
    container._chartInstance = chart;
    const isSmall = window.innerWidth < 768;
    const monthsShort = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const yThis = new Date().getFullYear(); const yPrev = yThis - 1;

    const sma = (arr, w=3) => arr.map((_,i)=>{ const start = Math.max(0, i-w+1); const slice = arr.slice(start, i+1); return slice.reduce((a,b)=>a+b,0)/slice.length; });

    function getSeries() {
        // Validate insights data structure
        if (!insightsData || !insightsData.bucketByYear) {
            console.error('❌ No insights data available');
            return [{ name: 'No Data', type: 'bar', data: Array(12).fill(0) }];
        }
        
        // Ensure data is properly formatted and contains valid numbers
        const thisYearBucket = insightsData.bucketByYear[yThis];
        const prevYearBucket = insightsData.bucketByYear[yPrev];
        
        const thisYearData = (thisYearBucket?.values || Array(12).fill(0)).map(v => Number(v) || 0);
        const prevYearData = (prevYearBucket?.values || Array(12).fill(0)).map(v => Number(v) || 0);
        
        console.log('🔍 Main Chart Debug: This year data:', thisYearData);
        console.log('🔍 Main Chart Debug: Prev year data:', prevYearData);
        
        // Ensure we have exactly 12 months of data
        while (thisYearData.length < 12) thisYearData.push(0);
        while (prevYearData.length < 12) prevYearData.push(0);
        
        // Trim to exactly 12 months
        thisYearData.splice(12);
        prevYearData.splice(12);
        
        const ser = [{ 
            name: 'Sales (₹)', 
            type: 'bar', 
            itemStyle: {color:'#22c55e'}, 
            data: thisYearData.slice(0, 12) // Ensure exactly 12 data points
        }];
        
        const yoyChecked = document.getElementById('toggleYoy')?.checked;
        const smaChecked = document.getElementById('toggleSma')?.checked;
        console.log('🔍 getSeries: YoY checked:', yoyChecked, 'SMA checked:', smaChecked);
        
        if (yoyChecked) {
            console.log('🔍 Adding YoY comparison data');
            ser.push({ 
                name: `Sales ${yPrev} (₹)`, 
                type: 'bar', 
                itemStyle: {color:'#94a3b8'}, 
                data: prevYearData.slice(0, 12),
                barGap: '30%'
            });
        }
        
        if (smaChecked) {
            try {
                const smaData = sma(thisYearData).map(v => Number(v) || 0);
                console.log('🔍 Adding SMA forecast data:', smaData);
                ser.push({ 
                    name: 'Forecast (SMA)', 
                    type: 'line', 
                    smooth: true, 
                    itemStyle: {color:'#3b82f6'}, 
                    lineStyle: {width:2}, 
                    data: smaData.slice(0, 12)
                });
            } catch (e) {
                console.error('❌ Error calculating SMA:', e);
            }
        }
        
        const growth = parseFloat(document.getElementById('whatIfGrowth')?.value || 0);
        if (growth && document.getElementById('whatIfGrowth')?.dataset.applied) {
            try {
                const whatIfData = thisYearData.map(v => (Number(v) || 0) * (1 + growth/100));
                console.log('🔍 Adding What-if data with', growth, '% growth:', whatIfData);
                            ser.push({ 
                name: `What-if +${growth}%`, 
                type: 'line', 
                smooth: true, 
                itemStyle: {color:'#ef4444'}, 
                lineStyle: {width:2, type:'dashed'}, 
                data: whatIfData.slice(0, 12)
            });
            } catch (e) {
                console.error('❌ Error calculating What-if data:', e);
            }
        }
        
        console.log('🔍 Final series:', ser.map(s => ({ name: s.name, dataLength: s.data.length })));
        return ser;
    }

    const option = {
        backgroundColor: 'transparent',
        tooltip: { 
            trigger: 'axis', 
            confine: true, 
            extraCssText: isSmall ? 'max-width:92vw;' : '',
            formatter: function(params) {
                if (!params || params.length === 0) return '';
                let result = params[0].name + '<br/>';
                params.forEach(param => {
                    if (param.value !== undefined && param.value !== null) {
                        result += param.marker + ' ' + param.seriesName + ': ₹' + Number(param.value).toLocaleString('en-IN') + '<br/>';
                    }
                });
                return result;
            }
        },
        grid: { left: isSmall?36:56, right: isSmall?20:40, top: isSmall?30:40, bottom: isSmall?60:60, containLabel: true },
        legend: { top: isSmall?0:6, textStyle: { fontSize: isSmall?10:12 } },
        xAxis: [{ 
            type:'category', 
            data: monthsShort, 
            axisLabel: { fontSize: isSmall?10:12 }
        }],
        yAxis: [{ 
            type:'value', 
            axisLabel:{ 
                formatter: function(value) {
                    return '₹' + Number(value || 0).toLocaleString('en-IN');
                }, 
                fontSize: isSmall?10:12 
            }
        }],
        brush: { 
            toolbox: ['rect','polygon','clear'], 
            xAxisIndex: 'all',
            throttleType: 'debounce',
            throttleDelay: 300
        },
        series: getSeries()
    };
    
    try {
        // Validate the option structure before setting
        if (!option.series || !Array.isArray(option.series) || option.series.length === 0) {
            console.error('❌ Invalid chart option - no series data');
            return;
        }
        
        // Validate each series has required properties
        for (let i = 0; i < option.series.length; i++) {
            const series = option.series[i];
            if (!series.data || !Array.isArray(series.data)) {
                console.error(`❌ Series ${i} has invalid data:`, series);
                return;
            }
        }
        
        chart.setOption(option, true);
        console.log('🔍 Main chart option set successfully');
    } catch (error) {
        console.error('❌ Error setting main chart option:', error);
        console.log('🔍 Chart option:', option);
        console.log('🔍 Chart data:', getSeries());
    }

    function refresh() { 
        console.log('🔍 Refresh called - YoY checked:', document.getElementById('toggleYoy')?.checked, 'SMA checked:', document.getElementById('toggleSma')?.checked);
        try {
            // Validate chart still exists and is not disposed
            if (!chart || chart.isDisposed()) {
                console.error('❌ Chart is disposed, cannot refresh');
                return;
            }
            
            const newSeries = getSeries();
            console.log('🔍 New series data:', newSeries.map(s => ({ name: s.name, dataLength: s.data?.length })));
            
            // Use merge: false to completely replace the series instead of merging
            const newOption = {
                backgroundColor: 'transparent',
                xAxis: [{ 
                    type:'category', 
                    data: monthsShort, 
                    axisLabel: { fontSize: isSmall?10:12 }
                }],
                series: newSeries
            };
            
            chart.setOption(newOption, false); // false = merge mode off
            console.log('🔍 Chart refreshed successfully');
        } catch (error) {
            console.error('❌ Error refreshing chart:', error);
            console.log('🔍 Chart instance exists:', !!chart);
            console.log('🔍 Chart disposed:', chart?.isDisposed?.());
            
            // Try to reinitialize the chart if it's in a bad state
            try {
                const container = document.getElementById('insightsChart');
                if (container && chart) {
                    console.log('🔍 Attempting to reinitialize chart...');
                    chart.dispose();
                    container._chartInstance = null;
                    loadMainChart();
                }
            } catch (reinitError) {
                console.error('❌ Failed to reinitialize chart:', reinitError);
            }
        }
    }
    
    // Store the refresh function for external access
    container._refreshFunction = refresh;
    
    // Add event listeners with better error handling
    const toggleYoy = document.getElementById('toggleYoy');
    const toggleSma = document.getElementById('toggleSma');
    const applyWhatIf = document.getElementById('applyWhatIf');
    const whatIfGrowth = document.getElementById('whatIfGrowth');
    
    if (toggleYoy) {
        toggleYoy.addEventListener('change', (e) => {
            console.log('🔍 YoY checkbox changed:', e.target.checked);
            refresh();
        });
    } else {
        console.error('❌ toggleYoy element not found');
    }
    
    if (toggleSma) {
        toggleSma.addEventListener('change', (e) => {
            console.log('🔍 SMA checkbox changed:', e.target.checked);
            refresh();
        });
    } else {
        console.error('❌ toggleSma element not found');
    }
    
    if (applyWhatIf && whatIfGrowth) {
        applyWhatIf.addEventListener('click', () => {
            console.log('🔍 What-if button clicked with value:', whatIfGrowth.value);
            whatIfGrowth.dataset.applied = 'true'; 
            refresh();
        });
    } else {
        console.error('❌ What-if elements not found');
    }

    chart.on('click', params => {
        try {
            if (!params || params.componentType !== 'series' || params.seriesType === 'line') return;
            
            const m = params.dataIndex;
            if (typeof m !== 'number' || m < 0 || m > 11) return;
            
            const currentYear = new Date().getFullYear();
            const yearData = insightsData.bucketByYear[currentYear];
            if (!yearData || !yearData.days || !yearData.days[m]) return;
            
            const daysMap = yearData.days[m];
            const days = Object.keys(daysMap).sort();
            if (days.length === 0) return;
            
            const dailyData = days.map(k => Number(daysMap[k]) || 0);
            
            chart.setOption({ 
                xAxis: [{ type:'category', data: days }], 
                series: [{ 
                    name:'Sales (₹)', 
                    type:'bar', 
                    itemStyle:{color:'#22c55e'}, 
                    data: dailyData 
                }], 
                legend: { data: ['Sales (₹)'] } 
            });
        } catch (error) {
            console.error('❌ Error handling chart click:', error);
        }
    });

    chart.on('brushSelected', function (params) {
        try {
            if (!params || !params.batch || !Array.isArray(params.batch)) return;
            
            const batch = params.batch[0];
            if (!batch || !batch.selected || !Array.isArray(batch.selected)) return;
            
            const areas = batch.selected[0];
            if (!areas || !areas.dataIndex || !Array.isArray(areas.dataIndex)) return;
            
            const idxs = areas.dataIndex;
            const selectedDates = [];
            const currentYear = new Date().getFullYear();
            const yearData = insightsData.bucketByYear[currentYear];
            
            if (yearData && yearData.days) {
                idxs.forEach(m => {
                    if (typeof m === 'number' && m >= 0 && m < 12 && yearData.days[m]) {
                        const map = yearData.days[m];
                        Object.keys(map).forEach(d => selectedDates.push(d));
                    }
                });
            }
            
            updateInsightsTable(selectedDates, insightsData.sales, insightsData.purchases);
        } catch (error) {
            console.error('❌ Error handling brush selection:', error);
        }
    });

    window.addEventListener('resize', () => chart.resize());
}

async function loadSeasonalHeatmap() {
    const container = document.getElementById('seasonalHeatmap');
    if (!container) {
        console.error('Seasonal heatmap container not found');
        return;
    }
    
    // Dispose existing chart if any ----
    if (container._chartInstance) {
        container._chartInstance.dispose();
    }
    
    const chart = echarts.init(container);
    container._chartInstance = chart;
    
    // Build heatmap data: [month, dayOfWeek, value]
    const heatData = []; const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    for (let m = 0; m < 12; m++) {
        for (let d = 0; d < 7; d++) {
            let total = 0;
            insightsData.sales.forEach(s => {
                const date = new Date(s.sale_date || s.date); if (isNaN(date)) return;
                if (date.getMonth() === m && date.getDay() === d) total += parseFloat(s.total||0)||0;
            });
            heatData.push([m, d, total]);
        }
    }

    const option = {
        tooltip: { formatter: p => `${monthNames[p.data[0]]} ${dayNames[p.data[1]]}<br/>₹${Number(p.data[2]).toLocaleString('en-IN')}` },
        grid: { left: 60, right: 20, top: 20, bottom: 40 },
        xAxis: { type: 'category', data: monthNames, axisLabel: { fontSize: 10 } },
        yAxis: { type: 'category', data: dayNames, axisLabel: { fontSize: 10 } },
        visualMap: { min: 0, max: Math.max(...heatData.map(d=>d[2]), 1), inRange: { color: ['#f0f9ff', '#0ea5e9'] }, show: false },
        series: [{ type: 'heatmap', data: heatData, itemStyle: { borderWidth: 1, borderColor: '#fff' } }]
    };
    chart.setOption(option);
    window.addEventListener('resize', () => chart.resize());
}

async function loadGrowthIndicators() {
    const yThis = new Date().getFullYear(); const thisYear = insightsData.bucketByYear[yThis]?.values || [];
    const lastYear = insightsData.bucketByYear[yThis-1]?.values || [];
    const thisMonth = new Date().getMonth(); const lastMonth = thisMonth > 0 ? thisMonth - 1 : 11;
    
    const momGrowth = thisYear[lastMonth] ? ((thisYear[thisMonth] - thisYear[lastMonth]) / thisYear[lastMonth] * 100) : 0;
    const yoyGrowth = lastYear[thisMonth] ? ((thisYear[thisMonth] - lastYear[thisMonth]) / lastYear[thisMonth] * 100) : 0;
    
    document.getElementById('momGrowth').textContent = `${momGrowth > 0 ? '↗️' : momGrowth < 0 ? '↘️' : '➡️'} ${momGrowth.toFixed(1)}%`;
    document.getElementById('momGrowth').style.color = momGrowth > 0 ? '#22c55e' : momGrowth < 0 ? '#ef4444' : '#6b7280';
    document.getElementById('yoyGrowth').textContent = `${yoyGrowth > 0 ? '↗️' : yoyGrowth < 0 ? '↘️' : '➡️'} ${yoyGrowth.toFixed(1)}%`;
    document.getElementById('yoyGrowth').style.color = yoyGrowth > 0 ? '#22c55e' : yoyGrowth < 0 ? '#ef4444' : '#6b7280';

    const container = document.getElementById('growthChart');
    if (!container) {
        console.error('Growth chart container not found');
        return;
    }
    
    // Dispose existing chart if any
    if (container._chartInstance) {
        container._chartInstance.dispose();
    }
    
    const chart = echarts.init(container);
    container._chartInstance = chart;
    const monthsShort = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    
    const option = {
        tooltip: { trigger: 'axis' },
        grid: { left: 40, right: 20, top: 20, bottom: 30 },
        xAxis: { type: 'category', data: monthsShort.slice(0, thisMonth+1), axisLabel: { fontSize: 9 } },
        yAxis: { type: 'value', axisLabel: { fontSize: 9 } },
        series: [{ type: 'line', data: thisYear.slice(0, thisMonth+1), smooth: true, itemStyle: { color: '#3b82f6' }, lineStyle: { width: 2 } }]
    };
    chart.setOption(option);
    window.addEventListener('resize', () => chart.resize());
}

async function loadGoalGauge() {
    const container = document.getElementById('goalGauge');
    if (!container) return;
    
    document.getElementById('setGoal')?.addEventListener('click', () => {
        const goal = parseFloat(document.getElementById('monthlyGoal')?.value || 0);
        if (goal > 0) { insightsData.goalAmount = goal; updateGoalGauge(); }
    });
    
    function updateGoalGauge() {
        // Dispose existing chart if any
        if (container._chartInstance) {
            container._chartInstance.dispose();
        }
        
        const chart = echarts.init(container);
        container._chartInstance = chart;
        const thisMonth = insightsData.bucketByYear[new Date().getFullYear()]?.values[new Date().getMonth()] || 0;
        const progress = insightsData.goalAmount > 0 ? (thisMonth / insightsData.goalAmount * 100) : 0;
        
        // Responsive configuration based on screen size
        const isSmall = window.innerWidth < 768;
        const isVerySmall = window.innerWidth < 480;
        
        const option = {
            series: [{
                type: 'gauge', 
                min: 0, 
                max: 100, 
                startAngle: 180, 
                endAngle: 0,
                radius: isVerySmall ? '65%' : isSmall ? '70%' : '75%',
                center: ['50%', isSmall ? '70%' : '65%'],
                axisLine: { 
                    lineStyle: { 
                        width: isVerySmall ? 10 : isSmall ? 12 : 15, 
                        color: [[0.3, '#ef4444'], [0.7, '#f59e0b'], [1, '#22c55e']] 
                    } 
                },
                pointer: { 
                    itemStyle: { color: '#3b82f6' },
                    width: isSmall ? 3 : 4,
                    length: isSmall ? '55%' : '60%'
                },
                axisTick: { show: false }, 
                axisLabel: { show: false }, 
                splitLine: { show: false },
                detail: { 
                    formatter: '{value}%', 
                    fontSize: isVerySmall ? 11 : isSmall ? 12 : 14, 
                    offsetCenter: [0, isSmall ? '35%' : '30%'],
                    color: '#374151',
                    fontWeight: 'bold'
                },
                title: { show: false }, // Hide the default title to prevent overlap
                data: [{ 
                    value: Math.min(progress, 100), 
                    name: '' // Remove the name to prevent overlap
                }]
            }]
        };
        
        try {
            chart.setOption(option);
            console.log('🔍 Goal gauge updated successfully');
        } catch (error) {
            console.error('❌ Error updating goal gauge:', error);
        }
        
        // Add responsive resize handler
        const resizeHandler = () => {
            if (chart && !chart.isDisposed()) {
                chart.resize();
                // Update responsive settings on resize
                const newIsSmall = window.innerWidth < 768;
                const newIsVerySmall = window.innerWidth < 480;
                if (newIsSmall !== isSmall || newIsVerySmall !== isVerySmall) {
                    updateGoalGauge(); // Re-render with new responsive settings
                }
            }
        };
        
        window.addEventListener('resize', resizeHandler);
    }
    updateGoalGauge();
}

async function loadHealthScore() {
    const yThis = new Date().getFullYear(); const thisYear = insightsData.bucketByYear[yThis]?.values || [];
    const lastYear = insightsData.bucketByYear[yThis-1]?.values || [];
    
    // Simple health score based on: growth, consistency, profitability
    const avgThisYear = thisYear.length > 0 ? thisYear.reduce((a,b)=>a+b,0) / thisYear.length : 0;
    const avgLastYear = lastYear.length > 0 ? lastYear.reduce((a,b)=>a+b,0) / lastYear.length : 0;
    const growth = avgLastYear > 0 ? (avgThisYear - avgLastYear) / avgLastYear : (avgThisYear > 0 ? 1 : 0);
    
    // Calculate consistency (lower variance = higher consistency)
    const maxValue = Math.max(...thisYear, 1);
    const minValue = Math.min(...thisYear.filter(v => v > 0), 0);
    const consistency = maxValue > 0 ? Math.max(0, 100 - ((maxValue - minValue) / maxValue * 100)) : 50;
    
    const profitability = 75; // Placeholder - would need purchase data analysis
    
    // Normalize growth for scoring (cap at +/-100%)
    const normalizedGrowth = Math.max(-1, Math.min(1, growth));
    const growthScore = (normalizedGrowth + 1) * 50; // Convert to 0-100 scale
    
    const score = Math.max(0, Math.min(100, (growthScore * 0.4 + consistency * 0.3 + profitability * 0.3)));
    
    const scoreEl = document.getElementById('scoreValue');
    const breakdownEl = document.getElementById('scoreBreakdown');
    
    if (scoreEl) {
        scoreEl.textContent = Math.round(score);
        scoreEl.style.color = score > 70 ? '#22c55e' : score > 40 ? '#f59e0b' : '#ef4444';
    }
    
    if (breakdownEl) {
        breakdownEl.innerHTML = `Growth: ${(growth*100).toFixed(1)}%<br/>Consistency: ${consistency.toFixed(1)}%<br/>Profitability: ${profitability}%`;
    }
}

async function loadCashFlowForecast() {
    const container = document.getElementById('cashFlowForecast');
    if (!container) {
        console.error('Cash flow forecast container not found');
        return;
    }
    
    // Dispose existing chart if any
    if (container._chartInstance) {
        container._chartInstance.dispose();
    }
    
    const chart = echarts.init(container);
    container._chartInstance = chart;
    
            try {
            const yThis = new Date().getFullYear();
            const salesThisYear = insightsData.bucketByYear[yThis]?.values || Array(12).fill(0);
            
            // Responsive configuration
            const isSmall = window.innerWidth < 768;
        
        // Calculate purchases by month for this year
        const purchasesByMonth = Array(12).fill(0);
        if (insightsData.purchases && Array.isArray(insightsData.purchases)) {
            insightsData.purchases.forEach(p => {
                const dateStr = p.purchase_date || p.date;
                if (dateStr) {
                    const d = new Date(dateStr);
                    if (!isNaN(d.getTime()) && d.getFullYear() === yThis) {
                        const month = d.getMonth();
                        const amount = parseFloat(p.total || 0) || 0;
                        if (month >= 0 && month < 12 && amount > 0) {
                            purchasesByMonth[month] += amount;
                        }
                    }
                }
            });
        }
        
        console.log('🔍 Cash Flow Debug: Sales by month:', salesThisYear);
        console.log('🔍 Cash Flow Debug: Purchases by month:', purchasesByMonth);
        
        // Calculate net cash flow for each month (Sales - Purchases)
        const netCashFlow = salesThisYear.map((sales, i) => sales - purchasesByMonth[i]);
        console.log('🔍 Cash Flow Debug: Net cash flow by month:', netCashFlow);
        
        // Calculate average monthly cash flow from available data
        const monthsWithData = netCashFlow.filter(cf => Math.abs(cf) > 0);
        const avgCashFlow = monthsWithData.length > 0 ? 
            monthsWithData.reduce((a,b) => a+b, 0) / monthsWithData.length : 
            10000; // Default positive cash flow
            
        // Calculate trend from last 6 months vs previous 6 months
        const recent6 = netCashFlow.slice(-6);
        const previous6 = netCashFlow.slice(-12, -6);
        
        const recentAvg = recent6.length > 0 ? recent6.reduce((a,b) => a+b, 0) / recent6.length : avgCashFlow;
        const previousAvg = previous6.length > 0 ? previous6.reduce((a,b) => a+b, 0) / previous6.length : avgCashFlow;
        
        // Conservative trend calculation (limit extreme changes)
        let trend = recentAvg - previousAvg;
        if (Math.abs(trend) > avgCashFlow * 0.1) { // Limit trend to 10% of average
            trend = trend > 0 ? avgCashFlow * 0.1 : -avgCashFlow * 0.1;
        }
        
        console.log('🔍 Cash Flow Debug: Average:', avgCashFlow, 'Trend:', trend);
        
        // Generate forecast for next 6 months
        const forecast = Array.from({length: 6}, (_, i) => {
            const projected = avgCashFlow + (trend * (i + 1));
            return Math.max(projected, -avgCashFlow * 2); // Don't go below -200% of average
        });
        
        console.log('🔍 Cash Flow Debug: Forecast:', forecast);
        
        const months = ['Next 1M', 'Next 2M', 'Next 3M', 'Next 4M', 'Next 5M', 'Next 6M'];
        
        // Determine colors based on positive/negative cash flow
        const colors = forecast.map(value => value >= 0 ? '#22c55e' : '#ef4444');
        
        const option = {
            tooltip: { 
                trigger: 'axis', 
                formatter: params => {
                    const value = params[0].value;
                    const status = value >= 0 ? '💰 Positive' : '⚠️ Negative';
                    return `${params[0].name}<br/>${status} Cash Flow<br/>₹${Number(value).toLocaleString('en-IN')}`;
                }
            },
            grid: { 
                left: isSmall ? 50 : 60, 
                right: isSmall ? 15 : 30, 
                top: isSmall ? 35 : 40, 
                bottom: isSmall ? 50 : 45 
            },
            xAxis: { 
                type: 'category', 
                data: months, 
                axisLabel: { 
                    fontSize: isSmall ? 8 : 9, 
                    rotate: isSmall ? 25 : 15,
                    interval: 0
                } 
            },
            yAxis: { 
                type: 'value', 
                axisLabel: { 
                    fontSize: isSmall ? 8 : 9, 
                    formatter: v => {
                        const absV = Math.abs(v);
                        return `₹${(absV/1000).toFixed(0)}K`;
                    }
                },
                splitLine: { show: true, lineStyle: { color: '#e5e7eb' } }
            },
            series: [{
                type: 'line',
                data: forecast,
                smooth: true,
                itemStyle: { 
                    color: params => colors[params.dataIndex] 
                },
                lineStyle: { 
                    width: 3, 
                    type: 'dashed',
                    color: params => {
                        // Use green if mostly positive, red if mostly negative
                        const positiveCount = forecast.filter(v => v >= 0).length;
                        return positiveCount >= 3 ? '#22c55e' : '#ef4444';
                    }
                },
                areaStyle: { 
                    opacity: 0.2,
                    color: params => {
                        const positiveCount = forecast.filter(v => v >= 0).length;
                        return positiveCount >= 3 ? '#22c55e' : '#ef4444';
                    }
                },
                markLine: {
                    data: [{ 
                        yAxis: 0, 
                        lineStyle: { color: '#6b7280', width: 1, type: 'dashed' },
                        label: {
                            formatter: 'Break-even',
                            position: 'insideStartTop',
                            fontSize: isSmall ? 8 : 10,
                            color: '#6b7280',
                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                            borderColor: '#6b7280',
                            borderWidth: 1,
                            borderRadius: 3,
                            padding: isSmall ? [1, 3] : [2, 4],
                            show: !isSmall || forecast.some(v => Math.abs(v) > 1000) // Hide on very small screens with small values
                        }
                    }],
                    silent: true
                }
            }]
        };
        
        chart.setOption(option);
        window.addEventListener('resize', () => chart.resize());
        
    } catch (error) {
        console.error('❌ Error in cash flow forecast:', error);
        container.innerHTML = '<p style="text-align:center;color:#ef4444;padding:2rem;">Error loading cash flow forecast</p>';
    }
}

async function loadRevenueForecast() {
    const container = document.getElementById('revenueForecast');
    if (!container) {
        console.error('Revenue forecast container not found');
        return;
    }
    
    // Dispose existing chart if any
    if (container._chartInstance) {
        container._chartInstance.dispose();
    }
    
    const chart = echarts.init(container);
    container._chartInstance = chart;
    
    const yThis = new Date().getFullYear(); 
    const yPrev = yThis - 1;
    const thisYear = insightsData.bucketByYear[yThis]?.values || [];
    const lastYear = insightsData.bucketByYear[yPrev]?.values || [];
    const currentMonth = new Date().getMonth();
    
    console.log('🔍 Revenue Forecast Debug: This year data:', thisYear);
    console.log('🔍 Revenue Forecast Debug: Last year data:', lastYear);
    console.log('🔍 Revenue Forecast Debug: Current month index:', currentMonth);
    
    // Calculate dynamic growth rate based on actual trends
    function calculateDynamicGrowthRate() {
        // Method 1: Recent trend (last 3 months)
        const recentMonths = thisYear.slice(-3).filter(v => v > 0);
        let recentTrend = 0;
        if (recentMonths.length >= 2) {
            const growthRates = [];
            for (let i = 1; i < recentMonths.length; i++) {
                if (recentMonths[i-1] > 0) {
                    growthRates.push((recentMonths[i] - recentMonths[i-1]) / recentMonths[i-1]);
                }
            }
            if (growthRates.length > 0) {
                recentTrend = growthRates.reduce((a,b) => a+b, 0) / growthRates.length;
            }
        }
        
        // Method 2: Year-over-year comparison for same months
        let yoyTrend = 0;
        const thisYearAvailable = thisYear.slice(0, currentMonth + 1).filter(v => v > 0);
        const lastYearSame = lastYear.slice(0, currentMonth + 1).filter(v => v > 0);
        if (thisYearAvailable.length > 0 && lastYearSame.length > 0) {
            const thisYearAvg = thisYearAvailable.reduce((a,b) => a+b, 0) / thisYearAvailable.length;
            const lastYearAvg = lastYearSame.reduce((a,b) => a+b, 0) / lastYearSame.length;
            if (lastYearAvg > 0) {
                yoyTrend = (thisYearAvg - lastYearAvg) / lastYearAvg / 12; // Convert annual to monthly
            }
        }
        
        // Method 3: Seasonal adjustment based on historical patterns
        const nextMonths = [];
        for (let i = 1; i <= 6; i++) {
            const targetMonth = (currentMonth + i) % 12;
            // Get historical data for this month across years
            const historicalForMonth = [];
            Object.values(insightsData.bucketByYear).forEach(yearData => {
                if (yearData.values && yearData.values[targetMonth] > 0) {
                    historicalForMonth.push(yearData.values[targetMonth]);
                }
            });
            nextMonths.push({
                month: targetMonth,
                historical: historicalForMonth.length > 0 ? 
                    historicalForMonth.reduce((a,b) => a+b, 0) / historicalForMonth.length : 0
            });
        }
        
        console.log('🔍 Growth Analysis: Recent trend:', (recentTrend * 100).toFixed(2) + '%');
        console.log('🔍 Growth Analysis: YoY trend:', (yoyTrend * 100).toFixed(2) + '%');
        console.log('🔍 Growth Analysis: Next months historical:', nextMonths);
        
        // Combine trends with weights
        const combinedTrend = (recentTrend * 0.5) + (yoyTrend * 0.3);
        
        // Cap growth rate between -10% and +20% per month
        const finalGrowth = Math.max(-0.10, Math.min(0.20, combinedTrend));
        
        return {
            growth: finalGrowth,
            recentTrend,
            yoyTrend,
            nextMonths
        };
    }
    
    const growthAnalysis = calculateDynamicGrowthRate();
    const dynamicGrowth = growthAnalysis.growth;
    
    // Calculate improved SMA with seasonal weighting
    const last3Months = thisYear.slice(-3);
    console.log('🔍 Revenue Forecast Debug: Last 3 months:', last3Months);
    
    let baseSMA = last3Months.reduce((a,b)=>a+b,0) / Math.max(last3Months.length, 1);
    
    // If SMA is too small or zero, use weighted average of all available data
    if (baseSMA <= 0) {
        const monthsWithData = thisYear.filter(v => v > 0);
        if (monthsWithData.length > 0) {
            // Weight recent months more heavily
            let weightedSum = 0;
            let totalWeight = 0;
            monthsWithData.forEach((value, index) => {
                const weight = index + 1; // Recent months get higher weight
                weightedSum += value * weight;
                totalWeight += weight;
            });
            baseSMA = totalWeight > 0 ? weightedSum / totalWeight : 50000;
        } else {
            baseSMA = 50000; // Fallback
        }
        console.log('🔍 Revenue Forecast Debug: Using weighted SMA:', baseSMA);
    }
    
    console.log('🔍 Revenue Forecast Debug: Base SMA:', baseSMA);
    console.log('🔍 Revenue Forecast Debug: Dynamic growth rate:', (dynamicGrowth * 100).toFixed(2) + '%');
    
    // Generate forecast with seasonal adjustments
    const forecast = [];
    const months = ['Next 1M', 'Next 2M', 'Next 3M', 'Next 4M', 'Next 5M', 'Next 6M'];
    
    for (let i = 0; i < 6; i++) {
        // Base forecast with compound growth
        let baseValue = baseSMA * Math.pow(1 + dynamicGrowth, i);
        
        // Apply seasonal adjustment if we have historical data
        const targetMonth = (currentMonth + i + 1) % 12;
        const seasonalData = growthAnalysis.nextMonths[i];
        
        if (seasonalData && seasonalData.historical > 0 && baseSMA > 0) {
            const seasonalMultiplier = seasonalData.historical / baseSMA;
            // Blend seasonal adjustment (30%) with trend forecast (70%)
            baseValue = (baseValue * 0.7) + (seasonalData.historical * 0.3);
        }
        
        // Ensure minimum value and add some randomness for realism
        const finalValue = Math.max(baseValue, 1000);
        forecast.push(finalValue);
    }
    
    console.log('🔍 Revenue Forecast Debug: Advanced forecast data:', forecast);
    console.log('🔍 Revenue Forecast Debug: Growth rate used:', (dynamicGrowth * 100).toFixed(2) + '% per month');
    
    const option = {
        tooltip: { 
            trigger: 'axis', 
            formatter: function(params) {
                if (!params || params.length === 0) return '';
                const param = params[0];
                const monthIndex = params[0].dataIndex;
                const growthFromBase = monthIndex === 0 ? 0 : 
                    ((param.value - forecast[0]) / forecast[0] * 100).toFixed(1);
                
                let tooltip = `<strong>${param.name}</strong><br/>`;
                tooltip += `💰 Projected Revenue: <strong>₹${Number(param.value || 0).toLocaleString('en-IN')}</strong><br/>`;
                
                if (monthIndex > 0) {
                    const monthGrowth = ((param.value - forecast[monthIndex - 1]) / forecast[monthIndex - 1] * 100).toFixed(1);
                    tooltip += `📈 Month Growth: <span style="color: ${monthGrowth >= 0 ? '#22c55e' : '#ef4444'}">${monthGrowth}%</span><br/>`;
                    tooltip += `📊 Total Growth: <span style="color: ${growthFromBase >= 0 ? '#22c55e' : '#ef4444'}">${growthFromBase}%</span><br/>`;
                }
                
                tooltip += `🤖 Based on: Dynamic trend analysis<br/>`;
                tooltip += `📅 Growth Rate: ${(dynamicGrowth * 100).toFixed(2)}%/month`;
                
                return tooltip;
            }
        },
        grid: { left: 50, right: 20, top: 20, bottom: 40 },
        xAxis: { type: 'category', data: months, axisLabel: { fontSize: 9 } },
        yAxis: { 
            type: 'value', 
            axisLabel: { 
                fontSize: 9, 
                formatter: function(v) {
                    return '₹' + ((v || 0)/1000).toFixed(0) + 'K';
                }
            }
        },
        series: [{ 
            type: 'bar', 
            data: forecast, 
            itemStyle: { color: '#10b981' },
            barWidth: '60%'
        }]
    };
    
    try {
        chart.setOption(option);
        console.log('🔍 Revenue Forecast chart set successfully');
    } catch (error) {
        console.error('❌ Error setting Revenue Forecast chart:', error);
        console.log('🔍 Chart option:', option);
    }
    
    window.addEventListener('resize', () => {
        if (chart && !chart.isDisposed()) {
            chart.resize();
        }
    });
}

async function setupInteractiveFilters() {
    const timeRange = document.getElementById('timeRangePicker');
    const customStart = document.getElementById('customStart');
    const customEnd = document.getElementById('customEnd');
    const compareMode = document.getElementById('compareMode');
    
    // Time range picker functionality
    timeRange?.addEventListener('change', (e) => {
        console.log('🔍 Time range changed:', e.target.value);
        if (e.target.value === 'custom') {
            customStart.style.display = 'inline-block';
            customEnd.style.display = 'inline-block';
        } else {
            customStart.style.display = 'none';
            customEnd.style.display = 'none';
            
            if (e.target.value === 'all') {
                // Clear any existing filter
                clearTimeRangeFilter();
            } else {
                // Apply the selected time range filter
                filterDataByTimeRange(e.target.value);
            }
        }
    });
    
    // Custom date range functionality
    const applyCustomRange = () => {
        if (customStart.value && customEnd.value) {
            console.log('🔍 Custom range:', customStart.value, 'to', customEnd.value);
            filterDataByCustomRange(customStart.value, customEnd.value);
        }
    };
    
    customStart?.addEventListener('change', applyCustomRange);
    customEnd?.addEventListener('change', applyCustomRange);
    
    // Compare Periods button functionality
    compareMode?.addEventListener('click', () => {
        const isActive = compareMode.classList.contains('active');
        compareMode.classList.toggle('active', !isActive);
        compareMode.textContent = isActive ? 'Compare Periods' : 'Exit Compare';
        console.log('🔍 Compare mode toggled:', !isActive);
        
        // Toggle YoY comparison when compare mode is activated
        const toggleYoy = document.getElementById('toggleYoy');
        if (toggleYoy) {
            toggleYoy.checked = !isActive;
            // Trigger the change event to refresh the chart
            toggleYoy.dispatchEvent(new Event('change'));
        }
    });
}

function filterDataByTimeRange(days) {
    console.log('🔍 Filtering data by', days, 'days');
    
    try {
        // Calculate the date range
        const now = new Date();
        const startDate = new Date(now);
        startDate.setDate(now.getDate() - parseInt(days));
        
        console.log('🔍 Date range:', startDate.toISOString().slice(0,10), 'to', now.toISOString().slice(0,10));
        
        // Filter sales data within the date range
        const filteredSales = insightsData.sales.filter(sale => {
            const saleDate = new Date(sale.sale_date || sale.date);
            return saleDate >= startDate && saleDate <= now;
        });
        
        console.log('🔍 Filtered sales:', filteredSales.length, 'out of', insightsData.sales.length);
        
        // Create filtered bucket data
        const filteredBucketByYear = {};
        const yThis = now.getFullYear();
        const yPrev = yThis - 1;
        
        const makeBuckets = () => ({ 
            values: Array(12).fill(0), 
            days: Array.from({length:12}, ()=>({}))
        });
        
        filteredBucketByYear[yThis] = makeBuckets();
        filteredBucketByYear[yPrev] = makeBuckets();
        
        // Process filtered sales
        filteredSales.forEach(s => {
            const d = new Date(s.sale_date || s.date);
            if (isNaN(d.getTime())) return;
            
            const y = d.getFullYear();
            const m = d.getMonth();
            
            if (!filteredBucketByYear[y]) {
                filteredBucketByYear[y] = makeBuckets();
            }
            
            const val = parseFloat(s.total || 0) || 0;
            if (val >= 0) {
                filteredBucketByYear[y].values[m] += val;
                const key = d.toISOString().slice(0,10);
                if (!filteredBucketByYear[y].days[m]) {
                    filteredBucketByYear[y].days[m] = {};
                }
                filteredBucketByYear[y].days[m][key] = (filteredBucketByYear[y].days[m][key] || 0) + val;
            }
        });
        
        // Temporarily replace the bucket data
        const originalBucketData = insightsData.bucketByYear;
        insightsData.bucketByYear = filteredBucketByYear;
        
        // Refresh the chart with filtered data
        refreshMainChart();
        
        // Store original data for restoration
        insightsData._originalBucketByYear = originalBucketData;
        insightsData._isFiltered = true;
        
        console.log('🔍 Time range filter applied:', days, 'days');
        
    } catch (error) {
        console.error('❌ Error filtering by time range:', error);
    }
}

function refreshMainChart() {
    const container = document.getElementById('insightsChart');
    const chart = container?._chartInstance;
    
    if (chart && !chart.isDisposed()) {
        try {
            // Get the refresh function from the chart's context
            const refreshFn = container._refreshFunction;
            if (typeof refreshFn === 'function') {
                refreshFn();
            } else {
                // Fallback: reload the main chart
                loadMainChart();
            }
        } catch (error) {
            console.error('❌ Error refreshing main chart:', error);
            // Fallback: reload the main chart
            loadMainChart();
        }
    }
}

function clearTimeRangeFilter() {
    console.log('🔍 Clearing time range filter');
    
    if (insightsData._isFiltered && insightsData._originalBucketByYear) {
        // Restore original data
        insightsData.bucketByYear = insightsData._originalBucketByYear;
        insightsData._isFiltered = false;
        delete insightsData._originalBucketByYear;
        
        // Reset dropdown to default
        const timeRange = document.getElementById('timeRangePicker');
        if (timeRange) {
            timeRange.value = '365'; // Default to last year
        }
        
        // Refresh chart with original data
        refreshMainChart();
        
        console.log('🔍 Filter cleared, original data restored');
    }
}

function filterDataByCustomRange(startDateStr, endDateStr) {
    console.log('🔍 Filtering data from', startDateStr, 'to', endDateStr);
    
    try {
        const startDate = new Date(startDateStr);
        const endDate = new Date(endDateStr);
        
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            console.error('❌ Invalid date range');
            return;
        }
        
        // Filter sales data within the custom date range
        const filteredSales = insightsData.sales.filter(sale => {
            const saleDate = new Date(sale.sale_date || sale.date);
            return saleDate >= startDate && saleDate <= endDate;
        });
        
        console.log('🔍 Filtered sales:', filteredSales.length, 'out of', insightsData.sales.length);
        
        // Create filtered bucket data
        const filteredBucketByYear = {};
        const makeBuckets = () => ({ 
            values: Array(12).fill(0), 
            days: Array.from({length:12}, ()=>({}))
        });
        
        // Initialize years that might be in the range
        for (let year = startDate.getFullYear(); year <= endDate.getFullYear(); year++) {
            filteredBucketByYear[year] = makeBuckets();
        }
        
        // Process filtered sales
        filteredSales.forEach(s => {
            const d = new Date(s.sale_date || s.date);
            if (isNaN(d.getTime())) return;
            
            const y = d.getFullYear();
            const m = d.getMonth();
            
            if (!filteredBucketByYear[y]) {
                filteredBucketByYear[y] = makeBuckets();
            }
            
            const val = parseFloat(s.total || 0) || 0;
            if (val >= 0) {
                filteredBucketByYear[y].values[m] += val;
                const key = d.toISOString().slice(0,10);
                if (!filteredBucketByYear[y].days[m]) {
                    filteredBucketByYear[y].days[m] = {};
                }
                filteredBucketByYear[y].days[m][key] = (filteredBucketByYear[y].days[m][key] || 0) + val;
            }
        });
        
        // Store original data and apply filter
        const originalBucketData = insightsData.bucketByYear;
        insightsData.bucketByYear = filteredBucketByYear;
        
        // Refresh the chart
        refreshMainChart();
        
        // Store original data for restoration
        insightsData._originalBucketByYear = originalBucketData;
        insightsData._isFiltered = true;
        
        console.log('🔍 Custom range filter applied');
        
    } catch (error) {
        console.error('❌ Error filtering by custom range:', error);
    }
}

function testInteractiveElements() {
    console.log('🧪 Testing Interactive Elements:');
    
    const elements = [
        { id: 'toggleYoy', name: 'YoY Compare checkbox' },
        { id: 'toggleSma', name: 'Forecast checkbox' },
        { id: 'whatIfGrowth', name: 'What-if input' },
        { id: 'applyWhatIf', name: 'What-if button' },
        { id: 'compareMode', name: 'Compare Periods button' },
        { id: 'timeRangePicker', name: 'Time Range dropdown' }
    ];
    
    elements.forEach(element => {
        const el = document.getElementById(element.id);
        if (el) {
            console.log(`✅ ${element.name}: Found`);
        } else {
            console.error(`❌ ${element.name}: NOT FOUND`);
        }
    });
    
    // Test if checkboxes can be programmatically changed
    const toggleYoy = document.getElementById('toggleYoy');
    if (toggleYoy) {
        console.log('🧪 Testing YoY checkbox programmatically...');
        toggleYoy.checked = true;
        toggleYoy.dispatchEvent(new Event('change'));
        setTimeout(() => {
            toggleYoy.checked = false;
            toggleYoy.dispatchEvent(new Event('change'));
        }, 2000);
    }
}

function updateInsightsTable(isoDates, sales, purchases) {
    try {
        const el = document.getElementById('insightsSelectionTable');
        if (!el) return;
        if (!isoDates || isoDates.length === 0) { el.innerHTML = '<p style="text-align:center;color:#666;padding:1rem;">Select a range on the chart to filter...</p>'; return; }
        const set = new Set(isoDates);
        const selected = [
            ...sales.filter(s => set.has((s.sale_date||s.date||'').slice(0,10))).map(s => ({date: s.sale_date||s.date, type:'Sale', contact:s.customer, description:s.description, total:s.total})),
            ...purchases.filter(p => set.has((p.purchase_date||p.date||'').slice(0,10))).map(p => ({date: p.purchase_date||p.date, type:'Purchase', contact:p.supplier, description:p.description, total:p.total})),
        ].sort((a,b)=> new Date(a.date) - new Date(b.date));
        if (selected.length === 0) { el.innerHTML = '<p style="text-align:center;color:#666;padding:1rem;">No transactions in selection</p>'; return; }
        const rows = selected.map(r => `<tr><td style="padding:8px;border:1px solid #e5e7eb;">${r.date}</td><td style="padding:8px;border:1px solid #e5e7eb;">${r.type}</td><td style="padding:8px;border:1px solid #e5e7eb;">${r.contact||''}</td><td style="padding:8px;border:1px solid #e5e7eb;">${r.description||''}</td><td style="padding:8px;border:1px solid #e5e7eb;text-align:right;">₹${Number(r.total||0).toLocaleString('en-IN')}</td></tr>`).join('');
        el.innerHTML = `<div class="table-responsive"><table style="width:100%;border-collapse:collapse;"><thead><tr style="background:#f3f4f6"><th style="padding:8px;border:1px solid #e5e7eb;">Date</th><th style="padding:8px;border:1px solid #e5e7eb;">Type</th><th style="padding:8px;border:1px solid #e5e7eb;">Contact</th><th style="padding:8px;border:1px solid #e5e7eb;">Description</th><th style="padding:8px;border:1px solid #e5e7eb;text-align:right;">Amount</th></tr></thead><tbody>${rows}</tbody></table></div>`;
    } catch (e) { console.error('updateInsightsTable error', e); }
}

