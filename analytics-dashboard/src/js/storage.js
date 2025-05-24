// This file handles data storage and retrieval using SQLite, ensuring GDPR compliance by avoiding cookies.

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Initialize the SQLite database
const dbPath = path.resolve(__dirname, '../database/analytics.db');
const db = new sqlite3.Database(dbPath);

// Function to create the visitors table if it doesn't exist
function createVisitorsTable() {
    const sql = `
        CREATE TABLE IF NOT EXISTS visitors (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            unique_id TEXT NOT NULL,
            visit_date TEXT NOT NULL,
            is_returning INTEGER NOT NULL
        )
    `;
    db.run(sql, (err) => {
        if (err) {
            console.error('Error creating visitors table:', err.message);
        }
    });
}

// Function to add a new visitor
function addVisitor(uniqueId, isReturning) {
    const sql = `
        INSERT INTO visitors (unique_id, visit_date, is_returning)
        VALUES (?, ?, ?)
    `;
    const visitDate = new Date().toISOString();
    db.run(sql, [uniqueId, visitDate, isReturning ? 1 : 0], (err) => {
        if (err) {
            console.error('Error adding visitor:', err.message);
        }
    });
}

// Function to get visitor metrics
function getVisitorMetrics(callback) {
    const metrics = {
        uniqueVisitors: 0,
        pageViews: 0,
        newVisitors: 0,
        returningVisitors: 0,
        bounceRate: 0,
        abandonmentRate: 0,
    };

    // Count unique visitors
    db.get('SELECT COUNT(DISTINCT unique_id) AS count FROM visitors', (err, row) => {
        if (!err) {
            metrics.uniqueVisitors = row.count;
        }

        // Count total page views
        db.get('SELECT COUNT(*) AS count FROM visitors', (err, row) => {
            if (!err) {
                metrics.pageViews = row.count;
            }

            // Count new vs returning visitors
            db.get('SELECT COUNT(*) AS count FROM visitors WHERE is_returning = 0', (err, row) => {
                if (!err) {
                    metrics.newVisitors = row.count;
                }

                db.get('SELECT COUNT(*) AS count FROM visitors WHERE is_returning = 1', (err, row) => {
                    if (!err) {
                        metrics.returningVisitors = row.count;
                    }

                    // Calculate bounce and abandonment rates (dummy values for now)
                    metrics.bounceRate = (metrics.newVisitors / metrics.pageViews) * 100 || 0;
                    metrics.abandonmentRate = (metrics.returningVisitors / metrics.pageViews) * 100 || 0;

                    callback(metrics);
                });
            });
        });
    });
}

// Create the visitors table on module load
createVisitorsTable();

// Export functions for use in other modules
module.exports = {
    addVisitor,
    getVisitorMetrics,
};