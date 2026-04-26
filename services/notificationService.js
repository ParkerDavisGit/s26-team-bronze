const nodemailer = require('nodemailer');
const prisma = require('../db');
require('dotenv').config();

class NotificationService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
    }

    /**
     * Check which users are affected by new recalls
     * @param {Array} newRecalls - Array of new recall objects
     * @returns {Promise<Array>} Array of {user, affectedRecalls} objects
     */
    async findAffectedUsers(newRecalls) {
        const affectedUsers = [];

        for (const recall of newRecalls) {
            // Find users who have this product in their pantry
            const usersWithProduct = await prisma.users.findMany({
                where: {
                    items: {
                        some: {
                            product_id: recall.product_id
                        }
                    }
                },
                include: {
                    items: {
                        include: {
                            product: true
                        }
                    }
                }
            });

            for (const user of usersWithProduct) {
                // Find existing entry or create new one
                let userEntry = affectedUsers.find(entry => entry.user.user_id === user.user_id);
                
                if (!userEntry) {
                    userEntry = {
                        user: user,
                        affectedRecalls: []
                    };
                    affectedUsers.push(userEntry);
                }

                // Add recall with product info
                const affectedProduct = user.items.find(item => item.product_id === recall.product_id);
                userEntry.affectedRecalls.push({
                    recall: recall,
                    product: affectedProduct.product
                });
            }
        }

        return affectedUsers;
    }

    /**
     * Send recall notification email to a user
     * @param {Object} user - User object
     * @param {Array} affectedRecalls - Array of {recall, product} objects
     * @returns {Promise<void>}
     */
    async sendRecallNotification(user, affectedRecalls) {
        try {
            const subject = `🚨 Important Food Safety Alert - ${affectedRecalls.length} Product${affectedRecalls.length > 1 ? 's' : ''} Recalled`;
            
            const htmlContent = this.generateRecallEmailHTML(user, affectedRecalls);

            const mailOptions = {
                from: `"Spoiler Alert Team" <${process.env.EMAIL_USER}>`,
                to: user.email,
                subject: subject,
                html: htmlContent
            };

            await this.transporter.sendMail(mailOptions);
            console.log(`Recall notification sent to ${user.email} for ${affectedRecalls.length} products`);

        } catch (error) {
            console.error(`Failed to send recall notification to ${user.email}:`, error);
            throw error;
        }
    }

    /**
     * Generate HTML content for recall notification email
     * @param {Object} user - User object
     * @param {Array} affectedRecalls - Array of {recall, product} objects
     * @returns {string} HTML email content
     */
    generateRecallEmailHTML(user, affectedRecalls) {
        const recallItems = affectedRecalls.map(({ recall, product }) => `
            <div style="border: 2px solid #d73527; border-radius: 8px; padding: 15px; margin: 10px 0; background-color: #fef2f2;">
                <h3 style="color: #d73527; margin-top: 0;">${product.product_name} - ${product.brand}</h3>
                <p><strong>Recall Classification:</strong> Class ${recall.classification}</p>
                <p><strong>Reason:</strong> ${recall.description}</p>
                <p><strong>Company:</strong> ${recall.company}</p>
                <p><strong>Date:</strong> ${new Date(recall.recall_date).toLocaleDateString()}</p>
                ${recall.regions ? `<p><strong>Affected Regions:</strong> ${recall.regions}</p>` : ''}
                <div style="background-color: #fee2e2; padding: 10px; border-radius: 5px; margin-top: 10px;">
                    <strong>⚠️ Action Required:</strong> Please remove this product from your pantry immediately and follow FDA guidelines for disposal.
                </div>
            </div>
        `).join('');

        return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <div style="background-color: #d73527; color: white; padding: 20px; text-align: center;">
                <h1 style="margin: 0; font-size: 24px;">🚨 URGENT FOOD SAFETY ALERT</h1>
            </div>
            
            <div style="padding: 20px;">
                <p>Dear ${user.first_name},</p>
                
                <p style="font-size: 16px; color: #d73527; font-weight: bold;">
                    We've detected ${affectedRecalls.length} product${affectedRecalls.length > 1 ? 's' : ''} in your pantry that ${affectedRecalls.length > 1 ? 'have' : 'has'} been recalled by the FDA.
                </p>
                
                <p>Please review the following recall information carefully:</p>
                
                ${recallItems}
                
                <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="color: #374151; margin-top: 0;">What You Should Do:</h3>
                    <ul style="color: #4b5563;">
                        <li>Do not consume the recalled product(s)</li>
                        <li>Remove the product(s) from your pantry immediately</li>
                        <li>Follow FDA disposal guidelines</li>
                        <li>Contact your healthcare provider if you have consumed the product and feel ill</li>
                        <li><a href="http://localhost:3000/pantry" style="color: #d73527; text-decoration: none; font-weight: bold;">Update your pantry →</a></li>
                    </ul>
                </div>
                
                <div style="background-color: #eff6ff; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
                    <p style="margin: 0; color: #1e40af;">
                        <strong>Stay Protected:</strong> Keep your pantry updated in the Spoiler Alert app to receive immediate notifications about future recalls.
                    </p>
                </div>
                
                <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                    This is an automated message from Spoiler Alert. For more information about these recalls, visit the 
                    <a href="https://www.fda.gov/safety/recalls-market-withdrawals-safety-alerts" style="color: #d73527;">FDA Recalls website</a>.
                </p>
                
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
                
                <p style="color: #9ca3af; font-size: 12px; text-align: center;">
                    Spoiler Alert Team<br>
                    Keeping your food safe, one notification at a time.
                </p>
            </div>
        </div>
        `;
    }

    /**
     * Process and send notifications for new recalls
     * @param {Array} newRecalls - Array of new recall objects
     * @returns {Promise<Object>} Summary of notifications sent
     */
    async processRecallNotifications(newRecalls) {
        try {
            if (newRecalls.length === 0) {
                console.log('No new recalls to process for notifications');
                return { sent: 0, failed: 0, totalAffected: 0 };
            }

            console.log(`Processing notifications for ${newRecalls.length} new recalls...`);

            // Find affected users
            const affectedUsers = await this.findAffectedUsers(newRecalls);
            console.log(`Found ${affectedUsers.length} users affected by new recalls`);

            let sent = 0;
            let failed = 0;

            // Send notifications
            for (const { user, affectedRecalls } of affectedUsers) {
                try {
                    await this.sendRecallNotification(user, affectedRecalls);
                    sent++;
                } catch (error) {
                    console.error(`Failed to notify user ${user.email}:`, error);
                    failed++;
                }
            }

            const summary = { sent, failed, totalAffected: affectedUsers.length };
            console.log(`Notification summary:`, summary);
            return summary;

        } catch (error) {
            console.error('Error processing recall notifications:', error);
            throw error;
        }
    }

    /**
     * Send test notification (for debugging)
     * @param {string} userEmail - Email to send test to
     * @returns {Promise<void>}
     */
    async sendTestNotification(userEmail) {
        try {
            const mailOptions = {
                from: `"Spoiler Alert Team" <${process.env.EMAIL_USER}>`,
                to: userEmail,
                subject: 'Test Notification - Spoiler Alert',
                html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #d73527;">Test Notification</h2>
                    <p>This is a test notification from the Spoiler Alert notification system.</p>
                    <p>If you received this email, the notification system is working correctly!</p>
                    <p style="color: #666; font-size: 14px;">Sent at: ${new Date().toLocaleString()}</p>
                </div>
                `
            };

            await this.transporter.sendMail(mailOptions);
            console.log(`Test notification sent to ${userEmail}`);

        } catch (error) {
            console.error(`Failed to send test notification to ${userEmail}:`, error);
            throw error;
        }
    }
}

module.exports = NotificationService;