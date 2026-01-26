import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { ArrowLeft, RotateCcw, ArrowRight, Search, X } from "lucide-react";
import { useState } from "react";

interface StudyNavigationProps {
    backLink: string;
    backLabel: string;
    subtitle: string;
    title: string;
}

interface StudyStatsProps {
    currentIndex: number;
    totalCards: number;
    progress: number;
    progressLabel?: string;
}

interface SearchProps {
    searchQuery: string;
    onSearchChange: (query: string) => void;
    filteredCount: number;
}

interface StudyPageHeaderProps {
    navigation: StudyNavigationProps;
    stats: StudyStatsProps;
    onReset: () => void;
    onGoToCard?: (cardNumber: number) => void;
    search?: SearchProps;
    extraActions?: React.ReactNode;
}

export function StudyPageHeader({
    navigation,
    stats,
    onReset,
    onGoToCard,
    search,
    extraActions,
}: StudyPageHeaderProps) {
    const { backLink, backLabel, subtitle, title } = navigation;
    const { currentIndex, totalCards, progress, progressLabel = "Study session progress" } = stats;
    const [jumpToCard, setJumpToCard] = useState("");

    const isSearchActive = search && search.searchQuery.length > 0;
    const displayCount = isSearchActive ? search.filteredCount : totalCards;
    const displayLabel = isSearchActive ? "Result" : "Card";

    const handleGoToCard = () => {
        const cardNumber = parseInt(jumpToCard, 10);
        if (cardNumber >= 1 && cardNumber <= totalCards && onGoToCard) {
            onGoToCard(cardNumber);
            setJumpToCard("");
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleGoToCard();
        }
    };

    return (
        <div className="mb-8">
            <Link href={backLink}>
                <Button variant="ghost" className="text-white mb-4">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to {backLabel}
                </Button>
            </Link>

            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <p className="text-sm text-purple-400 mb-1">{subtitle}</p>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                        {title}
                    </h1>
                    <div className="flex items-center gap-3 flex-wrap">
                        <p className="text-gray-400">
                            {displayLabel} {currentIndex + 1} of {displayCount}
                        </p>
                        {onGoToCard && totalCards > 1 && (
                            <div className="flex items-center gap-2">
                                <span className="text-gray-500">|</span>
                                <Input
                                    type="number"
                                    min="1"
                                    max={displayCount}
                                    value={jumpToCard}
                                    onChange={(e) => setJumpToCard(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="Go to..."
                                    className="w-24 h-8 bg-slate-800 border-slate-600 text-white placeholder:text-gray-500 text-sm"
                                />
                                <Button
                                    onClick={handleGoToCard}
                                    size="sm"
                                    variant="outline"
                                    className="h-8 px-3 border-slate-600 text-gray-300 hover:text-white hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={!jumpToCard || parseInt(jumpToCard, 10) < 1 || parseInt(jumpToCard, 10) > displayCount}
                                >
                                    <ArrowRight className="w-4 h-4" />
                                </Button>
                            </div>
                        )}
                        {search && (
                            <div className="flex items-center gap-2">
                                <span className="text-gray-500">|</span>
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                    <Input
                                        type="text"
                                        value={search.searchQuery}
                                        onChange={(e) => search.onSearchChange(e.target.value)}
                                        placeholder="Search this domain..."
                                        className="w-48 h-8 pl-8 pr-8 bg-slate-800 border-slate-600 text-white placeholder:text-gray-500 text-sm"
                                    />
                                    {search.searchQuery && (
                                        <button
                                            onClick={() => search.onSearchChange("")}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                                            aria-label="Clear search"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {extraActions}
                    <Button
                        onClick={onReset}
                        variant="outline"
                        className="border-purple-400 text-purple-200 hover:bg-purple-500/10"
                    >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Reset Progress
                    </Button>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-4 bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-white">Progress</span>
                    <span className="text-sm font-bold text-blue-400">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-3" aria-label={progressLabel} />
            </div>
        </div>
    );
}
