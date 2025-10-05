// dashboard-user.js
// SmartWaste User Dashboard JavaScript Functionality

// Application State
const appState = {
    user: {
        id: 1,
        name: "Alex Johnson",
        email: "alex.johnson@example.com",
        phone: "+1 (555) 123-4567",
        address: "123 Green Street, Eco City, EC 12345",
        points: 350,
        tier: "bronze",
        memberSince: "2023",
        totalPickups: 12,
        wasteRecycled: 45.5,
        monthlyStats: {
            pickups: 3,
            points: 85,
            waste: 12.5
        },
        environmentalImpact: {
            co2Reduced: 120,
            waterSaved: 450,
            energySaved: 280
        },
        preferences: {
            emailNotifications: true,
            pickupReminders: true,
            promotionalEmails: false,
            rewardsUpdates: true
        }
    },
    pickups: [
        {
            id: 1,
            wasteType: "plastic",
            wasteSize: "medium",
            description: "Plastic bottles and containers",
            location: { lat: -1.2921, lng: 36.8219 },
            address: "123 Green Street, Eco City",
            scheduledDate: "2024-01-15T10:00",
            urgency: "medium",
            status: "completed",
            points: 45,
            wasteAmount: 8.2,
            completedDate: "2024-01-15T11:30"
        },
        {
            id: 2,
            wasteType: "paper",
            wasteSize: "small",
            description: "Cardboard boxes and newspapers",
            location: { lat: -1.2921, lng: 36.8219 },
            address: "123 Green Street, Eco City",
            scheduledDate: "2024-01-10T14:00",
            urgency: "low",
            status: "completed",
            points: 25,
            wasteAmount: 4.3,
            completedDate: "2024-01-10T15:15"
        },
        {
            id: 3,
            wasteType: "electronic",
            wasteSize: "small",
            description: "Old mobile phones and cables",
            location: { lat: -1.2921, lng: 36.8219 },
            address: "123 Green Street, Eco City",
            scheduledDate: "2024-01-20T09:00",
            urgency: "medium",
            status: "scheduled",
            points: 50,
            wasteAmount: 3.5,
            completedDate: null
        }
    ],
    rewards: [
        {
            id: 1,
            name: "Eco-Friendly Water Bottle",
            description: "Stainless steel insulated water bottle to reduce plastic waste",
            points: 150,
            category: "eco",
            image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
            redeemed: false
        },
        {
            id: 2,
            name: "Reusable Shopping Bag Set",
            description: "Set of 3 durable reusable shopping bags",
            points: 100,
            category: "eco",
            image: "https://images.unsplash.com/photo-1550565118-3a14e8d03866?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
            redeemed: false
        },
        {
            id: 3,
            name: "Silver Membership Upgrade",
            description: "Upgrade to Silver membership for exclusive benefits",
            points: 500,
            category: "membership",
            image: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
            redeemed: false
        },
        {
            id: 4,
            name: "Digital Eco Certificate",
            description: "Personalized digital certificate recognizing your environmental contributions",
            points: 200,
            category: "digital",
            image: "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
            redeemed: false
        },
        {
            id: 5,
            name: "Bamboo Toothbrush Set",
            description: "Set of 4 biodegradable bamboo toothbrushes",
            points: 80,
            category: "eco",
            image: "https://images.unsplash.com/photo-1585435557343-3b092031d5ad?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
            redeemed: true
        },
        {
            id: 6,
            name: "$10 Eco Store Voucher",
            description: "Digital voucher for our eco-friendly products store",
            points: 300,
            category: "digital",
            image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
            redeemed: false
        }
    ],
    pointsSystem: {
        plastic: { small: 30, medium: 45, large: 65 },
        glass: { small: 25, medium: 40, large: 60 },
        paper: { small: 20, medium: 30, large: 45 },
        metal: { small: 35, medium: 50, large: 70 },
        electronic: { small: 50, medium: 75, large: 100 },
        organic: { small: 15, medium: 25, large: 35 },
        general: { small: 10, medium: 15, large: 25 }
    },
    urgencyMultipliers: {
        low: 1.0,
        medium: 1.2,
        high: 1.5
    },
    notifications: [
        {
            id: 1,
            message: "Your recent pickup has been completed! Points have been added to your account.",
            type: "success",
            timestamp: new Date(Date.now() - 3600000), // 1 hour ago
            read: false
        },
        {
            id: 2,
            message: "New rewards are available! Check out the latest eco-friendly products.",
            type: "info",
            timestamp: new Date(Date.now() - 86400000), // 1 day ago
            read: false
        },
        {
            id: 3,
            message: "You're only 150 points away from Silver tier! Keep recycling to unlock exclusive benefits.",
            type: "warning",
            timestamp: new Date(Date.now() - 172800000), // 2 days ago
            read: true
        }
    ]
};

// DOM Elements Manager
class DOMManager {
    constructor() {
        this.elements = {};
        this.initializeElements();
    }

    initializeElements() {
        // Cache frequently used DOM elements
        this.elements = {
            // Loading and main content
            loadingSpinner: document.getElementById('loadingSpinner'),
            mainContent: document.getElementById('mainContent'),
            
            // User information
            userName: document.getElementById('userName'),
            userNameDisplay: document.getElementById('userNameDisplay'),
            welcomeName: document.getElementById('welcomeName'),
            userTier: document.getElementById('userTier'),
            
            // Stats and metrics
            totalPickups: document.getElementById('totalPickups'),
            userPoints: document.getElementById('userPoints'),
            wasteRecycled: document.getElementById('wasteRecycled'),
            co2Reduced: document.getElementById('co2Reduced'),
            waterSaved: document.getElementById('waterSaved'),
            energySaved: document.getElementById('energySaved'),
            monthlyPickups: document.getElementById('monthlyPickups'),
            monthlyPoints: document.getElementById('monthlyPoints'),
            monthlyWaste: document.getElementById('monthlyWaste'),
            
            // Content sections
            recentPickups: document.getElementById('recentPickups'),
            notificationsList: document.getElementById('notificationsList'),
            pickupForm: document.getElementById('pickupForm'),
            estimatedPoints: document.getElementById('estimatedPoints'),
            historyContent: document.getElementById('historyContent'),
            
            // Rewards system
            availablePoints: document.getElementById('availablePoints'),
            totalRewards: document.getElementById('totalRewards'),
            redeemedRewards: document.getElementById('redeemedRewards'),
            pointsTable: document.getElementById('pointsTable'),
            rewardsList: document.getElementById('rewardsList'),
            redeemedRewardsList: document.getElementById('redeemedRewardsList'),
            redeemedSection: document.getElementById('redeemedSection'),
            tierProgressBar: document.getElementById('tierProgressBar'),
            
            // Profile section
            profileNameInput: document.getElementById('profileNameInput'),
            profileEmailInput: document.getElementById('profileEmailInput'),
            profilePhone: document.getElementById('profilePhone'),
            profileAddress: document.getElementById('profileAddress'),
            statTotalPickups: document.getElementById('statTotalPickups'),
            statTotalPoints: document.getElementById('statTotalPoints'),
            statWasteRecycled: document.getElementById('statWasteRecycled'),
            statMemberSince: document.getElementById('statMemberSince'),
            
            // Modal elements
            rewardDetailModal: document.getElementById('rewardDetailModal'),
            rewardModalTitle: document.getElementById('rewardModalTitle'),
            rewardModalImage: document.getElementById('rewardModalImage'),
            rewardModalName: document.getElementById('rewardModalName'),
            rewardModalDescription: document.getElementById('rewardModalDescription'),
            rewardModalPoints: document.getElementById('rewardModalPoints'),
            rewardModalUserPoints: document.getElementById('rewardModalUserPoints'),
            rewardModalStatus: document.getElementById('rewardModalStatus'),
            rewardModalAction: document.getElementById('rewardModalAction')
        };
    }

    getElement(id) {
        return this.elements[id] || document.getElementById(id);
    }

    showElement(id) {
        const element = this.getElement(id);
        if (element) element.style.display = 'block';
    }

    hideElement(id) {
        const element = this.getElement(id);
        if (element) element.style.display = 'none';
    }

    setText(id, text) {
        const element = this.getElement(id);
        if (element) element.textContent = text;
    }

    setHTML(id, html) {
        const element = this.getElement(id);
        if (element) element.innerHTML = html;
    }
}

// User Manager
class UserManager {
    constructor(domManager) {
        this.dom = domManager;
    }

    initializeUserData() {
        this.updateUserInformation();
        this.updateUserStats();
        this.updateEnvironmentalImpact();
        this.updateMonthlyStats();
        this.updateProgressBars();
        this.updateUserTier();
    }

    updateUserInformation() {
        this.dom.setText('userName', appState.user.name);
        this.dom.setText('userNameDisplay', appState.user.name);
        this.dom.setText('welcomeName', appState.user.name);
    }

    updateUserStats() {
        this.dom.setText('totalPickups', appState.user.totalPickups);
        this.dom.setText('userPoints', appState.user.points);
        this.dom.setText('wasteRecycled', `${appState.user.wasteRecycled}kg`);
    }

    updateEnvironmentalImpact() {
        this.dom.setText('co2Reduced', `${appState.user.environmentalImpact.co2Reduced}kg`);
        this.dom.setText('waterSaved', `${appState.user.environmentalImpact.waterSaved}L`);
        this.dom.setText('energySaved', `${appState.user.environmentalImpact.energySaved}kWh`);
    }

    updateMonthlyStats() {
        this.dom.setText('monthlyPickups', appState.user.monthlyStats.pickups);
        this.dom.setText('monthlyPoints', appState.user.monthlyStats.points);
        this.dom.setText('monthlyWaste', `${appState.user.monthlyStats.waste}kg`);
    }

    updateProgressBars() {
        // Update monthly progress bars
        const monthlyPickupsBar = document.querySelector('.progress-bar.bg-success');
        const monthlyPointsBar = document.querySelector('.progress-bar.bg-warning');
        const monthlyWasteBar = document.querySelector('.progress-bar.bg-info');
        
        if (monthlyPickupsBar) {
            monthlyPickupsBar.style.width = `${(appState.user.monthlyStats.pickups / 10) * 100}%`;
        }
        if (monthlyPointsBar) {
            monthlyPointsBar.style.width = `${(appState.user.monthlyStats.points / 100) * 100}%`;
        }
        if (monthlyWasteBar) {
            monthlyWasteBar.style.width = `${(appState.user.monthlyStats.waste / 20) * 100}%`;
        }
        
        // Update tier progress
        const tierProgress = this.calculateTierProgress();
        this.dom.elements.tierProgressBar.style.width = `${tierProgress}%`;
    }

    calculateTierProgress() {
        const currentPoints = appState.user.points;
        let progress = 0;
        
        if (appState.user.tier === 'bronze') {
            progress = (currentPoints / 500) * 100;
        } else if (appState.user.tier === 'silver') {
            progress = ((currentPoints - 500) / 1000) * 100;
        } else {
            progress = 100;
        }
        
        return Math.min(progress, 100);
    }

    updateUserTier() {
        const points = appState.user.points;
        let tier = 'bronze';
        let tierClass = 'badge-bronze';
        
        if (points >= 1500) {
            tier = 'gold';
            tierClass = 'badge-gold';
        } else if (points >= 500) {
            tier = 'silver';
            tierClass = 'badge-silver';
        }
        
        appState.user.tier = tier;
        this.dom.setText('userTier', `${tier.charAt(0).toUpperCase() + tier.slice(1)} Member`);
        this.dom.elements.userTier.className = `badge badge-tier ${tierClass}`;
    }

    updateUserPoints(points) {
        appState.user.points += points;
        this.updateUserStats();
        this.updateUserTier();
        this.updateProgressBars();
    }
}

// Dashboard Manager
class DashboardManager {
    constructor(domManager) {
        this.dom = domManager;
    }

    initializeDashboard() {
        this.updateRecentPickups();
        this.updateNotifications();
    }

    updateRecentPickups() {
        const recentPickupsContainer = this.dom.elements.recentPickups;
        
        if (appState.pickups.length === 0) {
            return; // Keep the empty state
        }
        
        // Clear empty state
        recentPickupsContainer.innerHTML = '';
        
        // Add recent pickups (last 3)
        const recentPickups = appState.pickups.slice(-3).reverse();
        
        recentPickups.forEach(pickup => {
            const pickupElement = document.createElement('div');
            pickupElement.className = 'pickup-item fade-in';
            
            const wasteTypeIcon = this.getWasteTypeIcon(pickup.wasteType);
            const statusBadge = this.getStatusBadge(pickup.status);
            
            pickupElement.innerHTML = `
                <div class="d-flex justify-content-between align-items-start">
                    <div class="d-flex align-items-center">
                        <div class="me-3">
                            <i class="bi ${wasteTypeIcon} fs-4 text-primary"></i>
                        </div>
                        <div>
                            <h6 class="mb-1">${this.capitalizeFirstLetter(pickup.wasteType)} Pickup</h6>
                            <p class="mb-1 small text-muted">${this.formatDate(pickup.completedDate || pickup.scheduledDate)}</p>
                            <p class="mb-0 small">${pickup.address}</p>
                        </div>
                    </div>
                    <div class="text-end">
                        ${statusBadge}
                        <div class="mt-1">
                            <span class="text-warning fw-bold">+${pickup.points} pts</span>
                        </div>
                    </div>
                </div>
            `;
            
            recentPickupsContainer.appendChild(pickupElement);
        });
    }

    updateNotifications() {
        const notificationsContainer = this.dom.elements.notificationsList;
        notificationsContainer.innerHTML = '';
        
        // Show only unread or recent notifications (last 5)
        const recentNotifications = appState.notifications
            .filter(notification => !notification.read)
            .slice(0, 5);
        
        if (recentNotifications.length === 0) {
            notificationsContainer.innerHTML = `
                <div class="text-center text-muted py-3">
                    <i class="bi bi-bell-slash fs-1"></i>
                    <p class="mt-2">No new notifications</p>
                </div>
            `;
            return;
        }
        
        recentNotifications.forEach(notification => {
            const notificationElement = document.createElement('div');
            notificationElement.className = 'notification-item fade-in';
            
            const iconClass = this.getNotificationIcon(notification.type);
            const iconBg = this.getNotificationBgClass(notification.type);
            
            notificationElement.innerHTML = `
                <div class="notification-icon ${iconBg} rounded-circle d-flex align-items-center justify-content-center" style="width: 40px; height: 40px;">
                    <i class="bi ${iconClass} text-white"></i>
                </div>
                <div class="notification-content flex-grow-1">
                    <p class="mb-1 small">${notification.message}</p>
                    <small class="text-muted">${this.formatRelativeTime(notification.timestamp)}</small>
                </div>
                <button class="btn btn-sm btn-outline-secondary" onclick="app.notificationManager.markAsRead(${notification.id})">
                    <i class="bi bi-x"></i>
                </button>
            `;
            
            notificationsContainer.appendChild(notificationElement);
        });
    }

    getWasteTypeIcon(wasteType) {
        const icons = {
            plastic: 'bi-droplet',
            glass: 'bi-cup-straw',
            paper: 'bi-file-earmark-text',
            metal: 'bi-gear',
            electronic: 'bi-cpu',
            organic: 'bi-flower1',
            general: 'bi-trash'
        };
        return icons[wasteType] || 'bi-trash';
    }

    getStatusBadge(status) {
        const statusTexts = {
            scheduled: 'Scheduled',
            pending: 'Pending',
            completed: 'Completed',
            cancelled: 'Cancelled'
        };
        
        const statusClasses = {
            scheduled: 'status-scheduled',
            pending: 'status-pending',
            completed: 'status-completed',
            cancelled: 'status-cancelled'
        };
        
        return `<span class="status-badge ${statusClasses[status]}">${statusTexts[status]}</span>`;
    }

    getNotificationIcon(type) {
        const icons = {
            success: 'bi-check-circle',
            info: 'bi-info-circle',
            warning: 'bi-exclamation-triangle',
            error: 'bi-x-circle'
        };
        return icons[type] || 'bi-info-circle';
    }

    getNotificationBgClass(type) {
        const bgClasses = {
            success: 'bg-success',
            info: 'bg-info',
            warning: 'bg-warning',
            error: 'bg-danger'
        };
        return bgClasses[type] || 'bg-info';
    }

    capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    formatDate(dateString) {
        const options = { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return new Date(dateString).toLocaleDateString('en-US', options);
    }

    formatRelativeTime(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} minutes ago`;
        if (diffHours < 24) return `${diffHours} hours ago`;
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        
        return this.formatDate(date);
    }
}

// Pickup Manager
class PickupManager {
    constructor(domManager, userManager) {
        this.dom = domManager;
        this.userManager = userManager;
    }

    initializePickupForm() {
        // Set minimum datetime to current time
        const now = new Date();
        const formattedNow = now.toISOString().slice(0, 16);
        document.getElementById('scheduledDate').min = formattedNow;
        
        // Add event listeners for point calculation
        document.getElementById('wasteType').addEventListener('change', () => this.calculateEstimatedPoints());
        document.getElementById('wasteSize').addEventListener('change', () => this.calculateEstimatedPoints());
        document.getElementById('urgency').addEventListener('change', () => this.calculateEstimatedPoints());
        
        // Form submission
        this.dom.elements.pickupForm.addEventListener('submit', (e) => this.handlePickupSubmission(e));
        
        // Initialize points calculation
        this.calculateEstimatedPoints();
        
        // Initialize location manager
        this.initializeLocationManager();
    }

    calculateEstimatedPoints() {
        const wasteType = document.getElementById('wasteType').value;
        const wasteSize = document.getElementById('wasteSize').value;
        const urgency = document.getElementById('urgency').value;
        
        if (!wasteType || !wasteSize) {
            this.dom.setText('estimatedPoints', '0 points');
            return;
        }
        
        const basePoints = appState.pointsSystem[wasteType][wasteSize];
        const multiplier = appState.urgencyMultipliers[urgency];
        const estimatedPoints = Math.round(basePoints * multiplier);
        
        this.dom.setText('estimatedPoints', `${estimatedPoints} points`);
    }

    handlePickupSubmission(e) {
        e.preventDefault();
        
        const wasteType = document.getElementById('wasteType').value;
        const wasteSize = document.getElementById('wasteSize').value;
        const description = document.getElementById('description').value;
        const latitude = parseFloat(document.getElementById('latitude').value);
        const longitude = parseFloat(document.getElementById('longitude').value);
        const address = document.getElementById('address').value;
        const scheduledDate = document.getElementById('scheduledDate').value;
        const urgency = document.getElementById('urgency').value;
        
        // Validate required fields
        if (!wasteType || !wasteSize || !latitude || !longitude || !scheduledDate) {
            app.notificationManager.showToast('Please fill in all required fields.', 'error');
            return;
        }
        
        // Calculate points
        const basePoints = appState.pointsSystem[wasteType][wasteSize];
        const multiplier = appState.urgencyMultipliers[urgency];
        const points = Math.round(basePoints * multiplier);
        
        // Estimate waste amount based on size
        const wasteAmounts = { small: 3, medium: 10, large: 20 };
        const wasteAmount = wasteAmounts[wasteSize];
        
        // Create new pickup
        const newPickup = {
            id: Date.now(), // Use timestamp as unique ID
            wasteType,
            wasteSize,
            description,
            location: { lat: latitude, lng: longitude },
            address: address || `Coordinates: ${latitude}, ${longitude}`,
            scheduledDate,
            urgency,
            status: 'scheduled',
            points,
            wasteAmount,
            completedDate: null
        };
        
        // Add to pickups
        appState.pickups.push(newPickup);
        
        // Update user stats
        appState.user.totalPickups += 1;
        appState.user.monthlyStats.pickups += 1;
        appState.user.monthlyStats.points += points;
        appState.user.monthlyStats.waste += wasteAmount;
        
        // Show success message
        app.notificationManager.showToast(`Pickup scheduled successfully! You'll earn ${points} points upon completion.`, 'success');
        
        // Add notification
        app.notificationManager.addNotification({
            message: `New pickup scheduled: ${wasteType} (${wasteSize}) for ${this.formatDate(scheduledDate)}`,
            type: 'info'
        });
        
        // Reset form
        this.dom.elements.pickupForm.reset();
        
        // Update estimated points
        this.calculateEstimatedPoints();
        
        // Return to dashboard
        app.sectionManager.showSection('dashboard');
        
        // Update dashboard data
        this.userManager.initializeUserData();
        app.dashboardManager.initializeDashboard();
    }

    initializeLocationManager() {
        // GPS location handler
        document.getElementById('gpsLocation').addEventListener('change', function() {
            if (this.checked) {
                app.pickupManager.locateUser();
            }
        });

        // Manual location input handler
        document.getElementById('manualLocation').addEventListener('change', function() {
            if (this.checked) {
                document.getElementById('latitude').value = '';
                document.getElementById('longitude').value = '';
                document.getElementById('address').value = '';
            }
        });
    }

    locateUser() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    
                    document.getElementById('latitude').value = lat.toFixed(6);
                    document.getElementById('longitude').value = lng.toFixed(6);
                    
                    // Reverse geocoding would go here in a real app
                    document.getElementById('address').value = "Current Location (GPS)";
                    
                    app.notificationManager.showToast('Location set using GPS.', 'success');
                },
                (error) => {
                    console.error('Geolocation error:', error);
                    // Fallback to demo coordinates
                    this.setDemoLocation();
                }
            );
        } else {
            // Fallback to demo coordinates
            this.setDemoLocation();
        }
    }

    setDemoLocation() {
        document.getElementById('latitude').value = -1.2921;
        document.getElementById('longitude').value = 36.8219;
        document.getElementById('address').value = "Nairobi, Kenya";
        app.notificationManager.showToast('Location set to demo coordinates.', 'info');
    }

    formatDate(dateString) {
        const options = { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return new Date(dateString).toLocaleDateString('en-US', options);
    }

    displayPickupHistory() {
        const historyContainer = this.dom.elements.historyContent;
        
        if (appState.pickups.length === 0) {
            return; // Keep the empty state
        }
        
        // Clear empty state
        historyContainer.innerHTML = '';
        
        // Sort pickups by date (newest first)
        const sortedPickups = [...appState.pickups].sort((a, b) => {
            return new Date(b.scheduledDate) - new Date(a.scheduledDate);
        });
        
        // Create history items
        sortedPickups.forEach(pickup => {
            const historyItem = document.createElement('div');
            historyItem.className = 'pickup-item fade-in';
            
            const wasteTypeIcon = app.dashboardManager.getWasteTypeIcon(pickup.wasteType);
            const statusBadge = app.dashboardManager.getStatusBadge(pickup.status);
            const pointsDisplay = pickup.status === 'completed' ? 
                `<span class="text-warning fw-bold">+${pickup.points} pts</span>` : 
                `<span class="text-muted">Estimated: ${pickup.points} pts</span>`;
            
            historyItem.innerHTML = `
                <div class="d-flex justify-content-between align-items-start">
                    <div class="d-flex align-items-center">
                        <div class="me-3">
                            <i class="bi ${wasteTypeIcon} fs-4 text-primary"></i>
                        </div>
                        <div>
                            <h6 class="mb-1">${app.dashboardManager.capitalizeFirstLetter(pickup.wasteType)} Pickup - ${app.dashboardManager.capitalizeFirstLetter(pickup.wasteSize)}</h6>
                            <p class="mb-1 small text-muted">Scheduled: ${app.dashboardManager.formatDate(pickup.scheduledDate)}</p>
                            <p class="mb-0 small">${pickup.address}</p>
                            ${pickup.description ? `<p class="mb-0 small text-muted mt-1">${pickup.description}</p>` : ''}
                        </div>
                    </div>
                    <div class="text-end">
                        ${statusBadge}
                        <div class="mt-1">
                            ${pointsDisplay}
                        </div>
                        <div class="mt-1">
                            <small class="text-muted">${app.dashboardManager.capitalizeFirstLetter(pickup.urgency)} urgency</small>
                        </div>
                    </div>
                </div>
            `;
            
            historyContainer.appendChild(historyItem);
        });
    }
}

// Rewards Manager
class RewardsManager {
    constructor(domManager, userManager) {
        this.dom = domManager;
        this.userManager = userManager;
        this.currentFilter = 'all';
    }

    initializeRewardsSystem() {
        this.updateRewardsDisplay();
        this.initializePointsTable();
        this.setupRewardFilters();
    }

    updateRewardsDisplay() {
        this.updateRewardsStats();
        this.renderRewardsList();
        this.renderRedeemedRewards();
    }

    updateRewardsStats() {
        const availableRewards = appState.rewards.filter(reward => !reward.redeemed).length;
        const redeemedRewards = appState.rewards.filter(reward => reward.redeemed).length;
        
        this.dom.setText('availablePoints', appState.user.points);
        this.dom.setText('totalRewards', availableRewards);
        this.dom.setText('redeemedRewards', redeemedRewards);
    }

    renderRewardsList() {
        const rewardsContainer = this.dom.elements.rewardsList;
        rewardsContainer.innerHTML = '';
        
        const availableRewards = appState.rewards.filter(reward => !reward.redeemed);
        
        if (availableRewards.length === 0) {
            rewardsContainer.innerHTML = `
                <div class="col-12">
                    <div class="empty-rewards">
                        <i class="bi bi-gift"></i>
                        <h5>No Available Rewards</h5>
                        <p class="text-muted">Check back later for new rewards!</p>
                    </div>
                </div>
            `;
            return;
        }
        
        availableRewards.forEach(reward => {
            const rewardElement = document.createElement('div');
            rewardElement.className = 'col-md-6 col-lg-4 mb-4 fade-in';
            rewardElement.setAttribute('data-category', reward.category);
            
            const canAfford = appState.user.points >= reward.points;
            
            rewardElement.innerHTML = `
                <div class="card reward-card h-100">
                    <div class="reward-image-container">
                        <img src="${reward.image}" alt="${reward.name}" class="reward-image">
                    </div>
                    <div class="card-body d-flex flex-column">
                        <h5 class="reward-title">${reward.name}</h5>
                        <p class="card-text text-muted flex-grow-1">${reward.description}</p>
                        <div class="d-flex justify-content-between align-items-center mt-auto">
                            <span class="badge bg-warning text-dark points-badge">${reward.points} pts</span>
                            <div>
                                <button class="btn btn-sm btn-outline-primary reward-btn me-1" onclick="app.rewardsManager.viewRewardDetails(${reward.id})">
                                    <i class="bi bi-eye me-1"></i>Details
                                </button>
                                <button class="btn btn-sm btn-primary reward-btn" onclick="app.rewardsManager.redeemReward(${reward.id})" 
                                    ${!canAfford ? 'disabled' : ''}>
                                    <i class="bi bi-gift me-1"></i>Redeem
                                </button>
                            </div>
                        </div>
                        ${!canAfford ? '<div class="mt-2 text-center"><small class="text-muted">Need ' + (reward.points - appState.user.points) + ' more points</small></div>' : ''}
                    </div>
                </div>
            `;
            
            rewardsContainer.appendChild(rewardElement);
        });
    }

    renderRedeemedRewards() {
        const redeemedContainer = this.dom.elements.redeemedRewardsList;
        redeemedContainer.innerHTML = '';
        
        const redeemedRewards = appState.rewards.filter(reward => reward.redeemed);
        
        if (redeemedRewards.length === 0) {
            this.dom.elements.redeemedSection.style.display = 'none';
            return;
        }
        
        this.dom.elements.redeemedSection.style.display = 'block';
        
        redeemedRewards.forEach(reward => {
            const rewardElement = document.createElement('div');
            rewardElement.className = 'col-md-6 col-lg-4 mb-4 fade-in';
            
            rewardElement.innerHTML = `
                <div class="card reward-card redeemed-reward-card h-100">
                    <div class="redeemed-badge">Redeemed</div>
                    <div class="reward-image-container">
                        <img src="${reward.image}" alt="${reward.name}" class="reward-image">
                    </div>
                    <div class="card-body d-flex flex-column">
                        <h5 class="reward-title">${reward.name}</h5>
                        <p class="card-text text-muted flex-grow-1">${reward.description}</p>
                        <div class="d-flex justify-content-between align-items-center mt-auto">
                            <span class="badge bg-secondary points-badge">${reward.points} pts</span>
                            <small class="text-muted">Already redeemed</small>
                        </div>
                    </div>
                </div>
            `;
            
            redeemedContainer.appendChild(rewardElement);
        });
    }

    initializePointsTable() {
        const pointsTable = this.dom.elements.pointsTable;
        pointsTable.innerHTML = '';
        
        for (const wasteType in appState.pointsSystem) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${app.dashboardManager.capitalizeFirstLetter(wasteType)}</td>
                <td>${appState.pointsSystem[wasteType].small} pts</td>
                <td>${appState.pointsSystem[wasteType].medium} pts</td>
                <td>${appState.pointsSystem[wasteType].large} pts</td>
            `;
            pointsTable.appendChild(row);
        }
    }

    setupRewardFilters() {
        const filterButtons = document.querySelectorAll('.filter-btn');
        
        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Update active button
                filterButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                // Filter rewards
                this.currentFilter = button.getAttribute('data-filter');
                this.filterRewards(this.currentFilter);
            });
        });
    }

    filterRewards(filter) {
        const rewardCards = document.querySelectorAll('#rewardsList .col-md-6');
        const redeemedSection = this.dom.elements.redeemedSection;
        
        if (filter === 'all') {
            rewardCards.forEach(card => card.style.display = 'block');
            redeemedSection.style.display = 'block';
        } else if (filter === 'redeemed') {
            rewardCards.forEach(card => card.style.display = 'none');
            redeemedSection.style.display = 'block';
        } else {
            rewardCards.forEach(card => {
                if (card.getAttribute('data-category') === filter) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
            redeemedSection.style.display = 'none';
        }
    }

    viewRewardDetails(rewardId) {
        const reward = appState.rewards.find(r => r.id === rewardId);
        if (!reward) return;
        
        // Populate modal with reward details
        this.dom.setText('rewardModalTitle', reward.name);
        this.dom.elements.rewardModalImage.src = reward.image;
        this.dom.elements.rewardModalImage.alt = reward.name;
        this.dom.setText('rewardModalName', reward.name);
        this.dom.setText('rewardModalDescription', reward.description);
        this.dom.setText('rewardModalPoints', reward.points);
        this.dom.setText('rewardModalUserPoints', appState.user.points);
        
        const canAfford = appState.user.points >= reward.points;
        const isRedeemed = reward.redeemed;
        
        if (isRedeemed) {
            this.dom.setHTML('rewardModalStatus', '<div class="alert alert-success"><i class="bi bi-check-circle me-2"></i>You have already redeemed this reward</div>');
            this.dom.setText('rewardModalAction', 'Close');
            this.dom.elements.rewardModalAction.className = 'btn btn-secondary';
            this.dom.elements.rewardModalAction.onclick = () => {
                bootstrap.Modal.getInstance(this.dom.elements.rewardDetailModal).hide();
            };
        } else if (canAfford) {
            this.dom.setHTML('rewardModalStatus', '<div class="alert alert-info"><i class="bi bi-info-circle me-2"></i>You have enough points to redeem this reward</div>');
            this.dom.setText('rewardModalAction', 'Redeem Now');
            this.dom.elements.rewardModalAction.className = 'btn btn-primary';
            this.dom.elements.rewardModalAction.onclick = () => {
                this.redeemReward(rewardId);
                bootstrap.Modal.getInstance(this.dom.elements.rewardDetailModal).hide();
            };
        } else {
            const pointsNeeded = reward.points - appState.user.points;
            this.dom.setHTML('rewardModalStatus', `<div class="alert alert-warning"><i class="bi bi-exclamation-triangle me-2"></i>You need ${pointsNeeded} more points to redeem this reward</div>`);
            this.dom.setText('rewardModalAction', 'Close');
            this.dom.elements.rewardModalAction.className = 'btn btn-secondary';
            this.dom.elements.rewardModalAction.onclick = () => {
                bootstrap.Modal.getInstance(this.dom.elements.rewardDetailModal).hide();
            };
        }
        
        // Show modal
        const modal = new bootstrap.Modal(this.dom.elements.rewardDetailModal);
        modal.show();
    }

    redeemReward(rewardId) {
        const reward = appState.rewards.find(r => r.id === rewardId);
        if (!reward) return;
        
        if (reward.redeemed) {
            app.notificationManager.showToast('You have already redeemed this reward!', 'warning');
            return;
        }
        
        if (appState.user.points < reward.points) {
            app.notificationManager.showToast(`You don't have enough points to redeem this reward. You need ${reward.points - appState.user.points} more points.`, 'error');
            return;
        }
        
        // Deduct points and mark as redeemed
        this.userManager.updateUserPoints(-reward.points);
        reward.redeemed = true;
        
        // Update UI
        this.updateRewardsDisplay();
        
        // Show success message
        app.notificationManager.showToast(`Congratulations! You've redeemed ${reward.name}.`, 'success');
        
        // Add notification
        app.notificationManager.addNotification({
            message: `You redeemed ${reward.name} for ${reward.points} points.`,
            type: 'success'
        });
    }
}

// Profile Manager
class ProfileManager {
    constructor(domManager, userManager) {
        this.dom = domManager;
        this.userManager = userManager;
    }

    initializeProfileSection() {
        this.populateProfileForm();
        this.updateProfileStats();
        this.setupEventListeners();
    }

    populateProfileForm() {
        this.dom.elements.profileNameInput.value = appState.user.name;
        this.dom.elements.profileEmailInput.value = appState.user.email;
        this.dom.elements.profilePhone.value = appState.user.phone;
        this.dom.elements.profileAddress.value = appState.user.address;
        
        // Set notification preferences
        document.getElementById('emailNotifications').checked = appState.user.preferences.emailNotifications;
        document.getElementById('pickupReminders').checked = appState.user.preferences.pickupReminders;
        document.getElementById('promotionalEmails').checked = appState.user.preferences.promotionalEmails;
        document.getElementById('rewardsUpdates').checked = appState.user.preferences.rewardsUpdates;
    }

    updateProfileStats() {
        this.dom.setText('statTotalPickups', appState.user.totalPickups);
        this.dom.setText('statTotalPoints', appState.user.points);
        this.dom.setText('statWasteRecycled', `${appState.user.wasteRecycled}kg`);
        this.dom.setText('statMemberSince', appState.user.memberSince);
    }

    setupEventListeners() {
        // Handle profile form submission
        document.getElementById('profileForm').addEventListener('submit', (e) => this.handleProfileUpdate(e));
    }

    handleProfileUpdate(e) {
        e.preventDefault();
        
        // Update user data
        appState.user.name = this.dom.elements.profileNameInput.value;
        appState.user.email = this.dom.elements.profileEmailInput.value;
        appState.user.phone = this.dom.elements.profilePhone.value;
        appState.user.address = this.dom.elements.profileAddress.value;
        
        // Update preferences
        appState.user.preferences = {
            emailNotifications: document.getElementById('emailNotifications').checked,
            pickupReminders: document.getElementById('pickupReminders').checked,
            promotionalEmails: document.getElementById('promotionalEmails').checked,
            rewardsUpdates: document.getElementById('rewardsUpdates').checked
        };
        
        // Update UI
        this.userManager.initializeUserData();
        
        // Show success message
        app.notificationManager.showToast('Profile updated successfully!', 'success');
        
        // Return to dashboard
        app.sectionManager.showSection('dashboard');
    }
}

// Notification Manager
class NotificationManager {
    constructor(domManager) {
        this.dom = domManager;
        this.toastContainer = document.getElementById('toastContainer');
    }

    showToast(message, type = 'info') {
        const toastEl = document.createElement('div');
        toastEl.className = `toast align-items-center text-white bg-${type === 'error' ? 'danger' : type} border-0`;
        toastEl.setAttribute('role', 'alert');
        toastEl.setAttribute('aria-live', 'assertive');
        toastEl.setAttribute('aria-atomic', 'true');
        
        toastEl.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        `;
        
        this.toastContainer.appendChild(toastEl);
        
        const toast = new bootstrap.Toast(toastEl, { delay: 5000 });
        toast.show();
        
        // Remove toast from DOM after it's hidden
        toastEl.addEventListener('hidden.bs.toast', () => {
            toastEl.remove();
        });
    }

    addNotification(notification) {
        const newNotification = {
            id: Date.now(),
            message: notification.message,
            type: notification.type || 'info',
            timestamp: new Date(),
            read: false
        };
        
        appState.notifications.unshift(newNotification);
        
        // Update notifications display if we're on the dashboard
        if (document.getElementById('dashboard-section').style.display !== 'none') {
            app.dashboardManager.updateNotifications();
        }
    }

    markAsRead(notificationId) {
        const notification = appState.notifications.find(n => n.id === notificationId);
        if (notification) {
            notification.read = true;
            app.dashboardManager.updateNotifications();
        }
    }

    markAllAsRead() {
        appState.notifications.forEach(notification => {
            notification.read = true;
        });
        app.dashboardManager.updateNotifications();
    }
}

// Section Manager
class SectionManager {
    constructor(domManager) {
        this.dom = domManager;
    }

    showSection(sectionName) {
        // Hide all sections
        document.querySelectorAll('.dashboard-section').forEach(section => {
            section.style.display = 'none';
        });
        
        // Show the selected section
        document.getElementById(`${sectionName}-section`).style.display = 'block';
        
        // Update active nav button
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-section') === sectionName) {
                btn.classList.add('active');
            }
        });
        
        // Special handling for certain sections
        this.handleSectionChange(sectionName);
    }

    handleSectionChange(sectionName) {
        switch (sectionName) {
            case 'history':
                app.pickupManager.displayPickupHistory();
                break;
            case 'rewards':
                app.rewardsManager.initializeRewardsSystem();
                break;
            case 'profile':
                app.profileManager.initializeProfileSection();
                break;
            case 'pickup':
                // Ensure form is reset and ready for new pickup
                app.pickupManager.calculateEstimatedPoints();
                break;
        }
    }
}

// Main Application Class
class SmartWasteApp {
    constructor() {
        this.domManager = new DOMManager();
        this.userManager = new UserManager(this.domManager);
        this.dashboardManager = new DashboardManager(this.domManager);
        this.pickupManager = new PickupManager(this.domManager, this.userManager);
        this.rewardsManager = new RewardsManager(this.domManager, this.userManager);
        this.profileManager = new ProfileManager(this.domManager, this.userManager);
        this.notificationManager = new NotificationManager(this.domManager);
        this.sectionManager = new SectionManager(this.domManager);
        
        this.initializeApp();
    }

    initializeApp() {
        // Set up global event listeners
        this.setupGlobalEventListeners();
        
        // Simulate loading delay
        setTimeout(() => {
            this.domManager.hideElement('loadingSpinner');
            this.domManager.showElement('mainContent');
            
            // Initialize all app components
            this.userManager.initializeUserData();
            this.dashboardManager.initializeDashboard();
            this.pickupManager.initializePickupForm();
            this.rewardsManager.initializeRewardsSystem();
            this.profileManager.initializeProfileSection();
            
            // Show dashboard by default
            this.sectionManager.showSection('dashboard');
            
            // Show welcome toast
            this.notificationManager.showToast('Welcome to SmartWaste!', 'success');
        }, 1500);
    }

    setupGlobalEventListeners() {
        // Logout functionality
        window.logout = () => {
            if (confirm('Are you sure you want to log out?')) {
                this.notificationManager.showToast('You have been logged out successfully.', 'info');
                // In a real app, this would redirect to login page or clear session
            }
        };

        // Global section navigation
        window.showSection = (sectionName) => {
            this.sectionManager.showSection(sectionName);
        };

        // Make managers available globally for onclick handlers
        window.app = this;
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.smartWasteApp = new SmartWasteApp();
});

// Utility function for external use
function refreshDashboard() {
    if (window.smartWasteApp) {
        window.smartWasteApp.userManager.initializeUserData();
        window.smartWasteApp.dashboardManager.initializeDashboard();
    }
}

// Export for potential module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        SmartWasteApp,
        refreshDashboard
    };
}