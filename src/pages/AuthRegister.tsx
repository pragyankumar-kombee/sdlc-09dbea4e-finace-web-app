// @module: Frontend Web Application.component.AuthRegister
// @spec_section_id: implementation_blueprint
// @req_ids: AUTH-01
// @agent: CodeGenerationAgent
// @run_id: run-p4-1790144399
// @version: 1

import React, { useState, FormEvent, ChangeEvent } from 'react';
import { frontend_web_applicationApi } from '../services/frontend_web_applicationApi';

export interface AuthRegisterProps {
  onSuccess?: () => void;
  onNavigateLogin?: () => void;
}

export const AuthRegister: React.FC<AuthRegisterProps> = ({ onSuccess, onNavigateLogin }) => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [displayName, setDisplayName] = useState<string>('');
  const [baseCurrency, setBaseCurrency] = useState<string>('USD');

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handlePasswordToggle = () => {
    setShowPassword((prev) => !prev);
  };

  const validateForm = (): boolean => {
    if (!email || !email.includes('@')) {
      setErrorMessage('Please provide a valid email address.');
      return false;
    }
    if (!password || password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return false;
    }
    if (!displayName.trim()) {
      setErrorMessage('Display name is required.');
      return false;
    }
    if (!baseCurrency.trim()) {
      setErrorMessage('Base currency is required.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      await frontend_web_applicationApi.register({
        email,
        password,
        display_name: displayName,
        base_currency: baseCurrency,
      });

      setSuccessMessage('Registration successful! Please verify your email.');
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      setErrorMessage(
        error?.message || 'Registration failed. Please check your details and try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg border border-gray-100">
        <div>
          <h1 className="text-center text-3xl font-extrabold text-gray-900">Register</h1>
          <p className="mt-2 text-center text-sm text-e-gray-600 text-gray-600">
            Create your FinPulse Engine account
          </p>
        </div>

        {errorMessage && (
          <div
            role="alert"
            aria-live="polite"
            className="bg-red-50 border-l-4 border-red-400 p-4 rounded text-sm text-red-700"
          >
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div
            role="status"
            aria-live="polite"
            className="bg-green-50 border-l-4 border-green-400 p-4 rounded text-sm text-green-700"
          >
            {successMessage}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            {/* Email Field (CMP-01) */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                role="textbox"
                value={email}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="you@example.com"
                aria-invalid={!!errorMessage}
              />
            </div>

            {/* Password Field (CMP-01) */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="relative mt-1">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  role="textbox"
                  value={password}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm pr-12"
                  placeholder="••••••••"
                  aria-invalid={!!errorMessage}
                />
              </div>
            </div>

            {/* Show Password Toggle (CMP-03) */}
            <div className="flex items-center justify-between">
              <span id="show-password-label" className="text-sm text-gray-700">
                Show Password
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={showPassword}
                aria-labelledby="show-password-label"
                onClick={handlePasswordToggle}
                className={`${
                  showPassword ? 'bg-indigo-600' : 'bg-gray-200'
                } relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
              >
                <span
                  aria-hidden="true"
                  className={`${
                    showPassword ? 'translate-x-5' : 'translate-x-0'
                  } pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`}
                />
              </button>
            </div>

            {/* Display Name Field (CMP-01) */}
            <div>
              <label htmlFor="display_name" className="block text-sm font-medium text-gray-700">
                Display Name
              </label>
              <input
                id="display_name"
                name="display_name"
                type="text"
                autoComplete="name"
                required
                role="textbox"
                value={displayName}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setDisplayName(e.target.value)}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="John Doe"
              />
            </div>

            {/* Base Currency Field (CMP-01) */}
            <div>
              <label htmlFor="base_currency" className="block text-sm font-medium text-gray-700">
                Base Currency
              </label>
              <input
                id="base_currency"
                name="base_currency"
                type="text"
                required
                role="textbox"
                value={baseCurrency}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setBaseCurrency(e.target.value)}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="USD"
              />
            </div>
          </div>

          {/* Submit Button (CMP-02 / ACT-02) */}
          <div>
            <button
              id="submit_button"
              type="submit"
              role="button"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
            >
              {isLoading ? 'Creating account...' : 'Register'}
            </button>
          </div>

          {onNavigateLogin && (
            <div className="text-center mt-4">
              <button
                type="button"
                onClick={onNavigateLogin}
                className="text-sm text-indigo-600 hover:text-indigo-500 focus:outline-none underline"
              >
                Already have an account? Log in
              </button>
            </div>
          )}
        </form>
      </div>
    </main>
  );
};

export default AuthRegister;