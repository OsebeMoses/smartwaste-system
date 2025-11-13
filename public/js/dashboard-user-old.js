// SmartWaste User Dashboard - Complete Implementation
console.log('Initializing SmartWaste User Dashboard...');

// Wait for API service to be available
let APIServiceReady = false;

function waitForAPIService() {
    return new Promise((resolve) => {
        const checkAPIService = () => {
            if (window.apiService) {
                console.log('APIService found, initializing dashboard...');
                APIServiceReady = true;
                resolve();
            } else {
                console.log('Waiting for APIService...');
                setTimeout(checkAPIService, 100);
            }
        };
        checkAPIService();
    });
}

class UserDashboard {
    constructor() {
        this.currentUser = null;
        this.userStats = null;
        this.pickups = [];
        this.rewards = [];
        this.redeemedRewards = [];
        this.map = null;
        this.marker = null;
        this.currentLocation = null;
        this.initialized = false;
    }

    async init() {
        try {
            if (this.initialized) {
                console.log('Dashboard already initialized');
                return;
            }

            console.log('Starting dashboard initialization...');
            
            // Wait for APIService to be fully ready
            await this.waitForAPIService();
            
            // Check authentication
            await this.checkAuth();
            
            // Initialize components
            await this.initializeDashboard();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Hide loading spinner and show main content
            this.hideLoadingShowContent();
            
            // Start real-time updates
            this.startRealTimeUpdates();
            
            this.initialized = true;
            console.log('Dashboard initialization completed successfully');
            
        } catch (error) {
            console.error('Dashboard initialization failed:', error);
            this.handleInitError(error);
        }
    }

    async waitForAPIService() {
        console.log('Waiting for APIService to be ready...');
        
        let attempts = 0;
        const maxAttempts = 50;
        
        while (!APIServiceReady || typeof window.APIService?.getCurrentUser !== 'function') {
            attempts++;
            if (attempts >= maxAttempts) {
                throw new Error('APIService initialization timeout - getCurrentUser not available');
            }
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        console.log('APIService confirmed ready after', attempts, 'attempts');
    }

    async checkAuth() {
        console.log('Checking authentication...');
        
        const token = localStorage.getItem('authToken');
        if (!token) {
            console.warn('No auth token found, redirecting to login');
            window.location.href = 'login.html';
            return;
        }

        try {
            if (typeof window.APIService.getCurrentUser !== 'function') {
                console.error('APIService.getCurrentUser is not a function. Available methods:', Object.keys(window.APIService));
                throw new Error('APIService.getCurrentUser is not a function');
            }

            console.log('Calling APIService.getCurrentUser...');
            const userData = await window.APIService.getCurrentUser();
            console.log('User data received:', userData);
            
            this.currentUser = userData;
            this.updateUserInterface();
            
        } catch (error) {
            console.error('Authentication check failed:', error);
            
            if (error.status === 401) {
                localStorage.removeItem('authToken');
                window.location.href = 'login.html';
            }
            throw error;
        }
    }
handleLogout() {
    console.log('Logging out...');
    
    // Clear all user data
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    
    // Show success message
    this.showToast('Logged out successfully', 'success');
    
    // Redirect to login page after 1.5 seconds
    setTimeout(() => {
        window.location.href = 'login.html';
    }, 1500);
}
    updateUserInterface() {
        if (!this.currentUser) {
            console.warn('No current user data available');
            return;
        }

        console.log('Updating user interface with:', this.currentUser);

        const userNameElements = document.querySelectorAll('#userName, #userNameDisplay, #welcomeName');
        userNameElements.forEach(element => {
            if (element) {
                element.textContent = this.currentUser.name || 'User';
            }
        });

        this.updateProfileForm();
    }

    updateProfileForm() {
        if (!this.currentUser) return;

        const profileNameInput = document.getElementById('profileNameInput');
        const profileEmailInput = document.getElementById('profileEmailInput');
        const profilePhone = document.getElementById('profilePhone');
        const profileAddress = document.getElementById('profileAddress');

        if (profileNameInput) profileNameInput.value = this.currentUser.name || '';
        if (profileEmailInput) profileEmailInput.value = this.currentUser.email || '';
        if (profilePhone) profilePhone.value = this.currentUser.phone || '';
        if (profileAddress) profileAddress.value = this.currentUser.address || '';
    }

    hideLoadingShowContent() {
        const loadingSpinner = document.getElementById('loadingSpinner');
        const mainContent = document.getElementById('mainContent');

        if (loadingSpinner) loadingSpinner.style.display = 'none';
        if (mainContent) mainContent.style.display = 'block';
    }

    handleInitError(error) {
        this.showToast('Failed to load dashboard. Please refresh the page.', 'error');
        
        const loadingSpinner = document.getElementById('loadingSpinner');
        const mainContent = document.getElementById('mainContent');
        
        if (loadingSpinner) {
            loadingSpinner.innerHTML = `
                <div class="text-center">
                    <i class="bi bi-exclamation-triangle text-warning" style="font-size: 3rem;"></i>
                    <h5 class="mt-3">Failed to Load Dashboard</h5>
                    <p class="text-muted">Please refresh the page or try again later.</p>
                    <button class="btn btn-primary mt-2" onclick="window.location.reload()">
                        Refresh Page
                    </button>
                </div>
            `;
        }
    }

    async initializeDashboard() {
        console.log('Initializing dashboard components...');
        
        try {
            await Promise.all([
                this.loadUserStats(),
                this.loadRecentPickups(),
                this.loadNotifications(),
                this.loadRewards(),
                this.initializeMap()
            ]);
            console.log('All dashboard components initialized successfully');
        } catch (error) {
            console.error('Dashboard component initialization failed:', error);
            throw error;
        }
    }

    async loadUserStats() {
        try {
            console.log('Loading user stats...');
            this.userStats = await window.APIService.getUserStats();
            this.updateStatsDisplay();
        } catch (error) {
            console.error('Failed to load user stats:', error);
            this.showToast('Failed to load statistics', 'error');
        }
    }

    updateStatsDisplay() {
        if (!this.userStats) {
            console.warn('No user stats available for display');
            return;
        }

        this.updateElementText('totalPickups', this.userStats.totalPickups || 0);
        this.updateElementText('userPoints', this.userStats.totalPoints || 0);
        this.updateElementText('wasteRecycled', `${this.userStats.totalWasteRecycled || 0}kg`);
        this.updateElementText('monthlyPickups', this.userStats.monthlyPickups || 0);
        this.updateElementText('monthlyPoints', this.userStats.monthlyPoints || 0);
        this.updateElementText('monthlyWaste', `${this.userStats.monthlyWasteRecycled || 0}kg`);
        this.updateElementText('co2Reduced', `${this.userStats.co2Reduced || 0}kg`);
        this.updateElementText('waterSaved', `${this.userStats.waterSaved || 0}L`);
        this.updateElementText('energySaved', `${this.userStats.energySaved || 0}kWh`);
        this.updateElementText('statTotalPickups', this.userStats.totalPickups || 0);
        this.updateElementText('statTotalPoints', this.userStats.totalPoints || 0);
        this.updateElementText('statWasteRecycled', `${this.userStats.totalWasteRecycled || 0}kg`);

        this.updateTierDisplay();
    }

    updateElementText(elementId, text) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = text;
        }
    }

    updateTierDisplay() {
        if (!this.userStats) return;

        const tier = this.userStats.currentTier || 'bronze';
        const tierElement = document.getElementById('userTier');
        if (tierElement) {
            tierElement.className = `badge badge-tier badge-${tier}`;
            tierElement.textContent = `${tier.charAt(0).toUpperCase() + tier.slice(1)} Member`;
        }

        this.updateTierProgress();
    }

    updateTierProgress() {
        if (!this.userStats) return;

        const progressBar = document.getElementById('tierProgressBar');
        if (progressBar && this.userStats.tierProgress !== undefined) {
            progressBar.style.width = `${this.userStats.tierProgress}%`;
        }
    }

    async loadRecentPickups() {
        try {
            console.log('Loading recent pickups...');
            this.pickups = await window.APIService.getUserPickups({ limit: 5 });
            this.displayRecentPickups();
        } catch (error) {
            console.error('Failed to load recent pickups:', error);
        }
    }

    displayRecentPickups() {
        const container = document.getElementById('recentPickups');
        if (!container) return;

        if (!this.pickups || this.pickups.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="bi bi-inbox"></i>
                    <h5>No Recent Pickups</h5>
                    <p class="text-muted">Schedule your first waste pickup to get started!</p>
                    <button class="btn btn-primary mt-2" onclick="showSection('pickup')">
                        Schedule Pickup
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = this.pickups.map(pickup => `
            <div class="pickup-item fade-in">
                <div class="d-flex justify-content-between align-items-start">
                    <div class="flex-grow-1">
                        <h6 class="mb-1">${this.formatWasteType(pickup.wasteType)}</h6>
                        <p class="text-muted small mb-1">${new Date(pickup.scheduledDate).toLocaleDateString()} • ${pickup.wasteSize}</p>
                        <p class="small mb-0">${pickup.description || 'No description provided'}</p>
                    </div>
                    <div class="text-end">
                        <span class="badge status-${pickup.status}">${this.formatStatus(pickup.status)}</span>
                        <div class="mt-1">
                            <small class="text-warning">+${pickup.pointsEarned || 0} points</small>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    formatWasteType(type) {
        const types = {
            'plastic': 'Plastic',
            'glass': 'Glass',
            'paper': 'Paper/Cardboard',
            'metal': 'Metal',
            'electronic': 'Electronic Waste',
            'organic': 'Organic/Food',
            'general': 'General Waste'
        };
        return types[type] || type;
    }

    formatStatus(status) {
        const statusMap = {
            'pending': 'Pending',
            'accepted': 'Accepted',
            'in-progress': 'In Progress',
            'completed': 'Completed',
            'cancelled': 'Cancelled'
        };
        return statusMap[status] || status;
    }

    async loadNotifications() {
        try {
            console.log('Loading notifications...');
            const notifications = await window.APIService.getNotifications();
            this.displayNotifications(notifications);
        } catch (error) {
            console.error('Failed to load notifications:', error);
        }
    }

    displayNotifications(notifications) {
        const container = document.getElementById('notificationsList');
        if (!container) return;

        if (!notifications || notifications.length === 0) {
            container.innerHTML = `
                <div class="empty-state p-3">
                    <i class="bi bi-bell"></i>
                    <p class="text-muted mb-0">No notifications</p>
                </div>
            `;
            return;
        }

        container.innerHTML = notifications.map(notification => `
            <div class="notification-item">
                <div class="notification-icon bg-${notification.type || 'success'} rounded-circle d-flex align-items-center justify-content-center" 
                      style="width: 40px; height: 40px;">
                    <i class="bi bi-${this.getNotificationIcon(notification.type)} text-white"></i>
                </div>
                <div class="notification-content">
                    <p class="mb-1 small">${notification.message}</p>
                    <small class="text-muted">${new Date(notification.createdAt).toLocaleDateString()}</small>
                </div>
            </div>
        `).join('');
    }

    getNotificationIcon(type) {
        const icons = {
            'success': 'check-circle',
            'warning': 'exclamation-triangle',
            'info': 'info-circle',
            'error': 'x-circle'
        };
        return icons[type] || 'info-circle';
    }

    async loadRewards() {
        try {
            console.log('Loading rewards...');
            const [availableRewards, redeemed] = await Promise.all([
                window.APIService.getAvailableRewards(),
                window.APIService.getRedeemedRewards()
            ]);

            this.rewards = availableRewards;
            this.redeemedRewards = redeemed;
            this.displayRewards();
            this.updateRewardsStats();
        } catch (error) {
            console.error('Failed to load rewards:', error);
            this.showToast('Failed to load rewards', 'error');
        }
    }

    displayRewards() {
        this.displayAvailableRewards();
        this.displayRedeemedRewards();
        this.displayPointsTable();
    }

    displayAvailableRewards() {
        const container = document.getElementById('rewardsList');
        if (!container) return;

        if (!this.rewards || this.rewards.length === 0) {
            container.innerHTML = `
                <div class="empty-rewards">
                    <i class="bi bi-gift"></i>
                    <h5>No Rewards Available</h5>
                    <p class="text-muted">Check back later for new rewards!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.rewards.map(reward => `
            <div class="col-md-6 col-lg-4 mb-4">
                <div class="card reward-card h-100">
                    <div class="reward-image-container">
                        <img src="${reward.image || '/images/default-reward.jpg'}" 
                             alt="${reward.name}" 
                             class="reward-image"
                             onerror="this.src='/images/default-reward.jpg'">
                        ${reward.isComingSoon ? '<span class="coming-soon-badge">Coming Soon</span>' : ''}
                    </div>
                    <div class="card-body d-flex flex-column">
                        <h6 class="reward-title">${reward.name}</h6>
                        <p class="text-muted small flex-grow-1">${reward.description}</p>
                        <div class="d-flex justify-content-between align-items-center mt-auto">
                            <span class="badge bg-warning text-dark points-badge">${reward.pointsRequired} pts</span>
                            <button class="btn btn-primary btn-sm reward-btn" 
                                    onclick="app.redeemReward('${reward.id}')"
                                    ${reward.pointsRequired > (this.userStats?.totalPoints || 0) || reward.isComingSoon ? 'disabled' : ''}>
                                ${reward.pointsRequired > (this.userStats?.totalPoints || 0) ? 'Need More Points' : 
                                  reward.isComingSoon ? 'Coming Soon' : 'Redeem'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    displayRedeemedRewards() {
        const container = document.getElementById('redeemedRewardsList');
        const section = document.getElementById('redeemedSection');
        
        if (!container || !section) return;

        if (!this.redeemedRewards || this.redeemedRewards.length === 0) {
            section.style.display = 'none';
            return;
        }

        section.style.display = 'block';
        container.innerHTML = this.redeemedRewards.map(reward => `
            <div class="col-md-6 col-lg-4 mb-4">
                <div class="card reward-card redeemed-reward-card h-100">
                    <div class="reward-image-container">
                        <img src="${reward.image || '/images/default-reward.jpg'}" 
                             alt="${reward.name}" 
                             class="reward-image"
                             onerror="this.src='/images/default-reward.jpg'">
                        <span class="redeemed-badge">Redeemed</span>
                    </div>
                    <div class="card-body d-flex flex-column">
                        <h6 class="reward-title">${reward.name}</h6>
                        <p class="text-muted small flex-grow-1">${reward.description}</p>
                        <div class="d-flex justify-content-between align-items-center mt-auto">
                            <span class="badge bg-success points-badge">Redeemed</span>
                            <small class="text-muted">${new Date(reward.redeemedAt).toLocaleDateString()}</small>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    displayPointsTable() {
        const container = document.getElementById('pointsTable');
        if (!container) return;

        const pointsStructure = {
            'plastic': { small: 10, medium: 25, large: 50 },
            'glass': { small: 8, medium: 20, large: 40 },
            'paper': { small: 5, medium: 12, large: 25 },
            'metal': { small: 12, medium: 30, large: 60 },
            'electronic': { small: 50, medium: 100, large: 200 },
            'organic': { small: 3, medium: 8, large: 15 },
            'general': { small: 2, medium: 5, large: 10 }
        };

        container.innerHTML = Object.entries(pointsStructure).map(([type, points]) => `
            <tr>
                <td class="text-capitalize">${type}</td>
                <td>${points.small} pts</td>
                <td>${points.medium} pts</td>
                <td>${points.large} pts</td>
            </tr>
        `).join('');
    }

    updateRewardsStats() {
        this.updateElementText('availablePoints', this.userStats?.totalPoints || 0);
        this.updateElementText('totalRewards', this.rewards?.length || 0);
        this.updateElementText('redeemedRewards', this.redeemedRewards?.length || 0);
    }

    initializeMap() {
        try {
            console.log('Initializing map...');
            this.map = L.map('pickupMap').setView([-1.2921, 36.8219], 10);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(this.map);

            this.map.on('click', (e) => {
                this.updateLocationFromMap(e.latlng.lat, e.latlng.lng);
            });

            this.locateUser();

        } catch (error) {
            console.error('Failed to initialize map:', error);
        }
    }

    locateUser() {
        if (!navigator.geolocation) {
            this.showToast('Geolocation is not supported by your browser', 'warning');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                
                this.currentLocation = { lat, lng };
                this.updateMapLocation(lat, lng);
                this.updateLocationFromMap(lat, lng);
                
                this.reverseGeocode(lat, lng);
            },
            (error) => {
                console.error('Geolocation error:', error);
                this.showToast('Unable to get your location. Please enter coordinates manually.', 'warning');
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 60000
            }
        );
    }

    updateMapLocation(lat, lng) {
        if (!this.map) return;

        this.map.setView([lat, lng], 15);
        
        if (this.marker) {
            this.map.removeLayer(this.marker);
        }
        
        this.marker = L.marker([lat, lng]).addTo(this.map)
            .bindPopup('Pickup Location')
            .openPopup();
    }

    updateLocationFromMap(lat, lng) {
        const latInput = document.getElementById('latitude');
        const lngInput = document.getElementById('longitude');
        
        if (latInput) latInput.value = lat.toFixed(6);
        if (lngInput) lngInput.value = lng.toFixed(6);
        
        this.updateEstimatedPoints();
    }

    async reverseGeocode(lat, lng) {
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
            const data = await response.json();
            
            if (data.display_name) {
                const addressInput = document.getElementById('address');
                if (addressInput) {
                    addressInput.value = data.display_name;
                }
            }
        } catch (error) {
            console.error('Reverse geocoding failed:', error);
            const addressInput = document.getElementById('address');
            if (addressInput) {
                addressInput.value = 'Address not available';
            }
        }
    }

    updateEstimatedPoints() {
        const wasteType = document.getElementById('wasteType')?.value;
        const wasteSize = document.getElementById('wasteSize')?.value;
        const urgency = document.getElementById('urgency')?.value;

        if (!wasteType || !wasteSize) {
            this.updateElementText('estimatedPoints', '0 points');
            return;
        }

        const pointsStructure = {
            'plastic': { small: 10, medium: 25, large: 50 },
            'glass': { small: 8, medium: 20, large: 40 },
            'paper': { small: 5, medium: 12, large: 25 },
            'metal': { small: 12, medium: 30, large: 60 },
            'electronic': { small: 50, medium: 100, large: 200 },
            'organic': { small: 3, medium: 8, large: 15 },
            'general': { small: 2, medium: 5, large: 10 }
        };

        let points = pointsStructure[wasteType]?.[wasteSize] || 0;

        const urgencyMultipliers = {
            'low': 1.0,
            'medium': 1.2,
            'high': 1.5
        };

        points = Math.round(points * (urgencyMultipliers[urgency] || 1));
        this.updateElementText('estimatedPoints', `${points} points`);
    }

    setupEventListeners() {
    console.log('Setting up event listeners...');
    
    // Pickup form submission
    const pickupForm = document.getElementById('pickupForm');
    if (pickupForm) {
        pickupForm.addEventListener('submit', (e) => this.handlePickupSubmission(e));
    }

    // Profile form submission
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', (e) => this.handleProfileUpdate(e));
    }

    // Form field changes for points calculation
    const pointsFields = ['wasteType', 'wasteSize', 'urgency'];
    pointsFields.forEach(field => {
        const element = document.getElementById(field);
        if (element) {
            element.addEventListener('change', () => this.updateEstimatedPoints());
        }
    });

    // Location type toggle
    const locationRadios = document.querySelectorAll('input[name="locationType"]');
    locationRadios.forEach(radio => {
        radio.addEventListener('change', (e) => this.handleLocationTypeChange(e.target.value));
    });

    // Locate Me button - FIXED
    const locateMeButton = document.getElementById('locateMeButton');
    if (locateMeButton) {
        locateMeButton.addEventListener('click', () => {
            console.log('Locate Me button clicked');
            this.locateUser();
        });
    }

    // Logout button - ADD THIS
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleLogout();
        });
    }

    // Photo upload handling
    this.setupPhotoUpload();

    // Reward filter buttons
    this.setupRewardFilters();

    // Real-time event listeners
    this.setupRealTimeListeners();
    
    console.log('Event listeners setup completed');
}

    setupPhotoUpload() {
        const uploadArea = document.getElementById('photoUploadArea');
        const fileInput = document.getElementById('wastePhotos');

        if (!uploadArea || !fileInput) return;

        uploadArea.addEventListener('click', () => fileInput.click());

        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            if (e.dataTransfer.files.length > 0) {
                this.handlePhotoSelection(e.dataTransfer.files);
            }
        });

        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handlePhotoSelection(e.target.files);
            }
        });
    }

    handlePhotoSelection(files) {
        const previewContainer = document.getElementById('photoPreviewContainer');
        const previews = document.getElementById('photoPreviews');
        
        if (!previewContainer || !previews) return;

        previews.innerHTML = '';
        
        const selectedFiles = Array.from(files).slice(0, 3);
        
        selectedFiles.forEach((file) => {
            if (!file.type.startsWith('image/')) {
                this.showToast('Please select only image files', 'warning');
                return;
            }
            
            if (file.size > 5 * 1024 * 1024) {
                this.showToast('File size must be less than 5MB', 'warning');
                return;
            }
            
            const reader = new FileReader();
            reader.onload = (e) => {
                const preview = document.createElement('div');
                preview.className = 'col-md-4 mb-2';
                preview.innerHTML = `
                    <div class="position-relative">
                        <img src="${e.target.result}" class="photo-preview w-100 rounded" style="height: 100px; object-fit: cover;">
                        <button type="button" class="btn btn-danger btn-sm position-absolute top-0 end-0" 
                                onclick="this.parentElement.parentElement.remove(); if(document.getElementById('photoPreviews').children.length === 0) document.getElementById('photoPreviewContainer').style.display = 'none';">
                            <i class="bi bi-x"></i>
                        </button>
                    </div>
                `;
                previews.appendChild(preview);
            };
            reader.readAsDataURL(file);
        });
        
        previewContainer.style.display = selectedFiles.length > 0 ? 'block' : 'none';
    }

    handleLocationTypeChange(type) {
        if (type === 'gps') {
            this.locateUser();
        }
    }


    resetPickupForm() {
        const form = document.getElementById('pickupForm');
        if (form) form.reset();
        
        const previewContainer = document.getElementById('photoPreviewContainer');
        if (previewContainer) previewContainer.style.display = 'none';
        
        const previews = document.getElementById('photoPreviews');
        if (previews) previews.innerHTML = '';
        
        this.updateEstimatedPoints();
    }

    async handleProfileUpdate(e) {
        e.preventDefault();
        
        const submitButton = e.target.querySelector('button[type="submit"]');
        const originalText = submitButton.innerHTML;
        
        try {
            submitButton.innerHTML = '<i class="bi bi-hourglass-split me-2"></i>Updating...';
            submitButton.disabled = true;

            const profileData = {
                name: document.getElementById('profileNameInput').value,
                email: document.getElementById('profileEmailInput').value,
                phone: document.getElementById('profilePhone').value,
                address: document.getElementById('profileAddress').value,
                notifications: {
                    email: document.getElementById('emailNotifications').checked,
                    reminders: document.getElementById('pickupReminders').checked,
                    promotional: document.getElementById('promotionalEmails').checked,
                    rewards: document.getElementById('rewardsUpdates').checked
                }
            };

            await window.APIService.updateUserProfile(profileData);
            this.showToast('Profile updated successfully!', 'success');
            
            await this.checkAuth();

        } catch (error) {
            console.error('Profile update failed:', error);
            this.showToast('Failed to update profile', 'error');
        } finally {
            submitButton.innerHTML = originalText;
            submitButton.disabled = false;
        }
    }

    setupRewardFilters() {
        const filterButtons = document.querySelectorAll('.filter-btn');
        filterButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                filterButtons.forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
                
                this.filterRewards(e.target.getAttribute('data-filter'));
            });
        });
    }

    filterRewards(filter) {
        const rewards = document.querySelectorAll('.reward-card');
        rewards.forEach(card => {
            const isRedeemed = card.classList.contains('redeemed-reward-card');
            
            switch (filter) {
                case 'all':
                    card.parentElement.style.display = 'block';
                    break;
                case 'redeemed':
                    card.parentElement.style.display = isRedeemed ? 'block' : 'none';
                    break;
                default:
                    card.parentElement.style.display = isRedeemed ? 'none' : 'block';
                    break;
            }
        });
    }

    async redeemReward(rewardId) {
        try {
            const result = await window.APIService.redeemReward(rewardId);
            this.showToast('Reward redeemed successfully!', 'success');
            
            await Promise.all([
                this.loadRewards(),
                this.loadUserStats()
            ]);
            
        } catch (error) {
            console.error('Reward redemption failed:', error);
            this.showToast(error.message || 'Failed to redeem reward', 'error');
        }
    }

    setupRealTimeListeners() {
        if (typeof RealTimeService !== 'undefined') {
            RealTimeService.on('pickupUpdated', (data) => {
                this.handlePickupUpdate(data);
            });

            RealTimeService.on('notification', (data) => {
                this.handleNewNotification(data);
            });

            RealTimeService.on('pointsUpdated', (data) => {
                this.handlePointsUpdate(data);
            });
        }
    }

    handlePickupUpdate(data) {
        const index = this.pickups.findIndex(p => p.id === data.pickupId);
        if (index !== -1) {
            this.pickups[index] = { ...this.pickups[index], ...data.update };
            this.displayRecentPickups();
            this.showToast(`Pickup status updated: ${this.formatStatus(data.update.status)}`, 'info');
        }
    }

    handleNewNotification(notification) {
        this.showToast(notification.message, notification.type || 'info');
        this.loadNotifications();
    }

    handlePointsUpdate(data) {
        if (this.userStats) {
            this.userStats.totalPoints = data.newPoints;
            this.updateStatsDisplay();
            this.updateRewardsStats();
        }
    }

    startRealTimeUpdates() {
        if (typeof RealTimeService !== 'undefined') {
            RealTimeService.connect();
        }
        
        setInterval(() => {
            this.loadUserStats();
            this.loadRecentPickups();
        }, 30000);
    }

    showToast(message, type = 'info') {
        const toastContainer = document.getElementById('toastContainer');
        if (!toastContainer) return;

        const toastId = 'toast-' + Date.now();
        const bgColor = {
            'success': 'bg-success',
            'error': 'bg-danger',
            'warning': 'bg-warning',
            'info': 'bg-info'
        }[type] || 'bg-info';

        const toastHTML = `
            <div id="${toastId}" class="toast align-items-center text-white ${bgColor} border-0" role="alert">
                <div class="d-flex">
                    <div class="toast-body">
                        <i class="bi bi-${this.getNotificationIcon(type)} me-2"></i>
                        ${message}
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
                </div>
            </div>
        `;

        toastContainer.insertAdjacentHTML('beforeend', toastHTML);
        
        const toastElement = document.getElementById(toastId);
        const toast = new bootstrap.Toast(toastElement, { delay: 5000 });
        toast.show();

        toastElement.addEventListener('hidden.bs.toast', () => {
            toastElement.remove();
        });
    }
     async handlePickupSubmission(e) {
        e.preventDefault();
        
        const submitButton = e.target.querySelector('button[type="submit"]');
        const originalText = submitButton.innerHTML;
        
        try {
            submitButton.innerHTML = '<i class="bi bi-hourglass-split me-2"></i>Scheduling...';
            submitButton.disabled = true;

            const formData = new FormData();
            const pickupData = {
                wasteType: document.getElementById('wasteType').value,
                wasteSize: document.getElementById('wasteSize').value,
                description: document.getElementById('description').value,
                latitude: parseFloat(document.getElementById('latitude').value),
                longitude: parseFloat(document.getElementById('longitude').value),
                scheduledDate: document.getElementById('scheduledDate').value,
                urgency: document.getElementById('urgency').value,
                address: document.getElementById('address').value,
                estimatedPoints: parseInt(document.getElementById('estimatedPoints').textContent) || 0
            };

            formData.append('pickupData', JSON.stringify(pickupData));

            // Handle photo uploads
            const photoInput = document.getElementById('wastePhotos');
            if (photoInput.files.length > 0) {
                Array.from(photoInput.files).slice(0, 3).forEach(file => {
                    formData.append('photos', file);
                });
            }

            // 🎯 NEW: Show beautiful confirmation
            const result = await window.APIService.schedulePickup(formData);
            
            // Show beautiful confirmation modal
            this.showPickupConfirmation(pickupData, result.pickupId);
            
            // Reset form
            this.resetPickupForm();
            
            // Reload data
            await this.loadRecentPickups();
            await this.loadUserStats();

        } catch (error) {
            console.error('Pickup scheduling failed:', error);
            this.showToast('Failed to schedule pickup. Please try again.', 'error');
        } finally {
            submitButton.innerHTML = originalText;
            submitButton.disabled = false;
        }
    }

    // 🎯 NEW: Beautiful pickup confirmation
    showPickupConfirmation(pickupData, pickupId) {
        // Update confirmation modal content
        document.getElementById('confirmationWasteType').textContent = this.formatWasteType(pickupData.wasteType);
        document.getElementById('confirmationDate').textContent = new Date(pickupData.scheduledDate).toLocaleString();
        document.getElementById('confirmationPoints').textContent = `${pickupData.estimatedPoints} points`;
        document.getElementById('confirmationId').textContent = `#${pickupId || 'P' + Date.now()}`;
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('pickupConfirmationModal'));
        modal.show();
        
        // Simulate collector assignment after 3 seconds
        setTimeout(() => {
            this.simulateCollectorAssignment(pickupId);
        }, 3000);
    }

    // 🎯 NEW: Simulate collector assignment (replace with real API later)
    simulateCollectorAssignment(pickupId) {
        const collectorData = {
            name: "James Kariuki",
            vehicle: "Waste Truck KCD 123A",
            phone: "+254 712 345 678",
            rating: "4.8",
            eta: "15-20 min"
        };
        
        this.showCollectorAssigned(collectorData, pickupId);
    }

    // 🎯 NEW: Show collector assignment modal
    showCollectorAssigned(collectorData, pickupId) {
        document.getElementById('collectorModalName').textContent = collectorData.name;
        document.getElementById('collectorModalVehicle').textContent = collectorData.vehicle;
        document.getElementById('collectorModalPhone').textContent = collectorData.phone;
        document.getElementById('collectorModalRating').textContent = `⭐ ${collectorData.rating}`;
        document.getElementById('collectorModalETA').textContent = collectorData.eta;
        
        const modal = new bootstrap.Modal(document.getElementById('collectorAssignedModal'));
        modal.show();
        
        // Start tracking automatically
        this.startPickupTracking(pickupId);
    }

    // 🎯 NEW: Enhanced tracking system
    startPickupTracking(pickupId) {
        // Update the tracking modal with real data
        this.updateTrackingModal(pickupId);
        
        // Show notification
        this.showNotification(`Collector James is on the way! ETA: 15-20 min`, 'info');
        
        // Start real-time updates
        this.startRealTimeTracking(pickupId);
    }

    // 🎯 NEW: Enhanced notification system
    showNotification(message, type = 'info') {
        const notificationSystem = document.getElementById('notificationSystem');
        if (!notificationSystem) return;

        const notificationId = 'notification-' + Date.now();
        const notificationHTML = `
            <div id="${notificationId}" class="notification-card ${type}">
                <div class="d-flex align-items-center">
                    <i class="bi bi-${this.getNotificationIcon(type)} me-2 fs-5"></i>
                    <div class="flex-grow-1">
                        <p class="mb-0 small">${message}</p>
                    </div>
                    <button type="button" class="btn-close btn-close-white ms-2" onclick="document.getElementById('${notificationId}').remove()"></button>
                </div>
            </div>
        `;

        notificationSystem.insertAdjacentHTML('afterbegin', notificationHTML);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            const element = document.getElementById(notificationId);
            if (element) element.remove();
        }, 5000);
    }

    // 🎯 NEW: Update tracking modal with real data
    updateTrackingModal(pickupId) {
        const timeline = document.getElementById('trackingTimeline');
        if (!timeline) return;

        timeline.innerHTML = `
            <div class="tracking-step completed">
                <h6 class="mb-1 text-success">Pickup Scheduled</h6>
                <p class="text-muted small mb-0">Your pickup has been scheduled</p>
                <small class="text-success">${new Date().toLocaleTimeString()}</small>
            </div>
            <div class="tracking-step completed">
                <h6 class="mb-1 text-success">Collector Assigned</h6>
                <p class="text-muted small mb-0">James Kariuki is assigned to your pickup</p>
                <small class="text-success">${new Date().toLocaleTimeString()}</small>
            </div>
            <div class="tracking-step active">
                <h6 class="mb-1 text-primary">On the Way</h6>
                <p class="text-muted small mb-0">Collector is en route to your location</p>
                <small class="text-primary">Live tracking active</small>
            </div>
            <div class="tracking-step pending">
                <h6 class="mb-1 text-muted">Arrived at Location</h6>
                <p class="text-muted small mb-0">Collector will arrive shortly</p>
            </div>
            <div class="tracking-step pending">
                <h6 class="mb-1 text-muted">Pickup Completed</h6>
                <p class="text-muted small mb-0">Waste collected and points awarded</p>
            </div>
        `;
    }

    // 🎯 NEW: Enhanced real-time tracking
    startRealTimeTracking(pickupId) {
        // Simulate real-time updates
        let progress = 0;
        const interval = setInterval(() => {
            progress += 20;
            
            // Update progress in UI
            this.updateTrackingProgress(progress);
            
            // Simulate status changes
            if (progress >= 100) {
                clearInterval(interval);
                this.completePickup(pickupId);
            }
        }, 3000);
    }

    updateTrackingProgress(progress) {
        // Update progress bars, ETA, etc.
        const progressElement = document.querySelector('.route-progress');
        if (progressElement) {
            progressElement.style.width = `${progress}%`;
        }
        
        // Update ETA
        const etaElement = document.getElementById('etaTime');
        if (etaElement) {
            const remainingTime = Math.max(0, 15 - (progress / 100 * 15));
            etaElement.textContent = `${Math.ceil(remainingTime)}-${Math.ceil(remainingTime + 5)} min`;
        }
    }

    completePickup(pickupId) {
        this.showNotification('Pickup completed! Points have been added to your account.', 'success');
        this.showToast('Pickup completed successfully! +25 points earned', 'success');
        
        // Reload user stats to show new points
        this.loadUserStats();
        this.loadRecentPickups();
    }

    // 🎯 NEW: Add these methods for contact functionality
    contactCollector() {
        const phone = document.getElementById('collectorModalPhone').textContent;
        if (phone && phone !== '+254 XXX XXX') {
            window.open(`tel:${phone}`);
        } else {
            this.showToast('Phone number not available', 'warning');
        }
    }

    startTracking() {
        const trackingModal = new bootstrap.Modal(document.getElementById('pickupTrackingModal'));
        trackingModal.show();
    }
}


// Global function for section navigation
window.showSection = function(sectionName) {
    document.querySelectorAll('.dashboard-section').forEach(section => {
        section.style.display = 'none';
    });
    
    const targetSection = document.getElementById(`${sectionName}-section`);
    if (targetSection) {
        targetSection.style.display = 'block';
    }
    
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-section') === sectionName) {
            btn.classList.add('active');
        }
    });

    if (sectionName === 'pickup' && window.app) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(9, 0, 0, 0);
        
        const dateInput = document.getElementById('scheduledDate');
        if (dateInput) {
            dateInput.value = tomorrow.toISOString().slice(0, 16);
        }
        
        if (window.app.updateEstimatedPoints) {
            window.app.updateEstimatedPoints();
        }
    }
};

// Initialize the dashboard when DOM is loaded
let app;
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing dashboard...');
    app = new UserDashboard();
    app.init().then(() => {
        console.log('Dashboard initialization process completed');
    }).catch(error => {
        console.error('Dashboard initialization process failed:', error);
    });
});

// Make app globally available for HTML onclick handlers
window.app = app;