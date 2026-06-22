// Global state management
const state = {
    datasetStats: null,
    pipelineData: null,
    activeTab: 'landing',
    activeColoringAlgo: 'greedy',
    charts: {},
    network: null,
    nodesDataset: null,
    edgesDataset: null,
    selectedNodeId: null
};

// Pastel colors palette for graph coloring nodes and cards (light theme)
const COLOR_PALETTE = [
    { name: 'Soft Blue', hex: '#60A5FA', light: '#EFF6FF', dark: '#1D4ED8' },
    { name: 'Soft Purple', hex: '#C4B5FD', light: '#F5F3FF', dark: '#6D28D9' },
    { name: 'Soft Mint', hex: '#6EE7B7', light: '#ECFDF5', dark: '#047857' },
    { name: 'Soft Amber', hex: '#FCD34D', light: '#FFFBEB', dark: '#B45309' },
    { name: 'Soft Pink', hex: '#FCA5A5', light: '#FFF1F2', dark: '#BE123C' },
    { name: 'Soft Teal', hex: '#81E6D9', light: '#E6FFFA', dark: '#0D9488' },
    { name: 'Soft Coral', hex: '#FDA4AF', light: '#FFE4E6', dark: '#E11D48' },
    { name: 'Lavender Gray', hex: '#CBD5E1', light: '#F1F5F9', dark: '#475569' },
    { name: 'Peach', hex: '#FED7AA', light: '#FFF7ED', dark: '#C2410C' },
    { name: 'Lime', hex: '#D9F99D', light: '#F7FEE7', dark: '#4D7C0F' },
];

// Document Ready
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initUploadDropzone();
    initSlider();
});

// 1. NAVIGATION LOGIC
function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            if (item.classList.contains('locked')) {
                return;
            }
            const tabName = item.getAttribute('data-tab');
            switchTab(tabName);
        });
    });
}

function switchTab(tabName) {
    // Update State
    state.activeTab = tabName;
    
    // Update Nav UI
    document.querySelectorAll('.nav-item').forEach(item => {
        if (item.getAttribute('data-tab') === tabName) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
    
    // Update Pane UI
    document.querySelectorAll('.tab-pane').forEach(pane => {
        if (pane.id === `tab-${tabName}`) {
            pane.classList.add('active');
        } else {
            pane.classList.remove('active');
        }
    });
    
    // Window hash helper (optional, nice UX)
    window.location.hash = tabName;
    
    // Trigger redraws if necessary
    if (tabName === 'graph' && state.network) {
        // Redraw vis-network to fix zero-width canvas issues if rendering in hidden pane
        setTimeout(() => {
            state.network.fit();
        }, 150);
    }
}

function unlockTabs() {
    document.querySelectorAll('.nav-item.locked').forEach(item => {
        item.classList.remove('locked');
        const lockIcon = item.querySelector('.lock-icon');
        if (lockIcon) {
            lockIcon.remove();
        }
    });
}

// CTA triggers helper
function activatePipeline() {
    switchTab('upload');
}

function loadDefaultAndGo() {
    loadDefaultDataset(true);
}

// 2. DATASET UPLOAD LOGIC
function initUploadDropzone() {
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('csv-file-input');
    
    // Trigger browse file
    dropzone.addEventListener('click', (e) => {
        if (e.target.tagName !== 'BUTTON') {
            fileInput.click();
        }
    });
    
    fileInput.addEventListener('change', () => {
        if (fileInput.files.length > 0) {
            uploadCSVFile(fileInput.files[0]);
        }
    });
    
    // Drag events
    ['dragenter', 'dragover'].forEach(eventName => {
        dropzone.addEventListener(eventName, (e) => {
            e.preventDefault();
            dropzone.classList.add('dragover');
        }, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, (e) => {
            e.preventDefault();
            dropzone.classList.remove('dragover');
        }, false);
    });
    
    dropzone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files.length > 0 && files[0].name.endsWith('.csv')) {
            uploadCSVFile(files[0]);
        }
    });
}

function uploadCSVFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    showOverlay('Uploading CSV file...', 'Parsing fields...');
    
    fetch('/api/upload-csv', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            handleDatasetLoaded(data.stats);
        } else {
            alert('Error loading file: ' + data.error);
            hideOverlay();
        }
    })
    .catch(error => {
        console.error(error);
        alert('Server communications error during upload.');
        hideOverlay();
    });
}

function loadDefaultDataset(autoRun = false) {
    showOverlay('Loading default dataset...', 'Retrieving Breast Cancer Wisconsin features...');
    
    fetch('/api/load-default', {
        method: 'POST'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            handleDatasetLoaded(data.stats, autoRun);
        } else {
            alert('Error loading default dataset: ' + data.error);
            hideOverlay();
        }
    })
    .catch(error => {
        console.error(error);
        alert('Server communication error.');
        hideOverlay();
    });
}

function handleDatasetLoaded(stats, autoRun = false) {
    state.datasetStats = stats;
    
    // Show details card
    document.querySelector('.placeholder-content').classList.add('hidden');
    document.querySelector('.dataset-stats-display').classList.remove('hidden');
    
    // Set statistics numbers
    animateCounter('stat-samples', stats.samples);
    animateCounter('stat-features', stats.features);
    animateCounter('stat-missing', stats.missing_values);
    
    // Render features pills
    const container = document.getElementById('feature-pills-list');
    container.innerHTML = '';
    stats.feature_list.forEach(feat => {
        const pill = document.createElement('span');
        pill.className = 'feature-pill';
        pill.textContent = feat;
        container.appendChild(pill);
    });
    
    document.getElementById('features-count-badge').textContent = stats.feature_list.length;
    
    // Unlock remaining navbar items
    unlockTabs();
    
    if (autoRun) {
        runAnalysisPipeline(true);
    } else {
        hideOverlay();
        // Shift tab to dataset view
        switchTab('upload');
    }
}

// 3. PIPELINE EXECUTION LOGIC
function initSlider() {
    const slider = document.getElementById('threshold-slider');
    const label = document.getElementById('threshold-val');
    slider.addEventListener('input', () => {
        label.textContent = parseFloat(slider.value).toFixed(2);
    });
}

function runAnalysisPipeline(fromDefault = false) {
    const threshold = document.getElementById('threshold-slider').value;
    
    showOverlay('Initializing pipeline...', 'Configuring variables...');
    
    // Simulate dynamic steps in loader
    const steps = [
        'Calculating correlation coefficients...',
        'Filtering redundancies and extracting conflicts...',
        'Constructing graph model topology...',
        'Executing Welsh-Powell Greedy coloring...',
        'Searching state space with Backtracking coloring...',
        'Conducting variance-based feature selections...',
        'Fitting Logistic Regression models...',
        'Fitting Random Forest models...',
        'Fitting Support Vector Machines (SVM)...',
        'Fitting K-Nearest Neighbors (KNN)...',
        'Tabulating execution efficiencies...'
    ];
    
    let stepIndex = 0;
    const stepInterval = setInterval(() => {
        if (stepIndex < steps.length) {
            document.getElementById('loading-step').textContent = steps[stepIndex++];
        }
    }, 450);
    
    fetch('/api/run-pipeline', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ threshold: threshold })
    })
    .then(response => response.json())
    .then(data => {
        clearInterval(stepInterval);
        if (data.success) {
            state.pipelineData = data;
            
            // Populating UI components
            populateCorrelationTab();
            populateGraphTab();
            populateColoringTab();
            populateComparisonTab();
            populateResultsTab();
            
            hideOverlay();
            
            // Go to next step if just loaded
            if (fromDefault) {
                switchTab('correlation');
            } else {
                // Stay on current tab or go to correlation
                if (state.activeTab === 'upload') {
                    switchTab('correlation');
                }
            }
        } else {
            alert('Error running pipeline: ' + data.error);
            hideOverlay();
        }
    })
    .catch(error => {
        clearInterval(stepInterval);
        console.error(error);
        alert('Server communication failed during analysis.');
        hideOverlay();
    });
}

// Helper Loading Overlay
function showOverlay(title, step) {
    const overlay = document.getElementById('loading-overlay');
    overlay.querySelector('h3').textContent = title;
    document.getElementById('loading-step').textContent = step;
    overlay.classList.remove('hidden');
}

function hideOverlay() {
    document.getElementById('loading-overlay').classList.add('hidden');
}

// 4. CORRELATION RENDERING
function populateCorrelationTab() {
    const corr = state.pipelineData.correlation;
    const stats = state.pipelineData.stats;
    
    // Stats cards
    animateCounter('corr-stat-total-features', stats.original_features);
    animateCounter('corr-stat-conflicts-found', corr.conflict_count);
    
    const strongest = corr.strongest_pair;
    if (strongest) {
        document.getElementById('corr-stat-strongest-pair').innerHTML = 
            `<span class='text-xs font-semibold'>${strongest.feature1} &harr; ${strongest.feature2}</span><br><span class='text-sm text-red-dark font-bold'>(${strongest.correlation.toFixed(3)})</span>`;
    } else {
        document.getElementById('corr-stat-strongest-pair').textContent = 'N/A';
    }
    
    // Table list of conflicts
    const tbody = document.getElementById('conflicts-table-body');
    tbody.innerHTML = '';
    
    if (corr.conflicts.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" class="text-center text-muted">No conflicts found at this threshold. Try reducing threshold.</td></tr>`;
    } else {
        corr.conflicts.forEach(c => {
            const tr = document.createElement('tr');
            
            const badgeClass = c.correlation > 0 ? 'bg-red-light text-red-dark' : 'bg-blue-light text-primary-dark';
            
            tr.innerHTML = `
                <td>${c.feature1}</td>
                <td>${c.feature2}</td>
                <td><span class="badge ${badgeClass}">${c.correlation.toFixed(2)}</span></td>
            `;
            tbody.appendChild(tr);
        });
    }
    
    // Render correlation matrix heatmap using ApexCharts
    renderHeatmap(corr.columns, corr.heatmap_data);
}

function renderHeatmap(columns, seriesData) {
    if (state.charts.heatmap) {
        state.charts.heatmap.destroy();
    }
    
    // Heatmap needs to fit in a decent size. For 30 features, a small height is ideal.
    const height = Math.max(450, columns.length * 15);
    
    const options = {
        series: seriesData,
        chart: {
            height: height,
            type: 'heatmap',
            toolbar: { show: true }
        },
        plotOptions: {
            heatmap: {
                colorScale: {
                    ranges: [
                        { from: -1, to: -0.6, color: '#3B82F6', name: 'Strong Negative' },
                        { from: -0.6, to: -0.3, color: '#93C5FD', name: 'Moderate Negative' },
                        { from: -0.3, to: 0.3, color: '#F1F5F9', name: 'No Correlation' },
                        { from: 0.3, to: 0.6, color: '#FDA4AF', name: 'Moderate Positive' },
                        { from: 0.6, to: 1, color: '#F43F5E', name: 'Strong Positive' }
                    ]
                }
            }
        },
        dataLabels: {
            enabled: columns.length <= 15, // Only enable label text for few features
            style: { colors: ['#1E293B'] }
        },
        xaxis: {
            type: 'category',
            labels: {
                rotate: -45,
                style: { fontSize: '9px', fontFamily: 'Plus Jakarta Sans' }
            }
        },
        yaxis: {
            labels: {
                style: { fontSize: '9px', fontFamily: 'Plus Jakarta Sans' }
            }
        },
        tooltip: {
            y: {
                formatter: function (val) {
                    return val.toFixed(3);
                }
            }
        }
    };
    
    state.charts.heatmap = new ApexCharts(
        document.querySelector("#correlation-heatmap-container"), 
        options
    );
    state.charts.heatmap.render();
}

// 5. GRAPH VIEWPORT RENDERING
function populateGraphTab() {
    const graphData = state.pipelineData.graph;
    
    // Set text stats
    document.getElementById('graph-stat-nodes').textContent = graphData.stats.nodes;
    document.getElementById('graph-stat-edges').textContent = graphData.stats.edges;
    document.getElementById('graph-stat-density').textContent = graphData.stats.density.toFixed(4);
    
    // Render vis.js network graph
    renderConflictNetwork(graphData.nodes, graphData.edges);
}

function renderConflictNetwork(nodes, edges) {
    const container = document.getElementById('vis-graph-container');
    
    // Transform nodes and edges for vis.js datasets
    state.nodesDataset = new vis.DataSet(
        nodes.map(n => {
            // Node size proportional to degree, minimum size 15
            const size = 15 + Math.min(n.degree * 2, 20);
            return {
                id: n.id,
                label: n.id,
                title: `${n.id} (Degree/Conflicts: ${n.degree})`,
                size: size,
                shape: 'dot',
                font: { size: 11, face: 'Plus Jakarta Sans', color: '#334155' },
                borderWidth: 1.5,
                color: {
                    background: '#EFF6FF',
                    border: '#60A5FA',
                    highlight: { background: '#DBEAFE', border: '#2563EB' }
                },
                // Keep references to coloring outputs
                greedy_color: n.greedy_color,
                backtracking_color: n.backtracking_color
            };
        })
    );
    
    state.edgesDataset = new vis.DataSet(
        edges.map(e => {
            // Thickness proportional to correlation weight
            const width = 1 + (e.value * 3);
            return {
                id: `${e.from}-${e.to}`,
                from: e.from,
                to: e.to,
                width: width,
                title: `Corr: ${e.correlation.toFixed(3)}`,
                color: {
                    color: '#CBD5E1',
                    highlight: '#94A3B8'
                }
            };
        })
    );
    
    const data = {
        nodes: state.nodesDataset,
        edges: state.edgesDataset
    };
    
    const options = {
        physics: {
            enabled: document.getElementById('physics-toggle').checked,
            barnesHut: {
                gravitationalConstant: -2000,
                centralGravity: 0.3,
                springLength: 95,
                springConstant: 0.04,
                damping: 0.09,
                avoidOverlap: 0.1
            },
            stabilization: { iterations: 150 }
        },
        interaction: {
            hover: true,
            tooltipDelay: 200,
            navigationButtons: false
        }
    };
    
    state.network = new vis.Network(container, data, options);
    
    // Highlight neighbors on click
    state.network.on("click", function(params) {
        if (params.nodes.length > 0) {
            highlightNeighbors(params.nodes[0]);
        } else {
            resetHighlighting();
        }
    });
    
    // Ensure we trigger color rendering if colored mode was checked initially
    updateGraphColors();
}

function toggleGraphPhysics() {
    if (state.network) {
        const enabled = document.getElementById('physics-toggle').checked;
        state.network.setOptions({ physics: { enabled: enabled } });
    }
}

function fitNetwork() {
    if (state.network) {
        state.network.fit({ animation: { duration: 500 } });
    }
}

function updateGraphColors() {
    if (!state.nodesDataset) return;
    
    const mode = document.querySelector('input[name="graph-color-mode"]:checked').value;
    const legendContainer = document.getElementById('graph-legend-colors');
    legendContainer.innerHTML = '';
    
    const nodesToUpdate = [];
    
    if (mode === 'uncolored') {
        state.nodesDataset.forEach(node => {
            nodesToUpdate.push({
                id: node.id,
                color: {
                    background: '#EFF6FF',
                    border: '#60A5FA',
                    highlight: { background: '#DBEAFE', border: '#2563EB' }
                }
            });
        });
    } else {
        const coloringField = mode === 'greedy' ? 'greedy_color' : 'backtracking_color';
        
        // Find how many unique colors are used
        const colorSet = new Set();
        state.nodesDataset.forEach(n => {
            colorSet.add(n[coloringField]);
        });
        
        // Render legend pills
        const uniqueColors = Array.from(colorSet).sort((a,b)=>a-b);
        uniqueColors.forEach(colIdx => {
            const paletteItem = COLOR_PALETTE[colIdx % COLOR_PALETTE.length];
            const pill = document.createElement('span');
            pill.className = 'color-badge-pill';
            pill.style.backgroundColor = paletteItem.light;
            pill.innerHTML = `<span class="color-dot" style="background-color: ${paletteItem.hex}"></span>Group ${colIdx}`;
            legendContainer.appendChild(pill);
        });
        
        // Paint nodes based on their assigned group color
        state.nodesDataset.forEach(node => {
            const colorIdx = node[coloringField];
            const paletteItem = COLOR_PALETTE[colorIdx % COLOR_PALETTE.length];
            
            nodesToUpdate.push({
                id: node.id,
                color: {
                    background: paletteItem.light,
                    border: paletteItem.hex,
                    highlight: { background: paletteItem.light, border: paletteItem.dark }
                }
            });
        });
    }
    
    state.nodesDataset.update(nodesToUpdate);
}

function highlightNeighbors(nodeId) {
    state.selectedNodeId = nodeId;
    
    // Find all connected edges and neighbor nodes
    const connectedEdges = state.network.getConnectedEdges(nodeId);
    const connectedNodes = state.network.getConnectedNodes(nodeId);
    
    const updateNodes = [];
    const updateEdges = [];
    
    // Dim out all nodes except clicked and neighbors
    state.nodesDataset.forEach(n => {
        const isNeighbor = connectedNodes.includes(n.id) || n.id === nodeId;
        updateNodes.push({
            id: n.id,
            opacity: isNeighbor ? 1 : 0.15,
            font: { color: isNeighbor ? '#1E293B' : '#CBD5E1' }
        });
    });
    
    // Dim out edges
    state.edgesDataset.forEach(e => {
        const isConnected = connectedEdges.includes(e.id);
        updateEdges.push({
            id: e.id,
            color: {
                color: isConnected ? '#64748B' : '#E2E8F0',
                opacity: isConnected ? 1 : 0.1
            }
        });
    });
    
    state.nodesDataset.update(updateNodes);
    state.edgesDataset.update(updateEdges);
}

function resetHighlighting() {
    state.selectedNodeId = null;
    if (!state.nodesDataset || !state.edgesDataset) return;
    
    const updateNodes = [];
    const updateEdges = [];
    
    state.nodesDataset.forEach(n => {
        updateNodes.push({
            id: n.id,
            opacity: 1,
            font: { color: '#334155' }
        });
    });
    
    state.edgesDataset.forEach(e => {
        updateEdges.push({
            id: e.id,
            color: {
                color: '#CBD5E1',
                opacity: 1
            }
        });
    });
    
    state.nodesDataset.update(updateNodes);
    state.edgesDataset.update(updateEdges);
}

// 6. GRAPH COLORING RESULTS
function populateColoringTab() {
    // Standard triggers showing the active algo results
    switchColoringAlgo(state.activeColoringAlgo);
}

function switchColoringAlgo(algo) {
    state.activeColoringAlgo = algo;
    
    // Segmented tab active status
    document.querySelectorAll('#coloring-algo-tabs button').forEach(b => {
        if (b.getAttribute('data-algo') === algo) {
            b.classList.add('active');
        } else {
            b.classList.remove('active');
        }
    });
    
    const data = state.pipelineData.algorithms[algo];
    const totalFeatures = state.pipelineData.stats.original_features;
    
    // Update headers and meta info
    document.getElementById('coloring-meta-colors').textContent = data.colors_used;
    document.getElementById('coloring-meta-time').textContent = `${(data.execution_time * 1000).toFixed(3)} ms`;
    
    // Summary row
    document.getElementById('coloring-summary-chromatic').textContent = data.colors_used;
    document.getElementById('coloring-summary-selected').textContent = data.selected_features.length;
    document.getElementById('coloring-summary-dismissed').textContent = totalFeatures - data.selected_features.length;
    
    // Populate cards
    const container = document.getElementById('color-groups-container');
    container.innerHTML = '';
    
    data.details.forEach(group => {
        const paletteItem = COLOR_PALETTE[group.color % COLOR_PALETTE.length];
        
        const card = document.createElement('div');
        card.className = 'color-group-card shadow-sm';
        
        // Header styled dynamically
        const header = document.createElement('div');
        header.className = 'color-group-header';
        header.style.backgroundColor = paletteItem.light;
        header.style.color = paletteItem.dark;
        header.style.borderBottom = `1px solid ${paletteItem.hex}`;
        header.innerHTML = `
            <span>Group ${group.color}</span>
            <span class="badge" style="background-color: ${paletteItem.hex}; color: #FFF; font-size: 10px; padding: 2px 6px;">
                ${group.features.length} Feat
            </span>
        `;
        card.appendChild(header);
        
        const content = document.createElement('div');
        content.className = 'color-group-content';
        
        // List features in the group, sorted by variance descending
        const sortedFeatures = [...group.features].sort((a,b) => group.variances[b] - group.variances[a]);
        
        sortedFeatures.forEach(feat => {
            const isSelected = feat === group.selected;
            const row = document.createElement('div');
            row.className = `color-group-feature-row ${isSelected ? 'selected-feat' : ''}`;
            
            const variance = group.variances[feat].toFixed(4);
            row.innerHTML = `
                <span>${feat}</span>
                <span class="var-badge">
                    ${isSelected ? '<i class="fa-solid fa-crown crown-icon mr-1"></i>' : ''}
                    &sigma;&sup2;: ${variance}
                </span>
            `;
            content.appendChild(row);
        });
        
        card.appendChild(content);
        container.appendChild(card);
    });
}

// 7. ALGORITHM COMPARISON
function populateComparisonTab() {
    const algorithms = state.pipelineData.algorithms;
    
    // Numeric metrics
    document.getElementById('comp-greedy-colors').textContent = algorithms.greedy.colors_used;
    document.getElementById('comp-greedy-time').textContent = `${(algorithms.greedy.execution_time * 1000).toFixed(3)} ms`;
    
    document.getElementById('comp-back-colors').textContent = algorithms.backtracking.colors_used;
    document.getElementById('comp-back-time').textContent = `${(algorithms.backtracking.execution_time * 1000).toFixed(3)} ms`;
    
    // Pruning insight text
    const difference = algorithms.backtracking.colors_used - algorithms.greedy.colors_used;
    const speedMultiplier = (algorithms.backtracking.execution_time / Math.max(0.000001, algorithms.greedy.execution_time)).toFixed(1);
    
    let insight = '';
    if (difference === 0) {
        insight = `Both algorithms achieved the optimal chromatic number of <strong>${algorithms.greedy.colors_used}</strong>. The Welsh-Powell Greedy heuristic completed <strong>${speedMultiplier}x faster</strong> than the Backtracking exact search.`;
    } else if (difference > 0) {
        insight = `The Welsh-Powell Greedy heuristic yielded <strong>${algorithms.greedy.colors_used}</strong> colors, whereas the exact Backtracking search failed or was restricted. Greedy completed <strong>${speedMultiplier}x faster</strong>.`;
    } else {
        insight = `The exact Backtracking search successfully pruned the search space to find a smaller chromatic number of <strong>${algorithms.backtracking.colors_used}</strong> compared to <strong>${algorithms.greedy.colors_used}</strong> for the Greedy heuristic. However, Greedy was <strong>${speedMultiplier}x faster</strong>.`;
    }
    document.getElementById('comp-insight-text').innerHTML = insight;
    
    // Render Execution Time Chart
    renderExecTimeChart(algorithms.greedy.execution_time * 1000, algorithms.backtracking.execution_time * 1000);
    
    // Render Colors Used Chart
    renderColorsUsedChart(algorithms.greedy.colors_used, algorithms.backtracking.colors_used);
}

function renderExecTimeChart(greedyMs, backMs) {
    if (state.charts.execTime) {
        state.charts.execTime.destroy();
    }
    
    const options = {
        series: [{
            name: 'Execution Time',
            data: [
                { x: 'Greedy Welsh-Powell', y: parseFloat(greedyMs.toFixed(4)) },
                { x: 'Backtracking Search', y: parseFloat(backMs.toFixed(4)) }
            ]
        }],
        chart: {
            type: 'bar',
            height: 250,
            toolbar: { show: false }
        },
        colors: ['#60A5FA', '#C4B5FD'],
        plotOptions: {
            bar: {
                columnWidth: '45%',
                distributed: true,
                borderRadius: 8,
                dataLabels: { position: 'top' }
            }
        },
        dataLabels: {
            enabled: true,
            formatter: function (val) {
                return val.toFixed(3) + " ms";
            },
            offsetY: -20,
            style: { fontSize: '11px', colors: ["#334155"] }
        },
        yaxis: {
            title: { text: 'Time (milliseconds)', style: { fontFamily: 'Outfit' } },
            labels: {
                formatter: function (val) {
                    return val.toFixed(2);
                }
            }
        },
        grid: { show: false }
    };
    
    state.charts.execTime = new ApexCharts(
        document.querySelector("#exec-time-chart"), 
        options
    );
    state.charts.execTime.render();
}

function renderColorsUsedChart(greedyColors, backColors) {
    if (state.charts.colorsUsed) {
        state.charts.colorsUsed.destroy();
    }
    
    const options = {
        series: [{
            name: 'Chromatic Number',
            data: [
                { x: 'Greedy Welsh-Powell', y: greedyColors },
                { x: 'Backtracking Search', y: backColors }
            ]
        }],
        chart: {
            type: 'bar',
            height: 250,
            toolbar: { show: false }
        },
        colors: ['#3B82F6', '#8B5CF6'],
        plotOptions: {
            bar: {
                columnWidth: '45%',
                distributed: true,
                borderRadius: 8,
                dataLabels: { position: 'top' }
            }
        },
        dataLabels: {
            enabled: true,
            offsetY: -20,
            style: { fontSize: '11px', colors: ["#334155"] }
        },
        yaxis: {
            title: { text: 'Colors Used', style: { fontFamily: 'Outfit' } },
            tickAmount: Math.max(1, Math.min(greedyColors, backColors)),
            labels: {
                formatter: function(val) {
                    return Math.round(val);
                }
            }
        },
        grid: { show: false }
    };
    
    state.charts.colorsUsed = new ApexCharts(
        document.querySelector("#colors-used-chart"), 
        options
    );
    state.charts.colorsUsed.render();
}

// 8. FINAL ML EVALUATION RESULTS
function populateResultsTab() {
    const evaluation = state.pipelineData.evaluation;
    const stats = state.pipelineData.stats;
    const algorithms = state.pipelineData.algorithms;
    
    // Selected columns count
    const origCount = stats.original_features;
    const greedyCount = algorithms.greedy.selected_features.length;
    const backCount = algorithms.backtracking.selected_features.length;
    
    // 1. Feature Reduction percentage (radial progress)
    const reductionPercent = ((origCount - greedyCount) / origCount * 100);
    document.getElementById('reduction-radial').style.setProperty('--value', Math.round(reductionPercent));
    document.getElementById('reduction-radial-txt').textContent = Math.round(reductionPercent) + "%";
    document.getElementById('dash-reduction').textContent = `${origCount - greedyCount} / ${origCount}`;
    
    // 2. Average Accuracies
    const avgAcc = { Original: 0, Greedy: 0, Backtracking: 0 };
    const avgTimes = { Original: 0, Greedy: 0, Backtracking: 0 };
    
    evaluation.forEach(item => {
        avgAcc[item.Dataset] += item.Accuracy;
        avgTimes[item.Dataset] += item.TrainingTime;
    });
    
    // average out
    const modelsCount = 4; // LogReg, RF, SVM, KNN
    Object.keys(avgAcc).forEach(k => {
        avgAcc[k] /= modelsCount;
        avgTimes[k] /= modelsCount;
    });
    
    // Update counters
    document.getElementById('dash-orig-acc').textContent = (avgAcc.Original * 100).toFixed(2) + "%";
    document.getElementById('dash-greedy-acc').textContent = (avgAcc.Greedy * 100).toFixed(2) + "%";
    document.getElementById('dash-back-acc').textContent = (avgAcc.Backtracking * 100).toFixed(2) + "%";
    
    // Render evaluation comparison plots
    renderMLEvalCharts(evaluation);
    
    // Render recommendation panel details
    populateRecommendation(avgAcc, avgTimes, origCount, greedyCount);
}

function renderMLEvalCharts(evaluation) {
    if (state.charts.mlAccuracy) state.charts.mlAccuracy.destroy();
    if (state.charts.mlF1) state.charts.mlF1.destroy();
    if (state.charts.mlTime) state.charts.mlTime.destroy();
    
    // Reshape data for group bar charts
    const models = ["Logistic Regression", "Random Forest", "SVM", "KNN"];
    
    const accuracySeries = [
        { name: 'Original (Full Features)', data: [] },
        { name: 'Greedy (Welsh-Powell)', data: [] },
        { name: 'Backtracking', data: [] }
    ];
    
    const f1Series = [
        { name: 'Original (Full Features)', data: [] },
        { name: 'Greedy (Welsh-Powell)', data: [] },
        { name: 'Backtracking', data: [] }
    ];
    
    const timeSeries = [
        { name: 'Original (Full Features)', data: [] },
        { name: 'Greedy (Welsh-Powell)', data: [] },
        { name: 'Backtracking', data: [] }
    ];
    
    models.forEach(modelName => {
        const orig = evaluation.find(e => e.Model === modelName && e.Dataset === 'Original');
        const gred = evaluation.find(e => e.Model === modelName && e.Dataset === 'Greedy');
        const back = evaluation.find(e => e.Model === modelName && e.Dataset === 'Backtracking');
        
        accuracySeries[0].data.push(parseFloat((orig.Accuracy * 100).toFixed(2)));
        accuracySeries[1].data.push(parseFloat((gred.Accuracy * 100).toFixed(2)));
        accuracySeries[2].data.push(parseFloat((back.Accuracy * 100).toFixed(2)));
        
        f1Series[0].data.push(parseFloat((orig.F1Score).toFixed(4)));
        f1Series[1].data.push(parseFloat((gred.F1Score).toFixed(4)));
        f1Series[2].data.push(parseFloat((back.F1Score).toFixed(4)));
        
        timeSeries[0].data.push(parseFloat((orig.TrainingTime * 1000).toFixed(3)));
        timeSeries[1].data.push(parseFloat((gred.TrainingTime * 1000).toFixed(3)));
        timeSeries[2].data.push(parseFloat((back.TrainingTime * 1000).toFixed(3)));
    });
    
    const commonChartOptions = {
        chart: { type: 'bar', height: 280, toolbar: { show: false } },
        colors: ['#94A3B8', '#60A5FA', '#C4B5FD'], // Gray for full, Blue for Greedy, Lavender for Backtracking
        plotOptions: {
            bar: {
                horizontal: false,
                columnWidth: '55%',
                borderRadius: 4,
                endingShape: 'rounded'
            },
        },
        dataLabels: { enabled: false },
        xaxis: { categories: models, labels: { style: { fontSize: '10px' } } },
        grid: { borderColor: '#E2E8F0' }
    };
    
    // 1. Accuracy
    const accOptions = {
        ...commonChartOptions,
        series: accuracySeries,
        yaxis: {
            title: { text: 'Accuracy (%)', style: { fontFamily: 'Outfit' } },
            min: 80,
            max: 100
        }
    };
    state.charts.mlAccuracy = new ApexCharts(document.querySelector("#ml-accuracy-chart"), accOptions);
    state.charts.mlAccuracy.render();
    
    // 2. F1-Score
    const f1Options = {
        ...commonChartOptions,
        series: f1Series,
        yaxis: {
            title: { text: 'F1 Score (0 to 1)', style: { fontFamily: 'Outfit' } },
            min: 0.8,
            max: 1.0
        }
    };
    state.charts.mlF1 = new ApexCharts(document.querySelector("#ml-f1-chart"), f1Options);
    state.charts.mlF1.render();
    
    // 3. Training Time
    const timeOptions = {
        ...commonChartOptions,
        series: timeSeries,
        yaxis: {
            title: { text: 'Training Fitting Time (ms)', style: { fontFamily: 'Outfit' } }
        }
    };
    state.charts.mlTime = new ApexCharts(document.querySelector("#ml-time-chart"), timeOptions);
    state.charts.mlTime.render();
}

function populateRecommendation(avgAcc, avgTimes, origCount, selCount) {
    const accuracyDelta = avgAcc.Greedy - avgAcc.Original;
    const speedupMultiplier = (avgTimes.Original / Math.max(0.000001, avgTimes.Greedy)).toFixed(1);
    
    // Find best combination of dataset + model
    let bestModel = null;
    let highestAcc = 0;
    
    state.pipelineData.evaluation.forEach(item => {
        if (item.Accuracy > highestAcc) {
            highestAcc = item.Accuracy;
            bestModel = item;
        }
    });
    
    document.getElementById('reco-model-name').innerHTML = 
        `<span class='text-primary-dark'>${bestModel.Model}</span> on <span class='text-secondary-dark'>${bestModel.Dataset} Coloring</span> features (${(bestModel.Accuracy * 100).toFixed(2)}% Accuracy)`;
        
    document.getElementById('reco-orig-features').textContent = origCount;
    document.getElementById('reco-sel-features').textContent = selCount;
    
    const redPercent = ((origCount - selCount) / origCount * 100).toFixed(1);
    document.getElementById('reco-reduction-percent').textContent = redPercent + "%";
    
    const accuracyChangeText = accuracyDelta >= 0 
        ? `+${(accuracyDelta * 100).toFixed(2)}% (Accuracy Increase)` 
        : `${(accuracyDelta * 100).toFixed(2)}% (Accuracy Decrease)`;
    document.getElementById('reco-accuracy-delta').textContent = accuracyChangeText;
    document.getElementById('reco-accuracy-delta').style.color = accuracyDelta >= 0 ? '#10B981' : '#F43F5E';
    
    document.getElementById('reco-speedup-multiplier').textContent = speedupMultiplier;
}

function resetPipeline() {
    // Relock navigation items
    document.querySelectorAll('.nav-item').forEach(item => {
        if (item.getAttribute('data-tab') !== 'landing' && item.getAttribute('data-tab') !== 'upload') {
            item.classList.add('locked');
            // Re-append lock icon
            const lockIcon = document.createElement('i');
            lockIcon.className = 'fa-solid fa-lock lock-icon';
            item.appendChild(lockIcon);
        }
    });
    
    // Reset inputs
    document.getElementById('csv-file-input').value = '';
    document.getElementById('threshold-slider').value = '0.80';
    document.getElementById('threshold-val').textContent = '0.80';
    
    // Hide display cards
    document.querySelector('.dataset-stats-display').classList.add('hidden');
    document.querySelector('.placeholder-content').classList.remove('hidden');
    
    // State reset
    state.datasetStats = null;
    state.pipelineData = null;
    if (state.network) {
        state.network.destroy();
        state.network = null;
    }
    
    // Clear charts
    Object.keys(state.charts).forEach(k => {
        state.charts[k].destroy();
    });
    state.charts = {};
    
    switchTab('upload');
}

// 9. HELPER ANIMATIONS & UTILS
function animateCounter(elementId, targetValue) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    let start = 0;
    const duration = 800; // ms
    const increment = targetValue / (duration / 16); // 60fps
    
    element.textContent = "0";
    
    const timer = setInterval(() => {
        start += increment;
        if (start >= targetValue) {
            clearInterval(timer);
            element.textContent = targetValue;
        } else {
            element.textContent = Math.floor(start);
        }
    }, 16);
}
