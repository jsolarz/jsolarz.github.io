// File: /analytics-dashboard/analytics-dashboard/src/js/dashboard.js

document.addEventListener('DOMContentLoaded', () => {
    const uniqueVisitorsElement = document.getElementById('unique-visitors');
    const pageViewsElement = document.getElementById('page-views');
    const newVsReturningElement = document.getElementById('new-vs-returning');
    const bounceRateElement = document.getElementById('bounce-rate');
    const abandonmentRateElement = document.getElementById('abandonment-rate');

    fetchAnalyticsData();

    function fetchAnalyticsData() {
        fetch('/api/analytics')
            .then(response => response.json())
            .then(data => {
                updateDashboard(data);
            })
            .catch(error => {
                console.error('Error fetching analytics data:', error);
            });
    }

    function updateDashboard(data) {
        uniqueVisitorsElement.textContent = data.uniqueVisitors;
        pageViewsElement.textContent = data.pageViews;
        newVsReturningElement.textContent = `New: ${data.newVisitors}, Returning: ${data.returningVisitors}`;
        bounceRateElement.textContent = `${data.bounceRate}%`;
        abandonmentRateElement.textContent = `${data.abandonmentRate}%`;
    }
});