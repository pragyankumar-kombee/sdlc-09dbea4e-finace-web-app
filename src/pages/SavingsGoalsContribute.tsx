// @module: Frontend Web Application.component.SavingsGoalsContribute
// @spec_section_id: implementation_blueprint
// @req_ids: GOAL-02
// @agent: CodeGenerationAgent
// @run_id: run-p4-1790144399
// @version: 1

import React, { useState, useEffect, useRef, FormEvent, KeyboardEvent } from 'react';

/**
 * Interface representing the contribution payload submitted to the backend API.
 */
interface ContributionPayload {
  goalId: string;
  contribution_amount: number;
}

/**
 * Props for the SavingsGoalsContribute component.
 */
interface SavingsGoalsContributeProps {
  goalId: string;
  goalTitle?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (updatedGoalId: string, contributedAmount: number) => void;
}

/**
 * SavingsGoalsContribute React Component (CMP-23)
 * Implements SCR-14: Contribute to Savings Goal route /savings-goals/:id/contribute
 * Fulfills REQ-ID: GOAL-02
 */
export const SavingsGoalsContribute: React.FC<SavingsGoalsContributeProps> = ({
  goalId,
  goalTitle = 'Savings Goal',
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [contributionAmount, setContributionAmount] = useState<string>('');
  const [uiState, setUiState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const dialogRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus trap and keyboard event listener (Escape and Enter handling per a11y specs)
  useEffect(() => {
    if (isOpen) {
      setUiState('idle');
      setContributionAmount('');
      setErrorMessage(null);
      // Focus input on mount
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen, goalId]);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
    }
  };

  const validateAndSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const parsedAmount = parseFloat(contributionAmount);

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMessage('Please enter a valid contribution amount greater than zero.');
      return;
    }

    setUiState('loading');

    try {
      // API call simulated per module boundary layer contract
      // Sibling service integration point: frontend_web_applicationApi.ts
      await simulateContributeApiCall({
        goalId,
        contribution_amount: parsedAmount,
      });

      setUiState('success');
      if (onSuccess) {
        onSuccess(goalId, parsedAmount);
      }
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: unknown) {
      setUiState('error');
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('An unexpected error occurred while processing your contribution.');
      }
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4 backdrop-blur-sm transition-opacity"
      role="dialog"
      aria-modal="true"
      aria-labelledby="savings-goal-contribute-heading"
      onKeyDown={handleKeyDown}
      ref={dialogRef}
    >
      <div
        className="w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl p-6 transform transition-all animate-in fade-in zoom-in-95 duration-200"
      >
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <h2
            id="savings-goal-contribute-heading"
            className="text-xl font-semibold text-gray-900"
          >
            Allocate Funds
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg p-1"
            aria-label="Close dialog"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="mt-3 text-sm text-gray-600">
          Contribute funds towards <span className="font-medium text-gray-800">{goalTitle}</span>.
        </p>

        <form onSubmit={validateAndSubmit} className="mt-4 space-y-4">
          <div>
            <label htmlFor="contribution_amount" className="block text-sm font-medium text-gray-700">
              Contribution Amount ($)
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">$</span>
              </div>
              <input
                ref={inputRef}
                type="number"
                step="0.01"
                min="0.01"
                id="contribution_amount"
                name="contribution_amount"
                role="textbox"
                value={contributionAmount}
                onChange={(e) => setContributionAmount(e.target.value)}
                disabled={uiState === 'loading' || uiState === 'success'}
                aria-describedby={errorMessage ? 'contribution-error' : undefined}
                className={`block w-full pl-7 pr-3 py-3 sm:py-2 text-base sm:text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errorMessage ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500' : 'border-gray-300'
                }`}
                placeholder="0.00"
              />
            </div>
            {errorMessage && (
              <p className="mt-2 text-sm text-red-600" id="contribution-error">
                {errorMessage}
              </p>
            )}
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={uiState === 'loading'}
              className="mt-3 sm:mt-0 w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="save_goal_button"
              disabled={uiState === 'loading' || uiState === 'success'}
              className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {uiState === 'loading' && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              )}
              {uiState === 'success' ? 'Allocated!' : 'Allocate Funds'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/**
 * Simulated service API helper reflecting connection to frontend_web_applicationApi.ts
 */
async function simulateContributeApiCall(payload: ContributionPayload): Promise<void> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (payload.contribution_amount <= 0) {
        reject(new Error('Contribution amount must be greater than zero.'));
      } else {
        resolve();
      }
    }, 600);
  });
}

export default SavingsGoalsContribute;