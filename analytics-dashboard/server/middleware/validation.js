// This file contains middleware for validating incoming data for analytics tracking.

const { body, validationResult } = require('express-validator');

// Validation rules for analytics data
const validateAnalyticsData = [
    body('uniqueVisitors').isInt({ gt: -1 }).withMessage('Unique visitors must be a non-negative integer.'),
    body('pageViews').isInt({ gt: -1 }).withMessage('Page views must be a non-negative integer.'),
    body('newVisitors').isInt({ gt: -1 }).withMessage('New visitors must be a non-negative integer.'),
    body('returningVisitors').isInt({ gt: -1 }).withMessage('Returning visitors must be a non-negative integer.'),
    body('bounceRate').isFloat({ min: 0, max: 100 }).withMessage('Bounce rate must be a percentage between 0 and 100.'),
    body('abandonmentRate').isFloat({ min: 0, max: 100 }).withMessage('Abandonment rate must be a percentage between 0 and 100.')
];

// Middleware to validate the request
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

module.exports = {
    validateAnalyticsData,
    validate
};