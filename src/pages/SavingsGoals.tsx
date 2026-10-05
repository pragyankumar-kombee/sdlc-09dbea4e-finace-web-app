// @module: Frontend Web Application.component.SavingsGoals
// @spec_section_id: implementation_blueprint
// @req_ids: GOAL-01, GOAL-02, GOAL-03, GOAL-04
// @agent: CodeGenerationAgent
// @run_id: run-p4-1790144399
// @version: 1

import React, { useState, useEffect, useCallback, useId } from 'react';

// Sibling service contract (mocked/referenced as per implementation layer directive)
export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  category: string;
  autoAllocate: boolean;
}

export interface CreateSavingsGoalPayload {
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  category: string;
  autoAllocate: boolean;
}

// Inferred sibling API client contract matching specifications for GOAL-01 through GOAL-04
export interface SavingsGoalsApi {
  getGoals(): Promise<SavingsGoal[]>;
  createGoal(payload: CreateSavingsGoalPayload): Promise<SavingsGoal>;
  contributeToGoal(goalId: string, amount: number): Promise<SavingsGoal>;
  deleteGoal(goalId: string): Promise<void>;
}

// Mock implementation of sibling service since we only build the component layer
const defaultApi: SavingsGoalsApi = {
  async getGoals() {
    return [
      {
        id: 'goal-1',
        name: 'Emergency Fund',
        targetAmount: 10000,
        currentAmount: 8500,
        targetDate: '2026-12-31',
        category: 'Safety',
        autoAllocate: true,
      },
      {
        id: 'goal-2',
        name: 'New Vehicle',
        targetAmount: 25000,
        currentAmount: 12000,
        targetDate: '2027-06-30',
        category: 'Transport',
        autoAllocate: false,
      },
    ];
  },
  async createGoal(payload: CreateSavingsGoalPayload) {
    return {
      id: `goal-${Date.now()}`,
      ...payload,
    };
  },
  async contributeToGoal(goalId: string, amount: number) {
    return {
      id: goalId,
      name: 'Emergency Fund',
      targetAmount: 10000,
      currentAmount: 8500 + amount,
      targetDate: '2026-12-31',
      category: 'Safety',
      autoAllocate: true,
    };
  },
  async deleteGoal(_goalId: string) {
    return;
  },
};

interface SavingsGoalsProps {
  api?: SavingsGoalsApi;
}

export const SavingsGoals: React.FC<SavingsGoalsProps> = ({ api = defaultApi }) => {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [uiState, setUiState] = useState<'loading' | 'empty' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [contributionAmount, setContributionAmount] = useState<string>('');

  // Form state for creating a new goal (ACT-17)
  const [newGoalName, setNewGoalName] = useState<string>('');
  const [newGoalTarget, setNewGoalTarget] = useState<string>('');
  const [newGoalCurrent, setNewGoalCurrent] = useState<string>('');
  const [newGoalDate, setNewGoalDate] = useState<string>('');
  const [newGoalCategory, setNewGoalCategory] = useState<string>('');
  const [newGoalAuto, setNewGoalAuto] = useState<boolean>(false);

  const nameId = useId();
  const targetId = useId();
  const currentId = useId();
  const dateId = useId();
  const categoryId = useId();
  const autoId = useId();
  const contributeId = useId();

  const fetchGoals = useCallback(async () => {
    setUiState('loading');
    setErrorMessage('');
    try {
      const data = await api.getGoals();
      setGoals(data);
      if (data.length === 0) {
        setUiState('empty');
      } else {
        setUiState('success');
      }
    } catch (err: unknown) {
      setUiState('error');
      setErrorMessage(err instanceof Error ? err.message : 'Failed to load savings goals');
    }
  }, [api]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const handleCreateGoalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const target = parseFloat(newGoalTarget);
      const current = parseFloat(newGoalCurrent || '0');
      if (isNaN(target) || target <= 0) {
        throw new Error('Please enter a valid target amount.');
      }

      await api.createGoal({
        name: newGoalName,
        targetAmount: target,
        currentAmount: isNaN(current) ? 0 : current,
        targetDate: newGoalDate || new Date().toISOString().split('T')[0],
        category: newGoalCategory || 'General',
        autoAllocate: newGoalAuto,
      });

      setIsModalOpen(false);
      setNewGoalName('');
      setNewGoalTarget('');
      setNewGoalCurrent('');
      setNewGoalDate('');
      setNewGoalCategory('');
      setNewGoalAuto(false);
      await fetchGoals();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to create goal');
    }
  };

  const handleContributeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoalId) return;
    try {
      const amount = parseFloat(contributionAmount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Please enter a valid contribution amount.');
      }
      await api.contributeToGoal(selectedGoalId, amount);
      setSelectedGoalId(null);
      setContributionAmount('');
      await fetchGoals();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to contribute to goal');
    }
  };

  return (
    <main role="main" className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Savings Goals</h1>
            <p className="text-slate-400 mt-1">
              Track active savings targets, automated fund allocations, and financial progress velocity.
            </p>
          </div>
          <div>
            {/* CMP-02 (Button) for ACT-17 Create Goal */}
            <button
              type="button"
              role="button"
              onClick={() => setIsModalOpen(true)}
              className="min-h-[44px] min-w-[44px] px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg shadow transition focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              Create Goal
            </button>
          </div>
        </header>

        <section aria-label="Active Goals Section" className="space-y-6">
          <h2 className="text-xl font-semibold text-slate-200 border-b border-slate-800 pb-3">Active Goals</h2>

          {uiState === 'loading' && (
            <div className="flex justify-center items-center py-20" aria-live="polite">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
            </div>
          )}

          {uiState === 'error' && (
            <div
              role="alert"
              aria-live="assertive"
              className="bg-rose-950/50 border border-rose-800 text-rose-200 p-4 rounded-lg flex items-center justify-between"
            >
              <span>{errorMessage || 'An error occurred while loading savings goals.'}</span>
              <button
                onClick={fetchGoals}
                className="underline text-sm hover:text-white min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                Retry
              </button>
            </div>
          )}

          {uiState === 'empty' && (
            <div className="text-center py-20 bg-slate-800/40 rounded-xl border border-slate-800">
              <p className="text-slate-400 text-lg">No savings goals found.</p>
              <p className="text-slate-500 text-sm mt-1">Get started by creating your first savings objective.</p>
            </div>
          )}

          {uiState === 'success' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {goals.map((goal) => {
                const progressPercentage = Math.min(
                  Math.round((goal.currentAmount / goal.targetAmount) * 100),
                  100
                );
                // BUD-03 style visual warnings for goal progress (80% and 100% consumption thresholds adapted for savings milestones)
                let progressBarColor = 'bg-emerald-500';
                if (progressPercentage >= 100) {
                  progressBarColor = 'bg-blue-500';
                } else if (progressPercentage >= 80) {
                  progressBarColor = 'bg-amber-500';
                }

                return (
                  /* CMP-22 (GoalCard) */
                  <article
                    key={goal.id}
                    role="article"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        setSelectedGoalId(goal.id);
                      }
                    }}
                    onClick={() => setSelectedGoalId(goal.id)}
                    className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-5 shadow-md hover:border-emerald-500/50 transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-400 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="text-lg font-bold text-white">{goal.name}</h3>
                        <span className="text-xs px-2.5 py-1 bg-slate-700 text-slate-300 rounded-full font-medium">
                          {goal.category}
                        </span>
                      </div>
                      <div className="flex justify-between items-baseline mb-2">
                        <span className="text-2xl font-extrabold text-white">
                          ${goal.currentAmount.toLocaleString()}
                        </span>
                        <span className="text-sm text-slate-400">
                          Target: ${goal.targetAmount.toLocaleString()}
                        </span>
                      </div>

                      {/* Progress Bar with GOAL-03 thresholds */}
                      <div className="w-full bg-slate-700 h-3 rounded-full overflow-hidden mb-3">
                        <div
                          className={`h-full transition-all duration-500 ${progressBarColor}`}
                          style={{ width: `${progressPercentage}%` }}
                        ></div>
                      </div>

                      <div className="flex justify-between text-xs text-slate-400">
                        <span>{progressPercentage}% Complete</span>
                        <span>Target Date: {goal.targetDate}</span>
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-700/50 flex items-center justify-between">
                      <span className="text-xs text-slate-400">
                        {goal.autoAllocate ? 'Auto-allocate Active' : 'Manual Allocation'}
                      </span>
                      {/* CMP-02 Button for quick contribution */}
                      <button
                        type="button"
                        role="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedGoalId(goal.id);
                        }}
                        className="min-h-[44px] min-w-[44px] px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-emerald-400 text-xs font-semibold rounded-md transition"
                      >
                        Contribute
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* Modal for Creating Goal (ACT-17 / GOAL-01 / GOAL-02) */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white">Create New Savings Goal</h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-white min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateGoalSubmit} className="space-y-4">
                <div>
                  <label htmlFor={nameId} className="block text-sm font-medium text-slate-300 mb-1">
                    Goal Name
                  </label>
                  <input
                    id={nameId}
                    type="text"
                    required
                    value={newGoalName}
                    onChange={(e) => setNewGoalName(e.target.value)}
                    placeholder="e.g., House Down Payment"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor={targetId} className="block text-sm font-medium text-slate-300 mb-1">
                      Target Amount ($)
                    </label>
                    <input
                      id={targetId}
                      type="number"
                      step="0.01"
                      required
                      value={newGoalTarget}
                      onChange={(e) => setNewGoalTarget(e.target.value)}
                      placeholder="10000"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label htmlFor={currentId} className="block text-sm font-medium text-slate-300 mb-1">
                      Initial Saved ($)
                    </label>
                    <input
                      id={currentId}
                      type="number"
                      step="0.01"
                      value={newGoalCurrent}
                      onChange={(e) => setNewGoalCurrent(e.target.value)}
                      placeholder="0"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor={dateId} className="block text-sm font-medium text-slate-300 mb-1">
                      Target Date
                    </label>
                    <input
                      id={dateId}
                      type="date"
                      required
                      value={newGoalDate}
                      onChange={(e) => setNewGoalDate(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label htmlFor={categoryId} className="block text-sm font-medium text-slate-300 mb-1">
                      Category
                    </label>
                    <input
                      id={categoryId}
                      type="text"
                      value={newGoalCategory}
                      onChange={(e) => setNewGoalCategory(e.target.value)}
                      placeholder="General"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    id={autoId}
                    type="checkbox"
                    checked={newGoalAuto}
                    onChange={(e) => setNewGoalAuto(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-emerald-600 focus:ring-emerald-500"
                  />
                  <label htmlFor={autoId} className="text-sm text-slate-300">
                    Enable automated fund allocation from recurring inflows
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="min-h-[44px] px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium rounded-lg transition"
                  >
                    Cancel
                  </button>
                  {/* CMP-02 (Button) for ACT-18 save_goal_button */}
                  <button
                    type="submit"
                    role="button"
                    className="min-h-[44px] px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg shadow transition"
                  >
                    save_goal_button
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal for Contributing Funds to Goal */}
        {selectedGoalId && !isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white">Contribute to Savings Goal</h3>
                <button
                  onClick={() => setSelectedGoalId(null)}
                  className="text-slate-400 hover:text-white min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleContributeSubmit} className="space-y-4">
                <div>
                  <label htmlFor={contributeId} className="block text-sm font-medium text-slate-300 mb-1">
                    Contribution Amount ($)
                  </label>
                  <input
                    id={contributeId}
                    type="number"
                    step="0.01"
                    required
                    value={contributionAmount}
                    onChange={(e) => setContributionAmount(e.target.value)}
                    placeholder="100.00"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
                  <button
                    type="button"
                    onClick={() => setSelectedGoalId(null)}
                    className="min-h-[44px] px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium rounded-lg transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    role="button"
                    className="min-h-[44px] px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg shadow transition"
                  >
                    Add Contribution
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

export default SavingsGoals;