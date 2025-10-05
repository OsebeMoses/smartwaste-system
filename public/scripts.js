// API Configuration
const API_BASE_URL = 'http://localhost:5000/api/auth';

// DOM Elements
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const showRegisterLink = document.getElementById('showRegister');
const showLoginLink = document.getElementById('showLogin');
const alertBox = document.getElementById('alertBox');

// Show/hide forms
showRegisterLink.addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.style.display = 'none';
    registerForm.style.display = 'none';
    document.getElementById('registerContainer').style.display = 'block';
    hideAlert();
});

showLoginLink.addEventListener('click', (e) => {
    e.preventDefault();
    registerForm.style.display = 'none';
    document.getElementById('registerContainer').style.display = 'none';
    loginForm.style.display = 'block';
    document.getElementById('loginContainer').style.display = 'block';
    hideAlert();
});

// Show alert message
function showAlert(message, type = 'danger') {
    alertBox.textContent = message;
    alertBox.className = `alert alert-${type} mt-3`;
    alertBox.style.display = 'block';
    
    // Auto-hide success alerts after 3 seconds
    if (type === 'success') {
        setTimeout(() => {
            hideAlert();
        }, 3000);
    }
}

// Hide alert
function hideAlert() {
    alertBox.style.display = 'none';
}

// Set button loading state
function setButtonLoading(button, isLoading) {
    if (isLoading) {
        button.disabled = true;
        const originalText = button.innerHTML;
        button.setAttribute('data-original-text', originalText);
        button.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Loading...';
    } else {
        button.disabled = false;
        const originalText = button.getAttribute('data-original-text');
        if (originalText) {
            button.innerHTML = originalText;
        }
    }
}

// Login function
// Enhanced login with better token handling
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    // Check if user is already logged in
    checkExistingAuth();

    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
});

function checkExistingAuth() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    console.log('🔍 Checking existing auth:', {
        hasToken: !!token,
        hasUser: !!user,
        currentPage: window.location.pathname
    });

    // If user is already logged in and on login page, redirect to dashboard
    if (token && user && (window.location.pathname === '/' || window.location.pathname.includes('index.html'))) {
        try {
            const userData = JSON.parse(user);
            const role = userData.role || 'user';
            const dashboard = role === 'admin' ? 'dashboard-admin.html' :
                            role === 'collector' ? 'dashboard-collector.html' :
                            'dashboard-user.html';
            
            console.log('🔄 Already logged in, redirecting to:', dashboard);
            window.location.href = dashboard;
        } catch (error) {
            console.error('Error parsing user data:', error);
            clearAuthData();
        }
    }
}

async function handleLogin(e) {
    e.preventDefault();
    
    const submitButton = e.target.querySelector('button[type="submit"]');
    const originalHTML = showLoading(submitButton, 'Signing in...');

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        console.log('🔐 Starting login process for:', email);
        
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        console.log('📊 Login response status:', response.status);
        
        const data = await response.json();
        console.log('📦 Login response data:', data);

        if (response.ok && data.success) {
            console.log('✅ Login successful, processing response...');
            
            // Debug the response structure
            console.log('🔍 Response structure check:', {
                hasData: !!data.data,
                hasToken: !!(data.data && data.data.token),
                hasUserInfo: !!(data.data && data.data.email)
            });

            if (data.data && data.data.token) {
                // Save to localStorage
                localStorage.setItem('token', data.data.token);
                localStorage.setItem('user', JSON.stringify(data.data));
                
                // Verify storage immediately
                const savedToken = localStorage.getItem('token');
                const savedUser = localStorage.getItem('user');
                
                console.log('💾 Storage verification:', {
                    tokenSaved: !!savedToken,
                    tokenLength: savedToken ? savedToken.length : 0,
                    userSaved: !!savedUser
                });

                if (!savedToken) {
                    throw new Error('Token not saved to localStorage');
                }

                showAlert('✅ Login successful! Redirecting...', 'success');
                
                // Wait a bit to show success message, then redirect
                setTimeout(() => {
                    const role = data.data.role || 'user';
                    const dashboard = role === 'admin' ? 'dashboard-admin.html' :
                                    role === 'collector' ? 'dashboard-collector.html' :
                                    'dashboard-user.html';
                    console.log('🔄 Redirecting to:', dashboard);
                    window.location.href = dashboard;
                }, 1500);
                
            } else {
                console.error('❌ Missing token in response:', data);
                showAlert('❌ Login response missing token data', 'danger');
                hideLoading(submitButton, originalHTML);
            }
        } else {
            console.error('❌ Login failed:', data.message);
            showAlert(`❌ ${data.message || 'Login failed'}`, 'danger');
            hideLoading(submitButton, originalHTML);
        }
    } catch (error) {
        console.error('💥 Network error:', error);
        showAlert('🌐 Network error. Please check your connection.', 'danger');
        hideLoading(submitButton, originalHTML);
    }
}

async function handleRegister(e) {
    e.preventDefault();
    
    const submitButton = e.target.querySelector('button[type="submit"]');
    const originalHTML = showLoading(submitButton, 'Creating account...');

    const formData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        password: document.getElementById('password').value,
        phone: document.getElementById('phone').value
    };

    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (response.ok && data.success) {
            showAlert('✅ Registration successful! Please login.', 'success');
            setTimeout(() => {
                window.location.href = '/';
            }, 2000);
        } else {
            showAlert(`❌ ${data.message || 'Registration failed'}`, 'danger');
            hideLoading(submitButton, originalHTML);
        }
    } catch (error) {
        showAlert('🌐 Network error. Please try again.', 'danger');
        hideLoading(submitButton, originalHTML);
    }
}

function showLoading(button, text) {
    const originalHTML = button.innerHTML;
    button.innerHTML = `
        <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
        ${text}
    `;
    button.disabled = true;
    return originalHTML;
}

function hideLoading(button, originalHTML) {
    button.innerHTML = originalHTML;
    button.disabled = false;
}

function showAlert(message, type) {
    // Remove any existing alerts
    const existingAlerts = document.querySelector('.alert');
    if (existingAlerts) {
        existingAlerts.remove();
    }

    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    const forms = document.querySelectorAll('form');
    if (forms[0]) {
        forms[0].parentNode.insertBefore(alertDiv, forms[0]);
    } else {
        document.body.insertBefore(alertDiv, document.body.firstChild);
    }

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 5000);
}

function clearAuthData() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
}

// Register function
async function registerUser(userData) {
    console.log('Attempting registration with:', userData);
    
    try {
        const response = await fetch(`${API_BASE_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData)
        });

        console.log('Registration response status:', response.status);

        if (!response.ok) {
            let errorMessage = `Registration failed (Status: ${response.status})`;
            
            try {
                const errorData = await response.json();
                errorMessage = errorData.error || errorMessage;
            } catch (e) {
                errorMessage = response.statusText || errorMessage;
            }
            
            throw new Error(errorMessage);
        }

        const data = await response.json();
        console.log('Registration successful:', data);
        return data;

    } catch (error) {
        console.error('Registration error details:', error);
        
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            throw new Error('Cannot connect to server. Please make sure the backend is running on localhost:5000');
        } else {
            throw new Error(error.message || 'Registration failed. Please try again.');
        }
    }
}

// Function to redirect based on user role
function redirectToDashboard(user) {
    // Default to user dashboard if role not specified
    const role = user.role || 'user';
    
    console.log('Redirecting user with role:', role);
    
    switch(role) {
        case 'admin':
            window.location.href = 'dashboard-admin.html';
            break;
        case 'collector':
            window.location.href = 'dashboard-collector.html';
            break;
        case 'user':
        default:
            window.location.href = 'dashboard-user.html';
            break;
    }
}

// Login form handler
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    const loginBtn = loginForm.querySelector('button[type="submit"]');

    // Basic validation
    if (!email || !password) {
        showAlert('Please fill in all fields');
        return;
    }

    if (password.length < 6) {
        showAlert('Password must be at least 6 characters long');
        return;
    }

    setButtonLoading(loginBtn, true);
    hideAlert();

    try {
        const result = await loginUser(email, password);
        showAlert(`Login successful! Welcome to SmartWaste.`, 'success');
        
        // Store user data in localStorage
        localStorage.setItem('user', JSON.stringify(result.user));
        localStorage.setItem('token', result.token || 'dummy-token');
        
        console.log('Login successful, user data:', result.user);
        
        // Redirect based on user role
        setTimeout(() => {
            redirectToDashboard(result.user);
        }, 1500);
        
    } catch (error) {
        showAlert(error.message);
    } finally {
        setButtonLoading(loginBtn, false);
    }
});

// Register form handler
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value.trim();
    const role = document.getElementById('regRole').value;
    const registerBtn = registerForm.querySelector('button[type="submit"]');

    // Basic validation
    if (!name || !email || !password) {
        showAlert('Please fill in all fields');
        return;
    }

    if (password.length < 6) {
        showAlert('Password must be at least 6 characters long');
        return;
    }

    if (!document.getElementById('agreeTerms').checked) {
        showAlert('Please agree to the Terms of Service and Privacy Policy');
        return;
    }

    setButtonLoading(registerBtn, true);
    hideAlert();

    try {
        const userData = {
            email: email,
            password: password,
            name: name,
            role: role
        };

        const result = await registerUser(userData);
        showAlert(`Registration successful! You can now login with ${result.user.email}`, 'success');
        
        // Clear form and switch to login after 2 seconds
        setTimeout(() => {
            registerForm.reset();
            document.getElementById('registerContainer').style.display = 'none';
            document.getElementById('loginContainer').style.display = 'block';
            // Pre-fill the login email
            document.getElementById('email').value = email;
        }, 2000);
        
    } catch (error) {
        showAlert(error.message);
    } finally {
        setButtonLoading(registerBtn, false);
    }
});

// Test backend connection on page load
window.addEventListener('load', async () => {
    try {
        console.log('Testing backend connection...');
        const response = await fetch('http://localhost:5000/');
        if (response.ok) {
            const data = await response.json();
            console.log('Backend is running:', data);
        } else {
            console.warn('Backend responded with non-OK status:', response.status);
        }
    } catch (error) {
        console.error('Backend connection test failed:', error);
        showAlert('⚠️ Backend server is not running. Please make sure the server is started on localhost:5000', 'warning');
    }
});

// Utility function to test API directly (for debugging)
window.testAPI = async function() {
    console.log('Testing API endpoints...');
    
    try {
        // Test base route
        const baseResponse = await fetch('http://localhost:5000/');
        console.log('Base route:', await baseResponse.json());
        
        // Test auth route
        const authResponse = await fetch('http://localhost:5000/api/auth/test');
        console.log('Auth route:', await authResponse.json());
        
    } catch (error) {
        console.error('API test failed:', error);
    }
};