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

// Example usage:
const refinancingResults = calculateRefinancing(200000, 3.5, 30, 4.5, 30);
console.log(refinancingResults); // Output the results