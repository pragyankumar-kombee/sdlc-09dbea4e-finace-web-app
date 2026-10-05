// @module: Frontend Web Application.component.BudgetsNew
// @spec_section_id: implementation_blueprint
// @req_ids: BUD-01
// @agent: CodeGenerationAgent
// @run_id: run-p4-1790144399
// @version: 1

import React, { useState, FormEvent, ChangeEvent } from 'react';

/**
 * Interface representing category options for the budget configuration.
 */
interface CategoryOption {
  id: string;
  name: string;
}

/**
 * Interface representing the form data payload for creating a new budget.
 */
export interface BudgetFormData {
  budget_name: string;
  category_id: string;
  limit_amount: string;
  time_period: 'monthly' | 'weekly';
  alert_threshold_pct: string;
}

/**
 * Props for the BudgetsNew component.
 */
interface BudgetsNewProps {
  categories?: CategoryOption[];
  onSubmitBudget?: (data: BudgetFormData) => Promise<void>;
  initialState?: 'loading' | 'empty' | 'success' | 'error';
  errorMessage?: string;
}

/**
 * BudgetsNew Component (SCR-09: Budget Creation and Modification)
 * Implements requirement BUD-01: Create category-specific or overall monthly/weekly budgets with defined spending limits.
 */
export const BudgetsNew: React.FC<BudgetsNewProps> = ({
  categories = [
    { id: 'cat-all', name: 'Overall / All Categories' },
    { id: 'cat-food', name: 'Food & Dining' },
    { id: 'cat-rent', name: 'Housing & Rent' },
    { id: 'cat-utils', name: 'Utilities' },
    { id: 'cat-ent', name: 'Entertainment' },
  ],
  onSubmitBudget,
  initialState = 'success',
  errorMessage = '',
}) => {
  const [uiState, setUiState] = useState<'loading' | 'empty' | 'success' | 'error'>(initialState);
  const [errorText, setErrorText] = useState<string>(errorMessage);
  const [successMessage, setSuccessMessage] = useState<string>('');

  const [formData, setFormData] = useState<BudgetFormData>({
    budget_name: '',
    category_id: categories[0]?.id || '',
    limit_amount: '',
    time_period: 'monthly',
    alert_threshold_pct: '80',
  });

  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof BudgetFormData, string>>>({});

  const handleInputChange = (field: keyof BudgetFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof BudgetFormData, string>> = {};
    if (!formData.budget_name.trim()) {
      errors.budget_name = 'Budget name is required.';
    }
    if (!formData.limit_amount || Number(formData.limit_amount) <= 0) {
      errors.limit_amount = 'Limit amount must be greater than zero.';
    }
    const alertPct = Number(formData.alert_threshold_pct);
    if (isNaN(alertPct) || alertPct < 1 || alertPct > 100) {
      errors.alert_threshold_pct = 'Alert threshold must be between 1 and 100.';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    setUiState('loading');
    setErrorText('');

    try {
      if (onSubmitBudget) {
        await onSubmitBudget(formData);
      } else {
        // Simulated API network call if no handler provided
        await new Promise((resolve) => setTimeout(resolve, 600));
      }
      setUiState('success');
      setSuccessMessage('Budget successfully created and saved.');
    } catch (err: unknown) {
      setUiState('error');
      setErrorText(err instanceof Error ? err.message : 'An unexpected error occurred while saving the budget.');
    }
  };

  if (uiState === 'loading') {
    return (
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div aria-live="polite" className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading budget configuration workspace...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-6 sm:p-8">
        
        {/* Screen Header */}
        <header className="mb-6 border-b border-gray-200 dark:border-gray-700 pb-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create Budget</h1>
          <h2 className="text-sm text-gray-600 dark:text-gray-400 mt-1">Budget Configuration Form</h2>
        </header>

        {/* Inline Alerts for Global Errors or Success */}
        {uiState === 'error' && errorText && (
          <div role="alert" className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300">
            {errorText}
          </div>
        )}

        {uiState === 'success' && successMessage && (
          <div role="alert" className="mb-6 p-4 rounded-lg bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300">
            {successMessage}
          </div>
        )}

        {uiState === 'empty' && (
          <div role="alert" className="mb-6 p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-300">
            No categories available. Please configure your financial categories first.
          </div>
        )}

        {/* Budget Configuration Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Budget Name Field (CMP-01 TextInput) */}
            <div className="md:col-span-2">
              <label htmlFor="budget_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Budget Name
              </label>
              <input
                id="budget_name"
                type="text"
                role="textbox"
                value={formData.budget_name}
                onChange={(e: ChangeEvent<HTMLInputElement>) => handleInputChange('budget_name', e.target.value)}
                placeholder="e.g., Monthly Groceries & Dining"
                aria-invalid={Boolean(fieldErrors.budget_name)}
                aria-describedby={fieldErrors.budget_name ? 'budget_name-error' : undefined}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              />
              {fieldErrors.budget_name && (
                <div id="budget_name-error" aria-live="polite" className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {fieldErrors.budget_name}
                </div>
              )}
            </div>

            {/* Category Select (CMP-15 Select) */}
            <div>
              <label htmlFor="category_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Category
              </label>
              <select
                id="category_id"
                role="combobox"
                value={formData.category_id}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => handleInputChange('category_id', e.target.value)}
                aria-describedby={fieldErrors.category_id ? 'category_id-error' : undefined}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Time Period Select (CMP-15 Select) */}
            <div>
              <label htmlFor="time_period" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Time Period
              </label>
              <select
                id="time_period"
                role="combobox"
                value={formData.time_period}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => handleInputChange('time_period', e.target.value as 'monthly' | 'weekly')}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="monthly">Monthly</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>

            {/* Limit Amount NumberInput (CMP-16 NumberInput) */}
            <div>
              <label htmlFor="limit_amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Spending Limit Amount ($)
              </label>
              <input
                id="limit_amount"
                type="number"
                role="spinbutton"
                min="0"
                step="0.01"
                value={formData.limit_amount}
                onChange={(e: ChangeEvent<HTMLInputElement>) => handleInputChange('limit_amount', e.target.value)}
                placeholder="500.00"
                aria-invalid={Boolean(fieldErrors.limit_amount)}
                aria-describedby={fieldErrors.limit_amount ? 'limit_amount-error' : undefined}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              />
              {fieldErrors.limit_amount && (
                <div id="limit_amount-error" aria-live="polite" className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {fieldErrors.limit_amount}
                </div>
              )}
            </div>

            {/* Alert Threshold Percentage (CMP-16 NumberInput) */}
            <div>
              <label htmlFor="alert_threshold_pct" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Alert Threshold (%)
              </label>
              <input
                id="alert_threshold_pct"
                type="number"
                role="spinbutton"
                min="1"
                max="100"
                value={formData.alert_threshold_pct}
                onChange={(e: ChangeEvent<HTMLInputElement>) => handleInputChange('alert_threshold_pct', e.target.value)}
                placeholder="80"
                aria-invalid={Boolean(fieldErrors.alert_threshold_pct)}
                aria-describedby={fieldErrors.alert_threshold_pct ? 'alert_threshold_pct-error' : undefined}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              />
              {fieldErrors.alert_threshold_pct && (
                <div id="alert_threshold_pct-error" aria-live="polite" className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {fieldErrors.alert_threshold_pct}
                </div>
              )}
            </div>

          </div>

          {/* Action Bar (Responsive: Sticky bottom on mobile, inline on desktop) */}
          <div className="pt-6 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end">
            <button
              id="ACT-12"
              type="submit"
              role="button"
              className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow transition focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Save Budget
            </button>
          </div>

        </form>
      </div>
    </main>
  );
};

export default BudgetsNew;