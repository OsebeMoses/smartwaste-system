const { body, param, query, validationResult } = require('express-validator');

// Validation result handler
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array()
        });
    }
    next();
};

// User registration validation
const validateUserRegistration = [
    body('name')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Name must be between 2 and 50 characters'),
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long'),
    body('role')
        .optional()
        .isIn(['resident', 'collector', 'admin'])
        .withMessage('Invalid role specified'),
    handleValidationErrors
];

// Collector registration validation
const validateCollectorRegistration = [
    body('name')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Name must be between 2 and 50 characters'),
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long'),
    body('vehicle')
        .optional()
        .isIn(['truck', 'van', 'car', 'bike', 'other'])
        .withMessage('Invalid vehicle type'),
    body('licensePlate')
        .optional()
        .trim()
        .isLength({ min: 3, max: 15 })
        .withMessage('License plate must be between 3 and 15 characters'),
    body('capacity')
        .optional()
        .isInt({ min: 10, max: 1000 })
        .withMessage('Capacity must be between 10 and 1000 kg'),
    handleValidationErrors
];

// Pickup creation validation
const validatePickupCreation = [
    body('wasteType')
        .isIn(['plastic', 'glass', 'paper', 'metal', 'electronic', 'organic', 'general'])
        .withMessage('Invalid waste type'),
    body('wasteSize')
        .isIn(['small', 'medium', 'large'])
        .withMessage('Invalid waste size'),
    body('location.address')
        .notEmpty()
        .withMessage('Address is required'),
    body('location.coordinates')
        .isArray({ min: 2, max: 2 })
        .withMessage('Coordinates must be an array of [lng, lat]'),
    body('location.coordinates.*')
        .isFloat()
        .withMessage('Coordinates must be numbers'),
    body('scheduledDate')
        .isISO8601()
        .withMessage('Scheduled date must be a valid date')
        .custom((value) => {
            if (new Date(value) <= new Date()) {
                throw new Error('Scheduled date must be in the future');
            }
            return true;
        }),
    body('urgency')
        .optional()
        .isIn(['low', 'medium', 'high'])
        .withMessage('Invalid urgency level'),
    body('description')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Description cannot exceed 500 characters'),
    handleValidationErrors
];

// Reward creation validation
const validateRewardCreation = [
    body('name')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Name must be between 2 and 100 characters'),
    body('description')
        .trim()
        .isLength({ min: 10, max: 500 })
        .withMessage('Description must be between 10 and 500 characters'),
    body('points')
        .isInt({ min: 1, max: 10000 })
        .withMessage('Points must be between 1 and 10000'),
    body('category')
        .isIn(['eco', 'digital', 'membership', 'voucher'])
        .withMessage('Invalid reward category'),
    body('stock')
        .isInt({ min: 0 })
        .withMessage('Stock must be a positive number'),
    body('requirements.minTier')
        .optional()
        .isIn(['bronze', 'silver', 'gold'])
        .withMessage('Invalid minimum tier'),
    body('requirements.maxRedemptionsPerUser')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Max redemptions must be at least 1'),
    handleValidationErrors
];

// Points system update validation
const validatePointsSystemUpdate = [
    body('wasteType')
        .isIn(['plastic', 'glass', 'paper', 'metal', 'electronic', 'organic', 'general'])
        .withMessage('Invalid waste type'),
    body('size')
        .isIn(['small', 'medium', 'large'])
        .withMessage('Invalid size'),
    body('points')
        .isInt({ min: 1, max: 1000 })
        .withMessage('Points must be between 1 and 1000'),
    handleValidationErrors
];

// Pagination validation
const validatePagination = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
    handleValidationErrors
];

// ID parameter validation
const validateIdParam = [
    param('id')
        .isMongoId()
        .withMessage('Invalid ID format'),
    handleValidationErrors
];

module.exports = {
    handleValidationErrors,
    validateUserRegistration,
    validateCollectorRegistration,
    validatePickupCreation,
    validateRewardCreation,
    validatePointsSystemUpdate,
    validatePagination,
    validateIdParam
};