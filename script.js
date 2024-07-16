let data = [];
let chart = null;
let transformHistory = [];

document.getElementById('csvFile').addEventListener('change', handleFileUpload);
document.getElementById('visualizeBtn').addEventListener('click', visualizeData);
document.getElementById('applyFilterBtn').addEventListener('click', applyFilter);
document.getElementById('resetFilterBtn').addEventListener('click', resetFilter);
document.getElementById('applyTransformBtn').addEventListener('click', applyTransform);
document.getElementById('undoTransformBtn').addEventListener('click', undoTransform);
document.getElementById('exportBtn').addEventListener('click', exportToCSV);
document.getElementById('statsColumn').addEventListener('change', calculateStats);

function handleFileUpload(event) {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = function(e) {
        const contents = e.target.result;
        originalData = parseCSV(contents);
        filteredData = [...originalData];
        updateDataPreview();
        populateAxisSelects();
        populateFilterColumn();
        populateTransformColumn();
        populateStatsColumn();
    };
    reader.readAsText(file);
}

function populateTransformColumn() {
    const transformSelect = document.getElementById('transformColumn');
    transformSelect.innerHTML = '<option value="">Select column to transform</option>';
    Object.keys(originalData[0]).forEach(column => {
        if (!isNaN(originalData[0][column])) {
            transformSelect.add(new Option(column, column));
        }
    });
}

function applyTransform() {
    const column = document.getElementById('transformColumn').value;
    const operation = document.getElementById('transformOperation').value;
    const value = parseFloat(document.getElementById('transformValue').value);

    if (!column || isNaN(value)) {
        alert('Please select a column and enter a valid number.');
        return;
    }

    transformHistory.push([...filteredData]);

    filteredData = filteredData.map(row => {
        const newRow = {...row};
        const originalValue = parseFloat(row[column]);
        switch (operation) {
            case 'add':
                newRow[column] = originalValue + value;
                break;
            case 'subtract':
                newRow[column] = originalValue - value;
                break;
            case 'multiply':
                newRow[column] = originalValue * value;
                break;
            case 'divide':
                newRow[column] = originalValue / value;
                break;
        }
        return newRow;
    });

    updateDataPreview();
    visualizeData();
}


function undoTransform() {
    if (transformHistory.length > 0) {
        filteredData = transformHistory.pop();
        updateDataPreview();
        visualizeData();
    } else {
        alert('No more transformations to undo.');
    }
}


function populateFilterColumn() {
    const filterSelect = document.getElementById('filterColumn');
    filterSelect.innerHTML = '<option value="">Select column to filter</option>';
    Object.keys(originalData[0]).forEach(column => {
        filterSelect.add(new Option(column, column));
    });
    filterSelect.addEventListener('change', updateFilterRange);
}

function updateFilterRange() {
    const column = document.getElementById('filterColumn').value;
    const filterRange = document.getElementById('filterRange');
    if (!column) {
        filterRange.innerHTML = '';
        return;
    }
    
    const values = originalData.map(row => row[column]);
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    filterRange.innerHTML = `
        <input type="number" id="filterMin" value="${min}" step="any">
        <input type="number" id="filterMax" value="${max}" step="any">
    `;
}

function applyFilter() {
    const column = document.getElementById('filterColumn').value;
    const min = parseFloat(document.getElementById('filterMin').value);
    const max = parseFloat(document.getElementById('filterMax').value);
    
    filteredData = originalData.filter(row => {
        const value = parseFloat(row[column]);
        return value >= min && value <= max;
    });
    
    updateDataPreview();
    visualizeData();
}

function resetFilter() {
    filteredData = [...originalData];
    updateDataPreview();
    visualizeData();
    document.getElementById('filterColumn').selectedIndex = 0;
    document.getElementById('filterRange').innerHTML = '';
}

function parseCSV(contents) {
    const lines = contents.split('\n');
    const headers = lines[0].split(',');
    return lines.slice(1).map(line => {
        const values = line.split(',');
        return headers.reduce((obj, header, index) => {
            obj[header] = values[index];
            return obj;
        }, {});
    });
}

function updateDataPreview() {
    const tableHeader = document.getElementById('tableHeader');
    const tableBody = document.getElementById('tableBody');
    const rowCount = document.getElementById('rowCount');

    // Clear existing content
    tableHeader.innerHTML = '';
    tableBody.innerHTML = '';

    if (filteredData.length === 0) {
        rowCount.textContent = 'No data to display.';
        return;
    }

    // Create table header
    const headers = Object.keys(filteredData[0]);
    headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header;
        tableHeader.appendChild(th);
    });

    // Populate table body
    filteredData.slice(0, 5).forEach(row => {
        const tr = document.createElement('tr');
        headers.forEach(header => {
            const td = document.createElement('td');
            td.textContent = row[header];
            tr.appendChild(td);
        });
        tableBody.appendChild(tr);
    });

    rowCount.textContent = `Showing ${Math.min(5, filteredData.length)} of ${filteredData.length} rows`;
}

function populateAxisSelects() {
    const columns = Object.keys(filteredData[0]);
    const xSelect = document.getElementById('xAxis');
    const ySelect = document.getElementById('yAxis');
    xSelect.innerHTML = '';
    ySelect.innerHTML = '';
    columns.forEach(column => {
        xSelect.add(new Option(column, column));
        ySelect.add(new Option(column, column));
    });
}

function exportToCSV() {
    const headers = Object.keys(filteredData[0]);
    let csvContent = headers.join(',') + '\n';

    filteredData.forEach(row => {
        const values = headers.map(header => {
            const value = row[header];
            return typeof value === 'string' ? `"${value}"` : value;
        });
        csvContent += values.join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "exported_data.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

function populateStatsColumn() {
    const statsSelect = document.getElementById('statsColumn');
    statsSelect.innerHTML = '<option value="">Select column for statistics</option>';
    Object.keys(originalData[0]).forEach(column => {
        const hasNumericData = originalData.some(row => !isNaN(parseFloat(row[column])) && row[column] !== '');
        if (hasNumericData) {
            statsSelect.add(new Option(column, column));
        }
    });
    statsSelect.addEventListener('change', calculateStats);
}
function calculateStats() {
    const column = document.getElementById('statsColumn').value;
    if (!column) {
        document.getElementById('statsResult').innerHTML = '';
        return;
    }

    const values = filteredData.map(row => row[column]).filter(value => !isNaN(parseFloat(value)) && value !== '');
    
    if (values.length === 0) {
        document.getElementById('statsResult').innerHTML = '<p>No numeric data available for this column.</p>';
        return;
    }

    const numericValues = values.map(v => parseFloat(v));
    const sum = numericValues.reduce((a, b) => a + b, 0);
    const mean = sum / numericValues.length;
    const min = Math.min(...numericValues);
    const max = Math.max(...numericValues);
    const sorted = numericValues.sort((a, b) => a - b);
    const median = sorted.length % 2 === 0 
        ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
        : sorted[Math.floor(sorted.length / 2)];

    const statsResult = document.getElementById('statsResult');
    statsResult.innerHTML = `
        <p>Count: ${numericValues.length}</p>
        <p>Sum: ${sum.toFixed(2)}</p>
        <p>Mean: ${mean.toFixed(2)}</p>
        <p>Median: ${median.toFixed(2)}</p>
        <p>Min: ${min.toFixed(2)}</p>
        <p>Max: ${max.toFixed(2)}</p>
    `;
}

function visualizeData() {
    const xAxis = document.getElementById('xAxis').value;
    const yAxis = document.getElementById('yAxis').value;
    const chartType = document.getElementById('chartType').value;
    const ctx = document.getElementById('chart').getContext('2d');

    if (chart) {
        chart.destroy();
    }

    const chartData = {
        labels: filteredData.map(row => row[xAxis]),
        datasets: [{
            label: `${yAxis} vs ${xAxis}`,
            data: filteredData.map(row => parseFloat(row[yAxis])),
            backgroundColor: 'rgba(75, 192, 192, 0.6)'
        }]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: {
                title: {
                    display: true,
                    text: xAxis
                }
            },
            y: {
                title: {
                    display: true,
                    text: yAxis
                }
            }
        }
    };

    chart = new Chart(ctx, {
        type: chartType,
        data: chartData,
        options: chartOptions
    });
}
