// Members Management JavaScript

// Track if we need to show payment modal after member creation
let showPaymentAfterCreate = false;
let createdMemberData = null;
let allMembers = [];
let currentUser = null;

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
        
        return `
        <tr>
            <td>${index + 1}</td>
            <td>${escapeHtml(member.name)}</td>
            <td>${escapeHtml(member.email || 'N/A')}</td>
            <td>${escapeHtml(member.phone)}</td>
            <td><span class="badge badge-${member.membershipType?.toLowerCase()}">${escapeHtml(member.membershipType || 'N/A')}</span></td>
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
        searchMembers();
    });

    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchMembers();
        }
    });
}

function searchMembers() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
    
    if (!searchTerm) {
        displayMembers(allMembers);
        return;
    }

    const filtered = allMembers.filter(member => {
        return member.name.toLowerCase().includes(searchTerm) ||
               member.email.toLowerCase().includes(searchTerm) ||
               member.phone.toLowerCase().includes(searchTerm) ||
               (member.membershipType && member.membershipType.toLowerCase().includes(searchTerm));
    });

    displayMembers(filtered);
}

// Modal functions
function setupModal() {
    const modal = document.getElementById('memberModal');
    const addBtn = document.getElementById('addMemberBtn');
    const closeBtn = document.querySelector('.close');
    const form = document.getElementById('memberForm');

    // Open modal for adding
    if (addBtn) {
        addBtn.onclick = function() {
            openMemberModal();
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
    const emergencyField = document.getElementById('emergencyField');
    const statusField = document.getElementById('statusField');
    
    // Get input elements for validation
    const emailInput = document.getElementById('memberEmail');
    const passwordInput = document.getElementById('memberPassword');
    const addressInput = document.getElementById('memberAddress');
    
    if (membershipType === 'Trial') {
        // Update hint
        membershipTypeHint.textContent = '✓ Trial membership - Only name and phone required';
        membershipTypeHint.style.color = '#4CAF50';
        
        // Hide fields with animation
        hideFieldWithAnimation(emailField);
        hideFieldWithAnimation(passwordField);
        hideFieldWithAnimation(addressField);
        hideFieldWithAnimation(emergencyField);
        hideFieldWithAnimation(statusField);
        
        // Make fields not required
        emailInput.required = false;
        passwordInput.required = false;
        addressInput.required = false;
        
        // Clear values
        emailInput.value = '';
        passwordInput.value = '';
        
    } else if (membershipType === 'Monthly') {
        // Update hint
        membershipTypeHint.textContent = '✓ Monthly membership - Full registration required';
        membershipTypeHint.style.color = '#7b1fa2';
        
        // Show fields with animation
        showFieldWithAnimation(emailField);
        showFieldWithAnimation(passwordField);
        showFieldWithAnimation(addressField);
        showFieldWithAnimation(emergencyField);
        hideFieldWithAnimation(statusField);
        
        // Make fields required
        emailInput.required = true;
        passwordInput.required = true;
        addressInput.required = true;
        
    } else if (membershipType === 'Annual') {
        // Update hint
        membershipTypeHint.textContent = '✓ Annual membership - Full registration required';
        membershipTypeHint.style.color = '#e65100';
        
        // Show fields with animation
        showFieldWithAnimation(emailField);
        showFieldWithAnimation(passwordField);
        showFieldWithAnimation(addressField);
        showFieldWithAnimation(emergencyField);
        hideFieldWithAnimation(statusField);
        
        // Make fields required
        emailInput.required = true;
        passwordInput.required = true;
        addressInput.required = true;
        
    } else {
        // Default: waiting for selection
        membershipTypeHint.textContent = 'Choose a membership type to see required fields';
        membershipTypeHint.style.color = '#666';
        
        // Show all fields
        showFieldWithAnimation(emailField);
        showFieldWithAnimation(passwordField);
        showFieldWithAnimation(addressField);
        showFieldWithAnimation(emergencyField);
        hideFieldWithAnimation(statusField);
        
        emailInput.required = true;
        passwordInput.required = true;
        addressInput.required = false;
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
            document.getElementById('emergencyContact').value = member.emergencyContact || '';
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
    const password = document.getElementById('memberPassword').value;
    const membershipType = document.getElementById('membershipType').value;
    
    const memberData = {
        name: document.getElementById('memberName').value.trim(),
        phone: document.getElementById('memberPhone').value.trim(),
        membershipType: membershipType,
    };

    // For Trial members, email is optional
    if (membershipType === 'Trial') {
        memberData.email = `trial_${Date.now()}@trial.local`; // Placeholder email for trial
        memberData.address = '';
        memberData.emergencyContact = '';
    } else {
        memberData.email = document.getElementById('memberEmail').value.trim();
        memberData.address = document.getElementById('memberAddress').value.trim();
        memberData.emergencyContact = document.getElementById('emergencyContact').value.trim();
        
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

    // Validation
    if (!memberData.name || !memberData.phone || !memberData.membershipType) {
        showMessage('Please fill in all required fields', 'error');
        return;
    }

    // Validation for non-trial members
    if (membershipType !== 'Trial') {
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
    }

    try {
        const url = memberId ? `/api/members/${memberId}` : '/api/members';
        const method = memberId ? 'PUT' : 'POST';

        const response = await authenticatedFetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(memberData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to save member');
        }

        const savedMember = await response.json();
        const message = memberId ? 'Member updated successfully!' : 'Member added successfully!';
        showMessage(message, 'success');
        
        closeMemberModal();
        await loadMembers(); // Reload the list

        // Show payment modal for Monthly or Annual memberships (only for new members)
        if (!memberId && (membershipType === 'Monthly' || membershipType === 'Annual')) {
            createdMemberData = savedMember;
            openPaymentModal(savedMember);
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
    
    // Set display values
    document.getElementById('paymentSummaryName').textContent = member.name;
    document.getElementById('paymentSummaryType').textContent = member.membershipType;
    
    // Set suggested amount based on membership type
    let suggestedAmount = 0;
    if (member.membershipType === 'Monthly') {
        suggestedAmount = 50.00; // Example price
        document.getElementById('paymentSummaryAmount').textContent = '$50.00 (suggested)';
    } else if (member.membershipType === 'Annual') {
        suggestedAmount = 500.00; // Example price
        document.getElementById('paymentSummaryAmount').textContent = '$500.00 (suggested)';
    }
    
    document.getElementById('paymentAmount').value = suggestedAmount;
    
    modal.style.display = 'block';
}

function closePaymentModal() {
    document.getElementById('paymentModal').style.display = 'none';
    createdMemberData = null;
}

async function processPayment() {
    const memberId = document.getElementById('paymentMemberId').value;
    const memberName = document.getElementById('paymentMemberName').value;
    const membershipType = document.getElementById('paymentMembershipType').value;
    const amount = parseFloat(document.getElementById('paymentAmount').value);
    const paymentMethod = document.getElementById('paymentMethod').value;
    const notes = document.getElementById('paymentNotes').value.trim();
    
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
        const paymentData = {
            memberId: memberId,
            memberName: memberName,
            amount: amount,
            paymentMethod: paymentMethod,
            paymentDate: new Date().toISOString(),
            membershipType: membershipType,
            notes: notes || `Payment for ${membershipType} membership`,
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
        
        showMessage('Payment processed successfully!', 'success');
        closePaymentModal();
    } catch (error) {
        console.error('Error processing payment:', error);
        showMessage('Error: ' + error.message, 'error');
    }
}
