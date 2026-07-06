// App State Management
let state = {
    budget: parseFloat(localStorage.getItem('budget')) || 0,
    expenses: JSON.parse(localStorage.getItem('expenses')) || [],
    editingId: null // Tracks which item is currently being edited
};

// DOM Selectors
const budgetInput = document.getElementById('budget-input');
const setBudgetBtn = document.getElementById('set-budget-btn');
const expenseForm = document.getElementById('expense-form');
const expTitle = document.getElementById('exp-title');
const expAmount = document.getElementById('exp-amount');
const expCategory = document.getElementById('exp-category');
const filterCategory = document.getElementById('filter-category');
const expenseList = document.getElementById('expense-list');

const budgetDisplay = document.getElementById('budget-display');
const expenseDisplay = document.getElementById('expense-display');
const balanceDisplay = document.getElementById('balance-display');
const submitBtn = expenseForm.querySelector('.btn-submit');

// Initialize App Data
function init() {
    updateDashboard();
    renderExpenses(state.expenses);
}

// Global Financial Calculations
function getTotalSpent() {
    return state.expenses.reduce((acc, current) => acc + current.amount, 0);
}

function updateDashboard() {
    const totalSpent = getTotalSpent();
    const remainingBalance = state.budget - totalSpent;

    budgetDisplay.textContent = `$${state.budget.toFixed(2)}`;
    expenseDisplay.textContent = `$${totalSpent.toFixed(2)}`;
    balanceDisplay.textContent = `$${remainingBalance.toFixed(2)}`;

    if (remainingBalance < 0) {
        balanceDisplay.style.color = 'var(--danger)';
    } else {
        balanceDisplay.style.color = 'var(--success)';
    }
}

// Render dynamic table updates
function renderExpenses(expensesToRender) {
    expenseList.innerHTML = '';

    if (expensesToRender.length === 0) {
        expenseList.innerHTML = `<tr><td colspan="4" style="text-align:center; color: var(--text-muted);">No records found.</td></tr>`;
        return;
    }

    expensesToRender.forEach(expense => {
        const row = document.createElement('tr');
        
        if (state.editingId === expense.id) {
            row.style.backgroundColor = '#f3f4f6';
        }

        row.innerHTML = `
            <td><strong>${expense.title}</strong></td>
            <td><span class="category-tag">${expense.category}</span></td>
            <td>$${expense.amount.toFixed(2)}</td>
            <td>
                <button class="btn-edit" onclick="startEdit(${expense.id})"><i class="fa-solid fa-pen-to-square"></i></button>
                <button class="btn-delete" onclick="deleteExpense(${expense.id})"><i class="fa-solid fa-trash-can"></i></button>
            </td>
        `;
        expenseList.appendChild(row);
    });
}

// Budget Setup with safety threshold checks
setBudgetBtn.addEventListener('click', () => {
    const val = parseFloat(budgetInput.value);
    if (isNaN(val) || val < 0) {
        alert("Please enter a valid positive budget amount.");
        return;
    }

    const currentSpent = getTotalSpent();
    if (val < currentSpent) {
        const proceed = confirm(`Warning: Your new budget ($${val.toFixed(2)}) is lower than what you have already spent ($${currentSpent.toFixed(2)}). Do you want to proceed?`);
        if (!proceed) return;
    }

    state.budget = val;
    localStorage.setItem('budget', state.budget);
    updateDashboard();
    budgetInput.value = '';
});

// Create OR Update Submissions handler
expenseForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const inputAmount = parseFloat(expAmount.value);

    if (isNaN(inputAmount) || inputAmount <= 0) {
        alert("Expense amount must be a positive number greater than zero.");
        return;
    }

    if (state.editingId !== null) {
        // --- EDIT MODE ---
        state.expenses = state.expenses.map(item => {
            if (item.id === state.editingId) {
                return {
                    ...item,
                    title: expTitle.value.trim(),
                    amount: inputAmount,
                    category: expCategory.value
                };
            }
            return item;
        });
        state.editingId = null;
        submitBtn.textContent = "Add Transaction";
        submitBtn.style.background = "var(--primary)";
        
        // Keep active filter context intact during mutations
    } else {
        // --- CREATE MODE ---
        const newExpense = {
            id: Date.now(),
            title: expTitle.value.trim(),
            amount: inputAmount,
            category: expCategory.value
        };
        state.expenses.push(newExpense);
        
        // Reset category filter when creating, making the new transaction visible immediately
        filterCategory.value = 'All';
    }

    localStorage.setItem('expenses', JSON.stringify(state.expenses));
    
    // Reset form field inputs & apply UI pipeline modifications
    expenseForm.reset();
    updateDashboard();
    applyFilter();
});

// Setup form state for updating records
window.startEdit = function(id) {
    const target = state.expenses.find(item => item.id === id);
    if (!target) return;

    state.editingId = id;
    
    expTitle.value = target.title;
    expAmount.value = target.amount;
    expCategory.value = target.category;

    submitBtn.textContent = "Update Transaction Details";
    submitBtn.style.background = "#f59e0b";
    
    applyFilter(); // Re-render inside existing bounds to preserve focus highlights safely
};

window.deleteExpense = function(id) {
    if (state.editingId === id) {
        state.editingId = null;
        expenseForm.reset();
        submitBtn.textContent = "Add Transaction";
        submitBtn.style.background = "var(--primary)";
    }

    state.expenses = state.expenses.filter(item => item.id !== id);
    localStorage.setItem('expenses', JSON.stringify(state.expenses));
    updateDashboard();
    applyFilter();
};

// Filter View Engine
function applyFilter() {
    const selectedCategory = filterCategory.value;
    if (selectedCategory === 'All') {
        renderExpenses(state.expenses);
    } else {
        const filtered = state.expenses.filter(exp => exp.category === selectedCategory);
        renderExpenses(filtered);
    }
}

filterCategory.addEventListener('change', applyFilter);

// Spin up app on initialization
init();