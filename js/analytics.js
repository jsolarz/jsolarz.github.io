/**
 * 📊 Enhanced Analytics Tracker with Centralized SQL.js Database
 * GDPR-compliant, cookie-free analytics with true centralized database
 * Perfect for GitHub Pages with synchronized analytics! 🚀
 */
class SimpleAnalytics {
    constructor() {
        this.db = null;
        this.visitorId = null;
        this.sessionId = null;
        this.pageLoadTime = Date.now();
        this.init();
    }

    /**
     * 🔧 Initialize analytics tracking
     */
    async init() {
        try {
            // Initialize SQL.js database
            this.db = new AnalyticsDatabase();
            const dbInitialized = await this.db.init();

            if (dbInitialized) {
                console.log('📊 Using centralized SQL.js database for analytics');
            } else {
                console.error('📊 Failed to initialize centralized database');
                return;
            }
        } catch (error) {
            console.error('📊 Database initialization failed:', error);
            return;
        }        this.ensureVisitorId();
        this.trackPageView();
        this.setupUnloadTracking();
    }

    /**
     * 🎯 Generate unique visitor ID without cookies
     */
    generateVisitorId() {
        // Use database method
        return this.db.generateVisitorId();
    }

    /**
     * 👤 Ensure visitor has a unique ID
     */
    ensureVisitorId() {
        // Try to get from sessionStorage first (for this session)
        this.visitorId = sessionStorage.getItem('analytics_visitor_id');

        if (!this.visitorId) {
            // Generate new visitor ID
            this.visitorId = this.generateVisitorId();            sessionStorage.setItem('analytics_visitor_id', this.visitorId);
        }

        // Get or generate session ID
        this.sessionId = this.getSessionId();
    }    /**
     * 🎫 Get session ID
     */
    getSessionId() {
        return this.db.getSessionId();
    }

    /**
     * 📄 Track page view
     */
    async trackPageView() {
        const now = Date.now();
        const isNewSession = !sessionStorage.getItem('session_active');

        // Mark session as active
        sessionStorage.setItem('session_active', now.toString());

        const pageViewData = {
            visitorId: this.visitorId,
            sessionId: this.sessionId,
            path: window.location.pathname,
            timestamp: now,
            referrer: document.referrer || 'direct',
            userAgent: navigator.userAgent,
            isNewSession: isNewSession
        };

        // Use centralized SQL database
        if (this.db && await this.db.isInitialized()) {
            try {
                const result = await this.db.trackPageView(pageViewData);
                if (result.success) {
                    console.log('📊 Page view tracked in centralized database:', pageViewData.path);
                    return pageViewData;
                } else {
                    console.error('📊 Failed to track page view:', result.error);
                }
            } catch (error) {
                console.error('📊 Database tracking failed:', error);            }
        }

        return pageViewData;
    }

    /**
     * ⚡ Track when user leaves page (for bounce rate)
     */
    setupUnloadTracking() {
        this.pageLoadTime = Date.now();

        window.addEventListener('beforeunload', async () => {
            const timeSpent = Date.now() - this.pageLoadTime;

            // Update the current page view with time spent in the database
            if (this.db && await this.db.isInitialized()) {
                try {
                    // Get the current session's last page view and update it
                    const updateSQL = `
                        UPDATE page_views
                        SET time_spent = ?,
                            bounced = ?
                        WHERE visitor_id = ?
                        AND session_id = ?
                        AND path = ?
                        ORDER BY timestamp DESC
                        LIMIT 1
                    `;

                    const bounced = timeSpent < 30000 ? 1 : 0; // Less than 30 seconds = bounce
                    this.db.db.run(updateSQL, [
                        timeSpent,
                        bounced,
                        this.visitorId,
                        this.sessionId,
                        window.location.pathname
                    ]);

                    // Save the updated database
                    await this.db.saveDatabase();
                } catch (error) {
                    console.warn('📊 Failed to update page unload data:', error);
                }
            }
        });
    }    /**
     * 📈 Get analytics summary
     */
    async getAnalyticsSummary() {
        // Use centralized SQL database only
        if (this.db && await this.db.isInitialized()) {
            try {
                return await this.db.getAnalyticsSummary();
            } catch (error) {
                console.error('📊 Failed to get analytics summary:', error);
                return {
                    uniqueVisitors: 0,
                    totalPageViews: 0,
                    newVisitors: 0,
                    returningVisitors: 0,
                    bounceRate: '0%',
                    popularPages: [],
                    dataRange: '30 days',
                    lastUpdated: new Date().toISOString(),
                    error: 'Database unavailable'
                };
            }
        }

        // Return empty state if database not available
        return {
            uniqueVisitors: 0,
            totalPageViews: 0,
            newVisitors: 0,
            returningVisitors: 0,
            bounceRate: '0%',
            popularPages: [],
            dataRange: '30 days',
            lastUpdated: new Date().toISOString(),
            error: 'Database not initialized'
        };
    }    /**
     * 🧹 Clear all analytics data
     */
    async clearData() {
        // Clear SQL database if available
        if (this.db && await this.db.isInitialized()) {
            await this.db.clearAllData();
        }

        // Clear session storage only
        sessionStorage.removeItem('analytics_visitor_id');
        sessionStorage.removeItem('analytics_session_id');
        sessionStorage.removeItem('session_active');
        console.log('🧹 Analytics data cleared');
    }
}

// 🚀 Auto-initialize analytics (if not in test environment)
if (typeof window !== 'undefined' && !window.location.href.includes('test')) {
    window.simpleAnalytics = new SimpleAnalytics();
}
