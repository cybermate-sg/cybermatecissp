'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { RotateCcw, Home } from "lucide-react";
import Link from "next/link";

interface CelebrationActionsProps {
    onRestart?: () => void;
    backLink: string;
    backLinkLabel: string;
}

export const CelebrationActions = ({ onRestart, backLink, backLinkLabel }: CelebrationActionsProps) => {
    const router = useRouter();

    const handleBackClick = () => {
        router.push(backLink);
        router.refresh(); // Force revalidation of the page data
    };

    return (
        <>
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {onRestart && (
                    <Button
                        onClick={onRestart}
                        size="lg"
                        className="bg-gradient-to-r from-cyber-cyan to-cyber-blue hover:from-cyber-cyan-light hover:to-cyber-blue text-white font-bold px-8 py-6 text-lg shadow-cyber-glow hover:shadow-cyber-glow-strong transition-all"
                    >
                        <RotateCcw className="w-5 h-5 mr-2" />
                        Study Again
                    </Button>
                )}

                <Button
                    onClick={handleBackClick}
                    variant="outline"
                    size="lg"
                    className="w-full sm:w-auto border-2 border-cyber-cyan/50 hover:border-cyber-cyan hover:bg-cyber-cyan/10 text-white font-semibold px-8 py-6 text-lg"
                >
                    <Home className="w-5 h-5 mr-2" />
                    Back to {backLinkLabel}
                </Button>
            </div>

            {/* Next Steps Suggestion */}
            <div className="mt-8 pt-6 border-t border-cyber-cyan/20">
                <p className="text-sm text-slate-400 mb-3">
                    📊 What&apos;s next?
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center text-xs">
                    <Link href="/dashboard/weak-topics" className="text-cyber-cyan hover:text-cyber-cyan-light transition-colors">
                        → Review weak topics
                    </Link>
                    <Link href="/dashboard/practice-test" className="text-cyber-cyan hover:text-cyber-cyan-light transition-colors">
                        → Take practice test
                    </Link>
                    <Link href="/dashboard/next-domain" className="text-cyber-cyan hover:text-cyber-cyan-light transition-colors">
                        → Study next domain
                    </Link>
                </div>
            </div>
        </>
    );
};
