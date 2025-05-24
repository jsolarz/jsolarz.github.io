// This file defines the structure for visitor data stored in the SQLite database.

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./server/database/database.db');

// Visitor model
class Visitor {
    constructor(id, uniqueId, isReturning, pageViews, timestamp) {
        this.id = id;
        this.uniqueId = uniqueId; // Unique identifier for the visitor
        this.isReturning = isReturning; // Boolean indicating if the visitor is returning
        this.pageViews = pageViews; // Number of pages viewed by the visitor
        this.timestamp = timestamp; // Timestamp of the visit
    }

    // Save visitor data to the database
    static save(visitorData) {
        const { uniqueId, isReturning, pageViews, timestamp } = visitorData;
        return new Promise((resolve, reject) => {
            const sql = `INSERT INTO visitors (uniqueId, isReturning, pageViews, timestamp) VALUES (?, ?, ?, ?)`;
            db.run(sql, [uniqueId, isReturning, pageViews, timestamp], function (err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.lastID); // Return the ID of the newly inserted row
                }
            });
        });
    }

    // Get all visitors from the database
    static getAll() {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM visitors`;
            db.all(sql, [], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    // Close the database connection
    static close() {
        db.close();
    }
}

module.exports = Visitor;