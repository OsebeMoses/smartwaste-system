// public/js/api-service.js - COMPLETE IMPLEMENTATION
class APIService {
    constructor() {
        this.baseURL = '/api';
        this.adminTokenKey = 'adminAuthToken';
        // Keep tokens separate; do NOT prefer admin token globally
        const userToken = localStorage.getItem('authToken') || localStorage.getItem('token');
        this.token = userToken || null;
    }

    async request(endpoint, options = {}) {
        // Refresh tokens from storage before each request
        const adminToken = localStorage.getItem(this.adminTokenKey);
        const userToken = localStorage.getItem('authToken') || localStorage.getItem('token');

        // Choose token based on endpoint context and current page context
        const isAdminEndpoint = typeof endpoint === 'string' && (
            endpoint.startsWith('/admin') || 
            endpoint.startsWith('/auth/admin')
        );
        const isAdminContext = typeof window !== 'undefined' && /admin/i.test(window.location.pathname);
        
        // Use admin token if: endpoint is admin-specific OR we're on admin page AND have admin token
        const chosenToken = (isAdminEndpoint || (isAdminContext && adminToken)) ? adminToken : userToken;
        this.token = chosenToken || null;

        // Override with explicit token from options if provided
        if (options.headers && options.headers.Authorization) {
            this.token = options.headers.Authorization.replace('Bearer ', '');
        }

        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...(this.token ? { 'Authorization': `Bearer ${this.token}` } : {}),
                ...(options.headers || {})
            },
            ...options
        };

        // Remove duplicate Authorization header if we added it above
        if (options.headers && options.headers.Authorization && config.headers.Authorization) {
            // Keep the one from options.headers (more specific)
            config.headers.Authorization = options.headers.Authorization;
        }

        // Add body for non-GET requests
        if (options.body && typeof options.body === 'object') {
            config.body = JSON.stringify(options.body);
        }

        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, config);
            let data = null;
            try {
                data = await response.json();
            } catch (_) {
                // ignore JSON parse errors
            }

            if (!response.ok) {
                if (response.status === 401) {
                    const isAuthEndpoint = /\/auth\//.test(endpoint);
                    if (isAuthEndpoint) {
                        throw new Error((data && data.message) || 'Invalid email or password');
                    }
                    this.handleUnauthorized();
                    throw new Error((data && data.message) || 'Authentication required');
                }
                throw new Error((data && data.message) || `API request failed: ${response.status}`);
            }
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    handleUnauthorized() {
        const isAdminContext = typeof window !== 'undefined' && /admin/i.test(window.location.pathname);
        if (isAdminContext) {
            this.clearAdminSession(false);
            // Fall back to clearing normal session too
            localStorage.removeItem('authToken');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/admin-login.html';
            return;
        }
        localStorage.removeItem('authToken');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login.html';
    }

    // Admin token helpers
    getAdminToken() {
        return localStorage.getItem(this.adminTokenKey);
    }

    setAdminSession(token, adminUser) {
        localStorage.setItem(this.adminTokenKey, token);
        // Do not overwrite normal auth token; keep sessions separate
        if (adminUser) localStorage.setItem('adminUser', JSON.stringify(adminUser));
    }

    clearAdminSession(redirect = true) {
        localStorage.removeItem(this.adminTokenKey);
        localStorage.removeItem('adminUser');
        if (redirect) window.location.href = '/admin-login.html';
    }

    getHeaders() {
        return {
            'Content-Type': 'application/json',
            ...(this.token ? { 'Authorization': `Bearer ${this.token}` } : {})
        };
    }

    // Auth methods
    async getCurrentUser() {
        // Use admin token if we're in admin context
        const isAdminContext = typeof window !== 'undefined' && /admin/i.test(window.location.pathname);
        const adminToken = this.getAdminToken();
        
        if (isAdminContext && adminToken) {
            // Use admin token for getCurrentUser when in admin context
            return this.request('/auth/me', {
                headers: {
                    'Authorization': `Bearer ${adminToken}`
                }
            });
        }
        return this.request('/auth/me');
    }

    async updateProfile(profileData) {
        return this.request('/auth/profile', {
            method: 'PUT',
            body: profileData
        });
    }

    // Pickup methods
    async createPickup(pickupData) {
        return this.request('/pickups/create', {
            method: 'POST',
            body: pickupData
        });
    }

    async getAvailablePickups() {
        return this.request('/pickups/available');
    }

    async getUserPickups() {
        return this.request('/pickups/resident');
    }

    async acceptPickup(pickupId) {
        return this.request(`/pickups/${pickupId}/accept`, {
            method: 'PATCH'
        });
    }

    async startPickup(pickupId, estimatedArrival) {
        return this.request(`/pickups/${pickupId}/start`, {
            method: 'PATCH',
            body: { estimatedArrival }
        });
    }

    async completePickup(pickupId, actualWeight, collectorNotes) {
        return this.request(`/pickups/${pickupId}/complete`, {
            method: 'PATCH',
            body: { actualWeight, collectorNotes }
        });
    }

    async updatePickupLocation(pickupId, latitude, longitude) {
        return this.request(`/pickups/${pickupId}/location`, {
            method: 'PATCH',
            body: { latitude, longitude }
        });
    }

    async cancelPickup(pickupId, reason) {
        return this.request(`/pickups/${pickupId}/cancel`, {
            method: 'PATCH',
            body: { reason }
        });
    }

    async getPickupDetails(pickupId) {
        return this.request(`/pickups/${pickupId}`);
    }

    // Rewards methods
    async getRewards() {
        return this.request('/rewards');
    }

    async redeemReward(rewardId) {
        return this.request('/rewards/redeem', {
            method: 'POST',
            body: { rewardId }
        });
    }

    async getRedemptionHistory(limit = 10) {
        return this.request(`/rewards/my-redemptions?limit=${limit}`);
    }

    async getUserPoints() {
        return this.request('/rewards/my-points');
    }

    // Collector methods
    async getCollectorDashboard() {
        return this.request('/collectors/dashboard');
    }

    async getCollectorPickups() {
        return this.request('/collectors/pickups/active');
    }

    async updateCollectorAvailability(isAvailable) {
        return this.request('/collectors/availability', {
            method: 'PATCH',
            body: { isAvailable }
        });
    }

    async updateCollectorProfile(profileData) {
        return this.request('/collectors/profile', {
            method: 'PUT',
            body: profileData
        });
    }

    // Admin methods
    async adminLogin(credentials) {
        const res = await this.request('/auth/admin-login', {
            method: 'POST',
            body: credentials
        });
        const token = res?.data?.token || res?.token;
        const user = res?.data || res;
        if (token) this.setAdminSession(token, user);
        return res;
    }

    async getAdminDashboard() {
        const adminToken = this.getAdminToken();
        if (!adminToken) {
            throw new Error('Admin authentication required');
        }
        return this.request('/admin/dashboard', {
            headers: {
                'Authorization': `Bearer ${adminToken}`
            }
        });
    }

    async getAdminUsers(params = {}) {
        const adminToken = this.getAdminToken();
        if (!adminToken) {
            throw new Error('Admin authentication required');
        }
        const query = new URLSearchParams(params).toString();
        return this.request(`/admin/users?${query}`, {
            headers: {
                'Authorization': `Bearer ${adminToken}`
            }
        });
    }

    async getAdminPickups(params = {}) {
        const adminToken = this.getAdminToken();
        if (!adminToken) {
            throw new Error('Admin authentication required');
        }
        const query = new URLSearchParams(params).toString();
        return this.request(`/admin/pickups?${query}`, {
            headers: {
                'Authorization': `Bearer ${adminToken}`
            }
        });
    }

    async updateUserStatus(userId, status, reason = '') {
        const adminToken = this.getAdminToken();
        if (!adminToken) {
            throw new Error('Admin authentication required');
        }
        return this.request(`/admin/users/${userId}/status`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${adminToken}`
            },
            body: { status, reason }
        });
    }

    async updatePickupStatusAdmin(pickupId, status, notes = '') {
        const adminToken = this.getAdminToken();
        if (!adminToken) {
            throw new Error('Admin authentication required');
        }
        return this.request(`/admin/pickups/${pickupId}/status`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${adminToken}`
            },
            body: { status, notes }
        });
    }

    async getAllCollectors() {
        const adminToken = this.getAdminToken();
        if (!adminToken) {
            throw new Error('Admin authentication required');
        }
        return this.request('/admin/collectors', {
            headers: {
                'Authorization': `Bearer ${adminToken}`
            }
        });
    }

    async addCollector(data) {
        const adminToken = this.getAdminToken();
        if (!adminToken) {
            throw new Error('Admin authentication required');
        }
        return this.request('/admin/collectors', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${adminToken}`
            },
            body: data
        });
    }

    async updateCollectorStatus(collectorId, status) {
        const adminToken = this.getAdminToken();
        if (!adminToken) {
            throw new Error('Admin authentication required');
        }
        return this.request(`/admin/collectors/${collectorId}/status`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${adminToken}`
            },
            body: { status }
        });
    }

    async assignPickup(pickupId, collectorId) {
        const adminToken = this.getAdminToken();
        if (!adminToken) {
            throw new Error('Admin authentication required');
        }
        return this.request(`/admin/pickups/${pickupId}/assign`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${adminToken}`
            },
            body: { collectorId }
        });
    }

    async getPickupStats() {
        const adminToken = this.getAdminToken();
        if (!adminToken) {
            throw new Error('Admin authentication required');
        }
        return this.request('/admin/pickups/stats', {
            headers: {
                'Authorization': `Bearer ${adminToken}`
            }
        });
    }

    async getUserStats() {
        const adminToken = this.getAdminToken();
        if (!adminToken) {
            throw new Error('Admin authentication required');
        }
        return this.request('/admin/users/stats', {
            headers: {
                'Authorization': `Bearer ${adminToken}`
            }
        });
    }

    async getSystemConfig() {
        const adminToken = this.getAdminToken();
        if (!adminToken) {
            throw new Error('Admin authentication required');
        }
        return this.request('/admin/system-config', {
            headers: {
                'Authorization': `Bearer ${adminToken}`
            }
        });
    }

    async updatePointsSystem(wasteType, size, points) {
        const adminToken = this.getAdminToken();
        if (!adminToken) {
            throw new Error('Admin authentication required');
        }
        return this.request('/admin/points-system', {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${adminToken}`
            },
            body: { wasteType, size, points }
        });
    }

    async getAdminRewards() {
        // Map to rewards admin route
        return this.request('/rewards/admin/all');
    }

    async createAdminReward(data) {
        return this.request('/rewards/admin/create', {
            method: 'POST',
            body: data
        });
    }

    async updateAdminRewardsPoints(wasteType, size, points) {
        const adminToken = this.getAdminToken();
        if (!adminToken) {
            throw new Error('Admin authentication required');
        }
        return this.request('/admin/rewards/points', {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${adminToken}`
            },
            body: { wasteType, size, points }
        });
    }

    async getAdminAnalyticsDashboard() {
        // Use core analytics overview endpoint
        return this.request('/analytics/overview');
    }

    async getAdminAnalyticsTrends(params = {}) {
        // Map to pickup trends by default
        const query = new URLSearchParams({ period: params.period || '30d' }).toString();
        return this.request(`/analytics/pickup-trends?${query}`);
    }

    async getAdminAnalyticsReports(params = {}) {
        // Synthesize a simple report summary from available analytics endpoints
        const [overview, rewards] = await Promise.all([
            this.request('/analytics/overview'),
            this.request('/analytics/rewards-analytics')
        ]);
        return {
            success: true,
            data: {
                summary: {
                    generatedAt: Date.now(),
                    users: overview?.data?.overview?.totalUsers || 0,
                    pickups: overview?.data?.overview?.totalPickups || 0,
                    rewards: rewards?.data?.rewardStats?.reduce?.((acc, r) => acc + (r.count || 0), 0) || 0
                }
            }
        };
    }

    // 🎯 NEW: Enhanced pickup tracking methods
    async getPickupStatus(pickupId) {
        try {
            const response = await fetch(`${this.baseURL}/pickups/${pickupId}/status`, {
                headers: this.getHeaders()
            });
            return await response.json();
        } catch (error) {
            console.error('Error fetching pickup status:', error);
            return { status: 'pending', collector: null, eta: null };
        }
    }

    async getCollectorLocation(collectorId) {
        try {
            const response = await fetch(`${this.baseURL}/collectors/${collectorId}/location`, {
                headers: this.getHeaders()
            });
            return await response.json();
        } catch (error) {
            console.error('Error fetching collector location:', error);
            return { lat: -1.2921, lng: 36.8219 }; // Default Nairobi coordinates
        }
    }

    async updatePickupStatus(pickupId, status) {
        try {
            const response = await fetch(`${this.baseURL}/pickups/${pickupId}/status`, {
                method: 'PATCH',
                headers: this.getHeaders(),
                body: JSON.stringify({ status })
            });
            return await response.json();
        } catch (error) {
            console.error('Error updating pickup status:', error);
            throw error;
        }
    }
}


class ErrorHandler {
    static handle(error, notificationManager = null) {
        console.error('Application Error:', error);
        
        const message = error.message || 'An unexpected error occurred';
        
        if (notificationManager) {
            notificationManager.showToast(message, 'error');
        } else {
            // Fallback notification
            const toast = document.createElement('div');
            toast.className = 'alert alert-danger alert-dismissible fade show position-fixed top-0 end-0 m-3';
            toast.style.zIndex = '9999';
            toast.innerHTML = `
                <strong>Error:</strong> ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            `;
            document.body.appendChild(toast);
            
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 5000);
        }
        
        // Special handling for common errors
        if (error.message.includes('Authentication') || error.message.includes('token')) {
            const isAdminContext = typeof window !== 'undefined' && /admin/i.test(window.location.pathname);
            setTimeout(() => {
                window.location.href = isAdminContext ? '/admin-login.html' : '/login.html';
            }, 1200);
        }
    }
}

class LoadingManager {
    constructor() {
        this.loadingStates = new Map();
        this.createGlobalLoader();
    }

    createGlobalLoader() {
        // Create global loading overlay
        this.globalLoader = document.createElement('div');
        this.globalLoader.className = 'global-loader';
        this.globalLoader.innerHTML = `
            <div class="loading-overlay">
                <div class="spinner-border text-primary"></div>
                <p class="mt-2">Loading...</p>
            </div>
        `;
        this.globalLoader.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.7);
            display: none;
            justify-content: center;
            align-items: center;
            z-index: 9999;
            color: white;
        `;
        document.body.appendChild(this.globalLoader);
    }

    show(elementId, text = 'Loading...') {
        const element = document.getElementById(elementId);
        if (element) {
            this.loadingStates.set(elementId, {
                content: element.innerHTML,
                display: element.style.display
            });
            element.innerHTML = `
                <div class="loading-state text-center py-4">
                    <div class="spinner-border text-primary mb-2"></div>
                    <p class="text-muted">${text}</p>
                </div>
            `;
            element.style.display = 'block';
        }
    }

    hide(elementId) {
        const element = document.getElementById(elementId);
        const state = this.loadingStates.get(elementId);
        
        if (element && state) {
            element.innerHTML = state.content;
            element.style.display = state.display;
            this.loadingStates.delete(elementId);
        }
    }

    showGlobal(text = 'Loading...') {
        if (this.globalLoader) {
            this.globalLoader.querySelector('p').textContent = text;
            this.globalLoader.style.display = 'flex';
        }
    }

    hideGlobal() {
        if (this.globalLoader) {
            this.globalLoader.style.display = 'none';
        }
    }
}   

    
// Initialize global services
window.apiService = new APIService();
window.errorHandler = ErrorHandler;
window.loadingManager = new LoadingManager();