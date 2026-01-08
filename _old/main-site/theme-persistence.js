/**
 * Theme Persistence Script
 * Add this script to the <head> of every page to ensure theme persistence
 * Place BEFORE any CSS files to prevent flash of incorrect theme
 */
(function() {
    'use strict';

    // Get saved theme from localStorage
    const savedTheme = localStorage.getItem('theme');

    // Apply theme immediately to prevent flash
    if (savedTheme === 'light') {
        // Add light-mode class to html element immediately
        document.documentElement.classList.add('light-mode');

        // When DOM is ready, also add to body
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() {
                document.body.classList.add('light-mode');
            });
        } else {
            // DOM is already ready
            if (document.body) {
                document.body.classList.add('light-mode');
            }
        }
    } else {
        // Ensure light-mode is removed (in case it was set by server-side rendering or cached)
        document.documentElement.classList.remove('light-mode');

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() {
                document.body.classList.remove('light-mode');
            });
        } else {
            if (document.body) {
                document.body.classList.remove('light-mode');
            }
        }
    }

    // Debug log (remove in production)
    console.log('Theme applied:', savedTheme || 'dark (default)');
})();
