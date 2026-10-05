// @module: Frontend Web Application.component.RecurringPaymentsNew
// @spec_section_id: implementation_blueprint
// @req_ids: REC-01
// @agent: CodeGenerationAgent
// @run_id: run-p4-1790144399
// @version: 1

import React, { useState, useEffect, FormEvent, ChangeEvent } from 'react';

/**
 * Interface representing the payload for creating or editing a recurring payment.
 */
export interface RecurringPaymentPayload {
  payment_name: string;
  expected_amount: number;
  frequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  next_due_date: string;
  reminder_days_prior: number;
}

/**
 * Props for the RecurringPaymentsNew component.
 */
export interface RecurringPaymentsNewProps {
  initialData?: Partial<RecurringPaymentPayload>;
  onSubmit: (payload: RecurringPaymentPayload) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

/**
 * CMP-27: InputField Component
 * Reusable input or select field supporting accessibility, error announcement, and mobile/desktop responsive layouts.
 */
interface InputFieldProps {
  id: string;
  name: keyof RecurringPaymentPayload;
  label: string;
  control: 'text_input' | 'number_input' | 'select' | 'date_picker';
  value: string | number;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  error?: string;
  required?: boolean;
  options?: { label: string; value: string }[];
  placeholder?: string;
  min?: string | number;
  step?: string | number;
}

const InputField: React.FC<InputFieldProps> = ({
  id,
  name,
  label,
  control,
  value,
  onChange,
  error,
  required = false,
  options = [],
  placeholder,
  min,
  step,
}) => {
  const ariaInvalid = Boolean(error);

  return (
    <div className="flex flex-col space-y-1 mb-4">
      <label htmlFor={id} className="text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {control === 'select' ? (
        <select
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          aria-invalid={ariaInvalid}
          aria-describedby={`${id}-error`}
          className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={id}
          name={name}
          type={control === 'number_input' ? 'number' : control === 'date_picker' ? 'date' : 'text'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          min={min}
          step={step}
          aria-invalid={ariaInvalid}
          aria-describedby={`${id}-error`}
          className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
      )}
      {error && (
        <span id={`${id}-error`} className="text-xs text-red-600" role="alert">
          {error}
        </span>
      )}
    </div>
  );
};

/**
 * CMP-26: RecurringPaymentForm Component
 * Form handling creation and editing of recurring schedules with accessibility and responsive layouts.
 */
export const RecurringPaymentsNew: React.FC<RecurringPaymentsNewProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<RecurringPaymentPayload>({
    payment_name: initialData?.payment_name || '',
    expected_amount: initialData?.expected_amount ?? 0,
    frequency: initialData?.frequency || 'monthly',
    next_due_date: initialData?.next_due_date || new Date().toISOString().split('T')[0],
    reminder_days_prior: initialData?.reminder_days_prior ?? 3,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Keyboard navigation support: Esc to cancel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'expected_amount' || name === 'reminder_days_prior' ? Number(value) : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.payment_name.trim()) {
      newErrors.payment_name = 'Payment name is required.';
    }
    if (formData.expected_amount <= 0) {
      newErrors.expected_amount = 'Expected amount must be greater than zero.';
    }
    if (!formData.next_due_date) {
      newErrors.next_due_date = 'Next due date is required.';
    }
    if (formData.reminder_days_prior < 0) {
      newErrors.reminder_days_prior = 'Reminder days prior cannot be negative.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (!validate()) {
      return;
    }
    try {
      await onSubmit(formData);
    } catch (err: any) {
      setSubmitError(err?.message || 'Failed to save recurring payment. Please try again.');
    }
  };

  return (
    <main className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8 bg-white shadow-md rounded-lg my-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Add Recurring Payment</h1>
        <p className="text-sm text-gray-600 mt-1">
          Manually define or edit recurring income or expense schedules.
        </p>
      </div>

      {submitError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm" role="alert">
          {submitError}
        </div>
      )}

      <form
        role="form"
        onSubmit={handleSubmit}
        aria-label="Recurring Payment Form"
        className="space-y-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            id="payment_name"
            name="payment_name"
            label="Payment Name"
            control="text_input"
            value={formData.payment_name}
            onChange={handleChange}
            error={errors.payment_name}
            required
            placeholder="e.g., Netflix Subscription"
          />

          <InputField
            id="expected_amount"
            name="expected_amount"
            label="Expected Amount"
            control="number_input"
            value={formData.expected_amount}
            onChange={handleChange}
            error={errors.expected_amount}
            required
            min="0.01"
            step="0.01"
            placeholder="0.00"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <InputField
            id="frequency"
            name="frequency"
            label="Frequency"
            control="select"
            value={formData.frequency}
            onChange={handleChange}
            error={errors.frequency}
            required
            options={[
              { label: 'Weekly', value: 'weekly' },
              { label: 'Monthly', value: 'monthly' },
              { label: 'Quarterly', value: 'quarterly' },
              { label: 'Yearly', value: 'yearly' },
            ]}
          />

          <InputField
            id="next_due_date"
            name="next_due_date"
            label="Next Due Date"
            control="date_picker"
            value={formData.next_due_date}
            onChange={handleChange}
            error={errors.next_due_date}
            required
          />

          <InputField
            id="reminder_days_prior"
            name="reminder_days_prior"
            label="Reminder Days Prior"
            control="number_input"
            value={formData.reminder_days_prior}
            onChange={handleChange}
            error={errors.reminder_days_prior}
            required
            min="0"
            step="1"
          />
        </div>

        {/* Responsive action buttons: Sticky on mobile, standard layout on desktop */}
        <div className="fixed sm:static bottom-0 left-0 right-0 bg-white sm:bg-transparent p-4 sm:p-0 border-t sm:border-t-0 border-gray-200 flex justify-end space-x-3 mt-6 shadow-lg sm:shadow-none">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading || (typeof window !== 'undefined' && false)}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancel
          </button>
          <button
            id="save_recurring_btn"
            type="submit"
            disabled={isLoading}
            className="w-full sm:w-auto px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {isLoading ? 'Saving...' : 'Save Recurring Payment'}
          </button>
        </div>
      </form>
    </main>
  );
};

export default RecurringPaymentsNew;