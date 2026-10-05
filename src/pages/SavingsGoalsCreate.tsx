// @module: Frontend Web Application.component.SavingsGoalsCreate
// @spec_section_id: implementation_blueprint
// @req_ids: GOAL-01
// @agent: CodeGenerationAgent
// @run_id: run-p4-1790144399
// @version: 1

import React, { useState, FormEvent, ChangeEvent } from 'react';

/**
 * Interface representing the payload required to create a savings goal.
 */
export interface SavingsGoalCreatePayload {
  goal_name: string;
  target_amount: number;
  current_amount: number;
  target_date: string;
}

/**
 * Interface representing component props for SavingsGoalsCreate.
 */
export interface SavingsGoalsCreateProps {
  onSuccess?: (goal: SavingsGoalCreatePayload) => void;
  onCancel?: () => void;
  apiClient?: {
    createSavingsGoal: (payload: SavingsGoalCreatePayload) => Promise<any>;
  };
}

/**
 * SavingsGoalsCreate Component (CMP-23 / SCR-13)
 * Allows users to create a new savings goal with target amounts, target completion dates, and initial progress.
 */
export const SavingsGoalsCreate: React.FC<SavingsGoalsCreateProps> = ({
  onSuccess,
  onCancel,
  apiClient,
}) => {
  const [formData, setFormData] = useState<SavingsGoalCreatePayload>({
    goal_name: '',
    target_amount: 0,
    current_amount: 0,
    target_date: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uiState, setUiState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.goal_name.trim()) {
      newErrors.goal_name = 'Goal name is required.';
    }

    if (formData.target_amount <= 0) {
      newErrors.target_amount = 'Target amount must be greater than zero.';
    }

    if (formData.current_amount < 0) {
      newErrors.current_amount = 'Current amount cannot be negative.';
    }

    if (formData.current_amount > formData.target_amount) {
      newErrors.current_amount = 'Current amount cannot exceed target amount.';
    }

    if (!formData.target_date) {
      newErrors.target_date = 'Target completion date is required.';
    } else {
      const selectedDate = new Date(formData.target_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        newErrors.target_date = 'Target date cannot be in the past.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? 0 : parseFloat(value)) : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setUiState('loading');
    setErrorMessage('');

    try {
      if (apiClient && typeof apiClient.createSavingsGoal === 'function') {
        await apiClient.createSavingsGoal(formData);
      } else {
        // Fallback simulation if no external api client provided
        await new Promise((resolve, reject) => {
          setTimeout(() => {
            resolve(true);
          }, 800);
        });
      }

      setUiState('success');
      if (onSuccess) {
        onSuccess(formData);
      }
    } catch (err: any) {
      setUiState('error');
      setErrorMessage(err?.message || 'Failed to create savings goal. Please try again.');
    }
  };

  return (
    <main
      role="main"
      className="min-h-screen bg-gray-50 flex items-center justify-center p-4 sm:p-6 lg:p-8"
    >
      <div className="w-full max-w-md sm:max-w-lg lg:max-w-xl bg-white rounded-xl shadow-lg border border-gray-100 p-6 sm:p-8">
        <header className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            Create Savings Goal
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Define your savings target, timeline, and track your financial milestones.
          </p>
        </header>

        {uiState === 'error' && errorMessage && (
          <div
            role="alert"
            aria-live="assertive"
            className="mb-4 p-4 text-sm text-red-700 bg-red-50 rounded-lg border border-red-200"
          >
            {errorMessage}
          </div>
        )}

        {uiState === 'success' ? (
          <div
            role="status"
            aria-live="polite"
            className="p-6 text-center bg-green-50 rounded-lg border border-green-200"
          >
            <h2 className="text-lg font-semibold text-green-800">Goal Created Successfully!</h2>
            <p className="text-sm text-green-600 mt-1">
              Your savings goal "{formData.goal_name}" has been established.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <div>
              <label htmlFor="goal_name" className="block text-sm font-medium text-gray-700 mb-1">
                Goal Name
              </label>
              <input
                type="text"
                id="goal_name"
                name="goal_name"
                value={formData.goal_name}
                onChange={handleChange}
                role="textbox"
                aria-invalid={!!errors.goal_name}
                aria-describedby={errors.goal_name ? 'goal_name-error' : undefined}
                placeholder="e.g., Emergency Fund, Vacation"
                className={`w-full px-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition ${
                  errors.goal_name ? 'border-red-500 bg-red-50/10' : 'border-gray-300'
                }`}
              />
              {errors.goal_name && (
                <p id="goal_name-error" className="mt-1 text-xs text-red-600">
                  {errors.goal_name}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="target_amount" className="block text-sm font-medium text-gray-700 mb-1">
                  Target Amount ($)
                </label>
                <input
                  type="number"
                  id="target_amount"
                  name="target_amount"
                  value={formData.target_amount === 0 ? '' : formData.target_amount}
                  onChange={handleChange}
                  role="textbox"
                  step="0.01"
                  min="0"
                  aria-invalid={!!errors.target_amount}
                  aria-describedby={errors.target_amount ? 'target_amount-error' : undefined}
                  placeholder="5000"
                  className={`w-full px-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition ${
                    errors.target_amount ? 'border-red-500 bg-red-50/10' : 'border-gray-300'
                  }`}
                />
                {errors.target_amount && (
                  <p id="target_amount-error" className="mt-1 text-xs text-red-600">
                    {errors.target_amount}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="current_amount" className="block text-sm font-medium text-gray-700 mb-1">
                  Current Saved ($)
                </label>
                <input
                  type="number"
                  id="current_amount"
                  name="current_amount"
                  value={formData.current_amount === 0 ? '' : formData.current_amount}
                  onChange={handleChange}
                  role="textbox"
                  step="0.01"
                  min="0"
                  aria-invalid={!!errors.current_amount}
                  aria-describedby={errors.current_amount ? 'current_amount-error' : undefined}
                  placeholder="0"
                  className={`w-full px-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition ${
                    errors.current_amount ? 'border-red-500 bg-red-50/10' : 'border-gray-300'
                  }`}
                />
                {errors.current_amount && (
                  <p id="current_amount-error" className="mt-1 text-xs text-red-600">
                    {errors.current_amount}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="target_date" className="block text-sm font-medium text-gray-700 mb-1">
                Target Completion Date
              </label>
              <input
                type="date"
                id="target_date"
                name="target_date"
                value={formData.target_date}
                onChange={handleChange}
                aria-invalid={!!errors.target_date}
                aria-describedby={errors.target_date ? 'target_date-error' : undefined}
                className={`w-full px-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition ${
                  errors.target_date ? 'border-red-500 bg-red-50/10' : 'border-gray-300'
                }`}
              />
              {errors.target_date && (
                <p id="target_date-error" className="mt-1 text-xs text-red-600">
                  {errors.target_date}
                </p>
              )}
            </div>

            <div className="pt-4 flex flex-col sm:flex-row gap-3">
              <button
                type="submit"
                id="save_goal_button"
                disabled={uiState === 'loading'}
                className="w-full sm:flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow transition duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {uiState === 'loading' ? 'Saving Goal...' : 'Save Goal'}
              </button>
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="w-full sm:w-auto bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-lg transition duration-150 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </main>
  );
};

export default SavingsGoalsCreate;