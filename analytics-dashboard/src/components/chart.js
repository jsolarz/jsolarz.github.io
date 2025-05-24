// This file contains the chart component responsible for rendering charts to visualize analytics data.

class Chart {
    constructor(canvasId, data, options) {
        this.canvasId = canvasId;
        this.data = data;
        this.options = options;
        this.chart = null;
    }

    // Initialize the chart
    init() {
        const ctx = document.getElementById(this.canvasId).getContext('2d');
        this.chart = new ChartJS(ctx, {
            type: 'line', // Change to desired chart type
            data: this.data,
            options: this.options
        });
    }

    // Update the chart with new data
    update(data) {
        this.chart.data = data;
        this.chart.update();
    }

    // Destroy the chart instance
    destroy() {
        if (this.chart) {
            this.chart.destroy();
        }
    }
}

// Export the Chart class for use in other modules
export default Chart;