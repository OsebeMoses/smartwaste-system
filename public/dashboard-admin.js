// dashboard-admin.js
// SmartWaste Admin Dashboard JavaScript Functionality

class AdminDashboard {
    constructor() {
        this.state = {
            admin: {
                id: 1,
                name: "Admin User",
                email: "admin@smartwaste.com",
                role: "Administrator"
            },
            stats: {
                totalUsers: 1247,
                totalCollectors: 89,
                activePickups: 23,
                totalRewards: 15,
                totalRevenue: 45280,
                completedPickups: 1245,
                pendingRequests: 12,
                newUsers: 34
            },
            users: [
                {
                    id: 1,
                    name: "John Smith",
                    email: "john.smith@example.com",
                    role: "User",
                    status: "active",
                    joinDate: "2024-01-15",
                    points: 450
                },
                {
                    id: 2,
                    name: "Sarah Johnson",
                    email: "sarah.j@example.com",
                    role: "Collector",
                    status: "active",
                    joinDate: "2024-01-10",
                    points: 1200
                },
                {
                    id: 3,
                    name: "Mike Wilson",
                    email: "mike.wilson@example.com",
                    role: "User",
                    status: "inactive",
                    joinDate: "2024-01-05",
                    points: 150
                }
            ],
            collectors: [
                {
                    id: 1,
                    name: "Sarah Johnson",
                    vehicle: "Small Truck",
                    status: "active",
                    rating: 4.8,
                    completedJobs: 124,
                    earnings: 4520
                },
                {
                    id: 2,
                    name: "David Brown",
                    vehicle: "Medium Truck",
                    status: "available",
                    rating: 4.6,
                    completedJobs: 89,
                    earnings: 3210
                },
                {
                    id: 3,
                    name: "Maria Garcia",
                    vehicle: "Large Truck",
                    status: "inactive",
                    rating: 4.9,
                    completedJobs: 156,
                    earnings: 5890
                }
            ],
            pickups: [
                {
                    id: 1,
                    customer: "John Smith",
                    location: "123 Green Street, Eco City",
                    wasteType: "Plastic",
                    status: "completed",
                    requested: "2024-01-20",
                    collector: "Sarah Johnson"
                },
                {
                    id: 2,
                    customer: "Emma Davis",
                    location: "456 Eco Avenue",
                    wasteType: "Glass",
                    status: "scheduled",
                    requested: "2024-01-21",
                    collector: "David Brown"
                },
                {
                    id: 3,
                    customer: "Robert Wilson",
                    location: "789 Nature Road",
                    wasteType: "Paper",
                    status: "pending",
                    requested: "2024-01-21",
                    collector: "Not assigned"
                }
            ],
            rewards: [
                {
                    id: 1,
                    name: "$50 Fuel Card",
                    description: "Redeemable at any major gas station",
                    points: 500,
                    tier: "silver",
                    image: "https://images.unsplash.com/photo-1592500100082-9dc6b0f015c3?w=400&h=250&fit=crop",
                    stock: 25,
                    active: true,
                    redeemed: 12
                },
                {
                    id: 2,
                    name: "Premium Work Gloves",
                    description: "Durable cut-resistant gloves with enhanced grip",
                    points: 300,
                    tier: "bronze",
                    image: "https://images.unsplash.com/photo-1581092334651-5e51da25df6a?w=400&h=250&fit=crop",
                    stock: 50,
                    active: true,
                    redeemed: 8
                },
                {
                    id: 3,
                    name: "SmartWaste Jacket",
                    description: "Official collector jacket with reflective strips",
                    points: 800,
                    tier: "silver",
                    image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=250&fit=crop",
                    stock: 15,
                    active: true,
                    redeemed: 3
                },
                {
                    id: 4,
                    name: "Performance Bonus",
                    description: "$100 cash bonus for excellent service",
                    points: 1000,
                    tier: "gold",
                    image: "https://images.unsplash.com/photo-1604594849809-dfedbc827105?w=400&h=250&fit=crop",
                    stock: 10,
                    active: true,
                    redeemed: 2
                }
            ],
            redemptions: [
                {
                    id: 1,
                    userName: "John Smith",
                    rewardName: "Premium Work Gloves",
                    pointsUsed: 300,
                    date: "2024-01-18",
                    status: "completed"
                },
                {
                    id: 2,
                    userName: "Sarah Johnson",
                    rewardName: "$50 Fuel Card",
                    pointsUsed: 500,
                    date: "2024-01-17",
                    status: "completed"
                },
                {
                    id: 3,
                    userName: "Mike Wilson",
                    rewardName: "SmartWaste Jacket",
                    pointsUsed: 800,
                    date: "2024-01-16",
                    status: "pending"
                }
            ],
            analytics: {
                pickups: {
                    labels: ['Jan 15', 'Jan 16', 'Jan 17', 'Jan 18', 'Jan 19', 'Jan 20', 'Jan 21'],
                    data: [45, 52, 38, 61, 55, 58, 62]
                },
                revenue: {
                    labels: ['Jan 15', 'Jan 16', 'Jan 17', 'Jan 18', 'Jan 19', 'Jan 20', 'Jan 21'],
                    data: [1200, 1350, 1100, 1650, 1420, 1580, 1720]
                },
                users: {
                    labels: ['Jan 15', 'Jan 16', 'Jan 17', 'Jan 18', 'Jan 19', 'Jan 20', 'Jan 21'],
                    data: [8, 12, 6, 15, 11, 13, 9]
                }
            }
        };

        this.currentSection = 'dashboard';
        this.initializeApp();
    }

    // Initialize the application
    initializeApp() {
        this.hideLoadingSpinner();
        this.loadAdminData();
        this.loadDashboardData();
        this.setupEventListeners();
        this.showSection('dashboard');
        this.showToast('Admin dashboard loaded successfully!', 'success');
    }

    // Hide loading spinner
    hideLoadingSpinner() {
        document.getElementById('loadingSpinner').style.display = 'none';
        document.getElementById('mainContent').style.display = 'block';
    }

    // Load admin data
    loadAdminData() {
        const admin = this.state.admin;
        document.getElementById('adminName').textContent = admin.name;
        document.getElementById('adminNameDisplay').textContent = admin.name;
        document.getElementById('welcomeName').textContent = admin.name;
    }

    // Load dashboard data
    loadDashboardData() {
        this.loadStats();
        this.loadRecentActivity();
        this.loadSystemAlerts();
    }

    // Load statistics
    loadStats() {
        const stats = this.state.stats;
        
        // Sidebar stats
        document.getElementById('totalUsers').textContent = stats.totalUsers.toLocaleString();
        document.getElementById('totalCollectors').textContent = stats.totalCollectors.toLocaleString();
        document.getElementById('activePickups').textContent = stats.activePickups;
        document.getElementById('totalRewards').textContent = stats.totalRewards;
        
        // Dashboard stats
        document.getElementById('totalRevenue').textContent = `$${stats.totalRevenue.toLocaleString()}`;
        document.getElementById('completedPickups').textContent = stats.completedPickups.toLocaleString();
        document.getElementById('pendingRequests').textContent = stats.pendingRequests;
        document.getElementById('newUsers').textContent = stats.newUsers;
    }

    // Load recent activity
    loadRecentActivity() {
        const container = document.getElementById('recentActivity');
        const activities = [
            { action: 'New user registration', user: 'John Doe', time: '2 minutes ago', type: 'user' },
            { action: 'Pickup completed', user: 'Sarah Johnson', time: '5 minutes ago', type: 'pickup' },
            { action: 'Reward redeemed', user: 'Mike Wilson', time: '10 minutes ago', type: 'reward' },
            { action: 'New collector approved', user: 'David Brown', time: '15 minutes ago', type: 'collector' }
        ];

        container.innerHTML = activities.map(activity => `
            <div class="notification-item fade-in">
                <div class="notification-icon ${this.getActivityIconClass(activity.type)} rounded-circle d-flex align-items-center justify-content-center" style="width: 40px; height: 40px;">
                    <i class="bi ${this.getActivityIcon(activity.type)} text-white"></i>
                </div>
                <div class="notification-content">
                    <p class="mb-1 small"><strong>${activity.action}</strong> by ${activity.user}</p>
                    <small class="text-muted">${activity.time}</small>
                </div>
            </div>
        `).join('');
    }

    // Get activity icon
    getActivityIcon(type) {
        const icons = {
            'user': 'bi-person-plus',
            'pickup': 'bi-geo-alt',
            'reward': 'bi-gift',
            'collector': 'bi-truck'
        };
        return icons[type] || 'bi-info-circle';
    }

    // Get activity icon class
    getActivityIconClass(type) {
        const classes = {
            'user': 'bg-primary',
            'pickup': 'bg-success',
            'reward': 'bg-warning',
            'collector': 'bg-info'
        };
        return classes[type] || 'bg-secondary';
    }

    // Load system alerts
    loadSystemAlerts() {
        // This would typically fetch from an API
        // For now, we'll show a static alert
        const container = document.getElementById('systemAlerts');
        container.innerHTML = `
            <div class="notification-item">
                <div class="notification-icon bg-success rounded-circle d-flex align-items-center justify-content-center" style="width: 40px; height: 40px;">
                    <i class="bi bi-check-circle text-white"></i>
                </div>
                <div class="notification-content">
                    <p class="mb-1 small">All systems operational</p>
                    <small class="text-muted">Last checked: Just now</small>
                </div>
            </div>
        `;
    }

    // Setup event listeners
    setupEventListeners() {
        // Section navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const section = btn.getAttribute('data-section');
                this.showSection(section);
                
                // Update active nav button
                document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });

        // Quick action cards
        document.querySelectorAll('.quick-action-card').forEach(card => {
            card.addEventListener('click', () => {
                const section = card.getAttribute('onclick').match(/showSection\('([^']+)'\)/)[1];
                this.showSection(section);
                
                // Update active nav button
                document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
                document.querySelector(`.nav-btn[data-section="${section}"]`).classList.add('active');
            });
        });

        // Rewards tab navigation
        const rewardsTabs = document.querySelectorAll('#rewardsTabs button');
        rewardsTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                rewardsTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
            });
        });

        // Pickup filter buttons
        document.querySelectorAll('[data-pickup-filter]').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('[data-pickup-filter]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.filterPickups(btn.getAttribute('data-pickup-filter'));
            });
        });

        // Analytics period selector
        document.getElementById('analyticsPeriod').addEventListener('change', (e) => {
            this.loadAnalyticsData(e.target.value);
        });

        // Analytics metric buttons
        document.querySelectorAll('[data-metric]').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('[data-metric]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.updateAnalyticsChart(btn.getAttribute('data-metric'));
            });
        });

        // Forms
        document.getElementById('pointsConfigForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.savePointsConfiguration();
        });

        document.getElementById('generalSettingsForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveGeneralSettings();
        });

        // Search functionality
        document.getElementById('userSearch')?.addEventListener('input', (e) => {
            this.searchUsers(e.target.value);
        });

        document.getElementById('rewardSearch')?.addEventListener('input', (e) => {
            this.searchRewards(e.target.value);
        });
    }

    // Show a specific section
    showSection(sectionName) {
        // Hide all sections
        document.querySelectorAll('.dashboard-section').forEach(section => {
            section.style.display = 'none';
        });
        
        // Show the selected section
        document.getElementById(`${sectionName}-section`).style.display = 'block';
        this.currentSection = sectionName;
        
        // Load section-specific data
        switch(sectionName) {
            case 'users':
                this.loadUsers();
                break;
            case 'collectors':
                this.loadCollectors();
                break;
            case 'pickups':
                this.loadPickups();
                break;
            case 'rewards':
                this.loadRewards();
                break;
            case 'analytics':
                this.loadAnalyticsData('30d');
                break;
            case 'settings':
                this.loadSettings();
                break;
        }
    }

    // Load users management
    loadUsers() {
        const container = document.getElementById('usersTable');
        const users = this.state.users;

        if (users.length === 0) {
            container.innerHTML = `<tr><td colspan="6" class="text-center">No users found</td></tr>`;
            return;
        }

        container.innerHTML = users.map(user => `
            <tr class="fade-in">
                <td>
                    <div class="d-flex align-items-center">
                        <div class="user-avatar me-3">
                            <i class="bi bi-person-fill"></i>
                        </div>
                        <div>
                            <h6 class="mb-0">${user.name}</h6>
                            <small class="text-muted">ID: ${user.id}</small>
                        </div>
                    </div>
                </td>
                <td>${user.email}</td>
                <td>
                    <span class="badge ${user.role === 'Collector' ? 'bg-warning' : 'bg-info'}">
                        ${user.role}
                    </span>
                </td>
                <td>
                    <span class="badge ${user.status === 'active' ? 'bg-success' : 'bg-secondary'}">
                        ${user.status}
                    </span>
                </td>
                <td>${user.joinDate}</td>
                <td>
                    <div class="btn-group">
                        <button class="btn btn-sm btn-outline-primary" onclick="adminDashboard.editUser(${user.id})">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="adminDashboard.deleteUser(${user.id})">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    // Load collectors management
    loadCollectors() {
        const container = document.getElementById('collectorsTable');
        const collectors = this.state.collectors;

        if (collectors.length === 0) {
            container.innerHTML = `<tr><td colspan="7" class="text-center">No collectors found</td></tr>`;
            return;
        }

        container.innerHTML = collectors.map(collector => `
            <tr class="fade-in">
                <td>
                    <div class="d-flex align-items-center">
                        <div class="user-avatar me-3">
                            <i class="bi bi-person-fill"></i>
                        </div>
                        <div>
                            <h6 class="mb-0">${collector.name}</h6>
                            <small class="text-muted">ID: ${collector.id}</small>
                        </div>
                    </div>
                </td>
                <td>${collector.vehicle}</td>
                <td>
                    <span class="badge ${collector.status === 'active' ? 'bg-success' : collector.status === 'available' ? 'bg-info' : 'bg-secondary'}">
                        ${collector.status}
                    </span>
                </td>
                <td>
                    <div class="d-flex align-items-center">
                        <i class="bi bi-star-fill text-warning me-1"></i>
                        <span>${collector.rating}</span>
                    </div>
                </td>
                <td>${collector.completedJobs}</td>
                <td>$${collector.earnings.toLocaleString()}</td>
                <td>
                    <div class="btn-group">
                        <button class="btn btn-sm btn-outline-primary" onclick="adminDashboard.editCollector(${collector.id})">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="adminDashboard.suspendCollector(${collector.id})">
                            <i class="bi bi-pause"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    // Load pickups management
    loadPickups() {
        const container = document.getElementById('pickupsTable');
        const pickups = this.state.pickups;

        if (pickups.length === 0) {
            container.innerHTML = `<tr><td colspan="8" class="text-center">No pickups found</td></tr>`;
            return;
        }

        container.innerHTML = pickups.map(pickup => `
            <tr class="fade-in">
                <td>#${pickup.id.toString().padStart(4, '0')}</td>
                <td>${pickup.customer}</td>
                <td>${pickup.location}</td>
                <td>${pickup.wasteType}</td>
                <td>
                    <span class="status-badge ${this.getStatusBadgeClass(pickup.status)}">
                        ${pickup.status}
                    </span>
                </td>
                <td>${pickup.requested}</td>
                <td>${pickup.collector}</td>
                <td>
                    <div class="btn-group">
                        <button class="btn btn-sm btn-outline-primary" onclick="adminDashboard.viewPickupDetails(${pickup.id})">
                            <i class="bi bi-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-success" onclick="adminDashboard.assignCollector(${pickup.id})">
                            <i class="bi bi-person-plus"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    // Load rewards system
    loadRewards() {
        this.loadRewardsStats();
        this.loadRewardsList();
        this.loadRedemptions();
    }

    // Load rewards statistics
    loadRewardsStats() {
        const rewards = this.state.rewards;
        const totalRewards = rewards.length;
        const activeRewards = rewards.filter(r => r.active).length;
        const totalRedemptions = rewards.reduce((sum, reward) => sum + reward.redeemed, 0);
        const pointsIssued = rewards.reduce((sum, reward) => sum + (reward.points * reward.redeemed), 0);

        document.getElementById('totalRewardsCount').textContent = totalRewards;
        document.getElementById('activeRewards').textContent = activeRewards;
        document.getElementById('totalRedemptions').textContent = totalRedemptions;
        document.getElementById('pointsIssued').textContent = pointsIssued.toLocaleString();
    }

    // Load rewards list
    loadRewardsList() {
        const container = document.getElementById('rewardsList');
        const rewards = this.state.rewards;

        if (rewards.length === 0) {
            container.innerHTML = this.createEmptyState('bi-gift', 'No Rewards', 'Create your first reward to get started!');
            return;
        }

        container.innerHTML = rewards.map(reward => `
            <div class="col-md-6 col-lg-4 mb-4">
                <div class="card reward-card h-100">
                    <div class="reward-image-container">
                        <img src="${reward.image}" alt="${reward.name}" class="reward-image" 
                             onerror="this.src='${this.generatePlaceholderImage(reward.name, reward.tier)}'">
                        <span class="reward-tier-badge ${this.getTierBadgeClass(reward.tier)}">
                            ${reward.tier.charAt(0).toUpperCase()}
                        </span>
                    </div>
                    <div class="card-body d-flex flex-column">
                        <h5 class="reward-title">${reward.name}</h5>
                        <p class="card-text text-muted flex-grow-1">${reward.description}</p>
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <span class="badge bg-warning text-dark points-badge">${reward.points} pts</span>
                            <span class="badge ${reward.stock < 10 ? 'bg-danger' : 'bg-success'}">
                                Stock: ${reward.stock}
                            </span>
                        </div>
                        <div class="d-flex justify-content-between align-items-center">
                            <small class="text-muted">Redeemed: ${reward.redeemed} times</small>
                            <div class="btn-group">
                                <button class="btn btn-sm btn-outline-primary" onclick="adminDashboard.editReward(${reward.id})">
                                    <i class="bi bi-pencil"></i>
                                </button>
                                <button class="btn btn-sm btn-outline-danger" onclick="adminDashboard.deleteReward(${reward.id})">
                                    <i class="bi bi-trash"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // Load redemptions
    loadRedemptions() {
        const container = document.getElementById('redemptionsTable');
        const redemptions = this.state.redemptions;

        if (redemptions.length === 0) {
            container.innerHTML = `<tr><td colspan="6" class="text-center">No redemptions found</td></tr>`;
            return;
        }

        container.innerHTML = redemptions.map(redemption => `
            <tr class="fade-in">
                <td>${redemption.userName}</td>
                <td>${redemption.rewardName}</td>
                <td>${redemption.pointsUsed}</td>
                <td>${redemption.date}</td>
                <td>
                    <span class="badge ${redemption.status === 'completed' ? 'bg-success' : 'bg-warning'}">
                        ${redemption.status}
                    </span>
                </td>
                <td>
                    <div class="btn-group">
                        <button class="btn btn-sm btn-outline-success" onclick="adminDashboard.approveRedemption(${redemption.id})">
                            <i class="bi bi-check"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="adminDashboard.rejectRedemption(${redemption.id})">
                            <i class="bi bi-x"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    // Load analytics data
    loadAnalyticsData(period) {
        // This would typically fetch data from an API based on the period
        // For now, we'll use mock data
        console.log(`Loading analytics data for period: ${period}`);
        
        // Update chart placeholders with period info
        document.querySelectorAll('.chart-container p.text-muted').forEach(p => {
            p.textContent = `Analytics data for ${period} will be displayed here`;
        });
    }

    // Update analytics chart based on metric
    updateAnalyticsChart(metric) {
        console.log(`Updating analytics chart for metric: ${metric}`);
        // This would update the charts with the selected metric data
    }

    // Load settings
    loadSettings() {
        // Settings are pre-populated in the HTML
        // Additional settings loading logic would go here
    }

    // Filter pickups
    filterPickups(filter) {
        console.log(`Filtering pickups by: ${filter}`);
        // This would filter the pickups table based on the selected filter
    }

    // Search users
    searchUsers(query) {
        console.log(`Searching users with query: ${query}`);
        // This would filter users based on the search query
    }

    // Search rewards
    searchRewards(query) {
        console.log(`Searching rewards with query: ${query}`);
        // This would filter rewards based on the search query
    }

    // Show add reward modal
    showAddRewardModal() {
        const modal = new bootstrap.Modal(document.getElementById('addRewardModal'));
        modal.show();
    }

    // Add new reward
    addNewReward() {
        const form = document.getElementById('addRewardForm');
        const formData = new FormData(form);
        
        const newReward = {
            id: this.state.rewards.length + 1,
            name: document.getElementById('rewardName').value,
            description: document.getElementById('rewardDescription').value,
            points: parseInt(document.getElementById('rewardPoints').value),
            tier: document.getElementById('rewardTier').value,
            stock: parseInt(document.getElementById('rewardStock').value),
            image: document.getElementById('rewardImage').value || this.generatePlaceholderImage(document.getElementById('rewardName').value, document.getElementById('rewardTier').value),
            active: document.getElementById('rewardActive').checked,
            redeemed: 0
        };

        this.state.rewards.push(newReward);
        
        const modal = bootstrap.Modal.getInstance(document.getElementById('addRewardModal'));
        modal.hide();
        
        this.showToast('Reward added successfully!', 'success');
        this.loadRewards();
        form.reset();
    }

    // Save points configuration
    savePointsConfiguration() {
        const pointsPerKg = document.getElementById('pointsPerKg').value;
        const firstPickupBonus = document.getElementById('firstPickupBonus').value;
        const referralBonus = document.getElementById('referralBonus').value;
        
        console.log('Saving points configuration:', { pointsPerKg, firstPickupBonus, referralBonus });
        this.showToast('Points configuration saved successfully!', 'success');
    }

    // Save general settings
    saveGeneralSettings() {
        const systemName = document.getElementById('systemName').value;
        const defaultCurrency = document.getElementById('defaultCurrency').value;
        const timeZone = document.getElementById('timeZone').value;
        
        console.log('Saving general settings:', { systemName, defaultCurrency, timeZone });
        this.showToast('General settings saved successfully!', 'success');
    }

    // Utility Methods

    // Generate placeholder image for rewards
    generatePlaceholderImage(name, tier) {
        const colors = {
            'gold': '#FFD700',
            'silver': '#C0C0C0', 
            'bronze': '#CD7F32'
        };
        
        const color = colors[tier] || '#4CAF50';
        const svg = `
            <svg width="400" height="250" xmlns="http://www.w3.org/2000/svg">
                <rect width="100%" height="100%" fill="${color}"/>
                <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="white" font-family="Arial, sans-serif" font-size="18" font-weight="bold">
                    ${name}
                </text>
            </svg>`;
        
        return `data:image/svg+xml;base64,${btoa(svg)}`;
    }

    // Get status badge class
    getStatusBadgeClass(status) {
        const statusClasses = {
            'pending': 'status-pending',
            'scheduled': 'status-scheduled',
            'completed': 'status-completed',
            'cancelled': 'status-cancelled'
        };
        return statusClasses[status] || 'status-pending';
    }

    // Get tier badge class
    getTierBadgeClass(tier) {
        const tierClasses = {
            'gold': 'tier-gold',
            'silver': 'tier-silver',
            'bronze': 'tier-bronze'
        };
        return tierClasses[tier] || 'tier-bronze';
    }

    // Create empty state HTML
    createEmptyState(icon, title, message) {
        return `
            <div class="empty-state">
                <i class="bi ${icon}"></i>
                <h5>${title}</h5>
                <p class="text-muted">${message}</p>
            </div>
        `;
    }

    // Show toast notification
    showToast(message, type = 'info') {
        const toastContainer = document.getElementById('toastContainer');
        const toastId = 'toast-' + Date.now();
        
        const toastEl = document.createElement('div');
        toastEl.className = `toast align-items-center text-white bg-${type === 'error' ? 'danger' : type} border-0`;
        toastEl.setAttribute('role', 'alert');
        toastEl.setAttribute('aria-live', 'assertive');
        toastEl.setAttribute('aria-atomic', 'true');
        toastEl.id = toastId;
        
        toastEl.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;
        
        toastContainer.appendChild(toastEl);
        
        const toast = new bootstrap.Toast(toastEl, { delay: 5000 });
        toast.show();
        
        // Remove toast from DOM after it's hidden
        toastEl.addEventListener('hidden.bs.toast', () => {
            toastEl.remove();
        });
    }

    // Admin action methods (stubs for functionality)
    editUser(userId) {
        console.log(`Editing user: ${userId}`);
        this.showToast(`Editing user ${userId}`, 'info');
    }

    deleteUser(userId) {
        if (confirm('Are you sure you want to delete this user?')) {
            console.log(`Deleting user: ${userId}`);
            this.showToast('User deleted successfully!', 'success');
        }
    }

    editCollector(collectorId) {
        console.log(`Editing collector: ${collectorId}`);
        this.showToast(`Editing collector ${collectorId}`, 'info');
    }

    suspendCollector(collectorId) {
        if (confirm('Are you sure you want to suspend this collector?')) {
            console.log(`Suspending collector: ${collectorId}`);
            this.showToast('Collector suspended successfully!', 'warning');
        }
    }

    viewPickupDetails(pickupId) {
        console.log(`Viewing pickup details: ${pickupId}`);
        this.showToast(`Viewing pickup ${pickupId} details`, 'info');
    }

    assignCollector(pickupId) {
        console.log(`Assigning collector to pickup: ${pickupId}`);
        this.showToast('Opening collector assignment...', 'info');
    }

    editReward(rewardId) {
        console.log(`Editing reward: ${rewardId}`);
        this.showToast(`Editing reward ${rewardId}`, 'info');
    }

    deleteReward(rewardId) {
        if (confirm('Are you sure you want to delete this reward?')) {
            console.log(`Deleting reward: ${rewardId}`);
            this.showToast('Reward deleted successfully!', 'success');
        }
    }

    approveRedemption(redemptionId) {
        console.log(`Approving redemption: ${redemptionId}`);
        this.showToast('Redemption approved!', 'success');
    }

    rejectRedemption(redemptionId) {
        if (confirm('Are you sure you want to reject this redemption?')) {
            console.log(`Rejecting redemption: ${redemptionId}`);
            this.showToast('Redemption rejected!', 'warning');
        }
    }

    // Logout function
    logout() {
        if (confirm('Are you sure you want to logout?')) {
            this.showToast('Logged out successfully!', 'info');
            // In a real app, this would redirect to login page
            // window.location.href = 'login.html';
        }
    }
}

// Make functions globally available
function showSection(section) {
    window.adminDashboard.showSection(section);
}

function logout() {
    window.adminDashboard.logout();
}

function showAddRewardModal() {
    window.adminDashboard.showAddRewardModal();
}

function addNewReward() {
    window.adminDashboard.addNewReward();
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.adminDashboard = new AdminDashboard();
});