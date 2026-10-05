// @module: Frontend Web Application.component.Budgets
// @spec_section_id: implementation_blueprint
// @req_ids: BUD-02, BUD-03, BUD-04
// @agent: CodeGenerationAgent
// @run_id: run-p4-1790144399
// @version: 1

import React, { useState, useEffect, useMemo, useCallback } from 'react';

// --- Types & Interfaces ---

export interface Budget {
  id: string;
  category: string;
  limit: number;
  spent: number;
  period: 'weekly' | 'monthly';
  billingCycle: string; // e.g., '2023-10'
}

export interface HistoricalBudgetPerformance {
  cycle: string;
  category: string;
  limit: number;
  spent: number;
  status: 'under' | 'warning' | 'exceeded';
}

export interface BudgetsComponentProps {
  initialCycle?: string;
}

// --- Mock / Sibling API Client Interface ---
// In production, this matches the sibling frontend_web_applicationApi.ts service contract.
interface BudgetsApiService {
  fetchBudgets(cycle?: string): Promise<Budget[]>;
  fetchHistoricalPerformance(): Promise<HistoricalBudgetPerformance[]>;
  createBudget(budget: Omit<Budget, 'id' | 'spent'>): Promise<Budget>;
}

// Simulated sibling API client implementation
const api: BudgetsApiService = {
  async fetchBudgets(cycle?: string): Promise<Budget[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          { id: 'b-1', category: 'Groceries', limit: 500, spent: 420, period: 'monthly', billingCycle: cycle || '2023-11' },
          { id: 'b-2', category: 'Dining Out', limit: 200, spent: 210, period: 'monthly', billingCycle: cycle || '2023-11' },
          { id: 'b-3', category: 'Utilities', limit: 150, spent: 100, period: 'monthly', billingCycle: cycle || '2023-11' },
        ]);
      }, 300);
    });
  },
  async fetchHistoricalPerformance(): Promise<HistoricalBudgetPerformance[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          { cycle: '2023-10', category: 'Groceries', limit: 500, spent: 480, status: 'warning' },
          { cycle: '2023-10', category: 'Dining Out', limit: 200, spent: 225, status: 'exceeded' },
          { cycle: '2023-09', category: 'Groceries', limit: 450, spent: 400, status: 'under' },
        ]);
      }, 300);
    });
  },
  async createBudget(newBudget: Omit<Budget, 'id' | 'spent'>): Promise<Budget> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id: `b-${Date.now()}`,
          ...newBudget,
          spent: 0,
        });
      }, 300);
    });
  }
};

// --- Sub-Components adhering to CMP-12, CMP-13, CMP-14 ---

interface ProgressBarProps {
  spent: number;
  limit: number;
}

/**
 * CMP-12 (ProgressBar)
 * Triggers visual warnings when spending reaches 80% and 100% of the budget limit (BUD-03).
 */
const ProgressBar: React.FC<ProgressBarProps> = ({ spent, limit }) => {
  const percentage = limit > 0 ? Math.min(Math.round((spent / limit) * 100), 100) : 0;
  const rawRatio = limit > 0 ? spent / limit : 0;

  let barColor = 'bg-emerald-500';
  if (rawRatio >= 1.0) {
    barColor = 'bg-red-600 animate-pulse';
  } else if (rawRatio >= 0.8) {
    barColor = 'bg-amber-500';
  }

  return (
    <div className="w-full">
      <div className="flex justify-between text-sm mb-1 font-medium text-slate-700">
        <span>${spent.toLocaleString()} spent</span>
        <span>Limit: ${limit.toLocaleString()} ({percentage}%)</span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={spent}
        aria-valuemin={0}
        aria-valuemax={limit}
        className="w-full bg-slate-200 h-3 rounded-full overflow-hidden shadow-inner"
      >
        <div
          className={`h-full transition-all duration-500 ease-out ${barColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

interface BudgetCardProps {
  budget: Budget;
}

/**
 * CMP-13 (Card)
 */
const BudgetCard: React.FC<BudgetCardProps> = ({ budget }) => {
  const rawRatio = budget.limit > 0 ? budget.spent / budget.limit : 0;
  let statusText = 'On Track';
  let badgeClass = 'bg-emerald-100 text-emerald-800';

  if (rawRatio >= 1.0) {
    statusText = 'Budget Exceeded (100%+)';
    badgeClass = 'bg-red-100 text-red-800';
  } else if (rawRatio >= 0.8) {
    statusText = 'Warning: 80%+ Reached';
    badgeClass = 'bg-amber-100 text-amber-800';
  }

  return (
    <div
      role="region"
      aria-label={`Budget card for ${budget.category}`}
      tabIndex={0}
      className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-indigo-500 flex flex-col justify-between"
    >
      <div>
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-lg font-semibold text-slate-900">{budget.category}</h3>
          <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${badgeClass}`}>
            {statusText}
          </span>
        </div>
        <p className="text-xs text-slate-500 uppercase tracking-wider mb-4">
          Cycle: {budget.billingCycle} ({budget.period})
        </p>
      </div>

      <div className="mt-auto">
        <ProgressBar spent={budget.spent} limit={budget.limit} />
      </div>
    </div>
  );
};

interface HistoricalTableProps {
  performanceData: HistoricalBudgetPerformance[];
}

/**
 * CMP-14 (DataTable)
 * Supports BUD-04: View historical budget performance across past billing cycles.
 */
const HistoricalDataTable: React.FC<HistoricalTableProps> = ({ performanceData }) => {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 shadow-sm">
      <table
        role="table"
        aria-label="Historical Budget Performance Table"
        className="w-full text-left border-collapse bg-white text-sm"
      >
        <caption className="sr-only">Historical budget performance across past billing cycles</caption>
        <thead className="bg-slate-50 text-slate-700 uppercase text-xs tracking-wider border-b border-slate-200">
          <tr>
            <th scope="col" className="px-6 py-3 font-semibold">Billing Cycle</th>
            <th scope="col" className="px-6 py-3 font-semibold">Category</th>
            <th scope="col" className="px-6 py-3 font-semibold">Limit</th>
            <th scope="col" className="px-6 py-3 font-semibold">Spent</th>
            <th scope="col" className="px-6 py-3 font-semibold">Performance Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {performanceData.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                No historical performance records found.
              </td>
            </tr>
          ) : (
            performanceData.map((row, index) => (
              <tr key={`${row.cycle}-${row.category}-${index}`} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-900">{row.cycle}</td>
                <td className="px-6 py-4 text-slate-700">{row.category}</td>
                <td className="px-6 py-4 text-slate-700">${row.limit.toLocaleString()}</td>
                <td className="px-6 py-4 text-slate-700">${row.spent.toLocaleString()}</td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      row.status === 'exceeded'
                        ? 'bg-red-100 text-red-800'
                        : row.status === 'warning'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {row.status.toUpperCase()}
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

// --- Main Budgets Component Screen (SCR-08) ---

export const Budgets: React.FC<BudgetsComponentProps> = ({ initialCycle = '2023-11' }) => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [historicalData, setHistoricalData] = useState<HistoricalBudgetPerformance[]>([]);
  const [uiState, setUiState] = useState<'loading' | 'empty' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modal / Form state for ACT-10 & ACT-11
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [newCategory, setNewCategory] = useState<string>('');
  const [newLimit, setNewLimit] = useState<string>('');
  const [newPeriod, setNewPeriod] = useState<'weekly' | 'monthly'>('monthly');

  const loadBudgetData = useCallback(async () => {
    try {
      setUiState('loading');
      setErrorMessage(null);
      const [fetchedBudgets, fetchedHistory] = await Promise.all([
        api.fetchBudgets(initialCycle),
        api.fetchHistoricalPerformance()
      ]);

      setBudgets(fetchedBudgets);
      setHistoricalData(fetchedHistory);

      if (fetchedBudgets.length === 0 && fetchedHistory.length === 0) {
        setUiState('empty');
      } else {
        setUiState('success');
      }
    } catch (err: unknown) {
      setUiState('error');
      const message = err instanceof Error ? err.message : 'Failed to load budget data.';
      setErrorMessage(message);
    }
  }, [initialCycle]);

  useEffect(() => {
    loadBudgetData();
  }, [loadBudgetData]);

  const handleCreateBudgetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory || !newLimit) return;

    try {
      const created = await api.createBudget({
        category: newCategory,
        limit: parseFloat(newLimit),
        period: newPeriod,
        billingCycle: initialCycle,
      });

      setBudgets((prev) => [...prev, created]);
      setUiState('success');
      setIsModalOpen(false);
      setNewCategory('');
      setNewLimit('');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save budget.';
      setErrorMessage(message);
    }
  };

  const totalBudgeted = useMemo(() => budgets.reduce((acc, b) => acc + b.limit, 0), [budgets]);
  const totalSpent = useMemo(() => budgets.reduce((acc, b) => acc + b.spent, 0), [budgets]);

  return (
    <main role="main" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 bg-slate-50 min-h-screen">
      {/* Screen Header & Action */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Budgets Dashboard</h1>
          <p className="text-sm text-slate-600 mt-1">
            Monitor active limits, real-time spending progress (BUD-02, BUD-03), and historical cycles (BUD-04).
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
          data-testid="create-budget-btn"
        >
          Create Budget
        </button>
      </div>

      {/* Summary Banner */}
      {uiState === 'success' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Allocated Limit</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">${totalBudgeted.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Spent Across Budgets</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">${totalSpent.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Overall Utilization</p>
            <div className="mt-2">
              <ProgressBar spent={totalSpent} limit={totalBudgeted} />
            </div>
          </div>
        </div>
      )}

      {/* UI State Handler: Loading */}
      {uiState === 'loading' && (
        <div className="flex justify-center items-center py-20" aria-live="polite">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
        </div>
      )}

      {/* UI State Handler: Error */}
      {uiState === 'error' && (
        <div
          role="region"
          aria-live="assertive"
          className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md shadow-sm"
        >
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error Loading Budgets</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{errorMessage || 'An unexpected error occurred while retrieving budget data.'}</p>
              </div>
              <button
                onClick={loadBudgetData}
                className="mt-3 text-sm font-medium text-red-600 hover:text-red-500 underline focus:outline-none"
              >
                Retry Loading
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UI State Handler: Empty */}
      {uiState === 'empty' && (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-medium text-slate-900">No active budgets found</h2>
          <p className="text-sm text-slate-500 mt-1">Get started by creating your first spending category limit.</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Create Budget
          </button>
        </div>
      )}

      {/* UI State Handler: Success */}
      {(uiState === 'success' || (uiState !== 'loading' && budgets.length > 0)) && (
        <div className="space-y-8">
          {/* Active Budgets Section */}
          <section aria-labelledby="active-budgets-heading" className="space-y-4">
            <h2 id="active-budgets-heading" className="text-2xl font-bold text-slate-900">
              Active Budgets
            </h2>
            {/* Responsive grid rules: Mobile single column, Tablet two-column, Desktop three-column */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {budgets.map((budget) => (
                <BudgetCard key={budget.id} budget={budget} />
              ))}
            </div>
          </section>

          {/* Historical Performance Section (BUD-04) */}
          <section aria-labelledby="historical-performance-heading" className="space-y-4 pt-4 border-t border-slate-200">
            <h2 id="historical-performance-heading" className="text-2xl font-bold text-slate-900">
              Historical Performance
            </h2>
            <HistoricalDataTable performanceData={historicalData} />
          </section>
        </div>
      )}

      {/* Create Budget Modal / Form Drawer */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900 bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-6">
            <div className="flex justify-between items-center border-b border-slate-200 pb-4">
              <h3 className="text-lg font-bold text-slate-900">Create New Budget</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 focus:outline-none"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateBudgetSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Category Name</label>
                <input
                  type="text"
                  required
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="e.g., Entertainment, Travel"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Spending Limit ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={newLimit}
                  onChange={(e) => setNewLimit(e.target.value)}
                  placeholder="500.00"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Period</label>
                <select
                  value={newPeriod}
                  onChange={(e) => setNewPeriod(e.target.value as 'weekly' | 'monthly')}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                >
                  <option value="monthly">Monthly</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  name="save_budget_button"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Save Budget
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};

export default Budgets;