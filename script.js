// --- STATE MANAGEMENT ---
const state = {
    role: 'admin', // 'admin' or 'viewer'
    searchQuery: '',
    transactions: [
        { id: 1, date: '2023-10-01', desc: 'Monthly Salary', category: 'Salary', type: 'income', amount: 4500 },
        { id: 2, date: '2023-10-03', desc: 'Apartment Rent', category: 'Housing', type: 'expense', amount: 1200 },
        { id: 3, date: '2023-10-05', desc: 'Groceries', category: 'Food', type: 'expense', amount: 150 },
        { id: 4, date: '2023-10-08', desc: 'Electric Bill', category: 'Utilities', type: 'expense', amount: 85 },
        { id: 5, date: '2023-10-12', desc: 'Movie Tickets', category: 'Entertainment', type: 'expense', amount: 40 }
    ]
};

// Global Chart instances to allow destruction and re-rendering
let trendChartInstance = null;
let categoryChartInstance = null;

// --- DOM ELEMENTS ---
const totalBalanceEl = document.getElementById('total-balance');
const totalIncomeEl = document.getElementById('total-income');
const totalExpenseEl = document.getElementById('total-expense');
const transactionBody = document.getElementById('transaction-body');
const emptyStateEl = document.getElementById('empty-state');
const searchInput = document.getElementById('search-input');
const roleSwitch = document.getElementById('role-switch');
const addForm = document.getElementById('add-transaction-form');
const insightsList = document.getElementById('insights-list');

// --- CORE FUNCTIONS ---

// Update the whole UI based on current state
function renderApp() {
    updateSummaryCards();
    renderTransactions();
    renderCharts();
    updateInsights();
    applyRoleBasedUI();
}

function updateSummaryCards() {
    let income = 0;
    let expense = 0;

    state.transactions.forEach(t => {
        if (t.type === 'income') income += t.amount;
        if (t.type === 'expense') expense += t.amount;
    });

    totalIncomeEl.innerText = `$${income.toFixed(2)}`;
    totalExpenseEl.innerText = `$${expense.toFixed(2)}`;
    totalBalanceEl.innerText = `$${(income - expense).toFixed(2)}`;
}

function renderTransactions() {
    transactionBody.innerHTML = '';
    
    // Filter by search query
    const filtered = state.transactions.filter(t => 
        t.desc.toLowerCase().includes(state.searchQuery.toLowerCase()) || 
        t.category.toLowerCase().includes(state.searchQuery.toLowerCase())
    );

    if (filtered.length === 0) {
        emptyStateEl.classList.remove('hidden');
    } else {
        emptyStateEl.classList.add('hidden');
        filtered.sort((a, b) => new Date(b.date) - new Date(a.date)).forEach(t => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${t.date}</td>
                <td>${t.desc}</td>
                <td>${t.category}</td>
                <td class="type-${t.type}">${t.type.toUpperCase()}</td>
                <td>$${t.amount.toFixed(2)}</td>
                <td class="admin-only">
                    <button class="btn-delete" onclick="deleteTransaction(${t.id})">Delete</button>
                </td>
            `;
            transactionBody.appendChild(row);
        });
    }
}

function renderCharts() {
    // Group data for category chart
    const expenses = state.transactions.filter(t => t.type === 'expense');
    const categoryTotals = expenses.reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
    }, {});

    // Prepare Category Chart Data
    const catLabels = Object.keys(categoryTotals);
    const catData = Object.values(categoryTotals);

    if (categoryChartInstance) categoryChartInstance.destroy();
    const catCtx = document.getElementById('categoryChart').getContext('2d');
    categoryChartInstance = new Chart(catCtx, {
        type: 'doughnut',
        data: {
            labels: catLabels.length ? catLabels : ['No Expenses'],
            datasets: [{
                data: catData.length ? catData : [1],
                backgroundColor: ['#e74c3c', '#f39c12', '#3498db', '#9b59b6', '#bdc3c7']
            }]
        }
    });

    // Prepare Trend Chart Data (Simple Income vs Expense bar chart for demo)
    let totalInc = 0, totalExp = 0;
    state.transactions.forEach(t => t.type === 'income' ? totalInc += t.amount : totalExp += t.amount);

    if (trendChartInstance) trendChartInstance.destroy();
    const trendCtx = document.getElementById('trendChart').getContext('2d');
    trendChartInstance = new Chart(trendCtx, {
        type: 'bar',
        data: {
            labels: ['Overview'],
            datasets: [
                { label: 'Income', data: [totalInc], backgroundColor: '#27ae60' },
                { label: 'Expenses', data: [totalExp], backgroundColor: '#e74c3c' }
            ]
        },
        options: { scales: { y: { beginAtZero: true } } }
    });
}

function updateInsights() {
    insightsList.innerHTML = '';
    
    const expenses = state.transactions.filter(t => t.type === 'expense');
    if (expenses.length === 0) {
        insightsList.innerHTML = '<li>Not enough data to generate insights yet.</li>';
        return;
    }

    // Insight 1: Highest spending category
    const categoryTotals = expenses.reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
    }, {});
    
    let highestCat = '';
    let maxAmount = 0;
    for (const [cat, amount] of Object.entries(categoryTotals)) {
        if (amount > maxAmount) {
            maxAmount = amount;
            highestCat = cat;
        }
    }

    // Insight 2: Largest single transaction
    const largestExpense = expenses.reduce((max, t) => t.amount > max.amount ? t : max, expenses[0]);

    insightsList.innerHTML = `
        <li><strong>Highest Spending Category:</strong> ${highestCat} ($${maxAmount.toFixed(2)})</li>
        <li><strong>Largest Single Expense:</strong> ${largestExpense.desc} ($${largestExpense.amount.toFixed(2)})</li>
    `;
}

function applyRoleBasedUI() {
    const adminElements = document.querySelectorAll('.admin-only');
    adminElements.forEach(el => {
        if (state.role === 'admin') {
            el.classList.remove('hidden');
        } else {
            el.classList.add('hidden');
        }
    });
}

// --- EVENT HANDLERS ---

roleSwitch.addEventListener('change', (e) => {
    state.role = e.target.value;
    renderApp();
});

searchInput.addEventListener('input', (e) => {
    state.searchQuery = e.target.value;
    renderTransactions(); // Only re-render table for searches
    applyRoleBasedUI(); // Maintain role visibility on re-render
});

addForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const newTransaction = {
        id: Date.now(), // Generate simple unique ID
        date: document.getElementById('t-date').value,
        desc: document.getElementById('t-desc').value,
        amount: parseFloat(document.getElementById('t-amount').value),
        category: document.getElementById('t-category').value,
        type: document.getElementById('t-type').value
    };

    state.transactions.push(newTransaction);
    addForm.reset();
    renderApp();
});

// Exposed globally so inline HTML onclick can reach it
window.deleteTransaction = function(id) {
    if (state.role !== 'admin') return;
    state.transactions = state.transactions.filter(t => t.id !== id);
    renderApp();
};

// --- INITIALIZE ---
renderApp();