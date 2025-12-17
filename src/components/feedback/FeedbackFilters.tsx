import type { FeedbackFilters } from "./types";

interface FeedbackFiltersProps {
  filters: FeedbackFilters;
  onFilterChange: (key: keyof FeedbackFilters, value: string) => void;
}

export default function FeedbackFiltersComponent({ filters, onFilterChange }: FeedbackFiltersProps) {
  return (
    <div className="flex flex-wrap gap-4">
      {/* Status Filter */}
      <div>
        <label htmlFor="statusFilter" className="block text-sm font-medium text-slate-300 mb-2">
          Status
        </label>
        <select
          id="statusFilter"
          value={filters.status || "all"}
          onChange={(e) => onFilterChange("status", e.target.value)}
          className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="in_review">In Review</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Type Filter */}
      <div>
        <label htmlFor="typeFilter" className="block text-sm font-medium text-slate-300 mb-2">
          Type
        </label>
        <select
          id="typeFilter"
          value={filters.type || "all"}
          onChange={(e) => onFilterChange("type", e.target.value)}
          className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Types</option>
          <option value="content_error">Content Error</option>
          <option value="typo">Typo</option>
          <option value="unclear_explanation">Unclear Explanation</option>
          <option value="technical_issue">Technical Issue</option>
          <option value="general_suggestion">General Suggestion</option>
        </select>
      </div>

      {/* Priority Filter */}
      <div>
        <label htmlFor="priorityFilter" className="block text-sm font-medium text-slate-300 mb-2">
          Priority
        </label>
        <select
          id="priorityFilter"
          value={filters.priority || "all"}
          onChange={(e) => onFilterChange("priority", e.target.value)}
          className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
      </div>
    </div>
  );
}
