// dashboard-admin.js
// SmartWaste Admin Dashboard JavaScript Functionality

// Simple notification manager for admin dashboard
class AdminNotificationManager {
    constructor(domManager) {
        this.dom = domManager;
        this.toastContainer = document.getElementById('toastContainer');
    }

    showToast(message, type = 'info') {
        const container = this.toastContainer || document.body;
        const toastEl = document.createElement('div');
        const color = type === 'error' ? 'danger' : type;
        toastEl.className = `toast align-items-center text-white bg-${color} border-0`;
        toastEl.setAttribute('role', 'alert');
        toastEl.setAttribute('aria-live', 'assertive');
        toastEl.setAttribute('aria-atomic', 'true');
        toastEl.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;
        (this.toastContainer || container).appendChild(toastEl);
        try {
            const toast = new bootstrap.Toast(toastEl, { delay: 4000 });
            toast.show();
            toastEl.addEventListener('hidden.bs.toast', () => toastEl.remove());
        } catch (_) {
            // Fallback if Bootstrap JS not available
            setTimeout(() => toastEl.remove(), 4000);
        }
    }
}

// Simple section manager to switch between admin sections
class AdminSectionManager {
    constructor(domManager) {
        this.dom = domManager;
    }

    showSection(sectionName) {
        // Hide all sections
        document.querySelectorAll('.dashboard-section').forEach(section => {
            section.style.display = 'none';
        });

        // Show selected section
        const target = document.getElementById(`${sectionName}-section`);
        if (target) target.style.display = 'block';

        // Update active nav button
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-section') === sectionName) {
                btn.classList.add('active');
            }
        });
    }
}

// Application State for Admin
const adminAppState = {
    admin: {
        id: 1,
        name: "System Administrator",
        email: "admin@smartwaste.com",
        role: "super_admin",
        lastLogin: new Date()
    },
    systemStats: {
        totalUsers: 1247,
        totalCollectors: 45,
        totalPickups: 8923,
        activeSessions: 23,
        collectionEfficiency: 87.5,
        userGrowth: 12.3,
        collectorGrowth: 5.7,
        pickupGrowth: 18.2,
        efficiencyTrend: 2.1
    },
    users: [
        {
            id: 1,
            name: "Alex Johnson",
            email: "alex.johnson@example.com",
            tier: "silver",
            totalPickups: 12,
            points: 350,
            status: "active",
            joinedDate: "2023-01-15",
            lastActivity: "2024-01-20T10:30:00Z"
        },
        {
            id: 2,
            name: "Sarah Miller",
            email: "sarah.m@example.com",
            tier: "gold",
            totalPickups: 28,
            points: 1560,
            status: "active",
            joinedDate: "2023-03-22",
            lastActivity: "2024-01-20T09:15:00Z"
        },
        {
            id: 3,
            name: "Mike Chen",
            email: "mike.chen@example.com",
            tier: "bronze",
            totalPickups: 3,
            points: 85,
            status: "active",
            joinedDate: "2024-01-10",
            lastActivity: "2024-01-19T16:45:00Z"
        },
        {
            id: 4,
            name: "Emma Davis",
            email: "emma.davis@example.com",
            tier: "silver",
            totalPickups: 15,
            points: 620,
            status: "inactive",
            joinedDate: "2023-11-05",
            lastActivity: "2024-01-15T14:20:00Z"
        },
        {
            id: 5,
            name: "James Wilson",
            email: "james.w@example.com",
            tier: "bronze",
            totalPickups: 7,
            points: 210,
            status: "suspended",
            joinedDate: "2023-12-18",
            lastActivity: "2024-01-18T11:10:00Z"
        }
    ],
    collectors: [
        {
            id: 1,
            name: "Michael Rodriguez",
            email: "m.rodriguez@smartwaste.com",
            phone: "+1 (555) 123-4567",
            vehicle: "Small Truck",
            licensePlate: "SWT001",
            activePickups: 3,
            completedToday: 8,
            totalCompleted: 245,
            rating: 4.8,
            status: "active",
            onTimeRate: 94.2
        },
        {
            id: 2,
            name: "David Kim",
            email: "d.kim@smartwaste.com",
            phone: "+1 (555) 123-4568",
            vehicle: "Van",
            licensePlate: "SWT002",
            activePickups: 2,
            completedToday: 6,
            totalCompleted: 189,
            rating: 4.6,
            status: "active",
            onTimeRate: 91.5
        },
        {
            id: 3,
            name: "Lisa Thompson",
            email: "l.thompson@smartwaste.com",
            phone: "+1 (555) 123-4569",
            vehicle: "Car",
            licensePlate: "SWT003",
            activePickups: 1,
            completedToday: 4,
            totalCompleted: 156,
            rating: 4.9,
            status: "active",
            onTimeRate: 96.8
        },
        {
            id: 4,
            name: "Robert Brown",
            email: "r.brown@smartwaste.com",
            phone: "+1 (555) 123-4570",
            vehicle: "Bike",
            licensePlate: "SWT004",
            activePickups: 0,
            completedToday: 3,
            totalCompleted: 98,
            rating: 4.4,
            status: "inactive",
            onTimeRate: 88.3
        }
    ],
    pickups: [
        {
            id: 1,
            userId: 1,
            userName: "Alex Johnson",
            wasteType: "plastic",
            wasteSize: "medium",
            location: "123 Green Street, Eco City",
            scheduledDate: "2024-01-20T10:00:00Z",
            collectorId: 1,
            collectorName: "Michael Rodriguez",
            status: "completed",
            points: 45,
            completedDate: "2024-01-20T11:30:00Z"
        },
        {
            id: 2,
            userId: 2,
            userName: "Sarah Miller",
            wasteType: "electronic",
            wasteSize: "small",
            location: "456 Eco Avenue, Green City",
            scheduledDate: "2024-01-20T14:00:00Z",
            collectorId: 2,
            collectorName: "David Kim",
            status: "inProgress",
            points: 50,
            completedDate: null
        },
        {
            id: 3,
            userId: 3,
            userName: "Mike Chen",
            wasteType: "paper",
            wasteSize: "large",
            location: "789 Sustainable Road, Eco City",
            scheduledDate: "2024-01-20T09:00:00Z",
            collectorId: null,
            collectorName: null,
            status: "accepted",
            points: 45,
            completedDate: null
        },
        {
            id: 4,
            userId: 4,
            userName: "Emma Davis",
            wasteType: "glass",
            wasteSize: "medium",
            location: "321 Recycle Lane, Green City",
            scheduledDate: "2024-01-19T16:00:00Z",
            collectorId: null,
            collectorName: null,
            status: "pending",
            points: 40,
            completedDate: null
        },
        {
            id: 5,
            userId: 5,
            userName: "James Wilson",
            wasteType: "organic",
            wasteSize: "small",
            location: "654 Compost Street, Eco City",
            scheduledDate: "2024-01-18T11:00:00Z",
            collectorId: 3,
            collectorName: "Lisa Thompson",
            status: "cancelled",
            points: 15,
            completedDate: null
        }
    ],
    rewards: [
        {
            id: 1,
            name: "Eco-Friendly Water Bottle",
            description: "Stainless steel insulated water bottle",
            points: 150,
            category: "eco",
            stock: 45,
            redeemed: 23,
            status: "active"
        },
        {
            id: 2,
            name: "Silver Membership Upgrade",
            description: "Upgrade to Silver membership",
            points: 500,
            category: "membership",
            stock: 1000,
            redeemed: 156,
            status: "active"
        },
        {
            id: 3,
            name: "$10 Eco Store Voucher",
            description: "Digital voucher for eco store",
            points: 300,
            category: "voucher",
            stock: 200,
            redeemed: 89,
            status: "active"
        },
        {
            id: 4,
            name: "Bamboo Toothbrush Set",
            description: "Set of 4 biodegradable toothbrushes",
            points: 80,
            category: "eco",
            stock: 0,
            redeemed: 150,
            status: "out_of_stock"
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
    activityLog: [
        {
            id: 1,
            type: "user_registration",
            description: "New user registered: Mike Chen",
            timestamp: new Date(Date.now() - 3600000),
            user: "System"
        },
        {
            id: 2,
            type: "pickup_completed",
            description: "Pickup #245 completed by Michael Rodriguez",
            timestamp: new Date(Date.now() - 7200000),
            user: "Collector Bot"
        },
        {
            id: 3,
            type: "reward_redemption",
            description: "Sarah Miller redeemed Silver Membership",
            timestamp: new Date(Date.now() - 10800000),
            user: "Rewards System"
        },
        {
            id: 4,
            type: "system_alert",
            description: "High pickup volume detected in Eco City area",
            timestamp: new Date(Date.now() - 14400000),
            user: "Monitoring System"
        }
    ]
};

// DOM Elements Manager for Admin
class AdminDOMManager {
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
            
            // Admin information
            adminName: document.getElementById('adminName'),
            adminNameDisplay: document.getElementById('adminNameDisplay'),
            welcomeName: document.getElementById('welcomeName'),
            
            // System stats
            totalUsers: document.getElementById('totalUsers'),
            totalCollectors: document.getElementById('totalCollectors'),
            totalPickups: document.getElementById('totalPickups'),
            activeSessions: document.getElementById('activeSessions'),
            systemLoad: document.getElementById('systemLoad'),
            
            // Metrics
            metricUsers: document.getElementById('metricUsers'),
            metricCollectors: document.getElementById('metricCollectors'),
            metricPickups: document.getElementById('metricPickups'),
            metricEfficiency: document.getElementById('metricEfficiency'),
            userGrowth: document.getElementById('userGrowth'),
            collectorGrowth: document.getElementById('collectorGrowth'),
            pickupGrowth: document.getElementById('pickupGrowth'),
            efficiencyTrend: document.getElementById('efficiencyTrend'),
            
            // Content sections
            recentActivity: document.getElementById('recentActivity'),
            usersTable: document.getElementById('usersTable'),
            collectorsTable: document.getElementById('collectorsTable'),
            pickupsTable: document.getElementById('pickupsTable'),
            rewardsTable: document.getElementById('rewardsTable'),
            pointsConfigTable: document.getElementById('pointsConfigTable'),
            reportsTable: document.getElementById('reportsTable'),
            
            // Collector stats
            totalActiveCollectors: document.getElementById('totalActiveCollectors'),
            avgCollectorRating: document.getElementById('avgCollectorRating'),
            totalCompletedPickups: document.getElementById('totalCompletedPickups'),
            onTimeRate: document.getElementById('onTimeRate'),
            
            // Pickup stats
            pickupPending: document.getElementById('pickupPending'),
            pickupAccepted: document.getElementById('pickupAccepted'),
            pickupInProgress: document.getElementById('pickupInProgress'),
            pickupCompleted: document.getElementById('pickupCompleted'),
            pickupCancelled: document.getElementById('pickupCancelled'),
            pickupOverdue: document.getElementById('pickupOverdue'),
            
            // Rewards stats
            totalPointsIssued: document.getElementById('totalPointsIssued'),
            totalRewardsRedeemed: document.getElementById('totalRewardsRedeemed'),
            activeRewards: document.getElementById('activeRewards'),
            redemptionRate: document.getElementById('redemptionRate'),
            
            // Modal elements
            addCollectorModal: document.getElementById('addCollectorModal'),
            addRewardModal: document.getElementById('addRewardModal'),
            
            // Chart elements
            pickupTrendsChart: document.getElementById('pickupTrendsChart'),
            wasteDistributionChart: document.getElementById('wasteDistributionChart'),
            userGrowthChart: document.getElementById('userGrowthChart'),
            efficiencyChart: document.getElementById('efficiencyChart'),
            performanceChart: document.getElementById('performanceChart'),
            
            // Map element
            analyticsMap: document.getElementById('analyticsMap')
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

// Admin Manager
class AdminManager {
    constructor(domManager) {
        this.dom = domManager;
    }

    async initializeAdminData() {
        try {
            this.updateAdminInformation();
            // Load dashboard metrics from API
            if (window.loadingManager) window.loadingManager.show('dashboard-section', 'Loading dashboard...');
            const res = await window.apiService.getAdminDashboard();
            const stats = res?.data?.stats || res?.stats || {};
            const totals = {
                totalUsers: stats.totalUsers || 0,
                totalCollectors: stats.totalCollectors || 0,
                totalPickups: stats.totalPickups || 0
            };
            // Sidebar quick stats
            this.dom.setText('totalUsers', (totals.totalUsers).toLocaleString());
            this.dom.setText('totalCollectors', (totals.totalCollectors).toLocaleString());
            this.dom.setText('totalPickups', (totals.totalPickups).toLocaleString());
            // Key metrics cards
            this.dom.setText('metricUsers', (totals.totalUsers).toLocaleString());
            this.dom.setText('metricCollectors', (totals.totalCollectors).toLocaleString());
            this.dom.setText('metricPickups', (totals.totalPickups).toLocaleString());
            // Simple placeholders for growth/efficiency if not provided
            this.dom.setText('metricEfficiency', `${Math.max(0, Math.min(100, Math.round((stats.todayStats?.todayCompleted || 0) / ((stats.todayStats?.todayPickups || 1)) * 100)))}%`);
            this.dom.setText('userGrowth', `+0% this month`);
            this.dom.setText('collectorGrowth', `+0% this month`);
            this.dom.setText('pickupGrowth', `+0% this month`);
            this.dom.setText('efficiencyTrend', `+0% improvement`);
        } catch (err) {
            if (window.errorHandler) window.errorHandler.handle(err, app.notificationManager);
        } finally {
            if (window.loadingManager) window.loadingManager.hide('dashboard-section');
        }
    }

    updateAdminInformation() {
        try {
            const admin = JSON.parse(localStorage.getItem('adminUser') || '{}');
            const name = admin?.name || 'Administrator';
            this.dom.setText('adminName', name);
            this.dom.setText('adminNameDisplay', name);
            this.dom.setText('welcomeName', name);
        } catch (_) {
            this.dom.setText('adminName', 'Administrator');
            this.dom.setText('adminNameDisplay', 'Administrator');
            this.dom.setText('welcomeName', 'Administrator');
        }
    }

    updateSystemStats() {
        // kept for compatibility if needed elsewhere
    }

    updateMetrics() {}
}

// Dashboard Manager for Admin
class AdminDashboardManager {
    constructor(domManager) {
        this.dom = domManager;
        this.charts = {};
    }

    initializeDashboard() {
        this.updateRecentActivity();
        this.initializeCharts();
        this.initializeMap();
    }

    updateRecentActivity() {
        const activityContainer = this.dom.elements.recentActivity;
        
        if (adminAppState.activityLog.length === 0) {
            return; // Keep the empty state
        }
        
        // Clear empty state
        activityContainer.innerHTML = '';
        
        // Add recent activity
        adminAppState.activityLog.forEach(activity => {
            const activityElement = document.createElement('div');
            activityElement.className = 'notification-item fade-in';
            
            const iconClass = this.getActivityIcon(activity.type);
            const iconBg = this.getActivityBgClass(activity.type);
            
            activityElement.innerHTML = `
                <div class="notification-icon ${iconBg} rounded-circle d-flex align-items-center justify-content-center" style="width: 40px; height: 40px;">
                    <i class="bi ${iconClass} text-white"></i>
                </div>
                <div class="notification-content flex-grow-1">
                    <p class="mb-1 small">${activity.description}</p>
                    <small class="text-muted">${this.formatRelativeTime(activity.timestamp)} • By ${activity.user}</small>
                </div>
            `;
            
            activityContainer.appendChild(activityElement);
        });
    }

    initializeCharts() {
        this.createPickupTrendsChart();
        this.createWasteDistributionChart();
        this.createUserGrowthChart();
        this.createEfficiencyChart();
        this.createPerformanceChart();
    }

    createPickupTrendsChart() {
        const ctx = this.dom.elements.pickupTrendsChart.getContext('2d');
        this.charts.pickupTrends = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Jan 1', 'Jan 2', 'Jan 3', 'Jan 4', 'Jan 5', 'Jan 6', 'Jan 7'],
                datasets: [{
                    label: 'Pickups Completed',
                    data: [45, 52, 48, 61, 55, 58, 65],
                    borderColor: '#10B981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#94A3B8'
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#94A3B8'
                        }
                    }
                }
            }
        });
    }

    createWasteDistributionChart() {
        const ctx = this.dom.elements.wasteDistributionChart.getContext('2d');
        this.charts.wasteDistribution = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Plastic', 'Paper', 'Glass', 'Metal', 'Electronic', 'Organic', 'General'],
                datasets: [{
                    data: [25, 20, 15, 12, 8, 12, 8],
                    backgroundColor: [
                        '#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#6366F1', '#94A3B8'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#94A3B8',
                            padding: 20
                        }
                    }
                }
            }
        });
    }

    createUserGrowthChart() {
        const ctx = this.dom.elements.userGrowthChart.getContext('2d');
        this.charts.userGrowth = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                datasets: [{
                    label: 'New Users',
                    data: [45, 52, 48, 61],
                    backgroundColor: '#3B82F6'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#94A3B8'
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#94A3B8'
                        }
                    }
                }
            }
        });
    }

    createEfficiencyChart() {
        const ctx = this.dom.elements.efficiencyChart.getContext('2d');
        this.charts.efficiency = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    label: 'Efficiency Rate',
                    data: [85, 82, 88, 87, 90, 86, 89],
                    borderColor: '#10B981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        min: 80,
                        max: 100,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#94A3B8'
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#94A3B8'
                        }
                    }
                }
            }
        });
    }

    createPerformanceChart() {
        const ctx = this.dom.elements.performanceChart.getContext('2d');
        this.charts.performance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Plastic', 'Paper', 'Glass', 'Metal', 'Electronic', 'Organic'],
                datasets: [
                    {
                        label: 'Collection Rate',
                        data: [92, 88, 85, 90, 82, 87],
                        backgroundColor: '#10B981'
                    },
                    {
                        label: 'User Participation',
                        data: [78, 82, 75, 80, 70, 85],
                        backgroundColor: '#3B82F6'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#94A3B8'
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#94A3B8'
                        }
                    }
                }
            }
        });
    }

    initializeMap() {
        try {
            // Initialize map with default coordinates
            const map = L.map('analyticsMap').setView([-1.2921, 36.8219], 12);
            
            // Add OpenStreetMap tiles
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: 'OpenStreetMap contributors',
                maxZoom: 18
            }).addTo(map);
            
            // Load real heatmap data from API
            this.loadHeatmapData(map);
            
        } catch (error) {
            console.error("Error initializing map:", error);
        }
    }

    async loadHeatmapData(map) {
        try {
            const res = await window.apiService.request('/analytics/heatmap');
            const points = res?.data || [];
            if (!Array.isArray(points) || points.length === 0) return;
            points.forEach(p => {
                const lat = p.location?.lat;
                const lng = p.location?.lng;
                if (typeof lat !== 'number' || typeof lng !== 'number') return;
                const count = p.count || 1;
                const color = count > 10 ? '#EF4444' : count > 5 ? '#F59E0B' : '#10B981';
                L.circleMarker([lat, lng], {
                    color,
                    fillColor: color,
                    fillOpacity: 0.6,
                    radius: Math.min(12, 4 + Math.log2(count + 1) * 3)
                }).addTo(map).bindTooltip(`Pickups: ${count}\nCompleted: ${p.completed || 0}`);
            });
        } catch (e) {
            console.warn('Failed to load heatmap data', e);
        }
    }

    getActivityIcon(type) {
        const icons = {
            user_registration: 'bi-person-plus',
            pickup_completed: 'bi-check-circle',
            reward_redemption: 'bi-gift',
            system_alert: 'bi-exclamation-triangle'
        };
        return icons[type] || 'bi-info-circle';
    }

    getActivityBgClass(type) {
        const bgClasses = {
            user_registration: 'bg-primary',
            pickup_completed: 'bg-success',
            reward_redemption: 'bg-warning',
            system_alert: 'bg-danger'
        };
        return bgClasses[type] || 'bg-info';
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
        
        return date.toLocaleDateString();
    }
}

// User Management Manager
class UserManager {
    constructor(domManager) {
        this.dom = domManager;
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.filters = { search: '', status: '', tier: '', date: '' };
    }

    async initializeUserManagement() {
        this.setupUserFilters();
        await this.loadAndRenderUsers();
    }

    async loadAndRenderUsers() {
        const usersTable = this.dom.elements.usersTable;
        usersTable.innerHTML = '';
        try {
            if (window.loadingManager) window.loadingManager.show('users-section', 'Loading users...');
            const params = {
                page: this.currentPage,
                limit: this.itemsPerPage,
                search: this.filters.search || undefined,
                status: this.filters.status || undefined,
                tier: this.filters.tier || undefined,
                date: this.filters.date || undefined
            };
            const res = await window.apiService.getAdminUsers(params);
            const users = res?.data || [];
            if (!users.length) {
                usersTable.innerHTML = `
                    <tr>
                        <td colspan="8" class="text-center py-4">
                            <div class="empty-state">
                                <i class="bi bi-people"></i>
                                <h5>No Users Found</h5>
                                <p class="text-muted">No users match your current filters.</p>
                            </div>
                        </td>
                    </tr>
                `;
                return;
            }
            users.forEach(user => {
                const tierBadge = this.getTierBadge(user.tier);
                const statusBadge = this.getStatusBadge(user.status);
                
                const row = document.createElement('tr');
                row.className = 'fade-in';
                row.innerHTML = `
                    <td>
                        <div class="d-flex align-items-center">
                            <div class="avatar-circle-sm bg-primary me-3">
                                <i class="bi bi-person"></i>
                            </div>
                            <div>
                            <strong>${user.name || user.email}</strong>
                            <br>
                            <small class="text-muted">ID: ${user._id || user.id}</small>
                            </div>
                        </div>
                    </td>
                    <td>${user.email || ''}</td>
                    <td>${tierBadge}</td>
                    <td>${user.residentData?.totalPickups || 0}</td>
                    <td>
                    <span class="text-warning fw-bold">${user.points || 0}</span>
                    </td>
                    <td>${statusBadge}</td>
                    <td>${this.formatDate(user.createdAt || user.joinedDate)}</td>
                    <td>
                        <div class="btn-group btn-group-sm">
                            <button class="btn btn-outline-primary" onclick="app.userManager.viewUserDetails('${user._id || user.id}')">
                                <i class="bi bi-eye"></i>
                            </button>
                            <button class="btn btn-outline-warning" onclick="app.userManager.editUser('${user._id || user.id}')">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-outline-danger" onclick="app.userManager.toggleUserStatus('${user._id || user.id}', '${user.status}')">
                                <i class="bi bi-slash-circle"></i>
                            </button>
                        </div>
                    </td>
                `;
                usersTable.appendChild(row);
            });
            // Render pagination
            this.renderUsersPagination(res?.meta);
        } catch (err) {
            if (window.errorHandler) window.errorHandler.handle(err, app.notificationManager);
        } finally {
            if (window.loadingManager) window.loadingManager.hide('users-section');
        }
    }

    renderUsersPagination(meta) {
        const pag = document.getElementById('usersPagination');
        const info = document.getElementById('usersPaginationInfo');
        if (!pag || !meta) return;
        const page = meta.page || 1;
        const pages = meta.pages || 1;
        const total = meta.total || 0;
        pag.innerHTML = '';
        const createItem = (p, label = p, disabled = false, active = false) => {
            const li = document.createElement('li');
            li.className = `page-item ${disabled ? 'disabled' : ''} ${active ? 'active' : ''}`;
            const a = document.createElement('a');
            a.className = 'page-link';
            a.href = '#';
            a.textContent = label;
            a.onclick = (e) => { e.preventDefault(); if (!disabled && !active) { this.currentPage = p; this.loadAndRenderUsers(); } };
            li.appendChild(a);
            pag.appendChild(li);
        };
        createItem(Math.max(1, page - 1), '«', page === 1, false);
        for (let p = Math.max(1, page - 2); p <= Math.min(pages, page + 2); p++) {
            createItem(p, String(p), false, p === page);
        }
        createItem(Math.min(pages, page + 1), '»', page === pages, false);
        if (info) info.textContent = `Showing page ${page} of ${pages} • ${total} users`;
    }

    setupUserFilters() {
        // Add event listeners for filter inputs
        const searchInput = document.getElementById('userSearch');
        const statusFilter = document.getElementById('userStatusFilter');
        const tierFilter = document.getElementById('userTierFilter');
        const dateFilter = document.getElementById('userDateFilter');

        if (searchInput) {
            searchInput.addEventListener('input', () => { this.filters.search = searchInput.value; this.filterUsers(); });
        }
        if (statusFilter) {
            statusFilter.addEventListener('change', () => { this.filters.status = statusFilter.value; this.filterUsers(); });
        }
        if (tierFilter) {
            tierFilter.addEventListener('change', () => { this.filters.tier = tierFilter.value; this.filterUsers(); });
        }
        if (dateFilter) {
            dateFilter.addEventListener('change', () => { this.filters.date = dateFilter.value; this.filterUsers(); });
        }
    }

    async filterUsers() {
        this.currentPage = 1;
        await this.loadAndRenderUsers();
    }

    getTierBadge(tier) {
        const tierClasses = {
            bronze: 'badge-bronze',
            silver: 'badge-silver',
            gold: 'badge-gold'
        };
        const tierText = tier.charAt(0).toUpperCase() + tier.slice(1);
        return `<span class="badge ${tierClasses[tier]}">${tierText}</span>`;
    }

    getStatusBadge(status) {
        const statusClasses = {
            active: 'status-active',
            inactive: 'status-inactive',
            suspended: 'status-suspended'
        };
        const statusText = status.charAt(0).toUpperCase() + status.slice(1);
        return `<span class="status-badge ${statusClasses[status]}">${statusText}</span>`;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '-';
        return date.toLocaleDateString();
    }

    async toggleUserStatus(userId, currentStatus) {
        try {
            const next = currentStatus === 'active' ? 'suspended' : 'active';
            await window.apiService.updateUserStatus(userId, next, 'Admin action');
            await this.loadAndRenderUsers();
            app.notificationManager?.showToast('User status updated', 'success');
        } catch (err) {
            if (window.errorHandler) window.errorHandler.handle(err, app.notificationManager);
        }
    }
}

// Collector Management Manager
class CollectorManager {
    constructor(domManager) {
        this.dom = domManager;
    }

    async initializeCollectorManagement() {
        await this.loadAndRenderCollectors();
    }

    async loadAndRenderCollectors() {
        const table = this.dom.elements.collectorsTable;
        if (!table) return;
        table.innerHTML = '';
        try {
            if (window.loadingManager) window.loadingManager.show('collectors-section', 'Loading collectors...');
            const res = await window.apiService.getAllCollectors();
            const collectors = res?.data || [];
            if (!collectors.length) {
                table.innerHTML = `
                    <tr>
                        <td colspan="8" class="text-center py-4">
                            <div class="empty-state">
                                <i class="bi bi-truck"></i>
                                <h5>No Collectors Found</h5>
                                <p class="text-muted">Try adding a new collector.</p>
                            </div>
                        </td>
                    </tr>`;
                return;
            }
            collectors.forEach(c => {
                const row = document.createElement('tr');
                row.className = 'fade-in';
                row.innerHTML = `
                    <td>
                        <div class="d-flex align-items-center">
                            <div class="avatar-circle-sm bg-info me-3">
                                <i class="bi bi-person-badge"></i>
                            </div>
                            <div>
                                <strong>${c.name || c.email}</strong><br>
                                <small class="text-muted">ID: ${c._id || ''}</small>
                            </div>
                        </div>
                    </td>
                    <td>${c.email || ''}</td>
                    <td>${c.phone || '-'}</td>
                    <td>${c.collectorData?.vehicle || '-'}</td>
                    <td>${c.collectorData?.licensePlate || '-'}</td>
                    <td><span class="status-badge ${c.status === 'active' ? 'status-active' : c.status === 'suspended' ? 'status-suspended' : 'status-inactive'}">${(c.status||'inactive').replace(/\b\w/g, m=>m.toUpperCase())}</span></td>
                    <td>${c.collectorData?.stats?.completedPickups || 0}</td>
                    <td>
                        <div class="btn-group btn-group-sm">
                            <button class="btn btn-outline-danger" onclick="app.collectorManager.toggleCollectorStatus('${c._id}', '${c.status || 'inactive'}')">
                                <i class="bi bi-slash-circle"></i>
                            </button>
                        </div>
                    </td>`;
                table.appendChild(row);
            });
        } catch (err) {
            if (window.errorHandler) window.errorHandler.handle(err, app.notificationManager);
        } finally {
            if (window.loadingManager) window.loadingManager.hide('collectors-section');
        }
    }

    async toggleCollectorStatus(collectorId, currentStatus) {
        try {
            const next = currentStatus === 'active' ? 'suspended' : 'active';
            await window.apiService.updateCollectorStatus(collectorId, next);
            await this.loadAndRenderCollectors();
            app.notificationManager?.showToast('Collector status updated', 'success');
        } catch (err) {
            if (window.errorHandler) window.errorHandler.handle(err, app.notificationManager);
        }
    }
}

// Pickup Management Manager
class PickupManager {
    constructor(domManager) {
        this.dom = domManager;
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.filters = { status: '', wasteType: '', dateFrom: '', dateTo: '' };
    }

    async initializePickupManagement() {
        await Promise.all([
            this.loadAndRenderPickups(),
            this.loadPickupStats()
        ]);
    }

    async loadPickupStats() {
        try {
            const res = await window.apiService.getPickupStats();
            const stats = res?.data || {};
            if (this.dom.elements.pickupPending) this.dom.setText('pickupPending', (stats.pendingPickups || stats.byStatus?.find(s=>s._id==='pending')?.count || 0));
            if (this.dom.elements.pickupCompleted) this.dom.setText('pickupCompleted', (stats.completedPickups || stats.byStatus?.find(s=>s._id==='completed')?.count || 0));
        } catch (_) {}
    }

    async loadAndRenderPickups() {
        const table = this.dom.elements.pickupsTable;
        if (!table) return;
        table.innerHTML = '';
        try {
            if (window.loadingManager) window.loadingManager.show('pickups-section', 'Loading pickups...');
            const params = { page: this.currentPage, limit: this.itemsPerPage, ...this.filters };
            const res = await window.apiService.getAdminPickups(params);
            const pickups = res?.data || [];
            if (!pickups.length) {
                table.innerHTML = `
                    <tr>
                        <td colspan="9" class="text-center py-4">
                            <div class="empty-state">
                                <i class="bi bi-clipboard-check"></i>
                                <h5>No Pickups Found</h5>
                                <p class="text-muted">Adjust your filters to see results.</p>
                            </div>
                        </td>
                    </tr>`;
                return;
            }
            pickups.forEach(p => {
                const row = document.createElement('tr');
                row.className = 'fade-in';
                row.innerHTML = `
                    <td>${p._id || ''}</td>
                    <td>${p.wasteType || '-'}</td>
                    <td>${p.wasteSize || '-'}</td>
                    <td>${p.residentId?.name || '-'}</td>
                    <td>${p.collectorId?.name || '-'}</td>
                    <td><span class="status-badge ${this.mapPickupStatusClass(p.status)}">${(p.status||'-').replace(/\b\w/g, m=>m.toUpperCase())}</span></td>
                    <td>${this.formatDate(p.createdAt)}</td>
                    <td>
                        <div class="btn-group btn-group-sm">
                            <button class="btn btn-outline-primary" onclick="app.pickupManager.assignPickupPrompt('${p._id}')"><i class="bi bi-person-plus"></i></button>
                            <button class="btn btn-outline-success" onclick="app.pickupManager.updateStatus('${p._id}','completed')"><i class="bi bi-check2-circle"></i></button>
                        </div>
                    </td>`;
                table.appendChild(row);
            });
            this.renderPickupsPagination(res?.meta);
        } catch (err) {
            if (window.errorHandler) window.errorHandler.handle(err, app.notificationManager);
        } finally {
            if (window.loadingManager) window.loadingManager.hide('pickups-section');
        }
    }

    renderPickupsPagination(meta) {
        const pag = document.getElementById('pickupsPagination');
        if (!pag || !meta) return;
        const page = meta.page || 1;
        const pages = meta.pages || 1;
        pag.innerHTML = '';
        const createItem = (p, label = p, disabled = false, active = false) => {
            const li = document.createElement('li');
            li.className = `page-item ${disabled ? 'disabled' : ''} ${active ? 'active' : ''}`;
            const a = document.createElement('a');
            a.className = 'page-link';
            a.href = '#';
            a.textContent = label;
            a.onclick = (e) => { e.preventDefault(); if (!disabled && !active) { this.currentPage = p; this.loadAndRenderPickups(); } };
            li.appendChild(a);
            pag.appendChild(li);
        };
        createItem(Math.max(1, page - 1), '«', page === 1, false);
        for (let p = Math.max(1, page - 2); p <= Math.min(pages, page + 2); p++) {
            createItem(p, String(p), false, p === page);
        }
        createItem(Math.min(pages, page + 1), '»', page === pages, false);
    }

    mapPickupStatusClass(status) {
        switch ((status||'').toLowerCase()) {
            case 'pending': return 'status-pending';
            case 'accepted': return 'status-accepted';
            case 'inprogress':
            case 'in-progress': return 'status-in-progress';
            case 'completed': return 'status-completed';
            case 'cancelled': return 'status-cancelled';
            default: return 'status-pending';
        }
    }

    formatDate(val) {
        const d = new Date(val);
        return isNaN(d) ? '-' : d.toLocaleString();
    }

    async assignPickupPrompt(pickupId) {
        const collectorId = prompt('Enter Collector ID to assign:');
        if (!collectorId) return;
        await this.assignPickup(pickupId, collectorId);
    }

    async assignPickup(pickupId, collectorId) {
        try {
            await window.apiService.assignPickup(pickupId, collectorId);
            await this.loadAndRenderPickups();
            app.notificationManager?.showToast('Pickup assigned', 'success');
        } catch (err) {
            if (window.errorHandler) window.errorHandler.handle(err, app.notificationManager);
        }
    }

    async updateStatus(pickupId, status) {
        try {
            await window.apiService.updatePickupStatusAdmin(pickupId, status, 'Admin update');
            await this.loadAndRenderPickups();
            app.notificationManager?.showToast('Pickup status updated', 'success');
        } catch (err) {
            if (window.errorHandler) window.errorHandler.handle(err, app.notificationManager);
        }
    }
}

// Rewards Management Manager
class RewardsManager {
    constructor(domManager) {
        this.dom = domManager;
    }

    async initializeRewardsSystem() {
        await this.loadAndRenderRewards();
    }

    async loadAndRenderRewards() {
        const table = this.dom.elements.rewardsTable;
        if (!table) return;
        table.innerHTML = '';
        try {
            if (window.loadingManager) window.loadingManager.show('rewards-section', 'Loading rewards...');
            const res = await window.apiService.getAdminRewards();
            const rewards = res?.data || [];
            if (!rewards.length) {
                table.innerHTML = `
                    <tr>
                        <td colspan="7" class="text-center py-4">
                            <div class="empty-state">
                                <i class="bi bi-gift"></i>
                                <h5>No Rewards Found</h5>
                                <p class="text-muted">Create your first reward.</p>
                            </div>
                        </td>
                    </tr>`;
                return;
            }
            rewards.forEach(r => {
                const row = document.createElement('tr');
                row.className = 'fade-in';
                row.innerHTML = `
                    <td>${r.name || '-'}</td>
                    <td>${r.description || '-'}</td>
                    <td><span class="text-warning fw-bold">${r.points || 0}</span></td>
                    <td>${r.category || '-'}</td>
                    <td>${r.stock ?? '-'}</td>
                    <td>${(r.status||'active').replace(/\b\w/g, m=>m.toUpperCase())}</td>
                    <td>${new Date(r.createdAt).toLocaleDateString() || '-'}</td>`;
                table.appendChild(row);
            });
        } catch (err) {
            if (window.errorHandler) window.errorHandler.handle(err, app.notificationManager);
        } finally {
            if (window.loadingManager) window.loadingManager.hide('rewards-section');
        }
    }

    async updatePoints(wasteType, size, points) {
        await window.apiService.updateAdminRewardsPoints(wasteType, size, points);
        app.notificationManager?.showToast('Points mapping updated', 'success');
    }
}

// Analytics Manager
class AnalyticsManager {
    constructor(domManager) {
        this.dom = domManager;
    }

    async initializeAnalytics() {
        try {
            const [dash, trends] = await Promise.all([
                window.apiService.getAdminAnalyticsDashboard(),
                window.apiService.getAdminAnalyticsTrends()
            ]);
            // Placeholder: charts are created in AdminDashboardManager; here we might update them if needed.
            console.debug('Analytics loaded', dash?.data, trends?.data);
        } catch (err) {
            if (window.errorHandler) window.errorHandler.handle(err, app.notificationManager);
        }
    }
}

// Reports Manager
class ReportsManager {
    constructor(domManager) {
        this.dom = domManager;
    }

    async initializeReports() {
        await this.loadReports();
    }

    async loadReports() {
        const table = this.dom.elements.reportsTable;
        if (!table) return;
        table.innerHTML = '';
        try {
            const res = await window.apiService.getAdminAnalyticsReports();
            const summary = res?.data?.summary || {};
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${new Date(summary.generatedAt || Date.now()).toLocaleString()}</td>
                <td>${summary.users ?? '-'}</td>
                <td>${summary.pickups ?? '-'}</td>
                <td>${summary.rewards ?? '-'}</td>`;
            table.appendChild(row);
        } catch (err) {
            if (window.errorHandler) window.errorHandler.handle(err, app.notificationManager);
        }
    }
}

// Main Admin Application Class
class SmartWasteAdminApp {
    constructor() {
        this.domManager = new AdminDOMManager();
        this.adminManager = new AdminManager(this.domManager);
        this.dashboardManager = new AdminDashboardManager(this.domManager);
        this.userManager = new UserManager(this.domManager);
        this.collectorManager = new CollectorManager(this.domManager);
        this.pickupManager = new PickupManager(this.domManager);
        this.rewardsManager = new RewardsManager(this.domManager);
        this.analyticsManager = new AnalyticsManager(this.domManager);
        this.reportsManager = new ReportsManager(this.domManager);
        this.notificationManager = new AdminNotificationManager(this.domManager);
        this.sectionManager = new AdminSectionManager(this.domManager);
        
        this.initializeApp();
    }

    async initializeApp() {
        // Set up global event listeners
        this.setupGlobalEventListeners();
        
        // Auth guard for admin token
        const adminToken = localStorage.getItem('adminAuthToken');
        if (!adminToken) {
            window.location.href = '/admin-login.html';
            return;
        }

        // Loading and initialization
        this.domManager.hideElement('loadingSpinner');
        this.domManager.showElement('mainContent');

        await this.adminManager.initializeAdminData();
        this.dashboardManager.initializeDashboard();
        await this.userManager.initializeUserManagement();
        this.collectorManager.initializeCollectorManagement();
        this.pickupManager.initializePickupManagement();
        this.rewardsManager.initializeRewardsSystem();
        this.analyticsManager.initializeAnalytics();
        this.reportsManager.initializeReports();
        this.sectionManager.showSection('dashboard');
        this.notificationManager.showToast('Welcome to SmartWaste Admin Dashboard!', 'success');
    }

    setupGlobalEventListeners() {
        // Global section navigation
        window.showSection = (sectionName) => {
            this.sectionManager.showSection(sectionName);
        };

        // Make managers available globally for onclick handlers
        window.app = this;

        // Logout handler
        const logoutLink = document.getElementById('logoutLink');
        if (logoutLink) {
            logoutLink.addEventListener('click', (e) => {
                e.preventDefault();
                window.apiService.clearAdminSession(true);
            });
        }
    }
}

// Initialize the admin application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.smartWasteAdminApp = new SmartWasteAdminApp();
});

// Utility function for external use
function refreshAdminDashboard() {
    if (window.smartWasteAdminApp) {
        window.smartWasteAdminApp.adminManager.initializeAdminData();
        window.smartWasteAdminApp.dashboardManager.initializeDashboard();
    }
}

// Export for potential module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        SmartWasteAdminApp,
        refreshAdminDashboard
    };
}