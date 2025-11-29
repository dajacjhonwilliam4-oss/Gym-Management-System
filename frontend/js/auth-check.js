// Authentication check for protected pages
// Include this script in all protected pages (dashboard, members, coaches, etc.)

(function() {
  // Get token from storage
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  
  // List of public pages that don't require authentication
  const publicPages = ['login.html', 'register.html'];
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  
  // If on a public page, redirect to dashboard if already logged in
  if (publicPages.includes(currentPage) && token) {
    verifyAndRedirect(token);
    return;
  }
  
  // If not on a public page and no token, redirect to login
  if (!publicPages.includes(currentPage) && !token) {
    window.location.href = '/login.html';
    return;
  }
  
  // Verify token if present
  if (token && !publicPages.includes(currentPage)) {
    verifyToken(token);
  }
  
  function verifyToken(token) {
    fetch('/api/auth/verify', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Invalid token');
      }
      return response.json();
    })
    .then(data => {
      // Store user info
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Update UI with user info if elements exist
      updateUserUI(data.user);
    })
    .catch(error => {
      console.error('Token verification failed:', error);
      // Clear invalid token
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      localStorage.removeItem('user');
      // Redirect to login
      window.location.href = '/login.html';
    });
  }
  
  function verifyAndRedirect(token) {
    fetch('/api/auth/verify', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => {
      if (response.ok) {
        return response.json();
      }
      throw new Error('Invalid token');
    })
    .then(data => {
      // Already logged in, redirect to dashboard
      window.location.href = '/dashboard.html';
    })
    .catch(error => {
      // Invalid token, clear it
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      localStorage.removeItem('user');
    });
  }
  
  function updateUserUI(user) {
    // Update user name in header if element exists
    const userNameElement = document.getElementById('userName');
    if (userNameElement) {
      // Add role badge for member and coach accounts
      if (user.role === 'member' || user.role === 'coach') {
        const roleText = user.role.charAt(0).toUpperCase() + user.role.slice(1);
        const roleColor = user.role === 'member' ? '#667eea' : '#f5576c';
        userNameElement.innerHTML = `
          ${user.name}
          <span style="
            display: inline-block;
            background: ${roleColor};
            color: white;
            font-size: 11px;
            font-weight: 600;
            padding: 3px 8px;
            border-radius: 12px;
            margin-left: 8px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          ">${roleText}</span>
        `;
      } else {
        userNameElement.textContent = user.name;
      }
    }
    
    // Update profile picture if element exists
    const userProfilePic = document.getElementById('userProfilePic');
    if (userProfilePic && user.profilePicture) {
      userProfilePic.src = user.profilePicture;
    }
    
    // Show/hide elements based on role
    if (user.role) {
      document.body.setAttribute('data-user-role', user.role);
    }

    // Control sidebar navigation based on role
    if (user.role !== 'admin') {
        // Hide admin-only menu items (Dashboard, Members, Payment History, Admin Users)
        document.querySelectorAll('.nav-item-admin').forEach(el => {
            el.style.display = 'none';
        });
        
        // Redirect non-admin users if they try to access admin-only pages
        const adminOnlyPages = ['dashboard.html', 'members.html', 'payments.html', 'admin-users.html'];
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        
        if (adminOnlyPages.includes(currentPage)) {
            // Redirect to coaches page (default page for members and coaches)
            window.location.href = '/coaches.html';
        }
    }
  }
})();

// Logout function
function logout() {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  
  if (token) {
    fetch('/api/auth/logout', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(() => {
      // Clear storage
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Redirect to login
      window.location.href = '/login.html';
    })
    .catch(error => {
      console.error('Logout error:', error);
      // Still clear local data and redirect
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login.html';
    });
  } else {
    window.location.href = '/login.html';
  }
}

// Function to make authenticated API calls
function authenticatedFetch(url, options = {}) {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  
  if (!token) {
    window.location.href = '/login.html';
    return Promise.reject(new Error('No authentication token'));
  }
  
  // Add authorization header
  options.headers = {
    ...options.headers,
    'Authorization': `Bearer ${token}`
  };
  
  return fetch(url, options)
    .then(response => {
      // If unauthorized, redirect to login
      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login.html';
        throw new Error('Authentication required');
      }
      return response;
    });
}

