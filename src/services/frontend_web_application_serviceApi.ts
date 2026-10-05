// @module: Frontend Web Application.service
// @spec_section_id: implementation_blueprint
// @req_ids: AUTH-01, AUTH-02, AUTH-03, AUTH-04, BNK-01, BNK-02, BNK-03, BNK-04, BUD-01, BUD-02, BUD-03, BUD-04, GOAL-01, GOAL-02, GOAL-03, GOAL-04, HHD-01, HHD-02, HHD-03, HHD-04, REC-01, REC-02, REC-03, REC-04, TXN-01, TXN-02, TXN-03, TXN-04
// @agent: CodeGenerationAgent
// @run_id: run-p4-1790144399
// @version: 1

/**
 * Frontend Web Application API Service
 * Implements full client-side API encapsulation for FinPulse Engine.
 * Handles Authentication, Transactions, Bank Sync, Budgets, Households, Savings Goals, and Recurring Payments.
 */

// Inferred Environment Configuration (Zero hardcoded secrets, fallback to runtime environment)
const API_BASE_URL = typeof process !== 'undefined' && process.env?.REACT_APP_API_BASE_URL 
  ? process.env.REACT_APP_API_BASE_URL 
  : '/api/v1';

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  currencyPreference: string;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  user: UserProfile;
}

export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  date: string;
  category: string;
  accountId: string;
  type: 'income' | 'expense';
  notes?: string;
}

export interface TransactionFilterQuery {
  startDate?: string;
  endDate?: string;
  category?: string;
  type?: 'income' | 'expense';
  minAmount?: number;
  maxAmount?: number;
}

export interface BankInstitution {
  id: string;
  institutionName: string;
  status: 'active' | 'sync_failed' | 'requires_reauth';
  lastSyncedAt: string;
}

export interface Budget {
  id: string;
  userId: string;
  category: string;
  limit: number;
  period: 'weekly' | 'monthly';
  currentSpent: number;
  billingCycle: string;
}

export interface HouseholdMember {
  userId: string;
  email: string;
  role: 'owner' | 'member';
}

export interface Household {
  id: string;
  name: string;
  members: HouseholdMember[];
}

export interface SavingsGoal {
  id: string;
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  completed: boolean;
}

export interface RecurringPayment {
  id: string;
  userId: string;
  name: string;
  amount: number;
  frequency: 'weekly' | 'monthly' | 'yearly';
  nextDueDate: string;
  autoDetected: boolean;
}

export class ApiError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function handleApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = 'An unexpected error occurred';
    try {
      const errorBody = await response.json();
      errorMessage = errorBody.message || errorMessage;
    } catch {
      errorMessage = response.statusText;
    }
    throw new ApiError(response.status, errorMessage);
  }
  if (response.status === 204) {
    return {} as T;
  }
  return response.json() as Promise<T>;
}

export class FrontendWebApplicationApiService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('finpulse_access_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  }

  // --- AUTHENTICATION (AUTH-01, AUTH-02, AUTH-03, AUTH-04) ---

  async registerUser(email: string, password: string, displayName: string, currencyPreference: string): Promise<UserProfile> {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, displayName, currencyPreference })
    });
    return handleApiResponse<UserProfile>(response);
  }

  async loginUser(email: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await handleApiResponse<AuthResponse>(response);
    if (data.accessToken) {
      localStorage.setItem('finpulse_access_token', data.accessToken);
    }
    return data;
  }

  async requestPasswordReset(email: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/auth/password-reset-request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    return handleApiResponse<void>(response);
  }

  async updateProfile(displayName: string, currencyPreference: string): Promise<UserProfile> {
    const response = await fetch(`${API_BASE_URL}/users/profile`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ displayName, currencyPreference })
    });
    return handleApiResponse<UserProfile>(response);
  }

  // --- TRANSACTIONS (TXN-01, TXN-02, TXN-03, TXN-04) ---

  async createTransaction(tx: Omit<Transaction, 'id' | 'userId'>): Promise<Transaction> {
    const response = await fetch(`${API_BASE_URL}/transactions`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(tx)
    });
    return handleApiResponse<Transaction>(response);
  }

  async updateTransaction(id: string, tx: Partial<Transaction>): Promise<Transaction> {
    const response = await fetch(`${API_BASE_URL}/transactions/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(tx)
    });
    return handleApiResponse<Transaction>(response);
  }

  async deleteTransaction(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/transactions/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });
    return handleApiResponse<void>(response);
  }

  async getFilteredTransactions(filter: TransactionFilterQuery): Promise<Transaction[]> {
    const params = new URLSearchParams();
    if (filter.startDate) params.append('startDate', filter.startDate);
    if (filter.endDate) params.append('endDate', filter.endDate);
    if (filter.category) params.append('category', filter.category);
    if (filter.type) params.append('type', filter.type);
    if (filter.minAmount !== undefined) params.append('minAmount', filter.minAmount.toString());
    if (filter.maxAmount !== undefined) params.append('maxAmount', filter.maxAmount.toString());

    const response = await fetch(`${API_BASE_URL}/transactions?${params.toString()}`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });
    return handleApiResponse<Transaction[]>(response);
  }

  // --- BANK INTEGRATION (BNK-01, BNK-02, BNK-03, BNK-04) ---

  async generatePlaidLinkToken(): Promise<{ linkToken: string }> {
    const response = await fetch(`${API_BASE_URL}/bank/plaid/link-token`, {
      method: 'POST',
      headers: this.getAuthHeaders()
    });
    return handleApiResponse<{ linkToken: string }>(response);
  }

  async exchangePlaidPublicToken(publicToken: string, institutionName: string): Promise<BankInstitution> {
    const response = await fetch(`${API_BASE_URL}/bank/plaid/exchange`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ publicToken, institutionName })
    });
    return handleApiResponse<BankInstitution>(response);
  }

  async triggerBankSync(institutionId: string): Promise<{ status: string }> {
    const response = await fetch(`${API_BASE_URL}/bank/sync`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ institutionId })
    });
    return handleApiResponse<{ status: string }>(response);
  }

  async getConnectedInstitutions(): Promise<BankInstitution[]> {
    const response = await fetch(`${API_BASE_URL}/bank/institutions`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });
    return handleApiResponse<BankInstitution[]>(response);
  }

  // --- BUDGETS (BUD-01, BUD-02, BUD-03, BUD-04) ---

  async createBudget(budget: Omit<Budget, 'id' | 'userId' | 'currentSpent'>): Promise<Budget> {
    const response = await fetch(`${API_BASE_URL}/budgets`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(budget)
    });
    return handleApiResponse<Budget>(response);
  }

  async getCurrentBudgets(): Promise<Budget[]> {
    const response = await fetch(`${API_BASE_URL}/budgets`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });
    return handleApiResponse<Budget[]>(response);
  }

  async getHistoricalBudgets(billingCycle: string): Promise<Budget[]> {
    const response = await fetch(`${API_BASE_URL}/budgets/historical?billingCycle=${billingCycle}`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });
    return handleApiResponse<Budget[]>(response);
  }

  // --- HOUSEHOLDS (HHD-01, HHD-02, HHD-03, HHD-04) ---

  async createHousehold(name: string): Promise<Household> {
    const response = await fetch(`${API_BASE_URL}/households`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ name })
    });
    return handleApiResponse<Household>(response);
  }

  async inviteHouseholdMember(householdId: string, email: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/households/${householdId}/invite`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ email })
    });
    return handleApiResponse<void>(response);
  }

  async getHouseholdDetails(householdId: string): Promise<Household> {
    const response = await fetch(`${API_BASE_URL}/households/${householdId}`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });
    return handleApiResponse<Household>(response);
  }

  // --- SAVINGS GOALS (GOAL-01, GOAL-02, GOAL-03, GOAL-04) ---

  async createSavingsGoal(goal: Omit<SavingsGoal, 'id' | 'userId' | 'currentAmount' | 'completed'>): Promise<SavingsGoal> {
    const response = await fetch(`${API_BASE_URL}/goals`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(goal)
    });
    return handleApiResponse<SavingsGoal>(response);
  }

  async allocateSavings(goalId: string, amount: number): Promise<SavingsGoal> {
    const response = await fetch(`${API_BASE_URL}/goals/${goalId}/allocate`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ amount })
    });
    return handleApiResponse<SavingsGoal>(response);
  }

  async getSavingsGoals(): Promise<SavingsGoal[]> {
    const response = await fetch(`${API_BASE_URL}/goals`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });
    return handleApiResponse<SavingsGoal[]>(response);
  }

  // --- RECURRING PAYMENTS (REC-01, REC-02, REC-03, REC-04) ---

  async createRecurringPayment(payment: Omit<RecurringPayment, 'id' | 'userId' | 'autoDetected'>): Promise<RecurringPayment> {
    const response = await fetch(`${API_BASE_URL}/recurring`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(payment)
    });
    return handleApiResponse<RecurringPayment>(response);
  }

  async getRecurringPayments(): Promise<RecurringPayment[]> {
    const response = await fetch(`${API_BASE_URL}/recurring`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });
    return handleApiResponse<RecurringPayment[]>(response);
  }
}

export const frontendWebApplicationApi = new FrontendWebApplicationApiService();