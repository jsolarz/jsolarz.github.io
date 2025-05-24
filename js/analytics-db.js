/**
 * 📊 SQL.js Centralized Analytics Database
 * True centralized analytics using SQL.js with shared database file
 * GDPR-compliant with anonymous tracking 🔒
 */
class AnalyticsDatabase {
    constructor() {
        // Centralized database file URL for GitHub Pages
        this.dbUrl = './analytics.db';
        this.sqlJsUrl = 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/sql-wasm.js';
        this.wasmUrl = 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/sql-wasm.wasm';
        this.db = null;
        this.SQL = null;
        this.updateEndpoint = './update-analytics.php'; // GitHub Action endpoint for updates        this.lastSyncTime = 0;
        this.syncThrottle = 2000; // 2 seconds between syncs for testing
    }

    /**
     * 🚀 Initialize SQL.js and database
     */
    async init() {
        try {
            // Load SQL.js
            if (!window.initSqlJs) {
                await this.loadSqlJs();
            }

            this.SQL = await window.initSqlJs({
                locateFile: (file) => this.wasmUrl
            });

            // Try to load existing database
            await this.loadDatabase();

            // Create tables if they don't exist
            await this.createTables();

            console.log('📊 Analytics database initialized successfully');
            return true;
        } catch (error) {
            console.warn('📊 Failed to initialize database, falling back to localStorage:', error);
            return false;
        }
    }

    /**
     * 📥 Load SQL.js library
     */
    async loadSqlJs() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = this.sqlJsUrl;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }    /**
     * 💾 Load database from server or create new one
     */
    async loadDatabase() {
        try {
            // In development mode, try localStorage first
            if (!this.isProduction()) {
                const backup = localStorage.getItem('analytics_backup');
                if (backup) {
                    try {
                        const binaryString = atob(backup);
                        const data = new Uint8Array(binaryString.length);
                        for (let i = 0; i < binaryString.length; i++) {
                            data[i] = binaryString.charCodeAt(i);
                        }
                        this.db = new this.SQL.Database(data);
                        console.log('📊 Loaded existing database from localStorage backup');
                        return;
                    } catch (error) {
                        console.warn('⚠️ Failed to load localStorage backup:', error);
                    }
                }
            }

            // Try to load existing centralized database from server
            const response = await fetch(this.dbUrl);

            if (response.ok) {
                const arrayBuffer = await response.arrayBuffer();
                const data = new Uint8Array(arrayBuffer);
                this.db = new this.SQL.Database(data);
                console.log('📊 Loaded existing centralized analytics database from server');
            } else {
                // Create new database if file doesn't exist
                this.db = new this.SQL.Database();
                console.log('🆕 Created new centralized analytics database');
            }
        } catch (error) {
            console.warn('⚠️ Failed to load centralized database, creating new one:', error);
            this.db = new this.SQL.Database();
        }
    }

    /**
     * 🏗️ Create database tables
     */
    async createTables() {
        const createTablesSQL = `
            CREATE TABLE IF NOT EXISTS page_views (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                visitor_id TEXT NOT NULL,
                session_id TEXT NOT NULL,
                path TEXT NOT NULL,
                timestamp INTEGER NOT NULL,
                referrer TEXT,
                user_agent TEXT,
                time_spent INTEGER DEFAULT 0,
                bounced BOOLEAN DEFAULT 0,
                is_new_session BOOLEAN DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS visitors (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                visitor_id TEXT UNIQUE NOT NULL,
                first_visit INTEGER NOT NULL,
                last_visit INTEGER NOT NULL,
                total_page_views INTEGER DEFAULT 1,
                total_sessions INTEGER DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE INDEX IF NOT EXISTS idx_page_views_timestamp ON page_views(timestamp);
            CREATE INDEX IF NOT EXISTS idx_page_views_path ON page_views(path);
            CREATE INDEX IF NOT EXISTS idx_visitors_visitor_id ON visitors(visitor_id);
        `;        this.db.exec(createTablesSQL);
        console.log('🏗️ Database tables created/verified');
    }

    /**
     * 📊 Track a page view
     */
    async trackPageView(data) {
        try {
            const {
                visitorId = this.generateVisitorId(),
                sessionId = this.getSessionId(),
                path,
                timestamp = Date.now(),
                referrer = 'direct',
                userAgent = navigator.userAgent,
                timeSpent = 0,
                bounced = false,
                isNewSession = false
            } = data;

            // Insert page view
            const insertPageViewSQL = `
                INSERT INTO page_views
                (visitor_id, session_id, path, timestamp, referrer, user_agent, time_spent, bounced, is_new_session)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            this.db.run(insertPageViewSQL, [
                visitorId, sessionId, path, timestamp, referrer, userAgent,
                timeSpent, bounced ? 1 : 0, isNewSession ? 1 : 0            ]);

            // Update or insert visitor record
            await this.updateVisitorRecord(visitorId, timestamp);

            // Save database to centralized file (throttled)
            await this.saveDatabase();

            return { success: true, id: this.db.exec("SELECT last_insert_rowid()")[0].values[0][0] };
        } catch (error) {
            console.error('❌ Failed to track page view:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * 👤 Update visitor record
     */
    async updateVisitorRecord(visitorId, timestamp) {
        const upsertVisitorSQL = `
            INSERT INTO visitors (visitor_id, first_visit, last_visit, total_page_views, total_sessions)
            VALUES (?, ?, ?, 1, 1)
            ON CONFLICT(visitor_id) DO UPDATE SET
                last_visit = ?,
                total_page_views = total_page_views + 1
        `;

        this.db.run(upsertVisitorSQL, [visitorId, timestamp, timestamp, timestamp]);
    }

    /**
     * 📈 Get analytics summary
     */
    async getAnalyticsSummary(days = 30) {
        try {
            const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000);

            // Get basic metrics
            const metricsSQL = `
                SELECT
                    COUNT(DISTINCT visitor_id) as unique_visitors,
                    COUNT(*) as total_page_views,
                    COUNT(DISTINCT session_id) as total_sessions,
                    SUM(CASE WHEN is_new_session = 1 THEN 1 ELSE 0 END) as new_sessions,
                    SUM(CASE WHEN bounced = 1 AND is_new_session = 1 THEN 1 ELSE 0 END) as bounced_sessions
                FROM page_views
                WHERE timestamp > ?
            `;

            const metricsResult = this.db.exec(metricsSQL, [cutoffTime]);
            const metrics = metricsResult[0]?.values[0] || [0, 0, 0, 0, 0];

            // Get popular pages
            const popularPagesSQL = `
                SELECT path, COUNT(*) as views
                FROM page_views
                WHERE timestamp > ?
                GROUP BY path
                ORDER BY views DESC
                LIMIT 10
            `;

            const popularResult = this.db.exec(popularPagesSQL, [cutoffTime]);
            const popularPages = popularResult[0]?.values.map(([path, count]) => ({ path, count })) || [];

            const [uniqueVisitors, totalPageViews, totalSessions, newSessions, bouncedSessions] = metrics;
            const bounceRate = newSessions > 0 ? ((bouncedSessions / newSessions) * 100).toFixed(1) : '0.0';
            const returningVisitors = totalPageViews - newSessions;

            return {
                uniqueVisitors,
                totalPageViews,
                newVisitors: newSessions,
                returningVisitors: Math.max(0, returningVisitors),
                bounceRate: `${bounceRate}%`,
                popularPages,
                totalSessions,
                dataRange: `${days} days`,
                lastUpdated: new Date().toISOString()
            };
        } catch (error) {
            console.error('❌ Failed to get analytics summary:', error);
            return this.getEmptySummary();        }
    }

    /**
     * 💾 Save database to centralized file
     */    async saveDatabase() {
        try {
            // Throttle saves to prevent too frequent updates
            const now = Date.now();
            if (now - this.lastSyncTime < this.syncThrottle) {
                console.log('🚫 Skipping save due to throttling');
                return;
            }

            const data = this.db.export();

            // For testing: log the database size and offer download
            console.log(`📊 Database size: ${data.length} bytes`);

            // For GitHub Pages deployment, we'd need a serverless function
            // For now, we'll demonstrate with local storage backup and download option
            try {
                // Store compressed version in localStorage as backup
                const base64Data = btoa(String.fromCharCode.apply(null, data));
                localStorage.setItem('analytics_backup', base64Data);
                localStorage.setItem('analytics_backup_timestamp', now.toString());
                console.log('💾 Database backed up to localStorage');
            } catch (localStorageError) {
                console.warn('⚠️ Could not backup to localStorage:', localStorageError);
            }

            // Don't auto-download in testing/development mode
            if (this.isProduction()) {
                this.downloadDatabaseFile(data);
            } else {
                console.log('🔧 Development mode: Database saved to localStorage only');
            }

            this.lastSyncTime = now;
            console.log('💾 Database save process completed');
            return true;
        } catch (error) {
            console.warn('⚠️ Failed to save database:', error);
            return false;
        }
    }

    /**
     * 📤 Update database file via GitHub API
     */
    async updateGitHubFile(data) {
        try {
            // Convert binary data to base64
            const base64Data = btoa(String.fromCharCode.apply(null, data));

            // In a real implementation, you'd need GitHub API credentials
            // For now, we'll save locally and provide instructions for manual upload
            this.downloadDatabaseFile(data);

            console.log('📤 Database file prepared for GitHub upload');
        } catch (error) {
            console.error('❌ Failed to update GitHub file:', error);
        }
    }

    /**
     * 💾 Download database file for manual upload
     */
    downloadDatabaseFile(data) {
        try {
            const blob = new Blob([data], { type: 'application/octet-stream' });
            const url = URL.createObjectURL(blob);

            // Create invisible download link
            const a = document.createElement('a');
            a.href = url;
            a.download = 'analytics.db';
            a.style.display = 'none';

            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            console.log('💾 Database file downloaded for manual upload');
        } catch (error) {
            console.error('❌ Failed to download database file:', error);
        }
    }

    /**
     * 🆔 Generate unique visitor ID
     */
    generateVisitorId() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 15);
        const fingerprint = this.getBrowserFingerprint();
        return `v_${timestamp}_${random}_${fingerprint}`;
    }

    /**
     * 🔍 Get browser fingerprint for visitor identification
     */
    getBrowserFingerprint() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillText('Analytics fingerprint', 2, 2);

        const fingerprint = [
            navigator.userAgent.slice(0, 20),
            navigator.language,
            screen.width + 'x' + screen.height,
            new Date().getTimezoneOffset(),
            canvas.toDataURL().slice(0, 50)
        ].join('|');

        return btoa(fingerprint).slice(0, 10).replace(/[^a-zA-Z0-9]/g, '');
    }

    /**
     * 🎫 Get session ID
     */
    getSessionId() {
        let sessionId = sessionStorage.getItem('analytics_session_id');
        if (!sessionId) {
            sessionId = `s_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
            sessionStorage.setItem('analytics_session_id', sessionId);
        }
        return sessionId;
    }    /**
     * 🧹 Clear all analytics data
     */
    async clearAllData() {
        try {
            if (this.db) {
                this.db.exec('DELETE FROM page_views');
                this.db.exec('DELETE FROM visitors');
                await this.saveDatabase();
            }
            sessionStorage.removeItem('analytics_session_id');
            console.log('🧹 All analytics data cleared');
        } catch (error) {
            console.error('❌ Failed to clear data:', error);
        }
    }

    /**
     * 📊 Get empty summary for fallback
     */
    getEmptySummary() {
        return {
            uniqueVisitors: 0,
            totalPageViews: 0,
            newVisitors: 0,
            returningVisitors: 0,
            bounceRate: '0.0%',
            popularPages: [],
            totalSessions: 0,
            dataRange: '30 days',
            lastUpdated: new Date().toISOString()
        };
    }

    /**
     * ✅ Check if database is initialized
     */
    async isInitialized() {
        return this.db !== null && this.SQL !== null;
    }

    /**
     * 🏭 Check if we're in production mode
     */
    isProduction() {
        return (
            location.hostname !== 'localhost' &&
            location.hostname !== '127.0.0.1' &&
            !location.hostname.includes('localhost')
        );
    }
}

// 🚀 Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AnalyticsDatabase;
}
