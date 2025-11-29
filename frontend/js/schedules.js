// Schedules Module JavaScript

let allSchedules = [];
let allCoaches = [];
let filteredSchedules = [];
let currentView = 'calendar'; // Default to calendar view
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let editingScheduleId = null;

// Helper function to format date as YYYY-MM-DD without timezone conversion
function formatDateLocal(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', async function() {
    const userStr = localStorage.getItem('user');
    if (userStr) {
        const currentUser = JSON.parse(userStr);
        
        // Show Create button for coaches and admins only (not members)
        if (currentUser.role === 'coach' || currentUser.role === 'admin') {
            document.querySelector('.btn-create-schedule').style.display = 'flex';
        }
        
        // Hide admin-only elements (edit/delete) for non-admin users (coaches and members)
        if (currentUser.role !== 'admin') {
            document.querySelectorAll('.admin-only').forEach(el => {
                el.style.display = 'none';
            });
        }
    }
    
    // Load initial data
    await loadCoaches();
    populateCoachFilter(); // Populate after coaches are loaded
    await loadSchedules();
    
    // Set initial view to calendar
    switchView('calendar');
});

// Load all schedules
async function loadSchedules() {
    try {
        const response = await authenticatedFetch('/api/schedules');
        
        if (!response.ok) {
            throw new Error('Failed to load schedules');
        }
        
        allSchedules = await response.json();
        
        // All users (admins, coaches, and members) can see all schedules
        // This allows coaches to coordinate and avoid gym overload
        filteredSchedules = [...allSchedules];
        renderSchedulesTable();
        renderCalendar();
        
    } catch (error) {
        console.error('Error loading schedules:', error);
        showMessage('Error loading schedules: ' + error.message, 'error');
    }
}

// Load all coaches
async function loadCoaches() {
    try {
        const response = await authenticatedFetch('/api/coaches');
        
        if (!response.ok) {
            throw new Error('Failed to load coaches');
        }
        
        allCoaches = await response.json();
        
        // Normalize coach data - ensure 'id' property exists (handle both 'id' and 'Id')
        allCoaches = allCoaches.map(coach => ({
            ...coach,
            id: coach.id || coach.Id || coach._id
        }));
        
        console.log('Loaded coaches:', allCoaches.length, allCoaches);
        
    } catch (error) {
        console.error('Error loading coaches:', error);
        allCoaches = []; // Ensure it's an empty array on error
    }
}

// Populate coach filter dropdown
function populateCoachFilter() {
    const coachSelect = document.getElementById('searchCoach');
    const coachIdSelect = document.getElementById('coachId');
    
    console.log('Populating coach dropdowns with', allCoaches.length, 'coaches');
    
    // Clear existing options except first
    if (coachSelect) {
        coachSelect.innerHTML = '<option value="">All Coaches</option>';
    }
    if (coachIdSelect) {
        coachIdSelect.innerHTML = '<option value="">Select Coach</option>';
    }
    
    allCoaches.forEach(coach => {
        if (coachSelect) {
            const option1 = document.createElement('option');
            option1.value = coach.id;
            option1.textContent = coach.name;
            coachSelect.appendChild(option1);
        }
        
        if (coachIdSelect) {
            const option2 = document.createElement('option');
            option2.value = coach.id;
            option2.textContent = coach.name;
            coachIdSelect.appendChild(option2);
        }
    });
    
    console.log('Coach dropdowns populated');
}

// Render schedules table
function renderSchedulesTable() {
    const tbody = document.getElementById('schedulesTableBody');
    
    if (filteredSchedules.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" style="text-align: center; padding: 40px;">
                    <i class="ph ph-calendar-x" style="font-size: 48px; color: #ccc;"></i>
                    <p style="color: #999; margin-top: 10px;">No schedules found.</p>
                </td>
            </tr>
        `;
        return;
    }
    
    // Sort by date and time
    const sortedSchedules = [...filteredSchedules].sort((a, b) => {
        const dateA = new Date(a.date + 'T' + a.startTime);
        const dateB = new Date(b.date + 'T' + b.startTime);
        return dateA - dateB;
    });
    
    tbody.innerHTML = sortedSchedules.map((schedule, index) => {
        const status = getScheduleStatus(schedule);
        const duration = calculateDuration(schedule.startTime, schedule.endTime);
        const coach = allCoaches.find(c => c.id === schedule.coachId);
        const coachName = coach ? coach.name : 'Unknown';
        const enrolledCount = schedule.enrolledMembers ? schedule.enrolledMembers.length : 0;
        const capacityText = schedule.capacity ? `${enrolledCount}/${schedule.capacity}` : `${enrolledCount}`;
        
        return `
            <tr>
                <td>${index + 1}</td>
                <td><strong>${escapeHtml(schedule.className)}</strong></td>
                <td><span class="coach-link" onclick="showCoachProfile('${schedule.coachId}')">${escapeHtml(coachName)}</span></td>
                <td>${formatDate(schedule.date)}</td>
                <td>${formatTime(schedule.startTime)} - ${formatTime(schedule.endTime)}</td>
                <td>${duration}</td>
                <td>${capacityText}</td>
                <td><span class="schedule-status ${status}">${status}</span></td>
                <td class="admin-only" style="display: none;">
                    <div class="schedule-actions">
                        <button class="btn-icon btn-edit" onclick="editSchedule('${schedule.id}')" title="Edit">
                            <i class="ph ph-pencil"></i>
                        </button>
                        <button class="btn-icon btn-delete" onclick="deleteSchedule('${schedule.id}', '${escapeHtml(schedule.className)}')" title="Delete">
                            <i class="ph ph-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// Get schedule status
function getScheduleStatus(schedule) {
    const now = new Date();
    const scheduleDate = new Date(schedule.date);
    const startDateTime = new Date(schedule.date + 'T' + schedule.startTime);
    const endDateTime = new Date(schedule.date + 'T' + schedule.endTime);
    
    if (now > endDateTime) {
        return 'completed';
    } else if (now >= startDateTime && now <= endDateTime) {
        return 'ongoing';
    } else {
        return 'upcoming';
    }
}

// Calculate duration
function calculateDuration(startTime, endTime) {
    const start = new Date('1970-01-01T' + startTime);
    const end = new Date('1970-01-01T' + endTime);
    const diffMs = end - start;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) {
        return diffMins + ' min';
    } else {
        const hours = Math.floor(diffMins / 60);
        const mins = diffMins % 60;
        return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
}

// Apply filters
function applyFilters() {
    const className = document.getElementById('searchClassName').value.toLowerCase();
    const coachId = document.getElementById('searchCoach').value;
    const date = document.getElementById('searchDate').value;
    
    filteredSchedules = allSchedules.filter(schedule => {
        const matchesName = !className || schedule.className.toLowerCase().includes(className);
        const matchesCoach = !coachId || schedule.coachId === coachId;
        const matchesDate = !date || schedule.date === date;
        
        return matchesName && matchesCoach && matchesDate;
    });
    
    if (currentView === 'table') {
        renderSchedulesTable();
    } else {
        renderCalendar();
    }
}

// Clear filters
function clearFilters() {
    document.getElementById('searchClassName').value = '';
    document.getElementById('searchCoach').value = '';
    document.getElementById('searchDate').value = '';
    
    filteredSchedules = [...allSchedules];
    
    if (currentView === 'table') {
        renderSchedulesTable();
    } else {
        renderCalendar();
    }
}

// Switch view
function switchView(view) {
    currentView = view;
    
    // Update active button
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.view === view) {
            btn.classList.add('active');
        }
    });
    
    // Show/hide views
    if (view === 'table') {
        document.getElementById('tableView').style.display = 'block';
        document.getElementById('calendarView').style.display = 'none';
    } else {
        document.getElementById('tableView').style.display = 'none';
        document.getElementById('calendarView').style.display = 'block';
        renderCalendar();
    }
}

// Render calendar
function renderCalendar() {
    const monthYear = document.getElementById('calendarMonthYear');
    const grid = document.getElementById('calendarGrid');
    
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const prevLastDay = new Date(currentYear, currentMonth, 0);
    
    const firstDayWeek = firstDay.getDay();
    const lastDate = lastDay.getDate();
    const prevLastDate = prevLastDay.getDate();
    
    monthYear.textContent = firstDay.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    
    let html = '';
    
    // Day headers
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayNames.forEach(day => {
        html += `<div class="calendar-day-header">${day}</div>`;
    });
    
    // Previous month days
    for (let i = firstDayWeek; i > 0; i--) {
        html += `<div class="calendar-day other-month"><div class="day-number">${prevLastDate - i + 1}</div></div>`;
    }
    
    // Current month days
    const today = new Date();
    for (let date = 1; date <= lastDate; date++) {
        const currentDate = new Date(currentYear, currentMonth, date);
        const dateStr = formatDateLocal(currentDate);
        const isToday = today.toDateString() === currentDate.toDateString();
        
        // Get classes for this day
        const dayClasses = filteredSchedules.filter(s => s.date === dateStr);
        
        html += `
            <div class="calendar-day ${isToday ? 'today' : ''}" onclick="viewDaySchedules('${dateStr}')">
                <div class="day-number">${date}</div>
                <div class="day-classes">
                    ${dayClasses.slice(0, 4).map(cls => {
                        const coach = allCoaches.find(c => c.id === cls.coachId);
                        const coachName = coach ? coach.name : 'Unknown';
                        // Format time more compactly (remove leading zero and colon)
                        let timeStr = '';
                        if (cls.startTime) {
                            const [hour, min] = cls.startTime.split(':');
                            const h = parseInt(hour);
                            const displayHour = h > 12 ? h - 12 : (h === 0 ? 12 : h);
                            const ampm = h >= 12 ? 'p' : 'a';
                            timeStr = ` ${displayHour}${min !== '00' ? ':' + min : ''}${ampm}`;
                        }
                        return `<div class="class-pill" title="${escapeHtml(cls.className)} - ${escapeHtml(coachName)} at ${cls.startTime || ''}">${escapeHtml(cls.className)}${timeStr}</div>`;
                    }).join('')}
                    ${dayClasses.length > 4 ? `<div class="class-pill" style="opacity: 0.8;">+${dayClasses.length - 4}</div>` : ''}
                </div>
            </div>
        `;
    }
    
    // Next month days
    const remainingDays = 42 - (firstDayWeek + lastDate);
    for (let date = 1; date <= remainingDays; date++) {
        html += `<div class="calendar-day other-month"><div class="day-number">${date}</div></div>`;
    }
    
    grid.innerHTML = html;
}

// Calendar navigation
function previousMonth() {
    currentMonth--;
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }
    renderCalendar();
}

function nextMonth() {
    currentMonth++;
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    renderCalendar();
}

function goToToday() {
    const today = new Date();
    currentMonth = today.getMonth();
    currentYear = today.getFullYear();
    renderCalendar();
}

// View day schedules in expanded 24-hour timeline view
function viewDaySchedules(dateStr) {
    currentViewDate = dateStr; // Store current date for navigation
    const daySchedules = filteredSchedules.filter(s => s.date === dateStr);
    const date = new Date(dateStr);
    const dateFormatted = date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    
    // Convert time string to minutes since midnight
    function timeToMinutes(timeStr) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    }
    
    // Calculate schedule positions and detect overlaps
    const schedulesWithPositions = daySchedules.map(schedule => {
        const startMinutes = timeToMinutes(schedule.startTime);
        const endMinutes = timeToMinutes(schedule.endTime);
        const durationMinutes = endMinutes - startMinutes;
        
        return {
            ...schedule,
            startMinutes,
            endMinutes,
            durationMinutes,
            column: 0,
            totalColumns: 1
        };
    });
    
    // Sort by start time, then by duration (longer first)
    schedulesWithPositions.sort((a, b) => {
        if (a.startMinutes !== b.startMinutes) {
            return a.startMinutes - b.startMinutes;
        }
        return b.durationMinutes - a.durationMinutes;
    });
    
    // Detect overlapping schedules and assign columns
    for (let i = 0; i < schedulesWithPositions.length; i++) {
        const current = schedulesWithPositions[i];
        const overlapping = [current];
        
        // Find all schedules that overlap with current
        for (let j = 0; j < schedulesWithPositions.length; j++) {
            if (i === j) continue;
            const other = schedulesWithPositions[j];
            
            // Check if they overlap
            if (current.startMinutes < other.endMinutes && current.endMinutes > other.startMinutes) {
                if (!overlapping.includes(other)) {
                    overlapping.push(other);
                }
            }
        }
        
        // Assign columns to overlapping schedules
        if (overlapping.length > 1) {
            overlapping.forEach((schedule, index) => {
                schedule.totalColumns = Math.max(schedule.totalColumns, overlapping.length);
            });
            
            // Assign column positions
            const usedColumns = new Set();
            overlapping.forEach(schedule => {
                if (schedule.column === 0) {
                    // Find first available column
                    let col = 0;
                    while (usedColumns.has(col)) {
                        col++;
                    }
                    schedule.column = col;
                    usedColumns.add(col);
                }
            });
        }
    }
    
    // Build 24-hour timeline with positioned cards
    let timelineHtml = '';
    // Adjust hour height based on screen size
    const isMobile = window.innerWidth <= 768;
    const HOUR_HEIGHT = isMobile ? 50 : 80; // pixels per hour (with box-sizing: border-box, border is included)
    const TIME_LABEL_WIDTH = isMobile ? 60 : 90; // pixels
    
    for (let hour = 0; hour < 24; hour++) {
        const displayHour = hour === 0 ? 12 : (hour > 12 ? hour - 12 : hour);
        const ampm = hour < 12 ? 'AM' : 'PM';
        
        // Find schedules that are ongoing during this hour (for background highlighting)
        const ongoingSchedules = schedulesWithPositions.filter(schedule => {
            const hourStart = hour * 60;
            const hourEnd = (hour + 1) * 60;
            return schedule.startMinutes < hourEnd && schedule.endMinutes > hourStart;
        });
        
        // Generate background colors
        let backgroundStyles = '';
        if (ongoingSchedules.length > 0) {
            const colors = ongoingSchedules.map(schedule => {
                const status = getScheduleStatus(schedule);
                let color;
                if (status === 'completed') {
                    color = 'rgba(149, 165, 166, 0.15)';
                } else if (status === 'ongoing') {
                    color = 'rgba(243, 156, 18, 0.15)';
                } else {
                    color = 'rgba(102, 126, 234, 0.15)';
                }
                return color;
            });
            
            if (colors.length === 1) {
                backgroundStyles = `background-color: ${colors[0]};`;
            } else {
                const stripeWidth = 100 / colors.length;
                const gradientStops = colors.map((color, i) => {
                    const start = i * stripeWidth;
                    const end = (i + 1) * stripeWidth;
                    return `${color} ${start}%, ${color} ${end}%`;
                }).join(', ');
                backgroundStyles = `background: linear-gradient(90deg, ${gradientStops});`;
            }
        }
        
        timelineHtml += `
            <div class="timeline-hour" style="${backgroundStyles}" data-hour="${hour}">
                <div class="timeline-time">${displayHour}:00 ${ampm}</div>
                <div class="timeline-content" style="position: relative;">
                </div>
            </div>
        `;
    }
    
    // Populate modal first
    document.getElementById('dayViewDate').textContent = dateFormatted;
    document.getElementById('dayViewTimeline').innerHTML = timelineHtml;
    document.getElementById('dayViewModal').style.display = 'flex';
    
    // Now add positioned schedule cards as absolutely positioned elements
    const timeline = document.getElementById('dayViewTimeline');
    const timelineRect = timeline.getBoundingClientRect();
    
    schedulesWithPositions.forEach(schedule => {
        const coach = allCoaches.find(c => c.id === schedule.coachId);
        const coachName = coach ? coach.name : 'Unknown';
        const status = getScheduleStatus(schedule);
        const duration = calculateDuration(schedule.startTime, schedule.endTime);
        
        // Calculate position
        const topOffset = (schedule.startMinutes / 60) * HOUR_HEIGHT;
        const minHeight = isMobile ? 35 : 60;
        const height = Math.max((schedule.durationMinutes / 60) * HOUR_HEIGHT - 8, minHeight); // Minimum height
        
        // Calculate width and left position for side-by-side layout
        const columnWidth = 100 / schedule.totalColumns;
        const leftPercent = (schedule.column * columnWidth);
        const widthPercent = columnWidth - 0.5; // -0.5 for gap
        
        // Limit card width to maximum for single cards, but use full width for multiple
        const maxWidthPercent = schedule.totalColumns === 1 ? 35 : widthPercent;
        
        // Create card element
        const card = document.createElement('div');
        card.className = `timeline-schedule-card status-${status}`;
        card.style.cssText = `
            position: absolute;
            top: ${topOffset}px;
            left: calc(${TIME_LABEL_WIDTH}px + ${leftPercent}%);
            width: calc(${maxWidthPercent}% - 10px);
            height: ${height}px;
            z-index: 10;
        `;
        
        // Get current user
        const userStr = localStorage.getItem('user');
        const currentUser = userStr ? JSON.parse(userStr) : null;
        const userId = currentUser?.id || '';
        
        // Check if user is enrolled
        const isEnrolled = schedule.enrolledMembers && schedule.enrolledMembers.includes(userId);
        const enrolledCount = schedule.enrolledMembers ? schedule.enrolledMembers.length : 0;
        const isFull = schedule.capacity && enrolledCount >= schedule.capacity;
        const canEnroll = currentUser && currentUser.role === 'member' && (status === 'upcoming' || status === 'ongoing');
        
        card.innerHTML = `
            <div class="schedule-card-header">
                <strong>${escapeHtml(schedule.className)}</strong>
                <span class="schedule-card-status">${status}</span>
            </div>
            <div class="schedule-card-details">
                <div><i class="ph ph-user"></i> ${escapeHtml(coachName)}</div>
                <div><i class="ph ph-clock"></i> ${formatTime(schedule.startTime)} - ${formatTime(schedule.endTime)}</div>
                ${schedule.capacity ? `<div><i class="ph ph-users"></i> ${enrolledCount}/${schedule.capacity} enrolled</div>` : `<div><i class="ph ph-users"></i> ${enrolledCount} enrolled</div>`}
                ${schedule.description ? `<div class="schedule-card-description"><i class="ph ph-note"></i> ${escapeHtml(schedule.description)}</div>` : ''}
                ${canEnroll ? `
                    <div style="margin-top: 10px;">
                        ${isEnrolled 
                            ? `<button onclick="unenrollFromClass('${schedule.id}')" class="btn-unenroll" style="width: 100%; padding: 8px 12px; background: #e74c3c; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600;">Leave Class</button>`
                            : isFull 
                                ? `<button disabled class="btn-enroll-disabled" style="width: 100%; padding: 8px 12px; background: #95a5a6; color: white; border: none; border-radius: 6px; cursor: not-allowed; font-size: 13px; font-weight: 600;">Class Full</button>`
                                : `<button onclick="enrollInClass('${schedule.id}')" class="btn-enroll" style="width: 100%; padding: 8px 12px; background: #4CAF50; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600;">Join Class</button>`
                        }
                    </div>
                ` : ''}
            </div>
        `;
        
        timeline.appendChild(card);
    });
}

// Close day view modal
function closeDayView() {
    document.getElementById('dayViewModal').style.display = 'none';
}

// Navigate to previous/next day
let currentViewDate = null;

function navigateDay(direction) {
    if (!currentViewDate) return;
    
    const date = new Date(currentViewDate);
    date.setDate(date.getDate() + direction);
    
    const dateStr = formatDateLocal(date);
    currentViewDate = dateStr;
    
    viewDaySchedules(dateStr);
}

// Open schedule modal
function openScheduleModal() {
    editingScheduleId = null;
    document.getElementById('scheduleModalTitle').textContent = 'Create New Schedule';
    document.getElementById('scheduleSubmitText').textContent = 'Create Schedule';
    document.getElementById('scheduleForm').reset();
    
    // Set default date to today and minimum date to today (prevent past dates)
    const today = formatDateLocal(new Date());
    const dateInput = document.getElementById('scheduleDate');
    dateInput.value = today;
    dateInput.min = today;
    
    // Handle coach assignment based on user role
    const userStr = localStorage.getItem('user');
    const currentUser = userStr ? JSON.parse(userStr) : null;
    const coachFormGroup = document.getElementById('coachId').closest('.form-group');
    
    if (currentUser && currentUser.role === 'coach') {
        // For coach users: auto-assign themselves and hide the dropdown
        const coachInSystem = allCoaches.find(c => c.email === currentUser.email || c.name === currentUser.name);
        
        if (coachInSystem) {
            document.getElementById('coachId').value = coachInSystem.id;
        }
        
        // Hide the coach selection dropdown for coaches
        if (coachFormGroup) {
            coachFormGroup.style.display = 'none';
        }
    } else {
        // For admin users: show the dropdown and populate it
        if (coachFormGroup) {
            coachFormGroup.style.display = 'block';
        }
        populateCoachFilter();
    }
    
    document.getElementById('scheduleModal').style.display = 'flex';
}

// Close schedule modal
function closeScheduleModal() {
    document.getElementById('scheduleModal').style.display = 'none';
    editingScheduleId = null;
}

// Edit schedule
async function editSchedule(id) {
    // Check user role - only admins can edit schedules
    const userStr = localStorage.getItem('user');
    const currentUser = userStr ? JSON.parse(userStr) : null;
    
    if (!currentUser || currentUser.role !== 'admin') {
        showMessage('Only administrators can edit schedules', 'error');
        return;
    }
    
    const schedule = allSchedules.find(s => s.id === id);
    if (!schedule) return;
    
    editingScheduleId = id;
    document.getElementById('scheduleModalTitle').textContent = 'Edit Schedule';
    document.getElementById('scheduleSubmitText').textContent = 'Update Schedule';
    
    document.getElementById('className').value = schedule.className;
    document.getElementById('coachId').value = schedule.coachId;
    
    // Set date and minimum date to today (prevent past dates)
    const today = formatDateLocal(new Date());
    const dateInput = document.getElementById('scheduleDate');
    dateInput.value = schedule.date;
    dateInput.min = today;
    
    document.getElementById('startTime').value = schedule.startTime;
    document.getElementById('endTime').value = schedule.endTime;
    document.getElementById('capacity').value = schedule.capacity || '';
    document.getElementById('description').value = schedule.description || '';
    
    // Handle coach dropdown visibility based on user role
    const coachFormGroup = document.getElementById('coachId').closest('.form-group');
    
    if (currentUser && currentUser.role === 'coach') {
        // Hide coach dropdown for coaches (they can only edit their own schedules)
        if (coachFormGroup) {
            coachFormGroup.style.display = 'none';
        }
    } else {
        // Show dropdown for admins
        if (coachFormGroup) {
            coachFormGroup.style.display = 'block';
        }
        populateCoachFilter();
    }
    
    document.getElementById('scheduleModal').style.display = 'flex';
}

// Delete schedule
async function deleteSchedule(id, className) {
    // Check user role - only admins can delete schedules
    const userStr = localStorage.getItem('user');
    const currentUser = userStr ? JSON.parse(userStr) : null;
    
    if (!currentUser || currentUser.role !== 'admin') {
        showMessage('Only administrators can delete schedules', 'error');
        return;
    }
    
    if (!confirm(`Are you sure you want to delete "${className}"?`)) {
        return;
    }
    
    try {
        const response = await authenticatedFetch(`/api/schedules/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error('Failed to delete schedule');
        }
        
        showMessage('Schedule deleted successfully!', 'success');
        await loadSchedules();
        
    } catch (error) {
        console.error('Error deleting schedule:', error);
        showMessage('Error: ' + error.message, 'error');
    }
}

// Handle schedule form submission
document.getElementById('scheduleForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const scheduleData = {
        className: document.getElementById('className').value.trim(),
        coachId: document.getElementById('coachId').value,
        date: document.getElementById('scheduleDate').value,
        startTime: document.getElementById('startTime').value,
        endTime: document.getElementById('endTime').value,
        capacity: parseInt(document.getElementById('capacity').value) || null,
        description: document.getElementById('description').value.trim()
    };
    
    // Validate end time is after start time
    if (scheduleData.endTime <= scheduleData.startTime) {
        showMessage('End time must be after start time', 'error');
        return;
    }
    
    try {
        let response;
        
        if (editingScheduleId) {
            // Update existing schedule
            response = await authenticatedFetch(`/api/schedules/${editingScheduleId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(scheduleData)
            });
        } else {
            // Create new schedule
            response = await authenticatedFetch('/api/schedules', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(scheduleData)
            });
        }
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to save schedule');
        }
        
        closeScheduleModal();
        showMessage(editingScheduleId ? 'Schedule updated successfully!' : 'Schedule created successfully!', 'success');
        await loadSchedules();
        
    } catch (error) {
        console.error('Error saving schedule:', error);
        showMessage('Error: ' + error.message, 'error');
    }
});

// Show coach profile
async function showCoachProfile(coachId) {
    const coach = allCoaches.find(c => c.id === coachId);
    if (!coach) return;
    
    // Populate coach info
    document.getElementById('coachName').textContent = coach.name;
    document.getElementById('coachSpecialty').innerHTML = `<i class="ph ph-star"></i> ${coach.specialty || 'General Fitness'}`;
    document.getElementById('coachExperience').innerHTML = `<i class="ph ph-briefcase"></i> ${coach.experience || 'N/A'} years experience`;
    document.getElementById('coachBio').textContent = coach.bio || 'No bio available.';
    
    // Set photo
    const photo = document.getElementById('coachPhoto');
    if (coach.photo) {
        photo.src = coach.photo;
    } else {
        photo.src = 'https://via.placeholder.com/100?text=' + encodeURIComponent(coach.name.charAt(0));
    }
    
    // Populate skills
    const skillsContainer = document.getElementById('coachSkills');
    if (coach.skills && coach.skills.length > 0) {
        skillsContainer.innerHTML = coach.skills.map(skill => 
            `<span class="skill-tag">${escapeHtml(skill)}</span>`
        ).join('');
    } else {
        skillsContainer.innerHTML = '<p style="color: #999;">No skills listed</p>';
    }
    
    // Populate schedules
    const coachSchedules = allSchedules.filter(s => s.coachId === coachId && getScheduleStatus(s) === 'upcoming');
    const schedulesContainer = document.getElementById('coachSchedules');
    
    if (coachSchedules.length > 0) {
        schedulesContainer.innerHTML = coachSchedules.slice(0, 5).map(schedule => 
            `<li>
                <span><strong>${escapeHtml(schedule.className)}</strong><br>${formatDate(schedule.date)} at ${formatTime(schedule.startTime)}</span>
            </li>`
        ).join('');
    } else {
        schedulesContainer.innerHTML = '<li>No upcoming classes</li>';
    }
    
    // Populate availability
    const availabilityContainer = document.getElementById('coachAvailability');
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    if (coach.availability && coach.availability.length > 0) {
        availabilityContainer.innerHTML = days.map(day => 
            `<div class="availability-day ${coach.availability.includes(day) ? 'available' : ''}">${day}</div>`
        ).join('');
    } else {
        availabilityContainer.innerHTML = days.map(day => 
            `<div class="availability-day available">${day}</div>`
        ).join('');
    }
    
    document.getElementById('coachProfileModal').style.display = 'flex';
}

// Close coach profile
function closeCoachProfile() {
    document.getElementById('coachProfileModal').style.display = 'none';
}

// Utility functions
function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTime(timeStr) {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showMessage(message, type) {
    alert(message); // Simple alert for now - can be enhanced with toast notifications
}

// Authenticated fetch helper
async function authenticatedFetch(url, options = {}) {
    // Check both localStorage and sessionStorage
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    
    console.log('authenticatedFetch called for:', url);
    console.log('Token exists:', !!token);
    console.log('Token from localStorage:', !!localStorage.getItem('token'));
    console.log('Token from sessionStorage:', !!sessionStorage.getItem('token'));
    
    if (!token) {
        console.error('No token found in localStorage or sessionStorage!');
        // Redirect to login
        window.location.href = '/login.html';
        throw new Error('Not authenticated');
    }
    
    if (!options.headers) {
        options.headers = {};
    }
    
    options.headers['Authorization'] = `Bearer ${token}`;
    
    return fetch(url, options);
}

// Enroll in class
async function enrollInClass(scheduleId) {
    try {
        const userStr = localStorage.getItem('user');
        const currentUser = userStr ? JSON.parse(userStr) : null;
        
        if (!currentUser) {
            showMessage('Please login to enroll in classes', 'error');
            return;
        }
        
        const response = await authenticatedFetch(`/api/schedules/${scheduleId}/enroll`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ userId: currentUser.id })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage('Successfully enrolled in class!', 'success');
            // Reload schedules to update UI
            await loadSchedules();
            // Re-render the day view if it's open
            const dayViewModal = document.getElementById('dayViewModal');
            if (dayViewModal && dayViewModal.style.display === 'flex') {
                const schedule = allSchedules.find(s => s.id === scheduleId);
                if (schedule) {
                    viewDaySchedules(schedule.date);
                }
            }
        } else {
            showMessage(data.error || 'Failed to enroll in class', 'error');
        }
    } catch (error) {
        console.error('Error enrolling in class:', error);
        showMessage('Error enrolling in class', 'error');
    }
}

// Unenroll from class
async function unenrollFromClass(scheduleId) {
    try {
        const userStr = localStorage.getItem('user');
        const currentUser = userStr ? JSON.parse(userStr) : null;
        
        if (!currentUser) {
            showMessage('Please login', 'error');
            return;
        }
        
        if (!confirm('Are you sure you want to leave this class?')) {
            return;
        }
        
        const response = await authenticatedFetch(`/api/schedules/${scheduleId}/unenroll`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ userId: currentUser.id })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage('Successfully left the class', 'success');
            // Reload schedules to update UI
            await loadSchedules();
            // Re-render the day view if it's open
            const dayViewModal = document.getElementById('dayViewModal');
            if (dayViewModal && dayViewModal.style.display === 'flex') {
                const schedule = allSchedules.find(s => s.id === scheduleId);
                if (schedule) {
                    viewDaySchedules(schedule.date);
                }
            }
        } else {
            showMessage(data.error || 'Failed to leave class', 'error');
        }
    } catch (error) {
        console.error('Error leaving class:', error);
        showMessage('Error leaving class', 'error');
    }
}
