// This middleware checks for GDPR compliance before processing requests.

const express = require('express');
const router = express.Router();

// Middleware to check for GDPR compliance
const checkGDPRCompliance = (req, res, next) => {
    // Check if the user has accepted the privacy policy
    const hasAcceptedPrivacyPolicy = req.headers['accept-privacy-policy'] === 'true';

    if (!hasAcceptedPrivacyPolicy) {
        return res.status(403).json({
            message: 'You must accept the privacy policy to continue.'
        });
    }

    next();
};

// Apply the GDPR compliance check to all routes
router.use(checkGDPRCompliance);

module.exports = router;