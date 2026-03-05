// mortgage calculator logic for refinancing calculations

// calculate payments separately for each loan amount
function calculateRefinancing(currentAmount, newAmount, newRate, newTerm, currentRate, currentTerm) {
    const monthlyCurrentRate = currentRate / 100 / 12;
    const monthlyNewRate = newRate / 100 / 12;
    const currentPayment = (currentAmount * monthlyCurrentRate) / (1 - Math.pow(1 + monthlyCurrentRate, -currentTerm));
    const newPayment = (newAmount * monthlyNewRate) / (1 - Math.pow(1 + monthlyNewRate, -newTerm));

    return {
        currentPayment: currentPayment.toFixed(2),
        newPayment: newPayment.toFixed(2),
        savings: (currentPayment * currentTerm - newPayment * newTerm).toFixed(2)
    };
}

// compute amortization schedule for given loan
function generateSchedule(amount, annualRate, termMonths) {
    const schedule = [];
    const monthlyRate = annualRate / 100 / 12;
    // payment formula
    const payment = (amount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -termMonths));
    let balance = amount;
    let cumulativePrincipal = 0;
    let cumulativeInterest = 0;
    for (let m = 1; m <= termMonths; m++) {
        const interest = balance * monthlyRate;
        const principal = payment - interest;
        balance -= principal;
        if (balance < 0) balance = 0;
        cumulativePrincipal += parseFloat(principal);
        cumulativeInterest += parseFloat(interest);
        schedule.push({
            month: m,
            payment: payment.toFixed(2),
            principal: principal.toFixed(2),
            interest: interest.toFixed(2),
            balance: balance.toFixed(2),
            cumulativePrincipal: cumulativePrincipal.toFixed(2),
            cumulativeInterest: cumulativeInterest.toFixed(2)
        });
    }
    return schedule;
}

// helper for building html table from schedule
function scheduleToHtml(schedule) {
    let html = '<table class="amort-table"><thead><tr>' +
        '<th>Month</th><th>Payment</th><th>Principal</th><th>Interest</th><th>Balance</th>' +
        '</tr></thead><tbody>';
    schedule.forEach(row => {
        html += `<tr><td>${row.month}</td><td>${row.payment}</td><td>${row.principal}</td><td>${row.interest}</td><td>${row.balance}</td></tr>`;
    });
    html += '</tbody></table>';
    return html;
}

// chart instances for reuse
let currentChartInstance = null;
let newChartInstance = null;
let comparisonChartInstance = null;

// store schedules for re-rendering on tab switch
let lastCurrentSchedule = null;
let lastNewSchedule = null;

function showTab(tabName) {
    document.getElementById('currentSchedule').style.display = 'none';
    document.getElementById('newSchedule').style.display = 'none';
    document.getElementById('comparison').style.display = 'none';
    document.getElementById(tabName).style.display = 'block';

    // re-render chart when tab becomes visible
    if (lastCurrentSchedule && lastNewSchedule) {
        if (tabName === 'currentSchedule') {
            renderChart('currentChart', lastCurrentSchedule);
        } else if (tabName === 'newSchedule') {
            renderChart('newChart', lastNewSchedule);
        } else if (tabName === 'comparison') {
            renderComparisonChart(lastCurrentSchedule, lastNewSchedule);
        }
    }
}
function renderComparisonChart(currentSchedule, newSchedule) {
    const ctx = document.getElementById('comparisonChart').getContext('2d');
    const labels = currentSchedule.map(r => r.month);
    const currentCumulativePrincipal = currentSchedule.map(r => parseFloat(r.cumulativePrincipal));
    const newCumulativePrincipal = newSchedule.map(r => parseFloat(r.cumulativePrincipal));
    const currentBalance = currentSchedule.map(r => parseFloat(r.balance));
    const newBalance = newSchedule.map(r => parseFloat(r.balance));

    const config = {
        type: 'line',
        data: {
            labels,
            datasets: [
                {
                    label: 'Current: Cumulative Principal',
                    data: currentCumulativePrincipal,
                    borderColor: 'blue',
                    borderWidth: 1.5,
                    fill: false
                },
                {
                    label: 'New: Cumulative Principal',
                    data: newCumulativePrincipal,
                    borderColor: 'cyan',
                    borderWidth: 1.5,
                    fill: false
                },
                {
                    label: 'Current: Balance',
                    data: currentBalance,
                    borderColor: 'darkblue',
                    borderWidth: 1.5,
                    fill: false,
                    borderDash: [5, 5]
                },
                {
                    label: 'New: Balance',
                    data: newBalance,
                    borderColor: 'darkgreen',
                    borderWidth: 1.5,
                    fill: false,
                    borderDash: [5, 5]
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                x: { title: { display: true, text: 'Month' } },
                y: { title: { display: true, text: 'Amount' } }
            }
        }
    };

    if (comparisonChartInstance) {
        comparisonChartInstance.destroy();
    }
    comparisonChartInstance = new Chart(ctx, config);
}

function renderChart(canvasId, schedule) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    const labels = schedule.map(r => r.month);
    const cumulativePrincipalData = schedule.map(r => parseFloat(r.cumulativePrincipal));
    const cumulativeInterestData = schedule.map(r => parseFloat(r.cumulativeInterest));
    const balanceData = schedule.map(r => parseFloat(r.balance));

    const config = {
        type: 'line',
        data: {
            labels,
            datasets: [
                {
                    label: 'Cumulative Principal',
                    data: cumulativePrincipalData,
                    borderColor: 'blue',
                    borderWidth: 1.5,
                    fill: false
                },
                {
                    label: 'Cumulative Interest',
                    data: cumulativeInterestData,
                    borderColor: 'red',
                    borderWidth: 1.5,
                    fill: false
                },
                {
                    label: 'Remaining Balance',
                    data: balanceData,
                    borderColor: 'green',
                    borderWidth: 1.5,
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                x: { title: { display: true, text: 'Month' } },
                y: { title: { display: true, text: 'Amount' } }
            }
        }
    };

    // destroy previous chart if exists
    if (canvasId === 'currentChart' && currentChartInstance) {
        currentChartInstance.destroy();
    }
    if (canvasId === 'newChart' && newChartInstance) {
        newChartInstance.destroy();
    }

    const chart = new Chart(ctx, config);
    if (canvasId === 'currentChart') currentChartInstance = chart;
    if (canvasId === 'newChart') newChartInstance = chart;
}


// hook UI and calculation logic

function renderResults(currentAmount, currentRate, currentTermMonths, newAmount, newRate, newTermMonths) {
    const results = calculateRefinancing(currentAmount, newAmount, newRate, newTermMonths, currentRate, currentTermMonths);
    const currentDiv = document.getElementById('currentSchedule');
    const newDiv = document.getElementById('newSchedule');
    const comparisonDiv = document.getElementById('comparison');

    // rebuild content but keep/restore canvas elements
    currentDiv.innerHTML = `<h2>Current Loan Schedule</h2>
        <p>Monthly payment: $${results.currentPayment}</p>
        <p>Term: ${currentTermMonths / 12} years</p>`;
    // make sure canvas exists (might have been removed by innerHTML)
    if (!document.getElementById('currentChart')) {
        const canvas = document.createElement('canvas');
        canvas.id = 'currentChart';
        canvas.width = 400;
        canvas.height = 200;
        currentDiv.appendChild(canvas);
    }
    const currentSchedule = generateSchedule(currentAmount, currentRate, currentTermMonths);
    lastCurrentSchedule = currentSchedule;
    currentDiv.innerHTML += scheduleToHtml(currentSchedule);
    renderChart('currentChart', currentSchedule);

    newDiv.innerHTML = `<h2>New Loan Schedule</h2>
        <p>Monthly payment: $${results.newPayment}</p>
        <p>Term: ${newTermMonths / 12} years</p>`;
    if (!document.getElementById('newChart')) {
        const canvas = document.createElement('canvas');
        canvas.id = 'newChart';
        canvas.width = 400;
        canvas.height = 200;
        newDiv.appendChild(canvas);
    }
    const newSchedule = generateSchedule(newAmount, newRate, newTermMonths);
    lastNewSchedule = newSchedule;
    newDiv.innerHTML += scheduleToHtml(newSchedule);
    renderChart('newChart', newSchedule);

    comparisonDiv.innerHTML = `<h2>Side-by-Side Comparison</h2>
        <p>Current monthly payment: $${results.currentPayment}</p>
        <p>New monthly payment: $${results.newPayment}</p>
        <p>Monthly savings: $${(parseFloat(results.currentPayment) - parseFloat(results.newPayment)).toFixed(2)}</p>
        <p>Total savings over loan term: $${results.savings}</p>`;
    if (!document.getElementById('comparisonChart')) {
        const canvas = document.createElement('canvas');
        canvas.id = 'comparisonChart';
        canvas.width = 400;
        canvas.height = 200;
        comparisonDiv.appendChild(canvas);
    }
    renderComparisonChart(currentSchedule, newSchedule);
}

// wire up the form submission
window.addEventListener('DOMContentLoaded', () => {
    // show the default tab
    showTab('currentSchedule');

    // default parameters used when inputs are empty
    const DEFAULTS = {
        currentAmount: 200000,
        currentRate: 4.5,
        currentTermYears: 30,
        newAmount: 200000,
        newRate: 3.5,
        newTermYears: 30
    };

    document.getElementById('calculatorForm').addEventListener('submit', function (e) {
        e.preventDefault();
        let amountCurrent = parseFloat(document.getElementById('currentAmount').value);
        let rateCurrent = parseFloat(document.getElementById('currentRate').value);
        let termCurrent = parseInt(document.getElementById('currentTerm').value, 10) * 12;
        let amountNew = parseFloat(document.getElementById('newAmount').value);
        let rateNew = parseFloat(document.getElementById('newRate').value);
        let termNew = parseInt(document.getElementById('newTerm').value, 10) * 12;

        // fall back to defaults if anything is missing or NaN
        if (isNaN(amountCurrent)) amountCurrent = DEFAULTS.currentAmount;
        if (isNaN(rateCurrent)) rateCurrent = DEFAULTS.currentRate;
        if (isNaN(termCurrent)) termCurrent = DEFAULTS.currentTermYears * 12;
        if (isNaN(amountNew)) amountNew = DEFAULTS.newAmount;
        if (isNaN(rateNew)) rateNew = DEFAULTS.newRate;
        if (isNaN(termNew)) termNew = DEFAULTS.newTermYears * 12;

        renderResults(amountCurrent, rateCurrent, termCurrent, amountNew, rateNew, termNew);
        showTab('comparison');
    });
});
