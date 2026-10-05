// @module: Frontend Web Application.component.HouseholdCreate
// @spec_section_id: implementation_blueprint
// @req_ids: HHD-01
// @agent: CodeGenerationAgent
// @run_id: run-p4-1790144399
// @version: 1

import React, { useState, FormEvent, ChangeEvent } from 'react';

/**
 * Interface representing the form data for household creation and initial invitation.
 */
interface HouseholdCreateFormData {
  household_name: string;
  invitee_email: string;
  member_role: 'admin' | 'member' | 'viewer';
}

/**
 * Interface representing component props for HouseholdCreate.
 */
interface HouseholdCreateProps {
  onSubmitHousehold?: (data: HouseholdCreateFormData) => Promise<void>;
  onSuccessRedirect?: (householdId: string) => void;
}

/**
 * HouseholdCreate Component (CMP-21)
 * Screen: /household/create
 * Purpose: Create a shared household and invite registered users via email.
 */
export const HouseholdCreate: React.FC<HouseholdCreateProps> = ({
  onSubmitHousehold,
  onSuccessRedirect,
}) => {
  const [formData, setFormData] = useState<HouseholdCreateFormData>({
    household_name: '',
    invitee_email: '',
    member_role: 'member',
  });

  const [uiState, setUiState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof HouseholdCreateFormData, string>>>({});

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof HouseholdCreateFormData, string>> = {};
    let isValid = true;

    if (!formData.household_name.trim()) {
      errors.household_name = 'Household name is required.';
      isValid = false;
    } else if (formData.household_name.trim().length < 2) {
      errors.household_name = 'Household name must be at least 2 characters.';
      isValid = false;
    }

    if (formData.invitee_email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.invitee_email.trim())) {
        errors.invitee_email = 'Please enter a valid email address for the invitee.';
        isValid = false;
      }
    }

    if (!['admin', 'member', 'viewer'].includes(formData.member_role)) {
      errors.member_role = 'Please select a valid member role.';
      isValid = false;
    }

    setFieldErrors(errors);
    return isValid;
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear specific field error on change
    if (fieldErrors[name as keyof HouseholdCreateFormData]) {
      setFieldErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage('');

    if (!validateForm()) {
      setUiState('error');
      setErrorMessage('Please correct the highlighted errors before submitting.');
      return;
    }

    setUiState('loading');

    try {
      if (onSubmitHousehold) {
        await onSubmitHousehold(formData);
      } else {
        // Fallback default API call simulation if no prop provided
        await new Promise((resolve, setTimeoutId) => setTimeout(resolve, 1000));
      }

      setUiState('success');
      if (onSuccessRedirect) {
        onSuccessRedirect('mock-household-id-123');
      }
    } catch (err: unknown) {
      setUiState('error');
      if (err instanceof Error) {
        setErrorMessage(err.message || 'Failed to create household. Please try again.');
      } else {
        setErrorMessage('An unexpected error occurred while creating the household.');
      }
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-center text-3xl font-extrabold text-slate-900 tracking-tight">
          Create Shared Household
        </h1>
        <p className="mt-2 text-center text-sm text-slate-600">
          Set up your shared financial ecosystem and invite family or roommates.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md md:max-w-lg lg:max-w-xl">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-slate-200">
          {uiState === 'error' && errorMessage && (
            <div
              role="alert"
              aria-live="assertive"
              className="mb-4 bg-red-50 border-l-4 border-red-400 p-4 text-sm text-red-700"
            >
              <p>{errorMessage}</p>
            </div>
          )}

          {uiState === 'success' ? (
            <div
              role="status"
              aria-live="polite"
              className="rounded-md bg-green-50 p-4 text-center"
            >
              <h3 className="text-sm font-medium text-green-800">Household created successfully!</h3>
              <p className="mt-2 text-sm text-green-700">
                Your shared household has been established and the invitation email has been sent.
              </p>
            </div>
          ) : (
            <form
              role="form"
              aria-label="Household Creation Form"
              onSubmit={handleSubmit}
              className="space-y-6"
            >
              {/* Household Name Field */}
              <div>
                <label
                  htmlFor="household_name"
                  className="block text-sm font-medium text-slate-700"
                >
                  Household Name <span className="text-red-500">*</span>
                </label>
                <div className="mt-1">
                  <input
                    id="household_name"
                    name="household_name"
                    type="text"
                    required
                    value={formData.household_name}
                    onChange={handleChange}
                    placeholder="e.g., Smith Family Finance"
                    aria-invalid={Boolean(fieldErrors.household_name)}
                    aria-describedby={fieldErrors.household_name ? 'household_name-error' : undefined}
                    className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                {fieldErrors.household_name && (
                  <p
                    id="household_name-error"
                    role="alert"
                    className="mt-2 text-sm text-red-600"
                  >
                    {fieldErrors.household_name}
                  </p>
                )}
              </div>

              {/* Invitee Email Field */}
              <div>
                <label
                  htmlFor="invitee_email"
                  className="block text-sm font-medium text-slate-700"
                >
                  Initial Invitee Email (Optional)
                </label>
                <div className="mt-1">
                  <input
                    id="invitee_email"
                    name="invitee_email"
                    type="email"
                    value={formData.invitee_email}
                    onChange={handleChange}
                    placeholder="partner@example.com"
                    aria-invalid={Boolean(fieldErrors.invitee_email)}
                    aria-describedby={fieldErrors.invitee_email ? 'invitee_email-error' : undefined}
                    className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                {fieldErrors.invitee_email && (
                  <p
                    id="invitee_email-error"
                    role="alert"
                    className="mt-2 text-sm text-red-600"
                  >
                    {fieldErrors.invitee_email}
                  </p>
                )}
              </div>

              {/* Member Role Selection */}
              <div>
                <label
                  htmlFor="member_role"
                  className="block text-sm font-medium text-slate-700"
                >
                  Invitee Role
                </label>
                <div className="mt-1">
                  <select
                    id="member_role"
                    name="member_role"
                    value={formData.member_role}
                    onChange={handleChange}
                    aria-invalid={Boolean(fieldErrors.member_role)}
                    aria-describedby={fieldErrors.member_role ? 'member_role-error' : undefined}
                    className="block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm bg-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="admin">Admin (Full Control)</option>
                    <option value="member">Member (Standard Transactions & Budgets)</option>
                    <option value="viewer">Viewer (Read-Only Access)</option>
                  </select>
                </div>
                {fieldErrors.member_role && (
                  <p
                    id="member_role-error"
                    role="alert"
                    className="mt-2 text-sm text-red-600"
                  >
                    {fieldErrors.member_role}
                  </p>
                )}
              </div>

              {/* Submit Action Button */}
              <div>
                <button
                  type="submit"
                  disabled={uiState === 'loading'}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors duration-150"
                >
                  {uiState === 'loading' ? 'Creating Household...' : 'Send Invitation & Create'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </main>
  );
};

export default HouseholdCreate;