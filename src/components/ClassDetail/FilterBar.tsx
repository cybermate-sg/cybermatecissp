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

export function FilterBar({ activeFilter, onFilterChange, counts }: FilterBarProps) {
  const filters: { id: DeckFilter; label: string; count: number }[] = [
    { id: "all", label: "All", count: counts.all },
    { id: "not-started", label: "Not Started", count: counts.notStarted },
    { id: "in-progress", label: "In Progress", count: counts.inProgress },
    { id: "mastered", label: "Mastered", count: counts.mastered },
    { id: "quiz", label: "Quiz Decks", count: counts.quiz },
  ];

  return (
    <div className="mb-6 flex flex-wrap gap-2">
      {filters.map((filter) => (
        <button
          key={filter.id}
          onClick={() => onFilterChange(filter.id)}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
            activeFilter === filter.id
              ? "bg-blue-600 text-white shadow-md"
              : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
          }`}
        >
          {filter.label}
          <span className={`ml-2 ${
            activeFilter === filter.id ? "text-blue-200" : "text-gray-500"
          }`}>
            ({filter.count})
          </span>
        </button>
      ))}
    </div>
  );
}
