// Check authentication on page load
document.addEventListener('DOMContentLoaded', function() {
    checkAuthentication();
    initializeAdmin();
    setupFormHandlers();
    populateYearOptions();
    setDefaultDates();
    
    // Load dashboard with a small delay to ensure Chart.js is fully loaded
    setTimeout(function() {
        loadDashboard();
        updateDataCountInfo();
        setSalesDefaults(); // Set default values for sales form
        setPurchaseDefaults(); // Set default values for purchase form
    }, 100);
});

// Authentication check
function checkAuthentication() {
    const isLoggedIn = localStorage.getItem('isAdminLoggedIn');
    const username = localStorage.getItem('adminUsername');
    
    if (!isLoggedIn || isLoggedIn !== 'true') {
        alert('Access denied. Please login first.');
        window.location.href = '/';
        return;
    }
    
    document.getElementById('adminName').textContent = username || 'Admin';
}

// Logout function
function logout() {
    localStorage.removeItem('isAdminLoggedIn');
    localStorage.removeItem('adminUsername');
    alert('Logged out successfully!');
    window.location.href = '/';
}

// Initialize admin dashboard
function initializeAdmin() {
    // Initialize data if not exists
    if (!localStorage.getItem('salesData')) {
        localStorage.setItem('salesData', JSON.stringify([]));
    }
    if (!localStorage.getItem('purchaseData')) {
        localStorage.setItem('purchaseData', JSON.stringify([]));
    }
}

// Navigation between sections
function showSection(sectionName) {
    // Hide all sections
    const sections = document.querySelectorAll('.admin-section');
    sections.forEach(section => {
        section.classList.remove('active');
    });
    
    // Remove active class from all nav buttons
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected section
    document.getElementById(sectionName).classList.add('active');
    
    // Add active class to clicked button
    event.target.classList.add('active');
    
    // Load section-specific data
    if (sectionName === 'dashboard') {
        loadDashboard();
    } else if (sectionName === 'sales') {
        setSalesDefaults(); // Set default values when navigating to sales section
    } else if (sectionName === 'purchase') {
        setPurchaseDefaults(); // Set default values when navigating to purchase section
    } else if (sectionName === 'reports') {
        updateDataCountInfo();
        generateReport();
    }
}

// Setup form handlers
function setupFormHandlers() {
    // Sales form handler
    document.getElementById('salesForm').addEventListener('submit', function(e) {
        e.preventDefault();
        addSale();
    });
    
    // Purchase form handler
    document.getElementById('purchaseForm').addEventListener('submit', function(e) {
        e.preventDefault();
        addPurchase();
    });
    
    // Edit transaction form handler
    document.getElementById('editTransactionForm').addEventListener('submit', function(e) {
        e.preventDefault();
        updateTransaction();
    });
    
    // Edit modal close handlers
    document.getElementById('editModalClose').addEventListener('click', closeEditModal);
    window.addEventListener('click', function(e) {
        const editModal = document.getElementById('editModal');
        if (e.target === editModal) {
            closeEditModal();
        }
    });
}

// Auto-calculation removed - Users now enter total amounts directly

// Set default dates to today
function setDefaultDates() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('saleDate').value = today;
    document.getElementById('purchaseDate').value = today;
}

// Set default values for sales form
function setSalesDefaults() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('saleDate').value = today;
    document.getElementById('customerName').value = 'All Customers';
    document.getElementById('saleCategory').value = 'bike-parts';
    document.getElementById('saleDescription').value = 'Todays total sale including everything';
    document.getElementById('paymentMethod').value = 'Cash & Online Both';
}

// Set default values for purchase form
function setPurchaseDefaults() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('purchaseDate').value = today;
    document.getElementById('supplierName').value = 'Lakhan Autoparts';
    document.getElementById('purchaseCategory').value = 'bike-parts';
    document.getElementById('purchaseDescription').value = 'Purchased this/these items today';
}

// Add new sale
function addSale() {
    // Validate required fields
    const total = parseFloat(document.getElementById('saleTotal').value);
    if (!total || total <= 0) {
        showNotification('Please enter a valid total amount!', 'error');
        return;
    }
    
    const saleData = {
        id: Date.now(),
        date: document.getElementById('saleDate').value,
        customer: document.getElementById('customerName').value,
        category: document.getElementById('saleCategory').value,
        description: document.getElementById('saleDescription').value,
        total: total,
        paymentMethod: document.getElementById('paymentMethod').value,
        notes: document.getElementById('saleNotes').value,
        timestamp: new Date().toISOString()
    };
    
    console.log('Adding sale data:', saleData); // Debug log
    
    // Get existing sales data
    const existingSales = JSON.parse(localStorage.getItem('salesData') || '[]');
    existingSales.push(saleData);
    
    // Save to localStorage
    localStorage.setItem('salesData', JSON.stringify(existingSales));
    console.log('Saved to localStorage - Total sales records:', existingSales.length);
    
    // Reset form
    document.getElementById('salesForm').reset();
    setSalesDefaults(); // Reset with default values
    
    // Show success message
    showNotification('Sale added successfully!', 'success');
    
    // Always refresh dashboard data (will update when user navigates to dashboard)
    loadDashboard();
}

// Add new purchase
function addPurchase() {
    // Validate required fields  
    const total = parseFloat(document.getElementById('purchaseTotal').value);
    if (!total || total <= 0) {
        showNotification('Please enter a valid total cost!', 'error');
        return;
    }
    
    const purchaseData = {
        id: Date.now(),
        date: document.getElementById('purchaseDate').value,
        supplier: document.getElementById('supplierName').value,
        category: document.getElementById('purchaseCategory').value,
        description: document.getElementById('purchaseDescription').value,
        total: total,
        invoiceNumber: document.getElementById('invoiceNumber').value,
        notes: document.getElementById('purchaseNotes').value,
        timestamp: new Date().toISOString()
    };
    
    console.log('Adding purchase data:', purchaseData); // Debug log
    
    // Get existing purchase data
    const existingPurchases = JSON.parse(localStorage.getItem('purchaseData') || '[]');
    existingPurchases.push(purchaseData);
    
    // Save to localStorage
    localStorage.setItem('purchaseData', JSON.stringify(existingPurchases));
    console.log('Saved to localStorage - Total purchase records:', existingPurchases.length);
    
    // Reset form
    document.getElementById('purchaseForm').reset();
    setPurchaseDefaults(); // Reset with default values
    
    // Show success message
    showNotification('Purchase added successfully!', 'success');
    
    // Always refresh dashboard data (will update when user navigates to dashboard)
    loadDashboard();
    updateDataCountInfo();
}

// Load dashboard data
function loadDashboard() {
    const salesData = JSON.parse(localStorage.getItem('salesData') || '[]');
    const purchaseData = JSON.parse(localStorage.getItem('purchaseData') || '[]');
    
    console.log('Loading dashboard - Sales data:', salesData.length, 'items');
    console.log('Loading dashboard - Purchase data:', purchaseData.length, 'items');
    
    // Calculate totals
    const totalSales = salesData.reduce((sum, sale) => sum + sale.total, 0);
    const totalPurchases = purchaseData.reduce((sum, purchase) => sum + purchase.total, 0);
    const netProfit = totalSales - totalPurchases;
    
    console.log('Dashboard totals - Sales:', totalSales, 'Purchases:', totalPurchases, 'Profit:', netProfit);
    
    // Calculate today's sales
    const today = new Date().toISOString().split('T')[0];
    const todaySales = salesData
        .filter(sale => sale.date === today)
        .reduce((sum, sale) => sum + sale.total, 0);
    
    // Update dashboard stats
    document.getElementById('totalSales').textContent = `₹${totalSales.toLocaleString('en-IN')}`;
    document.getElementById('totalPurchases').textContent = `₹${totalPurchases.toLocaleString('en-IN')}`;
    document.getElementById('netProfit').textContent = `₹${netProfit.toLocaleString('en-IN')}`;
    document.getElementById('todaySales').textContent = `₹${todaySales.toLocaleString('en-IN')}`;
    
    // Load quick chart (with error handling)
    try {
        loadQuickChart();
    } catch (error) {
        console.error('Error loading quick chart:', error);
        // Show fallback message
        const chartContainer = document.getElementById('quickChart').parentElement;
        if (chartContainer) {
            chartContainer.innerHTML = '<p style="text-align: center; color: #666; padding: 2rem;">Chart loading failed. Data totals are shown above.</p>';
        }
    }
    
    // Load recent transactions
    loadRecentTransactions();
}

// Load quick chart for dashboard
function loadQuickChart() {
    // Check if Chart.js is loaded
    if (typeof Chart === 'undefined') {
        console.error('Chart.js library not loaded');
        return;
    }
    
    const ctx = document.getElementById('quickChart').getContext('2d');
    const salesData = JSON.parse(localStorage.getItem('salesData') || '[]');
    const purchaseData = JSON.parse(localStorage.getItem('purchaseData') || '[]');
    
    // Group data by month
    const monthlyData = {};
    
    // Process sales data
    salesData.forEach(sale => {
        const month = sale.date.substring(0, 7); // YYYY-MM format
        if (!monthlyData[month]) {
            monthlyData[month] = { sales: 0, purchases: 0 };
        }
        monthlyData[month].sales += sale.total;
    });
    
    // Process purchase data
    purchaseData.forEach(purchase => {
        const month = purchase.date.substring(0, 7);
        if (!monthlyData[month]) {
            monthlyData[month] = { sales: 0, purchases: 0 };
        }
        monthlyData[month].purchases += purchase.total;
    });
    
    // Sort months and get last 6 months
    const sortedMonths = Object.keys(monthlyData).sort().slice(-6);
    const labels = sortedMonths.map(month => {
        const [year, monthNum] = month.split('-');
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${monthNames[parseInt(monthNum) - 1]} ${year}`;
    });
    
    const salesValues = sortedMonths.map(month => monthlyData[month].sales);
    const purchaseValues = sortedMonths.map(month => monthlyData[month].purchases);
    
    // Destroy existing chart if it exists
    if (window.quickChart && typeof window.quickChart.destroy === 'function') {
        window.quickChart.destroy();
    }
    
    window.quickChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Sales',
                data: salesValues,
                borderColor: '#4f46e5',
                backgroundColor: 'rgba(79, 70, 229, 0.1)',
                borderWidth: 3,
                pointBackgroundColor: '#4f46e5',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 6,
                pointHoverRadius: 8,
                tension: 0.4,
                fill: true
            }, {
                label: 'Purchases',
                data: purchaseValues,
                borderColor: '#ef4444',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                borderWidth: 3,
                pointBackgroundColor: '#ef4444',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 6,
                pointHoverRadius: 8,
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 20,
                        font: {
                            size: 14,
                            weight: '600'
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#ffffff',
                    bodyColor: '#ffffff',
                    cornerRadius: 8,
                    padding: 12,
                    displayColors: false,
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ₹' + context.parsed.y.toLocaleString('en-IN');
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)',
                        drawBorder: false
                    },
                    ticks: {
                        font: {
                            size: 12,
                            weight: '500'
                        },
                        color: '#6b7280'
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)',
                        drawBorder: false
                    },
                    ticks: {
                        font: {
                            size: 12,
                            weight: '500'
                        },
                        color: '#6b7280',
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

// Load recent transactions
function loadRecentTransactions() {
    const salesData = JSON.parse(localStorage.getItem('salesData') || '[]');
    const purchaseData = JSON.parse(localStorage.getItem('purchaseData') || '[]');
    
    // Combine and sort by timestamp
    const allTransactions = [
        ...salesData.map(sale => ({ ...sale, type: 'sale' })),
        ...purchaseData.map(purchase => ({ ...purchase, type: 'purchase' }))
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 10);
    
    const container = document.getElementById('recentTransactions');
    
    if (allTransactions.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666; padding: 2rem;">No transactions yet</p>';
        return;
    }
    
    const html = allTransactions.map((transaction, index) => {
        const typeIcon = transaction.type === 'sale' ? 'fa-trending-up' : 'fa-trending-down';
        const amount = transaction.total || transaction.cost;
        const bgColor = index % 2 === 0 ? '#ffffff' : '#f9fafb';
        
        return `
            <div style="
                display: flex; 
                justify-content: space-between; 
                align-items: center; 
                padding: 1rem; 
                border-bottom: 1px solid #e5e7eb;
                background: ${bgColor};
                transition: all 0.2s ease;
                border-radius: 8px;
                margin-bottom: 0.5rem;
            " onmouseover="this.style.background='#f3f4f6'; this.style.transform='translateX(4px)'" onmouseout="this.style.background='${bgColor}'; this.style.transform='translateX(0)'">
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <div style="
                        background: ${transaction.type === 'sale' ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #f59e0b, #d97706)'};
                        color: white;
                        width: 40px;
                        height: 40px;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    ">
                        <i class="fas ${typeIcon}" style="font-size: 14px;"></i>
                    </div>
                    <div>
                        <div style="font-weight: 600; color: #374151; margin-bottom: 0.2rem;">${transaction.description}</div>
                        <div style="color: #6b7280; font-size: 12px;">
                            ${new Date(transaction.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} • ${transaction.customer || transaction.supplier}
                        </div>
                    </div>
                </div>
                <div style="text-align: right; display: flex; flex-direction: column; align-items: flex-end; gap: 0.5rem;">
                    <div style="
                        font-weight: 700; 
                        color: ${transaction.type === 'sale' ? '#10b981' : '#f59e0b'}; 
                        font-size: 16px;
                    ">₹${amount.toLocaleString('en-IN')}</div>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <div style="
                            font-size: 11px; 
                            color: white;
                            background: ${transaction.type === 'sale' ? '#10b981' : '#f59e0b'};
                            padding: 0.2rem 0.6rem;
                            border-radius: 12px;
                            text-transform: uppercase;
                            font-weight: 600;
                            letter-spacing: 0.5px;
                        ">${transaction.type}</div>
                        <button onclick="editTransaction('${transaction.id}', '${transaction.type}')" style="
                            background: #4f46e5;
                            color: white;
                            border: none;
                            padding: 0.3rem 0.5rem;
                            border-radius: 6px;
                            cursor: pointer;
                            font-size: 11px;
                            transition: all 0.2s ease;
                            margin-right: 0.3rem;
                        " onmouseover="this.style.background='#4338ca'" onmouseout="this.style.background='#4f46e5'" title="Edit Transaction">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="deleteTransaction('${transaction.id}', '${transaction.type}')" style="
                            background: #ef4444;
                            color: white;
                            border: none;
                            padding: 0.3rem 0.5rem;
                            border-radius: 6px;
                            cursor: pointer;
                            font-size: 11px;
                            transition: all 0.2s ease;
                        " onmouseover="this.style.background='#dc2626'" onmouseout="this.style.background='#ef4444'" title="Delete Transaction">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = html;
}

// Generate reports
function generateReport() {
    const reportType = document.getElementById('reportType').value;
    const reportMonth = document.getElementById('reportMonth').value;
    const reportYear = document.getElementById('reportYear').value;
    
    const salesData = JSON.parse(localStorage.getItem('salesData') || '[]');
    const purchaseData = JSON.parse(localStorage.getItem('purchaseData') || '[]');
    
    // Filter data based on selected filters
    let filteredSales = salesData;
    let filteredPurchases = purchaseData;
    
    if (reportMonth || reportYear) {
        filteredSales = salesData.filter(sale => {
            const saleDate = new Date(sale.date);
            const monthMatch = !reportMonth || (saleDate.getMonth() + 1).toString().padStart(2, '0') === reportMonth;
            const yearMatch = !reportYear || saleDate.getFullYear().toString() === reportYear;
            return monthMatch && yearMatch;
        });
        
        filteredPurchases = purchaseData.filter(purchase => {
            const purchaseDate = new Date(purchase.date);
            const monthMatch = !reportMonth || (purchaseDate.getMonth() + 1).toString().padStart(2, '0') === reportMonth;
            const yearMatch = !reportYear || purchaseDate.getFullYear().toString() === reportYear;
            return monthMatch && yearMatch;
        });
    }
    
    // Generate chart
    generateReportChart(filteredSales, filteredPurchases, reportType);
    
    // Generate table
    generateReportTable(filteredSales, filteredPurchases, reportType);
}

// Generate report chart
function generateReportChart(salesData, purchaseData, reportType) {
    // Check if Chart.js is loaded
    if (typeof Chart === 'undefined') {
        console.error('Chart.js library not loaded');
        return;
    }
    
    const ctx = document.getElementById('reportChart').getContext('2d');
    
    // Group data by date
    const dateData = {};
    
    if (reportType === 'both' || reportType === 'sales') {
        salesData.forEach(sale => {
            if (!dateData[sale.date]) {
                dateData[sale.date] = { sales: 0, purchases: 0 };
            }
            dateData[sale.date].sales += sale.total;
        });
    }
    
    if (reportType === 'both' || reportType === 'purchases') {
        purchaseData.forEach(purchase => {
            if (!dateData[purchase.date]) {
                dateData[purchase.date] = { sales: 0, purchases: 0 };
            }
            dateData[purchase.date].purchases += purchase.total;
        });
    }
    
    const sortedDates = Object.keys(dateData).sort();
    const datasets = [];
    
    if (reportType === 'both' || reportType === 'sales') {
        datasets.push({
            label: 'Sales',
            data: sortedDates.map(date => dateData[date].sales),
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            borderWidth: 3,
            pointBackgroundColor: '#10b981',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 3,
            pointRadius: 7,
            pointHoverRadius: 10,
            tension: 0.4,
            fill: true
        });
    }
    
    if (reportType === 'both' || reportType === 'purchases') {
        datasets.push({
            label: 'Purchases',
            data: sortedDates.map(date => dateData[date].purchases),
            borderColor: '#f59e0b',
            backgroundColor: 'rgba(245, 158, 11, 0.15)',
            borderWidth: 3,
            pointBackgroundColor: '#f59e0b',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 3,
            pointRadius: 7,
            pointHoverRadius: 10,
            tension: 0.4,
            fill: true
        });
    }
    
    // Destroy existing chart
    if (window.reportChart && typeof window.reportChart.destroy === 'function') {
        window.reportChart.destroy();
    }
    
    window.reportChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: sortedDates,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 25,
                        font: {
                            size: 16,
                            weight: '600'
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(17, 24, 39, 0.95)',
                    titleColor: '#ffffff',
                    bodyColor: '#ffffff',
                    cornerRadius: 12,
                    padding: 16,
                    displayColors: true,
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: 1,
                    callbacks: {
                        title: function(context) {
                            return 'Date: ' + context[0].label;
                        },
                        label: function(context) {
                            return context.dataset.label + ': ₹' + context.parsed.y.toLocaleString('en-IN');
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        color: 'rgba(156, 163, 175, 0.2)',
                        drawBorder: false
                    },
                    ticks: {
                        font: {
                            size: 13,
                            weight: '500'
                        },
                        color: '#6b7280',
                        maxRotation: 45
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(156, 163, 175, 0.2)',
                        drawBorder: false
                    },
                    ticks: {
                        font: {
                            size: 13,
                            weight: '500'
                        },
                        color: '#6b7280',
                        callback: function(value) {
                            return '₹' + value.toLocaleString('en-IN');
                        }
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            },
            elements: {
                point: {
                    hoverBackgroundColor: '#ffffff'
                }
            }
        }
    });
}

// Generate report table
function generateReportTable(salesData, purchaseData, reportType) {
    const container = document.getElementById('reportTable');
    
    let allData = [];
    
    if (reportType === 'both' || reportType === 'sales') {
        allData = allData.concat(salesData.map(sale => ({ ...sale, type: 'Sale' })));
    }
    
    if (reportType === 'both' || reportType === 'purchases') {
        allData = allData.concat(purchaseData.map(purchase => ({ ...purchase, type: 'Purchase' })));
    }
    
    if (allData.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666; padding: 2rem;">No data found for selected filters</p>';
        return;
    }
    
    // Sort by date
    allData.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    const tableHTML = `
        <div style="overflow-x: auto; border-radius: 12px; border: 1px solid #e5e7eb;">
            <table style="width: 100%; border-collapse: separate; border-spacing: 0; font-size: 14px;">
                <thead>
                    <tr style="background: linear-gradient(135deg, #f8fafc, #f1f5f9);">
                        <th style="padding: 1.2rem 1rem; text-align: left; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">📅 Date</th>
                        <th style="padding: 1.2rem 1rem; text-align: left; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">📋 Type</th>
                        <th style="padding: 1.2rem 1rem; text-align: left; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">📝 Description</th>
                        <th style="padding: 1.2rem 1rem; text-align: left; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">👤 Contact</th>
                        <th style="padding: 1.2rem 1rem; text-align: right; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">💰 Amount</th>
                        <th style="padding: 1.2rem 1rem; text-align: center; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">⚙️ Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${allData.map((item, index) => `
                        <tr style="background: ${index % 2 === 0 ? '#ffffff' : '#f9fafb'}; transition: all 0.2s ease;" onmouseover="this.style.background='#f3f4f6'" onmouseout="this.style.background='${index % 2 === 0 ? '#ffffff' : '#f9fafb'}'">
                            <td style="padding: 1rem; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-weight: 500;">${new Date(item.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                            <td style="padding: 1rem; border-bottom: 1px solid #e5e7eb;">
                                <span style="
                                    background: ${item.type === 'Sale' ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #f59e0b, #d97706)'}; 
                                    color: white; 
                                    padding: 0.4rem 0.8rem; 
                                    border-radius: 20px; 
                                    font-size: 12px; 
                                    font-weight: 600;
                                    text-transform: uppercase;
                                    letter-spacing: 0.5px;
                                ">${item.type}</span>
                            </td>
                            <td style="padding: 1rem; border-bottom: 1px solid #e5e7eb; color: #374151; font-weight: 500;">${item.description}</td>
                            <td style="padding: 1rem; border-bottom: 1px solid #e5e7eb; color: #6b7280;">${item.customer || item.supplier}</td>
                            <td style="padding: 1rem; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 700; color: ${item.type === 'Sale' ? '#10b981' : '#f59e0b'}; font-size: 15px;">₹${item.total.toLocaleString('en-IN')}</td>
                            <td style="padding: 1rem; border-bottom: 1px solid #e5e7eb; text-align: center;">
                                <button onclick="editTransaction('${item.id}', '${item.type.toLowerCase()}')" style="
                                    background: #4f46e5;
                                    color: white;
                                    border: none;
                                    padding: 0.5rem 0.8rem;
                                    border-radius: 8px;
                                    cursor: pointer;
                                    font-size: 12px;
                                    font-weight: 600;
                                    transition: all 0.2s ease;
                                    margin-right: 0.5rem;
                                " onmouseover="this.style.background='#4338ca'" onmouseout="this.style.background='#4f46e5'" title="Edit Transaction">
                                    <i class="fas fa-edit"></i> Edit
                                </button>
                                <button onclick="deleteTransaction('${item.id}', '${item.type.toLowerCase()}')" style="
                                    background: #ef4444;
                                    color: white;
                                    border: none;
                                    padding: 0.5rem 0.8rem;
                                    border-radius: 8px;
                                    cursor: pointer;
                                    font-size: 12px;
                                    font-weight: 600;
                                    transition: all 0.2s ease;
                                " onmouseover="this.style.background='#dc2626'" onmouseout="this.style.background='#ef4444'" title="Delete Transaction">
                                    <i class="fas fa-trash"></i> Delete
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
    
    container.innerHTML = tableHTML;
}

// Populate year options
function populateYearOptions() {
    const yearSelect = document.getElementById('reportYear');
    const currentYear = new Date().getFullYear();
    
    for (let year = currentYear; year >= currentYear - 10; year--) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearSelect.appendChild(option);
    }
}

// Export data function (JSON format)
function exportData() {
    const salesData = JSON.parse(localStorage.getItem('salesData') || '[]');
    const purchaseData = JSON.parse(localStorage.getItem('purchaseData') || '[]');
    
    const exportData = {
        sales: salesData,
        purchases: purchaseData,
        exportDate: new Date().toISOString(),
        shopName: 'Khan Automobiles'
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `khan-automobiles-data-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    showNotification('JSON data exported successfully!', 'success');
}

// Export to Excel with separate sheets
function exportToExcel() {
    try {
        // Check if XLSX library is loaded
        if (typeof XLSX === 'undefined') {
            showNotification('Excel export library not loaded. Please refresh the page.', 'error');
            return;
        }

        const salesData = JSON.parse(localStorage.getItem('salesData') || '[]');
        const purchaseData = JSON.parse(localStorage.getItem('purchaseData') || '[]');
        
        if (salesData.length === 0 && purchaseData.length === 0) {
            showNotification('No data to export. Please add some sales or purchases first.', 'error');
            return;
        }

        // Show export preview
        const exportInfo = `Exporting to Excel:\n\n📊 Sales: ${salesData.length} records\n📊 Purchases: ${purchaseData.length} records\n📊 Summary: Key metrics\n\nFile will contain 3 sheets and be saved as:\nKhan-Automobiles-Report-${new Date().toISOString().split('T')[0]}.xlsx`;
        
        if (!confirm(exportInfo + '\n\nProceed with export?')) {
            return;
        }

        // Format sales data for Excel
        const salesFormatted = salesData.map(sale => ({
            'Date': formatDateForExcel(sale.date),
            'Customer': sale.customer || '',
            'Category': sale.category || '',
            'Description': sale.description || '',
            'Payment Method': sale.paymentMethod || '',
            'Amount (₹)': sale.total || 0,
            'Notes': sale.notes || ''
        }));

        // Format purchase data for Excel
        const purchasesFormatted = purchaseData.map(purchase => ({
            'Date': formatDateForExcel(purchase.date),
            'Supplier': purchase.supplier || '',
            'Category': purchase.category || '',
            'Description': purchase.description || '',
            'Invoice Number': purchase.invoiceNumber || '',
            'Amount (₹)': purchase.total || 0,
            'Notes': purchase.notes || ''
        }));

        // Create workbook
        const wb = XLSX.utils.book_new();
        
        // Add Sales sheet
        if (salesFormatted.length > 0) {
            const wsSales = XLSX.utils.json_to_sheet(salesFormatted);
            
            // Set column widths
            wsSales['!cols'] = [
                { wch: 12 }, // Date
                { wch: 20 }, // Customer
                { wch: 15 }, // Category
                { wch: 30 }, // Description
                { wch: 15 }, // Payment Method
                { wch: 12 }, // Amount
                { wch: 25 }  // Notes
            ];
            
            XLSX.utils.book_append_sheet(wb, wsSales, 'Sales');
        }
        
        // Add Purchases sheet
        if (purchasesFormatted.length > 0) {
            const wsPurchases = XLSX.utils.json_to_sheet(purchasesFormatted);
            
            // Set column widths
            wsPurchases['!cols'] = [
                { wch: 12 }, // Date
                { wch: 20 }, // Supplier
                { wch: 15 }, // Category
                { wch: 30 }, // Description
                { wch: 15 }, // Invoice Number
                { wch: 12 }, // Amount
                { wch: 25 }  // Notes
            ];
            
            XLSX.utils.book_append_sheet(wb, wsPurchases, 'Purchases');
        }

        // Add Summary sheet
        const summaryData = calculateSummaryData(salesData, purchaseData);
        const wsSummary = XLSX.utils.json_to_sheet(summaryData);
        wsSummary['!cols'] = [{ wch: 25 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

        // Generate filename
        const filename = `Khan-Automobiles-Report-${new Date().toISOString().split('T')[0]}.xlsx`;
        
        // Save file
        XLSX.writeFile(wb, filename);
        
        const sheetsInfo = [];
        if (salesData.length > 0) sheetsInfo.push(`Sales (${salesData.length})`);
        if (purchaseData.length > 0) sheetsInfo.push(`Purchases (${purchaseData.length})`);
        sheetsInfo.push('Summary');
        
        showNotification(`Excel file exported successfully!\n📊 Sheets: ${sheetsInfo.join(', ')}\n📁 File: ${filename}`, 'success');
        
    } catch (error) {
        console.error('Excel export error:', error);
        showNotification('Error exporting Excel file. Please try again.', 'error');
    }
}

// Export to CSV (separate files)
function exportToCSV() {
    const salesData = JSON.parse(localStorage.getItem('salesData') || '[]');
    const purchaseData = JSON.parse(localStorage.getItem('purchaseData') || '[]');
    
    if (salesData.length === 0 && purchaseData.length === 0) {
        showNotification('No data to export. Please add some sales or purchases first.', 'error');
        return;
    }

    // Show export preview
    const dateStr = new Date().toISOString().split('T')[0];
    let exportFiles = [];
    
    if (salesData.length > 0) {
        exportFiles.push(`📋 Khan-Automobiles-Sales-${dateStr}.csv (${salesData.length} records)`);
    }
    if (purchaseData.length > 0) {
        exportFiles.push(`📋 Khan-Automobiles-Purchases-${dateStr}.csv (${purchaseData.length} records)`);
    }
    
    const exportInfo = `Exporting to CSV:\n\n${exportFiles.join('\n')}\n\nFiles will be downloaded separately.`;
    
    if (!confirm(exportInfo + '\n\nProceed with export?')) {
        return;
    }

    let exportCount = 0;

    let downloadedFiles = [];

    // Export Sales CSV
    if (salesData.length > 0) {
        const salesCSV = convertToCSV(salesData, 'sales');
        const salesFilename = `Khan-Automobiles-Sales-${dateStr}.csv`;
        downloadCSV(salesCSV, salesFilename);
        downloadedFiles.push(`📋 ${salesFilename} (${salesData.length} records)`);
        exportCount++;
    }

    // Export Purchases CSV
    if (purchaseData.length > 0) {
        const purchasesCSV = convertToCSV(purchaseData, 'purchases');
        const purchasesFilename = `Khan-Automobiles-Purchases-${dateStr}.csv`;
        downloadCSV(purchasesCSV, purchasesFilename);
        downloadedFiles.push(`📋 ${purchasesFilename} (${purchaseData.length} records)`);
        exportCount++;
    }

    showNotification(`CSV files exported successfully!\n\n${downloadedFiles.join('\n')}`, 'success');
}

// Helper function to format date for Excel
function formatDateForExcel(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric' 
    });
}

// Helper function to convert data to CSV
function convertToCSV(data, type) {
    if (!data || data.length === 0) return '';
    
    let headers, rows;
    
    if (type === 'sales') {
        headers = ['Date', 'Customer', 'Category', 'Description', 'Payment Method', 'Amount (₹)', 'Notes'];
        rows = data.map(item => [
            formatDateForExcel(item.date),
            item.customer || '',
            item.category || '',
            item.description || '',
            item.paymentMethod || '',
            item.total || 0,
            (item.notes || '').replace(/,/g, ';') // Replace commas to avoid CSV issues
        ]);
    } else {
        headers = ['Date', 'Supplier', 'Category', 'Description', 'Invoice Number', 'Amount (₹)', 'Notes'];
        rows = data.map(item => [
            formatDateForExcel(item.date),
            item.supplier || '',
            item.category || '',
            item.description || '',
            item.invoiceNumber || '',
            item.total || 0,
            (item.notes || '').replace(/,/g, ';') // Replace commas to avoid CSV issues
        ]);
    }
    
    // Combine headers and rows
    const csvContent = [headers, ...rows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');
    
    return csvContent;
}

// Helper function to download CSV
function downloadCSV(csvContent, filename) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Helper function to calculate summary data
function calculateSummaryData(salesData, purchaseData) {
    const totalSales = salesData.reduce((sum, sale) => sum + (sale.total || 0), 0);
    const totalPurchases = purchaseData.reduce((sum, purchase) => sum + (purchase.total || 0), 0);
    const netProfit = totalSales - totalPurchases;
    
    const today = new Date().toISOString().split('T')[0];
    const todaySales = salesData
        .filter(sale => sale.date === today)
        .reduce((sum, sale) => sum + (sale.total || 0), 0);
    
    return [
        { 'Metric': 'Total Sales', 'Value (₹)': totalSales.toLocaleString('en-IN') },
        { 'Metric': 'Total Purchases', 'Value (₹)': totalPurchases.toLocaleString('en-IN') },
        { 'Metric': 'Net Profit', 'Value (₹)': netProfit.toLocaleString('en-IN') },
        { 'Metric': 'Today\'s Sales', 'Value (₹)': todaySales.toLocaleString('en-IN') },
        { 'Metric': 'Total Transactions', 'Value (₹)': (salesData.length + purchaseData.length).toString() },
        { 'Metric': 'Export Date', 'Value (₹)': new Date().toLocaleDateString('en-IN') }
    ];
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 2rem;
        background: ${type === 'success' ? '#27ae60' : type === 'error' ? '#e74c3c' : '#3498db'};
        color: white;
        border-radius: 8px;
        z-index: 10000;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        animation: slideInRight 0.3s ease-out;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add notification animations to head
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .stat-card {
        background: white;
        padding: 2rem;
        border-radius: 15px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        display: flex;
        align-items: center;
        gap: 1rem;
        transition: transform 0.3s ease;
    }
    
    .stat-card:hover {
        transform: translateY(-5px);
    }
    
    .stat-icon {
        font-size: 2.5rem;
        width: 60px;
        text-align: center;
    }
    
    .stat-info h3 {
        margin: 0;
        font-size: 1.8rem;
        font-weight: 700;
    }
    
    .stat-info p {
        margin: 0;
        color: #666;
        font-size: 0.9rem;
    }
`;
document.head.appendChild(style);
// Edit transaction functions
function editTransaction(transactionId, transactionType) {
    console.log('Editing transaction:', transactionId, transactionType);
    
    const dataKey = transactionType === 'sale' ? 'salesData' : 'purchaseData';
    const data = JSON.parse(localStorage.getItem(dataKey) || '[]');
    const transaction = data.find(item => item.id.toString() === transactionId.toString());
    
    if (!transaction) {
        showNotification('Transaction not found!', 'error');
        return;
    }
    
    // Populate modal with transaction data
    document.getElementById('editTransactionId').value = transaction.id;
    document.getElementById('editTransactionType').value = transactionType;
    document.getElementById('editDate').value = transaction.date;
    document.getElementById('editContact').value = transaction.customer || transaction.supplier || '';
    document.getElementById('editCategory').value = transaction.category || '';
    document.getElementById('editDescription').value = transaction.description || '';
    document.getElementById('editTotal').value = transaction.total || '';
    document.getElementById('editPaymentMethod').value = transaction.paymentMethod || '';
    document.getElementById('editInvoiceNumber').value = transaction.invoiceNumber || '';
    document.getElementById('editNotes').value = transaction.notes || '';
    
    // Update modal title and show appropriate fields
    const modalTitle = document.getElementById('editModalTitle');
    modalTitle.textContent = `Edit ${transactionType === 'sale' ? 'Sale' : 'Purchase'}`;
    
    // Show/hide fields based on transaction type
    const paymentField = document.getElementById('editPaymentMethod');
    const invoiceField = document.getElementById('editInvoiceNumber');
    const contactPlaceholder = document.getElementById('editContact');
    
    if (transactionType === 'sale') {
        paymentField.style.display = 'block';
        invoiceField.style.display = 'none';
        contactPlaceholder.placeholder = 'Customer Name';
    } else {
        paymentField.style.display = 'none';
        invoiceField.style.display = 'block';
        contactPlaceholder.placeholder = 'Supplier Name';
    }
    
    // Show modal with animation
    const modal = document.getElementById('editModal');
    modal.style.display = 'block';
    
    // Focus on first input field
    setTimeout(() => {
        document.getElementById('editDate').focus();
    }, 100);
}

function closeEditModal() {
    document.getElementById('editModal').style.display = 'none';
    document.getElementById('editTransactionForm').reset();
}

function updateTransaction() {
    const submitBtn = document.querySelector('#editTransactionForm button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    
    // Show loading state
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';
    submitBtn.disabled = true;
    
    setTimeout(() => {
        const transactionId = document.getElementById('editTransactionId').value;
        const transactionType = document.getElementById('editTransactionType').value;
        const total = parseFloat(document.getElementById('editTotal').value);
        
        if (!total || total <= 0) {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
            showNotification('Please enter a valid total amount!', 'error');
            return;
        }
    
        const updatedData = {
            id: parseInt(transactionId),
            date: document.getElementById('editDate').value,
            category: document.getElementById('editCategory').value,
            description: document.getElementById('editDescription').value,
            total: total,
            notes: document.getElementById('editNotes').value,
            timestamp: new Date().toISOString() // Keep original timestamp, but update modified time
        };
        
        // Add type-specific fields
        if (transactionType === 'sale') {
            updatedData.customer = document.getElementById('editContact').value;
            updatedData.paymentMethod = document.getElementById('editPaymentMethod').value;
        } else {
            updatedData.supplier = document.getElementById('editContact').value;
            updatedData.invoiceNumber = document.getElementById('editInvoiceNumber').value;
        }
        
        // Update data in localStorage
        const dataKey = transactionType === 'sale' ? 'salesData' : 'purchaseData';
        const data = JSON.parse(localStorage.getItem(dataKey) || '[]');
        const index = data.findIndex(item => item.id.toString() === transactionId.toString());
        
        if (index === -1) {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
            showNotification('Transaction not found!', 'error');
            return;
        }
        
        // Update the transaction
        data[index] = updatedData;
        localStorage.setItem(dataKey, JSON.stringify(data));
        
        console.log('Updated transaction:', updatedData);
        console.log('Updated data array length:', data.length);
        
        // Close modal
        closeEditModal();
        
        // Show success message
        showNotification(`${transactionType === 'sale' ? 'Sale' : 'Purchase'} updated successfully!`, 'success');
        
        // Refresh all displays
        loadDashboard();
        updateDataCountInfo();
        if (document.getElementById('reports').classList.contains('active')) {
            generateReport();
        }
        
        // Restore button state
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }, 300); // End of setTimeout
}

function deleteTransaction(transactionId, transactionType) {
    // Confirm deletion
    const confirmDelete = confirm(`Are you sure you want to delete this ${transactionType}?\n\nThis action cannot be undone.`);
    
    if (!confirmDelete) {
        return;
    }
    
    console.log('Deleting transaction:', transactionId, transactionType);
    
    // Get data and find transaction
    const dataKey = transactionType === 'sale' ? 'salesData' : 'purchaseData';
    const data = JSON.parse(localStorage.getItem(dataKey) || '[]');
    const index = data.findIndex(item => item.id.toString() === transactionId.toString());
    
    if (index === -1) {
        showNotification('Transaction not found!', 'error');
        return;
    }
    
    // Remove transaction from array
    const deletedTransaction = data.splice(index, 1)[0];
    
    // Save updated data
    localStorage.setItem(dataKey, JSON.stringify(data));
    
    console.log('Deleted transaction:', deletedTransaction);
    console.log('Remaining data length:', data.length);
    
    // Show success message
    showNotification(`${transactionType === 'sale' ? 'Sale' : 'Purchase'} deleted successfully!`, 'success');
    
    // Refresh all displays
    loadDashboard();
    updateDataCountInfo();
    if (document.getElementById('reports').classList.contains('active')) {
        generateReport();
    }
}

// Update data count info in reports section
function updateDataCountInfo() {
    const dataCountElement = document.getElementById('dataCountInfo');
    if (!dataCountElement) return;
    
    const salesData = JSON.parse(localStorage.getItem('salesData') || '[]');
    const purchaseData = JSON.parse(localStorage.getItem('purchaseData') || '[]');
    
    const totalSales = salesData.reduce((sum, sale) => sum + (sale.total || 0), 0);
    const totalPurchases = purchaseData.reduce((sum, purchase) => sum + (purchase.total || 0), 0);
    
    dataCountElement.innerHTML = `
        <i class="fas fa-database"></i> 
        📊 ${salesData.length} Sales (₹${totalSales.toLocaleString('en-IN')}) • 
        📊 ${purchaseData.length} Purchases (₹${totalPurchases.toLocaleString('en-IN')})
    `;
}

// Updated to allow manual entry of totals while keeping auto-calculation as helper
