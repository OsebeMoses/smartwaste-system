// Comprehensive error handling system
class ErrorHandler {
    static handleApiError(error, userFriendlyMessage = 'Something went wrong') {
        console.error('API Error:', error);
        
        if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
            return '🌐 Network error. Please check your internet connection.';
        }
        
        if (error.response && error.response.status === 401) {
            return '🔐 Session expired. Please login again.';
        }
        
        if (error.response && error.response.status === 500) {
            return '⚙️ Server error. Please try again later.';
        }
        
        return userFriendlyMessage;
    }
    
    static showNetworkStatus() {
        if (!navigator.onLine) {
            showAlert('📶 You appear to be offline. Some features may not work.', 'warning');
            return false;
        }
        return true;
    }
    
    static validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return 'Please enter a valid email address.';
        }
        return null;
    }
    
    static validatePassword(password) {
        if (password.length < 6) {
            return 'Password must be at least 6 characters long.';
        }
        return null;
    }
}

// Offline/online detection
window.addEventListener('online', () => {
    showAlert('🌐 Connection restored!', 'success');
});

window.addEventListener('offline', () => {
    showAlert('📶 You are currently offline.', 'warning');
});