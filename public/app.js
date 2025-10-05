// API Base URL - Update this if your backend is on a different port
const API_BASE_URL = 'http://localhost:5000/api/auth';

// DOM Elements
const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('loginBtn');
const messageDiv = document.getElementById('message');
const loadingDiv = document.getElementById('loading');
const registerLink = document.getElementById('registerLink');

// Show message function
function showMessage(text, type = 'error') {
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    messageDiv.style.display = 'block';
    
    // Auto-hide success messages after 3 seconds
    if (type === 'success') {
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 3000);
    }
}

// Show/hide loading state
function setLoading(isLoading) {
    if (isLoading) {
        loadingDiv.style.display = 'block';
        loginBtn.disabled = true;
        loginBtn.textContent = 'Logging in...';
    } else {
        loadingDiv.style.display = 'none';
        loginBtn.disabled = false;
        loginBtn.textContent = 'Login';
    }
}

// Login function
async function loginUser(email, password) {
    console.log('Attempting login with:', { email });
    
    try {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: email,
                password: password
            })
        });

        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);

        // Check if response is OK (status 200-299)
        if (!response.ok) {
            // Try to get error message from response
            let errorMessage = `HTTP error! status: ${response.status}`;
            
            try {
                const errorData = await response.json();
                errorMessage = errorData.error || errorMessage;
            } catch (e) {
                // If response is not JSON, use status text
                errorMessage = response.statusText || errorMessage;
            }
            
            throw new Error(errorMessage);
        }

        // Parse successful response
        const data = await response.json();
        console.log('Login successful:', data);
        return data;

    } catch (error) {
        console.error('Login error details:', error);
        
        // More specific error messages
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            throw new Error('Cannot connect to server. Please make sure the backend is running on localhost:5000');
        } else if (error.message.includes('Failed to fetch')) {
            throw new Error('Network error. Please check if the server is running and CORS is enabled.');
        } else {
            throw new Error(error.message || 'Login failed. Please try again.');
        }
    }
}

// Register function
async function registerUser(email, password) {
    console.log('Attempting registration with:', { email });
    
    try {
        const response = await fetch(`${API_BASE_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: email,
                password: password
            })
        });

        console.log('Registration response status:', response.status);

        if (!response.ok) {
            let errorMessage = `HTTP error! status: ${response.status}`;
            
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

// Form submission handler
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    // Basic validation
    if (!email || !password) {
        showMessage('Please fill in all fields');
        return;
    }

    if (password.length < 6) {
        showMessage('Password must be at least 6 characters long');
        return;
    }

    setLoading(true);
    messageDiv.style.display = 'none';

    try {
        const result = await loginUser(email, password);
        showMessage(`Login successful! Welcome, ${result.user.email}`, 'success');
        
        // Redirect or do something after successful login
        console.log('Login successful, user data:', result.user);
        
        // Example: Redirect to dashboard after 2 seconds
        setTimeout(() => {
            // window.location.href = '/dashboard.html';
            console.log('Redirecting to dashboard...');
        }, 2000);
        
    } catch (error) {
        showMessage(error.message);
    } finally {
        setLoading(false);
    }
});

// Register link handler
registerLink.addEventListener('click', async (e) => {
    e.preventDefault();
    
    const email = emailInput.value.trim() || 'test@example.com';
    const password = passwordInput.value.trim() || 'password123';

    setLoading(true);
    messageDiv.style.display = 'none';

    try {
        const result = await registerUser(email, password);
        showMessage(`Registration successful! You can now login with ${result.user.email}`, 'success');
        
        // Clear password field after successful registration
        passwordInput.value = '';
        
    } catch (error) {
        showMessage(error.message);
    } finally {
        setLoading(false);
    }
});

// Test backend connection on page load
window.addEventListener('load', async () => {
    try {
        console.log('Testing backend connection...');
        const response = await fetch('http://localhost:5000/');
        if (response.ok) {
            console.log('Backend is running successfully');
        } else {
            console.warn('Backend responded with non-OK status:', response.status);
        }
    } catch (error) {
        console.error('Backend connection test failed:', error);
        showMessage('Backend server is not running. Please start the server on localhost:5000');
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