// NASDAQ 100 Narrative Visualization
// Reorganized with scene-based architecture for better story flow

class NarrativeVisualization {
    constructor() {
        // Parameters (state variables)
        this.currentScene = 1;
        this.totalScenes = 6;
        this.currentTimeframe = '1Month';
        this.currentChartType = 'line';
        this.currentData = null;
        this.isAutoPlaying = false;
        this.selectedPeriod = null;
        
        // D3 setup
        this.margin = { top: 50, right: 50, bottom: 80, left: 80 };
        this.width = 1200 - this.margin.left - this.margin.right;
        this.height = 500 - this.margin.top - this.margin.bottom;
        
        // Chart elements
        this.svg = null;
        this.chart = null;
        this.xScale = null;
        this.yScale = null;
        this.xAxis = null;
        this.yAxis = null;
        
        // Scene configurations
        this.scenes = this.initializeScenes();
        
        // Initialize
        this.init();
    }
    
    initializeScenes() {
        return {
            1: {
                name: "Market Overview (2017-2025)",
                description: "A comprehensive view of the NASDAQ 100's journey with key milestones",
                timeframe: "1Month",
                chartType: "line",
                dataFilter: null, // Show all data
                annotations: this.addScene1Annotations.bind(this),
                setup: this.setupScene1.bind(this)
            },
            2: {
                name: "COVID-19 Crash (March-May 2020)",
                description: "The pandemic's dramatic impact on tech markets",
                timeframe: "1d",
                chartType: "candlestick",
                dataFilter: (data) => data.filter(d => 
                    d.date.getFullYear() === 2020 && 
                    d.date.getMonth() >= 2 && d.date.getMonth() <= 5),
                annotations: this.addScene2Annotations.bind(this),
                setup: this.setupScene2.bind(this)
            },
            3: {
                name: "Tech Boom Peak (2021)",
                description: "The peak of the tech boom before correction",
                timeframe: "1w",
                chartType: "area",
                dataFilter: (data) => data.filter(d => d.date.getFullYear() === 2021),
                annotations: this.addScene3Annotations.bind(this),
                setup: this.setupScene3.bind(this)
            },
            4: {
                name: "Market Correction (2022)",
                description: "Rising rates and inflation concerns",
                timeframe: "1d",
                chartType: "candlestick",
                dataFilter: (data) => data.filter(d => d.date.getFullYear() === 2022),
                annotations: this.addScene4Annotations.bind(this),
                setup: this.setupScene4.bind(this)
            },
            5: {
                name: "AI Revolution (2023-2025)",
                description: "The AI boom driving tech growth",
                timeframe: "1Month",
                chartType: "line",
                dataFilter: (data) => data.filter(d => d.date.getFullYear() >= 2023),
                annotations: this.addScene5Annotations.bind(this),
                setup: this.setupScene5.bind(this)
            },
            6: {
                name: "Future Outlook",
                description: "What's next for the NASDAQ 100?",
                timeframe: "1Month",
                chartType: "line",
                dataFilter: null, // Show all data for comparison
                annotations: this.addScene6Annotations.bind(this),
                setup: this.setupScene6.bind(this)
            }
        };
    }
    
    init() {
        this.setupChart();
        this.setupEventListeners();
        this.loadInitialData();
    }
    
    setupChart() {
        // Clear existing content
        d3.select('#chartContainer').html('');
        
        // Create SVG
        this.svg = d3.select('#chartContainer')
            .append('svg')
            .attr('width', this.width + this.margin.left + this.margin.right)
            .attr('height', this.height + this.margin.top + this.margin.bottom);
        
        // Create chart group with zoom capability
        this.chart = this.svg.append('g')
            .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`);
        
        // Add zoom behavior
        this.zoom = d3.zoom()
            .scaleExtent([0.5, 5])
            .on('zoom', (event) => {
                this.chart.attr('transform', event.transform);
            });
        
        this.svg.call(this.zoom);
        
        // Add zoom controls
        this.addZoomControls();
        
        // Create scales
        this.xScale = d3.scaleTime()
            .range([0, this.width]);
        
        this.yScale = d3.scaleLinear()
            .range([this.height, 0]);
        
        // Create axes
        this.xAxis = d3.axisBottom(this.xScale)
            .tickFormat(d3.timeFormat('%Y-%m'));
        
        this.yAxis = d3.axisLeft(this.yScale)
            .tickFormat(d => d3.format(',.0f')(d));
        
        // Add axes to chart
        this.chart.append('g')
            .attr('class', 'x-axis')
            .attr('transform', `translate(0, ${this.height})`);
        
        this.chart.append('g')
            .attr('class', 'y-axis');
        
        // Add axis labels
        this.chart.append('text')
            .attr('class', 'x-label')
            .attr('text-anchor', 'middle')
            .attr('x', this.width / 2)
            .attr('y', this.height + 50)
            .style('font-size', '14px')
            .style('fill', '#666')
            .text('Date');
        
        this.chart.append('text')
            .attr('class', 'y-label')
            .attr('text-anchor', 'middle')
            .attr('transform', 'rotate(-90)')
            .attr('x', -this.height / 2)
            .attr('y', -50)
            .style('font-size', '14px')
            .style('fill', '#666')
            .text('NASDAQ 100 Index');
    }
    
    setupEventListeners() {
        // Navigation buttons
        d3.select('#prevScene').on('click', () => this.previousScene());
        d3.select('#nextScene').on('click', () => this.nextScene());
        
        // Control changes
        d3.select('#timeframe').on('change', (event) => {
            this.currentTimeframe = event.target.value;
            this.loadData();
        });
        
        d3.select('#chartType').on('change', (event) => {
            this.currentChartType = event.target.value;
            this.updateChart();
        });
        
        // Auto play
        d3.select('#autoPlay').on('click', () => this.toggleAutoPlay());
        
        // Progress dots
        d3.selectAll('.progress-dot').on('click', (event) => {
            const scene = parseInt(event.target.dataset.scene);
            this.goToScene(scene);
        });
    }
    
    async loadInitialData() {
        await this.loadData();
        this.updateScene();
    }
    
    async loadData() {
        try {
            console.log(`Attempting to load: NASDAQ_100/${this.currentTimeframe}_data.csv`);
            const response = await fetch(`../NASDAQ_100/${this.currentTimeframe}_data.csv`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const csvText = await response.text();
            console.log(`Loaded ${csvText.length} characters of CSV data`);
            
            this.currentData = this.parseCSV(csvText);
            console.log(`Parsed ${this.currentData.length} data points`);
            
            this.updateChart();
        } catch (error) {
            console.error('Error loading data:', error);
            this.showError(`Failed to load data: ${error.message}. 
                          Make sure you're running this through a web server (http://localhost:8000) 
                          and not opening the file directly.`);
        }
    }
    
    parseCSV(csvText) {
        // Parse tab-separated values instead of comma-separated
        const rows = d3.tsvParse(csvText);
        
        console.log('CSV headers:', Object.keys(rows[0] || {}));
        console.log('First row:', rows[0]);
        
        return rows.map(row => {
            // Handle potential missing or undefined values
            if (!row.DateTime) {
                console.error('Missing DateTime in row:', row);
                return null;
            }
            
            return {
                date: new Date(row.DateTime.replace(/\./g, '-')),
                open: +row.Open || 0,
                high: +row.High || 0,
                low: +row.Low || 0,
                close: +row.Close || 0,
                volume: +row.Volume || 0,
                tickVolume: +row.TickVolume || 0
            };
        }).filter(d => d !== null).sort((a, b) => a.date - b.date);
    }
    
    updateChart() {
        if (!this.currentData || this.currentData.length === 0) return;
        
        // Apply scene-specific data filtering
        const scene = this.scenes[this.currentScene];
        const filteredData = scene.dataFilter ? scene.dataFilter(this.currentData) : this.currentData;
        
        if (filteredData.length === 0) {
            console.warn('No data available for current scene filter');
            return;
        }
        
        // Update scales with better padding
        this.xScale.domain(d3.extent(filteredData, d => d.date));
        
        // Add more padding to y-scale to prevent data points from being cut off
        const yMin = d3.min(filteredData, d => d.low);
        const yMax = d3.max(filteredData, d => d.high);
        const yRange = yMax - yMin;
        
        this.yScale.domain([
            yMin - (yRange * 0.05), // 5% padding below
            yMax + (yRange * 0.05)  // 5% padding above
        ]);
        
        // Update axes
        this.chart.select('.x-axis').call(this.xAxis);
        this.chart.select('.y-axis').call(this.yAxis);
        
        // Clear existing chart elements AND annotations
        this.chart.selectAll('.chart-element').remove();
        this.chart.selectAll('.milestone-card').remove();
        this.chart.selectAll('.submilestone').remove();
        this.chart.selectAll('.chart-title').remove();
        this.chart.selectAll('.summary-stats').remove();
        this.chart.selectAll('.trend-analysis').remove();
        this.chart.selectAll('.ma-legend').remove();
        this.chart.selectAll('.future-outlook').remove();
        this.chart.selectAll('.covid-summary').remove();
        
        // Additional cleanup for any remaining text elements that might be titles
        this.chart.selectAll('text').filter(function() {
            const text = d3.select(this).text();
            return text && (text.includes('NASDAQ') || text.includes('COVID') || text.includes('Tech') || 
                           text.includes('Market') || text.includes('AI') || text.includes('Future') ||
                           text.includes('Overview') || text.includes('Crash') || text.includes('Peak') ||
                           text.includes('Correction') || text.includes('Revolution') || text.includes('Outlook'));
        }).remove();
        
        // Remove any text elements that are positioned near the top (likely titles)
        this.chart.selectAll('text').filter(function() {
            const y = d3.select(this).attr('y');
            return y && parseInt(y) < 0; // Remove text positioned above the chart area
        }).remove();
        
        // Draw chart based on type
        switch (this.currentChartType) {
            case 'line':
                this.drawLineChart(filteredData);
                break;
            case 'candlestick':
                this.drawCandlestickChart(filteredData);
                break;
            case 'area':
                this.drawAreaChart(filteredData);
                break;
        }
        
        // Add scene-specific annotations
        scene.annotations();
        
        // Add tooltip
        this.addTooltip();
    }
    
    drawLineChart(data) {
        // Add gradient definition
        const gradient = this.svg.append('defs')
            .append('linearGradient')
            .attr('id', 'lineGradient')
            .attr('gradientUnits', 'userSpaceOnUse');
        
        gradient.append('stop')
            .attr('offset', '0%')
            .attr('stop-color', '#007bff')
            .attr('stop-opacity', 0.8);
        
        gradient.append('stop')
            .attr('offset', '100%')
            .attr('stop-color', '#0056b3')
            .attr('stop-opacity', 1);
        
        // Create the line
        const line = d3.line()
            .x(d => this.xScale(d.date))
            .y(d => this.yScale(d.close))
            .curve(d3.curveMonotoneX);
        
        // Add area under the line
        const area = d3.area()
            .x(d => this.xScale(d.date))
            .y0(this.height)
            .y1(d => this.yScale(d.close))
            .curve(d3.curveMonotoneX);
        
        this.chart.append('path')
            .datum(data)
            .attr('class', 'chart-element area-fill')
            .attr('fill', 'url(#lineGradient)')
            .attr('opacity', 0.1)
            .attr('d', area);
        
        // Add the main line
        this.chart.append('path')
            .datum(data)
            .attr('class', 'chart-element line')
            .attr('fill', 'none')
            .attr('stroke', 'url(#lineGradient)')
            .attr('stroke-width', 3)
            .attr('d', line);
        
        // Add data points
        this.chart.selectAll('.data-point')
            .data(data)
            .enter()
            .append('circle')
            .attr('class', 'chart-element data-point')
            .attr('cx', d => this.xScale(d.date))
            .attr('cy', d => this.yScale(d.close))
            .attr('r', 3)
            .attr('fill', '#007bff')
            .attr('stroke', 'white')
            .attr('stroke-width', 1);
        
        // Add moving averages
        this.addMovingAverages(data);
        
        // Add trend lines
        this.addTrendLines(data);
    }
    
    drawCandlestickChart(data) {
        const candlesticks = this.chart.selectAll('.candlestick')
            .data(data)
            .enter()
            .append('g')
            .attr('class', 'chart-element candlestick');
        
        // Draw wicks
        candlesticks.append('line')
            .attr('x1', d => this.xScale(d.date))
            .attr('x2', d => this.xScale(d.date))
            .attr('y1', d => this.yScale(d.high))
            .attr('y2', d => this.yScale(d.low))
            .attr('stroke', '#666')
            .attr('stroke-width', 1);
        
        // Draw bodies
        candlesticks.append('rect')
            .attr('x', d => this.xScale(d.date) - 2)
            .attr('y', d => this.yScale(Math.max(d.open, d.close)))
            .attr('width', 4)
            .attr('height', d => Math.abs(this.yScale(d.open) - this.yScale(d.close)))
            .attr('fill', d => d.close >= d.open ? '#28a745' : '#dc3545')
            .attr('stroke', '#666');
    }
    
    drawAreaChart(data) {
        const area = d3.area()
            .x(d => this.xScale(d.date))
            .y0(this.height)
            .y1(d => this.yScale(d.close))
            .curve(d3.curveMonotoneX);
        
        this.chart.append('path')
            .datum(data)
            .attr('class', 'chart-element area')
            .attr('fill', 'url(#areaGradient)')
            .attr('d', area);
        
        // Add gradient
        const gradient = this.svg.append('defs')
            .append('linearGradient')
            .attr('id', 'areaGradient')
            .attr('gradientUnits', 'userSpaceOnUse');
        
        gradient.append('stop')
            .attr('offset', '0%')
            .attr('stop-color', '#007bff')
            .attr('stop-opacity', 0.8);
        
        gradient.append('stop')
            .attr('offset', '100%')
            .attr('stop-color', '#007bff')
            .attr('stop-opacity', 0.1);
    }
    
    // Scene-specific annotation methods
    addScene1Annotations() {
        this.addTitleAnnotation("NASDAQ 100: Market Overview (2017-2025)");
        this.addSummaryStats();
        this.addTrendAnalysis();
        this.addMilestoneCards();
    }
    
    addScene2Annotations() {
        this.addTitleAnnotation("COVID-19 Crash (March-May 2020)");
        this.addCovidSubmilestones();
    }
    
    addScene3Annotations() {
        this.addTitleAnnotation("Tech Boom Peak (2021)");
        this.addBoomSubmilestones();
    }
    
    addScene4Annotations() {
        this.addTitleAnnotation("Market Correction (2022)");
        this.addCorrectionSubmilestones();
    }
    
    addScene5Annotations() {
        this.addTitleAnnotation("AI Revolution (2023-2025)");
        this.addAISubmilestones();
    }
    
    addScene6Annotations() {
        this.addTitleAnnotation("Future Outlook");
        this.addFutureOutlook();
    }
    
    // Scene setup methods
    setupScene1() {
        this.currentTimeframe = '1Month';
        this.currentChartType = 'line';
        d3.select('#timeframe').property('value', '1Month');
        d3.select('#chartType').property('value', 'line');
        this.loadData();
    }
    
    setupScene2() {
        this.currentTimeframe = '1d';
        this.currentChartType = 'candlestick';
        d3.select('#timeframe').property('value', '1d');
        d3.select('#chartType').property('value', 'candlestick');
        this.loadData();
        
        // Ensure we're showing the COVID period data
        const covidData = this.currentData.filter(d => 
            d.date.getFullYear() === 2020 && 
            d.date.getMonth() >= 2 && d.date.getMonth() <= 5);
        
        if (covidData.length > 0) {
            // Update scales for COVID period
            this.xScale.domain(d3.extent(covidData, d => d.date));
            const yMin = d3.min(covidData, d => d.low);
            const yMax = d3.max(covidData, d => d.high);
            const yRange = yMax - yMin;
            this.yScale.domain([
                yMin - (yRange * 0.1),
                yMax + (yRange * 0.1)
            ]);
            
            // Update axes
            this.chart.select('.x-axis').call(this.xAxis);
            this.chart.select('.y-axis').call(this.yAxis);
        }
    }
    
    setupScene3() {
        this.currentTimeframe = '1d';
        this.currentChartType = 'candlestick';
        d3.select('#timeframe').property('value', '1d');
        d3.select('#chartType').property('value', 'candlestick');
        this.loadData();
    }
    
    setupScene4() {
        this.currentTimeframe = '1w';
        this.currentChartType = 'area';
        d3.select('#timeframe').property('value', '1w');
        d3.select('#chartType').property('value', 'area');
        this.loadData();
    }
    
    setupScene5() {
        this.currentTimeframe = '1d';
        this.currentChartType = 'candlestick';
        d3.select('#timeframe').property('value', '1d');
        d3.select('#chartType').property('value', 'candlestick');
        this.loadData();
    }
    
    setupScene6() {
        this.currentTimeframe = '1Month';
        this.currentChartType = 'line';
        d3.select('#timeframe').property('value', '1Month');
        d3.select('#chartType').property('value', 'line');
        this.loadData();
    }
    
    // Navigation methods
    updateScene() {
        // Update progress indicators
        d3.selectAll('.progress-dot').classed('active', false);
        d3.select(`[data-scene="${this.currentScene}"]`).classed('active', true);
        
        // Update navigation buttons
        d3.select('#prevScene').property('disabled', this.currentScene === 1);
        d3.select('#nextScene').property('disabled', this.currentScene === this.totalScenes);
        
        // Update scene-specific content
        const scene = this.scenes[this.currentScene];
        if (scene && scene.setup) {
            scene.setup();
        }
        
        // Update header
        this.updateSceneHeader();
    }
    
    updateSceneHeader() {
        const scene = this.scenes[this.currentScene];
        d3.select('.header h1').text(scene.name);
        d3.select('.header p').text(scene.description);
    }
    
    previousScene() {
        if (this.currentScene > 1) {
            this.currentScene--;
            this.updateScene();
        }
    }
    
    nextScene() {
        if (this.currentScene < this.totalScenes) {
            this.currentScene++;
            this.updateScene();
        }
    }
    
    goToScene(scene) {
        this.currentScene = scene;
        this.updateScene();
    }
    
    // Continue with existing utility methods...
    addTitleAnnotation(title) {
        const titleElement = this.chart.append('text')
            .attr('class', 'chart-title')
            .attr('x', this.width / 2)
            .attr('y', -20)
            .attr('text-anchor', 'middle')
            .style('font-size', '18px')
            .style('font-weight', 'bold')
            .style('fill', '#333')
            .text(title);
    }
    
    addSummaryStats() {
        const stats = this.calculateSummaryStats();
        
        const statsGroup = this.chart.append('g')
            .attr('class', 'summary-stats')
            .attr('transform', `translate(10, 20)`);
        
        // Add background for better readability
        statsGroup.append('rect')
            .attr('width', 140)
            .attr('height', 70)
            .attr('rx', 5)
            .attr('fill', 'rgba(255, 255, 255, 0.95)')
            .attr('stroke', '#333')
            .attr('stroke-width', 2);
        
        statsGroup.append('text')
            .attr('class', 'stats-title')
            .attr('x', 10)
            .attr('y', 15)
            .style('font-size', '11px')
            .style('font-weight', 'bold')
            .style('fill', '#333')
            .text('Summary:');
        
        statsGroup.append('text')
            .attr('class', 'stats-line1')
            .attr('x', 10)
            .attr('y', 30)
            .style('font-size', '9px')
            .style('fill', '#666')
            .text(`Peak: ${stats.peak.toLocaleString()}`);
        
        statsGroup.append('text')
            .attr('class', 'stats-line2')
            .attr('x', 10)
            .attr('y', 43)
            .style('font-size', '9px')
            .style('fill', '#666')
            .text(`Low: ${stats.low.toLocaleString()}`);
        
        statsGroup.append('text')
            .attr('class', 'stats-line3')
            .attr('x', 10)
            .attr('y', 56)
            .style('font-size', '9px')
            .style('fill', '#666')
            .text(`Current: ${stats.current.toLocaleString()}`);
    }
    
    calculateSummaryStats() {
        const values = this.currentData.map(d => d.close);
        return {
            peak: Math.max(...values),
            low: Math.min(...values),
            current: values[values.length - 1],
            avg: d3.mean(values)
        };
    }
    
    addMovingAverages(data) {
        // Calculate 6-month moving average
        const movingAverage6 = this.calculateMovingAverage(data, 6);
        const movingAverage12 = this.calculateMovingAverage(data, 12);
        
        // Draw 6-month moving average
        const line6 = d3.line()
            .x(d => this.xScale(d.date))
            .y(d => this.yScale(d.ma))
            .curve(d3.curveMonotoneX);
        
        this.chart.append('path')
            .datum(movingAverage6)
            .attr('class', 'chart-element ma-line')
            .attr('fill', 'none')
            .attr('stroke', '#ff6b35')
            .attr('stroke-width', 2)
            .attr('stroke-dasharray', '5,5')
            .attr('d', line6);
        
        // Draw 12-month moving average
        const line12 = d3.line()
            .x(d => this.xScale(d.date))
            .y(d => this.yScale(d.ma))
            .curve(d3.curveMonotoneX);
        
        this.chart.append('path')
            .datum(movingAverage12)
            .attr('class', 'chart-element ma-line')
            .attr('fill', 'none')
            .attr('stroke', '#6a4c93')
            .attr('stroke-width', 2)
            .attr('stroke-dasharray', '10,5')
            .attr('d', line12);
        
        // Add legend
        this.addMovingAverageLegend();
    }
    
    calculateMovingAverage(data, period) {
        const result = [];
        for (let i = period - 1; i < data.length; i++) {
            const slice = data.slice(i - period + 1, i + 1);
            const avg = d3.mean(slice, d => d.close);
            result.push({
                date: data[i].date,
                ma: avg
            });
        }
        return result;
    }
    
    addMovingAverageLegend() {
        // Position legend in top-right corner with better background
        const legend = this.chart.append('g')
            .attr('class', 'ma-legend')
            .attr('transform', `translate(${this.width - 120}, 20)`);
        
        // Add background rectangle for better readability
        legend.append('rect')
            .attr('width', 110)
            .attr('height', 50)
            .attr('rx', 5)
            .attr('fill', 'rgba(255, 255, 255, 0.9)')
            .attr('stroke', '#dee2e6')
            .attr('stroke-width', 1);
        
        // 6-month MA legend
        legend.append('line')
            .attr('x1', 10)
            .attr('x2', 30)
            .attr('y1', 15)
            .attr('y2', 15)
            .attr('stroke', '#ff6b35')
            .attr('stroke-width', 2)
            .attr('stroke-dasharray', '5,5');
        
        legend.append('text')
            .attr('x', 35)
            .attr('y', 19)
            .style('font-size', '10px')
            .style('fill', '#333')
            .style('font-weight', '500')
            .text('6-Month MA');
        
        // 12-month MA legend
        legend.append('line')
            .attr('x1', 10)
            .attr('x2', 30)
            .attr('y1', 35)
            .attr('y2', 35)
            .attr('stroke', '#6a4c93')
            .attr('stroke-width', 2)
            .attr('stroke-dasharray', '10,5');
        
        legend.append('text')
            .attr('x', 35)
            .attr('y', 39)
            .style('font-size', '10px')
            .style('fill', '#333')
            .style('font-weight', '500')
            .text('12-Month MA');
    }
    
    addTrendLines(data) {
        // Add support and resistance lines
        const supportLevel = d3.min(data, d => d.low) * 0.95;
        const resistanceLevel = d3.max(data, d => d.high) * 1.05;
        
        // Support line
        this.chart.append('line')
            .attr('class', 'chart-element trend-line')
            .attr('x1', 0)
            .attr('x2', this.width)
            .attr('y1', this.yScale(supportLevel))
            .attr('y2', this.yScale(supportLevel))
            .attr('stroke', '#dc3545')
            .attr('stroke-width', 1)
            .attr('stroke-dasharray', '3,3')
            .attr('opacity', 0.6);
        
        // Resistance line
        this.chart.append('line')
            .attr('class', 'chart-element trend-line')
            .attr('x1', 0)
            .attr('x2', this.width)
            .attr('y1', this.yScale(resistanceLevel))
            .attr('y2', this.yScale(resistanceLevel))
            .attr('stroke', '#28a745')
            .attr('stroke-width', 1)
            .attr('stroke-dasharray', '3,3')
            .attr('opacity', 0.6);
        
        // Add trend line labels
        this.chart.append('text')
            .attr('x', this.width - 5)
            .attr('y', this.yScale(supportLevel) - 5)
            .attr('text-anchor', 'end')
            .style('font-size', '10px')
            .style('fill', '#dc3545')
            .text('Support');
        
        this.chart.append('text')
            .attr('x', this.width - 5)
            .attr('y', this.yScale(resistanceLevel) + 15)
            .attr('text-anchor', 'end')
            .style('font-size', '10px')
            .style('fill', '#28a745')
            .text('Resistance');
    }
    
    addTrendAnalysis() {
        // Calculate overall trend
        const firstValue = this.currentData[0].close;
        const lastValue = this.currentData[this.currentData.length - 1].close;
        const totalGrowth = ((lastValue - firstValue) / firstValue * 100).toFixed(1);
        
        // Add background for better readability
        const trendGroup = this.chart.append('g')
            .attr('class', 'trend-analysis')
            .attr('transform', `translate(${this.width - 120}, 80)`);
        
        trendGroup.append('rect')
            .attr('width', 110)
            .attr('height', 30)
            .attr('rx', 5)
            .attr('fill', 'rgba(255, 255, 255, 0.95)')
            .attr('stroke', '#333')
            .attr('stroke-width', 2);
        
        trendGroup.append('text')
            .attr('x', 55)
            .attr('y', 20)
            .attr('text-anchor', 'middle')
            .style('font-size', '12px')
            .style('font-weight', 'bold')
            .style('fill', totalGrowth >= 0 ? '#28a745' : '#dc3545')
            .text(`Growth: ${totalGrowth}%`);
    }
    
    // Scene-specific annotation methods

    
    addMilestoneCards() {
        // Only show milestone cards on Scene 1 (overview)
        const milestones = this.findKeyMilestones();
        
        milestones.forEach((milestone, index) => {
            this.addMilestoneCard(milestone, index);
        });
    }
    
    findKeyMilestones() {
        const milestones = [];
        
        // COVID-19 Crash (March 2020)
        const covidCrash = this.currentData.find(d => 
            d.date.getFullYear() === 2020 && d.date.getMonth() === 2);
        if (covidCrash) {
            milestones.push({
                data: covidCrash,
                title: 'COVID-19 Crash',
                description: 'March 2020: The pandemic caused a sharp 30% decline, followed by unprecedented recovery fueled by tech growth.',
                color: '#dc3545',
                type: 'crash',
                position: { x: -200, y: -100 } // Easy to adjust position
            });
        }
        
        // Tech Boom Peak (December 2021)
        const techPeak = this.currentData.find(d => 
            d.date.getFullYear() === 2021 && d.date.getMonth() === 11);
        if (techPeak) {
            milestones.push({
                data: techPeak,
                title: 'Tech Boom Peak',
                description: 'December 2021: NASDAQ reaches all-time high before the 2022 correction.',
                color: '#ffc107',
                type: 'peak',
                position: { x: -150, y: -70 } // Easy to adjust position
            });
        }
        
        // AI Revolution (January 2023)
        const aiBoom = this.currentData.find(d => 
            d.date.getFullYear() === 2023 && d.date.getMonth() === 0);
        if (aiBoom) {
            milestones.push({
                data: aiBoom,
                title: 'AI Revolution Begins',
                description: 'January 2023: AI technologies drive massive growth in tech stocks, particularly AI-related companies.',
                color: '#28a745',
                type: 'boom',
                position: { x: -50, y: 30 } // Easy to adjust position
            });
        }
        
        return milestones;
    }
    
    addMilestoneCard(milestone, index) {
        const xPos = this.xScale(milestone.data.date);
        const yPos = this.yScale(milestone.data.close);
        
        // Use configurable position from milestone object
        const offsetX = milestone.position.x;
        const offsetY = milestone.position.y;
        
        const annotation = this.chart.append('g')
            .attr('class', 'milestone-card')
            .attr('transform', `translate(${xPos}, ${yPos})`)
            .style('cursor', 'pointer')
            .on('click', () => this.bringCardToFront(annotation));
        
        // Add milestone marker
        annotation.append('circle')
            .attr('r', 8)
            .attr('fill', milestone.color)
            .attr('stroke', 'white')
            .attr('stroke-width', 3)
            .attr('class', 'milestone-marker');
        
        // Add card box
        const cardBox = annotation.append('g')
            .attr('class', 'card-box')
            .attr('transform', `translate(${offsetX}, ${offsetY})`);
        
        // Card title
        cardBox.append('text')
            .attr('x', 10)
            .attr('y', 18)
            .attr('class', 'card-title')
            .style('font-weight', 'bold')
            .style('font-size', '11px')
            .style('fill', milestone.color)
            .text(milestone.title);
        
        // Card description with text wrapping and dynamic height calculation
        const textLines = this.wrapText(cardBox, milestone.description, 10, 32, 180, 9, '#333');
        
        // Calculate dynamic height based on content
        const titleHeight = 18; // Title takes up 18px
        const textLineHeight = 9 * 1.2; // Font size * line height multiplier
        const dateHeight = 0; // Space for date
        const padding = 20; // Top and bottom padding
        
        const dynamicHeight = titleHeight + (textLines * textLineHeight) + dateHeight + padding;
        
        // Add card background with calculated height
        cardBox.insert('rect', ':first-child') // Insert at the beginning so it's behind the text
            .attr('width', 200)
            .attr('height', dynamicHeight)
            .attr('rx', 6)
            .attr('fill', 'rgba(255, 255, 255, 0.98)')
            .attr('stroke', milestone.color)
            .attr('stroke-width', 2)
            .style('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))');
        
        // Click hint
        cardBox.append('text')
            .attr('x', 190)
            .attr('y', 15)
            .attr('text-anchor', 'end')
            .style('font-size', '8px')
            .style('fill', '#999')
            .text('↑');
    }
    
    bringCardToFront(card) {
        card.raise();
        card.select('.milestone-marker')
            .transition()
            .duration(200)
            .attr('r', 12)
            .transition()
            .duration(200)
            .attr('r', 8);
    }
    
    // Submilestone functions for detailed scenes
    addCovidSubmilestones() {
        // Filter data to COVID period for more accurate data points
        const covidData = this.currentData.filter(d => 
            d.date.getFullYear() === 2020 && 
            d.date.getMonth() >= 2 && d.date.getMonth() <= 5);
        
        const submilestones = [
            { 
                date: new Date('2020-03-16'), 
                title: 'Circuit Breakers Triggered', 
                description: 'Multiple trading halts as markets crash',
                position: { x: -120, y: 25 } // Custom position relative to data point
            },
            { 
                date: new Date('2020-03-23'), 
                title: 'Fed Announces QE', 
                description: 'Unlimited quantitative easing begins',
                position: { x: 15, y: 0 } // Custom position relative to data point
            },
            { 
                date: new Date('2020-04-06'), 
                title: 'Tech Recovery Begins', 
                description: 'NASDAQ starts its recovery rally',
                position: { x: -20, y: -50 } // Custom position relative to data point
            }
        ];
        
        submilestones.forEach(sub => {
            // Find the exact date or closest available date
            let dataPoint = covidData.find(d => 
                d.date.toDateString() === sub.date.toDateString());
            
            // If exact date not found, find the closest date within 3 days
            if (!dataPoint) {
                dataPoint = covidData.reduce((closest, current) => {
                    const currentDiff = Math.abs(current.date.getTime() - sub.date.getTime());
                    const closestDiff = Math.abs(closest.date.getTime() - sub.date.getTime());
                    return currentDiff < closestDiff ? current : closest;
                });
                
                // Only use if within 3 days
                const daysDiff = Math.abs(dataPoint.date.getTime() - sub.date.getTime()) / (1000 * 60 * 60 * 24);
                if (daysDiff > 3) {
                    console.warn(`No data found within 3 days of ${sub.date.toDateString()}, closest was ${dataPoint.date.toDateString()}`);
                    return; // Skip this submilestone
                }
            }
            
            if (dataPoint) {
                console.log(`Adding submilestone "${sub.title}" at ${dataPoint.date.toDateString()}`);
                this.addSubmilestone(dataPoint, sub.title, sub.description, '#dc3545', sub.position);
            }
        });
        
        // Add COVID summary (title is already added in addScene2Annotations)
        this.addCovidSummary();
    }
    
    addCovidSummary() {
        // Filter to COVID period for calculations
        const covidData = this.currentData.filter(d => 
            d.date.getFullYear() === 2020 && 
            d.date.getMonth() >= 2 && d.date.getMonth() <= 5);
        
        if (covidData.length === 0) return;
        
        const startValue = covidData[0].close;
        const endValue = covidData[covidData.length - 1].close;
        const minValue = d3.min(covidData, d => d.low);
        const maxValue = d3.max(covidData, d => d.high);
        const totalChange = ((endValue - startValue) / startValue * 100).toFixed(1);
        const maxDrop = ((minValue - startValue) / startValue * 100).toFixed(1);
        
        // Add COVID summary box
        const summaryGroup = this.chart.append('g')
            .attr('class', 'covid-summary')
            .attr('transform', `translate(10, 20)`);
        
        summaryGroup.append('rect')
            .attr('width', 160)
            .attr('height', 80)
            .attr('rx', 5)
            .attr('fill', 'rgba(255, 255, 255, 0.95)')
            .attr('stroke', '#dc3545')
            .attr('stroke-width', 2);
        
        summaryGroup.append('text')
            .attr('x', 10)
            .attr('y', 15)
            .style('font-size', '11px')
            .style('font-weight', 'bold')
            .style('fill', '#dc3545')
            .text('COVID-19 Impact:');
        
        summaryGroup.append('text')
            .attr('x', 10)
            .attr('y', 30)
            .style('font-size', '9px')
            .style('fill', '#666')
            .text(`Max Drop: ${maxDrop}%`);
        
        summaryGroup.append('text')
            .attr('x', 10)
            .attr('y', 43)
            .style('font-size', '9px')
            .style('fill', '#666')
            .text(`Period Change: ${totalChange}%`);
        
        summaryGroup.append('text')
            .attr('x', 10)
            .attr('y', 56)
            .style('font-size', '9px')
            .style('fill', '#666')
            .text(`Low: ${minValue.toLocaleString()}`);
        
        summaryGroup.append('text')
            .attr('x', 10)
            .attr('y', 69)
            .style('font-size', '9px')
            .style('fill', '#666')
            .text(`High: ${maxValue.toLocaleString()}`);
    }
    
    addBoomSubmilestones() {
        const boomData = this.currentData.filter(d => d.date.getFullYear() === 2021);
        
        const submilestones = [
            { 
                date: new Date('2021-01-05'), 
                title: 'Stimulus Fuels Growth', 
                description: 'Government stimulus drives tech boom',
                position: { x: 5, y: 25 }
            },
            { 
                date: new Date('2021-06-01'), 
                title: 'Peak Valuations', 
                description: 'Tech stocks reach record valuations',
                position: { x: -0, y: 30 }
            },
            { 
                date: new Date('2021-11-22'), 
                title: 'All-Time High', 
                description: 'NASDAQ reaches peak before correction',
                position: { x: -50, y: -45 }
            }
        ];
        
        submilestones.forEach(sub => {
            // Find the exact date or closest available date
            let dataPoint = boomData.find(d => 
                d.date.toDateString() === sub.date.toDateString());
            
            // If exact date not found, find the closest date within 3 days
            if (!dataPoint) {
                dataPoint = boomData.reduce((closest, current) => {
                    const currentDiff = Math.abs(current.date.getTime() - sub.date.getTime());
                    const closestDiff = Math.abs(closest.date.getTime() - sub.date.getTime());
                    return currentDiff < closestDiff ? current : closest;
                });
                
                // Only use if within 3 days
                const daysDiff = Math.abs(dataPoint.date.getTime() - sub.date.getTime()) / (1000 * 60 * 60 * 24);
                if (daysDiff > 3) {
                    console.warn(`No data found within 3 days of ${sub.date.toDateString()}, closest was ${dataPoint.date.toDateString()}`);
                    return; // Skip this submilestone
                }
            }
            
            if (dataPoint) {
                console.log(`Adding submilestone "${sub.title}" at ${dataPoint.date.toDateString()}`);
                this.addSubmilestone(dataPoint, sub.title, sub.description, '#ffc107', sub.position);
            }
        });
    }
    
    addCorrectionSubmilestones() {
        const correctionData = this.currentData.filter(d => d.date.getFullYear() === 2022);
        
        const submilestones = [
            { 
                date: new Date('2022-01-01'), 
                title: 'Rate Hike Fears', 
                description: 'Fed signals aggressive rate increases',
                position: { x: 10, y: -20 }
            },
            { 
                date: new Date('2022-06-01'), 
                title: 'Inflation Peak', 
                description: 'Inflation reaches 40-year high',
                position: { x: -50, y: -30 }
            },
            { 
                date: new Date('2022-10-01'), 
                title: 'Market Bottom', 
                description: 'NASDAQ finds support level',
                position: { x: -50, y: -30 }
            }
        ];
        
        submilestones.forEach(sub => {
            // Find the exact date or closest available date
            let dataPoint = correctionData.find(d => 
                d.date.toDateString() === sub.date.toDateString());
            
            // If exact date not found, find the closest date within 3 days
            if (!dataPoint) {
                dataPoint = correctionData.reduce((closest, current) => {
                    const currentDiff = Math.abs(current.date.getTime() - sub.date.getTime());
                    const closestDiff = Math.abs(closest.date.getTime() - sub.date.getTime());
                    return currentDiff < closestDiff ? current : closest;
                });
                
                // Only use if within 3 days
                const daysDiff = Math.abs(dataPoint.date.getTime() - sub.date.getTime()) / (1000 * 60 * 60 * 24);
                if (daysDiff > 3) {
                    console.warn(`No data found within 3 days of ${sub.date.toDateString()}, closest was ${dataPoint.date.toDateString()}`);
                    return; // Skip this submilestone
                }
            }
            
            if (dataPoint) {
                console.log(`Adding submilestone "${sub.title}" at ${dataPoint.date.toDateString()}`);
                this.addSubmilestone(dataPoint, sub.title, sub.description, '#fd7e14', sub.position);
            }
        });
    }
    
    addAISubmilestones() {
        const aiData = this.currentData.filter(d => d.date.getFullYear() >= 2023);
        
        const submilestones = [
            { 
                date: new Date('2023-01-01'), 
                title: 'ChatGPT Launch', 
                description: 'AI revolution begins with ChatGPT',
                position: { x: 20, y: 0 }
            },
            { 
                date: new Date('2023-06-01'), 
                title: 'AI Stock Rally', 
                description: 'AI companies surge in value',
                position: { x: 0, y: 20 }
            },
            { 
                date: new Date('2024-01-01'), 
                title: 'AI Integration', 
                description: 'AI becomes mainstream in tech',
                position: { x: 0, y: 30 }
            }
        ];
        
        submilestones.forEach(sub => {
            // Find the exact date or closest available date
            let dataPoint = aiData.find(d => 
                d.date.toDateString() === sub.date.toDateString());
            
            // If exact date not found, find the closest date within 3 days
            if (!dataPoint) {
                dataPoint = aiData.reduce((closest, current) => {
                    const currentDiff = Math.abs(current.date.getTime() - sub.date.getTime());
                    const closestDiff = Math.abs(closest.date.getTime() - sub.date.getTime());
                    return currentDiff < closestDiff ? current : closest;
                });
                
                // Only use if within 3 days
                const daysDiff = Math.abs(dataPoint.date.getTime() - sub.date.getTime()) / (1000 * 60 * 60 * 24);
                if (daysDiff > 3) {
                    console.warn(`No data found within 3 days of ${sub.date.toDateString()}, closest was ${dataPoint.date.toDateString()}`);
                    return; // Skip this submilestone
                }
            }
            
            if (dataPoint) {
                console.log(`Adding submilestone "${sub.title}" at ${dataPoint.date.toDateString()}`);
                this.addSubmilestone(dataPoint, sub.title, sub.description, '#28a745', sub.position);
            }
        });
    }
    
    addSubmilestone(dataPoint, title, description, color, position = { x: 10, y: -5 }) {
        const annotation = this.chart.append('g')
            .attr('class', 'submilestone')
            .attr('transform', `translate(${this.xScale(dataPoint.date)}, ${this.yScale(dataPoint.close)})`);
        
        // Small marker
        annotation.append('circle')
            .attr('r', 4)
            .attr('fill', color)
            .attr('stroke', 'white')
            .attr('stroke-width', 2);
        
        // Simple label with custom positioning
        annotation.append('text')
            .attr('x', position.x)
            .attr('y', position.y)
            .attr('class', 'submilestone-title')
            .style('font-size', '11px')
            .style('font-weight', 'bold')
            .style('fill', color)
            .text(title);
        
        annotation.append('text')
            .attr('x', position.x)
            .attr('y', position.y + 13)
            .attr('class', 'submilestone-description')
            .style('font-size', '10px')
            .style('fill', '#666')
            .text(description);
    }
    
    addFutureOutlook() {
        // Add future outlook annotation
        const lastPoint = this.currentData[this.currentData.length - 1];
        
        this.chart.append('g')
            .attr('class', 'future-outlook')
            .attr('transform', `translate(${this.width / 2}, 50)`);
        
        this.chart.select('.future-outlook')
            .append('rect')
            .attr('width', 300)
            .attr('height', 80)
            .attr('x', -150)
            .attr('rx', 8)
            .attr('fill', 'rgba(255, 255, 255, 0.95)')
            .attr('stroke', '#007bff')
            .attr('stroke-width', 2);
        
        this.chart.select('.future-outlook')
            .append('text')
            .attr('x', 0)
            .attr('y', 20)
            .attr('text-anchor', 'middle')
            .style('font-size', '14px')
            .style('font-weight', 'bold')
            .style('fill', '#007bff')
            .text('Future Outlook');
        
        this.chart.select('.future-outlook')
            .append('text')
            .attr('x', 0)
            .attr('y', 40)
            .attr('text-anchor', 'middle')
            .style('font-size', '12px')
            .style('fill', '#333')
            .text('AI continues to drive growth');
        
        this.chart.select('.future-outlook')
            .append('text')
            .attr('x', 0)
            .attr('y', 55)
            .attr('text-anchor', 'middle')
            .style('font-size', '12px')
            .style('fill', '#333')
            .text('Tech sector remains resilient');
    }
    
    addAnnotation(dataPoint, title, text) {
        const annotation = this.chart.append('g')
            .attr('class', 'annotation')
            .attr('transform', `translate(${this.xScale(dataPoint.date)}, ${this.yScale(dataPoint.close)})`);
        
        annotation.append('circle')
            .attr('r', 6)
            .attr('fill', '#007bff')
            .attr('stroke', 'white')
            .attr('stroke-width', 2);
        
        annotation.append('text')
            .attr('x', 10)
            .attr('y', -10)
            .attr('class', 'annotation-title')
            .text(title);
        
        annotation.append('text')
            .attr('x', 10)
            .attr('y', 5)
            .attr('class', 'annotation-text')
            .text(text);
    }
    
    addZoomControls() {
        const zoomControls = d3.select('#chartContainer')
            .append('div')
            .attr('class', 'zoom-controls')
            .style('position', 'absolute')
            .style('top', '10px')
            .style('right', '10px')
            .style('z-index', '1000');
        
        zoomControls.append('button')
            .attr('class', 'zoom-btn')
            .style('margin', '2px')
            .style('padding', '5px 10px')
            .style('border', '1px solid #ccc')
            .style('border-radius', '3px')
            .style('background', 'white')
            .style('cursor', 'pointer')
            .text('Zoom In')
            .on('click', () => {
                this.svg.transition().call(this.zoom.scaleBy, 1.5);
            });
        
        zoomControls.append('button')
            .attr('class', 'zoom-btn')
            .style('margin', '2px')
            .style('padding', '5px 10px')
            .style('border', '1px solid #ccc')
            .style('border-radius', '3px')
            .style('background', 'white')
            .style('cursor', 'pointer')
            .text('Zoom Out')
            .on('click', () => {
                this.svg.transition().call(this.zoom.scaleBy, 0.75);
            });
        
        zoomControls.append('button')
            .attr('class', 'zoom-btn')
            .style('margin', '2px')
            .style('padding', '5px 10px')
            .style('border', '1px solid #ccc')
            .style('border-radius', '3px')
            .style('background', 'white')
            .style('cursor', 'pointer')
            .text('Reset')
            .on('click', () => {
                // Reset zoom and pan to original position
                this.svg.transition()
                    .duration(750)
                    .call(this.zoom.transform, d3.zoomIdentity.translate(this.margin.left, this.margin.top));
            });
    }
    
    addTooltip() {
        const tooltip = d3.select('body').append('div')
            .attr('class', 'tooltip')
            .style('opacity', 0);
        
        this.chart.selectAll('.chart-element')
            .on('mouseover', (event, d) => {
                tooltip.transition()
                    .duration(200)
                    .style('opacity', 0.9);
                tooltip.html(`
                    <strong>${d3.timeFormat('%Y-%m-%d')(d.date)}</strong><br/>
                    Open: ${d.open.toFixed(1)}<br/>
                    High: ${d.high.toFixed(1)}<br/>
                    Low: ${d.low.toFixed(1)}<br/>
                    Close: ${d.close.toFixed(1)}<br/>
                    <em>Click to explore this period</em>
                `)
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 28) + 'px');
            })
            .on('mouseout', () => {
                tooltip.transition()
                    .duration(500)
                    .style('opacity', 0);
            })
            .on('click', (event, d) => {
                this.handleDataPointClick(d);
            });
    }
    
    handleDataPointClick(dataPoint) {
        // Store the selected period for drill-down
        this.selectedPeriod = dataPoint;
        
        // Show a confirmation dialog
        const confirmDrill = confirm(`Explore data around ${d3.timeFormat('%B %Y')(dataPoint.date)}? This will switch to a more detailed view.`);
        
        if (confirmDrill) {
            // Switch to Scene 2 (drill-down)
            this.currentScene = 2;
            this.updateScene();
            
            // Update the timeframe to show more detail
            if (this.currentTimeframe === '1Month') {
                this.currentTimeframe = '1w';
                d3.select('#timeframe').property('value', '1w');
            }
            
            this.loadData();
        }
    }
    
    toggleAutoPlay() {
        this.isAutoPlaying = !this.isAutoPlaying;
        const button = d3.select('#autoPlay');
        
        if (this.isAutoPlaying) {
            button.text('Stop Auto Play').classed('active', true);
            this.startAutoPlay();
        } else {
            button.text('Auto Play').classed('active', false);
            this.stopAutoPlay();
        }
    }
    
    startAutoPlay() {
        this.autoPlayInterval = setInterval(() => {
            if (this.currentScene < this.totalScenes) {
                this.nextScene();
            } else {
                this.currentScene = 1;
                this.updateScene();
            }
        }, 5000); // 5 seconds per scene
    }
    
    stopAutoPlay() {
        if (this.autoPlayInterval) {
            clearInterval(this.autoPlayInterval);
        }
    }
    
    wrapText(container, text, x, y, maxWidth, fontSize, color) {
        const words = text.split(' ');
        const lineHeight = fontSize * 1.2;
        let line = '';
        let lineCount = 0;
        const maxLines = 3; // Limit to 3 lines to keep cards compact
        
        for (let i = 0; i < words.length; i++) {
            const testLine = line + words[i] + ' ';
            const testWidth = this.getTextWidth(testLine, fontSize);
            
            if (testWidth > maxWidth && line !== '') {
                // Add current line
                container.append('text')
                    .attr('x', x)
                    .attr('y', y + (lineCount * lineHeight))
                    .style('font-size', fontSize + 'px')
                    .style('fill', color)
                    .text(line);
                
                line = words[i] + ' ';
                lineCount++;
                
                // Stop if we've reached max lines
                if (lineCount >= maxLines) {
                    // Add ellipsis to indicate more text
                    container.append('text')
                        .attr('x', x)
                        .attr('y', y + (lineCount * lineHeight))
                        .style('font-size', fontSize + 'px')
                        .style('fill', color)
                        .text(line + '...');
                    return lineCount + 1; // Include the ellipsis line
                }
            } else {
                line = testLine;
            }
        }
        
        // Add the last line if we haven't reached max lines
        if (lineCount < maxLines && line !== '') {
            container.append('text')
                .attr('x', x)
                .attr('y', y + (lineCount * lineHeight))
                .style('font-size', fontSize + 'px')
                .style('fill', color)
                .text(line.trim());
            return lineCount + 1;
        }
        
        return lineCount;
    }
    
    getTextWidth(text, fontSize) {
        // Create a temporary SVG element to measure text width
        const tempSvg = d3.select('body').append('svg').style('visibility', 'hidden');
        const tempText = tempSvg.append('text')
            .style('font-size', fontSize + 'px')
            .text(text);
        const width = tempText.node().getBBox().width;
        tempSvg.remove();
        return width;
    }
    
    showError(message) {
        d3.select('#chartContainer').html(`
            <div style="display: flex; justify-content: center; align-items: center; height: 100%; color: #dc3545;">
                <div style="text-align: center;">
                    <h3>Error</h3>
                    <p>${message}</p>
                </div>
            </div>
        `);
    }
}

// Initialize the visualization when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new NarrativeVisualization();
}); 