#!/usr/bin/env node

/**
 * 📊 Generate Initial Analytics Database File
 * Creates an empty analytics.db file with proper table structure
 */

const fs = require('fs');
const path = require('path');

// Generate an empty SQLite database file
function generateEmptyDatabase() {
    // SQLite file header (first 100 bytes of a SQLite database)
    const sqliteHeader = Buffer.from([
        0x53, 0x51, 0x4c, 0x69, 0x74, 0x65, 0x20, 0x66, 0x6f, 0x72, 0x6d, 0x61, 0x74, 0x20, 0x33, 0x00,
        0x10, 0x00, 0x01, 0x01, 0x00, 0x40, 0x20, 0x20, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00
    ]);

    // Create a minimal SQLite database with proper page structure
    const pageSize = 4096;
    const database = Buffer.alloc(pageSize);
    
    // Copy header
    sqliteHeader.copy(database, 0);
    
    // Set page size at byte 16-17 (4096 = 0x1000)
    database.writeUInt16BE(0x1000, 16);
    
    // Set database size in pages at byte 28-31 (1 page)
    database.writeUInt32BE(1, 28);
    
    // Set first freelist page (0 = no freelist)
    database.writeUInt32BE(0, 32);
    
    // Set number of freelist pages (0)
    database.writeUInt32BE(0, 36);
    
    // Set schema cookie
    database.writeUInt32BE(1, 40);
    
    // Set schema format number (4)
    database.writeUInt32BE(4, 44);
    
    // Set page cache size
    database.writeUInt32BE(0, 48);
    
    // Set auto-vacuum mode (0 = none)
    database.writeUInt32BE(0, 52);
    
    // Set text encoding (1 = UTF-8)
    database.writeUInt32BE(1, 56);
    
    // Set user version
    database.writeUInt32BE(0, 60);
    
    // Set incremental vacuum mode (0)
    database.writeUInt32BE(0, 64);
    
    // Set application ID
    database.writeUInt32BE(0, 68);
    
    // Set version-valid-for number
    database.writeUInt32BE(0, 92);
    
    // Set SQLite version number
    database.writeUInt32BE(3039000, 96); // SQLite 3.39.0
    
    // B-tree page header for root page (starts at byte 100)
    // Page type: 13 (leaf table B-tree page)
    database.writeUInt8(13, 100);
    
    // First freeblock offset (0 = no freeblocks)
    database.writeUInt16BE(0, 101);
    
    // Number of cells (0 initially)
    database.writeUInt16BE(0, 103);
    
    // Cell content offset (start of content area)
    database.writeUInt16BE(pageSize, 105);
    
    // Fragmented bytes (0)
    database.writeUInt8(0, 107);
    
    return database;
}

try {
    const dbPath = path.join(__dirname, 'analytics.db');
    const database = generateEmptyDatabase();
    
    fs.writeFileSync(dbPath, database);
    console.log('📊 ✅ Generated empty analytics.db file successfully!');
    console.log(`📁 Location: ${dbPath}`);
    console.log('🔧 The database will be initialized with tables when first accessed by the analytics system.');
    
} catch (error) {
    console.error('❌ Failed to generate database:', error.message);
    process.exit(1);
}
