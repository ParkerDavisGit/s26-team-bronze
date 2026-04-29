const FDARecallService = require('./fdaRecallService');
const NotificationService = require('./notificationService');
const { getRecallCountAllTime } = require('./fdaClient');

class RecallMonitorService {
    constructor() {
        this.fdaService = new FDARecallService();
        this.notificationService = new NotificationService();
        this.isRunning = false;
        this.intervalId = null;
    }

    /**mail
     * Run complete recall monitoring cycle
     * @returns {Promise<Object>} Summary of the monitoring cycle
     */
    async runMonitoringCycle() {
        try {
            console.log('\n=== Starting Recall Monitoring Cycle ===');
            const startTime = new Date();

            // Step 1: Check for new recalls
            const newRecalls = await this.fdaService.checkForNewRecalls();
            
            // Step 2: Process notifications for affected users
            const notificationSummary = await this.notificationService.processRecallNotifications(newRecalls);

            // Step 3: Get total recalls count from FDA
            const totalFDARecalls = await getRecallCountAllTime();

            const duration = new Date() - startTime;

            const summary = {
                timestamp: startTime,
                duration: duration,
                newRecalls: newRecalls.length,
                totalFDARecalls: totalFDARecalls,
                notificationsSent: notificationSummary.sent,
                notificationsFailed: notificationSummary.failed,
                usersAffected: notificationSummary.totalAffected
            };

            return summary;

        } catch (error) {
            console.error('Error during monitoring cycle:', error);
            throw error;
        }
    }

    /**
     * Start periodic monitoring (every hour for testing, should be daily/weekly in production)
     * @param {number} intervalMinutes - Minutes between checks (default: 60)
     */
    startPeriodicMonitoring(intervalMinutes = 60) {
        if (this.isRunning) {
            console.log('Monitoring is already running');
            return;
        }

        console.log(`Starting periodic recall monitoring (every ${intervalMinutes} minutes)`);
        
        // Run immediately on start
        this.runMonitoringCycle().catch(error => {
            console.error('Error in initial monitoring cycle:', error);
        });

        // Set up periodic execution
        this.intervalId = setInterval(async () => {
            try {
                await this.runMonitoringCycle();
            } catch (error) {
                console.error('Error in scheduled monitoring cycle:', error);
            }
        }, intervalMinutes * 60 * 1000);

        this.isRunning = true;
        console.log('Periodic monitoring started');
    }

    /**
     * Stop periodic monitoring
     */
    stopPeriodicMonitoring() {
        if (!this.isRunning) {
            console.log('Monitoring is not running');
            return;
        }

        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }

        this.isRunning = false;
        console.log('Periodic monitoring stopped');
    }

    /**
     * Get monitoring status
     * @returns {Object} Current monitoring status
     */
    getStatus() {
        return {
            isRunning: this.isRunning,
            lastChecked: this.fdaService.lastChecked,
            intervalId: this.intervalId !== null
        };
    }

    /**
     * Force an immediate check (for manual triggers)
     * @returns {Promise<Object>} Monitoring cycle summary
     */
    async forceCheck() {
        console.log('Manual recall check triggered');
        return this.runMonitoringCycle();
    }

    /**
     * Send test notification to verify email system
     * @param {string} email - Email address to send test to
     */
    async sendTestNotification(email) {
        return this.notificationService.sendTestNotification(email);
    }
}

module.exports = RecallMonitorService;