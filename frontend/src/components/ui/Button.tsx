// @module: SharedCommon.frontend/src/components/ui/Button.tsx
// @spec_section_id: implementation_blueprint
// @req_ids: N/A
// @agent: CodeGenerationAgent
// @run_id: run-p4-1790144399
// @version: 1

import React from 'react';

/**
 * Interface representing all properties supported by the FinPulse Engine Button component.
 * Extends standard HTML button attributes to maintain full native accessibility and event handling.
 */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Visual variant determining the color palette and prominence of the button.
   * @default 'primary'
   */
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  
  /**
   * Size constraint affecting padding, font size, and layout height.
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  
  /**
   * When true, renders a pulsing spinner and disables user interaction.
   * @default false
   */
  isLoading?: boolean;
  
  /**
   * Optional custom CSS class names to merge with the base design system styles.
   */
  className?: string;
}

/**
 * FinPulse Engine Standard Button Component.
 * Implements strict accessibility standards, dynamic variants, loading spinner states,
 * and seamless Tailwind CSS styling for the Personal Finance Management Platform frontend.
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  className = '',
  type = 'button',
  ...props
}, ref) => {
  // Base structural classes ensuring consistent typography, transition, and focus ring behaviors
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none';

  // Variant-specific styling mapping to the design system color tokens
  const variantStyles = {
    primary: 'bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500 shadow-sm',
    secondary: 'bg-slate-800 text-slate-100 hover:bg-slate-900 focus:ring-slate-700 shadow-sm',
    outline: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus:ring-emerald-500 shadow-sm',
    danger: 'bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-500 shadow-sm',
    ghost: 'bg-transparent text-slate-700 hover:bg-slate-100 focus:ring-slate-500',
  };

  // Size-specific height, padding, and text scaling
  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2 gap-2',
    lg: 'text-base px-6 py-3 gap-2.5',
  };

  // Combine styles safely, avoiding conflicting class collisions
  const combinedClassName = [
    baseStyles,
    variantStyles[variant],
    sizeStyles[size],
    className,
  ].filter(Boolean).join(' ');

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || isLoading}
      className={combinedClassName}
      aria-busy={isLoading}
      {...props}
    >
      {isLoading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  );
});

Button.displayName = 'Button';