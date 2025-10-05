// collector-dashboard.js
// SmartWaste Collector Dashboard - JavaScript Functionality

// Application State
class CollectorDashboard {
    constructor() {
        this.state = {
            user: {
                id: 1,
                name: "Michael Johnson",
                email: "michael.johnson@example.com",
                phone: "(555) 123-4567",
                address: "123 Collector Street, Eco City",
                vehicle: "Small Truck",
                memberSince: "January 2023",
                totalJobs: 342,
                rating: 4.8,
                reviewCount: 128,
                serviceArea: "Eco City & Greenville",
                points: 850,
                tier: "silver",
                preferences: {
                    newRequests: true,
                    scheduleChanges: true,
                    earningUpdates: false,
                    ratingNotifications: true,
                    rewardNotifications: true
                }
            },
            pickups: [
                {
                    id: 1,
                    customer: "John Doe",
                    phone: "(555) 123-4567",
                    email: "john.doe@example.com",
                    address: "123 Green Street, Eco City",
                    wasteType: "Household",
                    estimatedWeight: "15 kg",
                    preferredTime: "9:00 AM - 12:00 PM",
                    specialInstructions: "Please ring the doorbell upon arrival. The waste bins are located at the back of the house.",
                    status: "pending",
                    requested: "Today, 9:30 AM",
                    coordinates: { lat: 40.7128, lng: -74.0060 }
                },
                {
                    id: 2,
                    customer: "Sarah Wilson",
                    phone: "(555) 987-6543",
                    email: "sarah.wilson@example.com",
                    address: "456 Eco Avenue, Greenville",
                    wasteType: "Recycling",
                    estimatedWeight: "8 kg",
                    preferredTime: "10:00 AM - 1:00 PM",
                    specialInstructions: "Recycling bins are at the front gate. Please separate plastic and paper.",
                    status: "pending",
                    requested: "Today, 10:15 AM",
                    coordinates: { lat: 40.7282, lng: -73.9942 }
                },
                {
                    id: 3,
                    customer: "Robert Brown",
                    phone: "(555) 456-7890",
                    email: "robert.brown@example.com",
                    address: "789 Nature Road, Eco City",
                    wasteType: "Organic",
                    estimatedWeight: "12 kg",
                    preferredTime: "11:00 AM - 2:00 PM",
                    specialInstructions: "Compost bin is in the backyard. Gate is unlocked.",
                    status: "accepted",
                    requested: "Yesterday, 3:45 PM",
                    coordinates: { lat: 40.7505, lng: -73.9934 }
                },
                {
                    id: 4,
                    customer: "Maria Garcia",
                    phone: "(555) 234-5678",
                    email: "maria.garcia@example.com",
                    address: "321 Sustainable Lane, Greenville",
                    wasteType: "Electronic",
                    estimatedWeight: "5 kg",
                    preferredTime: "2:00 PM - 4:00 PM",
                    specialInstructions: "Old laptops and phones in box by front door.",
                    status: "completed",
                    requested: "Yesterday, 2:30 PM",
                    coordinates: { lat: 40.7589, lng: -73.9851 }
                }
            ],
            schedule: [
                {
                    id: 1,
                    title: "Green Street Collection",
                    time: "9:00 AM - 10:30 AM",
                    location: "123 Green Street, Eco City",
                    status: "completed",
                    type: "pickup",
                    customer: "John Doe"
                },
                {
                    id: 2,
                    title: "Eco Avenue Pickup",
                    time: "11:00 AM - 12:00 PM",
                    location: "456 Eco Avenue, Greenville",
                    status: "in-progress",
                    type: "pickup",
                    customer: "Sarah Wilson"
                },
                {
                    id: 3,
                    title: "Recycling Center Drop-off",
                    time: "1:30 PM - 2:30 PM",
                    location: "Recycling Center, Industrial Area",
                    status: "scheduled",
                    type: "dropoff"
                },
                {
                    id: 4,
                    title: "Sustainable Lane Collection",
                    time: "3:00 PM - 4:00 PM",
                    location: "321 Sustainable Lane, Greenville",
                    status: "scheduled",
                    type: "pickup",
                    customer: "Maria Garcia"
                }
            ],
            rewards: [
                {
                    id: 1,
                    name: "$50 Fuel Card",
                    description: "Redeemable at any major gas station - perfect for your collection routes",
                    points: 500,
                    tier: "silver",
                    image: "https://images.unsplash.com/photo-1592500100082-9dc6b0f015c3?w=400&h=250&fit=crop",
                    redeemed: false,
                    category: "practical"
                },
                {
                    id: 2,
                    name: "Premium Work Gloves",
                    description: "Durable cut-resistant gloves with enhanced grip for safe waste handling",
                    points: 300,
                    tier: "bronze",
                    image: "https://images.unsplash.com/photo-1581092334651-5e51da25df6a?w=400&h=250&fit=crop",
                    redeemed: false,
                    category: "equipment"
                },
                {
                    id: 3,
                    name: "SmartWaste Jacket",
                    description: "Official collector jacket with reflective strips for nighttime safety",
                    points: 800,
                    tier: "silver",
                    image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=250&fit=crop",
                    redeemed: false,
                    category: "clothing"
                },
                {
                    id: 4,
                    name: "Mobile Power Bank",
                    description: "High-capacity 20000mAh power bank to keep your devices charged all day",
                    points: 400,
                    tier: "bronze",
                    image: "https://images.unsplash.com/photo-1609592810794-1c0d49c7b9bd?w=400&h=250&fit=crop",
                    redeemed: true,
                    category: "electronics"
                },
                {
                    id: 5,
                    name: "Performance Bonus",
                    description: "$100 cash bonus reward for maintaining excellent service performance",
                    points: 1000,
                    tier: "gold",
                    image: "https://images.unsplash.com/photo-1604594849809-dfedbc827105?w=400&h=250&fit=crop",
                    redeemed: false,
                    category: "bonus"
                },
                {
                    id: 6,
                    name: "Safety Equipment Kit",
                    description: "Complete safety kit including goggles, mask, gloves and first aid supplies",
                    points: 600,
                    tier: "silver",
                    image: "https://images.unsplash.com/photo-1584634731339-252c581abfc5?w=400&h=250&fit=crop",
                    redeemed: false,
                    category: "safety"
                },
                {
                    id: 7,
                    name: "Lunch Voucher",
                    description: "$25 lunch voucher for local restaurants along your collection route",
                    points: 250,
                    tier: "bronze",
                    image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=250&fit=crop",
                    redeemed: false,
                    category: "food"
                },
                {
                    id: 8,
                    name: "Vehicle Maintenance",
                    description: "Free oil change and basic maintenance for your collection vehicle",
                    points: 750,
                    tier: "silver",
                    image: "https://images.unsplash.com/photo-1563720223485-85444783e8e5?w=400&h=250&fit=crop",
                    redeemed: false,
                    category: "vehicle"
                }
            ],
            redeemedRewards: [
                {
                    id: 4,
                    name: "Mobile Power Bank",
                    description: "High-capacity 20000mAh power bank to keep your devices charged all day",
                    points: 400,
                    tier: "bronze",
                    image: "https://images.unsplash.com/photo-1609592810794-1c0d49c7b9bd?w=400&h=250&fit=crop",
                    redeemedDate: "2024-01-15"
                },
                {
                    id: 9,
                    name: "Coffee Thermos",
                    description: "Insulated thermos to keep your drinks hot during early morning routes",
                    points: 150,
                    tier: "bronze",
                    image: "https://images.unsplash.com/photo-1514228742587-6b1558fcf93a?w=400&h=250&fit=crop",
                    redeemedDate: "2024-01-10"
                }
            ],
            earnings: {
                week: {
                    total: 450,
                    jobs: 12,
                    average: 37.50,
                    transactions: [
                        { date: "Today", jobId: "#0012", customer: "John Doe", amount: 45.00, status: "completed" },
                        { date: "Today", jobId: "#0011", customer: "Sarah Wilson", amount: 52.50, status: "completed" },
                        { date: "Yesterday", jobId: "#0010", customer: "Robert Brown", amount: 48.00, status: "completed" }
                    ]
                },
                month: {
                    total: 1240,
                    jobs: 24,
                    average: 51.67,
                    transactions: [
                        { date: "Today", jobId: "#0012", customer: "John Doe", amount: 45.00, status: "completed" },
                        { date: "Today", jobId: "#0011", customer: "Sarah Wilson", amount: 52.50, status: "completed" },
                        { date: "Yesterday", jobId: "#0010", customer: "Robert Brown", amount: 48.00, status: "completed" },
                        { date: "Jan 18", jobId: "#0009", customer: "Maria Garcia", amount: 55.00, status: "completed" }
                    ]
                },
                year: {
                    total: 15800,
                    jobs: 342,
                    average: 46.20,
                    transactions: []
                }
            },
            performance: {
                week: {
                    completionRate: 92,
                    onTimeRate: 88,
                    satisfactionRate: 95,
                    completedJobs: 24
                },
                month: {
                    completionRate: 94,
                    onTimeRate: 90,
                    satisfactionRate: 96,
                    completedJobs: 89
                },
                year: {
                    completionRate: 93,
                    onTimeRate: 89,
                    satisfactionRate: 95,
                    completedJobs: 342
                }
            }
        };

        this.currentSection = 'dashboard';
        this.currentEarningsPeriod = 'week';
        this.currentPerformancePeriod = 'week';
        this.currentRewardsFilter = 'all';
        this.currentSchedulePeriod = 'today';

        // Image error handling
        this.setupImageErrorHandling();

        this.initializeApp();
    }

    // Setup image error handling
    setupImageErrorHandling() {
        // This will handle any broken images by replacing them with fallbacks
        document.addEventListener('DOMContentLoaded', () => {
            document.addEventListener('error', (e) => {
                if (e.target.tagName === 'IMG') {
                    const img = e.target;
                    const rewardName = img.alt || 'Reward';
                    
                    // Create a colored placeholder based on the reward name
                    const colors = ['#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#F44336'];
                    const color = colors[rewardName.length % colors.length];
                    
                    // Replace broken image with SVG placeholder
                    const svgPlaceholder = `
                        <svg width="400" height="250" xmlns="http://www.w3.org/2000/svg">
                            <rect width="100%" height="100%" fill="${color}"/>
                            <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="white" font-family="Arial, sans-serif" font-size="18" font-weight="bold">
                                ${rewardName}
                            </text>
                        </svg>`;
                    
                    // Convert SVG string to data URL
                    const svgData = `data:image/svg+xml;base64,${btoa(svgPlaceholder)}`;
                    img.src = svgData;
                }
            }, true);
        });
    }

    // Initialize the application
    initializeApp() {
        this.setupEventListeners();
        this.loadUserData();
        this.loadDashboardData();
        this.showSection('dashboard');
        this.showToast('Welcome back to your SmartWaste Collector Dashboard!', 'success');
    }

    // Set up all event listeners
    setupEventListeners() {
        // Menu item clicks
        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.getAttribute('data-section');
                this.showSection(section);
                
                // Update active menu item
                document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
                item.classList.add('active');
            });
        });

        // Quick action buttons
        document.querySelectorAll('.btn[data-section]').forEach(btn => {
            btn.addEventListener('click', () => {
                const section = btn.getAttribute('data-section');
                this.showSection(section);
                
                // Update active menu item
                document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
                document.querySelector(`.menu-item[data-section="${section}"]`).classList.add('active');
            });
        });

        // Schedule tabs
        document.querySelectorAll('[data-schedule]').forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                document.querySelectorAll('[data-schedule]').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.currentSchedulePeriod = tab.getAttribute('data-schedule');
                this.loadSchedule(this.currentSchedulePeriod);
            });
        });

        // Performance period buttons
        document.querySelectorAll('[data-period]').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('[data-period]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentPerformancePeriod = btn.getAttribute('data-period');
                this.loadPerformanceData(this.currentPerformancePeriod);
            });
        });

        // Earnings period buttons
        document.querySelectorAll('[data-earnings-period]').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('[data-earnings-period]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentEarningsPeriod = btn.getAttribute('data-earnings-period');
                this.loadEarningsData(this.currentEarningsPeriod);
            });
        });

        // Rewards filter buttons
        document.querySelectorAll('[data-rewards-filter]').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('[data-rewards-filter]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentRewardsFilter = btn.getAttribute('data-rewards-filter');
                this.filterRewards(this.currentRewardsFilter);
            });
        });

        // Settings tabs
        document.querySelectorAll('[data-settings-tab]').forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                document.querySelectorAll('[data-settings-tab]').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.showSettingsTab(tab.getAttribute('data-settings-tab'));
            });
        });

        // Profile form submission
        document.getElementById('profileForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateProfile();
        });

        // Settings form submission
        const settingsButton = document.querySelector('#notifications-settings button');
        if (settingsButton) {
            settingsButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.saveNotificationPreferences();
            });
        }

        // Menu toggle for mobile
        const menuToggle = document.querySelector('.menu-toggle');
        const sidebar = document.querySelector('.sidebar');
        
        if (menuToggle) {
            menuToggle.addEventListener('click', () => {
                sidebar.classList.toggle('active');
            });
        }

        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768 && sidebar && !sidebar.contains(e.target) && menuToggle && !menuToggle.contains(e.target)) {
                sidebar.classList.remove('active');
            }
        });

        // Make methods available globally
        window.showSection = (section) => this.showSection(section);
        window.logout = () => this.logout();
        window.loadPendingPickups = () => this.loadPendingPickups();
        window.showTodaySchedule = () => this.showTodaySchedule();
        window.acceptPickup = (id) => this.acceptPickup(id);
        window.completePickup = (id) => this.completePickup(id);
        window.viewDetails = (id) => this.viewDetails(id);
        window.viewRewardDetails = (id) => this.viewRewardDetails(id);
        window.redeemReward = (id) => this.redeemReward(id);
        window.refreshMap = () => this.refreshMap();
    }

    // Show a specific section
    showSection(sectionName) {
        // Hide all sections
        document.querySelectorAll('.dashboard-section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Show the selected section
        const sectionElement = document.getElementById(`${sectionName}-section`);
        if (sectionElement) {
            sectionElement.classList.add('active');
            this.currentSection = sectionName;
            
            // Load section-specific data
            switch(sectionName) {
                case 'dashboard':
                    this.loadDashboardData();
                    break;
                case 'pickups':
                    this.loadAllPickups();
                    break;
                case 'rewards':
                    this.loadRewards();
                    break;
                case 'earnings':
                    this.loadEarningsData(this.currentEarningsPeriod);
                    break;
                case 'performance':
                    this.loadPerformanceData(this.currentPerformancePeriod);
                    break;
                case 'schedule':
                    this.loadSchedule(this.currentSchedulePeriod);
                    break;
                case 'profile':
                    this.loadProfileData();
                    break;
                case 'settings':
                    this.loadSettingsData();
                    break;
                case 'map':
                    this.loadMapData();
                    break;
            }
        }
    }

    // Load user data
    loadUserData() {
        const user = this.state.user;
        
        // Update user information across the app
        this.setTextContent('collectorName', user.name);
        this.setTextContent('profileCollectorName', user.name);
        this.setInputValue('firstName', user.name.split(' ')[0]);
        this.setInputValue('lastName', user.name.split(' ')[1]);
        this.setInputValue('email', user.email);
        this.setInputValue('phone', user.phone);
        this.setInputValue('address', user.address);
        this.setInputValue('vehicle', user.vehicle);
        
        // Update reward points
        this.setTextContent('rewardPoints', user.points);
        this.setTextContent('availablePoints', user.points);
        this.setTextContent('currentTier', user.tier.charAt(0).toUpperCase() + user.tier.slice(1));
        
        // Update tier progress
        this.updateTierProgress();
    }

    // Update tier progress visualization
    updateTierProgress() {
        const points = this.state.user.points;
        let progress = 0;
        
        if (this.state.user.tier === 'bronze') {
            progress = (points / 500) * 100;
        } else if (this.state.user.tier === 'silver') {
            progress = ((points - 500) / 500) * 100; // 500-1000 points for silver to gold
        } else {
            progress = 100;
        }
        
        const progressBar = document.getElementById('tierProgressBar');
        if (progressBar) {
            progressBar.style.width = `${Math.min(progress, 100)}%`;
        }
    }

    // Load dashboard data
    loadDashboardData() {
        this.loadPickupStats();
        this.loadPendingPickups();
        this.loadTodaySchedule();
        this.loadPerformanceData('week', true); // For dashboard display
    }

    // Load pickup statistics
    loadPickupStats() {
        const pendingPickups = this.state.pickups.filter(p => p.status === 'pending');
        const acceptedPickups = this.state.pickups.filter(p => p.status === 'accepted');
        const completedPickups = this.state.pickups.filter(p => p.status === 'completed');
        
        // Update stats
        this.setTextContent('pendingCount', pendingPickups.length);
        this.setTextContent('acceptedCount', acceptedPickups.length);
        this.setTextContent('completedCount', completedPickups.length);
        
        // Update notification badges
        this.setTextContent('pickupNotification', pendingPickups.length);
    }

    // Load pending pickups for dashboard
    loadPendingPickups() {
        const container = document.getElementById('pendingPickupsList');
        if (!container) return;

        const pendingPickups = this.state.pickups.filter(p => p.status === 'pending');
        
        if (pendingPickups.length === 0) {
            container.innerHTML = this.createEmptyState(
                'bi-check-circle',
                'No Pending Pickups',
                'All pickup requests have been processed.'
            );
            return;
        }
        
        container.innerHTML = pendingPickups.map(pickup => `
            <div class="card pickup-card mb-3">
                <div class="card-body">
                    <div class="row align-items-center">
                        <div class="col-md-8">
                            <div class="d-flex align-items-center mb-2">
                                <h5 class="mb-0 me-3">${pickup.wasteType} Pickup</h5>
                                <span class="badge badge-pending text-white">Pending</span>
                            </div>
                            <p class="text-muted mb-2">
                                <i class="bi bi-geo-alt me-1"></i>${pickup.address}
                            </p>
                            <div class="d-flex flex-wrap gap-3">
                                <small><i class="bi bi-person me-1"></i>${pickup.customer}</small>
                                <small><i class="bi bi-telephone me-1"></i>${pickup.phone}</small>
                                <small><i class="bi bi-clock me-1"></i>Requested: ${pickup.requested}</small>
                            </div>
                        </div>
                        <div class="col-md-4 text-md-end">
                            <div class="btn-group w-100 w-md-auto">
                                <button class="btn btn-success btn-sm" onclick="acceptPickup(${pickup.id})">
                                    <i class="bi bi-check-lg me-1"></i>Accept
                                </button>
                                <button class="btn btn-outline-secondary btn-sm" onclick="viewDetails(${pickup.id})">
                                    <i class="bi bi-info-circle"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // Load all pickups for pickups section
    loadAllPickups() {
        const container = document.getElementById('allPickupsTable');
        if (!container) return;
        
        if (this.state.pickups.length === 0) {
            container.innerHTML = `<tr><td colspan="7" class="text-center">No pickup requests found</td></tr>`;
            return;
        }
        
        container.innerHTML = this.state.pickups.map(pickup => `
            <tr>
                <td>#00${pickup.id}</td>
                <td>${pickup.customer}</td>
                <td>${pickup.address}</td>
                <td>${pickup.wasteType}</td>
                <td><span class="badge ${this.getStatusBadgeClass(pickup.status)}">${this.capitalizeFirstLetter(pickup.status)}</span></td>
                <td>${pickup.requested}</td>
                <td>
                    ${pickup.status === 'pending' ? 
                        `<button class="btn btn-success btn-sm me-1" onclick="acceptPickup(${pickup.id})">Accept</button>` : 
                        pickup.status === 'accepted' ? 
                        `<button class="btn btn-warning btn-sm me-1" onclick="completePickup(${pickup.id})">Complete</button>` : 
                        `<button class="btn btn-outline-secondary btn-sm me-1" disabled>Completed</button>`
                    }
                    <button class="btn btn-outline-secondary btn-sm" onclick="viewDetails(${pickup.id})">Details</button>
                </td>
            </tr>
        `).join('');
    }

    // Load today's schedule for dashboard
    loadTodaySchedule() {
        const container = document.getElementById('todayScheduleList');
        if (!container) return;

        const todaySchedule = this.state.schedule;
        
        if (todaySchedule.length === 0) {
            container.innerHTML = this.createEmptyState(
                'bi-calendar-x',
                'No Schedule Today',
                'You have no scheduled pickups for today.'
            );
            return;
        }
        
        container.innerHTML = todaySchedule.map(item => `
            <div class="list-group-item d-flex justify-content-between align-items-center">
                <div>
                    <h6 class="mb-1">${item.title}</h6>
                    <small class="text-muted">${item.time}</small>
                </div>
                <span class="badge ${this.getStatusBadgeClass(item.status)}">
                    ${this.capitalizeFirstLetter(item.status.replace('-', ' '))}
                </span>
            </div>
        `).join('');
    }

    // Load schedule for schedule section
    loadSchedule(period = 'today') {
        const container = document.getElementById('scheduleList');
        if (!container) return;

        let filteredSchedule = this.state.schedule;
        
        // Filter based on period (simplified for demo)
        if (period === 'week') {
            filteredSchedule = [...this.state.schedule, ...this.getAdditionalWeekSchedule()];
        } else if (period === 'month') {
            filteredSchedule = [...this.state.schedule, ...this.getAdditionalMonthSchedule()];
        }
        
        if (filteredSchedule.length === 0) {
            container.innerHTML = this.createEmptyState(
                'bi-calendar-x',
                'No Schedule Items',
                'No schedule items for the selected period.'
            );
            return;
        }
        
        container.innerHTML = filteredSchedule.map(item => `
            <div class="list-group-item d-flex justify-content-between align-items-center">
                <div>
                    <h6 class="mb-1">${item.title}</h6>
                    <small class="text-muted">${item.time}</small>
                    <p class="mb-0 mt-1"><i class="bi bi-geo-alt me-1"></i>${item.location}</p>
                    ${item.customer ? `<small class="text-muted"><i class="bi bi-person me-1"></i>${item.customer}</small>` : ''}
                </div>
                <span class="badge ${this.getStatusBadgeClass(item.status)}">
                    ${this.capitalizeFirstLetter(item.status.replace('-', ' '))}
                </span>
            </div>
        `).join('');
    }

    // Load performance data
    loadPerformanceData(period, forDashboard = false) {
        const performanceData = this.state.performance[period];
        
        if (!forDashboard) {
            // Update metrics cards
            const metricCards = document.querySelectorAll('.metric-card .metric-value');
            if (metricCards.length >= 4) {
                const values = Object.values(performanceData);
                metricCards[0].textContent = `${values[0]}%`;
                metricCards[1].textContent = `${values[1]}%`;
                metricCards[2].textContent = `${values[2]}/5`;
                metricCards[3].textContent = values[3];
            }
        } else {
            // For dashboard, update progress bars
            const progressBars = document.querySelectorAll('.progress-bar');
            if (progressBars.length >= 3) {
                const values = [performanceData.completionRate, performanceData.onTimeRate, performanceData.satisfactionRate];
                progressBars.forEach((bar, index) => {
                    if (values[index] !== undefined) {
                        bar.style.width = `${values[index]}%`;
                        // Update the percentage text next to progress bars
                        const percentageSpan = bar.parentElement?.previousElementSibling?.querySelector('strong');
                        if (percentageSpan) {
                            percentageSpan.textContent = `${values[index]}%`;
                        }
                    }
                });
            }
        }
    }

    // Load earnings data
    loadEarningsData(period) {
        const earningsData = this.state.earnings[period];
        
        // Update earnings cards
        const statCards = document.querySelectorAll('.stat-card h2');
        if (statCards.length >= 3) {
            const values = [earningsData.total, earningsData.jobs, earningsData.average];
            const prefixes = ['$', '', '$'];
            statCards.forEach((card, index) => {
                if (values[index] !== undefined) {
                    card.textContent = `${prefixes[index]}${values[index].toLocaleString()}`;
                }
            });
        }
        
        // Load transactions table
        const container = document.getElementById('earningsTable');
        if (!container) return;

        if (earningsData.transactions.length === 0) {
            container.innerHTML = `<tr><td colspan="5" class="text-center">No transactions found</td></tr>`;
            return;
        }
        
        container.innerHTML = earningsData.transactions.map(transaction => `
            <tr>
                <td>${transaction.date}</td>
                <td>${transaction.jobId}</td>
                <td>${transaction.customer}</td>
                <td>$${transaction.amount.toFixed(2)}</td>
                <td><span class="badge bg-success">${this.capitalizeFirstLetter(transaction.status)}</span></td>
            </tr>
        `).join('');
    }

    // Load rewards data
    loadRewards() {
        const availableRewards = this.state.rewards.filter(r => !r.redeemed);
        const redeemedRewards = this.state.redeemedRewards;
        
        // Update stats
        this.setTextContent('rewardsEarned', redeemedRewards.length);
        
        // Show/hide notification badge
        const rewardNotification = document.getElementById('rewardNotification');
        if (rewardNotification) {
            if (availableRewards.length > 0) {
                rewardNotification.style.display = 'flex';
                rewardNotification.textContent = availableRewards.length;
            } else {
                rewardNotification.style.display = 'none';
            }
        }
        
        // Load available rewards
        this.renderAvailableRewards(availableRewards);
        
        // Load redeemed rewards
        this.renderRedeemedRewards(redeemedRewards);
    }

    // Render available rewards
    renderAvailableRewards(rewards) {
        const container = document.getElementById('rewardsList');
        if (!container) return;
        
        if (rewards.length === 0) {
            container.innerHTML = this.createEmptyState(
                'bi-gift',
                'No Available Rewards',
                'Complete more pickups to earn reward points!'
            );
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
                        <h5 class="card-title">${reward.name}</h5>
                        <p class="card-text text-muted flex-grow-1">${reward.description}</p>
                        <div class="d-flex justify-content-between align-items-center mt-auto">
                            <span class="badge bg-warning text-dark">${reward.points} pts</span>
                            <button class="btn btn-reward btn-sm" onclick="viewRewardDetails(${reward.id})" 
                                ${this.state.user.points < reward.points ? 'disabled' : ''}>
                                <i class="bi bi-gift me-1"></i>Redeem
                            </button>
                        </div>
                        ${this.state.user.points < reward.points ? 
                            `<div class="mt-2 text-center"><small class="text-muted">Need ${reward.points - this.state.user.points} more points</small></div>` : ''}
                    </div>
                </div>
            </div>
        `).join('');
    }

    // Render redeemed rewards
    renderRedeemedRewards(rewards) {
        const container = document.getElementById('redeemedRewardsList');
        if (!container) return;
        
        if (rewards.length === 0) {
            container.innerHTML = this.createEmptyState(
                'bi-check-circle',
                'No Redeemed Rewards',
                'You haven\'t redeemed any rewards yet.'
            );
            return;
        }
        
        container.innerHTML = rewards.map(reward => `
            <div class="col-md-6 col-lg-4 mb-4">
                <div class="card reward-card h-100">
                    <div class="redeemed-badge">Redeemed</div>
                    <div class="reward-image-container">
                        <img src="${reward.image}" alt="${reward.name}" class="reward-image"
                             onerror="this.src='${this.generatePlaceholderImage(reward.name, reward.tier)}'">
                        <span class="reward-tier-badge ${this.getTierBadgeClass(reward.tier)}">
                            ${reward.tier.charAt(0).toUpperCase()}
                        </span>
                    </div>
                    <div class="card-body d-flex flex-column">
                        <h5 class="card-title">${reward.name}</h5>
                        <p class="card-text text-muted flex-grow-1">${reward.description}</p>
                        <div class="d-flex justify-content-between align-items-center mt-auto">
                            <span class="badge bg-secondary">${reward.points} pts</span>
                            <small class="text-muted">Redeemed: ${reward.redeemedDate}</small>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // Filter rewards based on current filter
    filterRewards(filter) {
        // This would filter rewards based on the selected filter
        // For now, we'll just reload all rewards
        this.loadRewards();
    }

    // Load profile data
    loadProfileData() {
        // Profile data is already loaded in loadUserData()
        // Additional profile-specific data can be loaded here
    }

    // Load settings data
    loadSettingsData() {
        const preferences = this.state.user.preferences;
        
        // Set notification preferences
        this.setCheckboxValue('newRequests', preferences.newRequests);
        this.setCheckboxValue('scheduleChanges', preferences.scheduleChanges);
        this.setCheckboxValue('earningUpdates', preferences.earningUpdates);
        this.setCheckboxValue('ratingNotifications', preferences.ratingNotifications);
        this.setCheckboxValue('rewardNotifications', preferences.rewardNotifications);
    }

    // Load map data
    loadMapData() {
        const container = document.getElementById('mapLocationsList');
        if (!container) return;

        const todayPickups = this.state.schedule.filter(item => item.type === 'pickup');
        
        if (todayPickups.length === 0) {
            container.innerHTML = this.createEmptyState(
                'bi-map',
                'No Pickup Locations',
                'No scheduled pickups for today.'
            );
            return;
        }
        
        container.innerHTML = todayPickups.map(pickup => `
            <a href="#" class="list-group-item list-group-item-action">
                <div class="d-flex w-100 justify-content-between">
                    <h6 class="mb-1">${pickup.location}</h6>
                    <small class="text-muted">${pickup.time.split(' - ')[0]}</small>
                </div>
                <p class="mb-1">${pickup.title} - ${pickup.customer || 'Drop-off'}</p>
            </a>
        `).join('');
    }

    // Show settings tab
    showSettingsTab(tab) {
        // Hide all settings tabs
        document.querySelectorAll('[id$="-settings"]').forEach(tabContent => {
            tabContent.style.display = 'none';
        });
        
        // Show selected tab
        const tabElement = document.getElementById(`${tab}-settings`);
        if (tabElement) {
            tabElement.style.display = 'block';
        }
    }

    // Update profile
    updateProfile() {
        const firstName = document.getElementById('firstName').value;
        const lastName = document.getElementById('lastName').value;
        const email = document.getElementById('email').value;
        const phone = document.getElementById('phone').value;
        const address = document.getElementById('address').value;
        const vehicle = document.getElementById('vehicle').value;
        
        // Update user data
        this.state.user.name = `${firstName} ${lastName}`;
        this.state.user.email = email;
        this.state.user.phone = phone;
        this.state.user.address = address;
        this.state.user.vehicle = vehicle;
        
        // Update UI
        this.loadUserData();
        
        // Show success message
        this.showToast('Profile updated successfully!', 'success');
    }

    // Save notification preferences
    saveNotificationPreferences() {
        this.state.user.preferences = {
            newRequests: document.getElementById('newRequests').checked,
            scheduleChanges: document.getElementById('scheduleChanges').checked,
            earningUpdates: document.getElementById('earningUpdates').checked,
            ratingNotifications: document.getElementById('ratingNotifications').checked,
            rewardNotifications: document.getElementById('rewardNotifications').checked
        };
        
        this.showToast('Notification preferences saved!', 'success');
    }

    // Accept a pickup request
    acceptPickup(id) {
        if (confirm('Accept this pickup request?')) {
            const pickup = this.state.pickups.find(p => p.id === id);
            if (pickup) {
                pickup.status = 'accepted';
                
                // Add to schedule
                this.state.schedule.push({
                    id: Date.now(),
                    title: `${pickup.wasteType} Pickup - ${pickup.customer}`,
                    time: pickup.preferredTime,
                    location: pickup.address,
                    status: 'scheduled',
                    type: 'pickup',
                    customer: pickup.customer
                });
                
                // Update stats and UI
                this.loadPickupStats();
                this.loadPendingPickups();
                this.loadAllPickups();
                
                // Add reward points
                this.state.user.points += 50;
                this.loadUserData();
                
                // Show success message
                this.showToast(`Pickup request #${id} accepted! +50 points earned.`, 'success');
                
                // Check for new rewards
                this.checkForNewRewards();
            }
        }
    }

    // Complete a pickup
    completePickup(id) {
        if (confirm('Mark this pickup as completed?')) {
            const pickup = this.state.pickups.find(p => p.id === id);
            if (pickup) {
                pickup.status = 'completed';
                
                // Update schedule status
                const scheduleItem = this.state.schedule.find(s => 
                    s.customer === pickup.customer && s.location === pickup.address
                );
                if (scheduleItem) {
                    scheduleItem.status = 'completed';
                }
                
                // Update stats and UI
                this.loadPickupStats();
                this.loadAllPickups();
                this.loadSchedule(this.currentSchedulePeriod);
                
                // Add reward points and earnings
                this.state.user.points += 100;
                this.state.earnings.week.total += 45; // Example amount
                this.state.earnings.week.jobs += 1;
                this.state.performance.week.completedJobs += 1;
                
                this.loadUserData();
                this.loadEarningsData(this.currentEarningsPeriod);
                
                // Show success message
                this.showToast(`Pickup request #${id} completed! +100 points earned.`, 'success');
                
                // Check for new rewards
                this.checkForNewRewards();
            }
        }
    }

    // View pickup details
    viewDetails(id) {
        const pickup = this.state.pickups.find(p => p.id === id);
        if (pickup) {
            // Populate modal with pickup details
            this.setTextContent('modalCustomerName', pickup.customer);
            this.setTextContent('modalCustomerPhone', pickup.phone);
            this.setTextContent('modalCustomerEmail', pickup.email);
            this.setTextContent('modalPickupAddress', pickup.address);
            this.setTextContent('modalWasteType', pickup.wasteType);
            this.setTextContent('modalEstimatedWeight', pickup.estimatedWeight);
            this.setTextContent('modalPreferredTime', pickup.preferredTime);
            this.setTextContent('modalSpecialInstructions', pickup.specialInstructions);
            
            // Set up accept button
            const acceptButton = document.getElementById('modalAcceptButton');
            if (acceptButton) {
                if (pickup.status === 'pending') {
                    acceptButton.style.display = 'block';
                    acceptButton.onclick = () => {
                        this.acceptPickup(id);
                        const modal = bootstrap.Modal.getInstance(document.getElementById('pickupDetailsModal'));
                        if (modal) modal.hide();
                    };
                } else {
                    acceptButton.style.display = 'none';
                }
            }
            
            // Show the modal
            const modalElement = document.getElementById('pickupDetailsModal');
            if (modalElement) {
                const modal = new bootstrap.Modal(modalElement);
                modal.show();
            }
        }
    }

    // View reward details
    viewRewardDetails(id) {
        const reward = this.state.rewards.find(r => r.id === id);
        if (reward) {
            // Populate modal with reward details
            const rewardImage = document.getElementById('modalRewardImage');
            if (rewardImage) {
                rewardImage.src = reward.image;
                rewardImage.alt = reward.name;
                rewardImage.onerror = () => {
                    rewardImage.src = this.generatePlaceholderImage(reward.name, reward.tier);
                };
            }
            
            this.setTextContent('modalRewardName', reward.name);
            this.setTextContent('modalRewardDescription', reward.description);
            this.setTextContent('modalRewardPoints', reward.points);
            this.setTextContent('modalUserPoints', this.state.user.points);
            
            // Set up redeem button and status
            const redeemButton = document.getElementById('modalRedeemButton');
            const statusDiv = document.getElementById('modalRewardStatus');
            
            if (statusDiv && redeemButton) {
                if (reward.redeemed) {
                    statusDiv.innerHTML = '<div class="alert alert-success"><i class="bi bi-check-circle me-2"></i>You have already redeemed this reward</div>';
                    redeemButton.style.display = 'none';
                } else if (this.state.user.points >= reward.points) {
                    statusDiv.innerHTML = '<div class="alert alert-info"><i class="bi bi-info-circle me-2"></i>You have enough points to redeem this reward</div>';
                    redeemButton.style.display = 'block';
                    redeemButton.onclick = () => {
                        this.redeemReward(id);
                        const modal = bootstrap.Modal.getInstance(document.getElementById('rewardDetailsModal'));
                        if (modal) modal.hide();
                    };
                } else {
                    const pointsNeeded = reward.points - this.state.user.points;
                    statusDiv.innerHTML = `<div class="alert alert-warning"><i class="bi bi-exclamation-triangle me-2"></i>You need ${pointsNeeded} more points to redeem this reward</div>`;
                    redeemButton.style.display = 'none';
                }
            }
            
            // Show the modal
            const modalElement = document.getElementById('rewardDetailsModal');
            if (modalElement) {
                const modal = new bootstrap.Modal(modalElement);
                modal.show();
            }
        }
    }

    // Redeem a reward
    redeemReward(id) {
        const reward = this.state.rewards.find(r => r.id === id);
        if (reward && !reward.redeemed && this.state.user.points >= reward.points) {
            // Deduct points
            this.state.user.points -= reward.points;
            
            // Mark as redeemed
            reward.redeemed = true;
            reward.redeemedDate = new Date().toISOString().split('T')[0];
            
            // Move to redeemed rewards
            this.state.redeemedRewards.push({...reward});
            
            // Update UI
            this.loadUserData();
            this.loadRewards();
            
            // Show success message
            this.showToast(`Congratulations! You've redeemed ${reward.name}.`, 'success');
        }
    }

    // Check for new rewards when points increase
    checkForNewRewards() {
        // Check if user has reached a new tier
        const oldTier = this.state.user.tier;
        let newTier = oldTier;
        
        if (this.state.user.points >= 1000) {
            newTier = 'gold';
        } else if (this.state.user.points >= 500) {
            newTier = 'silver';
        } else {
            newTier = 'bronze';
        }
        
        if (newTier !== oldTier) {
            this.state.user.tier = newTier;
            this.showToast(`Congratulations! You've reached ${newTier} tier! New rewards are now available.`, 'success');
            this.loadUserData();
        }
        
        // Check for specific reward milestones
        this.checkRewardMilestones();
    }

    // Check for specific reward milestones
    checkRewardMilestones() {
        const points = this.state.user.points;
        const milestones = [100, 250, 500, 750, 1000, 1500];
        
        milestones.forEach(milestone => {
            if (points >= milestone && points - 50 < milestone) {
                this.showToast(`You've reached ${milestone} points! Keep going to unlock more rewards.`, 'info');
            }
        });
    }

    // Refresh map
    refreshMap() {
        this.showToast('Map data refreshed!', 'info');
        this.loadMapData();
    }

    // Logout function
    logout() {
        if (confirm('Are you sure you want to logout?')) {
            // In a real app, this would clear authentication tokens
            localStorage.removeItem('collectorToken');
            this.showToast('You have been logged out successfully.', 'info');
            
            // Redirect to login page (commented out for demo)
            // window.location.href = 'login.html';
        }
    }

    // Utility Methods

    // Set text content safely
    setTextContent(elementId, text) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = text;
        }
    }

    // Set input value safely
    setInputValue(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.value = value;
        }
    }

    // Set checkbox value safely
    setCheckboxValue(elementId, checked) {
        const element = document.getElementById(elementId);
        if (element) {
            element.checked = checked;
        }
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
            'pending': 'bg-warning',
            'accepted': 'bg-primary',
            'completed': 'bg-success',
            'scheduled': 'bg-secondary',
            'in-progress': 'bg-info'
        };
        return statusClasses[status] || 'bg-secondary';
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

    // Capitalize first letter
    capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    // Show toast notification
    showToast(message, type = 'info') {
        const toastContainer = document.querySelector('.toast-container');
        if (!toastContainer) return;

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

    // Demo data generators
    getAdditionalWeekSchedule() {
        return [
            {
                id: 5,
                title: "Community Center Pickup",
                time: "10:00 AM - 11:00 AM",
                location: "Community Center, Main Street",
                status: "scheduled",
                type: "pickup",
                customer: "Community Center"
            },
            {
                id: 6,
                title: "Office Building Collection",
                time: "2:00 PM - 3:30 PM",
                location: "123 Business Ave, Downtown",
                status: "scheduled",
                type: "pickup",
                customer: "Tech Solutions Inc."
            }
        ];
    }

    getAdditionalMonthSchedule() {
        return [
            ...this.getAdditionalWeekSchedule(),
            {
                id: 7,
                title: "Monthly Bulk Item Collection",
                time: "9:00 AM - 12:00 PM",
                location: "Various locations in Eco City",
                status: "scheduled",
                type: "special"
            },
            {
                id: 8,
                title: "School Recycling Program",
                time: "1:00 PM - 3:00 PM",
                location: "Eco City Elementary School",
                status: "scheduled",
                type: "pickup",
                customer: "Eco City Elementary"
            }
        ];
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.collectorDashboard = new CollectorDashboard();
});

// Export for potential module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CollectorDashboard };
}