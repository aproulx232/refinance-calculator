// mortgage calculator logic for refinancing calculations

function calculateRefinancing(amount, newRate, newTerm, currentRate, currentTerm) {
    const monthlyCurrentRate = currentRate / 100 / 12;
    const monthlyNewRate = newRate / 100 / 12;
    const currentPayment = (amount * monthlyCurrentRate) / (1 - Math.pow(1 + monthlyCurrentRate, -currentTerm));
    const newPayment = (amount * monthlyNewRate) / (1 - Math.pow(1 + monthlyNewRate, -newTerm));

    return {
        currentPayment: currentPayment.toFixed(2),
        newPayment: newPayment.toFixed(2),
        savings: (currentPayment * currentTerm - newPayment * newTerm).toFixed(2)
    };
}

// hook UI and calculation logic

function renderResults(amount, currentRate, currentTermMonths, newRate, newTermMonths) {
    const results = calculateRefinancing(amount, newRate, newTermMonths, currentRate, currentTermMonths);
    const currentDiv = document.getElementById('currentSchedule');
    const newDiv = document.getElementById('newSchedule');
    const comparisonDiv = document.getElementById('comparison');

    currentDiv.innerHTML = `<h2>Current Loan Schedule</h2>
        <p>Monthly payment: $${results.currentPayment}</p>
        <p>Term: ${currentTermMonths / 12} years</p>`;
    newDiv.innerHTML = `<h2>New Loan Schedule</h2>
        <p>Monthly payment: $${results.newPayment}</p>
        <p>Term: ${newTermMonths / 12} years</p>`;
    comparisonDiv.innerHTML = `<h2>Side-by-Side Comparison</h2>
        <p>Current payment: $${results.currentPayment}</p>
        <p>New payment: $${results.newPayment}</p>
        <p>Total savings: $${results.savings}</p>`;
}

// wire up the form submission
window.addEventListener('DOMContentLoaded', () => {
    // show the default tab
    showTab('currentSchedule');

    document.getElementById('calculatorForm').addEventListener('submit', function (e) {
        e.preventDefault();
        const amountCurrent = parseFloat(document.getElementById('currentAmount').value);
        const rateCurrent = parseFloat(document.getElementById('currentRate').value);
        const termCurrent = parseInt(document.getElementById('currentTerm').value, 10) * 12;
        const amountNew = parseFloat(document.getElementById('newAmount').value);
        const rateNew = parseFloat(document.getElementById('newRate').value);
        const termNew = parseInt(document.getElementById('newTerm').value, 10) * 12;

        // for now we assume amount stays the same if user leaves new amount blank
        const loanAmount = isNaN(amountNew) ? amountCurrent : amountNew;
        renderResults(loanAmount, rateCurrent, termCurrent, rateNew, termNew);
        showTab('comparison');
    });
});
