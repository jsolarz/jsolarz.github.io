// src/js/utils.js

/**
 * Utility functions for the analytics dashboard.
 */

/**
 * Generates a unique identifier for visitors.
 * @returns {string} A unique identifier.
 */
function generateUniqueId() {
    return 'visitor-' + Math.random().toString(36).substr(2, 9);
}

/**
 * Formats a number with commas as thousands separators.
 * @param {number} num - The number to format.
 * @returns {string} The formatted number.
 */
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/**
 * Calculates the bounce rate.
 * @param {number} totalVisits - Total number of visits.
 * @param {number} bouncedVisits - Number of visits that bounced.
 * @returns {number} The bounce rate as a percentage.
 */
function calculateBounceRate(totalVisits, bouncedVisits) {
    if (totalVisits === 0) return 0;
    return (bouncedVisits / totalVisits) * 100;
}

/**
 * Calculates the abandonment rate.
 * @param {number} totalSessions - Total number of sessions.
 * @param {number} abandonedSessions - Number of sessions that were abandoned.
 * @returns {number} The abandonment rate as a percentage.
 */
function calculateAbandonmentRate(totalSessions, abandonedSessions) {
    if (totalSessions === 0) return 0;
    return (abandonedSessions / totalSessions) * 100;
}

// Exporting utility functions for use in other modules
export { generateUniqueId, formatNumber, calculateBounceRate, calculateAbandonmentRate };