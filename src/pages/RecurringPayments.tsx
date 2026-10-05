// @module: Frontend Web Application.component.RecurringPayments
// @spec_section_id: implementation_blueprint
// @req_ids: REC-01, REC-02, REC-03, REC-04
// @agent: CodeGenerationAgent
// @run_id: run-p4-1790144399
// @version: 1

import React, { useState, useEffect, useCallback, useMemo, KeyboardEvent } from 'react';

export interface RecurringPaymentItem {
  id: string;
  name: string;
  amount: number;
  frequency: 'weekly' | 'monthly' | 'yearly';
  nextDueDate: string;
  type: 'detected' | 'manual';
  status: 'active' | 'paused' | 'cancelled';
}

export interface RecurringPaymentsProps {
  initialRecurringPayments?: RecurringPaymentItem[];
  fetchRecurringPayments?: () => Promise<RecurringPaymentItem[]>;
  saveRecurringPayment?: (payment: Omit<RecurringPaymentItem, 'id'>) => Promise<RecurringPaymentItem>;
  deleteRecurringPayment?: (id: string) => Promise<void>;
}

export const RecurringPayments: React.FC<RecurringPaymentsProps> = ({
  initialRecurringPayments,
  fetchRecurringPayments,
  saveRecurringPayment,
  deleteRecurringPayment,
}) => {
  const [payments, setPayments] = useState<RecurringPaymentItem[]>(initialRecurringPayments || []);
  const [loading, setLoading] = useState<boolean>(!initialRecurringPayments);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Form states for adding manual recurring payments (ACT-22 / ACT-23 / REC-01..04)
  const [newName, setNewName] = useState<string>('');
  const [newAmount, setNewAmount] = useState<string>('');
  const [newFrequency, setNewFrequency] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
  const [newNextDueDate, setNewNextDueDate] = useState<string>('');

  const loadData = useCallback(async () => {
    if (!fetchRecurringPayments) return;
    try {
      setLoading(true);
      setError(null);
      const data = await fetchRecurringPayments();
      setPayments(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load recurring payments data.');
    } finally {
      setLoading(false);
    }
  }, [fetchRecurringPayments]);

  useEffect(() => {
    if (!initialRecurringPayments && fetchRecurringPayments) {
      loadData();
    }
  }, [initialRecurringPayments, fetchRecurringPayments, loadData]);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setNewName('');
    setNewAmount('');
    setNewFrequency('monthly');
    setNewNextDueDate('');
  };

  const handleSaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newAmount || !newNextDueDate) {
      setError('Please fill in all required fields for the recurring payment.');
      return;
    }

    const numericAmount = parseFloat(newAmount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError('Please provide a valid positive amount.');
      return;
    }

    try {
      setError(null);
      if (saveRecurringPayment) {
        const saved = await saveRecurringPayment({
          name: newName.trim(),
          amount: numericAmount,
          frequency: newFrequency,
          nextDueDate: newNextDueDate,
          type: 'manual',
          status: 'active',
        });
        setPayments((prev) => [...prev, saved]);
      } else {
        // Fallback local state insertion if no API service prop is provided
        const localItem: RecurringPaymentItem = {
          id: `rec-${Date.now()}`,
          name: newName.trim(),
          amount: numericAmount,
          frequency: newFrequency,
          nextDueDate: newNextDueDate,
          type: 'manual',
          status: 'active',
        };
        setPayments((prev) => [...prev, localItem]);
      }
      handleCloseModal();
    } catch (err: any) {
      setError(err?.message || 'Failed to save recurring payment.');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setError(null);
      if (deleteRecurringPayment) {
        await deleteRecurringPayment(id);
      }
      setPayments((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      setError(err?.message || 'Failed to delete recurring payment.');
    }
  };

  const detectedSeries = useMemo(() => payments.filter((p) => p.type === 'detected'), [payments]);
  const manualSchedules = useMemo(() => payments.filter((p) => p.type === 'manual'), [payments]);

  const handleKeyDownButton = (e: KeyboardEvent<HTMLButtonElement>, action: () => void) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      action();
    }
  };

  return (
    <main
      role="main"
      className="p-6 max-w-7xl mx-auto font-sans text-gray-900 bg-gray-50 min-h-screen"
      aria-label="Recurring Payments Management Dashboard"
    >
      {/* Header and Add Action */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Recurring Payments</h1>
          <p className="text-sm text-gray-600 mt-1">
            View detected or manually added recurring bills, subscriptions, and income streams.
          </p>
        </div>
        <div>
          <button
            role="button"
            tabIndex={0}
            onClick={handleOpenModal}
            onKeyDown={(e) => handleKeyDownButton(e, handleOpenModal)}
            className="inline-flex items-center justify-center px-4 py-2.5 bg-blue-600 text-white font-medium rounded-lg shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 min-h-[44px] min-w-[44px] transition-colors"
            aria-label="Add Recurring Payment"
          >
            Add Recurring Payment
          </button>
        </div>
      </div>

      {/* Error & Live Announcement Region (CMP-25 a11y requirement) */}
      <div aria-live="polite" aria-atomic="true">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg shadow-sm flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-red-700 font-bold hover:text-red-900 focus:outline-none min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Dismiss error"
            >
              &times;
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area: CMP-24 (RecurringPaymentsView) & CMP-25 (RecurringPaymentsTable) */}
      <section role="region" aria-label="Recurring Payments Overview" className="space-y-8">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" aria-label="Loading recurring payments" />
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-200">
            <p className="text-lg font-medium text-gray-600">No recurring payments found.</p>
            <p className="text-sm text-gray-500 mt-1">Get started by adding a manual recurring schedule or connecting bank feeds.</p>
          </div>
        ) : (
          <>
            {/* Detected Series Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">Detected Recurring Series</h2>
              {detectedSeries.length === 0 ? (
                <p className="text-sm text-gray-500 py-4">No automated recurring series detected yet.</p>
              ) : (
                <RecurringPaymentsTable items={detectedSeries} onDelete={handleDelete} />
              )}
            </div>

            {/* Manual Recurring Schedules Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">Manual Recurring Schedules</h2>
              {manualSchedules.length === 0 ? (
                <p className="text-sm text-gray-500 py-4">No manual recurring schedules configured.</p>
              ) : (
                <RecurringPaymentsTable items={manualSchedules} onDelete={handleDelete} />
              )}
            </div>
          </>
        )}
      </section>

      {/* Modal / Dialog for Adding Recurring Payment */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative animate-fadeIn">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Add Recurring Payment</h3>
            <form onSubmit={handleSaveSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g., Netflix Subscription, Rent"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  placeholder="0.00"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                <select
                  value={newFrequency}
                  onChange={(e) => setNewFrequency(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] bg-white"
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Next Due Date</label>
                <input
                  type="date"
                  value={newNextDueDate}
                  onChange={(e) => setNewNextDueDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  role="button"
                  tabIndex={0}
                  onClick={handleCloseModal}
                  onKeyDown={(e) => handleKeyDownButton(e, handleCloseModal)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500 min-h-[44px] min-w-[44px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  role="button"
                  tabIndex={0}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] min-w-[44px]"
                >
                  save_recurring_btn
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};

interface RecurringPaymentsTableProps {
  items: RecurringPaymentItem[];
  onDelete: (id: string) => void;
}

const RecurringPaymentsTable: React.FC<RecurringPaymentsTableProps> = ({ items, onDelete }) => {
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  const handleTableKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (items.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1));
    }
  };

  return (
    <div
      role="grid"
      tabIndex={0}
      onKeyDown={handleTableKeyDown}
      aria-label="Recurring Payments Table"
      className="overflow-x-auto focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg"
    >
      {/* Desktop View Table / Mobile Stacked Cards Responsive Layout */}
      <div className="hidden md:block min-w-full">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Frequency</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Next Due Date</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {items.map((item, idx) => {
              const isSelected = selectedIndex === idx;
              return (
                <tr
                  key={item.id}
                  onClick={() => setSelectedIndex(idx)}
                  className={`transition-colors ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${item.amount.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 capitalize">{item.frequency}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.nextDueDate}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(item.id);
                      }}
                      className="text-red-600 hover:text-red-900 min-h-[44px] min-w-[44px] inline-flex items-center justify-center"
                      aria-label={`Delete ${item.name}`}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List View (Responsive Rule compliance) */}
      <div className="md:hidden space-y-4">
        {items.map((item) => (
          <div key={item.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200 shadow-sm space-y-2">
            <div className="flex justify-between items-start">
              <h3 className="font-semibold text-gray-900">{item.name}</h3>
              <span className="text-lg font-bold text-gray-900">${item.amount.toFixed(2)}</span>
            </div>
            <div className="text-sm text-gray-600 flex justify-between">
              <span>Frequency: <strong className="capitalize">{item.frequency}</strong></span>
              <span>Due: {item.nextDueDate}</span>
            </div>
            <div className="pt-2 flex justify-end">
              <button
                role="button"
                tabIndex={0}
                onClick={() => onDelete(item.id)}
                className="w-full sm:w-auto px-4 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label={`Delete ${item.name}`}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecurringPayments;