// This file manages the privacy policy page interactions, ensuring GDPR compliance and user awareness.

document.addEventListener('DOMContentLoaded', () => {
    const privacyBanner = document.getElementById('privacy-banner');
    const acceptButton = document.getElementById('accept-privacy');
    const declineButton = document.getElementById('decline-privacy');

    // Check if the user has already accepted the privacy policy
    const hasAcceptedPrivacy = localStorage.getItem('privacyAccepted');

    if (!hasAcceptedPrivacy) {
        privacyBanner.style.display = 'block'; // Show the privacy banner
    }

    // Event listener for accepting the privacy policy
    acceptButton.addEventListener('click', () => {
        localStorage.setItem('privacyAccepted', 'true'); // Store acceptance in local storage
        privacyBanner.style.display = 'none'; // Hide the banner
    });

    // Event listener for declining the privacy policy
    declineButton.addEventListener('click', () => {
        alert('You have declined the privacy policy. Some features may not work as intended.'); // Alert user
        privacyBanner.style.display = 'none'; // Hide the banner
    });
});