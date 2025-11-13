// System constants and configuration
module.exports = {
    // Points system defaults
    DEFAULT_POINTS_SYSTEM: {
        plastic: { small: 30, medium: 45, large: 65 },
        glass: { small: 25, medium: 40, large: 60 },
        paper: { small: 20, medium: 30, large: 45 },
        metal: { small: 35, medium: 50, large: 70 },
        electronic: { small: 50, medium: 75, large: 100 },
        organic: { small: 15, medium: 25, large: 35 },
        general: { small: 10, medium: 15, large: 25 }
    },

    // Urgency multipliers
    URGENCY_MULTIPLIERS: {
        low: 1.0,
        medium: 1.2,
        high: 1.5
    },

    // Tier thresholds
    TIER_THRESHOLDS: {
        bronze: 0,
        silver: 500,
        gold: 1500
    },

    // Waste type icons
    WASTE_TYPE_ICONS: {
        plastic: 'bi-droplet',
        glass: 'bi-cup-straw',
        paper: 'bi-file-earmark-text',
        metal: 'bi-gear',
        electronic: 'bi-cpu',
        organic: 'bi-flower1',
        general: 'bi-trash'
    },

    // Status colors and labels
    PICKUP_STATUS: {
        pending: { label: 'Pending', color: 'warning', class: 'status-pending' },
        accepted: { label: 'Accepted', color: 'info', class: 'status-accepted' },
        inProgress: { label: 'In Progress', color: 'primary', class: 'status-in-progress' },
        completed: { label: 'Completed', color: 'success', class: 'status-completed' },
        cancelled: { label: 'Cancelled', color: 'secondary', class: 'status-cancelled' }
    },

    USER_STATUS: {
        active: { label: 'Active', color: 'success', class: 'status-active' },
        inactive: { label: 'Inactive', color: 'warning', class: 'status-inactive' },
        suspended: { label: 'Suspended', color: 'danger', class: 'status-suspended' }
    },

    // Reward categories
    REWARD_CATEGORIES: {
        eco: { label: 'Eco Products', icon: 'bi-leaf' },
        digital: { label: 'Digital', icon: 'bi-phone' },
        membership: { label: 'Membership', icon: 'bi-star' },
        voucher: { label: 'Voucher', icon: 'bi-gift' }
    },

    // Vehicle types
    VEHICLE_TYPES: {
        truck: { label: 'Truck', capacity: 'Large' },
        van: { label: 'Van', capacity: 'Medium' },
        car: { label: 'Car', capacity: 'Small' },
        bike: { label: 'Bike', capacity: 'Very Small' },
        other: { label: 'Other', capacity: 'Varies' }
    },

    // System limits
    LIMITS: {
        MAX_PICKUPS_PER_COLLECTOR: 5,
        MAX_PHOTOS_PER_PICKUP: 3,
        MAX_PHOTO_SIZE: 5 * 1024 * 1024, // 5MB
        PICKUP_SCHEDULE_DAYS: 30, // Can schedule up to 30 days in advance
        PASSWORD_MIN_LENGTH: 6,
        DESCRIPTION_MAX_LENGTH: 500
    },

    // Time constants (in milliseconds)
    TIME: {
        DAY: 24 * 60 * 60 * 1000,
        HOUR: 60 * 60 * 1000,
        MINUTE: 60 * 1000
    }
};