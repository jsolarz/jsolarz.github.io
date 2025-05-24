const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const visitorRoutes = require('./routes/analytics');
const dashboardRoutes = require('./routes/dashboard');
const privacyMiddleware = require('./middleware/privacy');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(privacyMiddleware);
app.use(express.static(path.join(__dirname, '../src')));

// Database setup
const db = new sqlite3.Database('./database/analytics.db', (err) => {
    if (err) {
        console.error('Error opening database ' + err.message);
    } else {
        console.log('Connected to the SQLite database.');
    }
});

// Routes
app.use('/api/analytics', visitorRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Serve the main application
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../src/index.html'));
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});