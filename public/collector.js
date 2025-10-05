// Collector Dashboard functionality
class CollectorDashboard {
    constructor() {
        this.pendingPickups = [];
        this.init();
    }

    async init() {
        await this.checkAuth();
        this.loadCollectorData();
        this.loadPendingPickups();
        this.setupEventListeners();
    }

    async checkAuth() {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        
        if (!token || !userData) {
            window.location.href = '/';
            return;
        }
        
        try {
            const user = JSON.parse(userData);
            if (user.role !== 'collector') {
                showAlert('Access denied. Collector role required.', 'danger');
                setTimeout(() => window.location.href = '/', 2000);
                return;
            }
            
            document.getElementById('collectorName').textContent = user.name;
        } catch (error) {
            this.handleError('Authentication error');
        }
    }

    async loadPendingPickups() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/collector/pickups', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = await response.json();
            
            if (response.ok && data.success) {
                this.pendingPickups = data.data;
                this.displayPendingPickups();
                this.updateStats();
            }
        } catch (error) {
            this.handleError('Error loading pickups');
        }
    }

    displayPendingPickups() {
        const container = document.getElementById('pendingPickupsList');
        
        if (this.pendingPickups.length === 0) {
            container.innerHTML = '<p class="text-center text-muted">No pending pickups available.</p>';
            return;
        }

        container.innerHTML = this.pendingPickups.map(pickup => `
            <div class="card mb-3">
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-8">
                            <h6 class="card-title">${pickup.wasteType} Waste</h6>
                            <p class="card-text"><strong>Customer:</strong> ${pickup.user.name}</p>
                            <p class="card-text"><strong>Address:</strong> ${pickup.location.address}</p>
                            <p class="card-text"><strong>Scheduled:</strong> ${new Date(pickup.scheduledDate).toLocaleString()}</p>
                            ${pickup.description ? `<p class="card-text"><strong>Notes:</strong> ${pickup.description}</p>` : ''}
                        </div>
                        <div class="col-md-4 text-end">
                            <div class="btn-group-vertical w-100">
                                <button class="btn btn-success btn-sm" onclick="collectorAcceptPickup('${pickup._id}')">
                                    <i class="bi bi-check-circle me-1"></i>Accept
                                </button>
                                <button class="btn btn-outline-secondary btn-sm mt-1" onclick="viewPickupDetails('${pickup._id}')">
                                    <i class="bi bi-info-circle me-1"></i>Details
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    updateStats() {
        document.getElementById('pendingCount').textContent = this.pendingPickups.length;
        // You can add more stat calculations here
    }

    handleError(message) {
        console.error(message);
        showAlert(message, 'danger');
    }
}

// Global functions for button clicks
async function collectorAcceptPickup(pickupId) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/collector/pickup/${pickupId}/accept`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await response.json();
        
        if (response.ok && data.success) {
            showAlert('Pickup accepted successfully!', 'success');
            // Reload the list
            collectorDashboard.loadPendingPickups();
        } else {
            showAlert(data.message || 'Error accepting pickup', 'danger');
        }
    } catch (error) {
        showAlert('Network error', 'danger');
    }
}

function loadPendingPickups() {
    collectorDashboard.loadPendingPickups();
}

function showTodaySchedule() {
    showAlert('Today\'s schedule feature coming soon!', 'info');
}

function showPerformance() {
    showAlert('Performance analytics coming soon!', 'info');
}

// Initialize when page loads
let collectorDashboard;
document.addEventListener('DOMContentLoaded', () => {
    collectorDashboard = new CollectorDashboard();
});