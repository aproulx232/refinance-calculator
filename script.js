// calculate remaining balance on a loan after some months have elapsed
function calculateRemainingBalance(originalAmount, annualRate, termMonths, monthsElapsed) {
    const monthlyRate = annualRate / 100 / 12;
    const payment = (originalAmount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -termMonths));
    
    let balance = originalAmount;
    for (let m = 0; m < monthsElapsed; m++) {
        const interest = balance * monthlyRate;
        const principal = payment - interest;
        balance -= principal;
    }
    return Math.max(0, balance);
}

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
function generateSchedule(amount, annualRate, termMonths, monthOffset = 0, startingBalance = null, extraMonthlyPayment = 0) {
    const schedule = [];
    const monthlyRate = annualRate / 100 / 12;
    // payment formula
    const payment = (amount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -termMonths));
    // use provided starting balance or the amount
    let balance = startingBalance !== null ? startingBalance : amount;
    let cumulativePrincipal = 0;
    let cumulativeInterest = 0;
    
    // add month 0 to show initial balance
    schedule.push({
        month: monthOffset,
        payment: '0.00',
        principal: '0.00',
        interest: '0.00',
        balance: balance.toFixed(2),
        cumulativePrincipal: '0.00',
        cumulativeInterest: '0.00'
    });
    
    let m = 1;
    while (balance > 0.01 && m <= termMonths) { // continue until paid off or max term
        const interest = balance * monthlyRate;
        const principal = payment - interest;
        // apply extra payment towards principal
        const totalPrincipal = principal + extraMonthlyPayment;
        balance -= totalPrincipal;
        if (balance < 0) balance = 0;
        cumulativePrincipal += parseFloat(totalPrincipal);
        cumulativeInterest += parseFloat(interest);
        schedule.push({
            month: monthOffset + m,
            payment: payment.toFixed(2),
            principal: totalPrincipal.toFixed(2),
            interest: interest.toFixed(2),
            balance: balance.toFixed(2),
            cumulativePrincipal: cumulativePrincipal.toFixed(2),
            cumulativeInterest: cumulativeInterest.toFixed(2)
        });
        m++;
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
        const currentStartDateStr = document.getElementById('currentStartDate').value;
        const refinanceDateStr = document.getElementById('refinanceDate').value;
        const currentStartDate = new Date(currentStartDateStr);
        const refinanceDate = new Date(refinanceDateStr);
        const monthsElapsedEstimate = Math.floor((refinanceDate - currentStartDate) / (1000 * 60 * 60 * 24 * 30.44));
        if (tabName === 'currentSchedule') {
            renderChart('currentChart', lastCurrentSchedule, currentStartDateStr, 1);
        } else if (tabName === 'newSchedule') {
            renderChart('newChart', lastNewSchedule, refinanceDateStr, monthsElapsedEstimate + 1);
        } else if (tabName === 'comparison') {
            renderComparisonChart(lastCurrentSchedule, lastNewSchedule, currentStartDateStr, refinanceDateStr);
        }
    }
}
function renderComparisonChart(currentSchedule, newSchedule, currentStartDate, refinanceDate) {
    const ctx = document.getElementById('comparisonChart').getContext('2d');
    
    // parse dates properly to avoid timezone shifts
    let chartCurrentStartDate, chartRefinanceDate;
    
    if (typeof currentStartDate === 'string') {
        const [year, month, day] = currentStartDate.split('-');
        chartCurrentStartDate = new Date(year, month - 1, day);
    } else {
        chartCurrentStartDate = currentStartDate;
    }
    
    if (typeof refinanceDate === 'string') {
        const [year, month, day] = refinanceDate.split('-');
        chartRefinanceDate = new Date(year, month - 1, day);
    } else {
        chartRefinanceDate = refinanceDate;
    }
    
    // create unified date labels - use appropriate start date for each loan
    const allMonths = Array.from(new Set([...currentSchedule, ...newSchedule].map(r => r.month))).sort((a, b) => a - b);
    const labels = allMonths.map(monthNum => {
        // determine if this month belongs to current or new loan
        const isNewLoanMonth = newSchedule[0] && monthNum >= newSchedule[0].month;
        
        if (isNewLoanMonth) {
            // use refinance date for new loan months
            const d = new Date(chartRefinanceDate);
            const newLoanMonthOffset = monthNum - newSchedule[0].month;
            d.setMonth(d.getMonth() + newLoanMonthOffset);
            return d.toLocaleDateString('en-US', { year: '2-digit', month: 'short' });
        } else {
            // use current start date for current loan months
            const d = new Date(chartCurrentStartDate);
            d.setMonth(d.getMonth() + monthNum - 1);
            return d.toLocaleDateString('en-US', { year: '2-digit', month: 'short' });
        }
    });
    
    // create sparse arrays - fill with null where data doesn't exist
    const currentCumulativePrincipal = new Array(allMonths.length).fill(null);
    const newCumulativePrincipal = new Array(allMonths.length).fill(null);
    const currentBalance = new Array(allMonths.length).fill(null);
    const newBalance = new Array(allMonths.length).fill(null);
    
    // populate current loan data
    currentSchedule.forEach(row => {
        const idx = allMonths.indexOf(row.month);
        if (idx !== -1) {
            currentCumulativePrincipal[idx] = parseFloat(row.cumulativePrincipal);
            currentBalance[idx] = parseFloat(row.balance);
        }
    });
    
    // populate new loan data
    newSchedule.forEach(row => {
        const idx = allMonths.indexOf(row.month);
        if (idx !== -1) {
            newCumulativePrincipal[idx] = parseFloat(row.cumulativePrincipal);
            newBalance[idx] = parseFloat(row.balance);
        }
    });

    const config = {
        type: 'line',
        data: {
            labels,
            datasets: [
                {
                    label: 'Current: Cumulative Principal',
                    data: currentCumulativePrincipal,
                    borderColor: 'blue',
                    borderWidth: 0.8,
                    pointRadius: 2,
                    fill: false
                },
                {
                    label: 'New: Cumulative Principal',
                    data: newCumulativePrincipal,
                    borderColor: 'cyan',
                    borderWidth: 0.8,
                    pointRadius: 2,
                    fill: false
                },
                {
                    label: 'Current: Balance',
                    data: currentBalance,
                    borderColor: 'darkblue',
                    borderWidth: 0.8,
                    pointRadius: 2,
                    fill: false,
                    borderDash: [5, 5]
                },
                {
                    label: 'New: Balance',
                    data: newBalance,
                    borderColor: 'darkgreen',
                    borderWidth: 0.8,
                    pointRadius: 2,
                    fill: false,
                    borderDash: [5, 5]
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                x: { title: { display: true, text: 'Date' } },
                y: { title: { display: true, text: 'Amount' } }
            }
        }
    };

    if (comparisonChartInstance) {
        comparisonChartInstance.destroy();
    }
    comparisonChartInstance = new Chart(ctx, config);
}

function renderChart(canvasId, schedule, startDate, scheduleStartMonth = 1) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    
    // parse date string properly to avoid timezone shifts
    let chartStartDate;
    if (typeof startDate === 'string') {
        const [year, month, day] = startDate.split('-');
        chartStartDate = new Date(year, month - 1, day);
    } else {
        chartStartDate = startDate;
    }
    
    // convert month numbers to calendar dates
    // scheduleStartMonth indicates what actual month the schedule data starts at
    const labels = schedule.map(r => {
        const d = new Date(chartStartDate);
        // the schedule month numbers are relative to the full loan timeline
        // we need to adjust: if schedule starts at month 49, and we're using refinanceDate,
        // then month 49 should show as month 1 from refinanceDate
        const monthOffset = r.month - scheduleStartMonth;
        d.setMonth(d.getMonth() + monthOffset);
        return d.toLocaleDateString('en-US', { year: '2-digit', month: 'short' });
    });
    
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
                    borderWidth: 0.8,
                    pointRadius: 2,
                    fill: false
                },
                {
                    label: 'Cumulative Interest',
                    data: cumulativeInterestData,
                    borderColor: 'red',
                    borderWidth: 0.8,
                    pointRadius: 2,
                    fill: false
                },
                {
                    label: 'Remaining Balance',
                    data: balanceData,
                    borderColor: 'green',
                    borderWidth: 0.8,
                    pointRadius: 2,
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                x: { title: { display: true, text: 'Date' } },
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

function renderResults(originalCurrentAmount, remainingBalance, currentRate, remainingMonthsCurrent, newAmount, newRate, newTermMonths, monthsElapsed, currentStartDateStr, refinanceDateStr, extraPayment) {
    // reconstruct original term from remaining months + elapsed
    const fullTermMonths = remainingMonthsCurrent + monthsElapsed;
    // use original amount for current loan calc, remaining balance for new loan
    const results = calculateRefinancing(originalCurrentAmount, remainingBalance, newRate, newTermMonths, currentRate, fullTermMonths);
    const currentDiv = document.getElementById('currentSchedule');
    const newDiv = document.getElementById('newSchedule');
    const comparisonDiv = document.getElementById('comparison');

    // rebuild content but keep/restore canvas elements
    currentDiv.innerHTML = `<h2>Current Loan Schedule</h2>
        <p>Original loan amount: $${originalCurrentAmount.toFixed(2)}</p>
        <p>Monthly payment: $${results.currentPayment}</p>
        <p>Remaining balance at refinance: $${remainingBalance.toFixed(2)}</p>
        <p>Remaining term: ${(remainingMonthsCurrent / 12).toFixed(1)} years</p>
        <p>Months elapsed: ${monthsElapsed}</p>`;
    // make sure canvas exists (might have been removed by innerHTML)
    if (!document.getElementById('currentChart')) {
        const canvas = document.createElement('canvas');
        canvas.id = 'currentChart';
        canvas.width = 600;
        canvas.height = 300;
        currentDiv.appendChild(canvas);
    }
    const currentSchedule = generateSchedule(originalCurrentAmount, currentRate, fullTermMonths, 0, null, extraPayment);
    lastCurrentSchedule = currentSchedule;
    currentDiv.innerHTML += scheduleToHtml(currentSchedule);
    renderChart('currentChart', currentSchedule, currentStartDateStr);

    newDiv.innerHTML = `<h2>New Loan Schedule</h2>
        <p>Refinance amount: $${newAmount.toFixed(2)}</p>
        <p>Monthly payment: $${results.newPayment}</p>
        <p>Term: ${(newTermMonths / 12).toFixed(1)} years</p>`;
    if (!document.getElementById('newChart')) {
        const canvas = document.createElement('canvas');
        canvas.id = 'newChart';
        canvas.width = 600;
        canvas.height = 300;
        newDiv.appendChild(canvas);
    }
    const newSchedule = generateSchedule(newAmount, newRate, newTermMonths, monthsElapsed, newAmount, extraPayment);
    lastNewSchedule = newSchedule;
    newDiv.innerHTML += scheduleToHtml(newSchedule);
    // new schedule starts at month (monthsElapsed + 1), and we want dates from refinanceDate
    renderChart('newChart', newSchedule, refinanceDateStr, monthsElapsed + 1);

    comparisonDiv.innerHTML = `<h2>Side-by-Side Comparison</h2>
        <p>Current monthly payment: $${results.currentPayment}</p>
        <p>New monthly payment: $${results.newPayment}</p>
        <p>Monthly savings: $${(parseFloat(results.currentPayment) - parseFloat(results.newPayment)).toFixed(2)}</p>
        <p>Total savings over loan term: $${results.savings}</p>`;
    if (!document.getElementById('comparisonChart')) {
        const canvas = document.createElement('canvas');
        canvas.id = 'comparisonChart';
        canvas.width = 600;
        canvas.height = 300;
        comparisonDiv.appendChild(canvas);
    }
    renderComparisonChart(currentSchedule, newSchedule, currentStartDateStr, refinanceDateStr);
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
        const currentStartDateStr = document.getElementById('currentStartDate').value;
        const refinanceDateStr = document.getElementById('refinanceDate').value;
        
        let amountNew = parseFloat(document.getElementById('newAmount').value);
        let rateNew = parseFloat(document.getElementById('newRate').value);
        let termNew = parseInt(document.getElementById('newTerm').value, 10) * 12;
        let extraPayment = parseFloat(document.getElementById('extraPayment').value);

        // fall back to defaults if anything is missing or NaN (do this BEFORE calculations)
        if (isNaN(amountCurrent)) amountCurrent = DEFAULTS.currentAmount;
        if (isNaN(rateCurrent)) rateCurrent = DEFAULTS.currentRate;
        if (isNaN(rateNew)) rateNew = DEFAULTS.newRate;
        if (isNaN(termCurrent)) termCurrent = DEFAULTS.currentTermYears * 12;
        if (isNaN(termNew)) termNew = DEFAULTS.newTermYears * 12;
        if (isNaN(extraPayment)) extraPayment = 1000;

        const currentStartDate = new Date(currentStartDateStr);
        const refinanceDate = new Date(refinanceDateStr);
        
        // calculate months elapsed on current loan
        const monthsElapsed = Math.floor((refinanceDate - currentStartDate) / (1000 * 60 * 60 * 24 * 30.44));
        const remainingMonthsCurrent = Math.max(0, termCurrent - monthsElapsed);
        
        // generate current loan schedule with extra payments to get accurate remaining balance
        const fullTermMonths = remainingMonthsCurrent + monthsElapsed;
        const tempCurrentSchedule = generateSchedule(amountCurrent, rateCurrent, fullTermMonths, 0, null, extraPayment);
        
        // find the balance at the refinance month (monthsElapsed)
        const refinanceMonthEntry = tempCurrentSchedule.find(entry => entry.month === monthsElapsed);
        const remainingBalance = refinanceMonthEntry ? parseFloat(refinanceMonthEntry.balance) : 0;
        
        // for new amount, use remaining balance if user didn't enter a value
        if (isNaN(amountNew)) amountNew = remainingBalance;

        renderResults(amountCurrent, remainingBalance, rateCurrent, remainingMonthsCurrent, amountNew, rateNew, termNew, monthsElapsed, currentStartDateStr, refinanceDateStr, extraPayment);
        showTab('comparison');
    });
});
