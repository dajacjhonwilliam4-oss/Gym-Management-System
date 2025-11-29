// Login Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
  const loginForm = document.getElementById('loginForm');
  const messageDiv = document.getElementById('message');
  const googleSignInBtn = document.getElementById('googleSignInBtn');

  // Handle traditional login
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const rememberMe = document.getElementById('rememberMe').checked;

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password, rememberMe })
      });

      const data = await response.json();

      if (response.ok) {
        // Store token
        if (rememberMe) {
          localStorage.setItem('token', data.token);
        } else {
          sessionStorage.setItem('token', data.token);
        }
        
        // Store user info
        localStorage.setItem('user', JSON.stringify(data.user));
        
        showMessage('Login successful! Redirecting...', 'success');
        
        // Redirect based on role
        setTimeout(() => {
          window.location.href = getDashboardUrl(data.user.role);
        }, 1000);
      } else {
        showMessage(data.error || 'Login failed. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Login error:', error);
      showMessage('An error occurred. Please try again.', 'error');
    }
  });

  // Handle Google Sign In (custom button)
  if (googleSignInBtn) {
    googleSignInBtn.addEventListener('click', () => {
      // Redirect to Google OAuth
      window.location.href = '/api/auth/google';
    });
  }

  // Helper function to show messages
  function showMessage(message, type) {
    messageDiv.textContent = message;
    messageDiv.className = `message ${type}`;
    messageDiv.classList.remove('hidden');
    
    // Auto-hide after 5 seconds for non-success messages
    if (type !== 'success') {
      setTimeout(() => {
        messageDiv.classList.add('hidden');
      }, 5000);
    }
  }

  // Get dashboard URL based on role
  function getDashboardUrl(role) {
    switch(role) {
      case 'admin':
        return '/dashboard.html';
      case 'coach':
        return '/schedules.html';
      case 'member':
        return '/coaches.html';
      default:
        return '/coaches.html';
    }
  }

  // Check if already logged in
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (token) {
    // Verify token is still valid
    fetch('/api/auth/verify', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => {
      if (response.ok) {
        // Already logged in, redirect to dashboard
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        window.location.href = getDashboardUrl(user.role);
      }
    })
    .catch(err => {
      console.error('Token verification failed:', err);
    });
  }

  // Check for Google OAuth callback with token in URL
  const urlParams = new URLSearchParams(window.location.search);
  const urlToken = urlParams.get('token');
  const userName = urlParams.get('name');
  const userRole = urlParams.get('role');

  if (urlToken) {
    // Store token and user info
    localStorage.setItem('token', urlToken);
    localStorage.setItem('user', JSON.stringify({
      name: decodeURIComponent(userName),
      role: userRole
    }));

    // Show success message
    showMessage('Google login successful! Redirecting...', 'success');

    // Clean URL and redirect
    setTimeout(() => {
      window.location.href = getDashboardUrl(userRole);
    }, 1000);
  }

  // Check for error in URL
  const error = urlParams.get('error');
  if (error) {
    showMessage('Google authentication failed. Please try again.', 'error');
  }
});

// Handle Google Sign In callback
function handleCredentialResponse(response) {
  // Send the credential to your server
  fetch('/api/auth/google/callback', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ credential: response.credential })
  })
  .then(res => res.json())
  .then(data => {
    if (data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      const messageDiv = document.getElementById('message');
      messageDiv.textContent = 'Google login successful! Redirecting...';
      messageDiv.className = 'message success';
      messageDiv.classList.remove('hidden');
      
      setTimeout(() => {
        window.location.href = getDashboardUrl(data.user.role);
      }, 1000);
    } else {
      throw new Error(data.error || 'Google login failed');
    }
  })
  .catch(error => {
    console.error('Google Sign In error:', error);
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = 'Google login failed. Please try again.';
    messageDiv.className = 'message error';
    messageDiv.classList.remove('hidden');
  });
}
