// @module: SharedCommon.frontend/src/components/ui/Card.tsx
// @spec_section_id: implementation_blueprint
// @req_ids: N/A
// @agent: CodeGenerationAgent
// @run_id: run-p4-1790144399
// @version: 1

import React, { HTMLAttributes, forwardRef } from 'react';

/**
 * Props for the Card root component.
 */
export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Optional variant styling for the card container */
  variant?: 'default' | 'bordered' | 'elevated' | 'interactive';
}

/**
 * Props for the CardHeader component.
 */
export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {}

/**
 * Props for the CardTitle component.
 */
export interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

/**
 * Props for the CardDescription component.
 */
export interface CardDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {}

/**
 * Props for the CardContent component.
 */
export interface CardContentProps extends HTMLAttributes<HTMLDivElement> {}

/**
 * Props for the CardFooter component.
 */
export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {}

/**
 * Utility function to combine CSS class names safely.
 */
function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * FinPulse Engine - Card Component
 * A robust, modular, accessible container component styled with Tailwind CSS
 * for the Personal Finance Management Platform frontend.
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    const baseStyles = 'rounded-xl bg-white text-slate-900 transition-all duration-200 dark:bg-slate-900 dark:text-slate-100';

    const variantStyles = {
      default: 'shadow-sm border border-slate-200/80 dark:border-slate-800',
      bordered: 'border-2 border-slate-300 dark:border-slate-700 shadow-none',
      elevated: 'shadow-md hover:shadow-lg border border-slate-100 dark:border-slate-800/60',
      interactive: 'shadow-sm border border-slate-200 hover:border-indigo-500 hover:shadow-md cursor-pointer dark:border-slate-800 dark:hover:border-indigo-400',
    };

    return (
      <div
        ref={ref}
        className={cn(baseStyles, variantStyles[variant], className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

/**
 * CardHeader container for title, description, and top-level card actions.
 */
export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex flex-col space-y-1.5 p-6 pb-4', className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardHeader.displayName = 'CardHeader';

/**
 * CardTitle heading component.
 */
export const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, as: Component = 'h3', children, ...props }, ref) => {
    return (
      <Component
        ref={ref}
        className={cn('text-xl font-semibold leading-tight tracking-tight text-slate-900 dark:text-white', className)}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

CardTitle.displayName = 'CardTitle';

/**
 * CardDescription subtitle/supporting text component.
 */
export const CardDescription = forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <p
        ref={ref}
        className={cn('text-sm text-slate-500 dark:text-slate-400', className)}
        {...props}
      >
        {children}
      </p>
    );
  }
);

CardDescription.displayName = 'CardDescription';

/**
 * CardContent main body container.
 */
export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('p-6 pt-0 text-slate-700 dark:text-slate-300', className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardContent.displayName = 'CardContent';

/**
 * CardFooter bottom action container.
 */
export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex items-center p-6 pt-0', className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardFooter.displayName = 'CardFooter';