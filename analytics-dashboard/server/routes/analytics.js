const express = require('express');
const router = express.Router();
const Visitor = require('../models/visitor');

// Route to track a new visit
router.post('/track', async (req, res) => {
    try {
        const { visitorId, isNewVisitor } = req.body;

        // Create or update visitor record
        const visitor = await Visitor.createOrUpdate(visitorId, isNewVisitor);
        
        res.status(200).json({
            message: 'Visitor tracked successfully',
            visitor
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error tracking visitor',
            error: error.message
        });
    }
});

// Route to get analytics data
router.get('/data', async (req, res) => {
    try {
        const analyticsData = await Visitor.getAnalytics();
        
        res.status(200).json(analyticsData);
    } catch (error) {
        res.status(500).json({
            message: 'Error retrieving analytics data',
            error: error.message
        });
    }
});

module.exports = router;