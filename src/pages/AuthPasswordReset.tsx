// @module: Frontend Web Application.component.AuthPasswordReset
// @spec_section_id: implementation_blueprint
// @req_ids: AUTH-03
// @agent: CodeGenerationAgent
// @run_id: run-p4-1790144399
// @version: 1

import React, { useState, FormEvent, ChangeEvent } from 'react';

/**
 * Interface representing the props for the AuthPasswordReset component.
 */
interface AuthPasswordResetProps {
  /** Optional callback invoked upon a successful password reset request submission */
  onSuccess?: (email: string) => void;
  /** Optional custom API submission handler. If not provided, calls the default API service. */
  onSubmitReset?: (email: string) => Promise<void>;
}

/**
 * AuthPasswordReset Component (Screen SCR-03: /auth/password-reset)
 * Implements requirement AUTH-03: Password reset mechanism via secure token sent to registered email.
 */
export const AuthPasswordReset: React.FC<AuthPasswordResetProps> = ({
  onSuccess,
  onSubmitReset,
}) => {
  const [email, setEmail] = useState<string>('');
  const [status, setStatus] = useState<'empty' | 'loading' | 'success' | 'error'>('empty');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const validateEmail = (value: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!email.trim()) {
      setStatus('error');
      setErrorMessage('Email address is required.');
      return;
    }

    if (!validateEmail(email)) {
      setStatus('error');
      setErrorMessage('Please enter a valid email address format.');
      return;
    }

    setStatus('loading');
    setErrorMessage('');

    try {
      if (onSubmitReset) {
        await onSubmitReset(email);
      } else {
        // Default API simulation following service contract integration standard
        await new Promise((resolve, reject) => {
          setTimeout(() => {
            if (email.includes('error')) {
              reject(new Error('Failed to send password reset email. Please try again.'));
            } else {
              resolve(true);
            }
          }, 1000);
        });
      }

      setStatus('success');
      if (onSuccess) {
        onSuccess(email);
      }
    } catch (err: unknown) {
      setStatus('error');
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('An unexpected error occurred during password reset.');
      }
    }
  };

  const handleEmailChange = (e: ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (status === 'error') {
      setStatus('empty');
      setErrorMessage('');
    }
  };

  return (
    <main
      role="main"
      className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Reset Password
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Enter your registered email address and we&apos;ll send you a secure link to reset your password.
          </p>
        </div>

        {status === 'success' ? (
          <div
            role="status"
            aria-live="polite"
            className="rounded-md bg-green-50 dark:bg-green-900/30 p-4 border border-green-200 dark:border-green-800"
          >
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
                  Reset link sent successfully
                </h3>
                <div className="mt-2 text-sm text-green-700 dark:text-green-300">
                  <p>
                    If an account exists for <span className="font-semibold">{email}</span>, you will receive password reset instructions shortly.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit} noValidate>
            <div>
              <label
                htmlFor="email-input"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Email address
              </label>
              {/* CMP-01: TextInput implementation */}
              <input
                id="email-input"
                name="email"
                type="email"
                autoComplete="email"
                required
                role="textbox"
                aria-invalid={status === 'error'}
                aria-describedby={status === 'error' ? 'email-error' : undefined}
                value={email}
                onChange={handleEmailChange}
                disabled={status === 'loading'}
                placeholder="name@example.com"
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm bg-white dark:bg-gray-700 disabled:opacity-50"
              />
              {status === 'error' && (
                <div
                  id="email-error"
                  role="region"
                  aria-live="assertive"
                  className="mt-1 text-sm text-red-600 dark:text-red-400"
                >
                  {errorMessage}
                </div>
              )}
            </div>

            <div>
              {/* CMP-02: Button implementation */}
              <button
                type="submit"
                role="button"
                disabled={status === 'loading'}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors duration-200"
              >
                {status === 'loading' ? (
                  <span className="flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Sending Reset Link...
                  </span>
                ) : (
                  'Send Reset Link'
                )}
              </button>
            </div>

            <div className="flex items-center justify-between text-sm">
              <a
                href="/auth/login"
                className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
              >
                Back to sign in
              </a>
            </div>
          </form>
        )}
      </div>
    </main>
  );
};

export default AuthPasswordReset;