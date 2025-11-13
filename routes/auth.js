const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { protect } = require('../middleware/auth'); // Import real protect middleware

const router = express.Router();

// Generate JWT Token
const generateToken = (id) => {
    return jwt.sign({ id: id }, process.env.JWT_SECRET || 'fallback-secret-123', {
        expiresIn: '30d',
    });
};

// @desc    Admin login (admin role only)
// @route   POST /api/auth/admin-login
// @access  Public (but validates admin role)
router.post('/admin-login', async (req, res) => {
    try {
        let email = (req.body.email || '').toLowerCase().trim();
        const password = req.body.password;

        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        if (user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Admin access required'
            });
        }

        if (user.status !== 'active') {
            return res.status(401).json({
                success: false,
                message: 'Account is suspended or inactive'
            });
        }

        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        if (!user.adminData) user.adminData = {};
        user.adminData.lastLogin = new Date();
        await user.save({ validateBeforeSave: false });

        return res.json({
            success: true,
            message: 'Admin login successful',
            data: {
                ...getUserResponseData(user),
                token: generateToken(user._id)
            }
        });
    } catch (error) {
        console.error('Admin login error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error during admin login: ' + error.message
        });
    }
});

// Helper function to get user data for response
const getUserResponseData = (user) => {
    const baseData = {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        points: user.points,
        tier: user.tier,
        status: user.status
    };

    // Add role-specific data
    if (user.role === 'resident') {
        baseData.residentData = {
            totalPickups: user.residentData.totalPickups,
            wasteRecycled: user.residentData.wasteRecycled,
            location: user.residentData.location,
            memberSince: user.residentData.memberSince
        };
    } else if (user.role === 'collector') {
        baseData.collectorData = {
            vehicle: user.collectorData.vehicle,
            licensePlate: user.collectorData.licensePlate,
            isAvailable: user.collectorData.isAvailable,
            stats: user.collectorData.stats
        };
    } else if (user.role === 'admin') {
        baseData.adminData = {
            permissions: user.adminData.permissions,
            lastLogin: user.adminData.lastLogin
        };
    }

    return baseData;
};

// @desc    Register a new resident
// @route   POST /api/auth/register
// @access  Public
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, phone, address } = req.body;

        console.log('Resident registration attempt for:', email);

        // Check if user exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({
                success: false,
                message: 'User already exists with this email'
            });
        }

        // Create resident user
        const user = await User.create({
            name,
            email,
            password,
            phone,
            role: 'resident',
            profile: { address },
            residentData: {
                location: {
                    address: address
                },
                memberSince: new Date()
            }
        });

        if (user) {
            res.status(201).json({
                success: true,
                message: 'Resident registered successfully',
                data: {
                    ...getUserResponseData(user),
                    token: generateToken(user._id)
                }
            });
        }
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating user account: ' + error.message
        });
    }
});

// @desc    Register a new collector
// @route   POST /api/auth/register-collector
// @access  Public
router.post('/register-collector', async (req, res) => {
    try {
        const { name, email, password, phone, vehicle, licensePlate, capacity } = req.body;

        console.log('Collector registration attempt for:', email);

        // Check if user exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({
                success: false,
                message: 'User already exists with this email'
            });
        }

        // Create collector user
        const user = await User.create({
            name,
            email,
            password,
            phone,
            role: 'collector',
            collectorData: {
                vehicle: vehicle || 'car',
                licensePlate,
                capacity: capacity || 100,
                isAvailable: true,
                stats: {
                    completedPickups: 0,
                    totalWasteCollected: 0,
                    averageRating: 0,
                    onTimeRate: 0,
                    totalEarnings: 0
                }
            }
        });

        if (user) {
            res.status(201).json({
                success: true,
                message: 'Collector registered successfully',
                data: {
                    ...getUserResponseData(user),
                    token: generateToken(user._id)
                }
            });
        }
    } catch (error) {
        console.error('Collector registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating collector account: ' + error.message
        });
    }
});

// @desc    Register a new admin (protected - only by existing admins)
// @route   POST /api/auth/register-admin
// @access  Private/Admin
router.post('/register-admin', protect, async (req, res) => {
    try {
        // Check if current user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Admin access required to register new admin'
            });
        }

        const { name, email, password, phone, permissions } = req.body;

        console.log('Admin registration attempt for:', email);

        // Check if user exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({
                success: false,
                message: 'User already exists with this email'
            });
        }

        // Create admin user
        const user = await User.create({
            name,
            email,
            password,
            phone,
            role: 'admin',
            adminData: {
                permissions: permissions || {
                    userManagement: true,
                    systemConfig: true,
                    analytics: true,
                    reports: true
                },
                lastLogin: new Date()
            }
        });

        if (user) {
            res.status(201).json({
                success: true,
                message: 'Admin registered successfully',
                data: {
                    ...getUserResponseData(user),
                    token: generateToken(user._id)
                }
            });
        }
    } catch (error) {
        console.error('Admin registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating admin account: ' + error.message
        });
    }
});

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
    try {
        let email = (req.body.email || '').toLowerCase().trim();
        const password = req.body.password;

        console.log('Login attempt for:', email);

        // Check for user
        const user = await User.findOne({ email }).select('+password');
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check if user is active
        if (user.status !== 'active') {
            return res.status(401).json({
                success: false,
                message: 'Account is suspended or inactive'
            });
        }

        // Check password
        const isPasswordValid = await user.comparePassword(password);
        
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Update last login based on role
        if (user.role === 'admin') {
            user.adminData.lastLogin = new Date();
        }
        await user.save({ validateBeforeSave: false });

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                ...getUserResponseData(user),
                token: generateToken(user._id)
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Error during login process: ' + error.message
        });
    }
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
router.get('/me', protect, async (req, res) => {
    try {
        console.log('GET /api/auth/me called');
        console.log('User found:', req.user.email, 'Role:', req.user.role);

        res.json({
            success: true,
            data: getUserResponseData(req.user)
        });

    } catch (error) {
        console.error('Auth me error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error fetching user data: ' + error.message
        });
    }
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
router.put('/profile', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const { name, phone, address, preferences } = req.body;

        // Update basic profile
        if (name) user.name = name;
        if (phone) user.phone = phone;
        
        // Update address for residents
        if (address && user.role === 'resident') {
            user.profile.address = address;
            user.residentData.location.address = address;
        }
        
        // Update preferences
        if (preferences) {
            user.preferences = { ...user.preferences, ...preferences };
        }

        await user.save();

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: getUserResponseData(user)
        });

    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating profile: ' + error.message
        });
    }
});

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
router.put('/change-password', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('+password');
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const { currentPassword, newPassword } = req.body;

        // Verify current password
        const isCurrentPasswordValid = await user.comparePassword(currentPassword);
        if (!isCurrentPasswordValid) {
            return res.status(400).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // Update password
        user.password = newPassword;
        await user.save();

        res.json({
            success: true,
            message: 'Password changed successfully'
        });

    } catch (error) {
        console.error('Password change error:', error);
        res.status(500).json({
            success: false,
            message: 'Error changing password: ' + error.message
        });
    }
});

module.exports = router;