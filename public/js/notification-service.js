// SmartWaste Notification Service
class NotificationService {
    constructor() {
        this.notifications = [];
        this.isInitialized = false;
        this.init();
    }

    async init() {
        try {
            // Initialize notification service
            this.isInitialized = true;
            console.log('Notification service initialized');
        } catch (error) {
            console.error('Failed to initialize notification service:', error);
        }
    }

    // Send email notification
    async sendEmailNotification(to, subject, message, template = 'default') {
        try {
            console.log(`Sending email to ${to}: ${subject}`);
            
            // In a real application, this would call your email service API
            const emailData = {
                to,
                subject,
                message,
                template,
                timestamp: new Date().toISOString()
            };

            // Simulate API call
            const response = await this.simulateEmailAPI(emailData);
            
            if (response.success) {
                console.log('Email sent successfully');
                return { success: true, messageId: response.messageId };
            } else {
                throw new Error(response.error || 'Failed to send email');
            }
            
        } catch (error) {
            console.error('Error sending email:', error);
            throw error;
        }
    }

    // Send SMS notification
    async sendSMSNotification(to, message) {
        try {
            console.log(`Sending SMS to ${to}: ${message}`);
            
            // In a real application, this would call your SMS service API
            const smsData = {
                to,
                message,
                timestamp: new Date().toISOString()
            };

            // Simulate API call
            const response = await this.simulateSMSAPI(smsData);
            
            if (response.success) {
                console.log('SMS sent successfully');
                return { success: true, messageId: response.messageId };
            } else {
                throw new Error(response.error || 'Failed to send SMS');
            }
            
        } catch (error) {
            console.error('Error sending SMS:', error);
            throw error;
        }
    }

    // Send push notification
    async sendPushNotification(userId, title, message, data = {}) {
        try {
            console.log(`Sending push notification to user ${userId}: ${title}`);
            
            // In a real application, this would call your push notification service
            const pushData = {
                userId,
                title,
                message,
                data,
                timestamp: new Date().toISOString()
            };

            // Simulate API call
            const response = await this.simulatePushAPI(pushData);
            
            if (response.success) {
                console.log('Push notification sent successfully');
                return { success: true, messageId: response.messageId };
            } else {
                throw new Error(response.error || 'Failed to send push notification');
            }
            
        } catch (error) {
            console.error('Error sending push notification:', error);
            throw error;
        }
    }

    // Send pickup status notification
    async sendPickupStatusNotification(pickupId, status, userEmail, userPhone) {
        try {
            const templates = {
                pending: {
                    email: {
                        subject: 'Pickup Request Received - SmartWaste',
                        message: `Your waste pickup request #${pickupId} has been received and is being processed. We'll notify you when a collector is assigned.`
                    },
                    sms: `SmartWaste: Your pickup request #${pickupId} has been received. We'll notify you when assigned.`
                },
                accepted: {
                    email: {
                        subject: 'Pickup Request Accepted - SmartWaste',
                        message: `Great news! Your waste pickup request #${pickupId} has been accepted by a collector. They will arrive at your scheduled time.`
                    },
                    sms: `SmartWaste: Your pickup #${pickupId} has been accepted! Collector will arrive at scheduled time.`
                },
                inProgress: {
                    email: {
                        subject: 'Collector En Route - SmartWaste',
                        message: `Your collector is on the way to pickup request #${pickupId}. You can track their location in real-time.`
                    },
                    sms: `SmartWaste: Collector is en route for pickup #${pickupId}. Track location in app.`
                },
                completed: {
                    email: {
                        subject: 'Pickup Completed - SmartWaste',
                        message: `Your waste pickup #${pickupId} has been completed successfully! Thank you for contributing to a cleaner environment.`
                    },
                    sms: `SmartWaste: Pickup #${pickupId} completed! Thank you for your contribution.`
                },
                cancelled: {
                    email: {
                        subject: 'Pickup Request Cancelled - SmartWaste',
                        message: `Your waste pickup request #${pickupId} has been cancelled. Please contact support if you need assistance.`
                    },
                    sms: `SmartWaste: Pickup #${pickupId} has been cancelled. Contact support if needed.`
                }
            };

            const template = templates[status];
            if (!template) {
                console.warn(`No template found for status: ${status}`);
                return;
            }

            // Send email notification
            if (userEmail) {
                await this.sendEmailNotification(
                    userEmail,
                    template.email.subject,
                    template.email.message,
                    'pickup_status'
                );
            }

            // Send SMS notification
            if (userPhone) {
                await this.sendSMSNotification(userPhone, template.sms);
            }

            // Send push notification
            await this.sendPushNotification(
                pickupId, // Using pickupId as userId for demo
                template.email.subject,
                template.email.message,
                { pickupId, status }
            );

        } catch (error) {
            console.error('Error sending pickup status notification:', error);
        }
    }

    // Send points earned notification
    async sendPointsNotification(userEmail, userPhone, points, reason) {
        try {
            const emailSubject = 'Points Earned - SmartWaste';
            const emailMessage = `Congratulations! You've earned ${points} points for ${reason}. Keep up the great work!`;
            const smsMessage = `SmartWaste: +${points} points earned for ${reason}!`;

            // Send email notification
            if (userEmail) {
                await this.sendEmailNotification(userEmail, emailSubject, emailMessage, 'points_earned');
            }

            // Send SMS notification
            if (userPhone) {
                await this.sendSMSNotification(userPhone, smsMessage);
            }

        } catch (error) {
            console.error('Error sending points notification:', error);
        }
    }

    // Send reward redemption notification
    async sendRewardNotification(userEmail, userPhone, rewardName, redemptionCode) {
        try {
            const emailSubject = 'Reward Redeemed - SmartWaste';
            const emailMessage = `Your reward "${rewardName}" has been redeemed successfully! Redemption code: ${redemptionCode}`;
            const smsMessage = `SmartWaste: Reward "${rewardName}" redeemed! Code: ${redemptionCode}`;

            // Send email notification
            if (userEmail) {
                await this.sendEmailNotification(userEmail, emailSubject, emailMessage, 'reward_redemption');
            }

            // Send SMS notification
            if (userPhone) {
                await this.sendSMSNotification(userPhone, smsMessage);
            }

        } catch (error) {
            console.error('Error sending reward notification:', error);
        }
    }

    // Send welcome notification
    async sendWelcomeNotification(userEmail, userPhone, userName) {
        try {
            const emailSubject = 'Welcome to SmartWaste!';
            const emailMessage = `Welcome ${userName}! Thank you for joining SmartWaste. Start earning points by scheduling your first waste pickup.`;
            const smsMessage = `Welcome to SmartWaste, ${userName}! Start earning points with your first pickup.`;

            // Send email notification
            if (userEmail) {
                await this.sendEmailNotification(userEmail, emailSubject, emailMessage, 'welcome');
            }

            // Send SMS notification
            if (userPhone) {
                await this.sendSMSNotification(userPhone, smsMessage);
            }

        } catch (error) {
            console.error('Error sending welcome notification:', error);
        }
    }

    // Simulate email API call
    async simulateEmailAPI(emailData) {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Simulate success/failure
        const success = Math.random() > 0.1; // 90% success rate
        
        if (success) {
            return {
                success: true,
                messageId: `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            };
        } else {
            return {
                success: false,
                error: 'Email service temporarily unavailable'
            };
        }
    }

    // Simulate SMS API call
    async simulateSMSAPI(smsData) {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Simulate success/failure
        const success = Math.random() > 0.05; // 95% success rate
        
        if (success) {
            return {
                success: true,
                messageId: `sms_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            };
        } else {
            return {
                success: false,
                error: 'SMS service temporarily unavailable'
            };
        }
    }

    // Simulate push notification API call
    async simulatePushAPI(pushData) {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Simulate success/failure
        const success = Math.random() > 0.02; // 98% success rate
        
        if (success) {
            return {
                success: true,
                messageId: `push_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            };
        } else {
            return {
                success: false,
                error: 'Push notification service temporarily unavailable'
            };
        }
    }

    // Get notification history
    getNotificationHistory() {
        return this.notifications;
    }

    // Clear notification history
    clearNotificationHistory() {
        this.notifications = [];
    }
}

// Initialize notification service
window.notificationService = new NotificationService();
