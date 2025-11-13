// public/js/realtime.js (Socket.IO client)
class RealTimeManager {
    constructor() {
        this.socket = null;
        this.isConnected = false;
    }

    connect() {
        try {
            if (!window.io) {
                // Socket.IO client not present; skip connecting silently
                return;
            }

            this.socket = window.io();

            this.socket.on('connect', () => {
                console.log('Socket.IO connected');
                this.isConnected = true;

                // Join user or collector rooms if we have user info available globally
                try {
                    const tokenUser = JSON.parse(localStorage.getItem('userData') || 'null');
                    const fallbackUser = window.userDashboard?.currentUser || null;
                    const user = tokenUser || fallbackUser;
                    if (user?._id) {
                        // Join appropriate room
                        if (user.role === 'collector') {
                            this.socket.emit('join_collector', user._id);
                        } else if (user.role === 'admin') {
                            this.socket.emit('join_admin', user._id);
                        } else {
                            this.socket.emit('join_user', user._id);
                        }
                    }
                } catch (_) {}
            });

            this.socket.on('disconnect', () => {
                console.log('Socket.IO disconnected');
                this.isConnected = false;
            });

            // Server-driven events
            this.socket.on('pickup_status_changed', (data) => this.handlePickupStatusChange(data));
            this.socket.on('collector_location', (data) => this.handleCollectorLocation(data));
            this.socket.on('new_pickup', (data) => this.handleNewPickup(data));
            this.socket.on('points_update', (data) => this.handlePointsAwarded(data));
            this.socket.on('notification', (data) => this.handleNotification(data));

        } catch (error) {
            console.error('Socket.IO connection failed:', error);
        }
    }

    handlePickupStatusChange(data) {
        const { pickupId, status, collector } = data;
        
        // Update local pickup state
        // Collector dashboard refresh
        if (window.collectorDashboard) {
            try {
                window.collectorDashboard.loadPickups();
                window.collectorDashboard.loadSchedule();
                window.collectorDashboard.updateMapWithPickups();
                window.collectorDashboard.showToast(`Pickup ${pickupId} updated: ${status}`, 'info');
            } catch (_) {}
        }

        // User dashboard tracking modal live update
        if (window.userDashboard && typeof window.userDashboard.onPickupStatusChange === 'function') {
            try { window.userDashboard.onPickupStatusChange(pickupId, status); } catch (_) {}
        }
    }

    handleCollectorLocation(data) {
        const { pickupId, latitude, longitude, lastUpdated } = data;
        
        // Update collector location on map
        if (window.smartWasteApp && window.smartWasteApp.pickupManager.map) {
            // Implementation depends on your map setup
            console.log('Collector location update:', data);
        }

        // User dashboard real-time tracking
        if (window.userDashboard && typeof window.userDashboard.onCollectorLocation === 'function') {
            try { window.userDashboard.onCollectorLocation(pickupId, latitude, longitude, lastUpdated || Date.now()); } catch (_) {}
        }
    }

    handleNewPickup(data) {
        if (window.collectorDashboard) {
            try {
                window.collectorDashboard.loadPickups();
                window.collectorDashboard.updateMapWithPickups();
                window.collectorDashboard.showToast('New pickup request available!', 'info');
            } catch (_) {}
        }
    }

    handlePointsAwarded(data) {
        const { points = 0, reason = '' } = data || {};
        if (window.userDashboard) {
            // Soft refresh user stats
            window.userDashboard.refreshData();
            window.userDashboard.showToast(`+${points} points awarded${reason ? ': ' + reason : ''}`, 'success');
        }
    }

    handleNotification(data) {
        const { title, message, type } = data;
        
        if (window.smartWasteApp.notificationManager) {
            window.smartWasteApp.notificationManager.showToast(message, type);
        }
    }

    // Join specific rooms
    joinUserRoom(userId) {
        this.send('join_user', { userId });
    }

    joinCollectorRoom(collectorId) {
        this.send('join_collector', { collectorId });
    }

    // Update location (for collectors)
    updateLocation(latitude, longitude) {
        this.send('location_update', { latitude, longitude });
    }
}

// Initialize real-time manager
window.realtimeManager = new RealTimeManager();

// Connect when page loads
document.addEventListener('DOMContentLoaded', function() {
    window.realtimeManager.connect();
});