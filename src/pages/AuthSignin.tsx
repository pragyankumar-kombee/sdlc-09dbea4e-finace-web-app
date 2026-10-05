// @module: Frontend Web Application.component.AuthSignin
// @spec_section_id: implementation_blueprint
// @req_ids: AUTH-02
// @agent: CodeGenerationAgent
// @run_id: run-p4-1790144399
// @version: 1

import React, { useState, FormEvent, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Interface contract for sibling API client service.
 * Expected to be located at src/services/frontend_web_applicationApi.ts
 */
declare namespace FrontendWebApplicationApi {
  interface SigninCredentials {
    email: string;
    password: string;
    rememberMe?: boolean;
  }

  interface SigninResponse {
    token: string;
    user: {
      id: string;
      email: string;
      displayName: string;
    };
  }

  function signin(credentials: SigninCredentials): Promise<SigninResponse>;
}

// Importing service function contractually via sibling file reference
import { signin } from '../services/frontend_web_applicationApi';

export interface AuthSigninProps {
  onSuccess?: (response: FrontendWebApplicationApi.SigninResponse) => void;
  redirectTo?: string;
}

export const AuthSignin: React.FC<AuthSigninProps> = ({ onSuccess, redirectTo = '/dashboard' }) => {
  const navigate = useNavigate();

  // Form state
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(false);

  // UI state machine: 'empty' | 'loading' | 'success' | 'error'
  const [uiState, setUiState] = useState<'empty' | 'loading' | 'success' | 'error'>('empty');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const validateEmail = (value: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  };

  const handleInputChange = (setter: React.Dispatch<React.SetStateAction<string>>, value: string) => {
    setter(value);
    if (uiState === 'error') {
      setUiState(email && password ? 'empty' : 'empty');
      setErrorMessage('');
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      setUiState('error');
      setErrorMessage('Email and password fields are required.');
      return;
    }

    if (!validateEmail(email)) {
      setUiState('error');
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setUiState('loading');
    setErrorMessage('');

    try {
      const response = await signin({ email, password, rememberMe });
      setUiState('success');
      if (onSuccess) {
        onSuccess(response);
      }
      navigate(redirectTo);
    } catch (err: unknown) {
      setUiState('error');
      if (err instanceof Error) {
        setErrorMessage(err.message || 'Authentication failed. Please verify your credentials.');
      } else {
        setErrorMessage('An unexpected error occurred during sign in.');
      }
    }
  };

  return (
    <main 
      role="main" 
      className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
        <div>
          <h1 className="text-3xl font-extrabold text-center text-gray-900 dark:text-white tracking-tight">
            Sign In
          </h1>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Access your FinPulse Engine account
          </p>
        </div>

        {uiState === 'error' && (
          <div 
            aria-live="assertive" 
            role="alert"
            className="p-3 text-sm text-red-700 bg-red-100 dark:bg-red-200 dark:text-red-900 rounded-lg"
          >
            {errorMessage}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit} noValidate>
          <div className="space-y-4">
            {/* CMP-01: TextInput for Email */}
            <div>
              <label 
                htmlFor="email" 
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Email Address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  role="textbox"
                  value={email}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => handleInputChange(setEmail, e.target.value)}
                  className="appearance-none block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white min-h-[48px]"
                  placeholder="you@example.com"
                  aria-invalid={uiState === 'error'}
                />
              </div>
            </div>

            {/* CMP-01: TextInput for Password */}
            <div>
              <label 
                htmlFor="password" 
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  role="textbox"
                  value={password}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => handleInputChange(setPassword, e.target.value)}
                  className="appearance-none block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white min-h-[48px] pr-16"
                  placeholder="••••••••"
                  aria-invalid={uiState === 'error'}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            {/* CMP-04: Checkbox for Remember Me */}
            <div className="flex items-center">
              <input
                id="remember_me"
                name="remember_me"
                type="checkbox"
                role="checkbox"
                checked={rememberMe}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setRememberMe(e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded cursor-pointer"
              />
              <label 
                htmlFor="remember_me" 
                className="ml-2 block text-sm text-gray-900 dark:text-gray-300 cursor-pointer"
              >
                Remember me
              </label>
            </div>

            {/* CMP-03: Toggle for Show Password */}
            <div className="flex items-center space-x-2">
              <button
                type="button"
                role="switch"
                aria-checked={showPassword}
                onClick={() => setShowPassword((prev) => !prev)}
                onKeyDown={(e) => {
                  if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    setShowPassword((prev) => !prev);
                  }
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                  showPassword ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    showPassword ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className="text-xs text-gray-600 dark:text-gray-400 select-none">
                Show
              </span>
            </div>
          </div>

          <div>
            {/* CMP-02: Submit Button */}
            <button
              id="submit_button"
              type="submit"
              role="button"
              disabled={uiState === 'loading'}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px] items-center transition-colors"
            >
              {uiState === 'loading' ? (
                <svg 
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : null}
              {uiState === 'loading' ? 'Signing in...' : 'Sign In'}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
};

export default AuthSignin;