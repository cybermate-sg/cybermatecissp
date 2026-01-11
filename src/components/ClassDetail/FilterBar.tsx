"use client";

export type DeckFilter = "all" | "not-started" | "in-progress" | "mastered" | "quiz";

interface FilterBarProps {
  activeFilter: DeckFilter;
  onFilterChange: (filter: DeckFilter) => void;
  counts: {
    all: number;
    notStarted: number;
    inProgress: number;
    mastered: number;
    quiz: number;
  };
}

// Helper: Get button className based on active state
function getButtonClassName(isActive: boolean): string {
  const baseClasses = "px-4 py-2 rounded-lg font-medium text-sm transition-all";
  const activeClasses = "bg-blue-600 text-white shadow-md";
  const inactiveClasses = "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50";

  return `${baseClasses} ${isActive ? activeClasses : inactiveClasses}`;
}

// Helper: Get count badge className based on active state
function getCountClassName(isActive: boolean): string {
  return `ml-2 ${isActive ? "text-blue-200" : "text-gray-500"}`;
}

export function FilterBar({ activeFilter, onFilterChange, counts }: FilterBarProps) {
  const filters: { id: DeckFilter; label: string; count: number }[] = [
    { id: "all", label: "All", count: counts.all },
    { id: "not-started", label: "Not Started", count: counts.notStarted },
    { id: "in-progress", label: "In Progress", count: counts.inProgress },
    { id: "mastered", label: "Completed", count: counts.mastered },
    { id: "quiz", label: "Quiz Decks", count: counts.quiz },
  ];

  return (
    <div className="mb-6 flex flex-wrap gap-2">
      {filters.map((filter) => {
        const isActive = activeFilter === filter.id;

        return (
          <button
            key={filter.id}
            onClick={() => onFilterChange(filter.id)}
            className={getButtonClassName(isActive)}
          >
            {filter.label}
            <span className={getCountClassName(isActive)}>
              ({filter.count})
            </span>
          </button>
        );
      })}
    </div>
  );
}
