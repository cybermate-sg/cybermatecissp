"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, RotateCcw } from "lucide-react";
import Flashcard from "@/components/Flashcard";
import ConfidenceRating from "@/components/ConfidenceRating";

// Sample flashcard data - TODO: Replace with database
const SAMPLE_FLASHCARDS: Record<string, Array<{ question: string; answer: string }>> = {
  "1": [
    {
      question: "What is the CIA Triad in information security?",
      answer: "Confidentiality, Integrity, and Availability - the three core principles that form the foundation of information security."
    },
    {
      question: "What is the difference between a vulnerability and a threat?",
      answer: "A vulnerability is a weakness in a system, while a threat is a potential danger that could exploit that vulnerability. Risk is the likelihood of a threat exploiting a vulnerability."
    },
    {
      question: "What is Defense in Depth?",
      answer: "A layered security approach that uses multiple security controls at different levels to protect assets. If one layer fails, others continue to provide protection."
    },
    {
      question: "What does the principle of Least Privilege mean?",
      answer: "Users should only be granted the minimum levels of access or permissions needed to perform their job functions, reducing potential security risks."
    },
    {
      question: "What is Risk Management?",
      answer: "The process of identifying, assessing, and controlling threats to an organization's capital and earnings, including strategic, financial, operational, and security risks."
    }
  ],
  "2": [
    {
      question: "What is data classification?",
      answer: "The process of organizing data into categories based on its sensitivity, criticality, and value to help determine appropriate security controls."
    },
    {
      question: "What are the typical data classification levels?",
      answer: "Common levels include: Public, Internal, Confidential, and Restricted (or Top Secret). The specific levels vary by organization."
    }
  ],
  "3": [
    {
      question: "What is symmetric encryption?",
      answer: "Encryption method that uses the same key for both encryption and decryption. It's faster but requires secure key distribution."
    },
    {
      question: "What is asymmetric encryption?",
      answer: "Encryption using a key pair: a public key for encryption and a private key for decryption. Solves key distribution problem but is slower than symmetric encryption."
    }
  ],
  "4": [
    {
      question: "What is the OSI Model?",
      answer: "A 7-layer conceptual framework for network communication: Physical, Data Link, Network, Transport, Session, Presentation, and Application layers."
    }
  ],
  "5": [
    {
      question: "What is Multi-Factor Authentication (MFA)?",
      answer: "A security mechanism requiring two or more verification factors: something you know (password), something you have (token), or something you are (biometric)."
    }
  ],
  "6": [
    {
      question: "What is penetration testing?",
      answer: "An authorized simulated cyberattack on a system to evaluate its security, identify vulnerabilities, and assess the effectiveness of security controls."
    }
  ],
  "7": [
    {
      question: "What is an Incident Response Plan?",
      answer: "A documented process for detecting, responding to, and recovering from security incidents to minimize impact and restore normal operations."
    }
  ],
  "8": [
    {
      question: "What is the Secure Software Development Lifecycle (SDLC)?",
      answer: "A framework integrating security practices into every phase of software development from planning through deployment and maintenance."
    }
  ]
};

const DOMAIN_NAMES: Record<string, string> = {
  "1": "Security and Risk Management",
  "2": "Asset Security",
  "3": "Security Architecture and Engineering",
  "4": "Communication and Network Security",
  "5": "Identity and Access Management (IAM)",
  "6": "Security Assessment and Testing",
  "7": "Security Operations",
  "8": "Software Development Security"
};

export default function DomainStudyPage() {
  const params = useParams();
  const router = useRouter();
  const domainId = params.id as string;

  const flashcards = SAMPLE_FLASHCARDS[domainId] || [];
  const domainName = DOMAIN_NAMES[domainId] || "Unknown Domain";

  const [currentIndex, setCurrentIndex] = useState(0);
  const [showRating, setShowRating] = useState(false);
  const [studiedCards, setStudiedCards] = useState<Set<number>>(new Set());
  const [isFlipped, setIsFlipped] = useState(false);

  const currentCard = flashcards[currentIndex];
  const progress = (studiedCards.size / flashcards.length) * 100;

  const handleRate = (confidence: number) => {
    // TODO: Save confidence rating to database
    console.log(`Rated card ${currentIndex} with confidence ${confidence}`);

    const newStudied = new Set(studiedCards);
    newStudied.add(currentIndex);
    setStudiedCards(newStudied);

    // Move to next card
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowRating(false);
      setIsFlipped(false);
    } else {
      // Completed all cards
      setShowRating(false);
    }
  };

  const handleFlip = () => {
    setIsFlipped(true);
    if (!showRating) {
      setTimeout(() => setShowRating(true), 300);
    }
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setStudiedCards(new Set());
    setShowRating(false);
    setIsFlipped(false);
  };

  if (flashcards.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link href="/dashboard">
            <Button variant="ghost" className="text-white mb-6">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div className="text-center text-white">
            <h1 className="text-2xl font-bold mb-4">No flashcards available</h1>
            <p className="text-gray-400">This domain doesn't have any flashcards yet.</p>
          </div>
        </div>
      </div>
    );
  }

  const allCardsStudied = studiedCards.size === flashcards.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard">
            <Button variant="ghost" className="text-white mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>

          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                Domain {domainId}: {domainName}
              </h1>
              <p className="text-gray-400">
                Card {currentIndex + 1} of {flashcards.length}
              </p>
            </div>
            <Button
              onClick={handleReset}
              variant="outline"
              className="border-purple-500 text-purple-400 hover:bg-purple-500/10"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset Progress
            </Button>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Progress</span>
              <span className="text-sm text-gray-400">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>

        {/* Flashcard or Completion */}
        {!allCardsStudied ? (
          <div className="space-y-8">
            {/* Flashcard */}
            <Flashcard
              question={currentCard.question}
              answer={currentCard.answer}
              onFlip={handleFlip}
            />

            {/* Confidence Rating */}
            {showRating && (
              <div className="animate-fade-in">
                <ConfidenceRating onRate={handleRate} />
              </div>
            )}
          </div>
        ) : (
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-3xl font-bold text-white">
              Great Job!
            </h2>
            <p className="text-xl text-gray-300">
              You've completed all {flashcards.length} cards in this domain.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={handleReset}
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Study Again
              </Button>
              <Link href="/dashboard">
                <Button variant="outline" className="border-purple-500 text-purple-400 hover:bg-purple-500/10 w-full sm:w-auto">
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Study Tips */}
        {!allCardsStudied && (
          <div className="mt-12 max-w-2xl mx-auto">
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-3">💡 Study Tip</h3>
              <p className="text-gray-300 text-sm">
                Be honest with your confidence ratings. Cards you rate lower will appear more frequently
                in your study sessions, helping you focus on areas that need more attention.
              </p>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
