// SmartWaste User Dashboard - Complete Implementation
console.log('Initializing SmartWaste User Dashboard...');

class UserDashboard {
    constructor() {
        this.currentUser = null;
        this.userStats = null;
        this.pickups = [];
        this.rewards = [];
        this.notifications = [];
        this.map = null;
        this.currentSection = 'dashboard';
        // Local copy of points system and urgency multipliers (kept in sync with backend defaults)
        this.pointsConfig = {
            plastic: { small: 30, medium: 45, large: 65 },
            glass: { small: 25, medium: 40, large: 60 },
            paper: { small: 20, medium: 30, large: 45 },
            metal: { small: 35, medium: 50, large: 70 },
            electronic: { small: 50, medium: 75, large: 100 },
            organic: { small: 15, medium: 25, large: 35 },
            general: { small: 10, medium: 15, large: 25 }
        };
        this.urgencyMultipliers = { low: 1.0, medium: 1.2, high: 1.5 };
        this.currentTrackingPickupId = null;
        
        this.init();
    }

    async init() {
        try {
            console.log('Starting dashboard initialization...');
            
            // Wait for API service to be available
            await this.waitForAPIService();
            
            // Check authentication
            await this.checkAuthentication();
            
            // Load initial data
            await this.loadInitialData();
            
            // Initialize UI
            this.initializeUI();
            
            // Hide loading and show content
            this.hideLoadingShowContent();
            
            console.log('Dashboard initialized successfully');
            
        } catch (error) {
            console.error('Dashboard initialization failed:', error);
            this.handleInitError(error);
        }
    }

    async waitForAPIService() {
        return new Promise((resolve) => {
            const checkAPIService = () => {
                if (window.apiService) {
                    console.log('APIService found, proceeding...');
                    resolve();
                } else {
                    console.log('Waiting for APIService...');
                    setTimeout(checkAPIService, 100);
                }
            };
            checkAPIService();
        });
    }

    async checkAuthentication() {
        try {
            const response = await window.apiService.getCurrentUser();
            this.currentUser = response.data;
            console.log('User authenticated:', this.currentUser);
        } catch (error) {
            console.error('Authentication failed:', error);
            if (error.message.includes('Authentication') || error.message.includes('401')) {
                localStorage.removeItem('authToken');
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = 'login.html';
            }
            throw error;
        }
    }

    async loadInitialData() {
        try {
            // Load user stats
            const statsResponse = await window.apiService.getUserPoints();
            this.userStats = statsResponse.data;
            
            // Load user pickups
            const pickupsResponse = await window.apiService.getUserPickups();
            this.pickups = pickupsResponse.data || [];
            
            // Load rewards
            const rewardsResponse = await window.apiService.getRewards();
            this.rewards = rewardsResponse.data || [];
            
            // Load notifications (mock for now)
            this.notifications = [
                {
                    id: '1',
                    type: 'info',
                    message: 'Welcome to SmartWaste!',
                    createdAt: new Date().toISOString()
                }
            ];
            
            console.log('Initial data loaded successfully');
            
        } catch (error) {
            console.error('Error loading initial data:', error);
            // Continue with empty data rather than failing completely
        }
    }

    initializeUI() {
        this.updateUserInfo();
        this.updateUserStats();
        this.loadRecentPickups();
        this.loadNotifications();
        this.loadRewards();
        this.populatePointsTable();
        this.updateEstimatedPoints();
        this.bindEvents();
    }

    updateUserInfo() {
        if (!this.currentUser) return;

        const userNameElements = document.querySelectorAll('#userName, #userNameDisplay, #welcomeName');
        userNameElements.forEach(element => {
            if (element) {
                element.textContent = this.currentUser.name || 'User';
            }
        });

        // Update profile form
        const profileNameInput = document.getElementById('profileNameInput');
        const profileEmailInput = document.getElementById('profileEmailInput');
        const profilePhone = document.getElementById('profilePhone');
        const profileAddress = document.getElementById('profileAddress');

        if (profileNameInput) profileNameInput.value = this.currentUser.name || '';
        if (profileEmailInput) profileEmailInput.value = this.currentUser.email || '';
        if (profilePhone) profilePhone.value = this.currentUser.phone || '';
        if (profileAddress) profileAddress.value = this.currentUser.address || '';
    }

    updateUserStats() {
        if (!this.userStats) return;

        // Update stats display
        const totalPickupsEl = document.getElementById('totalPickups');
        const userPointsEl = document.getElementById('userPoints');
        const wasteRecycledEl = document.getElementById('wasteRecycled');
        const userTierBadge = document.getElementById('userTier');
        const availablePointsEl = document.getElementById('availablePoints');

        if (totalPickupsEl) totalPickupsEl.textContent = this.userStats.totalPickups || 0;
        if (userPointsEl) userPointsEl.textContent = this.userStats.points || 0;
        if (availablePointsEl) availablePointsEl.textContent = this.userStats.points || 0;
        if (wasteRecycledEl) wasteRecycledEl.textContent = `${this.userStats.totalWasteRecycled || 0}kg`;
        if (userTierBadge) userTierBadge.textContent = `${(this.userStats.tier || 'bronze')[0].toUpperCase()}${(this.userStats.tier || 'bronze').slice(1)} Member`;

        // Update tier progress
        this.updateTierProgress();
    }

    updateTierProgress() {
        if (!this.userStats) return;

        const tierProgressBar = document.getElementById('tierProgressBar');
        if (tierProgressBar && this.userStats.tierInfo) {
            const { currentTier, requiredPoints = 0, pointsNeeded = 0 } = this.userStats.tierInfo;
            const current = this.userStats.points || 0;
            const base = currentTier === 'silver' ? 500 : currentTier === 'gold' ? 1500 : 0;
            const nextReq = requiredPoints || (currentTier === 'bronze' ? 500 : currentTier === 'silver' ? 1500 : current);
            const span = Math.max(nextReq - base, 1);
            const progress = Math.max(0, Math.min(100, Math.round(((current - base) / span) * 100)));
            tierProgressBar.style.width = `${progress}%`;
        }
    }

    // === Points estimation helpers ===
    computeEstimatedPoints(wasteType, wasteSize, urgency) {
        const base = this.pointsConfig?.[wasteType]?.[wasteSize];
        const mult = this.urgencyMultipliers?.[urgency || 'medium'];
        if (!base || !mult) return 0;
        return Math.round(base * mult);
    }

    updateEstimatedPoints() {
        const type = document.getElementById('wasteType')?.value || '';
        const size = document.getElementById('wasteSize')?.value || '';
        const urgency = document.getElementById('urgency')?.value || 'medium';
        const ptsEl = document.getElementById('estimatedPoints');
        if (!ptsEl) return;
        if (!type || !size) {
            ptsEl.textContent = `0 points`;
            return;
        }
        const pts = this.computeEstimatedPoints(type, size, urgency);
        ptsEl.textContent = `${pts} points`;
    }

    populatePointsTable() {
        const tableBody = document.getElementById('pointsTable');
        if (!tableBody) return;
        const types = ['plastic','glass','paper','metal','electronic','organic','general'];
        tableBody.innerHTML = types.map(t => `
            <tr>
                <td class="text-capitalize">${t}</td>
                <td>${this.pointsConfig[t].small}</td>
                <td>${this.pointsConfig[t].medium}</td>
                <td>${this.pointsConfig[t].large}</td>
            </tr>
        `).join('');
    }

    loadRecentPickups() {
        const container = document.getElementById('recentPickups');
        if (!container) return;

        if (this.pickups.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="bi bi-inbox"></i>
                    <h5>No Pickups Yet</h5>
                    <p class="text-muted">Your pickup history will appear here.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.pickups.slice(0, 5).map(pickup => `
            <div class="card pickup-card mb-3">
                <div class="card-body">
                <div class="d-flex justify-content-between align-items-start">
                        <div>
                            <h6 class="card-title">${this.capitalizeFirstLetter(pickup.wasteType)} Pickup</h6>
                            <p class="text-muted small mb-2">
                                <i class="bi bi-calendar me-1"></i>
                                ${this.formatDate(pickup.scheduledDate)}
                            </p>
                            <span class="badge bg-${this.getStatusColor(pickup.status)}">
                                ${this.capitalizeFirstLetter(pickup.status)}
                            </span>
                    </div>
                    <div class="text-end">
                            <div class="text-success fw-bold">+${pickup.pointsEarned || 0} pts</div>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    loadNotifications() {
        const container = document.getElementById('notificationsList');
        if (!container) return;

        if (this.notifications.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="bi bi-bell"></i>
                    <h5>No Notifications</h5>
                    <p class="text-muted">You're all caught up!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.notifications.map(notification => `
            <div class="notification-item d-flex align-items-start mb-3">
                <div class="notification-icon me-3">
                    <i class="bi bi-${this.getNotificationIcon(notification.type)} text-${notification.type}"></i>
                </div>
                <div class="flex-grow-1">
                    <p class="mb-1">${notification.message}</p>
                    <small class="text-muted">${this.formatRelativeTime(new Date(notification.createdAt))}</small>
                </div>
            </div>
        `).join('');
    }

    async loadRewards(filter = 'all') {
        const container = document.getElementById('rewardsList');
        if (!container) return;

        if (this.rewards.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="bi bi-gift"></i>
                    <h5>No Rewards Available</h5>
                    <p class="text-muted">Check back later for new rewards!</p>
                </div>
            `;
            return;
        }

        let list = this.rewards;
        if (filter !== 'all' && filter !== 'redeemed') {
            list = list.filter(r => (r.category || '').toLowerCase() === filter);
        }

        container.innerHTML = list.slice(0, 12).map(reward => `
            <div class="col-md-4 mb-3">
                <div class="card reward-card h-100">
                    <div class="card-body text-center">
                        <div class="reward-icon mb-3">
                            <i class="bi bi-gift text-primary" style="font-size: 2rem;"></i>
                    </div>
                        <h6 class="card-title">${reward.name}</h6>
                        <p class="text-muted small">${reward.description}</p>
                        <div class="d-flex justify-content-between align-items-center">
                            <span class="text-warning fw-bold">${reward.points} pts</span>
                            <button class="btn btn-primary btn-sm" onclick="userDashboard.redeemReward('${reward._id || reward.id}')">
                                Redeem
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        const totalRewardsEl = document.getElementById('totalRewards');
        if (totalRewardsEl) totalRewardsEl.textContent = `${this.rewards.length}`;

        // If redeemed tab selected, load redemption history
        const redeemedSection = document.getElementById('redeemedSection');
        if (filter === 'redeemed' && redeemedSection) {
            redeemedSection.style.display = 'block';
            try {
                const history = await window.apiService.getRedemptionHistory(20);
                const listEl = document.getElementById('redeemedRewardsList');
                listEl.innerHTML = (history.data || []).map(item => `
                    <div class="col-md-4 mb-3">
                        <div class="card redeemed-reward-card h-100">
                            <div class="card-body">
                                <div class="d-flex justify-content-between"><h6 class="reward-title">${item.rewardId?.name || ''}</h6>
                                <span class="badge ${item.status === 'processed' ? 'bg-success' : 'bg-secondary'}">${item.status}</span></div>
                                <p class="text-muted small mb-2">${item.rewardId?.description || ''}</p>
                                <div class="d-flex justify-content-between align-items-center">
                                    <span class="text-warning fw-bold">-${item.points} pts</span>
                                    ${item.redemptionCode ? `<span class="badge bg-info">Code: ${item.redemptionCode}</span>` : ''}
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('');
                const redeemedCount = document.getElementById('redeemedRewards');
                if (redeemedCount) redeemedCount.textContent = `${(history.data || []).length}`;
            } catch (e) {
                console.warn('Failed to load redemption history', e);
            }
        } else if (redeemedSection) {
            redeemedSection.style.display = 'none';
        }
    }

    bindEvents() {
        // Navigation buttons
        const navButtons = document.querySelectorAll('.nav-btn');
        navButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const section = btn.getAttribute('data-section');
                this.showSection(section);
            });
        });

        // Logout button
        const logoutBtn = document.getElementById('logoutButton');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (typeof logout === 'function') logout();
            });
        }

        // Form submissions
        const pickupForm = document.getElementById('pickupForm');
        if (pickupForm) {
            pickupForm.addEventListener('submit', (e) => this.handlePickupSubmission(e));
        }

        const profileForm = document.getElementById('profileForm');
        if (profileForm) {
            // Ensure inputs have name attributes for FormData
            document.getElementById('profileNameInput')?.setAttribute('name', 'name');
            document.getElementById('profileEmailInput')?.setAttribute('name', 'email');
            document.getElementById('profilePhone')?.setAttribute('name', 'phone');
            document.getElementById('profileAddress')?.setAttribute('name', 'address');
            profileForm.addEventListener('submit', (e) => this.handleProfileUpdate(e));
        }

        const passwordForm = document.getElementById('passwordForm');
        if (passwordForm) {
            passwordForm.addEventListener('submit', (e) => this.handlePasswordChange(e));
        }

        // Rewards filters
        document.querySelectorAll('.reward-filter .filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.reward-filter .filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const filter = btn.getAttribute('data-filter');
                this.loadRewards(filter);
            });
        });

        // Geolocation and map controls
        this.initMap();
        const locateBtn = document.getElementById('locateMeButton');
        if (locateBtn) locateBtn.addEventListener('click', (e) => { e.preventDefault(); this.locateMe(); });

        // Periodic refresh to reflect points/status changes
        setInterval(() => this.refreshData(), 20000);

        // Estimated points auto-update on form changes
        ['wasteType','wasteSize','urgency'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('change', () => this.updateEstimatedPoints());
        });
    }

    showSection(sectionName) {
        // Hide all sections
        const sections = document.querySelectorAll('.dashboard-section');
        sections.forEach(section => {
            section.style.display = 'none';
        });

        // Show selected section
        const targetSection = document.getElementById(`${sectionName}-section`);
        if (targetSection) {
            targetSection.style.display = 'block';
            this.currentSection = sectionName;
        }

        // Update active nav button
        const navButtons = document.querySelectorAll('.nav-btn');
        navButtons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-section') === sectionName) {
                btn.classList.add('active');
            }
        });

        // Load section-specific data
        switch(sectionName) {
            case 'history':
                this.loadPickupHistory();
                break;
            case 'rewards':
                this.loadRewards();
                break;
            case 'pickup':
                this.initMap();
                break;
            case 'profile':
                this.loadProfileData();
                break;
        }
    }

    async handlePickupSubmission(e) {
        e.preventDefault();
        
        try {
            // Read values by IDs to avoid missing name attributes
            const wasteType = document.getElementById('wasteType')?.value;
            const wasteSize = document.getElementById('wasteSize')?.value;
            const address = document.getElementById('address')?.value;
            const latitude = parseFloat(document.getElementById('latitude')?.value);
            const longitude = parseFloat(document.getElementById('longitude')?.value);
            const description = document.getElementById('description')?.value || '';
            const scheduledDate = document.getElementById('scheduledDate')?.value;
            const urgency = document.getElementById('urgency')?.value || 'medium';

            // Build photos array (base64 URLs)
            const files = document.getElementById('wastePhotos')?.files || [];
            const photos = await this.readFilesAsDataUrls(files, 3);

            const pickupData = {
                wasteType,
                wasteSize,
                description,
                location: { lat: latitude, lng: longitude, address, instructions: '' },
                scheduledDate,
                urgency,
                photos: photos.map(url => ({ url }))
            };

            this.showLoading('Scheduling pickup...');
            
            const response = await window.apiService.createPickup(pickupData);
            
            if (response.success) {
                this.showToast('Pickup scheduled successfully! 🎉', 'success');
                const pickupId = response.data?.pickup?._id || response.data?.id;
                // Use backend-calculated estimated points in confirmation
                pickupData.estimatedPoints = response.data?.estimatedPoints || pickupData.estimatedPoints || 0;
                this.showPickupConfirmation(pickupData, pickupId);
                e.target.reset();
                await this.refreshData();
            } else {
                throw new Error(response.message || 'Failed to schedule pickup');
            }
            
        } catch (error) {
            console.error('Error scheduling pickup:', error);
            this.showToast('Failed to schedule pickup. Please try again.', 'error');
        } finally {
            this.hideLoading();
        }
    }

    async handleProfileUpdate(e) {
        e.preventDefault();
        
        try {
            const formData = new FormData(e.target);
            const profileData = {
                name: formData.get('name'),
                email: formData.get('email'),
                phone: formData.get('phone'),
                address: formData.get('address')
            };

            this.showLoading('Updating profile...');
            
            const response = await window.apiService.updateProfile(profileData);
            
            if (response.success) {
                this.showToast('Profile updated successfully!', 'success');
                this.currentUser = { ...this.currentUser, ...profileData };
                this.updateUserInfo();
            } else {
                throw new Error(response.message || 'Failed to update profile');
            }

        } catch (error) {
            console.error('Error updating profile:', error);
            this.showToast('Failed to update profile. Please try again.', 'error');
        } finally {
            this.hideLoading();
        }
    }

    async handlePasswordChange(e) {
        e.preventDefault();
        
        try {
            const formData = new FormData(e.target);
            const passwordData = {
                currentPassword: formData.get('currentPassword'),
                newPassword: formData.get('newPassword'),
                confirmPassword: formData.get('confirmPassword')
            };

            if (passwordData.newPassword !== passwordData.confirmPassword) {
                this.showToast('New passwords do not match.', 'error');
                return;
            }

            this.showLoading('Updating password...');
            
            const response = await window.apiService.updateProfile({ password: passwordData.newPassword });
            
            if (response.success) {
                this.showToast('Password updated successfully!', 'success');
                e.target.reset();
            } else {
                throw new Error(response.message || 'Failed to update password');
            }
            
        } catch (error) {
            console.error('Error updating password:', error);
            this.showToast('Failed to update password. Please try again.', 'error');
        } finally {
            this.hideLoading();
        }
    }

    async redeemReward(rewardId) {
        try {
            this.showLoading('Redeeming reward...');
            
            const response = await window.apiService.redeemReward(rewardId);
            
            if (response.success) {
                this.showToast('Reward redeemed successfully! 🎉', 'success');
            this.loadUserStats();
                this.loadRewards();
            } else {
                throw new Error(response.message || 'Failed to redeem reward');
            }
            
        } catch (error) {
            console.error('Error redeeming reward:', error);
            this.showToast('Failed to redeem reward. Please try again.', 'error');
        } finally {
            this.hideLoading();
        }
    }

    showPickupConfirmation(pickupData, pickupId) {
        // Update confirmation modal content
        const confirmationModal = document.getElementById('pickupConfirmationModal');
        if (confirmationModal) {
            document.getElementById('confirmationWasteType').textContent = this.capitalizeFirstLetter(pickupData.wasteType);
            document.getElementById('confirmationDate').textContent = new Date(pickupData.scheduledDate).toLocaleString();
            document.getElementById('confirmationPoints').textContent = `${pickupData.estimatedPoints || 0} points`;
            document.getElementById('confirmationId').textContent = `#${pickupId || 'P' + Date.now()}`;

            // Show modal
            const modal = new bootstrap.Modal(confirmationModal);
            modal.show();

            // On Track button, navigate user to History where tracking/actions live
            confirmationModal.querySelector('.btn.btn-primary').onclick = () => {
                modal.hide();
                this.showSection('history');
            };
        }
    }

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

    showCollectorAssigned(collectorData, pickupId) {
        const collectorModal = document.getElementById('collectorAssignedModal');
        if (collectorModal) {
        document.getElementById('collectorModalName').textContent = collectorData.name;
        document.getElementById('collectorModalVehicle').textContent = collectorData.vehicle;
        document.getElementById('collectorModalPhone').textContent = collectorData.phone;
        document.getElementById('collectorModalRating').textContent = `⭐ ${collectorData.rating}`;
        document.getElementById('collectorModalETA').textContent = collectorData.eta;
        
            const modal = new bootstrap.Modal(collectorModal);
        modal.show();
        
        // Start tracking automatically
        this.startPickupTracking(pickupId);
        }
    }

    async startPickupTracking(pickupId) {
        try {
            // Fetch details
            const res = await window.apiService.getPickupDetails(pickupId);
            const pickup = res?.data;
            if (!pickup) {
                this.showToast('Unable to load pickup details.', 'error');
                return;
            }

            // Render modal contents
            this.renderTrackingModal(pickup);

            // Show modal
            const modalEl = document.getElementById('pickupTrackingModal');
            if (!modalEl) return;
            const modal = new bootstrap.Modal(modalEl);
            modal.show();

            // Record active tracking id
            this.currentTrackingPickupId = pickupId;

            // Setup polling every 10s (fallback if no realtime)
            if (this._trackingInterval) clearInterval(this._trackingInterval);
            this._trackingInterval = setInterval(async () => {
                try {
                    const upd = await window.apiService.getPickupDetails(pickupId);
                    if (upd?.data) this.renderTrackingModal(upd.data);
                } catch (_) {}
            }, 10000);

            // Clear on hide
            modalEl.addEventListener('hidden.bs.modal', () => {
                if (this._trackingInterval) {
                    clearInterval(this._trackingInterval);
                    this._trackingInterval = null;
                }
                this.currentTrackingPickupId = null;
            }, { once: true });

        } catch (e) {
            this.showToast('Tracking unavailable right now.', 'error');
        }
    }

    renderTrackingModal(pickup) {
        // Status timeline
        const timeline = document.getElementById('trackingTimeline');
        if (timeline) {
            const steps = [
                { key: 'requested', label: 'Requested', ts: pickup?.tracking?.requested },
                { key: 'accepted', label: 'Accepted', ts: pickup?.tracking?.accepted },
                { key: 'inProgress', label: 'In Progress', ts: pickup?.tracking?.inProgress },
                { key: 'completed', label: 'Completed', ts: pickup?.tracking?.completed }
            ];
            timeline.innerHTML = steps.map(s => `
                <div class="tracking-step ${s.ts ? 'completed' : (pickup.status === s.key ? 'active' : 'pending')}">
                    <div class="d-flex justify-content-between">
                        <span>${s.label}</span>
                        <small class="text-muted">${s.ts ? new Date(s.ts).toLocaleString() : ''}</small>
                    </div>
                </div>
            `).join('');
        }

        // Collector info
        const showCollector = !!pickup?.collectorId;
        const collectorInfo = document.getElementById('collectorInfo');
        if (collectorInfo) collectorInfo.style.display = showCollector ? 'block' : 'none';
        if (showCollector) {
            document.getElementById('collectorName') && (document.getElementById('collectorName').textContent = pickup.collectorId.name || '-');
            document.getElementById('collectorPhone') && (document.getElementById('collectorPhone').textContent = pickup.collectorId.phone || '-');
            document.getElementById('collectorVehicle') && (document.getElementById('collectorVehicle').textContent = pickup.collectorId.collectorData?.vehicle || '-');
        }

        // Map stats (simple placeholders using latest coords)
        const [lng, lat] = pickup.location?.coordinates || [null, null];
        const userLatLng = { lat, lng };
        const collectorLoc = pickup.collectorId?.collectorData?.currentLocation || null;
        const distanceEl = document.getElementById('distance');
        if (distanceEl && userLatLng.lat != null && collectorLoc?.lat != null) {
            const d = this.haversineKm(userLatLng.lat, userLatLng.lng, collectorLoc.lat, collectorLoc.lng);
            distanceEl.textContent = `${d.toFixed(1)} km`;
        }
        const lastUpd = document.getElementById('lastUpdate');
        if (lastUpd && collectorLoc?.lastUpdated) {
            lastUpd.textContent = this.formatRelativeTime(new Date(collectorLoc.lastUpdated));
        }

        // ETA (very rough: 30 km/h)
        const etaEl = document.getElementById('etaTime');
        if (etaEl && distanceEl && distanceEl.textContent.includes('km')) {
            const km = parseFloat(distanceEl.textContent);
            const hours = km / 30;
            const minutes = Math.max(1, Math.round(hours * 60));
            etaEl.textContent = `${minutes} min`;
        }

        // Waste details
        const wasteDetails = document.getElementById('wasteDetails');
        if (wasteDetails) {
            wasteDetails.innerHTML = `
                <div class="bg-dark-lighter rounded-3 p-3">
                    <div class="row">
                        <div class="col-md-6">
                            <small class="text-muted">Waste Type</small>
                            <div class="fw-bold">${this.capitalizeFirstLetter(pickup.wasteType || '-')}</div>
                        </div>
                        <div class="col-md-6">
                            <small class="text-muted">Scheduled</small>
                            <div class="fw-bold">${this.formatDate(pickup.scheduledDate)}</div>
                        </div>
                    </div>
                    <div class="row mt-2">
                        <div class="col-md-6">
                            <small class="text-muted">Urgency</small>
                            <div class="fw-bold text-capitalize">${pickup.urgency || '-'}</div>
                        </div>
                        <div class="col-md-6">
                            <small class="text-muted">Address</small>
                            <div class="fw-bold">${pickup.location?.address || '-'}</div>
                        </div>
                    </div>
                </div>`;
        }
    }

    // Realtime hooks
    async onCollectorLocation(pickupId, latitude, longitude, lastUpdated) {
        if (!this.currentTrackingPickupId || this.currentTrackingPickupId !== pickupId) return;
        try {
            const upd = await window.apiService.getPickupDetails(pickupId);
            if (upd?.data) this.renderTrackingModal(upd.data);
        } catch (_) {}
    }

    async onPickupStatusChange(pickupId, status) {
        if (!this.currentTrackingPickupId || this.currentTrackingPickupId !== pickupId) return;
        try {
            const upd = await window.apiService.getPickupDetails(pickupId);
            if (upd?.data) this.renderTrackingModal(upd.data);
        } catch (_) {}
    }

    haversineKm(lat1, lon1, lat2, lon2) {
        const R = 6371;
        const toRad = (v) => v * Math.PI / 180;
        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon2 - lon1);
        const a = Math.sin(dLat/2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2) ** 2;
        return 2 * R * Math.asin(Math.sqrt(a));
    }

    loadPickupHistory() {
        const container = document.getElementById('historyContent');
        if (!container) return;

        if (this.pickups.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="bi bi-inbox"></i>
                    <h5>No Pickup History</h5>
                    <p class="text-muted">Your completed pickups will appear here.</p>
            </div>
        `;
            return;
        }

        container.innerHTML = this.pickups.map(pickup => `
            <div class="card pickup-card mb-3">
                <div class="card-body">
                    <div class="row align-items-center">
                        <div class="col-md-8">
                            <h6 class="card-title">${this.capitalizeFirstLetter(pickup.wasteType)} Pickup</h6>
                            <p class="text-muted small mb-2">
                                <i class="bi bi-calendar me-1"></i>
                                ${this.formatDate(pickup.scheduledDate)}
                            </p>
                            <span class="badge bg-${this.getStatusColor(pickup.status)}">
                                ${this.capitalizeFirstLetter(pickup.status)}
                            </span>
                        </div>
                        <div class="col-md-4 text-end">
                            <div class="text-success fw-bold mb-2">+${pickup.actualPoints || (pickup.status === 'completed' ? pickup.estimatedPoints : 0) || 0} pts</div>
                            ${this.renderPickupActions(pickup)}
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderPickupActions(pickup) {
        const id = pickup._id || pickup.id;
        const hasCollector = !!pickup.collectorId;
        const callDisabled = !hasCollector ? 'disabled' : '';
        if (pickup.status === 'pending') {
            return `<button class="btn btn-outline-secondary btn-sm" onclick="userDashboard.cancelPickup('${id}')"><i class="bi bi-x-circle me-1"></i>Cancel</button>`;
        }
        if (pickup.status === 'accepted' || pickup.status === 'inProgress') {
            return `
                <div class="btn-group">
                    <button class="btn btn-primary btn-sm" onclick="userDashboard.startPickupTracking('${id}')"><i class="bi bi-geo-alt me-1"></i>Track</button>
                    <button class="btn btn-outline-info btn-sm" ${callDisabled} onclick="userDashboard.contactCollector('${id}')"><i class="bi bi-telephone me-1"></i>Call</button>
                </div>`;
        }
        return '';
    }

    async cancelPickup(pickupId) {
        try {
            await window.apiService.cancelPickup(pickupId, 'User requested cancellation');
            this.showToast('Pickup cancelled.', 'success');
            await this.refreshData();
        } catch (e) {
            this.showToast(e.message || 'Failed to cancel pickup', 'error');
        }
    }

    async contactCollector(pickupId) {
        try {
            const details = await window.apiService.getPickupDetails(pickupId);
            const phone = details?.data?.collectorId?.phone;
            if (phone) {
                window.location.href = `tel:${phone}`;
            } else {
                this.showToast('Collector contact not available yet.', 'warning');
            }
        } catch (e) {
            this.showToast('Unable to fetch collector contact.', 'error');
        }
    }

    async refreshData() {
        try {
            const [statsResponse, pickupsResponse, rewardsResponse] = await Promise.all([
                window.apiService.getUserPoints(),
                window.apiService.getUserPickups(),
                window.apiService.getRewards()
            ]);
            this.userStats = statsResponse.data;
            this.pickups = pickupsResponse.data || [];
            this.rewards = rewardsResponse.data || [];
            this.updateUserStats();
            this.loadRecentPickups();
            if (this.currentSection === 'history') this.loadPickupHistory();
            if (this.currentSection === 'rewards') this.loadRewards();
        } catch (e) {
            console.warn('Refresh data failed', e);
        }
    }

    async readFilesAsDataUrls(fileList, max = 3) {
        const files = Array.from(fileList).slice(0, max);
        const readers = files.map(file => new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(file);
        }));
        const results = await Promise.all(readers);
        return results.filter(Boolean);
    }

    initMap() {
        const mapEl = document.getElementById('pickupMap');
        if (!mapEl) return;

        const latInput = document.getElementById('latitude');
        const lngInput = document.getElementById('longitude');
        const addressInput = document.getElementById('address');

        const defaultLat = parseFloat(latInput?.value) || -1.2921;
        const defaultLng = parseFloat(lngInput?.value) || 36.8219;

        if (!this.map) {
            this.map = L.map('pickupMap').setView([defaultLat, defaultLng], 13);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19
            }).addTo(this.map);
            this.marker = L.marker([defaultLat, defaultLng], { draggable: true }).addTo(this.map);
            this.marker.on('dragend', () => {
                const { lat, lng } = this.marker.getLatLng();
                if (latInput) latInput.value = lat.toFixed(6);
                if (lngInput) lngInput.value = lng.toFixed(6);
            });
        } else {
            this.map.setView([defaultLat, defaultLng], 13);
            if (this.marker) this.marker.setLatLng([defaultLat, defaultLng]);
        }

        // Ensure inputs reflect current marker
        if (latInput && !latInput.value) latInput.value = defaultLat;
        if (lngInput && !lngInput.value) lngInput.value = defaultLng;
        if (addressInput && !addressInput.value) addressInput.value = 'Nairobi, Kenya';
    }

    locateMe() {
        if (!navigator.geolocation) {
            this.showToast('Geolocation is not supported by your browser.', 'warning');
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                const latInput = document.getElementById('latitude');
                const lngInput = document.getElementById('longitude');
                if (latInput) latInput.value = latitude.toFixed(6);
                if (lngInput) lngInput.value = longitude.toFixed(6);
                this.initMap();
                if (this.map && this.marker) {
                    this.map.setView([latitude, longitude], 15);
                    this.marker.setLatLng([latitude, longitude]);
                }
                this.showToast('Location set from GPS.', 'success');
            },
            () => this.showToast('Unable to retrieve your location.', 'warning'),
            { enableHighAccuracy: true, timeout: 10000 }
        );
    }

    loadProfileData() {
        // Profile data is already loaded in updateUserInfo()
        console.log('Profile data loaded');
    }

    // Utility methods
    capitalizeFirstLetter(string) {
        return string ? string.charAt(0).toUpperCase() + string.slice(1) : '';
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
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays}d ago`;
        
        return this.formatDate(date);
    }

    getStatusColor(status) {
        const colors = {
            pending: 'warning',
            accepted: 'info',
            completed: 'success',
            cancelled: 'danger',
            inProgress: 'primary'
        };
        return colors[status] || 'secondary';
    }

    getNotificationIcon(type) {
        const icons = {
            info: 'info-circle',
            success: 'check-circle',
            warning: 'exclamation-triangle',
            error: 'x-circle'
        };
        return icons[type] || 'bell';
    }

    showLoading(message = 'Loading...') {
        const loadingEl = document.getElementById('loadingOverlay');
        if (loadingEl) {
            loadingEl.querySelector('.loading-message').textContent = message;
            loadingEl.style.display = 'flex';
        }
    }

    hideLoading() {
        const loadingEl = document.getElementById('loadingOverlay');
        if (loadingEl) {
            loadingEl.style.display = 'none';
        }
    }

    hideLoadingShowContent() {
        const loadingSpinner = document.getElementById('loadingSpinner');
        const mainContent = document.getElementById('mainContent');

        if (loadingSpinner) loadingSpinner.style.display = 'none';
        if (mainContent) mainContent.style.display = 'block';
    }

    showToast(message, type = 'info') {
        const toastContainer = document.getElementById('toastContainer');
        if (!toastContainer) return;

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
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;

        toastContainer.appendChild(toastEl);
        const toast = new bootstrap.Toast(toastEl, { delay: 5000 });
        toast.show();

        toastEl.addEventListener('hidden.bs.toast', () => {
            toastEl.remove();
        });
    }

    showError(message) {
        this.showToast(message, 'error');
    }

    handleInitError(error) {
        this.showToast('Failed to load dashboard. Please refresh the page.', 'error');
        
        const loadingSpinner = document.getElementById('loadingSpinner');
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
}

// Global functions for HTML onclick handlers
function showSection(sectionName) {
    if (window.userDashboard) {
        window.userDashboard.showSection(sectionName);
    }
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('userData');
        window.location.href = 'login.html';
    }
}

// Initialize the dashboard when the page loads
document.addEventListener('DOMContentLoaded', function() {
    window.userDashboard = new UserDashboard();
});
