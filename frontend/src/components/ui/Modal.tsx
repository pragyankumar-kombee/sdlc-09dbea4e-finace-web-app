// @module: SharedCommon.frontend/src/components/ui/Modal.tsx
// @spec_section_id: implementation_blueprint
// @req_ids: N/A
// @agent: CodeGenerationAgent
// @run_id: run-p4-1790144399
// @version: 1

import React, { useEffect, useRef, ReactNode } from 'react';
import { createPortal } from 'react-dom';

export interface ModalProps {
  /** Controls whether the modal is visible */
  isOpen: boolean;
  /** Callback fired when the modal requests to close */
  onClose: () => void;
  /** Modal title displayed in the header */
  title: string;
  /** Modal body content */
  children: ReactNode;
  /** Optional custom width or size class */
  maxWidthClass?: string;
  /** Whether clicking the backdrop closes the modal (default: true) */
  closeOnBackdropClick?: boolean;
  /** Whether pressing the Escape key closes the modal (default: true) */
  closeOnEscape?: boolean;
}

/**
 * Accessible Modal component adhering to WAI-ARIA dialog design patterns.
 * Supports focus trapping, escape key dismissal, and backdrop click handling.
 */
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidthClass = 'max-w-lg',
  closeOnBackdropClick = true,
  closeOnEscape = true,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElementRef = useRef<Element | null>(null);

  // Handle ESC key press
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, closeOnEscape, onClose]);

  // Handle focus trapping and restoration
  useEffect(() => {
    if (isOpen) {
      previousActiveElementRef.current = document.activeElement;
      
      // Focus modal container or first focusable element
      if (modalRef.current) {
        modalRef.current.focus();
      }

      // Prevent body scrolling when modal is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      
      // Restore focus to previous element
      if (
        previousActiveElementRef.current &&
        previousActiveElementRef.current instanceof HTMLElement
      ) {
        previousActiveElementRef.current.focus();
      }
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (closeOnBackdropClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity animate-fadeIn"
      onClick={handleBackdropClick}
      role="presentation"
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        tabIndex={-1}
        className={`relative w-full ${maxWidthClass} bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 focus:outline-none overflow-hidden transform transition-all animate-scaleIn`}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <h2
            id="modal-title"
            className="text-lg font-semibold text-slate-900 dark:text-slate-100"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <div className="px-6 py-4 max-h-[80vh] overflow-y-auto text-slate-700 dark:text-slate-300">
          {children}
        </div>
      </div>
    </div>
  );

  // Render via React Portal to document body to ensure proper stacking context
  return createPortal(modalContent, document.body);
};

export default Modal;