// @module: Frontend Web Application.component.SettingsProfile
// @spec_section_id: implementation_blueprint
// @req_ids: AUTH-04
// @agent: CodeGenerationAgent
// @run_id: run-p4-1790144399
// @version: 1

import React, { useState, useEffect } from 'react';

interface UserProfile {
  display_name: string;
  base_currency: string;
}

interface SettingsProfileProps {
  initialProfile?: UserProfile;
  onSaveProfile: (profile: UserProfile) => Promise<void>;
}

export const SettingsProfile: React.FC<SettingsProfileProps> = ({
  initialProfile,
  onSaveProfile,
}) => {
  const [displayName, setDisplayName] = useState<string>(initialProfile?.display_name || '');
  const [baseCurrency, setBaseCurrency] = useState<string>(initialProfile?.base_currency || 'USD');
  const [uiState, setUiState] = useState<'loading' | 'empty' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  useEffect(() => {
    if (initialProfile) {
      setDisplayName(initialProfile.display_name);
      setBaseCurrency(initialProfile.base_currency);
      setUiState('success');
    } else {
      setUiState('empty');
    }
  }, [initialProfile]);

  const validateForm = (): boolean => {
    if (!displayName.trim()) {
      setErrorMessage('Display name cannot be empty.');
      setUiState('error');
      return false;
    }
    if (!baseCurrency.trim() || baseCurrency.length !== 3) {
      setErrorMessage('Base currency must be a valid 3-letter currency code (e.g., USD, EUR).');
      setUiState('error');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!validateForm()) {
      return;
    }

    setUiState('loading');

    try {
      await onSaveProfile({
        display_name: displayName.trim(),
        base_currency: baseCurrency.trim().toUpperCase(),
      });
      setSuccessMessage('Profile successfully updated.');
      setUiState('success');
    } catch (err: unknown) {
      const errorObj = err as Error;
      setErrorMessage(errorObj.message || 'An unexpected error occurred while saving profile.');
      setUiState('error');
    }
  };

  return (
    <main role="main" className="max-w-4xl mx-auto p-4 md:p-8">
      <h1 className="text-2xl md:text-3xl font-bold mb-6 text-gray-900">Profile Management</h1>

      {uiState === 'loading' && !initialProfile && (
        <div className="flex justify-center items-center py-12" aria-live="polite">
          <span className="text-gray-500 animate-pulse">Loading profile settings...</span>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-md rounded-lg p-6 grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        {uiState === 'error' && (
          <div
            role="alert"
            aria-live="assertive"
            className="col-span-full bg-red-50 border-l-4 border-red-400 p-4 mb-4 text-red-700 text-sm"
          >
            {errorMessage}
          </div>
        )}

        {uiState === 'success' && successMessage && (
          <div
            role="status"
            aria-live="polite"
            className="col-span-full bg-green-50 border-l-4 border-green-400 p-4 mb-4 text-green-700 text-sm"
          >
            {successMessage}
          </div>
        )}

        {/* CMP-01: TextInput for Display Name */}
        <div className="flex flex-col">
          <label htmlFor="display_name" className="block text-sm font-medium text-gray-700 mb-1">
            Display Name
          </label>
          <input
            id="display_name"
            name="display_name"
            type="text"
            role="textbox"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
            placeholder="Enter your display name"
            aria-required="true"
          />
        </div>

        {/* CMP-01: TextInput for Base Currency */}
        <div className="flex flex-col">
          <label htmlFor="base_currency" className="block text-sm font-medium text-gray-700 mb-1">
            Base Currency (ISO Code)
          </label>
          <input
            id="base_currency"
            name="base_currency"
            type="text"
            role="textbox"
            maxLength={3}
            value={baseCurrency}
            onChange={(e) => setBaseCurrency(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border uppercase"
            placeholder="USD"
            aria-required="true"
          />
        </div>

        {/* CMP-02: Button */}
        <div className="col-span-full flex justify-end mt-4">
          <button
            type="submit"
            role="button"
            disabled={uiState === 'loading'}
            className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {uiState === 'loading' ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </main>
  );
};