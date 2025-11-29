// Dashboard JavaScript
let revenueChart = null;
let currentFilter = 'weekly';
let allPayments = [];

document.addEventListener('DOMContentLoaded', async function() {
    // Get current user info
    const userStr = localStorage.getItem('user');
    if (userStr) {
        const currentUser = JSON.parse(userStr);
        
        // Show user info if elements exist
        const userNameEl = document.getElementById('userName');
        if (userNameEl) {
            userNameEl.textContent = currentUser.name || 'User';
        }

        // Hide admin menu items for non-admin users
        if (currentUser.role !== 'admin') {
            document.querySelectorAll('.nav-item-admin').forEach(el => {
                el.style.display = 'none';
            });
        }
    }

    // Load dashboard statistics
    await loadDashboardStats();
    
    // Load payment data for chart
    await loadPaymentData();
    
    // Initialize revenue chart with default filter (This Month)
    await updateChartWithFilter('month');
});

// Load dashboard statistics
async function loadDashboardStats() {
    try {
        // Get dashboard stats from API
        const response = await authenticatedFetch('/api/dashboard/stats');
        
        if (!response.ok) {
            throw new Error('Failed to load dashboard stats');
        }

        const stats = await response.json();
        
        // Update total members
        const totalMembersEl = document.getElementById('totalMembers');
        if (totalMembersEl) {
            totalMembersEl.textContent = stats.totalMembers || 0;
        }

        // Update active members
        const activeMembersEl = document.getElementById('activeMembers');
        if (activeMembersEl) {
            activeMembersEl.textContent = stats.activeMembers || 0;
        }

        // Update total coaches
        const totalCoachesEl = document.getElementById('totalCoaches');
        if (totalCoachesEl) {
            totalCoachesEl.textContent = stats.totalCoaches || 0;
        }

        // Update total revenue
        const totalRevenueEl = document.getElementById('totalRevenue');
        if (totalRevenueEl) {
            totalRevenueEl.textContent = '₱' + (stats.totalRevenue || 0).toFixed(2);
        }

        // Load upcoming classes count
        await loadUpcomingClassesCount();

    } catch (error) {
        console.error('Error loading dashboard stats:', error);
        showError('Failed to load dashboard statistics');
    }
}

// Load upcoming classes count
async function loadUpcomingClassesCount() {
    try {
        const response = await authenticatedFetch('/api/schedules');
        
        if (!response.ok) {
            console.error('Failed to load schedules');
            return;
        }
        
        const schedules = await response.json();
        
        // Count upcoming classes (future classes only)
        const now = new Date();
        const upcomingCount = schedules.filter(schedule => {
            const scheduleDateTime = new Date(schedule.date + 'T' + schedule.startTime);
            return scheduleDateTime > now;
        }).length;
        
        const upcomingClassesEl = document.getElementById('upcomingClasses');
        if (upcomingClassesEl) {
            upcomingClassesEl.textContent = upcomingCount;
        }
        
    } catch (error) {
        console.error('Error loading upcoming classes:', error);
    }
}

// Show error message
function showError(message) {
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-error';
    alertDiv.innerHTML = `
        <i class="ph ph-warning-circle"></i>
        <span>${message}</span>
    `;
    
    const content = document.querySelector('.content');
    if (content) {
        content.insertBefore(alertDiv, content.firstChild);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            alertDiv.remove();
        }, 5000);
    }
}

// Refresh dashboard data
function refreshDashboard() {
    loadDashboardStats();
}

// Load payment data
async function loadPaymentData() {
    try {
        const response = await authenticatedFetch('/api/payments');
        
        if (!response.ok) {
            throw new Error('Failed to load payment data');
        }

        allPayments = await response.json();
        
    } catch (error) {
        console.error('Error loading payment data:', error);
        allPayments = [];
    }
}

// Change chart date filter
function changeChartDateFilter() {
    const filterValue = document.getElementById('chartDateFilter').value;
    const customDateRange = document.getElementById('chartCustomDateRange');
    
    if (filterValue === 'custom') {
        customDateRange.style.display = 'flex';
    } else {
        customDateRange.style.display = 'none';
        updateChartWithFilter(filterValue);
    }
}

// Apply custom date filter
function applyChartCustomDateFilter() {
    const startDate = document.getElementById('chartStartDate').value;
    const endDate = document.getElementById('chartEndDate').value;
    
    if (!startDate || !endDate) {
        alert('Please select both start and end dates');
        return;
    }
    
    if (new Date(startDate) > new Date(endDate)) {
        alert('Start date must be before end date');
        return;
    }
    
    updateChartWithFilter('custom', startDate, endDate);
}

// Update chart with filter
async function updateChartWithFilter(filter, customStart = null, customEnd = null) {
    let filteredPayments = [];
    const now = new Date();
    
    switch(filter) {
        case 'all':
            filteredPayments = allPayments;
            break;
            
        case 'today':
            filteredPayments = allPayments.filter(p => {
                const paymentDate = new Date(p.paymentDate);
                return paymentDate.toDateString() === now.toDateString();
            });
            break;
            
        case 'week':
            const weekStart = new Date(now);
            weekStart.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
            weekStart.setHours(0, 0, 0, 0);
            
            filteredPayments = allPayments.filter(p => {
                const paymentDate = new Date(p.paymentDate);
                return paymentDate >= weekStart;
            });
            break;
            
        case 'month':
            filteredPayments = allPayments.filter(p => {
                const paymentDate = new Date(p.paymentDate);
                return paymentDate.getMonth() === now.getMonth() && 
                       paymentDate.getFullYear() === now.getFullYear();
            });
            break;
            
        case 'year':
            filteredPayments = allPayments.filter(p => {
                const paymentDate = new Date(p.paymentDate);
                return paymentDate.getFullYear() === now.getFullYear();
            });
            break;
            
        case 'custom':
            if (customStart && customEnd) {
                const start = new Date(customStart);
                const end = new Date(customEnd);
                end.setHours(23, 59, 59, 999); // Include the entire end date
                
                filteredPayments = allPayments.filter(p => {
                    const paymentDate = new Date(p.paymentDate);
                    return paymentDate >= start && paymentDate <= end;
                });
            }
            break;
    }
    
    // Process chart data based on filter
    const chartData = processChartData(filteredPayments, filter, customStart, customEnd);
    renderChart(chartData);
}

// Render the chart
function renderChart(chartData) {
    const ctx = document.getElementById('revenueChart');
    if (!ctx) return;
    
    // Destroy existing chart if it exists
    if (revenueChart) {
        revenueChart.destroy();
    }
    
    // Create new chart
    revenueChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartData.labels,
            datasets: [{
                label: 'Revenue (₱)',
                data: chartData.values,
                borderColor: '#4CAF50',
                backgroundColor: 'rgba(76, 175, 80, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 5,
                pointBackgroundColor: '#4CAF50',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointHoverRadius: 7,
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
                        font: {
                            size: 14,
                            weight: '500'
                        },
                        padding: 15
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: {
                        size: 14
                    },
                    bodyFont: {
                        size: 13
                    },
                    callbacks: {
                        label: function(context) {
                            return 'Revenue: ₱' + context.parsed.y.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '₱' + value.toLocaleString('en-PH');
                        },
                        font: {
                            size: 12
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    ticks: {
                        font: {
                            size: 12
                        }
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// Process chart data based on filter and filtered payments
function processChartData(filteredPayments, filter, customStart = null, customEnd = null) {
    const labels = [];
    const values = [];
    
    if (filter === 'today') {
        // Show hourly breakdown for today
        for (let hour = 0; hour < 24; hour++) {
            labels.push(`${hour}:00`);
            const hourRevenue = filteredPayments.filter(p => {
                const paymentDate = new Date(p.paymentDate);
                return paymentDate.getHours() === hour;
            }).reduce((sum, p) => sum + (p.amount || 0), 0);
            values.push(hourRevenue);
        }
    } else if (filter === 'week') {
        // Show daily breakdown for this week (last 7 days)
        const now = new Date();
        for (let i = 6; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            const dayName = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
            labels.push(dayName);
            
            const dayRevenue = filteredPayments.filter(p => {
                const paymentDate = new Date(p.paymentDate);
                return paymentDate.toDateString() === date.toDateString();
            }).reduce((sum, p) => sum + (p.amount || 0), 0);
            values.push(dayRevenue);
        }
    } else if (filter === 'month') {
        // Show daily breakdown for this month
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        
        const currentDate = new Date(firstDay);
        while (currentDate <= lastDay) {
            const dayLabel = currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            labels.push(dayLabel);
            
            const dayRevenue = filteredPayments.filter(p => {
                const paymentDate = new Date(p.paymentDate);
                return paymentDate.toDateString() === currentDate.toDateString();
            }).reduce((sum, p) => sum + (p.amount || 0), 0);
            values.push(dayRevenue);
            
            currentDate.setDate(currentDate.getDate() + 1);
        }
    } else if (filter === 'year') {
        // Show monthly breakdown for this year
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const now = new Date();
        const currentYear = now.getFullYear();
        
        for (let month = 0; month < 12; month++) {
            labels.push(monthNames[month]);
            
            const monthRevenue = filteredPayments.filter(p => {
                const paymentDate = new Date(p.paymentDate);
                return paymentDate.getMonth() === month && paymentDate.getFullYear() === currentYear;
            }).reduce((sum, p) => sum + (p.amount || 0), 0);
            values.push(monthRevenue);
        }
    } else if (filter === 'custom' && customStart && customEnd) {
        // Show daily breakdown for custom range
        const start = new Date(customStart);
        const end = new Date(customEnd);
        
        const currentDate = new Date(start);
        while (currentDate <= end) {
            const dayLabel = currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            labels.push(dayLabel);
            
            const dayRevenue = filteredPayments.filter(p => {
                const paymentDate = new Date(p.paymentDate);
                return paymentDate.toDateString() === currentDate.toDateString();
            }).reduce((sum, p) => sum + (p.amount || 0), 0);
            values.push(dayRevenue);
            
            currentDate.setDate(currentDate.getDate() + 1);
        }
    } else if (filter === 'all') {
        // Show monthly breakdown for all time
        const paymentDates = filteredPayments.map(p => new Date(p.paymentDate));
        if (paymentDates.length === 0) {
            return { labels: [], values: [] };
        }
        
        const minDate = new Date(Math.min(...paymentDates));
        const maxDate = new Date(Math.max(...paymentDates));
        
        const currentDate = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
        const endDate = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);
        
        while (currentDate <= endDate) {
            const monthLabel = currentDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            labels.push(monthLabel);
            
            const monthRevenue = filteredPayments.filter(p => {
                const paymentDate = new Date(p.paymentDate);
                return paymentDate.getMonth() === currentDate.getMonth() && 
                       paymentDate.getFullYear() === currentDate.getFullYear();
            }).reduce((sum, p) => sum + (p.amount || 0), 0);
            values.push(monthRevenue);
            
            currentDate.setMonth(currentDate.getMonth() + 1);
        }
    }
    
    return { labels, values };
}

