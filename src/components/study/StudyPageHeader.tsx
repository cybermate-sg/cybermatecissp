import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, RotateCcw } from "lucide-react";

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

interface StudyPageHeaderProps {
    navigation: StudyNavigationProps;
    stats: StudyStatsProps;
    onReset: () => void;
    extraActions?: React.ReactNode;
}

export function StudyPageHeader({
    navigation,
    stats,
    onReset,
    extraActions,
}: StudyPageHeaderProps) {
    const { backLink, backLabel, subtitle, title } = navigation;
    const { currentIndex, totalCards, progress, progressLabel = "Study session progress" } = stats;
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
                    <p className="text-gray-400">
                        Card {currentIndex + 1} of {totalCards}
                    </p>
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
            <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400">Progress</span>
                    <span className="text-sm text-gray-400">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" aria-label={progressLabel} />
            </div>
        </div>
    );
}
