const socketIo = require('socket.io');

const registry = require('./socketRegistry');

const initializeSocket = (server) => {
    const io = socketIo(server, {
        cors: {
            origin: process.env.CLIENT_URL || "http://localhost:3000",
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    // Store connected users and their socket IDs
    const connectedUsers = new Map(); // userId -> socketId
    const socketUsers = new Map(); // socketId -> userId

    // Expose io via registry for use in routes
    try { registry.setIo(io); } catch (_) {}

    io.on('connection', (socket) => {
        console.log('User connected:', socket.id);

        // User joins their personal room
        socket.on('join_user', (userId) => {
            if (userId) {
                socket.join(`user_${userId}`);
                connectedUsers.set(userId, socket.id);
                socketUsers.set(socket.id, userId);
                console.log(`User ${userId} joined room user_${userId}`);
            }
        });

        // Collector joins their personal room and collector room
        socket.on('join_collector', (collectorId) => {
            if (collectorId) {
                socket.join(`collector_${collectorId}`);
                socket.join('collectors');
                connectedUsers.set(collectorId, socket.id);
                socketUsers.set(socket.id, collectorId);
                console.log(`Collector ${collectorId} joined room collector_${collectorId} and collectors`);
            }
        });

        // Admin joins admin room
        socket.on('join_admin', (adminId) => {
            if (adminId) {
                socket.join('admins');
                connectedUsers.set(adminId, socket.id);
                socketUsers.set(socket.id, adminId);
                console.log(`Admin ${adminId} joined room admins`);
            }
        });

        // Real-time location updates from collectors
        socket.on('location_update', (data) => {
            const { pickupId, latitude, longitude, collectorId } = data;
            
            if (pickupId && collectorId) {
                // Notify the resident about collector's location
                socket.to(`user_${data.residentId}`).emit('collector_location', {
                    pickupId,
                    location: { lat: latitude, lng: longitude },
                    collectorId,
                    timestamp: new Date()
                });

                // Notify admins about location update
                socket.to('admins').emit('collector_location_update', {
                    pickupId,
                    collectorId,
                    location: { lat: latitude, lng: longitude },
                    timestamp: new Date()
                });

                console.log(`Location update for pickup ${pickupId} from collector ${collectorId}`);
            }
        });

        // Pickup status updates
        socket.on('pickup_status_update', (data) => {
            const { pickupId, status, residentId, collectorId, message } = data;

            // Notify resident
            if (residentId) {
                socket.to(`user_${residentId}`).emit('pickup_status_changed', {
                    pickupId,
                    status,
                    message,
                    timestamp: new Date()
                });
            }

            // Notify collector
            if (collectorId) {
                socket.to(`collector_${collectorId}`).emit('pickup_status_changed', {
                    pickupId,
                    status,
                    message,
                    timestamp: new Date()
                });
            }

            // Notify admins
            socket.to('admins').emit('pickup_status_changed', {
                pickupId,
                status,
                residentId,
                collectorId,
                message,
                timestamp: new Date()
            });

            console.log(`Pickup ${pickupId} status updated to ${status}`);
        });

        // New pickup notification for collectors
        socket.on('new_pickup_available', (data) => {
            const { pickupId, location, wasteType, scheduledDate } = data;

            // Notify all available collectors
            socket.to('collectors').emit('new_pickup', {
                pickupId,
                location,
                wasteType,
                scheduledDate,
                timestamp: new Date()
            });

            console.log(`New pickup ${pickupId} notified to collectors`);
        });

        // Collector availability updates
        socket.on('collector_availability', (data) => {
            const { collectorId, isAvailable } = data;

            // Notify admins about collector availability change
            socket.to('admins').emit('collector_availability_changed', {
                collectorId,
                isAvailable,
                timestamp: new Date()
            });

            console.log(`Collector ${collectorId} availability changed to ${isAvailable}`);
        });

        // Points and rewards notifications
        socket.on('points_awarded', (data) => {
            const { userId, points, reason, newBalance } = data;

            // Notify user about points
            socket.to(`user_${userId}`).emit('points_update', {
                points,
                reason,
                newBalance,
                timestamp: new Date()
            });

            console.log(`Points awarded to user ${userId}: ${points} points`);
        });

        // Reward redemption notifications
        socket.on('reward_redemption', (data) => {
            const { userId, rewardId, points, status } = data;

            // Notify admins about new redemption
            socket.to('admins').emit('new_redemption', {
                userId,
                rewardId,
                points,
                status,
                timestamp: new Date()
            });

            console.log(`New redemption from user ${userId} for reward ${rewardId}`);
        });

        // Handle disconnection
        socket.on('disconnect', () => {
            const userId = socketUsers.get(socket.id);
            
            if (userId) {
                connectedUsers.delete(userId);
                socketUsers.delete(socket.id);
                console.log(`User ${userId} disconnected`);
            } else {
                console.log('Unknown user disconnected:', socket.id);
            }
        });

        // Error handling
        socket.on('error', (error) => {
            console.error('Socket error:', error);
        });
    });

    // Helper function to get socket instance
    const getIO = () => {
        if (!io) {
            throw new Error('Socket.io not initialized');
        }
        return io;
    };

    // Helper function to send notification to specific user
    const notifyUser = (userId, event, data) => {
        const socketId = connectedUsers.get(userId);
        if (socketId) {
            io.to(socketId).emit(event, data);
        }
    };

    // Helper function to send notification to all admins
    const notifyAdmins = (event, data) => {
        io.to('admins').emit(event, data);
    };

    // Helper function to send notification to all collectors
    const notifyCollectors = (event, data) => {
        io.to('collectors').emit(event, data);
    };

    return {
        io: getIO,
        notifyUser,
        notifyAdmins,
        notifyCollectors
    };
};

module.exports = initializeSocket;