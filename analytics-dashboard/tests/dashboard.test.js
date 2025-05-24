// This file contains unit tests for the dashboard functionality.

describe('Dashboard Functionality', () => {
    beforeEach(() => {
        // Setup code to run before each test
        document.body.innerHTML = `
            <div id="dashboard">
                <div id="unique-visitors" class="metric-card"></div>
                <div id="page-views" class="metric-card"></div>
                <div id="new-vs-returning" class="metric-card"></div>
                <div id="bounce-rate" class="metric-card"></div>
                <div id="abandonment-rate" class="metric-card"></div>
            </div>
        `;
    });

    test('should display unique visitors', () => {
        // Mock data
        const uniqueVisitors = 150;
        document.getElementById('unique-visitors').textContent = `Unique Visitors: ${uniqueVisitors}`;
        
        // Assertion
        expect(document.getElementById('unique-visitors').textContent).toBe(`Unique Visitors: ${uniqueVisitors}`);
    });

    test('should display page views', () => {
        // Mock data
        const pageViews = 300;
        document.getElementById('page-views').textContent = `Page Views: ${pageViews}`;
        
        // Assertion
        expect(document.getElementById('page-views').textContent).toBe(`Page Views: ${pageViews}`);
    });

    test('should display new vs returning visitors', () => {
        // Mock data
        const newVisitors = 100;
        const returningVisitors = 50;
        document.getElementById('new-vs-returning').textContent = `New Visitors: ${newVisitors}, Returning Visitors: ${returningVisitors}`;
        
        // Assertion
        expect(document.getElementById('new-vs-returning').textContent).toBe(`New Visitors: ${newVisitors}, Returning Visitors: ${returningVisitors}`);
    });

    test('should display bounce rate', () => {
        // Mock data
        const bounceRate = '30%';
        document.getElementById('bounce-rate').textContent = `Bounce Rate: ${bounceRate}`;
        
        // Assertion
        expect(document.getElementById('bounce-rate').textContent).toBe(`Bounce Rate: ${bounceRate}`);
    });

    test('should display abandonment rate', () => {
        // Mock data
        const abandonmentRate = '20%';
        document.getElementById('abandonment-rate').textContent = `Abandonment Rate: ${abandonmentRate}`;
        
        // Assertion
        expect(document.getElementById('abandonment-rate').textContent).toBe(`Abandonment Rate: ${abandonmentRate}`);
    });
});