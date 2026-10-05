// @module: Frontend Web Application.component.Transactions
// @spec_section_id: implementation_blueprint
// @req_ids: TXN-03
// @agent: CodeGenerationAgent
// @run_id: run-p4-1790144399
// @version: 1

import React, { useState, useEffect, useMemo, useCallback } from "react";

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  type: "income" | "expense";
  account: string;
  notes?: string;
}

export interface FilterSortState {
  searchTerm: string;
  startDate: string;
  endDate: string;
  category: string;
  type: "all" | "income" | "expense";
  sortBy: "date" | "amount" | "category";
  sortOrder: "asc" | "desc";
}

interface TransactionsComponentProps {
  initialTransactions?: Transaction[];
  onAddTransaction?: () => void;
  onEditTransaction?: (transaction: Transaction) => void;
}

export const TransactionsComponent: React.FC<TransactionsComponentProps> = ({
  initialTransactions = [],
  onAddTransaction,
  onEditTransaction,
}) => {
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Filter & Sort state satisfying TXN-03
  const [filters, setFilters] = useState<FilterSortState>({
    searchTerm: "",
    startDate: "",
    endDate: "",
    category: "all",
    type: "all",
    sortBy: "date",
    sortOrder: "desc",
  });

  const [announcement, setAnnouncement] = useState<string>("");

  useEffect(() => {
    // Simulate initial data load if none provided
    if (initialTransactions.length === 0) {
      setLoading(true);
      const timer = setTimeout(() => {
        setTransactions([
          {
            id: "txn-1",
            date: "2023-10-01",
            description: "Grocery Store",
            amount: 154.20,
            category: "Food",
            type: "expense",
            account: "Checking",
            notes: "Weekly groceries",
          },
          {
            id: "txn-2",
            date: "2023-10-02",
            description: "Monthly Salary",
            amount: 4500.00,
            category: "Salary",
            type: "income",
            account: "Checking",
            notes: "October payroll",
          },
          {
            id: "txn-3",
            date: "2023-10-05",
            description: "Electric Bill",
            amount: 85.50,
            category: "Utilities",
            type: "expense",
            account: "Credit Card",
          },
        ]);
        setLoading(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [initialTransactions]);

  const handleFilterChange = <K extends keyof FilterSortState>(key: K, value: FilterSortState[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setAnnouncement(`Filter updated: ${String(key)} set to ${String(value)}`);
  };

  const filteredAndSortedTransactions = useMemo(() => {
    try {
      let result = [...transactions];

      // Type filter
      if (filters.type !== "all") {
        result = result.filter((t) => t.type === filters.type);
      }

      // Category filter
      if (filters.category !== "all") {
        result = result.filter((t) => t.category.toLowerCase() === filters.category.toLowerCase());
      }

      // Date range filter
      if (filters.startDate) {
        result = result.filter((t) => t.date >= filters.startDate);
      }
      if (filters.endDate) {
        result = result.filter((t) => t.date <= filters.endDate);
      }

      // Search term filter
      if (filters.searchTerm.trim() !== "") {
        const term = filters.searchTerm.toLowerCase();
        result = result.filter(
          (t) =>
            t.description.toLowerCase().includes(term) ||
            t.category.toLowerCase().includes(term) ||
            t.account.toLowerCase().includes(term)
        );
      }

      // Sorting
      result.sort((a, b) => {
        let comparison = 0;
        if (filters.sortBy === "date") {
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
        } else if (filters.sortBy === "amount") {
          comparison = a.amount - b.amount;
        } else if (filters.sortBy === "category") {
          comparison = a.category.localeCompare(b.category);
        }
        return filters.sortOrder === "asc" ? comparison : -comparison;
      });

      return result;
    } catch (err) {
      setError("Failed to process transaction filters and sorting.");
      setAnnouncement("Error applying filters to transaction list.");
      return [];
    }
  }, [transactions, filters]);

  const categories = useMemo(() => {
    const set = new Set(transactions.map((t) => t.category));
    return Array.from(set);
  }, [transactions]);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Live region for accessibility announcements */}
      <div className="sr-only" aria-live="polite">
        {announcement}
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Transactions</h1>
          <p className="mt-1 text-sm text-gray-500">
            View the paginated transaction ledger and apply filters and sorting capabilities.
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <button
            type="button"
            onClick={onAddTransaction}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 min-h-[44px]"
            aria-label="Add Transaction"
          >
            Add Transaction
          </button>
        </div>
      </div>

      {/* CMP-05: FilterSortToolbar */}
      <section
        role="region"
        aria-labelledby="filter-heading"
        className="bg-white shadow rounded-lg p-4 sm:p-6 mb-6"
      >
        <h2 id="filter-heading" className="text-lg font-medium text-gray-900 mb-4">
          Filter and Sort Options
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700">
              Search
            </label>
            <input
              type="text"
              id="search"
              value={filters.searchTerm}
              onChange={(e) => handleFilterChange("searchTerm", e.target.value)}
              placeholder="Search description..."
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2 min-h-[44px]"
            />
          </div>

          <div>
            <label htmlFor="type-filter" className="block text-sm font-medium text-gray-700">
              Type
            </label>
            <select
              id="type-filter"
              value={filters.type}
              onChange={(e) => handleFilterChange("type", e.target.value as FilterSortState["type"])}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2 min-h-[44px]"
            >
              <option value="all">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </div>

          <div>
            <label htmlFor="category-filter" className="block text-sm font-medium text-gray-700">
              Category
            </label>
            <select
              id="category-filter"
              value={filters.category}
              onChange={(e) => handleFilterChange("category", e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2 min-h-[44px]"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="sort-by" className="block text-sm font-medium text-gray-700">
              Sort By
            </label>
            <div className="flex space-x-2 mt-1">
              <select
                id="sort-by"
                value={filters.sortBy}
                onChange={(e) => handleFilterChange("sortBy", e.target.value as FilterSortState["sortBy"])}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2 min-h-[44px]"
              >
                <option value="date">Date</option>
                <option value="amount">Amount</option>
                <option value="category">Category</option>
              </select>
              <select
                aria-label="Sort Order"
                value={filters.sortOrder}
                onChange={(e) => handleFilterChange("sortOrder", e.target.value as FilterSortState["sortOrder"])}
                className="block w-28 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2 min-h-[44px]"
              >
                <option value="desc">Desc</option>
                <option value="asc">Asc</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* CMP-06: TransactionTable */}
      <section className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Transaction List</h3>
        </div>

        {error && (
          <div role="alert" className="p-4 bg-red-50 text-red-700 text-sm border-b border-red-200">
            {error}
          </div>
        )}

        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading transactions...</div>
        ) : filteredAndSortedTransactions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No transactions found matching your criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table role="table" className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Account
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAndSortedTransactions.map((tx) => (
                  <tr
                    key={tx.id}
                    tabIndex={0}
                    onClick={() => onEditTransaction && onEditTransaction(tx)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && onEditTransaction) {
                        onEditTransaction(tx);
                      }
                    }}
                    className="hover:bg-gray-50 focus:bg-gray-100 focus:outline-none cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{tx.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {tx.description}
                      {tx.notes && <span className="block text-xs text-gray-400 font-normal">{tx.notes}</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                        {tx.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tx.account}</td>
                    <td
                      className={`px-6 py-4 whitespace-nowrap text-sm text-right font-semibold ${
                        tx.type === "income" ? "text-green-600" : "text-gray-900"
                      }`}
                    >
                      {tx.type === "income" ? "+" : "-"}${tx.amount.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
};

export default TransactionsComponent;