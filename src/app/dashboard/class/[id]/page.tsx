"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ArrowLeft, Play, Pencil, Info, Plus, FileUp, Check } from "lucide-react";
import PerformanceMonitor from "@/components/PerformanceMonitor";
import { Skeleton } from "@/components/ui/skeleton";

type Deck = {
  id: string;
  name: string;
  description: string | null;
  cardCount: number;
  studiedCount: number;
  progress: number;
};

type ClassData = {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  createdBy: string;
};

type Tab = "about" | "decks" | "learners";
type StudyMode = "all" | "progressive" | "random";

export default function ClassDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { userId } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const [classData, setClassData] = useState<ClassData | null>(null);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("decks");
  const [studyMode, setStudyMode] = useState<StudyMode>("progressive");
  const [loading, setLoading] = useState(true);
  const [classId, setClassId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedDecks, setSelectedDecks] = useState<Set<string>>(new Set());

  // Unwrap params
  useEffect(() => {
    params.then((p) => setClassId(p.id));
  }, [params]);

  useEffect(() => {
    if (!userId || !classId) {
      if (!userId) {
        router.push("/sign-in");
      }
      return;
    }

    const fetchData = async () => {
      try {
        // Fetch class data from public endpoint
        const response = await fetch(`/api/classes/${classId}`);
        if (!response.ok) {
          router.push("/dashboard");
          return;
        }
        const data = await response.json();

        // Set class data
        setClassData({
          id: data.id,
          name: data.name,
          description: data.description,
          icon: data.icon,
          color: data.color,
          createdBy: data.createdBy,
        });

        // Set decks with progress (already calculated by API)
        setDecks(data.decks || []);

        // Check if user is admin
        const adminResponse = await fetch('/api/user/is-admin');
        const adminData = await adminResponse.json();
        setIsAdmin(adminData.isAdmin);
      } catch (error) {
        console.error("Error fetching class data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId, classId, router]);

  // Memoized calculations - must be before conditional returns
  const totalCards = useMemo(() => decks.reduce((sum, deck) => sum + deck.cardCount, 0), [decks]);
  const totalStudied = useMemo(() => decks.reduce((sum, deck) => sum + deck.studiedCount, 0), [decks]);
  const overallProgress = useMemo(
    () => totalCards > 0 ? Math.round((totalStudied / totalCards) * 100) : 0,
    [totalCards, totalStudied]
  );

  // Handle deck selection toggle - memoized to prevent re-renders
  const toggleDeckSelection = useCallback((deckId: string) => {
    setSelectedDecks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(deckId)) {
        newSet.delete(deckId);
      } else {
        newSet.add(deckId);
      }
      return newSet;
    });
  }, []);

  // Toggle select all decks - memoized with decks dependency
  const toggleSelectAll = useCallback(() => {
    if (selectedDecks.size === decks.length) {
      setSelectedDecks(new Set());
    } else {
      setSelectedDecks(new Set(decks.map(d => d.id)));
    }
  }, [selectedDecks.size, decks]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="bg-white border-b border-slate-200">
          <div className="container mx-auto px-4 py-6">
            <Skeleton className="h-10 w-32 mb-4" />
            <div className="grid lg:grid-cols-[1fr_auto] gap-8">
              <div>
                <Skeleton className="h-8 w-64 mb-2" />
                <Skeleton className="h-4 w-96 mb-4" />
              </div>
            </div>
          </div>
        </div>
        <div className="container mx-auto px-4 py-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="border-slate-200">
                <CardContent className="p-6">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full mb-4" />
                  <Skeleton className="h-2 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!classData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Performance Monitoring */}
      <PerformanceMonitor pageName="Class Detail Page" showVisual={false} />

      <div className="bg-white border-b border-slate-200">
        <div className="container mx-auto px-4 py-6">
          {/* Back Button */}
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>

          <div className="grid lg:grid-cols-[1fr_auto] gap-8">
            {/* Left Section - Class Info */}
            <div>
              <div className="flex items-start gap-4 mb-6">
                {/* Class Icon */}
                <div className="w-20 h-20 bg-gradient-to-br from-slate-600 to-slate-800 rounded-lg flex items-center justify-center flex-shrink-0">
                  {classData.icon ? (
                    <span className="text-4xl">{classData.icon}</span>
                  ) : (
                    <span className="text-2xl text-white font-bold">
                      {classData.name.charAt(0)}
                    </span>
                  )}
                </div>

                <div className="flex-1">
                  {/* Class Name with Edit Button */}
                  <div className="flex items-center gap-2 mb-3">
                    <h1 className="text-3xl font-bold text-slate-800">
                      {classData.name}
                    </h1>
                    {isAdmin && (
                      <button className="p-1 hover:bg-slate-100 rounded">
                        <Pencil className="w-4 h-4 text-slate-500" />
                      </button>
                    )}
                  </div>

                  {/* Cards Studied Info */}
                  <div className="flex items-center gap-2 text-slate-600 text-sm">
                    <span>
                      Cards Studied: <span className="font-semibold">{totalStudied} of {totalCards}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <Link
                  href={
                    selectedDecks.size > 0
                      ? `/dashboard/class/${classData.id}/study?mode=${studyMode}&decks=${Array.from(selectedDecks).join(',')}`
                      : `/dashboard/class/${classData.id}/study?mode=${studyMode}`
                  }
                >
                  <Button
                    size="lg"
                    className={`text-white px-8 rounded-full transition-all ${
                      selectedDecks.size > 0
                        ? 'bg-green-500 hover:bg-green-600'
                        : 'bg-blue-500 hover:bg-blue-600'
                    }`}
                    disabled={selectedDecks.size === 0 && decks.length === 0}
                  >
                    <Play className="w-5 h-5 mr-2 fill-white" />
                    {selectedDecks.size > 0
                      ? `STUDY SELECTED (${selectedDecks.size})`
                      : 'STUDY'
                    }
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right Section - Mastery Circle */}
            <div className="flex items-center justify-center">
              <div className="relative w-48 h-48">
                <svg className="w-48 h-48 transform -rotate-90">
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    stroke="#e2e8f0"
                    strokeWidth="8"
                    fill="none"
                  />
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    stroke="#3b82f6"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 88}`}
                    strokeDashoffset={`${2 * Math.PI * 88 * (1 - overallProgress / 100)}`}
                    className="transition-all duration-500"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-sm text-slate-600 mb-1">
                    Mastery
                  </div>
                  <div className="text-4xl font-bold text-slate-800">
                    {overallProgress}.0%
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-8 border-b border-slate-200">
            <button
              onClick={() => setActiveTab("about")}
              className={`pb-4 text-sm font-medium transition-colors relative ${
                activeTab === "about"
                  ? "text-slate-800"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              About
              {activeTab === "about" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-800" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("decks")}
              className={`pb-4 text-sm font-medium transition-colors relative ${
                activeTab === "decks"
                  ? "text-slate-800"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Decks ({decks.length})
              {activeTab === "decks" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-800" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("learners")}
              className={`pb-4 text-sm font-medium transition-colors relative ${
                activeTab === "learners"
                  ? "text-slate-800"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Learners (1)
              {activeTab === "learners" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-800" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="container mx-auto px-4 py-8">
        {activeTab === "about" && (
          <div className="max-w-3xl">
            <Card>
              <CardContent className="p-6">
                <p className="text-slate-700">
                  {classData.description || "No description available."}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "decks" && (
          <div>
            {/* Deck Controls */}
            <div className="flex items-center justify-between mb-6">
              {/* Study Mode Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleSelectAll}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors border ${
                    selectedDecks.size === decks.length && decks.length > 0
                      ? "bg-blue-500 border-blue-500"
                      : "bg-white border-slate-300 hover:bg-slate-50"
                  }`}
                  title="Select All"
                >
                  <Check className={`w-5 h-5 ${
                    selectedDecks.size === decks.length && decks.length > 0
                      ? "text-white"
                      : "text-slate-600"
                  }`} />
                </button>
                <button
                  onClick={() => setStudyMode("progressive")}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    studyMode === "progressive"
                      ? "bg-slate-700 text-white"
                      : "bg-white text-slate-600 hover:bg-slate-50"
                  } border border-slate-300`}
                >
                  PROGRESSIVE
                </button>
                <button
                  onClick={() => setStudyMode("random")}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    studyMode === "random"
                      ? "bg-slate-200 text-slate-800"
                      : "bg-white text-slate-600 hover:bg-slate-50"
                  } border border-slate-300`}
                >
                  RANDOM
                </button>
                <Dialog>
                  <DialogTrigger asChild>
                    <button className="hover:bg-slate-100 rounded p-1">
                      <Info className="w-4 h-4 text-slate-500" />
                    </button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Study Modes</DialogTitle>
                      <DialogDescription>
                        Learn about the different study modes available.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-2">
                      <div>
                        <h4 className="font-semibold text-slate-900 mb-1">📚 All</h4>
                        <p className="text-sm text-slate-600">
                          Study all cards in this class in their default order. Great for comprehensive review.
                        </p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900 mb-1">🎯 Progressive (Recommended)</h4>
                        <p className="text-sm text-slate-600">
                          Focus on cards that need the most attention - those with low confidence ratings or due for review.
                          This mode uses spaced repetition to optimize your learning.
                        </p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900 mb-1">🎲 Random</h4>
                        <p className="text-sm text-slate-600">
                          Cards are shuffled randomly to test your knowledge in an unpredictable order.
                          Perfect for simulating exam conditions.
                        </p>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Action Buttons */}
              {isAdmin && (
                <div className="flex items-center gap-3">
                  <Button variant="outline" className="rounded-full border-slate-300">
                    <FileUp className="w-4 h-4 mr-2" />
                    Import/Make Flashcards
                    <span className="ml-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                      NEW
                    </span>
                  </Button>
                  <Button variant="outline" className="rounded-full border-slate-300">
                    <Plus className="w-4 h-4 mr-2" />
                    Create New Deck
                  </Button>
                </div>
              )}
            </div>

            {/* Deck List */}
            {decks.length === 0 ? (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center text-slate-500">
                    No decks available in this class yet.
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {decks.map((deck) => {
                  const isSelected = selectedDecks.has(deck.id);
                  return (
                    <Card
                      key={deck.id}
                      onClick={() => toggleDeckSelection(deck.id)}
                      className={`cursor-pointer transition-all border-2 ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50 shadow-md'
                          : 'border-slate-200 hover:shadow-md'
                      }`}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                          {/* Selection Checkbox */}
                          <div className="flex-shrink-0">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                              isSelected
                                ? 'bg-blue-500'
                                : 'bg-slate-200'
                            }`}>
                              <Check className={`w-6 h-6 ${
                                isSelected ? 'text-white' : 'text-slate-600'
                              }`} />
                            </div>
                          </div>

                          {/* Progress Indicator */}
                          <div className="flex-shrink-0">
                            <div className="text-2xl font-bold text-slate-800">
                              {deck.progress}%
                            </div>
                          </div>

                          {/* Deck Info */}
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-slate-800 mb-1">
                              {deck.name}
                            </h3>
                            <p className="text-sm text-slate-600">
                              {deck.studiedCount} of {deck.cardCount} unique cards studied
                            </p>
                            <div className="mt-3">
                              <Progress value={deck.progress} className="h-2" />
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Link
                              href={`/dashboard/deck/${deck.id}?mode=${studyMode}`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Button
                                size="icon"
                                className="bg-blue-500 hover:bg-blue-600 rounded-full w-12 h-12"
                              >
                                <Play className="w-6 h-6 fill-white text-white" />
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Create New Deck Card */}
            {isAdmin && (
              <Card className="mt-4 border-dashed border-2 border-slate-300 hover:border-slate-400 cursor-pointer transition-colors">
                <CardContent className="p-8">
                  <div className="flex items-center justify-center gap-3 text-slate-500">
                    <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center">
                      <Plus className="w-6 h-6" />
                    </div>
                    <span className="text-lg font-medium">Create New Deck</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {activeTab === "learners" && (
          <div className="max-w-3xl">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                    {user?.imageUrl ? (
                      <Image
                        src={user.imageUrl}
                        alt={user.fullName || "User"}
                        width={48}
                        height={48}
                        className="rounded-full"
                      />
                    ) : (
                      <span className="text-xl text-white font-bold">
                        {user?.firstName?.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-800">
                      {user?.fullName || "Unknown"}
                    </div>
                    <div className="text-sm text-slate-600">
                      {totalStudied} cards studied • {overallProgress}% mastery
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
