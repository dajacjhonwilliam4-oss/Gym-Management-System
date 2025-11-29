// Members Management JavaScript

// Track if we need to show payment modal after member creation
let showPaymentAfterCreate = false;
let createdMemberData = null;
let pendingMemberData = null; // Store member data before payment
let allMembers = [];
let filteredMembers = []; // Store filtered/sorted members
let currentUser = null;
let allCoaches = [];
let selectedCoachId = null;
let selectedCoachName = null;

// Initialize page
document.addEventListener('DOMContentLoaded', async function() {
    // Get current user info
    const userStr = localStorage.getItem('user');
    if (userStr) {
        currentUser = JSON.parse(userStr);
        
        // Show/hide admin-only elements
        if (currentUser.role === 'admin') {
            document.querySelectorAll('.admin-only').forEach(el => {
                el.style.display = '';
            });
            document.getElementById('addMemberBtn').style.display = 'inline-flex';
            document.getElementById('renewMemberBtn').style.display = 'inline-flex';
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

    // Load members
    await loadMembers();

    // Setup modal
    setupModal();

    // Setup search
    setupSearch();
    
    // Setup phone number inputs with "09" prefix protection
    setupPhoneInputs();
});

// Load all members from API
async function loadMembers() {
    try {
        const response = await authenticatedFetch('/api/members');
        
        if (!response.ok) {
            throw new Error('Failed to load members');
        }

        allMembers = await response.json();
        displayMembers(allMembers);
        updateStats();
    } catch (error) {
        console.error('Error loading members:', error);
        showMessage('Failed to load members: ' + error.message, 'error');
        document.getElementById('membersTableBody').innerHTML = `
            <tr>
                <td colspan="9" style="text-align: center; padding: 40px; color: #f44336;">
                    <i class="ph ph-warning" style="font-size: 32px;"></i>
                    <p>Failed to load members. Please try again.</p>
                </td>
            </tr>
        `;
    }
}

// Display members in table
function displayMembers(members) {
    const tbody = document.getElementById('membersTableBody');
    
    if (members.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" style="text-align: center; padding: 40px;">
                    <i class="ph ph-users" style="font-size: 32px; color: #999;"></i>
                    <p>No members found</p>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = members.map((member, index) => {
        // Automatically update status based on expiration date
        let displayStatus = member.status;
        if (member.expirationDate) {
            const expDate = new Date(member.expirationDate);
            const now = new Date();
            if (expDate <= now && member.status !== 'expired') {
                displayStatus = 'expired';
            }
        }
        
        // Display email as N/A for Trial members with placeholder emails
        const displayEmail = member.email && !member.email.includes('@trial.local') ? member.email : 'N/A';
        
        return `
        <tr>
            <td>${index + 1}</td>
            <td>${escapeHtml(member.name)}</td>
            <td>${escapeHtml(displayEmail)}</td>
            <td>${escapeHtml(member.phone)}</td>
            <td><span class="badge badge-${member.membershipType?.toLowerCase().replace(/ /g, '-')}">${escapeHtml(member.membershipType || 'N/A')}</span></td>
            <td>${escapeHtml(member.coachName || 'N/A')}</td>
            <td><span class="status-badge status-${displayStatus}">${escapeHtml(displayStatus || 'active')}</span></td>
            <td>${formatDate(member.joinDate)}</td>
            <td>${member.expirationDate ? formatDate(member.expirationDate) : 'N/A'}</td>
            <td class="actions admin-only" style="${currentUser?.role === 'admin' ? '' : 'display: none;'}">
                <button class="btn-icon btn-edit" onclick="editMember('${member.id}')" title="Edit">
                    <i class="ph ph-pencil"></i>
                </button>
                <button class="btn-icon btn-delete" onclick="deleteMember('${member.id}', '${escapeHtml(member.name)}')" title="Delete">
                    <i class="ph ph-trash"></i>
                </button>
            </td>
        </tr>
        `;
    }).join('');
}

// Update statistics
function updateStats() {
    const totalMembers = allMembers.length;
    const activeMembers = allMembers.filter(m => m.status === 'active').length;
    
    document.getElementById('totalMembers').textContent = totalMembers;
    document.getElementById('activeMembers').textContent = activeMembers;
}

// Search members
function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    
    searchInput.addEventListener('input', function() {
        applyFilters();
    });

    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            applyFilters();
        }
    });
}

// Setup phone inputs with "09" prefix protection
function setupPhoneInputs() {
    const phoneInputs = [
        document.getElementById('memberPhone'),
        document.getElementById('emergencyContactPhone')
    ];
    
    phoneInputs.forEach(input => {
        if (!input) return;
        
        // Ensure "09" prefix on input
        input.addEventListener('input', function(e) {
            let value = this.value.replace(/[^0-9]/g, ''); // Remove non-digits
            
            // Always ensure starts with "09"
            if (!value.startsWith('09')) {
                value = '09' + value.replace(/^0+/, ''); // Remove leading zeros and prepend 09
            }
            
            // Limit to 11 digits
            if (value.length > 11) {
                value = value.substring(0, 11);
            }
            
            this.value = value;
        });
        
        // Prevent deleting "09" prefix
        input.addEventListener('keydown', function(e) {
            const cursorPosition = this.selectionStart;
            const value = this.value;
            
            // Prevent deletion if it would remove "09" prefix
            if ((e.key === 'Backspace' || e.key === 'Delete') && cursorPosition <= 2) {
                e.preventDefault();
            }
            
            // Prevent selection that includes "09" prefix
            if (e.key === 'a' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                this.setSelectionRange(2, value.length);
            }
        });
        
        // Prevent pasting over "09" prefix
        input.addEventListener('paste', function(e) {
            e.preventDefault();
            const pastedText = (e.clipboardData || window.clipboardData).getData('text');
            const digitsOnly = pastedText.replace(/[^0-9]/g, '');
            
            let newValue = '09' + digitsOnly.replace(/^0+/, '');
            if (newValue.length > 11) {
                newValue = newValue.substring(0, 11);
            }
            
            this.value = newValue;
        });
        
        // Prevent cutting "09" prefix
        input.addEventListener('cut', function(e) {
            const start = this.selectionStart;
            const end = this.selectionEnd;
            
            if (start < 2) {
                e.preventDefault();
            }
        });
        
        // Focus handler - move cursor after "09" if at beginning
        input.addEventListener('focus', function() {
            if (this.value === '09') {
                setTimeout(() => {
                    this.setSelectionRange(2, 2);
                }, 0);
            }
        });
        
        // Click handler - prevent cursor before "09"
        input.addEventListener('click', function() {
            if (this.selectionStart < 2) {
                this.setSelectionRange(2, 2);
            }
        });
    });
}

// Apply all filters and sorting
function applyFilters() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
    const membershipTypeFilter = document.getElementById('membershipTypeFilter').value;
    const statusFilter = document.getElementById('statusFilter').value;
    const sortValue = document.getElementById('sortSelect').value;
    
    // Start with all members
    let filtered = [...allMembers];
    
    // Apply search filter
    if (searchTerm) {
        filtered = filtered.filter(member => {
            return member.name.toLowerCase().includes(searchTerm) ||
                   member.email.toLowerCase().includes(searchTerm) ||
                   member.phone.toLowerCase().includes(searchTerm) ||
                   (member.membershipType && member.membershipType.toLowerCase().includes(searchTerm)) ||
                   (member.coachName && member.coachName.toLowerCase().includes(searchTerm));
        });
    }
    
    // Apply membership type filter
    if (membershipTypeFilter) {
        filtered = filtered.filter(member => member.membershipType === membershipTypeFilter);
    }
    
    // Apply status filter
    if (statusFilter) {
        filtered = filtered.filter(member => {
            // Auto-detect expired status
            let memberStatus = member.status;
            if (member.expirationDate) {
                const expDate = new Date(member.expirationDate);
                const now = new Date();
                if (expDate <= now) {
                    memberStatus = 'expired';
                }
            }
            return memberStatus === statusFilter;
        });
    }
    
    // Apply sorting
    switch(sortValue) {
        case 'name-asc':
            filtered.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'name-desc':
            filtered.sort((a, b) => b.name.localeCompare(a.name));
            break;
        case 'date-newest':
            filtered.sort((a, b) => new Date(b.joinDate) - new Date(a.joinDate));
            break;
        case 'date-oldest':
            filtered.sort((a, b) => new Date(a.joinDate) - new Date(b.joinDate));
            break;
        case 'status':
            filtered.sort((a, b) => {
                const statusA = a.status || '';
                const statusB = b.status || '';
                return statusA.localeCompare(statusB);
            });
            break;
    }
    
    filteredMembers = filtered;
    displayMembers(filtered);
}

// Clear all filters
function clearAllFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('membershipTypeFilter').value = '';
    document.getElementById('statusFilter').value = '';
    document.getElementById('sortSelect').value = 'name-asc';
    applyFilters();
}

// Search members - trigger filter on input
function searchMembers() {
    applyFilters();
}

// Modal functions
function setupModal() {
    const modal = document.getElementById('memberModal');
    const addBtn = document.getElementById('addMemberBtn');
    const renewBtn = document.getElementById('renewMemberBtn');
    const closeBtn = document.querySelector('.close');
    const form = document.getElementById('memberForm');

    // Open modal for adding
    if (addBtn) {
        addBtn.onclick = function() {
            openMemberModal();
        };
    }

    // Open renew modal
    if (renewBtn) {
        renewBtn.onclick = function() {
            openRenewModal();
        };
    }

    // Close modal
    closeBtn.onclick = function() {
        closeMemberModal();
    };

    // Close on outside click
    window.onclick = function(event) {
        if (event.target == modal) {
            closeMemberModal();
        }
        const paymentModal = document.getElementById('paymentModal');
        if (event.target == paymentModal) {
            closePaymentModal();
        }
        const coachModal = document.getElementById('coachModal');
        if (event.target == coachModal) {
            closeCoachModal();
        }
    };

    // Handle form submission
    form.onsubmit = async function(e) {
        e.preventDefault();
        await saveMember();
    };

    // Setup membership type change handler
    const membershipTypeSelect = document.getElementById('membershipType');
    membershipTypeSelect.addEventListener('change', handleMembershipTypeChange);

    // Setup payment form
    const paymentForm = document.getElementById('paymentForm');
    paymentForm.onsubmit = async function(e) {
        e.preventDefault();
        await processPayment();
    };
}

// Handle membership type change - show/hide fields dynamically with smooth animations
function handleMembershipTypeChange() {
    const membershipType = document.getElementById('membershipType').value;
    const membershipTypeHint = document.getElementById('membershipTypeHint');
    
    // Get all dynamic form fields
    const emailField = document.getElementById('emailField');
    const passwordField = document.getElementById('passwordField');
    const addressField = document.getElementById('addressField');
    const studentField = document.getElementById('studentField');
    const emergencyField = document.getElementById('emergencyField');
    const emergencyPhoneField = document.getElementById('emergencyPhoneField');
    const statusField = document.getElementById('statusField');
    
    // Get input elements for validation
    const emailInput = document.getElementById('memberEmail');
    const passwordInput = document.getElementById('memberPassword');
    const addressInput = document.getElementById('memberAddress');
    
    if (membershipType === 'Trial') {
        // Update hint
        membershipTypeHint.textContent = '✓ Trial membership - Only name and age required';
        membershipTypeHint.style.color = '#4CAF50';
        
        // Hide fields with animation
        hideFieldWithAnimation(emailField);
        hideFieldWithAnimation(passwordField);
        hideFieldWithAnimation(addressField);
        hideFieldWithAnimation(studentField);
        hideFieldWithAnimation(emergencyField);
        hideFieldWithAnimation(emergencyPhoneField);
        hideFieldWithAnimation(statusField);
        
        // Uncheck student checkbox for trial (no discount on trial)
        document.getElementById('isStudent').checked = false;
        
        // Make fields not required
        document.getElementById('memberPhone').required = false;
        emailInput.required = false;
        passwordInput.required = false;
        addressInput.required = false;
        
        // Update phone label to show it's optional
        const phoneRequired = document.getElementById('phoneRequired');
        if (phoneRequired) {
            phoneRequired.style.display = 'none';
        }
        
        // Clear values including emergency contact fields
        emailInput.value = '';
        passwordInput.value = '';
        document.getElementById('emergencyContactName').value = '';
        document.getElementById('emergencyContactPhone').value = '09';
        
    } else if (membershipType === 'Monthly') {
        // Update hint
        membershipTypeHint.textContent = '✓ Monthly membership - Full registration required';
        membershipTypeHint.style.color = '#7b1fa2';
        
        // Show fields with animation
        showFieldWithAnimation(emailField);
        showFieldWithAnimation(passwordField);
        showFieldWithAnimation(addressField);
        showFieldWithAnimation(studentField);
        showFieldWithAnimation(emergencyField);
        showFieldWithAnimation(emergencyPhoneField);
        hideFieldWithAnimation(statusField);
        
        // Make fields required (except address which is optional)
        document.getElementById('memberPhone').required = true;
        emailInput.required = true;
        passwordInput.required = true;
        addressInput.required = false;
        
        // Show phone as required
        const phoneRequired = document.getElementById('phoneRequired');
        if (phoneRequired) {
            phoneRequired.style.display = 'inline';
        }
        
    } else if (membershipType === 'Annual') {
        // Update hint
        membershipTypeHint.textContent = '✓ Annual membership - Full registration required';
        membershipTypeHint.style.color = '#e65100';
        
        // Show fields with animation
        showFieldWithAnimation(emailField);
        showFieldWithAnimation(passwordField);
        showFieldWithAnimation(addressField);
        showFieldWithAnimation(studentField);
        showFieldWithAnimation(emergencyField);
        showFieldWithAnimation(emergencyPhoneField);
        hideFieldWithAnimation(statusField);
        
        // Make fields required (except address which is optional)
        document.getElementById('memberPhone').required = true;
        emailInput.required = true;
        passwordInput.required = true;
        addressInput.required = false;
        
        // Show phone as required
        const phoneRequired = document.getElementById('phoneRequired');
        if (phoneRequired) {
            phoneRequired.style.display = 'inline';
        }
        
    } else if (membershipType === 'Monthly with Coach') {
        // Update hint
        membershipTypeHint.textContent = '✓ Monthly with Coach - Full registration + coach selection';
        membershipTypeHint.style.color = '#1976d2';
        
        // Show fields with animation
        showFieldWithAnimation(emailField);
        showFieldWithAnimation(passwordField);
        showFieldWithAnimation(addressField);
        showFieldWithAnimation(studentField);
        showFieldWithAnimation(emergencyField);
        showFieldWithAnimation(emergencyPhoneField);
        hideFieldWithAnimation(statusField);
        
        // Make fields required (except address which is optional)
        document.getElementById('memberPhone').required = true;
        emailInput.required = true;
        passwordInput.required = true;
        addressInput.required = false;
        
        // Show phone as required
        const phoneRequired = document.getElementById('phoneRequired');
        if (phoneRequired) {
            phoneRequired.style.display = 'inline';
        }
        
    } else if (membershipType === 'Annual with Coach') {
        // Update hint
        membershipTypeHint.textContent = '✓ Annual with Coach - Full registration + coach selection';
        membershipTypeHint.style.color = '#d32f2f';
        
        // Show fields with animation
        showFieldWithAnimation(emailField);
        showFieldWithAnimation(passwordField);
        showFieldWithAnimation(addressField);
        showFieldWithAnimation(studentField);
        showFieldWithAnimation(emergencyField);
        showFieldWithAnimation(emergencyPhoneField);
        hideFieldWithAnimation(statusField);
        
        // Make fields required (except address which is optional)
        document.getElementById('memberPhone').required = true;
        emailInput.required = true;
        passwordInput.required = true;
        addressInput.required = false;
        
        // Show phone as required
        const phoneRequired = document.getElementById('phoneRequired');
        if (phoneRequired) {
            phoneRequired.style.display = 'inline';
        }
        
    } else {
        // Default: waiting for selection
        membershipTypeHint.textContent = 'Choose a membership type to see required fields';
        membershipTypeHint.style.color = '#666';
        
        // Show all fields
        showFieldWithAnimation(emailField);
        showFieldWithAnimation(passwordField);
        showFieldWithAnimation(addressField);
        showFieldWithAnimation(studentField);
        showFieldWithAnimation(emergencyField);
        showFieldWithAnimation(emergencyPhoneField);
        hideFieldWithAnimation(statusField);
        
        document.getElementById('memberPhone').required = true;
        emailInput.required = true;
        passwordInput.required = true;
        addressInput.required = false;
        
        // Show phone as required
        const phoneRequired = document.getElementById('phoneRequired');
        if (phoneRequired) {
            phoneRequired.style.display = 'inline';
        }
    }
}

// Helper function to show field with animation
function showFieldWithAnimation(field) {
    if (!field) return;
    
    if (field.classList.contains('hidden')) {
        field.classList.remove('hidden');
        field.classList.remove('animating-out');
        field.classList.add('animating-in');
        
        // Remove animation class after animation completes
        setTimeout(() => {
            field.classList.remove('animating-in');
        }, 400);
    }
}

// Helper function to hide field with animation
function hideFieldWithAnimation(field) {
    if (!field) return;
    
    if (!field.classList.contains('hidden')) {
        field.classList.remove('animating-in');
        field.classList.add('animating-out');
        
        // Add hidden class after animation completes
        setTimeout(() => {
            field.classList.add('hidden');
            field.classList.remove('animating-out');
        }, 300);
    }
}

function openMemberModal(memberId = null) {
    const modal = document.getElementById('memberModal');
    const form = document.getElementById('memberForm');
    const title = document.getElementById('modalTitle');
    const submitBtn = document.getElementById('submitBtnText');

    // Reset form
    form.reset();
    document.getElementById('memberId').value = '';

    if (memberId) {
        // Edit mode
        const member = allMembers.find(m => m.id === memberId);
        if (member) {
            title.textContent = 'Edit Member';
            submitBtn.textContent = 'Update Member';
            
            document.getElementById('memberId').value = member.id;
            document.getElementById('memberName').value = member.name;
            document.getElementById('memberEmail').value = member.email;
            document.getElementById('memberPassword').value = ''; // Don't show existing password
            document.getElementById('memberPassword').placeholder = 'Leave blank to keep current password';
            document.getElementById('memberPassword').required = false; // Not required for edit
            document.getElementById('memberPhone').value = member.phone;
            document.getElementById('membershipType').value = member.membershipType;
            document.getElementById('memberAddress').value = member.address || '';
            
            // Parse emergency contact if exists (format: "Name - Phone")
            if (member.emergencyContact) {
                const parts = member.emergencyContact.split(' - ');
                document.getElementById('emergencyContactName').value = parts[0] !== 'N/A' ? parts[0] : '';
                document.getElementById('emergencyContactPhone').value = parts[1] !== 'N/A' ? parts[1] : '';
            } else {
                document.getElementById('emergencyContactName').value = '';
                document.getElementById('emergencyContactPhone').value = '';
            }
            
            document.getElementById('memberStatus').value = member.status || 'active';
        }
    } else {
        // Add mode
        title.textContent = 'Add New Member';
        submitBtn.textContent = 'Add Member';
        document.getElementById('memberStatus').value = 'active';
        document.getElementById('memberPassword').required = true;
        document.getElementById('memberPassword').placeholder = 'Minimum 6 characters';
    }

    modal.style.display = 'block';
}

function closeMemberModal() {
    document.getElementById('memberModal').style.display = 'none';
}

// Save member (Add or Update)
async function saveMember() {
    const memberId = document.getElementById('memberId').value;
    const memberName = document.getElementById('memberName').value.trim();
    const memberPhone = document.getElementById('memberPhone').value.trim();
    const memberAge = document.getElementById('memberAge').value.trim();
    const password = document.getElementById('memberPassword').value.trim();
    const membershipType = document.getElementById('membershipType').value;
    const emergencyContactName = document.getElementById('emergencyContactName').value.trim();
    const emergencyContactPhone = document.getElementById('emergencyContactPhone').value.trim();
    const isStudent = document.getElementById('isStudent').checked;
    
    // Validation
    if (!memberName) {
        showMessage('Please enter member name', 'error');
        return;
    }

    // Phone validation (optional for Trial, required for others)
    if (membershipType !== 'Trial') {
        if (!memberPhone || memberPhone === '09') {
            showMessage('Please enter phone number', 'error');
            return;
        }

        // Validate phone number format (11 digits)
        if (!/^\d{11}$/.test(memberPhone)) {
            showMessage('Phone number must be exactly 11 digits', 'error');
            return;
        }
    } else {
        // For Trial, if phone is provided, validate it
        if (memberPhone && memberPhone !== '09' && !/^\d{11}$/.test(memberPhone)) {
            showMessage('Phone number must be exactly 11 digits if provided', 'error');
            return;
        }
    }

    // Validate age
    if (!memberAge || memberAge < 1 || memberAge > 150) {
        showMessage('Please enter a valid age (1-150)', 'error');
        return;
    }

    // Validate emergency contact phone if provided (skip for Trial membership)
    if (membershipType !== 'Trial' && emergencyContactPhone && emergencyContactPhone !== '09' && !/^\d{11}$/.test(emergencyContactPhone)) {
        showMessage('Emergency contact phone must be exactly 11 digits or leave it empty', 'error');
        return;
    }

    if (!membershipType) {
        showMessage('Please select membership type', 'error');
        return;
    }
    
    // Build emergency contact string only if name or phone is provided
    let emergencyContact = null;
    if (emergencyContactName || emergencyContactPhone) {
        emergencyContact = `${emergencyContactName || 'N/A'} - ${emergencyContactPhone || 'N/A'}`;
    }
    
    const memberData = {
        name: memberName,
        phone: memberPhone && memberPhone !== '09' ? memberPhone : '', // Empty if just '09'
        age: parseInt(memberAge),
        membershipType: membershipType,
        isStudent: isStudent
    };

    // For Trial members, email is optional
    if (membershipType === 'Trial') {
        memberData.email = `trial_${Date.now()}@trial.local`; // Placeholder email for trial
        memberData.address = '';
        memberData.emergencyContact = emergencyContact || '';
    } else {
        memberData.email = document.getElementById('memberEmail').value.trim();
        memberData.address = document.getElementById('memberAddress').value.trim() || ''; // Address is optional
        memberData.emergencyContact = emergencyContact || '';
        
        // Validation for non-trial members
        if (!memberData.email || memberData.email === '') {
            showMessage('Email is required for Monthly and Annual memberships', 'error');
            return;
        }

        // Password validation for new members
        if (!memberId && !password) {
            showMessage('Password is required for new members', 'error');
            return;
        }

        if (password && password.length < 6) {
            showMessage('Password must be at least 6 characters', 'error');
            return;
        }
        
        // Add password only if provided (required for new, optional for edit)
        if (password) {
            memberData.password = password;
        }
    }

    // Set status
    if (document.getElementById('memberStatus').style.display !== 'none') {
        memberData.status = document.getElementById('memberStatus').value;
    } else {
        memberData.status = 'active';
    }

    try {
        // If editing existing member, save directly
        if (memberId) {
            const response = await authenticatedFetch(`/api/members/${memberId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(memberData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to update member');
            }

            showMessage('Member updated successfully!', 'success');
            closeMemberModal();
            await loadMembers();
        } else {
            // For new members, DON'T save yet - go to payment first
            closeMemberModal();
            
            // Store member data temporarily
            pendingMemberData = memberData;
            
            // Create a temporary member object for display in payment modal
            const tempMember = {
                ...memberData,
                id: 'pending', // Temporary ID
                name: memberData.name,
                membershipType: memberData.membershipType,
                isStudent: memberData.isStudent
            };
            
            // Check if membership requires coach selection
            if (membershipType === 'Monthly with Coach' || membershipType === 'Annual with Coach') {
                // Load coaches and show coach selection modal
                await openCoachSelectionModal(tempMember);
            } else {
                // Show payment modal directly
                openPaymentModal(tempMember);
            }
        }
    } catch (error) {
        console.error('Error saving member:', error);
        showMessage('Error: ' + error.message, 'error');
    }
}

// Edit member
function editMember(memberId) {
    if (currentUser?.role !== 'admin') {
        showMessage('Only administrators can edit members', 'error');
        return;
    }
    openMemberModal(memberId);
}

// Delete member
async function deleteMember(memberId, memberName) {
    if (currentUser?.role !== 'admin') {
        showMessage('Only administrators can delete members', 'error');
        return;
    }

    if (!confirm(`Are you sure you want to delete ${memberName}?\n\nThis action cannot be undone.`)) {
        return;
    }

    try {
        const response = await authenticatedFetch(`/api/members/${memberId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to delete member');
        }

        showMessage('Member deleted successfully!', 'success');
        await loadMembers(); // Reload the list
    } catch (error) {
        console.error('Error deleting member:', error);
        showMessage('Error: ' + error.message, 'error');
    }
}

// Utility functions
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

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

// Payment Modal Functions
function openPaymentModal(member) {
    const modal = document.getElementById('paymentModal');
    const form = document.getElementById('paymentForm');
    
    // Reset form
    form.reset();
    
    // Set member info
    document.getElementById('paymentMemberId').value = member.id;
    document.getElementById('paymentMemberName').value = member.name;
    document.getElementById('paymentMembershipType').value = member.membershipType;
    document.getElementById('paymentIsStudent').value = member.isStudent || false;
    
    // Set display values
    document.getElementById('paymentSummaryName').textContent = member.name;
    document.getElementById('paymentSummaryType').textContent = member.membershipType;
    document.getElementById('paymentSummaryCoach').textContent = member.coachName || 'N/A';
    
    // Set base amount based on membership type (in Philippine Peso)
    let baseAmount = 0;
    if (member.membershipType === 'Trial') {
        baseAmount = 100.00;
    } else if (member.membershipType === 'Monthly') {
        baseAmount = 1000.00;
    } else if (member.membershipType === 'Annual') {
        baseAmount = 10000.00;
    } else if (member.membershipType === 'Monthly with Coach') {
        baseAmount = 2000.00;
    } else if (member.membershipType === 'Annual with Coach') {
        baseAmount = 20000.00;
    }
    
    // Apply student discount if applicable (10% off)
    let finalAmount = baseAmount;
    const studentDiscountRow = document.getElementById('studentDiscountRow');
    
    if (member.isStudent === true || member.isStudent === 'true') {
        const discount = baseAmount * 0.10; // 10% discount
        finalAmount = baseAmount - discount;
        
        if (studentDiscountRow) {
            studentDiscountRow.style.display = 'flex';
            const discountElement = document.getElementById('studentDiscountAmount');
            if (discountElement) {
                discountElement.textContent = '-₱' + discount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            }
        }
    } else {
        if (studentDiscountRow) {
            studentDiscountRow.style.display = 'none';
        }
    }
    
    // Format amount with comma separator
    const formattedAmount = '₱' + finalAmount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    
    document.getElementById('paymentSummaryAmount').textContent = formattedAmount;
    document.getElementById('paymentAmount').value = formattedAmount;
    
    modal.style.display = 'block';
}

function closePaymentModal() {
    const modal = document.getElementById('paymentModal');
    
    // Only allow closing after payment if member is pending (prevent skipping payment)
    if (pendingMemberData) {
        const confirmClose = confirm('Payment is required to complete member registration. Are you sure you want to cancel?');
        if (!confirmClose) {
            return; // Don't close modal
        }
        // If user confirms, clear pending data
        pendingMemberData = null;
    }
    
    modal.style.display = 'none';
    createdMemberData = null;
}

async function processPayment() {
    const memberId = document.getElementById('paymentMemberId').value;
    const memberName = document.getElementById('paymentMemberName').value;
    const membershipType = document.getElementById('paymentMembershipType').value;
    const isStudent = document.getElementById('paymentIsStudent').value === 'true';
    const amountText = document.getElementById('paymentAmount').value;
    const paymentMethod = document.getElementById('paymentMethod').value;
    const notes = document.getElementById('paymentNotes').value.trim();
    
    // Parse amount (remove ₱ and commas)
    const amount = parseFloat(amountText.replace(/[₱,]/g, ''));
    
    // Validation
    if (!amount || amount <= 0) {
        showMessage('Please enter a valid payment amount', 'error');
        return;
    }
    
    if (!paymentMethod) {
        showMessage('Please select a payment method', 'error');
        return;
    }
    
    try {
        // STEP 1: If this is a new member (pending), create the member first
        let finalMemberId = memberId;
        
        if (memberId === 'pending' && pendingMemberData) {
            // Create the member now
            const memberResponse = await authenticatedFetch('/api/members', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(pendingMemberData)
            });
            
            if (!memberResponse.ok) {
                const error = await memberResponse.json();
                throw new Error(error.error || 'Failed to create member');
            }
            
            const savedMember = await memberResponse.json();
            finalMemberId = savedMember.id;
            createdMemberData = savedMember;
        }
        
        // STEP 2: Process the payment
        const paymentData = {
            memberId: finalMemberId,
            memberName: memberName,
            membershipType: membershipType,
            isStudent: isStudent,
            amount: amount,
            paymentMethod: paymentMethod,
            paymentDate: new Date().toISOString(),
            notes: notes || `Payment for ${membershipType} membership${isStudent ? ' (Student Discount)' : ''}`,
            description: `Payment for ${membershipType} membership`,
            status: 'completed'
        };
        
        const response = await authenticatedFetch('/api/payments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(paymentData)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to process payment');
        }
        
        // Clear pending data
        pendingMemberData = null;
        
        closePaymentModal();
        
        // Show success message
        showMessage('Payment processed successfully! Member registration complete.', 'success');
        
        // Show success toast with animation
        showSuccessToast('Payment Successful!', 'Payment has been processed and member is now active.');
        
        // Reload members to show updated status
        await loadMembers();
    } catch (error) {
        console.error('Error processing payment:', error);
        showMessage('Error: ' + error.message, 'error');
    }
}

// Show success toast notification
function showSuccessToast(title = 'Payment Successful!', message = 'Payment has been processed successfully.') {
    const toast = document.getElementById('successToast');
    
    // Update toast content
    const titleElement = toast.querySelector('.toast-message strong');
    const messageElement = toast.querySelector('.toast-message p');
    
    if (titleElement) titleElement.textContent = title;
    if (messageElement) messageElement.textContent = message;
    
    toast.classList.add('show');
    
    // Auto-hide after 4 seconds
    setTimeout(() => {
        toast.classList.remove('show');
    }, 4000);
}

// Coach Selection Modal Functions
async function openCoachSelectionModal(member) {
    const modal = document.getElementById('coachModal');
    
    // Set member info
    document.getElementById('coachSelectionMemberName').textContent = member.name;
    document.getElementById('coachSelectionMembershipType').textContent = member.membershipType;
    
    // Store member data for later use
    createdMemberData = member;
    selectedCoachId = null;
    selectedCoachName = null;
    
    // Load coaches
    await loadCoaches();
    
    modal.style.display = 'block';
}

function closeCoachModal() {
    document.getElementById('coachModal').style.display = 'none';
}

async function loadCoaches() {
    try {
        const response = await authenticatedFetch('/api/coaches');
        
        if (!response.ok) {
            throw new Error('Failed to load coaches');
        }

        allCoaches = await response.json();
        displayCoachesForSelection();
    } catch (error) {
        console.error('Error loading coaches:', error);
        document.getElementById('coachList').innerHTML = `
            <div style="text-align: center; padding: 40px; color: #f44336;">
                <i class="ph ph-warning" style="font-size: 32px;"></i>
                <p>Failed to load coaches. Please try again.</p>
            </div>
        `;
    }
}

function displayCoachesForSelection() {
    const coachList = document.getElementById('coachList');
    
    if (allCoaches.length === 0) {
        coachList.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <i class="ph ph-user" style="font-size: 32px; color: #999;"></i>
                <p>No coaches available. Please add coaches first.</p>
            </div>
        `;
        return;
    }

    coachList.innerHTML = allCoaches.map(coach => `
        <div class="coach-card" onclick="selectCoach('${coach.id}', '${escapeHtml(coach.name)}')">
            <div class="coach-card-header">
                <img src="${coach.image || '/images/default-coach.png'}" alt="${escapeHtml(coach.name)}" class="coach-avatar">
                <div class="coach-info">
                    <h3>${escapeHtml(coach.name)}</h3>
                    <p class="coach-specialty">${escapeHtml(coach.specialty || 'General Fitness')}</p>
                </div>
            </div>
            <div class="coach-card-body">
                <p class="coach-bio">${escapeHtml(coach.bio || 'No bio available')}</p>
                ${coach.certifications ? `
                    <div class="coach-certifications">
                        <strong>Certifications:</strong>
                        <p>${escapeHtml(coach.certifications)}</p>
                    </div>
                ` : ''}
                ${coach.schedule ? `
                    <div class="coach-schedule">
                        <strong><i class="ph ph-calendar"></i> Schedule:</strong>
                        <p>${escapeHtml(coach.schedule)}</p>
                    </div>
                ` : ''}
            </div>
            <div class="coach-card-footer">
                <button class="btn-select-coach">
                    <i class="ph ph-check-circle"></i> Select This Coach
                </button>
            </div>
        </div>
    `).join('');
}

async function selectCoach(coachId, coachName) {
    selectedCoachId = coachId;
    selectedCoachName = coachName;
    
    // Store coach selection in pending member data
    if (pendingMemberData) {
        pendingMemberData.coachId = coachId;
        pendingMemberData.coachName = coachName;
        
        // Update the temp member object for display
        if (createdMemberData && createdMemberData.id === 'pending') {
            createdMemberData.coachId = coachId;
            createdMemberData.coachName = coachName;
        }
        
        showMessage(`Coach ${coachName} selected!`, 'success');
        closeCoachModal();
        
        // Now show payment modal with coach info
        openPaymentModal({
            ...pendingMemberData,
            id: 'pending',
            coachName: coachName
        });
    } else {
        // If member already exists, update them
        try {
            const response = await authenticatedFetch(`/api/members/${createdMemberData.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...createdMemberData,
                    coachId: coachId,
                    coachName: coachName
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to assign coach');
            }
            
            const updatedMember = await response.json();
            createdMemberData = updatedMember;
            
            showMessage(`Coach ${coachName} assigned successfully!`, 'success');
            closeCoachModal();
            await loadMembers();
            
            openPaymentModal(updatedMember);
        } catch (error) {
            console.error('Error assigning coach:', error);
            showMessage('Error assigning coach: ' + error.message, 'error');
        }
    }
}
// Renew Membership Modal Functions
function openRenewModal() {
    const modal = document.getElementById('renewModal');
    const form = document.getElementById('renewForm');
    const memberSelect = document.getElementById('renewMemberSelect');
    
    // Reset form
    form.reset();
    
    // Clear and populate member dropdown
    memberSelect.innerHTML = '<option value="">-- Select a Member --</option>';
    
    // Add all members to dropdown, sorted by name (exclude Trial members)
    const sortedMembers = [...allMembers]
        .filter(member => member.membershipType !== 'Trial') // Exclude Trial members
        .sort((a, b) => a.name.localeCompare(b.name));
    
    sortedMembers.forEach(member => {
        const option = document.createElement('option');
        option.value = member.id;
        
        // Check if expired
        let isExpired = false;
        if (member.expirationDate) {
            const expDate = new Date(member.expirationDate);
            const now = new Date();
            if (expDate <= now) {
                isExpired = true;
            }
        }
        
        option.textContent = `${member.name} ${member.membershipType || 'N/A'}${isExpired ? ' (EXPIRED)' : ''}`;
        memberSelect.appendChild(option);
    });
    
    // Setup event listeners
    memberSelect.onchange = handleRenewMemberSelection;
    document.getElementById('renewMembershipType').onchange = updateRenewPaymentSummary;
    document.getElementById('renewIsStudent').onchange = updateRenewPaymentSummary;
    
    // Setup form submission
    form.onsubmit = async function(e) {
        e.preventDefault();
        await processRenewal();
    };
    
    modal.style.display = 'block';
}

function closeRenewModal() {
    document.getElementById('renewModal').style.display = 'none';
}

function handleRenewMemberSelection() {
    const memberId = document.getElementById('renewMemberSelect').value;
    const memberInfo = document.getElementById('renewMemberInfo');
    
    if (!memberId) {
        memberInfo.style.display = 'none';
        document.getElementById('renewPaymentInfo').style.display = 'none';
        document.getElementById('renewPaymentFields').style.display = 'none';
        return;
    }
    
    // Find selected member
    const member = allMembers.find(m => m.id === memberId);
    if (!member) return;
    
    // Display member info
    document.getElementById('renewInfoName').textContent = member.name;
    document.getElementById('renewInfoType').textContent = member.membershipType || 'N/A';
    
    // Check if expired
    let statusText = member.status || 'active';
    let statusColor = '#4CAF50';
    if (member.expirationDate) {
        const expDate = new Date(member.expirationDate);
        const now = new Date();
        if (expDate <= now) {
            statusText = 'expired';
            statusColor = '#f44336';
        }
    }
    
    const statusSpan = document.getElementById('renewInfoStatus');
    statusSpan.textContent = statusText;
    statusSpan.style.color = statusColor;
    statusSpan.style.fontWeight = 'bold';
    statusSpan.style.textTransform = 'uppercase';
    
    document.getElementById('renewInfoExpiration').textContent = member.expirationDate ? formatDate(member.expirationDate) : 'N/A';
    
    memberInfo.style.display = 'block';
    
    // Update payment summary if membership type is selected
    updateRenewPaymentSummary();
}

function updateRenewPaymentSummary() {
    const membershipType = document.getElementById('renewMembershipType').value;
    const isStudent = document.getElementById('renewIsStudent').checked;
    const paymentInfo = document.getElementById('renewPaymentInfo');
    const paymentFields = document.getElementById('renewPaymentFields');
    
    if (!membershipType) {
        paymentInfo.style.display = 'none';
        paymentFields.style.display = 'none';
        return;
    }
    
    // Calculate base amount
    let baseAmount = 0;
    if (membershipType === 'Monthly') {
        baseAmount = 1000.00;
    } else if (membershipType === 'Annual') {
        baseAmount = 10000.00;
    } else if (membershipType === 'Monthly with Coach') {
        baseAmount = 2000.00;
    } else if (membershipType === 'Annual with Coach') {
        baseAmount = 20000.00;
    }
    
    // Apply student discount
    let discount = 0;
    let finalAmount = baseAmount;
    if (isStudent) {
        discount = baseAmount * 0.10;
        finalAmount = baseAmount - discount;
    }
    
    // Update display
    document.getElementById('renewBaseAmount').textContent = '₱' + baseAmount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    
    const discountRow = document.getElementById('renewDiscountRow');
    if (isStudent) {
        discountRow.style.display = 'flex';
        document.getElementById('renewDiscountAmount').textContent = '-₱' + discount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    } else {
        discountRow.style.display = 'none';
    }
    
    document.getElementById('renewTotalAmount').textContent = '₱' + finalAmount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    
    paymentInfo.style.display = 'block';
    paymentFields.style.display = 'block';
}

async function processRenewal() {
    const memberId = document.getElementById('renewMemberSelect').value;
    const membershipType = document.getElementById('renewMembershipType').value;
    const isStudent = document.getElementById('renewIsStudent').checked;
    const paymentMethod = document.getElementById('renewPaymentMethod').value;
    const notes = document.getElementById('renewPaymentNotes').value.trim();
    
    // Validation
    if (!memberId) {
        showMessage('Please select a member to renew', 'error');
        return;
    }
    
    if (!membershipType) {
        showMessage('Please select a membership type', 'error');
        return;
    }
    
    if (!paymentMethod) {
        showMessage('Please select a payment method', 'error');
        return;
    }
    
    // Find member
    const member = allMembers.find(m => m.id === memberId);
    if (!member) {
        showMessage('Member not found', 'error');
        return;
    }
    
    // Calculate amount
    let baseAmount = 0;
    if (membershipType === 'Monthly') {
        baseAmount = 1000.00;
    } else if (membershipType === 'Annual') {
        baseAmount = 10000.00;
    } else if (membershipType === 'Monthly with Coach') {
        baseAmount = 2000.00;
    } else if (membershipType === 'Annual with Coach') {
        baseAmount = 20000.00;
    }
    
    let finalAmount = baseAmount;
    if (isStudent) {
        const discount = baseAmount * 0.10;
        finalAmount = baseAmount - discount;
    }
    
    try {
        // Calculate new expiration date
        let newExpirationDate;
        const currentExpDate = member.expirationDate ? new Date(member.expirationDate) : new Date();
        const now = new Date();
        
        // If current membership is expired, start from today
        const startDate = currentExpDate > now ? currentExpDate : now;
        
        if (membershipType === 'Monthly' || membershipType === 'Monthly with Coach') {
            newExpirationDate = new Date(startDate);
            newExpirationDate.setMonth(newExpirationDate.getMonth() + 1);
        } else if (membershipType === 'Annual' || membershipType === 'Annual with Coach') {
            newExpirationDate = new Date(startDate);
            newExpirationDate.setFullYear(newExpirationDate.getFullYear() + 1);
        }
        
        // Update member with new membership type and expiration date
        const updateData = {
            membershipType: membershipType,
            expirationDate: newExpirationDate.toISOString(),
            status: 'active',
            isStudent: isStudent
        };
        
        // If coach-based membership, keep existing coach or require selection
        if (membershipType === 'Monthly with Coach' || membershipType === 'Annual with Coach') {
            if (member.coachId) {
                updateData.coachId = member.coachId;
                updateData.coachName = member.coachName;
            }
        }
        
        const memberResponse = await authenticatedFetch(`/api/members/${memberId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updateData)
        });
        
        if (!memberResponse.ok) {
            const error = await memberResponse.json();
            throw new Error(error.error || 'Failed to update member');
        }
        
        // Process payment
        const paymentData = {
            memberId: memberId,
            memberName: member.name,
            membershipType: membershipType,
            isStudent: isStudent,
            amount: finalAmount,
            paymentMethod: paymentMethod,
            paymentDate: new Date().toISOString(),
            notes: notes || `Membership renewal - ${membershipType}${isStudent ? ' (Student Discount)' : ''}`,
            description: `Membership renewal for ${membershipType}`,
            status: 'completed'
        };
        
        const paymentResponse = await authenticatedFetch('/api/payments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(paymentData)
        });
        
        if (!paymentResponse.ok) {
            const error = await paymentResponse.json();
            throw new Error(error.error || 'Failed to process payment');
        }
        
        closeRenewModal();
        
        // Show success message
        showMessage(`Membership renewed successfully for ${member.name}!`, 'success');
        
        // Show success toast
        showSuccessToast('Renewal Successful!', `${member.name}'s membership has been renewed until ${formatDate(newExpirationDate)}`);
        
        // Reload members
        await loadMembers();
    } catch (error) {
        console.error('Error processing renewal:', error);
        showMessage('Error: ' + error.message, 'error');
    }
}
