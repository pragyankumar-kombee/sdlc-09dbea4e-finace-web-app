// @module: SharedCommon.frontend/src/components/ui/Input.tsx
// @spec_section_id: implementation_blueprint
// @req_ids: N/A
// @agent: CodeGenerationAgent
// @run_id: run-p4-1790144399
// @version: 1

import React, { forwardRef, useId } from 'react';

/**
 * Props for the re-usable Input component.
 * Extends standard HTML input attributes while integrating accessibility,
 * error states, helper text, and Tailwind CSS styling for FinPulse Engine.
 */
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Label text displayed above the input field. */
  label?: string;
  /** Error message string or boolean flag to indicate invalid state. */
  error?: string | boolean;
  /** Helper text displayed below the input field when there is no error. */
  helperText?: string;
  /** Optional icon element to display inside the left side of the input. */
  leftIcon?: React.ReactNode;
  /** Optional icon element to display inside the right side of the input. */
  rightIcon?: React.ReactNode;
  /** Container className override for advanced layout flexibility. */
  containerClassName?: string;
}

/**
 * FinPulse Engine Design System - Standard Input Component
 * 
 * Provides an accessible, responsive input element with optional label, helper text,
 * validation error messaging, and adornment icons.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(({
  id: customId,
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  className = '',
  containerClassName = '',
  disabled,
  type = 'text',
  ...props
}, ref) => {
  const generatedId = useId();
  const inputId = customId || generatedId;
  const errorId = `${inputId}-error`;
  const helperId = `${inputId}-helper`;

  const hasError = Boolean(error);
  const errorMessage = typeof error === 'string' ? error : undefined;

  // Base and conditional styles using Tailwind CSS
  const baseInputStyles = [
    'flex w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition-colors',
    'placeholder:text-gray-400',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    'disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500 disabled:opacity-75',
  ];

  const stateInputStyles = hasError
    ? 'border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500'
    : 'border-gray-300 focus-visible:border-indigo-600 focus-visible:ring-indigo-600';

  const paddingLeftStyle = leftIcon ? 'pl-10' : '';
  const paddingRightStyle = rightIcon ? 'pr-10' : '';

  const combinedInputClassName = [
    ...baseInputStyles,
    stateInputStyles,
    paddingLeftStyle,
    paddingRightStyle,
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={`flex flex-col gap-1.5 ${containerClassName}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-gray-700 select-none"
        >
          {label}
        </label>
      )}

      <div className="relative flex items-center">
        {leftIcon && (
          <div className="absolute left-3 flex items-center pointer-events-none text-gray-400">
            {leftIcon}
          </div>
        )}

        <input
          ref={ref}
          id={inputId}
          type={type}
          disabled={disabled}
          aria-invalid={hasError}
          aria-describedby={
            hasError ? errorId : helperText ? helperId : undefined
          }
          className={combinedInputClassName}
          {...props}
        />

        {rightIcon && (
          <div className="absolute right-3 flex items-center pointer-events-none text-gray-400">
            {rightIcon}
          </div>
        )}
      </div>

      {hasError && errorMessage ? (
        <p id={errorId} className="text-xs font-medium text-red-600 mt-0.5">
          {errorMessage}
        </p>
      ) : helperText ? (
        <p id={helperId} className="text-xs text-gray-500 mt-0.5">
          {helperText}
        </p>
      ) : null}
    </div>
  );
});

Input.displayName = 'Input';