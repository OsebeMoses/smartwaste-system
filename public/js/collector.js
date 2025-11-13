// collector.js - SmartWaste Collector Dashboard Functionality
class CollectorDashboard {
    constructor() {
        this.appState = {
            user: {
                id: null,
                name: '',
                email: '',
                phone: '',
                address: '',
                vehicle: '',
                memberSince: '',
                totalJobs: 0,
                rating: 0,
                reviewCount: 0,
                serviceArea: '',
                points: 0,
                tier: 'bronze',
                earnings: { weekly: 0, monthly: 0, total: 0 },
                performance: { completionRate: 0, onTimeRate: 0, customerRating: 0 }
            },
            pickups: [],

            schedule: [],
            rewards: [],
            notifications: [],
            map: null,
            modalMap: null,
            currentSection: 'dashboard',
            currentFilter: 'all',
            liveLocation: null,
            liveLocationWatchId: null,
            route: {
                orderedIds: [],
                etasById: {},
                totalDistanceKm: 0,
                totalDurationMin: 0
            }
        };

        this.elements = {};
        this.mapManager = new MapManager();
        this.notificationManager = new NotificationManager();
        this.chartManager = new ChartManager();
        this._autoLocationInterval = null;
        
        this.init();
    }

    init() {
        this.cacheElements();
        this.bindEvents();
        this.initializeApp();
    }

    cacheElements() {
        // Main elements
        this.elements.loadingSpinner = document.getElementById('loadingSpinner');
        this.elements.mainContent = document.getElementById('mainContent');
        this.elements.toastContainer = document.getElementById('toastContainer');
        this.elements.errorState = document.getElementById('errorState');

        // User info elements
        this.elements.collectorName = document.getElementById('collectorName');
        this.elements.collectorNameDisplay = document.getElementById('collectorNameDisplay');
        this.elements.welcomeName = document.getElementById('welcomeName');
        this.elements.collectorTier = document.getElementById('collectorTier');

        // Stats elements
        this.elements.pendingCount = document.getElementById('pendingCount');
        this.elements.acceptedCount = document.getElementById('acceptedCount');
        this.elements.completedCount = document.getElementById('completedCount');
        this.elements.pickupNotification = document.getElementById('pickupNotification');

        // Earnings elements
        this.elements.weeklyEarnings = document.getElementById('weeklyEarnings');
        this.elements.monthlyEarnings = document.getElementById('monthlyEarnings');
        this.elements.totalEarnings = document.getElementById('totalEarnings');

        // Performance elements
        this.elements.completionRate = document.getElementById('completionRate');
        this.elements.onTimeRate = document.getElementById('onTimeRate');
        this.elements.customerRating = document.getElementById('customerRating');

        // Content containers
        this.elements.pendingPickupsList = document.getElementById('pendingPickupsList');
        this.elements.todayScheduleList = document.getElementById('todayScheduleList');
        this.elements.allPickupsTable = document.getElementById('allPickupsTable');
        this.elements.scheduleList = document.getElementById('scheduleList');
        this.elements.activePickupsList = document.getElementById('activePickupsList');
        this.elements.recentReviews = document.getElementById('recentReviews');
        this.elements.pointsHistoryTable = document.getElementById('pointsHistoryTable');

        // Schedule overview
        this.elements.todayPickupsCount = document.getElementById('todayPickupsCount');
        this.elements.weekPickupsCount = document.getElementById('weekPickupsCount');
        this.elements.monthPickupsCount = document.getElementById('monthPickupsCount');

        // Performance cards
        this.elements.totalJobsCount = document.getElementById('totalJobsCount');
        this.elements.completionRateCard = document.getElementById('completionRateCard');
        this.elements.onTimeRateCard = document.getElementById('onTimeRateCard');
        this.elements.avgRatingCard = document.getElementById('avgRatingCard');

        // Earnings details
        this.elements.weeklyEarningsDetail = document.getElementById('weeklyEarningsDetail');
        this.elements.monthlyEarningsDetail = document.getElementById('monthlyEarningsDetail');
        this.elements.totalEarningsDetail = document.getElementById('totalEarningsDetail');

        // Rewards
        this.elements.rewardPoints = document.getElementById('rewardPoints');

        // Route info
        this.elements.totalDistance = document.getElementById('totalDistance');
        this.elements.estimatedTime = document.getElementById('estimatedTime');
        this.elements.pickupsOnRoute = document.getElementById('pickupsOnRoute');

        // Profile elements
        this.elements.profileName = document.getElementById('profileName');
        this.elements.profileRole = document.getElementById('profileRole');
        this.elements.memberSince = document.getElementById('memberSince');
        this.elements.totalJobsProfile = document.getElementById('totalJobsProfile');
        this.elements.serviceArea = document.getElementById('serviceArea');
        this.elements.vehicleType = document.getElementById('vehicleType');

        // Navigation
        this.elements.navButtons = document.querySelectorAll('.nav-btn');
        this.elements.dashboardSections = document.querySelectorAll('.dashboard-section');
    }

    bindEvents() {
        // Navigation buttons
        this.elements.navButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const section = btn.getAttribute('data-section');
                this.showSection(section);
            });
        });

        // Modal events
        const pickupModal = document.getElementById('pickupDetailsModal');
        if (pickupModal) {
            pickupModal.addEventListener('show.bs.modal', () => {
                pickupModal.removeAttribute('aria-hidden');
                const main = document.getElementById('mainContent');
                if (main) main.setAttribute('inert', '');
                this._lastFocus = document.activeElement;
                this._enableFocusTrap(pickupModal);
            });
            pickupModal.addEventListener('hide.bs.modal', () => {
                // Before Bootstrap toggles aria-hidden, ensure no focused element remains inside
                if (document.activeElement && typeof document.activeElement.blur === 'function') {
                    document.activeElement.blur();
                }
            });
            pickupModal.addEventListener('shown.bs.modal', () => {
                const primary = document.getElementById('modalAcceptButton')
                    || pickupModal.querySelector('.btn-primary')
                    || pickupModal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
                if (primary && typeof primary.focus === 'function') primary.focus();
            });
            pickupModal.addEventListener('hidden.bs.modal', () => {
                this.cleanupModalMap();
                pickupModal.setAttribute('aria-hidden', 'true');
                const main = document.getElementById('mainContent');
                if (main) main.removeAttribute('inert');
                this._disableFocusTrap(pickupModal);
                if (this._lastFocus && typeof this._lastFocus.focus === 'function') {
                    this._lastFocus.focus();
                } else if (document.body && typeof document.body.focus === 'function') {
                    document.body.focus();
                }
            });
        }

        const navigationModal = document.getElementById('navigationModal');
        if (navigationModal) {
            navigationModal.addEventListener('show.bs.modal', () => {
                // Ensure aria-hidden is not present while showing
                navigationModal.removeAttribute('aria-hidden');
                const main = document.getElementById('mainContent');
                if (main) main.setAttribute('inert', '');
                this._lastFocus = document.activeElement;
                this._enableFocusTrap(navigationModal);
            });
            navigationModal.addEventListener('hide.bs.modal', () => {
                if (document.activeElement && typeof document.activeElement.blur === 'function') {
                    document.activeElement.blur();
                }
            });
            navigationModal.addEventListener('shown.bs.modal', () => {
                // Now that modal is fully shown, move focus to primary action
                const primary = navigationModal.querySelector('.modal-footer .btn-primary') || navigationModal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
                if (primary && typeof primary.focus === 'function') primary.focus();
            });
            navigationModal.addEventListener('hidden.bs.modal', () => {
                // Mark as hidden only after fully hidden
                navigationModal.setAttribute('aria-hidden', 'true');
                const main = document.getElementById('mainContent');
                if (main) main.removeAttribute('inert');
                this._disableFocusTrap(navigationModal);
                if (this._lastFocus && typeof this._lastFocus.focus === 'function') {
                    this._lastFocus.focus();
                }
            });
        }

        // Form submissions
        const profileForm = document.getElementById('profileForm');
        if (profileForm) {
            profileForm.addEventListener('submit', (e) => this.handleProfileUpdate(e));
        }

        const passwordForm = document.getElementById('passwordForm');
        if (passwordForm) {
            passwordForm.addEventListener('submit', (e) => this.handlePasswordChange(e));
        }

        // Real-time updates
        setInterval(() => this.checkForNewPickups(), 30000);
        setInterval(() => this.updateLiveData(), 10000);
    }

    initializeApp() {
        try {
            // Simulate loading
            setTimeout(() => {
                this.hideLoading();
                this.loadInitialData();
                this.showSection('dashboard');
                this.showToast('Welcome to SmartWaste Collector Dashboard! 🚚', 'success');
            }, 1000);
        } catch (error) {
            this.showError('Failed to initialize dashboard: ' + error.message);
        }
    }

    async verifyAvailabilityWithBackoff() {
        // Try a couple of times to read profile showing available=true
        const attempts = 3;
        for (let i = 0; i < attempts; i++) {
            try {
                const profRes = await window.apiService.request('/collectors/profile');
                const isAvail = !!(profRes?.data?.collector?.isAvailable);
                if (isAvail) return true;
            } catch (_) {}
            // small delay before retry
            await new Promise(r => setTimeout(r, 150));
        }
        return false;
    }

    hideLoading() {
        if (this.elements.loadingSpinner) {
            this.elements.loadingSpinner.style.display = 'none';
        }
        if (this.elements.mainContent) {
            this.elements.mainContent.style.display = 'block';
        }
    }

    showError(message) {
        console.error('Dashboard Error:', message);
        if (this.elements.loadingSpinner) {
            this.elements.loadingSpinner.style.display = 'none';
        }
        if (this.elements.errorState) {
            this.elements.errorState.style.display = 'block';
            document.getElementById('errorMessage').textContent = message;
        }
    }

    async loadInitialData() {
        await this.fetchAndBindUser();
        await this.loadPickups();
        this.loadSchedule();
        this.loadPerformanceData();
        this.loadRewardsData();
        this.initializeMap();
    }

    loadUserData() {
        const user = this.appState.user;
        
        // Update user information
        this.updateElementText(this.elements.collectorName, user.name);
        this.updateElementText(this.elements.collectorNameDisplay, user.name);
        this.updateElementText(this.elements.welcomeName, user.name);
        
        // Update tier badge
        if (this.elements.collectorTier) {
            this.elements.collectorTier.textContent = `${user.tier.charAt(0).toUpperCase() + user.tier.slice(1)} Collector`;
            this.elements.collectorTier.className = `badge badge-tier badge-${user.tier}`;
        }

        // Update earnings
        this.updateElementText(this.elements.weeklyEarnings, `$${user.earnings.weekly || 0}`);
        this.updateElementText(this.elements.monthlyEarnings, `$${user.earnings.monthly || 0}`);
        this.updateElementText(this.elements.totalEarnings, `$${user.earnings.total || 0}`);

        // Update performance metrics
        this.updateElementText(this.elements.completionRate, `${user.performance.completionRate || 0}%`);
        this.updateElementText(this.elements.onTimeRate, `${user.performance.onTimeRate || 0}%`);
        this.updateElementText(this.elements.customerRating, `${user.performance.customerRating || 0}/5`);

        // Update profile information
        this.updateElementText(this.elements.profileName, user.name);
        this.updateElementText(this.elements.profileRole, 'Waste Collector');
        this.updateElementText(this.elements.memberSince, user.memberSince);
        this.updateElementText(this.elements.totalJobsProfile, (user.totalJobs || 0).toString());
        this.updateElementText(this.elements.serviceArea, user.serviceArea);
        this.updateElementText(this.elements.vehicleType, user.vehicle);
    }

    async fetchAndBindUser() {
        try {
            const api = window.apiService;
            if (!api) return;
            const me = await api.getCurrentUser();
            const data = me.data || me; // handle {success,data}
            if (!data || data.role !== 'collector') {
                this.showToast('Access denied: collector role required', 'error');
                window.location.href = '/login.html';
                return;
            }
            // Attempt to enrich from collector profile/dashboard
            let vehicle = data.collectorData?.vehicle || '';
            let stats = data.collectorData?.stats || {};
            let isAvailable = data.collectorData?.isAvailable;
            let recentPickups = [];
            try {
                const profRes = await api.request('/collectors/profile');
                const prof = profRes.data || {};
                vehicle = prof.collector?.vehicle || vehicle;
                stats = prof.collector?.stats || stats;
                if (typeof prof.collector?.isAvailable === 'boolean') {
                    isAvailable = prof.collector.isAvailable;
                }
                recentPickups = prof.recentPickups || [];
            } catch (_) {}

            this.appState.user = {
                id: data._id,
                name: data.name,
                email: data.email,
                phone: data.phone || '',
                address: data.profile?.address || '',
                vehicle: vehicle,
                memberSince: data.collectorData?.memberSince || '',
                totalJobs: stats?.completedPickups || 0,
                rating: stats?.averageRating || 0,
                reviewCount: 0,
                serviceArea: '',
                points: data.points || 0,
                tier: data.tier || 'bronze',
                role: data.role || 'collector',
                earnings: { weekly: 0, monthly: 0, total: stats?.totalEarnings || 0 },
                performance: { completionRate: stats?.completionRate || 0, onTimeRate: stats?.onTimeRate || 0, customerRating: stats?.averageRating || 0 }
            };
            if (typeof isAvailable === 'boolean') this.appState.user.isAvailable = isAvailable;
            this.appState.recentCompletedPickups = recentPickups;
            this.loadUserData();
        } catch (e) {
            console.error('Failed to fetch user', e);
            this.showToast('Authentication required', 'error');
            window.location.href = '/login.html';
        }
    }

    async loadPickups() {
        try {
            const api = window.apiService;
            let available = [];
            let active = [];
            if (api) {
                // Prefer dashboard payload; fallback to dedicated endpoints
                try {
                    const dash = await api.getCollectorDashboard();
                    const d = dash.data || {};
                    available = (d.pickups?.available || []).map(this.normalizePickupFromAPI);
                    active = (d.pickups?.active || []).map(this.normalizePickupFromAPI);
                } catch (e) {
                    const [availRes, activeRes] = await Promise.all([
                        api.getAvailablePickups(),
                        api.getCollectorPickups()
                    ]);
                    available = (availRes.data || []).map(this.normalizePickupFromAPI);
                    active = (activeRes.data || []).map(this.normalizePickupFromAPI);
                }
            }

            // Assign pickups (no local mock fallback)
            this.appState.pickups = [...available, ...active];

            const pendingPickups = this.appState.pickups.filter(p => p.status === 'pending');
            const acceptedPickups = this.appState.pickups.filter(p => p.status === 'accepted' || p.status === 'inProgress');
            const completedPickups = this.appState.pickups.filter(p => p.status === 'completed');

            this.updateElementText(this.elements.pendingCount, pendingPickups.length);
            this.updateElementText(this.elements.acceptedCount, acceptedPickups.length);
            this.updateElementText(this.elements.completedCount, completedPickups.length);

            this.updateNotificationBadge(pendingPickups.length);

            this.loadPendingPickupsList(pendingPickups);
            this.loadAllPickupsTable(this.appState.pickups);
            this.loadActivePickupsList(acceptedPickups);

            // Manage background live location updates based on active work
            this.manageAutoLocationUpdates();
        } catch (error) {
            console.error('Error loading pickups:', error);
            this.showToast('Error loading pickup data', 'error');
        }
    }

    normalizePickupFromAPI(p) {
        return {
            id: p._id || p.id,
            customerName: p.residentId?.name || 'Customer',
            phone: p.residentId?.phone || '',
            email: p.residentId?.email || '',
            address: p.location?.address || 'Nairobi, Kenya',
            wasteType: p.wasteType,
            estimatedWeight: p.estimatedWeight || '',
            preferredTime: new Date(p.scheduledDate || p.createdAt).toLocaleTimeString(),
            specialInstructions: p.location?.instructions || '',
            status: p.status,
            requested: p.createdAt || new Date().toISOString(),
            points: p.estimatedPoints || 0,
            location: { lat: p.location?.coordinates?.[1], lng: p.location?.coordinates?.[0] }
        };
    }

    loadPendingPickupsList(pendingPickups) {
        const container = this.elements.pendingPickupsList;
        if (!container) return;

        if (pendingPickups.length === 0) {
            container.innerHTML = this.createEmptyState(
                'bi-check-circle',
                'No Pending Requests',
                'All pickup requests have been processed.'
            );
            return;
        }

        container.innerHTML = pendingPickups.map(pickup => `
            <div class="card pickup-card mb-3 fade-in">
                <div class="card-body">
                    <div class="row align-items-center">
                        <div class="col-md-8">
                            <div class="d-flex align-items-center mb-2">
                                <h5 class="mb-0 me-3">${this.capitalizeFirstLetter(pickup.wasteType)} Pickup</h5>
                                <span class="status-badge status-pending">Pending</span>
                            </div>
                            <p class="text-muted mb-2">
                                <i class="bi bi-geo-alt me-1"></i>${pickup.address}
                            </p>
                            <div class="d-flex flex-wrap gap-3">
                                <small><i class="bi bi-person me-1"></i>${pickup.customerName || 'Customer'}</small>
                                <small><i class="bi bi-clock me-1"></i>${this.formatRelativeTime(new Date(pickup.requested))}</small>
                                <small><i class="bi bi-coin me-1"></i>${pickup.points || 0} points</small>
                            </div>
                        </div>
                        <div class="col-md-4 text-md-end">
                            <div class="btn-group w-100 w-md-auto">
                                <button class="btn btn-success btn-sm" onclick="collectorDashboard.acceptPickup('${pickup.id}')">
                                    <i class="bi bi-check-lg me-1"></i>Accept
                                </button>
                                <button class="btn btn-outline-secondary btn-sm" onclick="collectorDashboard.viewPickupDetails('${pickup.id}')">
                                    <i class="bi bi-info-circle"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    loadAllPickupsTable(allPickups) {
        const container = this.elements.allPickupsTable;
        if (!container) return;

        // Filter pickups based on current filter
        let filteredPickups = allPickups;
        if (this.appState.currentFilter !== 'all') {
            filteredPickups = allPickups.filter(p => p.status === this.appState.currentFilter);
        }

        // Sort by requested date (newest first)
        const sortedPickups = [...filteredPickups].sort((a, b) => 
            new Date(b.requested) - new Date(a.requested)
        );

        if (sortedPickups.length === 0) {
            container.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center py-4">
                        <div class="empty-state">
                            <i class="bi bi-inbox"></i>
                            <h5>No Pickup Requests</h5>
                            <p class="text-muted">No ${this.appState.currentFilter !== 'all' ? this.appState.currentFilter : ''} pickup requests found.</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        container.innerHTML = sortedPickups.map(pickup => {
            const statusClass = `status-${pickup.status}`;
            const statusText = this.capitalizeFirstLetter(pickup.status);

            return `
                <tr class="fade-in">
                    <td>#${pickup.id}</td>
                    <td>
                        <div>${pickup.customerName || 'Customer'}</div>
                        <small class="text-muted">${pickup.phone || 'No phone'}</small>
                    </td>
                    <td>${pickup.address}</td>
                    <td>
                        <span class="badge bg-light text-dark">${this.capitalizeFirstLetter(pickup.wasteType)}</span>
                    </td>
                    <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                    <td>${this.formatRelativeTime(new Date(pickup.requested))}</td>
                    <td>
                        <div class="btn-group btn-group-sm">
                            ${pickup.status === 'pending' ? 
                                `<button class="btn btn-success" onclick="collectorDashboard.acceptPickup('${pickup.id}')" title="Accept Pickup">
                                    <i class="bi bi-check-lg"></i>
                                </button>` : 
                                pickup.status === 'accepted' ? 
                                `<button class="btn btn-primary" onclick="collectorDashboard.startPickup('${pickup.id}')" title="Start Pickup">
                                    <i class="bi bi-play-fill"></i>
                                </button>
                                <button class="btn btn-warning" onclick="collectorDashboard.completePickup('${pickup.id}')" title="Mark Complete">
                                    <i class="bi bi-check2-all"></i>
                                </button>` : 
                                pickup.status === 'inProgress' ?
                                `<button class="btn btn-warning" onclick="collectorDashboard.completePickup('${pickup.id}')" title="Mark Complete">
                                    <i class="bi bi-check2-all"></i>
                                </button>` :
                                `<button class="btn btn-outline-secondary" disabled title="Completed">
                                    <i class="bi bi-check2-all"></i>
                                </button>`
                            }
                            <button class="btn btn-outline-primary" onclick="collectorDashboard.viewPickupDetails('${pickup.id}')" title="View Details">
                                <i class="bi bi-eye"></i>
                            </button>
                            ${pickup.status === 'pending' ? 
                                `<button class="btn btn-outline-danger" onclick="collectorDashboard.rejectPickup('${pickup.id}')" title="Reject">
                                    <i class="bi bi-x-lg"></i>
                                </button>` : ''
                            }
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    loadSchedule() {
        const container = this.elements.scheduleList;
        if (!container) return;

        const today = new Date();
        const todays = this.appState.pickups.filter(p => {
            const d = new Date(p.requested);
            return d.toDateString() === today.toDateString() && p.status !== 'completed';
        });

        if (todays.length === 0) {
            container.innerHTML = this.createEmptyState(
                'bi-calendar-x',
                'No Schedule Today',
                'No pickups scheduled for today.'
            );
            return;
        }

        // Order using optimized route if present, else by time then urgency
        const orderedIds = this.appState.route?.orderedIds || [];
        const byId = new Map(todays.map(p => [p.id, p]));
        const ordered = orderedIds.map(id => byId.get(id)).filter(Boolean);
        const remaining = todays.filter(p => !orderedIds.includes(p.id))
            .sort((a,b) => new Date(a.requested) - new Date(b.requested));
        const list = [...ordered, ...remaining];

        const routeSummary = this.appState.route && (this.appState.route.orderedIds?.length > 0)
            ? `<div class="d-flex align-items-center justify-content-between mb-3">
                   <div class="d-flex gap-3">
                     <span class="badge bg-primary"><i class="bi bi-geo-alt me-1"></i>${this.appState.route.totalDistanceKm || 0} km</span>
                     <span class="badge bg-secondary"><i class="bi bi-stopwatch me-1"></i>${this.appState.route.totalDurationMin || 0} min</span>
                   </div>
                   <button class="btn btn-outline-primary btn-sm" onclick="collectorDashboard.startRouteNavigation()">
                     <i class="bi bi-sign-turn-right me-1"></i>Start Optimized Route
                   </button>
               </div>`
            : '';

        const groups = {
            inProgress: list.filter(p => p.status === 'inProgress'),
            accepted: list.filter(p => p.status === 'accepted'),
            pending: list.filter(p => p.status === 'pending')
        };

        const renderCard = (pickup, idx) => {
            const scheduledDate = new Date(pickup.requested);
            const eta = this.appState.route?.etasById?.[pickup.id];
            const isOverdue = scheduledDate < new Date() && pickup.status !== 'completed';
            const seq = this.appState.route?.orderedIds ? (this.appState.route.orderedIds.indexOf(pickup.id) + 1) : null;
            return `
                <div class="card pickup-card mb-3 fade-in ${isOverdue ? 'border-warning' : ''}">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <div class="d-flex align-items-center gap-2">
                                ${seq ? `<span class="badge bg-dark">#${seq}</span>` : ''}
                                <h5 class="mb-0">${this.capitalizeFirstLetter(pickup.wasteType)} Pickup</h5>
                            </div>
                            <span class="badge ${pickup.status==='inProgress'?'bg-success':pickup.status==='accepted'?'bg-info text-dark':'bg-warning text-dark'}">${pickup.status==='inProgress'?'In Progress':pickup.status==='accepted'?'Accepted':'Pending'}</span>
                        </div>
                        <p class="text-muted mb-2"><i class="bi bi-geo-alt me-1"></i>${pickup.address}</p>
                        <div class="d-flex flex-wrap gap-3 mb-3">
                            <small><i class="bi bi-person me-1"></i>${pickup.customerName || 'Customer'}</small>
                            <small><i class="bi bi-clock me-1"></i>${eta ? ('ETA ' + this.formatTime(eta)) : this.formatTime(scheduledDate)}</small>
                            <small><i class="bi bi-coin me-1"></i>${pickup.points || 0} points</small>
                        </div>
                        <div class="d-flex gap-2 justify-content-end">
                            <button class="btn btn-outline-primary btn-sm" onclick="collectorDashboard.startNavigationToPickup('${pickup.id}')"><i class="bi bi-geo-alt me-1"></i>Navigate</button>
                            ${pickup.status === 'accepted' ? `<button class="btn btn-info btn-sm" onclick="collectorDashboard.startPickup('${pickup.id}')"><i class="bi bi-play-fill me-1"></i>Start</button>` : ''}
                            <button class="btn btn-success btn-sm" onclick="collectorDashboard.completePickup('${pickup.id}')"><i class="bi bi-check2-all me-1"></i>Complete</button>
                        </div>
                    </div>
                </div>`;
        };

        const section = (title, items) => items.length ? `
            <div class="mb-2 mt-3"><h6 class="text-uppercase text-muted mb-2">${title}</h6></div>
            ${items.map(renderCard).join('')}
        ` : '';

        container.innerHTML = `
            ${routeSummary}
            ${section('In Progress', groups.inProgress)}
            ${section('Accepted', groups.accepted)}
            ${section('Pending', groups.pending)}
        `;

        this.updateElementText(this.elements.pickupsOnRoute, todays.length.toString());
        const dist = this.appState.route?.totalDistanceKm || (todays.length * 2.5);
        const mins = this.appState.route?.totalDurationMin || (todays.length * 15);
        this.updateElementText(this.elements.totalDistance, `${Number(dist).toFixed(1)} km`);
        this.updateElementText(this.elements.estimatedTime, `${mins} min`);
    }

    loadActivePickupsList(acceptedPickups) {
        const container = this.elements.activePickupsList;
        if (!container) return;

        const activePickups = acceptedPickups.filter(pickup => {
            const pickupDate = new Date(pickup.requested);
            const today = new Date();
            return pickupDate.toDateString() === today.toDateString();
        });

        if (activePickups.length === 0) {
            container.innerHTML = this.createEmptyState(
                'bi-map',
                'No Active Pickups',
                'No active pickups in your area.'
            );
            return;
        }

        container.innerHTML = activePickups.map(pickup => {
            const scheduledDate = new Date(pickup.requested);
            return `
                <div class="list-group-item d-flex justify-content-between align-items-center bg-dark-lighter border-0 mb-2 rounded fade-in">
                    <div class="flex-grow-1">
                        <h6 class="mb-1">${this.capitalizeFirstLetter(pickup.wasteType)} Pickup</h6>
                        <p class="mb-1 text-muted small">
                            <i class="bi bi-geo-alt me-1"></i>${pickup.address}
                        </p>
                        <small class="text-muted">
                            <i class="bi bi-clock me-1"></i>${this.formatTime(scheduledDate)}
                        </small>
                    </div>
                    <button class="btn btn-outline-primary btn-sm" onclick="collectorDashboard.focusOnMap('${pickup.id}')">
                        <i class="bi bi-eye"></i>
                    </button>
                </div>
            `;
        }).join('');
    }

    loadPerformanceData() {
        const user = this.appState.user;
        // Update performance cards
        this.updateElementText(this.elements.totalJobsCount, (user.totalJobs || 0).toString());
        this.updateElementText(this.elements.completionRateCard, `${user.performance.completionRate || 0}%`);
        this.updateElementText(this.elements.onTimeRateCard, `${user.performance.onTimeRate || 0}%`);
        this.updateElementText(this.elements.avgRatingCard, (user.performance.customerRating || 0).toString());

        // Update earnings details (derive from recent completions if available)
        const recent = this.appState.recentCompletedPickups || [];
        const pointsSum = recent.reduce((sum, r) => sum + (r.estimatedPoints || r.actualPoints || 0), 0);
        this.updateElementText(this.elements.weeklyEarningsDetail, `$${0}`);
        this.updateElementText(this.elements.monthlyEarningsDetail, `$${0}`);
        this.updateElementText(this.elements.totalEarningsDetail, `$${user.earnings.total || 0}`);

        // Build charts from real data
        const labels = recent.map(r => new Date(r.tracking?.completed || r.updatedAt || r.createdAt).toLocaleDateString());
        const completionSeries = recent.map(() => 100); // each listed item was completed
        const onTimeSeries = recent.map(() => user.performance.onTimeRate || 0);
        const pointsSeries = recent.map(r => (r.actualPoints || r.estimatedPoints || 0));
        this.chartManager.initPerformanceChart({ labels, completionSeries, onTimeSeries });
        this.chartManager.initEarningsChart({ labels, pointsSeries });

        // Reviews section could be wired to backend later; hide if none
        this.loadRecentReviews();
    }

    loadRecentReviews() {
        const container = this.elements.recentReviews;
        if (!container) return;
        container.innerHTML = this.createEmptyState(
            'bi-chat-quote',
            'No Reviews',
            'You don\'t have any reviews yet.'
        );
    }

    loadRewardsData() {
        // Update reward points
        this.updateElementText(this.elements.rewardPoints, (this.appState.user.points || 0).toString());
        // Load points history only for residents; collectors don't have redemptions history endpoint access
        if (this.appState.user.role === 'resident') {
            this.loadPointsHistory();
        } else {
            const container = this.elements.pointsHistoryTable;
            if (container) {
                container.innerHTML = `
                    <tr>
                        <td colspan="4" class="text-center py-4">
                            <div class="empty-state">
                                <i class="bi bi-award"></i>
                                <h5>No Rewards Activity</h5>
                                <p class="text-muted">Redemption history is only available for residents.</p>
                            </div>
                        </td>
                    </tr>
                `;
            }
        }
    }

    async loadPointsHistory() {
        const container = this.elements.pointsHistoryTable;
        if (!container) return;
        try {
            if (window.apiService?.getRedemptionHistory) {
                const res = await window.apiService.getRedemptionHistory(10);
                const history = res.data || [];
                if (!history.length) throw new Error('no-data');
                container.innerHTML = history.map(entry => `
                    <tr class="fade-in">
                        <td>${this.formatDateTime(entry.createdAt)}</td>
                        <td>${entry.reward?.name || 'Redemption'}</td>
                        <td class="text-success">-${entry.points}</td>
                        <td>${entry.balanceAfter ?? ''}</td>
                    </tr>
                `).join('');
                return;
            }
            throw new Error('no-service');
        } catch (_) {
            container.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center py-4">
                        <div class="empty-state">
                            <i class="bi bi-award"></i>
                            <h5>No Rewards Activity</h5>
                            <p class="text-muted">No redemptions found for this account.</p>
                        </div>
                    </td>
                </tr>
            `;
        }
    }

    updateScheduleOverview() {
        const allPickups = this.appState.pickups;
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        const todayPickups = allPickups.filter(p => {
            const pickupDate = new Date(p.requested);
            return pickupDate.toDateString() === today.toDateString() && (p.status === 'accepted' || p.status === 'inProgress');
        });

        const weekPickups = allPickups.filter(p => {
            const pickupDate = new Date(p.requested);
            return pickupDate >= startOfWeek && (p.status === 'accepted' || p.status === 'inProgress');
        });

        const monthPickups = allPickups.filter(p => {
            const pickupDate = new Date(p.requested);
            return pickupDate >= startOfMonth && (p.status === 'accepted' || p.status === 'inProgress');
        });

        this.updateElementText(this.elements.todayPickupsCount, todayPickups.length.toString());
        this.updateElementText(this.elements.weekPickupsCount, weekPickups.length.toString());
        this.updateElementText(this.elements.monthPickupsCount, monthPickups.length.toString());

        // Update progress bars (assuming max 10 pickups per day for demo)
        const todayProgress = document.querySelector('#schedule-section .progress-bar.bg-primary');
        const weekProgress = document.querySelector('#schedule-section .progress-bar.bg-info');
        const monthProgress = document.querySelector('#schedule-section .progress-bar.bg-success');

        if (todayProgress) todayProgress.style.width = `${(todayPickups.length / 10) * 100}%`;
        if (weekProgress) weekProgress.style.width = `${(weekPickups.length / 50) * 100}%`;
        if (monthProgress) monthProgress.style.width = `${(monthPickups.length / 200) * 100}%`;
    }

    initializeMap() {
        const mapContainer = document.getElementById('serviceAreaMap');
        if (!mapContainer) return;

        try {
            // Default to Nairobi coordinates
            this.mapManager.initMap('serviceAreaMap', -1.2921, 36.8219);
            this.updateMapWithPickups();
        } catch (error) {
            console.error('Error initializing map:', error);
        }
    }

    updateMapWithPickups() {
        if (!this.mapManager.map) return;

        // Clear existing markers
        this.mapManager.clearMarkers();

        const acceptedPickups = this.appState.pickups.filter(p => p.status === 'accepted' || p.status === 'inProgress');
        const pendingPickups = this.appState.pickups.filter(p => p.status === 'pending');
        
        // Add accepted pickups (green markers)
        acceptedPickups.forEach(pickup => {
            if (pickup.location && pickup.location.lat && pickup.location.lng) {
                this.mapManager.addMarker(
                    pickup.location.lat, 
                    pickup.location.lng, 
                    `
                    <strong>${this.capitalizeFirstLetter(pickup.wasteType)} Pickup</strong><br>
                    <strong>Customer:</strong> ${pickup.customerName || 'Customer'}<br>
                    <strong>Address:</strong> ${pickup.address}<br>
                    <strong>Status:</strong> Accepted
                    `,
                    'accepted'
                );
            }
        });

        // Add pending pickups (orange markers)
        pendingPickups.forEach(pickup => {
            if (pickup.location && pickup.location.lat && pickup.location.lng) {
                this.mapManager.addMarker(
                    pickup.location.lat, 
                    pickup.location.lng, 
                    `
                    <strong>${this.capitalizeFirstLetter(pickup.wasteType)} Pickup</strong><br>
                    <strong>Status:</strong> Pending<br>
                    <strong>Customer:</strong> ${pickup.customerName || 'Customer'}<br>
                    <strong>Address:</strong> ${pickup.address}
                    `,
                    'pending'
                );
            }
        });

        // Add collector's current location if available
        if (this.appState.liveLocation) {
            this.mapManager.addMarker(
                this.appState.liveLocation.lat,
                this.appState.liveLocation.lng,
                '<strong>Your Current Location</strong><br>Collector Position',
                'collector'
            );
        }

        // Fit map to show all markers
        if (this.mapManager.markers.length > 0) {
            const group = new L.featureGroup(this.mapManager.markers);
            this.mapManager.map.fitBounds(group.getBounds().pad(0.1));
        }

        // Update route information
        this.updateRouteInfo();
    }

    updateRouteInfo() {
        const acceptedPickups = this.appState.pickups.filter(p => p.status === 'accepted' || p.status === 'inProgress');
        const todayPickups = acceptedPickups.filter(p => {
            const pickupDate = new Date(p.requested);
            const today = new Date();
            return pickupDate.toDateString() === today.toDateString();
        });

        this.updateElementText(this.elements.pickupsOnRoute, todayPickups.length.toString());
        this.updateElementText(this.elements.totalDistance, `${(todayPickups.length * 2.5).toFixed(1)} km`);
        this.updateElementText(this.elements.estimatedTime, `${(todayPickups.length * 15)} min`);
    }

    // Action Methods
    async acceptPickup(pickupId) {
        if (!confirm('Accept this pickup request?')) return;
        try {
            // Ensure availability before attempting accept
            await this.setCollectorAvailability(true);
            // Verify availability persisted before proceeding
            const availOk = await this.verifyAvailabilityWithBackoff();
            if (!availOk) {
                this.showToast('Could not set availability. Please try again or toggle Online status.', 'error');
                return;
            }
            await window.apiService.acceptPickup(pickupId);
            await this.loadPickups();
            this.loadSchedule();
            this.updateMapWithPickups();
            this.showToast('Pickup request accepted successfully! 🎉', 'success');
            // Auto-optimize route after acceptance
            if (typeof this.optimizeAndApplyRouteForToday === 'function') {
                await this.optimizeAndApplyRouteForToday();
            }
            this.loadSchedule();
            this.updateMapWithPickups();
            this.showToast('Route optimized for today. Ready to navigate! 🧭', 'info');
        } catch (e) {
            console.error('Accept failed', e);
            if (String(e?.message || '').toLowerCase().includes('available')) {
                this.showToast('You are marked unavailable. Switching you to available and retrying...', 'info');
                try {
                    await this.setCollectorAvailability(true);
                    const ok = await this.verifyAvailabilityWithBackoff();
                    if (!ok) throw new Error('Availability not set');
                    await window.apiService.acceptPickup(pickupId);
                    await this.loadPickups();
                    this.loadSchedule();
                    this.updateMapWithPickups();
                    if (typeof this.optimizeAndApplyRouteForToday === 'function') {
                        await this.optimizeAndApplyRouteForToday();
                    }
                    this.loadSchedule();
                    this.updateMapWithPickups();
                    this.showToast('Pickup accepted after enabling availability. ✅', 'success');
                    return;
                } catch (err) {
                    console.error('Retry accept failed', err);
                }
            }
            this.showToast('Failed to accept pickup', 'error');
        }
    }

    async ensureCollectorAvailable() {
        try {
            // If we already have it in state and true, do nothing
            if (this.appState.user?.isAvailable === true) return;
            // Try to read from profile
            const profRes = await window.apiService.request('/collectors/profile');
            const prof = profRes.data || {};
            const isAvail = !!prof.collector?.isAvailable;
            if (!isAvail) {
                await this.setCollectorAvailability(true);
                this.appState.user.isAvailable = true;
            }
        } catch (_) {
            // Best effort: try to set available
            try { await this.setCollectorAvailability(true); this.appState.user.isAvailable = true; } catch (_) {}
        }
    }

    async setCollectorAvailability(isAvailable) {
        try {
            // Use API service helper or pass proper options object
            let res;
            if (window.apiService.updateCollectorAvailability) {
                res = await window.apiService.updateCollectorAvailability(isAvailable);
            } else {
                res = await window.apiService.request('/collectors/availability', {
                    method: 'PATCH',
                    body: { isAvailable }
                });
            }
            const value = res?.data?.isAvailable;
            if (typeof value === 'boolean') this.appState.user.isAvailable = value;
        } catch (e) {
            console.error('Failed to update availability', e);
            throw e;
        }
    }

    async rejectPickup(pickupId) {
        if (!confirm('Reject this pickup request?')) return;
        const reason = prompt('Optional: reason for rejection', 'Out of range');
        // Collectors cannot cancel via API; show notice only
        this.showToast('Rejection noted. Collectors cannot cancel via API. Notify admin if needed.', 'warning');
        await this.loadPickups();
    }

    async completePickup(pickupId) {
        if (!confirm('Mark this pickup as completed?')) return;
        const sendComplete = async (coords) => {
            try {
                if (coords) {
                    await window.apiService.updatePickupLocation(pickupId, coords.latitude, coords.longitude);
                }
                const res = await window.apiService.completePickup(pickupId, 10, 'Completed by collector');
                await this.loadPickups();
                this.loadSchedule();
                this.updateMapWithPickups();
                // Refresh performance/stats from profile
                try {
                    const profRes = await window.apiService.request('/collectors/profile');
                    const prof = profRes.data || {};
                    const stats = prof.collector?.stats || {};
                    this.appState.user.performance = {
                        completionRate: stats?.completionRate || this.appState.user.performance.completionRate,
                        onTimeRate: stats?.onTimeRate || this.appState.user.performance.onTimeRate,
                        customerRating: stats?.averageRating || this.appState.user.performance.customerRating
                    };
                    this.appState.user.totalJobs = stats?.completedPickups ?? this.appState.user.totalJobs;
                    this.loadPerformanceData();
                    this.loadUserData();
                } catch (_) {}
                const points = res?.data?.pointsAwarded;
                this.showToast(points ? `Pickup completed! +${points} points awarded to resident ✅` : 'Pickup marked as completed! ✅', 'success');
            } catch (e) {
                console.error('Complete failed', e);
                this.showToast('Failed to complete pickup', 'error');
            }
        };
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => sendComplete(pos.coords),
                () => sendComplete(null),
                { enableHighAccuracy: true, timeout: 8000 }
            );
        } else {
            await sendComplete(null);
        }
    }

    viewPickupDetails(pickupId) {
        const pickup = this.appState.pickups.find(p => p.id === pickupId);
        
        if (pickup) {
            this.showPickupDetailsModal(pickup);
        }
    }

    showPickupDetailsModal(pickup) {
        this._lastFocus = document.activeElement;
        // Populate modal with pickup details
        const modalCustomerName = document.getElementById('modalCustomerName');
        const modalCustomerPhone = document.getElementById('modalCustomerPhone');
        const modalCustomerEmail = document.getElementById('modalCustomerEmail');
        const modalPickupAddress = document.getElementById('modalPickupAddress');
        const modalWasteType = document.getElementById('modalWasteType');
        const modalEstimatedWeight = document.getElementById('modalEstimatedWeight');
        const modalPreferredTime = document.getElementById('modalPreferredTime');
        const modalSpecialInstructions = document.getElementById('modalSpecialInstructions');

        if (modalCustomerName) modalCustomerName.textContent = pickup.customerName || 'Customer';
        if (modalCustomerPhone) modalCustomerPhone.textContent = pickup.phone || 'Not provided';
        if (modalCustomerEmail) modalCustomerEmail.textContent = pickup.email || 'Not provided';
        if (modalPickupAddress) modalPickupAddress.textContent = pickup.address;
        if (modalWasteType) modalWasteType.textContent = this.capitalizeFirstLetter(pickup.wasteType);
        if (modalEstimatedWeight) modalEstimatedWeight.textContent = pickup.estimatedWeight || 'Not specified';
        if (modalPreferredTime) modalPreferredTime.textContent = pickup.preferredTime || 'Flexible';
        if (modalSpecialInstructions) modalSpecialInstructions.textContent = pickup.specialInstructions || 'No special instructions';

        // Set up action buttons
        const acceptButton = document.getElementById('modalAcceptButton');
        const rejectButton = document.getElementById('modalRejectButton');

        if (acceptButton && rejectButton) {
            if (pickup.status === 'pending') {
                acceptButton.style.display = 'block';
                rejectButton.style.display = 'block';
                acceptButton.onclick = () => {
                    if (document.activeElement && typeof document.activeElement.blur === 'function') {
                        document.activeElement.blur();
                    }
                    this.acceptPickup(pickup.id);
                    const modal = bootstrap.Modal.getInstance(document.getElementById('pickupDetailsModal'));
                    if (modal) modal.hide();
                };
                rejectButton.onclick = () => {
                    if (document.activeElement && typeof document.activeElement.blur === 'function') {
                        document.activeElement.blur();
                    }
                    this.rejectPickup(pickup.id);
                    const modal = bootstrap.Modal.getInstance(document.getElementById('pickupDetailsModal'));
                    if (modal) modal.hide();
                };
            } else {
                acceptButton.style.display = 'none';
                rejectButton.style.display = 'none';
            }
        }

        // Initialize modal map
        this.initModalMap(pickup);

        // Show modal
        const modalElement = document.getElementById('pickupDetailsModal');
        if (modalElement) {
            const modal = new bootstrap.Modal(modalElement);
            modal.show();
        }
    }

    initModalMap(pickup) {
        const modalMapContainer = document.getElementById('modalPickupMap');
        if (!modalMapContainer) return;

        // Clear existing map
        this.cleanupModalMap();

        // Use pickup location or default to Nairobi
        const lat = pickup.location?.lat || -1.2921;
        const lng = pickup.location?.lng || 36.8219;

        try {
            // Initialize map
            this.modalMap = L.map('modalPickupMap').setView([lat, lng], 15);
            
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                maxZoom: 18
            }).addTo(this.modalMap);

            // Add marker for pickup location
            L.marker([lat, lng]).addTo(this.modalMap)
                .bindPopup(`
                    <strong>${this.capitalizeFirstLetter(pickup.wasteType)} Pickup</strong><br>
                    <strong>Customer:</strong> ${pickup.customerName || 'Customer'}<br>
                    <strong>Address:</strong> ${pickup.address}<br>
                    <strong>Status:</strong> ${this.capitalizeFirstLetter(pickup.status)}
                `)
                .openPopup();
        } catch (error) {
            console.error('Error initializing modal map:', error);
            modalMapContainer.innerHTML = '<div class="alert alert-warning">Unable to load map</div>';
        }
    }

    cleanupModalMap() {
        if (this.modalMap) {
            this.modalMap.remove();
            this.modalMap = null;
        }
    }

    // Navigation Methods
    startNavigation() {
        const modalElement = document.getElementById('navigationModal');
        if (modalElement) {
            this._lastFocus = document.activeElement;
            const modal = new bootstrap.Modal(modalElement);
            modal.show();
            const confirmButton = modalElement.querySelector('.btn-primary');
            if (confirmButton && typeof confirmButton.focus === 'function') {
                confirmButton.focus();
            }
        }
    }

    confirmNavigation() {
        const acceptedPickups = this.appState.pickups.filter(p => p.status === 'accepted' || p.status === 'inProgress');
        const todayPickups = acceptedPickups.filter(p => {
            const pickupDate = new Date(p.requested);
            const today = new Date();
            return pickupDate.toDateString() === today.toDateString();
        });

        if (todayPickups.length === 0) {
            this.showToast('No scheduled pickups for today.', 'warning');
            return;
        }

        this.showToast('Navigation started. Opening route planner...', 'info');
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('navigationModal'));
        if (modal) modal.hide();

        // Tip: Use Navigate on each task to open Google Maps for precise directions.
    }

    startNavigationToPickup(pickupId) {
        const pickup = this.appState.pickups.find(p => p.id === pickupId);
        if (!pickup) return;
        const { location, address } = pickup;
        let url = '';
        if (location?.lat && location?.lng) {
            url = `https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lng}`;
        } else if (address) {
            url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
        }
        if (url) {
            window.open(url, '_blank');
            this.showToast('Opening navigation...', 'info');
        }
    }

    async startPickup(pickupId) {
        // Mark arrival and send current GPS for geo-verification
        const proceed = async (coords) => {
            try {
                if (coords) {
                    await window.apiService.updatePickupLocation(pickupId, coords.latitude, coords.longitude);
                }
                await window.apiService.startPickup(pickupId, 10);
                await this.loadPickups();
                this.loadSchedule();
                this.updateMapWithPickups();
                this.showToast('Pickup started. Geo-location recorded.', 'success');
            } catch (e) {
                console.error('Start failed', e);
                this.showToast('Failed to start pickup', 'error');
            }
        };
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => proceed(pos.coords),
                () => proceed(null),
                { enableHighAccuracy: true, timeout: 8000 }
            );
        } else {
            await proceed(null);
        }
    }

    focusOnMap(pickupId) {
        const pickup = this.appState.pickups.find(p => p.id === pickupId);
        
        if (pickup && pickup.location && this.mapManager.map) {
            this.mapManager.map.setView([pickup.location.lat, pickup.location.lng], 16);
            
            // Open popup for the focused marker
            const marker = this.mapManager.markers.find(m => 
                m.getLatLng().lat === pickup.location.lat && 
                m.getLatLng().lng === pickup.location.lng
            );
            if (marker) {
                marker.openPopup();
            }
        }
    }

    toggleLiveLocation() {
        if (this.appState.liveLocationWatchId) {
            // Stop live location
            navigator.geolocation.clearWatch(this.appState.liveLocationWatchId);
            this.appState.liveLocationWatchId = null;
            this.appState.liveLocation = null;
            this.showToast('Live location tracking stopped', 'info');
        } else {
            // Start live location
            if (navigator.geolocation) {
                this.appState.liveLocationWatchId = navigator.geolocation.watchPosition(
                    (position) => {
                        this.appState.liveLocation = {
                            lat: position.coords.latitude,
                            lng: position.coords.longitude
                        };
                        this.updateMapWithPickups();
                    },
                    (error) => {
                        console.error('Error getting location:', error);
                        this.showToast('Unable to get live location', 'error');
                    },
                    {
                        enableHighAccuracy: true,
                        timeout: 5000,
                        maximumAge: 0
                    }
                );
                this.showToast('Live location tracking started', 'success');
            } else {
                this.showToast('Geolocation is not supported by this browser', 'error');
            }
        }
    }

    // ===== Auto location updates while on a job =====
    getActivePickupId() {
        const inProg = this.appState.pickups.find(p => p.status === 'inProgress');
        if (inProg) return inProg.id;
        const accepted = this.appState.pickups.find(p => p.status === 'accepted');
        return accepted ? accepted.id : null;
    }

    manageAutoLocationUpdates() {
        const activeId = this.getActivePickupId();
        if (activeId && !this._autoLocationInterval) {
            this.startAutoLocationUpdates();
        } else if (!activeId && this._autoLocationInterval) {
            this.stopAutoLocationUpdates();
        }
    }

    startAutoLocationUpdates() {
        if (this._autoLocationInterval) return;
        if (!navigator.geolocation) return;
        this._autoLocationInterval = setInterval(() => {
            const activeId = this.getActivePickupId();
            if (!activeId) {
                this.stopAutoLocationUpdates();
                return;
            }
            navigator.geolocation.getCurrentPosition(async (pos) => {
                try {
                    const { latitude, longitude } = pos.coords;
                    await window.apiService.updatePickupLocation(activeId, latitude, longitude);
                    // Update local marker and map
                    this.appState.liveLocation = { lat: latitude, lng: longitude };
                    this.updateMapWithPickups();
                } catch (_) {}
            }, () => {}, { enableHighAccuracy: true, timeout: 8000 });
        }, 15000);
    }

    stopAutoLocationUpdates() {
        if (this._autoLocationInterval) {
            clearInterval(this._autoLocationInterval);
            this._autoLocationInterval = null;
        }
    }

    // Filter Methods
    filterPickups(status) {
        this.appState.currentFilter = status;
        this.loadAllPickupsTable(this.appState.pickups);
        
        // Update button states
        document.querySelectorAll('#pickups-section .btn-group .btn').forEach(btn => {
            btn.classList.remove('btn-primary');
            btn.classList.add('btn-outline-primary');
        });
        
        const activeButton = document.querySelector(`#pickups-section .btn-group .btn[onclick*="${status}"]`);
        if (activeButton) {
            activeButton.classList.remove('btn-outline-primary');
            activeButton.classList.add('btn-primary');
        }
    }

    filterSchedule(period) {
        // Update button states
        document.querySelectorAll('#schedule-section .btn-group .btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const activeButton = document.querySelector(`#schedule-section .btn-group .btn[onclick*="${period}"]`);
        if (activeButton) {
            activeButton.classList.add('active');
        }

        // In a real app, this would filter the schedule based on the period
        this.showToast(`Showing schedule for ${period}`, 'info');
    }

    // UI Management
    showSection(sectionName) {
        // Hide all sections
        this.elements.dashboardSections.forEach(section => {
            section.style.display = 'none';
        });

        // Show selected section
        const targetSection = document.getElementById(`${sectionName}-section`);
        if (targetSection) {
            targetSection.style.display = 'block';
            this.appState.currentSection = sectionName;
        }

        // Update active nav button
        this.elements.navButtons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-section') === sectionName) {
                btn.classList.add('active');
            }
        });

        // Load section-specific data
        switch(sectionName) {
            case 'pickups':
                this.loadAllPickupsTable(this.appState.pickups);
                break;
            case 'schedule':
                this.loadSchedule();
                break;
            case 'performance':
                this.loadPerformanceData();
                break;
            case 'rewards':
                this.loadRewardsData();
                break;
            case 'map':
                this.updateMapWithPickups();
                // Fix Leaflet sizing when section becomes visible
                setTimeout(() => {
                    if (this.mapManager && this.mapManager.map) {
                        this.mapManager.map.invalidateSize();
                        if (this.mapManager.markers.length > 0) {
                            const group = new L.featureGroup(this.mapManager.markers);
                            this.mapManager.map.fitBounds(group.getBounds().pad(0.1));
                        } else if (this.mapManager.kenyaBounds) {
                            this.mapManager.map.fitBounds(this.mapManager.kenyaBounds, { padding: [20, 20] });
                        }
                    }
                }, 50);
                break;
            case 'profile':
                // Profile data is already loaded
                break;
        }
    }

    // Form Handlers
    handleProfileUpdate(e) {
        e.preventDefault();
        // In a real app, this would send the data to a server
        this.showToast('Profile updated successfully!', 'success');
    }

    handlePasswordChange(e) {
        e.preventDefault();
        // In a real app, this would validate and send to a server
        this.showToast('Password updated successfully!', 'success');
        e.target.reset();
    }

    // Utility Methods
    _getFocusable(modalEl) {
        return Array.from(modalEl.querySelectorAll('a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'))
            .filter(el => el.offsetParent !== null);
    }

    _focusTrapHandler(e) {
        if (e.key !== 'Tab') return;
        const modalEl = this._trapModalEl;
        if (!modalEl) return;
        const focusables = this._getFocusable(modalEl);
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey) {
            if (document.activeElement === first) {
                e.preventDefault();
                last.focus();
            }
        } else {
            if (document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        }
    }

    _enableFocusTrap(modalEl) {
        this._trapModalEl = modalEl;
        this._boundTrap = this._focusTrapHandler.bind(this);
        modalEl.addEventListener('keydown', this._boundTrap);
    }

    _disableFocusTrap(modalEl) {
        if (this._boundTrap) {
            modalEl.removeEventListener('keydown', this._boundTrap);
        }
        this._trapModalEl = null;
        this._boundTrap = null;
    }
    checkForNewPickups() {
        const previousCount = this.appState.pickups.filter(p => p.status === 'pending').length;
        this.loadPickups();
        const currentCount = this.appState.pickups.filter(p => p.status === 'pending').length;

        if (currentCount > previousCount) {
            const newCount = currentCount - previousCount;
            this.showToast(`You have ${newCount} new pickup request${newCount > 1 ? 's' : ''}! 🔔`, 'info');
        }
    }

    updateLiveData() {
        // Refresh data periodically
        this.loadPickups();
        if (this.appState.currentSection === 'schedule') {
            this.loadSchedule();
        }
        if (this.appState.currentSection === 'map') {
            this.updateMapWithPickups();
        }
        // Ensure auto location updates are aligned with current state
        this.manageAutoLocationUpdates();
    }

    updateEarningsAndPoints(amount) {
        this.appState.user.points += 50;
        this.appState.user.earnings.weekly += amount;
        this.appState.user.earnings.monthly += amount;
        this.appState.user.earnings.total += amount;
        this.appState.user.totalJobs += 1;
        
        this.updateRewardPoints();
        this.loadUserData();
    }

    updateRewardPoints() {
        this.updateElementText(this.elements.rewardPoints, this.appState.user.points.toString());
    }

    notifyResident(pickupId, status) {
        // In a real application, this would send a push notification to the resident
        console.log(`Notifying resident about pickup #${pickupId}: ${status}`);
        
        // Update resident's pickup status in localStorage
        const residentPickups = JSON.parse(localStorage.getItem('resident_pickups') || '[]');
        const residentPickup = residentPickups.find(p => p.id === pickupId);
        if (residentPickup) {
            residentPickup.status = status;
            if (status === 'accepted') {
                residentPickup.collectorName = this.appState.user.name;
                residentPickup.acceptedDate = new Date().toISOString();
            } else if (status === 'completed') {
                residentPickup.completedDate = new Date().toISOString();
            } else if (status === 'rejected') {
                residentPickup.cancelledDate = new Date().toISOString();
            }
            localStorage.setItem('resident_pickups', JSON.stringify(residentPickups));
        }
    }

    optimizeRoute() {
        this.showToast('Optimizing your route for maximum efficiency... 🔄', 'info');
        setTimeout(() => {
            this.showToast('Route optimized! You can save 15 minutes today. ✅', 'success');
        }, 2000);
    }

    startRoute() {
        this.startNavigation();
    }

    // Helper Methods
    updateElementText(element, text) {
        if (element) element.textContent = text;
    }

    updateNotificationBadge(count) {
        if (this.elements.pickupNotification) {
            if (count > 0) {
                this.elements.pickupNotification.textContent = count;
                this.elements.pickupNotification.style.display = 'flex';
            } else {
                this.elements.pickupNotification.style.display = 'none';
            }
        }
    }

    createEmptyState(icon, title, message) {
        return `
            <div class="empty-state">
                <i class="bi ${icon}"></i>
                <h5>${title}</h5>
                <p class="text-muted">${message}</p>
            </div>
        `;
    }

    capitalizeFirstLetter(string) {
        return string ? string.charAt(0).toUpperCase() + string.slice(1) : '';
    }

    formatDateTime(dateString) {
        const options = { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return new Date(dateString).toLocaleDateString('en-US', options);
    }

    formatTime(date) {
        return new Date(date).toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }

    formatRelativeTime(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays}d ago`;
        
        return this.formatDateTime(date);
    }

    showToast(message, type = 'info') {
        const toastContainer = this.elements.toastContainer;
        if (!toastContainer) return;

        const mapType = (t) => {
            if (t === 'error' || t === 'danger') return 'error';
            if (t === 'success') return 'success';
            if (t === 'warning') return 'warning';
            return 'info';
        };

        const t = mapType(type);

        const toastEl = document.createElement('div');
        toastEl.className = `toast smart-toast ${t}`;
        toastEl.setAttribute('role', 'alert');
        toastEl.setAttribute('aria-live', 'assertive');
        toastEl.setAttribute('aria-atomic', 'true');

        toastEl.innerHTML = `
          <div class="smart-toast-content">
            <div class="smart-toast-icon">${t === 'success' ? '✅' : t === 'error' ? '⚠️' : t === 'warning' ? '🛈' : 'ℹ️'}</div>
            <div class="smart-toast-text">${message}</div>
            <button type="button" class="btn-close ms-2" data-bs-dismiss="toast" aria-label="Close"></button>
          </div>
        `;

        toastContainer.appendChild(toastEl);
        const toast = new bootstrap.Toast(toastEl, { delay: 4000 });
        toast.show();
        toastEl.addEventListener('hidden.bs.toast', () => toastEl.remove());
    }
    

    calculatePickupEarnings(pickupId) {
        // Simple fixed earnings for demo
        return 35;
    }
}

// Supporting Classes
class StorageManager {
    constructor() {
        this.STORAGE_KEY = 'smartwaste_pickups';
    }

    getAllPickups() {
        try {
            const pickups = localStorage.getItem(this.STORAGE_KEY);
            return pickups ? JSON.parse(pickups) : this.getDefaultPickups();
        } catch (error) {
            console.error('Error reading pickups from storage:', error);
            return this.getDefaultPickups();
        }
    }

    getDefaultPickups() {
        // Return some sample pickups for demo
        return [
            {
                id: 1,
                customerName: "John Doe",
                phone: "(555) 123-4567",
                email: "john.doe@example.com",
                address: "123 Green Street, Eco City",
                wasteType: "plastic",
                estimatedWeight: "15 kg",
                preferredTime: "9:00 AM - 12:00 PM",
                specialInstructions: "Please ring the doorbell upon arrival",
                status: "pending",
                requested: new Date().toISOString(),
                points: 50,
                location: {
                    lat: -1.2921,
                    lng: 36.8219
                }
            },
            {
                id: 2,
                customerName: "Jane Smith",
                phone: "(555) 987-6543",
                email: "jane.smith@example.com",
                address: "456 Eco Avenue, Greenville",
                wasteType: "glass",
                estimatedWeight: "8 kg",
                preferredTime: "2:00 PM - 4:00 PM",
                specialInstructions: "Bins are in the backyard",
                status: "pending",
                requested: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                points: 30,
                location: {
                    lat: -1.3021,
                    lng: 36.8319
                }
            },
            {
                id: 3,
                customerName: "Bob Wilson",
                phone: "(555) 456-7890",
                email: "bob.wilson@example.com",
                address: "789 Recycling Road, Eco City",
                wasteType: "metal",
                estimatedWeight: "25 kg",
                preferredTime: "1:00 PM - 3:00 PM",
                specialInstructions: "Heavy items, please bring cart",
                status: "accepted",
                requested: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
                acceptedDate: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
                collectorId: 1,
                collectorName: "Michael Johnson",
                points: 75,
                location: {
                    lat: -1.2821,
                    lng: 36.8119
                }
            }
        ];
    }

    savePickups(pickups) {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(pickups));
            return true;
        } catch (error) {
            console.error('Error saving pickups to storage:', error);
            return false;
        }
    }

    getPickupsByStatus(status) {
        const pickups = this.getAllPickups();
        return pickups.filter(p => p.status === status);
    }

    updatePickupStatus(pickupId, status) {
        const pickups = this.getAllPickups();
        const pickup = pickups.find(p => p.id === pickupId);
        if (pickup) {
            pickup.status = status;
            if (status === 'completed') {
                pickup.completedDate = new Date().toISOString();
            }
            return this.savePickups(pickups);
        }
        return false;
    }
}

class MapManager {
    constructor() {
        this.map = null;
        this.markers = [];
    }

    initMap(containerId, lat, lng) {
        const container = document.getElementById(containerId);
        if (!container) return null;

        // Clear existing map
        if (this.map) {
            this.map.remove();
        }

        // Define Kenya bounding box
        const kenyaBounds = L.latLngBounds(
            L.latLng(-4.9, 33.9), // Southwest (approx)
            L.latLng(4.7, 41.9)   // Northeast (approx)
        );

        this.map = L.map(containerId, {
            worldCopyJump: false,
            maxBounds: kenyaBounds,
            maxBoundsViscosity: 1.0,
            zoomControl: true
        }).setView([lat, lng], 7);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 18,
            minZoom: 5
        }).addTo(this.map);

        // Ensure initial view is inside Kenya
        this.kenyaBounds = kenyaBounds;
        this.map.fitBounds(this.kenyaBounds, { padding: [20, 20] });

        return this.map;
    }

    addMarker(lat, lng, popupText, status = 'accepted') {
        if (!this.map) return;

        let iconColor, iconHtml;
        
        switch(status) {
            case 'accepted':
                iconColor = 'green';
                iconHtml = '<div style="background-color: green; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>';
                break;
            case 'pending':
                iconColor = 'orange';
                iconHtml = '<div style="background-color: orange; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>';
                break;
            case 'collector':
                iconColor = 'blue';
                iconHtml = '<div style="background-color: blue; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white;"></div>';
                break;
            default:
                iconColor = 'gray';
                iconHtml = '<div style="background-color: gray; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>';
        }

        const icon = L.divIcon({
            html: iconHtml,
            className: 'custom-marker',
            iconSize: status === 'collector' ? [20, 20] : [16, 16]
        });

        const marker = L.marker([lat, lng], { icon }).addTo(this.map)
            .bindPopup(popupText);

        this.markers.push(marker);
        return marker;
    }

    clearMarkers() {
        this.markers.forEach(marker => {
            this.map.removeLayer(marker);
        });
        this.markers = [];
    }
}

class ChartManager {
    initPerformanceChart(data = {}) {
        const ctx = document.getElementById('performanceChart');
        if (!ctx) return;

        // Destroy existing chart if it exists
        if (this.performanceChart) {
            this.performanceChart.destroy();
        }

        const labels = data.labels || [];
        const completionSeries = data.completionSeries || [];
        const onTimeSeries = data.onTimeSeries || [];

        this.performanceChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: 'Completion Rate',
                    data: completionSeries,
                    borderColor: '#22c55e',
                    backgroundColor: 'rgba(34, 197, 94, 0.15)',
                    tension: 0.4,
                    fill: true
                }, {
                    label: 'On-time Rate',
                    data: onTimeSeries,
                    borderColor: '#06b6d4',
                    backgroundColor: 'rgba(6, 182, 212, 0.15)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: '#F1F5F9'
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            color: '#94A3B8'
                        },
                        grid: {
                            color: 'rgba(148, 163, 184, 0.1)'
                        }
                    },
                    x: {
                        ticks: {
                            color: '#94A3B8'
                        },
                        grid: {
                            color: 'rgba(148, 163, 184, 0.1)'
                        }
                    }
                }
            }
        });
    }

    initEarningsChart(data = {}) {
        const ctx = document.getElementById('earningsChart');
        if (!ctx) return;

        // Destroy existing chart if it exists
        if (this.earningsChart) {
            this.earningsChart.destroy();
        }

        const labels = data.labels || [];
        const pointsSeries = data.pointsSeries || [];

        this.earningsChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'Points per completion',
                    data: pointsSeries,
                    backgroundColor: 'rgba(99, 102, 241, 0.7)',
                    borderColor: '#6366f1',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: '#F1F5F9'
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: '#94A3B8'
                        },
                        grid: {
                            color: 'rgba(148, 163, 184, 0.1)'
                        }
                    },
                    x: {
                        ticks: {
                            color: '#94A3B8'
                        },
                        grid: {
                            color: 'rgba(148, 163, 184, 0.1)'
                        }
                    }
                }
            }
        });
    }
}

class NotificationManager {
    create(title, message, type = 'info') {
        console.log(`Notification [${type}]: ${title} - ${message}`);
    }
}

// Global functions for HTML onclick handlers
function showSection(sectionName) {
    if (window.collectorDashboard) {
        window.collectorDashboard.showSection(sectionName);
    }
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        if (window.collectorDashboard) {
            window.collectorDashboard.showToast('You have been logged out successfully.', 'info');
        }
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1500);
    }
}

function acceptPickup(pickupId) {
    if (window.collectorDashboard) {
        window.collectorDashboard.acceptPickup(pickupId);
    }
}

function completePickup(pickupId) {
    if (window.collectorDashboard) {
        window.collectorDashboard.completePickup(pickupId);
    }
}

function rejectPickup(pickupId) {
    if (window.collectorDashboard) {
        window.collectorDashboard.rejectPickup(pickupId);
    }
}

function viewPickupDetails(pickupId) {
    if (window.collectorDashboard) {
        window.collectorDashboard.viewPickupDetails(pickupId);
    }
}

// Initialize the dashboard when the page loads
document.addEventListener('DOMContentLoaded', function() {
    window.collectorDashboard = new CollectorDashboard();
});