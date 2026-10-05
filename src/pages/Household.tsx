// @module: Frontend Web Application.component.Household
// @spec_section_id: implementation_blueprint
// @req_ids: HHD-01, HHD-02, HHD-03, HHD-04
// @agent: CodeGenerationAgent
// @run_id: run-p4-1790144399
// @version: 1

import React, { useState, useEffect, KeyboardEvent, ChangeEvent, FormEvent } from 'react';

/**
 * Interface definitions matching FinPulse Engine Household Management domain structures.
 */
export interface HouseholdMember {
  id: string;
  email: string;
  displayName: string;
  role: 'admin' | 'member';
  contributionAmount: number;
}

export interface SharedAccount {
  id: string;
  accountName: string;
  institutionName: string;
  balance: number;
}

export interface HouseholdData {
  id: string;
  name: string;
  members: HouseholdMember[];
  sharedAccounts: SharedAccount[];
  consolidatedBudgetLimit: number;
  consolidatedSpent: number;
}

/**
 * Props for HouseholdSummaryCard (CMP-19)
 */
export interface HouseholdSummaryCardProps {
  household: HouseholdData | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}

/**
 * Props for MemberListTable (CMP-20)
 */
export interface MemberListTableProps {
  members: HouseholdMember[];
  onRemoveMember: (memberId: string) => Promise<void>;
  actionLoadingId: string | null;
  errorAnnounce: string | null;
}

/**
 * Props for the main Household Dashboard Component
 */
export interface HouseholdDashboardProps {
  initialHousehold?: HouseholdData | null;
}

/**
 * CMP-19: HouseholdSummaryCard Component
 * Displays shared accounts, consolidated summaries, and household budget metrics.
 */
export const HouseholdSummaryCard: React.FC<HouseholdSummaryCardProps> = ({
  household,
  loading,
  error,
  onRefresh,
}) => {
  if (loading) {
    return (
      <section role="region" aria-label="Household Summary Loading" className="p-6 bg-white rounded-lg shadow animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section role="region" aria-label="Household Summary Error" className="p-6 bg-red-50 border border-red-200 rounded-lg text-red-700">
        <p className="font-semibold">Failed to load household summary.</p>
        <p className="text-sm">{error}</p>
        <button
          onClick={onRefresh}
          className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </section>
    );
  }

  if (!household) {
    return (
      <section role="region" aria-label="Household Summary Empty" className="p-6 bg-gray-50 border border-dashed border-gray-300 rounded-lg text-center">
        <p className="text-gray-600">No household group found. Create one below to get started.</p>
      </section>
    );
  }

  const spendingPercentage = household.consolidatedBudgetLimit > 0
    ? Math.min(Math.round((household.consolidatedSpent / household.consolidatedBudgetLimit) * 100), 100)
    : 0;

  let progressColor = 'bg-green-500';
  if (spendingPercentage >= 100) {
    progressColor = 'bg-red-600';
  } else if (spendingPercentage >= 80) {
    progressColor = 'bg-yellow-500';
  }

  return (
    <section role="region" aria-label="Household Summary and Budgets" className="p-6 bg-white rounded-lg shadow space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{household.name}</h2>
          <p className="text-sm text-gray-500">Shared Financial Overview</p>
        </div>
        <button
          onClick={onRefresh}
          className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors min-h-[44px] min-w-[44px]"
        >
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-500">Consolidated Budget Limit</h3>
          <p className="text-2xl font-bold text-gray-900">${household.consolidatedBudgetLimit.toLocaleString()}</p>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-500">Total Spent</h3>
          <p className="text-2xl font-bold text-gray-900">${household.consolidatedSpent.toLocaleString()}</p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm font-medium">
          <span className="text-gray-700">Budget Progress</span>
          <span className="text-gray-900">{spendingPercentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${progressColor}`}
            style={{ width: `${spendingPercentage}%` }}
            role="progressbar"
            aria-valuenow={spendingPercentage}
            aria-valuemin={0}
            aria-valuemax={100}
          ></div>
        </div>
      </div>

      <div>
        <h3 className="text-md font-semibold text-gray-800 mb-3">Shared Accounts</h3>
        {household.sharedAccounts.length === 0 ? (
          <p className="text-sm text-gray-500">No shared accounts linked.</p>
        ) : (
          <div className="space-y-2">
            {household.sharedAccounts.map((account) => (
              <div key={account.id} className="flex justify-between items-center p-3 border border-gray-100 rounded-md bg-gray-50/50">
                <div>
                  <p className="font-medium text-gray-800">{account.accountName}</p>
                  <p className="text-xs text-gray-500">{account.institutionName}</p>
                </div>
                <span className="font-semibold text-gray-900">${account.balance.toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

/**
 * CMP-20: MemberListTable Component
 * Displays household members and allows keyboard navigation and member removal.
 */
export const MemberListTable: React.FC<MemberListTableProps> = ({
  members,
  onRemoveMember,
  actionLoadingId,
  errorAnnounce,
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  const handleKeyDown = (e: KeyboardEvent<HTMLTableElement>) => {
    if (members.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % members.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + members.length) % members.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const targetMember = members[selectedIndex];
      if (targetMember && targetMember.role !== 'admin') {
        onRemoveMember(targetMember.id);
      }
    }
  };

  return (
    <div className="space-y-2">
      <div
        aria-live="polite"
        className="sr-only"
      >
        {errorAnnounce || ''}
      </div>

      <div className="overflow-x-auto border border-gray-200 rounded-lg bg-white shadow">
        <table
          role="grid"
          aria-label="Household Member Contributions"
          tabIndex={0}
          onKeyDown={handleKeyDown}
          className="w-full text-left border-collapse"
        >
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
              <th scope="col" className="p-4">Name & Email</th>
              <th scope="col" className="p-4">Role</th>
              <th scope="col" className="p-4">Contribution</th>
              <th scope="col" className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 text-sm">
            {members.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-6 text-center text-gray-500">
                  No members in this household.
                </td>
              </tr>
            ) : (
              members.map((member, index) => {
                const isSelected = selectedIndex === index;
                const isLoading = actionLoadingId === member.id;

                return (
                  <tr
                    key={member.id}
                    className={`transition-colors ${isSelected ? 'bg-blue-50/70' : 'hover:bg-gray-50'}`}
                  >
                    <td className="p-4">
                      <div className="font-medium text-gray-900">{member.displayName}</div>
                      <div className="text-xs text-gray-500">{member.email}</div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${member.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>
                        {member.role}
                      </span>
                    </td>
                    <td className="p-4 font-semibold text-gray-900">
                      ${member.contributionAmount.toLocaleString()}
                    </td>
                    <td className="p-4 text-right">
                      {member.role !== 'admin' && (
                        <button
                          onClick={() => onRemoveMember(member.id)}
                          disabled={isLoading}
                          className="px-3 py-1.5 text-xs bg-red-50 text-red-600 hover:bg-red-100 rounded transition-colors disabled:opacity-50 min-h-[44px] min-w-[44px]"
                          aria-label={`Remove ${member.displayName}`}
                        >
                          {isLoading ? 'Removing...' : 'Remove Member'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-500 px-1">
        Tip: Use Arrow Up/Down to navigate rows, and Enter to trigger member removal.
      </p>
    </div>
  );
};

/**
 * Main Household Management Dashboard Component (SCR-10)
 * Implements HHD-01, HHD-02, HHD-03, HHD-04 requirements.
 */
export const HouseholdDashboard: React.FC<HouseholdDashboardProps> = ({ initialHousehold = null }) => {
  const [household, setHousehold] = useState<HouseholdData | null>(initialHousehold);
  const [loading, setLoading] = useState<boolean>(!initialHousehold);
  const [error, setError] = useState<string | null>(null);

  // Form states for Create Household (ACT-13) and Invite Member (ACT-15)
  const [newHouseholdName, setNewHouseholdName] = useState<string>('');
  const [inviteEmail, setInviteEmail] = useState<string>('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [errorAnnounce, setErrorAnnounce] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Simulate initial fetch if not provided
  useEffect(() => {
    if (!initialHousehold) {
      const timer = setTimeout(() => {
        setHousehold({
          id: 'hhd-uuid-001',
          name: 'FinPulse Family Household',
          members: [
            { id: 'usr-1', email: 'owner@finpulse.example', displayName: 'Jane Doe', role: 'admin', contributionAmount: 3500 },
            { id: 'usr-2', email: 'partner@finpulse.example', displayName: 'John Doe', role: 'member', contributionAmount: 2800 },
          ],
          sharedAccounts: [
            { id: 'acc-1', accountName: 'Joint Checking', institutionName: 'Chase Bank', balance: 4250.80 },
            { id: 'acc-2', accountName: 'Shared Savings', institutionName: 'Ally Bank', balance: 12500.00 },
          ],
          consolidatedBudgetLimit: 7000,
          consolidatedSpent: 5900,
        });
        setLoading(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [initialHousehold]);

  const handleCreateHousehold = async (e: FormEvent) => {
    e.preventDefault();
    if (!newHouseholdName.trim()) return;

    setLoading(true);
    setError(null);
    try {
      // In production, this would call the API service client
      await new Promise((resolve) => setTimeout(resolve, 600));
      setHousehold({
        id: `hhd-${Date.now()}`,
        name: newHouseholdName,
        members: [
          { id: 'usr-current', email: 'user@finpulse.example', displayName: 'Primary User', role: 'admin', contributionAmount: 0 },
        ],
        sharedAccounts: [],
        consolidatedBudgetLimit: 5000,
        consolidatedSpent: 0,
      });
      setNewHouseholdName('');
      setSuccessMessage('Household created successfully.');
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvite = async (e: FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !household) return;

    setActionLoadingId('invite');
    setErrorAnnounce(null);
    try {
      // Simulating backend API call for invite
      await new Promise((resolve) => setTimeout(resolve, 600));
      setSuccessMessage(`Invitation successfully sent to ${inviteEmail}`);
      setInviteEmail('');
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Failed to send invite';
      setErrorAnnounce(errMsg);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!household) return;

    setActionLoadingId(memberId);
    setErrorAnnounce(null);
    try {
      // Simulating backend API call for member removal
      await new Promise((resolve) => setTimeout(resolve, 500));
      setHousehold({
        ...household,
        members: household.members.filter((m) => m.id !== memberId),
      });
      setSuccessMessage('Member successfully removed from household.');
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Failed to remove member';
      setErrorAnnounce(errMsg);
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <main role="main" className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 bg-gray-50 min-h-screen">
      {/* Header Section */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-3xl font-extrabold text-gray-900">Household Dashboard</h1>
        <p className="text-sm text-gray-600 mt-1">
          View shared accounts, shared budgets, member contributions, and manage household groups.
        </p>
      </div>

      {successMessage && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg flex justify-between items-center">
          <span>{successMessage}</span>
          <button onClick={() => setSuccessMessage(null)} className="text-green-700 font-bold px-2">×</button>
        </div>
      )}

      {/* Responsive Layout Rules: Mobile single column, Tablet two-column grid, Desktop three-column dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Column 1: Household Summary Card & Creation */}
        <div className="space-y-6 lg:col-span-1">
          <HouseholdSummaryCard
            household={household}
            loading={loading}
            error={error}
            onRefresh={() => setLoading(false)}
          />

          {!household && (
            <div className="p-6 bg-white rounded-lg shadow space-y-4">
              <h2 className="text-lg font-bold text-gray-900">Create Household</h2>
              <form onSubmit={handleCreateHousehold} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Household Name</label>
                  <input
                    type="text"
                    value={newHouseholdName}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setNewHouseholdName(e.target.value)}
                    placeholder="e.g. Smith Family Budget"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md shadow transition-colors min-h-[44px]"
                >
                  {loading ? 'Creating...' : 'Create Household'}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Column 2 & 3: Member Management & Shared Accounts / Invitations */}
        <div className="space-y-6 md:col-span-1 lg:col-span-2">
          {household && (
            <>
              <div className="p-6 bg-white rounded-lg shadow space-y-4">
                <h2 className="text-xl font-bold text-gray-900">Member Contributions</h2>
                <MemberListTable
                  members={household.members}
                  onRemoveMember={handleRemoveMember}
                  actionLoadingId={actionLoadingId}
                  errorAnnounce={errorAnnounce}
                />
              </div>

              <div className="p-6 bg-white rounded-lg shadow space-y-4">
                <h2 className="text-xl font-bold text-gray-900">Invite New Member</h2>
                <form onSubmit={handleSendInvite} className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setInviteEmail(e.target.value)}
                    placeholder="member@example.com"
                    required
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                  <button
                    type="submit"
                    disabled={actionLoadingId === 'invite'}
                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-md shadow transition-colors min-h-[44px] min-w-[44px]"
                  >
                    {actionLoadingId === 'invite' ? 'Sending...' : 'Send Invite'}
                  </button>
                </form>
              </div>
            </>
          )}
        </div>

      </div>
    </main>
  );
};

export default HouseholdDashboard;