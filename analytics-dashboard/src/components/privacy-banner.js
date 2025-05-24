// This file contains the privacy banner component that informs users about data tracking practices in compliance with GDPR.

class PrivacyBanner {
    constructor() {
        this.banner = document.createElement('div');
        this.banner.className = 'privacy-banner';
        this.banner.innerHTML = `
            <p>
                We use cookies and similar technologies to track visitors and enhance your experience. 
                By continuing to use this site, you consent to our use of cookies. 
                <a href="privacy.html">Learn more</a>.
            </p>
            <button id="accept-cookies">Accept</button>
            <button id="decline-cookies">Decline</button>
        `;
        document.body.appendChild(this.banner);
        this.bindEvents();
    }

    bindEvents() {
        document.getElementById('accept-cookies').addEventListener('click', () => {
            this.acceptCookies();
        });

        document.getElementById('decline-cookies').addEventListener('click', () => {
            this.declineCookies();
        });
    }

    acceptCookies() {
        // Logic to handle cookie acceptance
        this.banner.style.display = 'none';
        console.log('Cookies accepted');
    }

    declineCookies() {
        // Logic to handle cookie decline
        this.banner.style.display = 'none';
        console.log('Cookies declined');
    }
}

// Initialize the PrivacyBanner component when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    new PrivacyBanner();
});