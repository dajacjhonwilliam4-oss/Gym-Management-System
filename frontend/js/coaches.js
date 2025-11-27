// Coaches Management JavaScript
let allCoaches = [];
let currentUser = null;

// Initialize page
document.addEventListener('DOMContentLoaded', async function() {
    // Get current user info
    const userStr = localStorage.getItem('user');
    if (userStr) {
        currentUser = JSON.parse(userStr);
        
        // Show/hide admin-only elements
        if (currentUser.role === 'admin') {
            document.getElementById('addCoachBtn').style.display = 'inline-flex';
            document.querySelectorAll('.nav-item-admin').forEach(el => {
                el.style.display = '';
            });
        } else {
            // Hide admin menu items for members and coaches
            document.querySelectorAll('.nav-item-admin').forEach(el => {
                el.style.display = 'none';
            });
        }
    }

    // Load coaches
    await loadCoaches();

    // Setup modal
    setupModal();

    // Setup search
    setupSearch();
});

// Load all coaches from API
async function loadCoaches() {
    try {
        const response = await authenticatedFetch('/api/coaches');
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Server returned ${response.status}`);
        }

        allCoaches = await response.json();
        console.log('Loaded coaches:', allCoaches); // Debug log
        displayCoaches(allCoaches);
        updateStats();
    } catch (error) {
        console.error('Error loading coaches:', error);
        showMessage('Failed to load coaches: ' + error.message, 'error');
        document.getElementById('coachesGrid').innerHTML = `
            <div style="text-align: center; padding: 40px; color: #f44336; grid-column: 1 / -1;">
                <i class="ph ph-warning" style="font-size: 32px;"></i>
                <p>Failed to load coaches. Please try again.</p>
                <p style="font-size: 12px; color: #999; margin-top: 10px;">Error: ${error.message}</p>
            </div>
        `;
    }
}

// Display coaches in grid
function displayCoaches(coaches) {
    const grid = document.getElementById('coachesGrid');
    
    if (coaches.length === 0) {
        grid.innerHTML = `
            <div style="text-align: center; padding: 40px; grid-column: 1 / -1;">
                <i class="ph ph-users" style="font-size: 32px; color: #999;"></i>
                <p>No coaches found</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = coaches.map(coach => {
        // Handle both 'id' and 'Id' (case sensitivity)
        const coachId = coach.id || coach.Id;
        return `
        <div class="coach-card">
            <img src="https://via.placeholder.com/90" alt="Coach" class="coach-photo">
            <h3 class="coach-name">${escapeHtml(coach.name)}</h3>
            <p class="coach-role">${escapeHtml(coach.specialization || 'N/A')}</p>
            <p class="coach-contact">📞 ${escapeHtml(coach.phone)}</p>
            <p class="coach-email" style="font-size: 12px; opacity: 0.8;">✉️ ${escapeHtml(coach.email)}</p>
            ${coach.experience ? `<p class="coach-experience" style="font-size: 12px; margin-top: 5px;">Experience: ${coach.experience} years</p>` : ''}
            <span class="status-badge status-${coach.status || 'active'}" style="display: inline-block; margin: 10px 0;">${escapeHtml(coach.status || 'active')}</span>
            ${currentUser?.role === 'admin' ? `
                <div style="margin-top: 10px; display: flex; gap: 5px; justify-content: center;">
                    <button class="btn-icon btn-edit" onclick="editCoach('${coachId}')" title="Edit" style="padding: 5px 10px;">
                        <i class="ph ph-pencil"></i> Edit
                    </button>
                    <button class="btn-icon btn-delete" onclick="deleteCoach('${coachId}', '${escapeHtml(coach.name)}')" title="Delete" style="padding: 5px 10px;">
                        <i class="ph ph-trash"></i> Delete
                    </button>
                </div>
            ` : `
                <button class="view-btn">View Profile</button>
            `}
        </div>
    `;
    }).join('');
}

// Update statistics
function updateStats() {
    const totalCoaches = allCoaches.length;
    const activeCoaches = allCoaches.filter(c => c.status === 'active' || !c.status).length;
    
    document.getElementById('totalCoaches').textContent = totalCoaches;
    document.getElementById('activeCoaches').textContent = activeCoaches;
}

// Search coaches
function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    
    searchInput.addEventListener('input', function() {
        searchCoaches();
    });

    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchCoaches();
        }
    });
}

function searchCoaches() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
    
    if (!searchTerm) {
        displayCoaches(allCoaches);
        return;
    }

    const filtered = allCoaches.filter(coach => {
        return coach.name.toLowerCase().includes(searchTerm) ||
               coach.email.toLowerCase().includes(searchTerm) ||
               coach.phone.toLowerCase().includes(searchTerm) ||
               (coach.specialization && coach.specialization.toLowerCase().includes(searchTerm));
    });

    displayCoaches(filtered);
}

// Modal functions
function setupModal() {
    const modal = document.getElementById('coachModal');
    const addBtn = document.getElementById('addCoachBtn');
    const closeBtn = document.querySelector('.close');
    const form = document.getElementById('coachForm');

    // Open modal for adding
    if (addBtn) {
        addBtn.onclick = function() {
            openCoachModal();
        };
    }

    // Close modal
    closeBtn.onclick = function() {
        closeCoachModal();
    };

    // Close on outside click
    window.onclick = function(event) {
        if (event.target == modal) {
            closeCoachModal();
        }
    };

    // Handle form submission
    form.onsubmit = async function(e) {
        e.preventDefault();
        await saveCoach();
    };
}

function openCoachModal(coachId = null) {
    const modal = document.getElementById('coachModal');
    const form = document.getElementById('coachForm');
    const title = document.getElementById('modalTitle');
    const submitBtn = document.getElementById('submitBtnText');

    // Reset form
    form.reset();
    document.getElementById('coachId').value = '';

    if (coachId) {
        // Edit mode
        const coach = allCoaches.find(c => (c.id || c.Id) === coachId);
        if (coach) {
            title.textContent = 'Edit Coach';
            submitBtn.textContent = 'Update Coach';
            
            document.getElementById('coachId').value = coach.id;
            document.getElementById('coachName').value = coach.name;
            document.getElementById('coachEmail').value = coach.email;
            document.getElementById('coachPassword').value = ''; // Don't show existing password
            document.getElementById('coachPassword').placeholder = 'Leave blank to keep current password';
            document.getElementById('coachPassword').required = false; // Not required for edit
            document.getElementById('coachPhone').value = coach.phone;
            document.getElementById('specialization').value = coach.specialization || '';
            document.getElementById('experience').value = coach.experience || '';
            document.getElementById('certifications').value = coach.certifications || '';
            document.getElementById('bio').value = coach.bio || '';
            document.getElementById('coachStatus').value = coach.status || 'active';
        }
    } else {
        // Add mode
        title.textContent = 'Add New Coach';
        submitBtn.textContent = 'Add Coach';
        document.getElementById('coachStatus').value = 'active';
        document.getElementById('coachPassword').required = true;
        document.getElementById('coachPassword').placeholder = 'Minimum 6 characters';
    }

    modal.style.display = 'block';
}

function closeCoachModal() {
    document.getElementById('coachModal').style.display = 'none';
}

// Save coach (Add or Update)
async function saveCoach() {
    const coachId = document.getElementById('coachId').value;
    const password = document.getElementById('coachPassword').value;
    
    const coachData = {
        name: document.getElementById('coachName').value.trim(),
        email: document.getElementById('coachEmail').value.trim(),
        phone: document.getElementById('coachPhone').value.trim(),
        specialization: document.getElementById('specialization').value.trim(),
        status: document.getElementById('coachStatus').value
    };

    // Add password only if provided (required for new, optional for edit)
    if (password) {
        coachData.password = password;
    }

    // Add optional fields only if they have values
    const experience = document.getElementById('experience').value;
    if (experience && experience.trim() !== '') {
        coachData.experience = parseInt(experience);
    }

    const certifications = document.getElementById('certifications').value.trim();
    if (certifications) {
        coachData.certifications = certifications;
    }

    const bio = document.getElementById('bio').value.trim();
    if (bio) {
        coachData.bio = bio;
    }

    // Validation
    if (!coachData.name || !coachData.email || !coachData.phone || !coachData.specialization) {
        showMessage('Please fill in all required fields', 'error');
        return;
    }

    // Password validation for new coaches
    if (!coachId && !password) {
        showMessage('Password is required for new coaches', 'error');
        return;
    }

    if (password && password.length < 6) {
        showMessage('Password must be at least 6 characters', 'error');
        return;
    }

    try {
        const url = coachId ? `/api/coaches/${coachId}` : '/api/coaches';
        const method = coachId ? 'PUT' : 'POST';

        const response = await authenticatedFetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(coachData)
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Unknown error' }));
            console.error('Server error details:', error);
            throw new Error(error.error || error.message || 'Failed to save coach');
        }

        const message = coachId ? 'Coach updated successfully!' : 'Coach added successfully!';
        showMessage(message, 'success');
        
        closeCoachModal();
        await loadCoaches(); // Reload the list
    } catch (error) {
        console.error('Error saving coach:', error);
        showMessage('Error: ' + error.message, 'error');
    }
}

// Edit coach
function editCoach(coachId) {
    if (currentUser?.role !== 'admin') {
        showMessage('Only administrators can edit coaches', 'error');
        return;
    }
    openCoachModal(coachId);
}

// Delete coach
async function deleteCoach(coachId, coachName) {
    if (currentUser?.role !== 'admin') {
        showMessage('Only administrators can delete coaches', 'error');
        return;
    }

    if (!confirm(`Are you sure you want to delete ${coachName}?\n\nThis action cannot be undone.`)) {
        return;
    }

    try {
        const response = await authenticatedFetch(`/api/coaches/${coachId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to delete coach');
        }

        showMessage('Coach deleted successfully!', 'success');
        await loadCoaches(); // Reload the list
    } catch (error) {
        console.error('Error deleting coach:', error);
        showMessage('Error: ' + error.message, 'error');
    }
}

// Utility functions
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showMessage(message, type) {
    // Create message element
    const messageDiv = document.createElement('div');
    messageDiv.className = `alert alert-${type}`;
    messageDiv.innerHTML = `
        <i class="ph ph-${type === 'success' ? 'check-circle' : 'warning-circle'}"></i>
        <span>${message}</span>
    `;

    // Insert at top of content
    const content = document.querySelector('.content');
    content.insertBefore(messageDiv, content.firstChild);

    // Auto remove after 5 seconds
    setTimeout(() => {
        messageDiv.remove();
    }, 5000);
}
