// @module: Frontend Web Application.component.SettingsLinkedAccounts
// @spec_section_id: implementation_blueprint
// @req_ids: BNK-01, BNK-02, BNK-03, BNK-04
// @agent: CodeGenerationAgent
// @run_id: run-p4-1790144399
// @version: 1

import React, { useState, useEffect, useCallback, KeyboardEvent, ChangeEvent } from 'react';

// Sibling service interface contract (assumed file: src/services/frontend_web_applicationApi.ts)
export interface ConnectedAccount {
  id: string;
  institutionName: string;
  mask: string;
  type: string;
  balance: number;
  currency: string;
  status: 'active' | 'reauth_required' | 'syncing';
  lastSynced: string;
}

export interface LinkInstitutionPayload {
  publicToken: string;
  institutionId: string;
  selectedAccountIds: string[];
}

export interface FrontendWebApplicationApi {
  getLinkedAccounts(): Promise<ConnectedAccount[]>;
  linkInstitution(payload: LinkInstitutionPayload): Promise<ConnectedAccount[]>;
  triggerSync(accountId: string): Promise<void>;
}

// Mock or passed service implementation reference matching the sibling contract
declare const apiService: FrontendWebApplicationApi;

export interface SettingsLinkedAccountsProps {
  api?: FrontendWebApplicationApi;
}

/**
 * SettingsLinkedAccounts Component (SCR-07 / /settings/linked-accounts)
 * Implements BNK-01, BNK-02, BNK-03, BNK-04 requirements for managing linked financial institutions,
 * executing account synchronization, and handling re-authentication failure states.
 */
export const SettingsLinkedAccounts: React.FC<SettingsLinkedAccountsProps> = ({ api }) => {
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [uiState, setUiState] = useState<'loading' | 'empty' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [syncingId, setSyncingId] = useState<string | null>(null);

  // Modal / Link Flow State
  const [isLinkingModalOpen, setIsLinkingModalOpen] = useState<boolean>(false);
  const [publicToken, setPublicToken] = useState<string>('');
  const [institutionId, setInstitutionId] = useState<string>('');
  const [accountSelection, setAccountSelection] = useState<string[]>([]);
  const [linkError, setLinkError] = useState<string>('');

  const clientApi = api || {
    getLinkedAccounts: async () => [],
    linkInstitution: async () => [],
    triggerSync: async () => {},
  };

  const fetchAccounts = useCallback(async () => {
    setUiState('loading');
    setErrorMessage('');
    try {
      const data = await clientApi.getLinkedAccounts();
      setAccounts(data);
      if (data.length === 0) {
        setUiState('empty');
      } else {
        setUiState('success');
      }
    } catch (err: unknown) {
      setUiState('error');
      setErrorMessage(err instanceof Error ? err.message : 'Failed to load linked accounts.');
    }
  }, [clientApi]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  // BNK-01 & BNK-02: Link Financial Institution Handler
  const handleLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicToken.trim() || !institutionId.trim()) {
      setLinkError('Public token and institution ID are required.');
      return;
    }
    setLinkError('');
    try {
      const updatedAccounts = await clientApi.linkInstitution({
        publicToken,
        institutionId,
        selectedAccountIds: accountSelection,
      });
      setAccounts(updatedAccounts);
      setIsLinkingModalOpen(false);
      setPublicToken('');
      setInstitutionId('');
      setAccountSelection([]);
      setUiState(updatedAccounts.length === 0 ? 'empty' : 'success');
    } catch (err: unknown) {
      setLinkError(err instanceof Error ? err.message : 'Failed to link institution securely.');
    }
  };

  // BNK-03 & BNK-04: Sync Trigger Handler with Re-authentication / Failure Flagging
  const handleSyncTrigger = async (accountId: string) => {
    setSyncingId(accountId);
    try {
      await clientApi.triggerSync(accountId);
      await fetchAccounts();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Synchronization failed. Re-authentication may be required.');
      setAccounts((prev) =>
        prev.map((acc) => (acc.id === accountId ? { ...acc, status: 'reauth_required' } : acc))
      );
    } finally {
      setSyncingId(null);
    }
  };

  const handleKeyDownButton = (e: KeyboardEvent, callback: () => void) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      callback();
    }
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Linked Accounts</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage connected financial institution accounts and trigger synchronization.
        </p>
      </header>

      {/* Action Bar */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Connected Institutions</h2>
        <button
          role="button"
          tabIndex={0}
          aria-label="Link Financial Institution"
          onKeyDown={(e) => handleKeyDownButton(e, () => setIsLinkingModalOpen(true))}
          onClick={() => setIsLinkingModalOpen(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 min-h-[44px]"
        >
          Link Financial Institution
        </button>
      </div>

      {/* Live Region for Error / Alert Notifications (CMP-11 a11y) */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {errorMessage && `Alert: ${errorMessage}`}
      </div>

      {errorMessage && (
        <div role="alert" className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 text-red-700 rounded-md">
          <p className="font-medium">Synchronization Error</p>
          <p className="text-sm">{errorMessage}</p>
        </div>
      )}

      {/* UI States Handling */}
      {uiState === 'loading' && (
        <div className="flex justify-center items-center py-20" aria-busy="true">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      )}

      {uiState === 'empty' && (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">No linked accounts found</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Get started by linking your bank or financial institution.
          </p>
        </div>
      )}

      {uiState === 'success' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts.map((account) => (
            <div
              key={account.id}
              className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg border border-gray-200 dark:border-gray-700 flex flex-col justify-between"
            >
              <div className="p-5">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">{account.institutionName}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      •••• {account.mask} ({account.type})
                    </p>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                      account.status === 'active'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
                    }`}
                  >
                    {account.status === 'active' ? 'Active' : 'Re-auth Required'}
                  </span>
                </div>
                <div className="mt-4">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: account.currency || 'USD' }).format(
                      account.balance
                    )}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Last synced: {new Date(account.lastSynced).toLocaleString()}</p>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 px-5 py-3 flex justify-between items-center">
                {account.status === 'reauth_required' ? (
                  <span className="text-xs text-red-600 font-medium">Institution connection expired</span>
                ) : (
                  <span className="text-xs text-gray-500 dark:text-gray-300">Operational</span>
                )}
                <button
                  role="button"
                  tabIndex={0}
                  aria-label="sync_trigger_button"
                  disabled={syncingId === account.id}
                  onKeyDown={(e) => handleKeyDownButton(e, () => handleSyncTrigger(account.id))}
                  onClick={() => handleSyncTrigger(account.id)}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 shadow-sm text-xs font-medium rounded text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 min-h-[36px]"
                >
                  {syncingId === account.id ? 'Syncing...' : 'Sync Now'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for linking institution */}
      {isLinkingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-lg w-full p-6 shadow-xl border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Link Financial Institution</h3>
            {linkError && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-md" aria-live="assertive">
                {linkError}
              </div>
            )}
            <form onSubmit={handleLinkSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Public Token</label>
                <input
                  type="text"
                  name="public_token"
                  value={publicToken}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setPublicToken(e.target.value)}
                  placeholder="public-sandbox-..."
                  className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white min-h-[44px]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Institution ID</label>
                <input
                  type="text"
                  name="institution_id"
                  value={institutionId}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setInstitutionId(e.target.value)}
                  placeholder="ins_109508"
                  className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white min-h-[44px]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Account Selection
                </label>
                <div role="group" aria-label="Account Selection List" className="space-y-2 max-h-32 overflow-y-auto border border-gray-200 dark:border-gray-700 p-2 rounded-md">
                  {['Checking', 'Savings', 'Credit Card'].map((accType, idx) => {
                    const accId = `acc_${idx + 1}`;
                    return (
                      <label key={accId} className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                        <input
                          type="checkbox"
                          value={accId}
                          checked={accountSelection.includes(accId)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setAccountSelection([...accountSelection, accId]);
                            } else {
                              setAccountSelection(accountSelection.filter((id) => id !== accId));
                            }
                          }}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <span>Sample {accType} Account ({accId})</span>
                      </label>
                    );
                  })}
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsLinkingModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 min-h-[44px]"
                >
                  Complete Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};

export default SettingsLinkedAccounts;