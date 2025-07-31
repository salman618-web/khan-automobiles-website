// Test script to add sample data - run this in browser console if needed

function addTestData() {
    // Sample sales data
    const testSales = [
        {
            id: Date.now() - 1000,
            date: '2024-07-31',
            customer: 'John Doe',
            category: 'bike-parts',
            description: 'Brake Pads',
            quantity: 2,
            price: 500,
            total: 1000,
            paymentMethod: 'Cash',
            notes: 'Test sale',
            timestamp: new Date().toISOString()
        },
        {
            id: Date.now() - 2000,
            date: '2024-07-31',
            customer: 'Jane Smith',
            category: 'car-service',
            description: 'Oil Change',
            quantity: 1,
            price: 2000,
            total: 2000,
            paymentMethod: 'Card',
            notes: 'Regular service',
            timestamp: new Date().toISOString()
        }
    ];

    // Sample purchase data
    const testPurchases = [
        {
            id: Date.now() - 3000,
            date: '2024-07-30',
            supplier: 'Auto Parts Ltd',
            category: 'bike-parts',
            description: 'Brake Discs',
            quantity: 5,
            cost: 300,
            total: 1500,
            invoiceNumber: 'INV001',
            notes: 'Bulk purchase',
            timestamp: new Date().toISOString()
        }
    ];

    // Save to localStorage
    localStorage.setItem('salesData', JSON.stringify(testSales));
    localStorage.setItem('purchaseData', JSON.stringify(testPurchases));
    
    console.log('Test data added!');
    console.log('Sales:', testSales.length, 'records');
    console.log('Purchases:', testPurchases.length, 'records');
    
    // Refresh dashboard if loadDashboard function exists
    if (typeof loadDashboard === 'function') {
        loadDashboard();
    }
}

// Run the test
// addTestData(); // Uncomment this line to run automatically 