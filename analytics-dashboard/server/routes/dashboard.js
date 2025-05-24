const express = require('express');
const router = express.Router();
const Visitor = require('../models/visitor');

// Route to get dashboard data
router.get('/', async (req, res) => {
    try {
        const uniqueVisitors = await Visitor.getUniqueVisitors();
        const pageViews = await Visitor.getPageViews();
        const newVisitors = await Visitor.getNewVisitors();
        const returningVisitors = await Visitor.getReturningVisitors();
        const bounceRate = await Visitor.getBounceRate();
        const abandonmentRate = await Visitor.getAbandonmentRate();

        res.json({
            uniqueVisitors,
            pageViews,
            newVisitors,
            returningVisitors,
            bounceRate,
            abandonmentRate
        });
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;