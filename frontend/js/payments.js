// Payment History JavaScript

let allPayments = [];
let filteredPayments = [];
let allMembers = [];
let currentUser = null;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    // Get current user - check both localStorage and sessionStorage
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            currentUser = {
                id: payload.id,
                email: payload.email,
                role: payload.role,
                name: payload.name
            };
        } catch (error) {
            console.error('Error parsing token:', error);
        }
    }

    // Load data
    await Promise.all([loadPayments(), loadMembersForFilter()]);
    
    // Setup event listeners
    setupEventListeners();
});

// Load all payments
async function loadPayments() {
    try {
        const response = await authenticatedFetch('/api/payments');
        
        if (!response.ok) {
            throw new Error('Failed to load payments');
        }

        allPayments = await response.json();
        filteredPayments = [...allPayments];
        
        displayPayments(filteredPayments);
        updateStatistics(filteredPayments);
    } catch (error) {
        console.error('Error loading payments:', error);
        showError('Failed to load payment history');
    }
}

// Load members for filter dropdown
async function loadMembersForFilter() {
    try {
        const response = await authenticatedFetch('/api/members');
        
        if (!response.ok) {
            throw new Error('Failed to load members');
        }

        allMembers = await response.json();
        populateMemberFilter();
    } catch (error) {
        console.error('Error loading members:', error);
    }
}

// Populate member filter dropdown
function populateMemberFilter() {
    const memberFilter = document.getElementById('memberFilter');
    
    // Clear existing options except "All Members"
    memberFilter.innerHTML = '<option value="">All Members</option>';
    
    // Sort members by name
    const sortedMembers = allMembers.sort((a, b) => a.name.localeCompare(b.name));
    
    // Add member options
    sortedMembers.forEach(member => {
        const option = document.createElement('option');
        option.value = member.id;
        option.textContent = member.name;
        memberFilter.appendChild(option);
    });
}

// Display payments in table
function displayPayments(payments) {
    const tbody = document.getElementById('paymentsTableBody');
    const emptyState = document.getElementById('emptyState');
    
    if (payments.length === 0) {
        tbody.innerHTML = '';
        emptyState.style.display = 'flex';
        return;
    }
    
    emptyState.style.display = 'none';
    
    // Sort by date (newest first)
    const sortedPayments = payments.sort((a, b) => 
        new Date(b.paymentDate) - new Date(a.paymentDate)
    );
    
    tbody.innerHTML = sortedPayments.map(payment => `
        <tr>
            <td>${formatDateTime(payment.paymentDate)}</td>
            <td>${escapeHtml(payment.memberName || 'N/A')}</td>
            <td>
                <span class="badge badge-${(payment.membershipType || 'unknown').toLowerCase().replace(/ /g, '-')}">
                    ${escapeHtml(payment.membershipType || 'N/A')}
                </span>
            </td>
            <td class="student-cell">
                ${payment.isStudent ? '<i class="ph ph-student student-icon" title="Student (10% discount)"></i>' : '-'}
            </td>
            <td class="amount-cell">₱${payment.amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td>
                <span class="payment-method-badge">
                    ${getPaymentMethodIcon(payment.paymentMethod)}
                    ${escapeHtml(payment.paymentMethod)}
                </span>
            </td>
            <td>
                <span class="status-badge status-${payment.status.toLowerCase()}">
                    ${escapeHtml(payment.status)}
                </span>
            </td>
            <td class="notes-cell">${escapeHtml(payment.notes || payment.description || '-')}</td>
        </tr>
    `).join('');
}

// Update statistics
function updateStatistics(payments) {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Total revenue
    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
    document.getElementById('totalRevenue').textContent = `₱${totalRevenue.toFixed(2)}`;
    
    // Total payments count
    document.getElementById('totalPayments').textContent = payments.length;
    
    // This month revenue
    const thisMonthPayments = payments.filter(p => 
        new Date(p.paymentDate) >= monthStart
    );
    const thisMonthRevenue = thisMonthPayments.reduce((sum, p) => sum + p.amount, 0);
    document.getElementById('thisMonthRevenue').textContent = `₱${thisMonthRevenue.toFixed(2)}`;
    
    // Today revenue
    const todayPayments = payments.filter(p => 
        new Date(p.paymentDate) >= todayStart
    );
    const todayRevenue = todayPayments.reduce((sum, p) => sum + p.amount, 0);
    document.getElementById('todayRevenue').textContent = `₱${todayRevenue.toFixed(2)}`;
}

// Setup event listeners
function setupEventListeners() {
    // Search input
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', handleSearch);
    
    // Member filter
    const memberFilter = document.getElementById('memberFilter');
    memberFilter.addEventListener('change', applyFilters);
    
    // Membership type filter
    const membershipTypeFilter = document.getElementById('membershipTypeFilter');
    membershipTypeFilter.addEventListener('change', applyFilters);
    
    // Date filter
    const dateFilter = document.getElementById('dateFilter');
    dateFilter.addEventListener('change', handleDateFilterChange);
}

// Handle search
function handleSearch() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
    applyFilters();
}

// Handle date filter change
function handleDateFilterChange() {
    const dateFilter = document.getElementById('dateFilter').value;
    const customDateRange = document.getElementById('customDateRange');
    
    if (dateFilter === 'custom') {
        customDateRange.style.display = 'flex';
    } else {
        customDateRange.style.display = 'none';
        applyFilters();
    }
}

// Apply custom date filter
function applyCustomDateFilter() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    
    if (!startDate || !endDate) {
        showError('Please select both start and end dates');
        return;
    }
    
    if (new Date(startDate) > new Date(endDate)) {
        showError('Start date must be before end date');
        return;
    }
    
    applyFilters();
}

// Apply all filters
function applyFilters() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
    const memberFilter = document.getElementById('memberFilter').value;
    const membershipTypeFilter = document.getElementById('membershipTypeFilter').value;
    const dateFilter = document.getElementById('dateFilter').value;
    
    filteredPayments = allPayments.filter(payment => {
        // Search filter
        if (searchTerm) {
            const memberName = (payment.memberName || '').toLowerCase();
            if (!memberName.includes(searchTerm)) {
                return false;
            }
        }
        
        // Member filter
        if (memberFilter && payment.memberId !== memberFilter) {
            return false;
        }
        
        // Membership type filter
        if (membershipTypeFilter && payment.membershipType !== membershipTypeFilter) {
            return false;
        }
        
        // Date filter
        if (!filterByDate(payment, dateFilter)) {
            return false;
        }
        
        return true;
    });
    
    displayPayments(filteredPayments);
    updateStatistics(filteredPayments);
}

// Filter by date
function filterByDate(payment, dateFilter) {
    if (dateFilter === 'all') {
        return true;
    }
    
    const paymentDate = new Date(payment.paymentDate);
    const now = new Date();
    
    switch (dateFilter) {
        case 'today':
            const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            return paymentDate >= todayStart;
            
        case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return paymentDate >= weekAgo;
            
        case 'month':
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            return paymentDate >= monthStart;
            
        case 'year':
            const yearStart = new Date(now.getFullYear(), 0, 1);
            return paymentDate >= yearStart;
            
        case 'custom':
            const startDate = document.getElementById('startDate').value;
            const endDate = document.getElementById('endDate').value;
            
            if (!startDate || !endDate) {
                return true;
            }
            
            const start = new Date(startDate);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999); // Include the entire end date
            
            return paymentDate >= start && paymentDate <= end;
            
        default:
            return true;
    }
}

// Clear all filters
function clearFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('memberFilter').value = '';
    document.getElementById('membershipTypeFilter').value = '';
    document.getElementById('dateFilter').value = 'all';
    document.getElementById('customDateRange').style.display = 'none';
    document.getElementById('startDate').value = '';
    document.getElementById('endDate').value = '';
    
    filteredPayments = [...allPayments];
    displayPayments(filteredPayments);
    updateStatistics(filteredPayments);
}

// Helper: Get payment method icon
function getPaymentMethodIcon(method) {
    const icons = {
        'Cash': '<i class="ph ph-money"></i>',
        'Credit Card': '<i class="ph ph-credit-card"></i>',
        'Debit Card': '<i class="ph ph-credit-card"></i>',
        'Bank Transfer': '<i class="ph ph-bank"></i>',
        'Online Payment': '<i class="ph ph-devices"></i>'
    };
    
    return icons[method] || '<i class="ph ph-currency-dollar"></i>';
}

// Helper: Format date and time
function formatDateTime(dateString) {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    const options = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    
    return date.toLocaleDateString('en-US', options);
}

// Helper: Escape HTML
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Helper: Show error message
function showError(message) {
    // You can implement a toast notification here
    alert(message);
}

// Authenticated fetch helper
async function authenticatedFetch(url, options = {}) {
    // Check both localStorage and sessionStorage
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    
    const defaultOptions = {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    };
    
    const mergedOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers
        }
    };
    
    return fetch(url, mergedOptions);
}
