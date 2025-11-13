const { protect, requireRole } = require('./auth');

// Combined auth + role middleware (most commonly used)
const authAdmin = [protect, requireRole('admin')];
const authCollector = [protect, requireRole('collector')];
const authResident = [protect, requireRole('resident')];

// Specific role middleware (for use after protect)
const requireAdmin = requireRole('admin');
const requireCollector = requireRole('collector');
const requireResident = requireRole('resident');

// Combined role middleware
const requireAdminOrCollector = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required'
        });
    }

    if (['admin', 'collector'].includes(req.user.role)) {
        next();
    } else {
        res.status(403).json({
            success: false,
            message: 'Admin or collector access required'
        });
    }
};

const requireAdminOrResident = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required'
        });
    }

    if (['admin', 'resident'].includes(req.user.role)) {
        next();
    } else {
        res.status(403).json({
            success: false,
            message: 'Admin or resident access required'
        });
    }
};

// Ownership check middleware (user can only access their own data unless admin)
const requireOwnershipOrAdmin = (resourceUserIdField = 'userId') => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        // Admins can access everything
        if (req.user.role === 'admin') {
            return next();
        }

        // Get the resource user ID from the request
        let resourceUserId;
        
        if (resourceUserIdField === 'params.id') {
            resourceUserId = req.params.id;
        } else if (resourceUserIdField === 'body.userId') {
            resourceUserId = req.body.userId;
        } else {
            resourceUserId = req[resourceUserIdField];
        }

        // Check if user owns the resource
        if (resourceUserId && resourceUserId.toString() === req.user._id.toString()) {
            return next();
        }

        res.status(403).json({
            success: false,
            message: 'Access denied. You can only access your own resources.'
        });
    };
};

// Collector ownership check for pickups
const requireCollectorPickupAccess = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        // Admins can access everything
        if (req.user.role === 'admin') {
            return next();
        }

        // For residents, they can only access their own pickups
        if (req.user.role === 'resident') {
            const PickupRequest = require('../models/PickupRequest');
            const pickup = await PickupRequest.findById(req.params.id);
            
            if (!pickup) {
                return res.status(404).json({
                    success: false,
                    message: 'Pickup not found'
                });
            }

            if (pickup.residentId.toString() === req.user._id.toString()) {
                return next();
            }
        }

        // For collectors, they can only access assigned pickups
        if (req.user.role === 'collector') {
            const PickupRequest = require('../models/PickupRequest');
            const pickup = await PickupRequest.findById(req.params.id);
            
            if (!pickup) {
                return res.status(404).json({
                    success: false,
                    message: 'Pickup not found'
                });
            }

            if (pickup.collectorId && pickup.collectorId.toString() === req.user._id.toString()) {
                return next();
            }
        }

        res.status(403).json({
            success: false,
            message: 'Access denied to this pickup'
        });

    } catch (error) {
        console.error('Error in collector pickup access middleware:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

module.exports = {
    // Combined middleware (use these in routes)
    authAdmin,
    authCollector,
    authResident,
    
    // Role-only middleware (use after protect)
    requireAdmin,
    requireCollector,
    requireResident,
    requireAdminOrCollector,
    requireAdminOrResident,
    
    // Specialized middleware
    requireOwnershipOrAdmin,
    requireCollectorPickupAccess
};