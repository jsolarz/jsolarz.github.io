// src/components/metric-card.js

class MetricCard {
    constructor(metricName, metricValue) {
        this.metricName = metricName;
        this.metricValue = metricValue;
    }

    render() {
        const card = document.createElement('div');
        card.className = 'metric-card';

        const title = document.createElement('h3');
        title.textContent = this.metricName;

        const value = document.createElement('p');
        value.textContent = this.metricValue;

        card.appendChild(title);
        card.appendChild(value);

        return card;
    }
}

// Export the MetricCard class for use in other modules
export default MetricCard;