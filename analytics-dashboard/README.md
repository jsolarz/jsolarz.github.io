# Analytics Dashboard Project

This project is an analytics dashboard designed to track various metrics such as unique visitors, page views, new vs. returning visitors, bounce rate, and abandonment rate. The application is built using vanilla JavaScript, HTML, and CSS, ensuring GDPR compliance by utilizing SQLite for data handling without relying on cookies.

## Project Structure

```
analytics-dashboard
├── src
│   ├── index.html          # Main entry point of the application
│   ├── dashboard.html      # Structure for the analytics dashboard
│   ├── privacy.html        # Privacy policy and GDPR compliance information
│   ├── css
│   │   ├── style.css       # General styles for the application
│   │   ├── dashboard.css    # Styles specifically for the analytics dashboard
│   │   └── components.css   # Styles for reusable components
│   ├── js
│   │   ├── analytics.js     # Logic for tracking analytics data
│   │   ├── dashboard.js      # Functionality of the dashboard
│   │   ├── privacy.js        # Privacy policy page interactions
│   │   ├── storage.js        # Data storage and retrieval using SQLite
│   │   └── utils.js          # Utility functions
│   └── components
│       ├── privacy-banner.js  # Component for displaying a privacy banner
│       ├── metric-card.js     # Component for displaying individual metrics
│       └── chart.js           # Component for rendering charts
├── server
│   ├── app.js                # Main server file for Express application
│   ├── routes
│   │   ├── analytics.js       # Routes for handling analytics data requests
│   │   └── dashboard.js        # Routes for serving the dashboard page
│   ├── models
│   │   └── visitor.js         # Model for visitor data in SQLite
│   ├── middleware
│   │   ├── privacy.js         # Middleware for GDPR compliance
│   │   └── validation.js       # Middleware for validating incoming data
│   └── database
│       ├── schema.sql         # SQL schema for SQLite database
│       └── migrations
│           └── 001_initial.sql # Migration file for initializing the database
├── tests
│   ├── analytics.test.js      # Unit tests for analytics functionality
│   ├── dashboard.test.js      # Unit tests for dashboard functionality
│   └── privacy.test.js        # Unit tests for privacy interactions
├── docs
│   ├── privacy-policy.md      # Document outlining the privacy policy
│   └── gdpr-compliance.md     # Document detailing GDPR compliance
├── package.json               # Configuration file for npm
└── README.md                  # Documentation for the project
```

## Setup Instructions

1. **Clone the repository:**
   ```
   git clone <repository-url>
   cd analytics-dashboard
   ```

2. **Install dependencies:**
   ```
   npm install
   ```

3. **Set up the SQLite database:**
   - Run the SQL schema and migration files to initialize the database.

4. **Start the server:**
   ```
   node server/app.js
   ```

5. **Access the application:**
   - Open your browser and navigate to `http://localhost:3000` to view the analytics dashboard.

## Usage Guidelines

- The dashboard provides insights into visitor metrics and is designed to be user-friendly.
- Ensure that users are informed about data tracking practices through the privacy banner.
- Regularly review the privacy policy and GDPR compliance documents to stay updated on best practices.

## Contributing

Contributions are welcome! Please submit a pull request or open an issue for any enhancements or bug fixes.

## License

This project is licensed under the MIT License. See the LICENSE file for details.