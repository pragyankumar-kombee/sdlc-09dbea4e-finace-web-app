// @module: EntryPoint.frontend/src/main.tsx
// @spec_section_id: implementation_blueprint
// @req_ids: N/A
// @agent: CodeGenerationAgent
// @run_id: run-p4-1790144399
// @version: 1

import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

/**
 * Root Application Component for FinPulse Engine (Personal Finance Management Platform).
 * Renders the main SPA entry point with strict mode compliance.
 */
const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-6">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-emerald-400 mb-2">
          FinPulse Engine
        </h1>
        <p className="text-slate-400 text-lg">
          Secure Personal Finance Management Platform
        </p>
      </header>
      <main className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-xl shadow-xl p-6 text-center">
        <h2 className="text-xl font-semibold mb-3 text-slate-200">System Initialized</h2>
        <p className="text-slate-300 text-sm mb-6">
          Frontend SPA routing and authentication context successfully mounted. Ready for user session establishment.
        </p>
        <div className="inline-flex items-center px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse mr-2"></span>
          System Operational
        </div>
      </main>
    </div>
  );
};

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Critical Error: Failed to find the root HTML element with id "root" for mounting the React application.');
}

const root = createRoot(rootElement);

root.render(
  <StrictMode>
    <App />
  </StrictMode>
);