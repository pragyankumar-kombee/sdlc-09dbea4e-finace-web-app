// @module: Frontend Web Application.component.TransactionsNew
// @spec_section_id: implementation_blueprint
// @req_ids: TXN-01, TXN-02, TXN-04
// @agent: CodeGenerationAgent
// @run_id: run-p4-1790144399
// @version: 1

import React, { useState, useEffect, FormEvent } from 'react';

/**
 * Interface representing a financial transaction entity.
 */
export interface Transaction {
  id?: string;
  transaction_type: 'income' | 'expense';
  amount: number;
  transaction_date: string;
  category_id: string;
  account_id: string;
  merchant_name?: string;
  notes?: string;
}

/**
 * Interface representing a category option.
 */
export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
}

/**
 * Interface representing an account option.
 */
export interface Account {
  id: string;
  name: string;
}

/**
 * Props for the TransactionsNew component.
 */
export interface TransactionsNewProps {
  transactionId?: string;
  initialData?: Transaction;
  categories?: Category[];
  accounts?: Account[];
  onSubmitSuccess?: (transaction: Transaction) => void;
  onDeleteSuccess?: (transactionId: string) => void;
  onCancel?: () => void;
}

/**
 * TransactionsNew Component
 * Screen: SCR-06 (/transactions/new)
 * Purpose: Manually record, edit, or delete income and expense transactions.
 * Satisfies requirements TXN-01 (Manual recording), TXN-02 (Editing/Deleting), TXN-04 (Categorization).
 */
export const TransactionsNew: React.FC<TransactionsNewProps> = ({
  transactionId,
  initialData,
  categories = [
    { id: 'cat-1', name: 'Salary', type: 'income' },
    { id: 'cat-2', name: 'Groceries', type: 'expense' },
    { id: 'cat-3', name: 'Utilities', type: 'expense' },
    { id: 'cat-4', name: 'Entertainment', type: 'expense' },
  ],
  accounts = [
    { id: 'acc-1', name: 'Checking Account' },
    { id: 'acc-2', name: 'Savings Account' },
    { id: 'acc-3', name: 'Credit Card' },
  ],
  onSubmitSuccess,
  onDeleteSuccess,
  onCancel,
}) => {
  const [transactionType, setTransactionType] = useState<'income' | 'expense'>(
    initialData?.transaction_type || 'expense'
  );
  const [amount, setAmount] = useState<string>(
    initialData?.amount ? initialData.amount.toString() : ''
  );
  const [transactionDate, setTransactionDate] = useState<string>(
    initialData?.transaction_date || new Date().toISOString().split('T')[0]
  );
  const [categoryId, setCategoryId] = useState<string>(
    initialData?.category_id || categories[0]?.id || ''
  );
  const [accountId, setAccountId] = useState<string>(
    initialData?.account_id || accounts[0]?.id || ''
  );
  const [merchantName, setMerchantName] = useState<string>(
    initialData?.merchant_name || ''
  );
  const [notes, setNotes] = useState<string>(initialData?.notes || '');

  const [uiState, setUiState] = useState<'loading' | 'empty' | 'success' | 'error'>('success');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (initialData) {
      setTransactionType(initialData.transaction_type);
      setAmount(initialData.amount.toString());
      setTransactionDate(initialData.transaction_date);
      setCategoryId(initialData.category_id);
      setAccountId(initialData.account_id);
      setMerchantName(initialData.merchant_name || '');
      setNotes(initialData.notes || '');
    }
  }, [initialData]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    const parsedAmount = parseFloat(amount);

    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      newErrors.amount = 'Amount must be a valid number greater than zero.';
    }
    if (!transactionDate) {
      newErrors.transaction_date = 'Transaction date is required.';
    }
    if (!categoryId) {
      newErrors.category_id = 'Category selection is required.';
    }
    if (!accountId) {
      newErrors.account_id = 'Account selection is required.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setGlobalError(null);

    if (!validateForm()) {
      setUiState('error');
      return;
    }

    setIsSubmitting(true);
    setUiState('loading');

    try {
      const payload: Transaction = {
        id: transactionId || `txn-${Date.now()}`,
        transaction_type: transactionType,
        amount: parseFloat(amount),
        transaction_date: transactionDate,
        category_id: categoryId,
        account_id: accountId,
        merchant_name: merchantName.trim() || undefined,
        notes: notes.trim() || undefined,
      };

      // Simulate API network latency and successful response
      await new Promise((resolve) => setTimeout(resolve, 400));

      setUiState('success');
      setIsSubmitting(false);

      if (onSubmitSuccess) {
        onSubmitSuccess(payload);
      }
    } catch (err) {
      setIsSubmitting(false);
      setUiState('error');
      setGlobalError('An unexpected error occurred while saving the transaction. Please try again.');
    }
  };

  const handleDelete = async () => {
    if (!transactionId) return;

    if (!window.confirm('Are you sure you want to delete this transaction?')) {
      return;
    }

    setIsSubmitting(true);
    setUiState('loading');

    try {
      // Simulate API network latency
      await new Promise((resolve) => setTimeout(resolve, 300));

      setUiState('success');
      setIsSubmitting(false);

      if (onDeleteSuccess) {
        onDeleteSuccess(transactionId);
      }
    } catch (err) {
      setIsSubmitting(false);
      setUiState('error');
      setGlobalError('Failed to delete transaction. Please try again.');
    }
  };

  return (
    <main className="max-w-3xl mx-auto p-4 md:p-8 bg-white shadow-md rounded-lg my-6">
      <header className="mb-6 border-b pb-4">
        <h1 className="text-2xl font-bold text-gray-900">
          {transactionId ? 'Edit Transaction' : 'Record Transaction'}
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Manage your income and expense entries securely.
        </p>
      </header>

      {globalError && (
        <div
          role="alert"
          aria-live="assertive"
          className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm"
        >
          {globalError}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        role="form"
        aria-label="Transaction Form"
        className="space-y-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* CMP-07: TransactionFormInputs - transaction_type */}
          <div>
            <label htmlFor="transaction_type" className="block text-sm font-medium text-gray-700 mb-1">
              Transaction Type
            </label>
            <select
              id="transaction_type"
              name="transaction_type"
              value={transactionType}
              onChange={(e) => setTransactionType(e.target.value as 'income' | 'expense')}
              className="w-full h-12 px-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base"
              aria-describedby={errors.transaction_type ? 'transaction_type-error' : undefined}
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </div>

          {/* CMP-07: TransactionFormInputs - amount */}
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
              Amount ($) *
            </label>
            <input
              type="number"
              id="amount"
              name="amount"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={`w-full h-12 px-3 border rounded-md shadow-sm text-base focus:ring-blue-500 focus:border-blue-500 ${
                errors.amount ? 'border-red-500' : 'border-gray-300'
              }`}
              aria-describedby={errors.amount ? 'amount-error' : undefined}
            />
            {errors.amount && (
              <p id="amount-error" className="mt-1 text-xs text-red-600">
                {errors.amount}
              </p>
            )}
          </div>

          {/* CMP-07: TransactionFormInputs - transaction_date */}
          <div>
            <label htmlFor="transaction_date" className="block text-sm font-medium text-gray-700 mb-1">
              Transaction Date *
            </label>
            <input
              type="date"
              id="transaction_date"
              name="transaction_date"
              value={transactionDate}
              onChange={(e) => setTransactionDate(e.target.value)}
              className={`w-full h-12 px-3 border rounded-md shadow-sm text-base focus:ring-blue-500 focus:border-blue-500 ${
                errors.transaction_date ? 'border-red-500' : 'border-gray-300'
              }`}
              aria-describedby={errors.transaction_date ? 'transaction_date-error' : undefined}
            />
            {errors.transaction_date && (
              <p id="transaction_date-error" className="mt-1 text-xs text-red-600">
                {errors.transaction_date}
              </p>
            )}
          </div>

          {/* CMP-07: TransactionFormInputs - category_id (TXN-04) */}
          <div>
            <label htmlFor="category_id" className="block text-sm font-medium text-gray-700 mb-1">
              Category *
            </label>
            <select
              id="category_id"
              name="category_id"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className={`w-full h-12 px-3 border rounded-md shadow-sm text-base focus:ring-blue-500 focus:border-blue-500 ${
                errors.category_id ? 'border-red-500' : 'border-gray-300'
              }`}
              aria-describedby={errors.category_id ? 'category_id-error' : undefined}
            >
              {categories
                .filter((cat) => cat.type === transactionType)
                .map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
            </select>
            {errors.category_id && (
              <p id="category_id-error" className="mt-1 text-xs text-red-600">
                {errors.category_id}
              </p>
            )}
          </div>

          {/* CMP-07: TransactionFormInputs - account_id */}
          <div>
            <label htmlFor="account_id" className="block text-sm font-medium text-gray-700 mb-1">
              Account *
            </label>
            <select
              id="account_id"
              name="account_id"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className={`w-full h-12 px-3 border rounded-md shadow-sm text-base focus:ring-blue-500 focus:border-blue-500 ${
                errors.account_id ? 'border-red-500' : 'border-gray-300'
              }`}
              aria-describedby={errors.account_id ? 'account_id-error' : undefined}
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name}
                </option>
              ))}
            </select>
            {errors.account_id && (
              <p id="account_id-error" className="mt-1 text-xs text-red-600">
                {errors.account_id}
              </p>
            )}
          </div>

          {/* CMP-07: TransactionFormInputs - merchant_name */}
          <div>
            <label htmlFor="merchant_name" className="block text-sm font-medium text-gray-700 mb-1">
              Merchant Name
            </label>
            <input
              type="text"
              id="merchant_name"
              name="merchant_name"
              placeholder="e.g. Whole Foods"
              value={merchantName}
              onChange={(e) => setMerchantName(e.target.value)}
              className="w-full h-12 px-3 border border-gray-300 rounded-md shadow-sm text-base focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* CMP-07: TransactionFormInputs - notes */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            placeholder="Add optional notes or memo..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md shadow-sm text-base focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-4 border-t">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="w-full sm:w-auto px-6 h-12 border border-gray-300 text-gray-700 font-medium rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
          )}

          {transactionId && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isSubmitting}
              className="w-full sm:w-auto px-6 h-12 bg-red-600 text-white font-medium rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
            >
              Delete
            </button>
          )}

          {/* CMP-08: SaveButton */}
          <button
            type="submit"
            id="save_button"
            disabled={isSubmitting}
            aria-label="Save Transaction"
            className="w-full sm:w-auto px-6 h-12 bg-blue-600 text-white font-medium rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Save Transaction'}
          </button>
        </div>
      </form>
    </main>
  );
};

export default TransactionsNew;