"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, ArrowLeft, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { validateQuizFile, type QuizFile } from "@/lib/validations/quiz";
import { ClassStatsCards } from "./components/ClassStatsCards";
import { DeckListItem } from "./components/DeckListItem";
import { DeckFormDialog } from "./components/DeckFormDialog";
import { DeleteDeckDialog } from "./components/DeleteDeckDialog";

interface ClassData {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  isPublished: boolean;
}

interface Deck {
  id: string;
  name: string;
  description: string | null;
  type: 'flashcard' | 'quiz';
  cardCount: number;
  order: number;
  isPremium: boolean;
  isPublished: boolean;
}

interface DeckFormData {
  name: string;
  description: string;
  type: 'flashcard' | 'quiz';
  order: number;
  isPremium: boolean;
  isPublished: boolean;
}

export default function AdminClassDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [classId, setClassId] = useState<string | null>(null);
  const [classData, setClassData] = useState<ClassData | null>(null);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingDeck, setEditingDeck] = useState<Deck | null>(null);
  const [deletingDeck, setDeletingDeck] = useState<Deck | null>(null);
  const [formData, setFormData] = useState<DeckFormData>({
    name: "",
    description: "",
    type: "flashcard",
    order: 0,
    isPremium: false,
    isPublished: true,
  });
  const [isSaving, setIsSaving] = useState(false);

  // Deck quiz state
  const [deckQuizData, setDeckQuizData] = useState<QuizFile | null>(null);
  const [deckQuizFileName, setDeckQuizFileName] = useState<string>("");

  // Unwrap params
  useEffect(() => {
    params.then((p) => setClassId(p.id));
  }, [params]);

  const loadClassData = useCallback(async () => {
    if (!classId) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/classes/${classId}`);
      if (!res.ok) {
        toast.error("Failed to load class");
        router.push("/admin/classes");
        return;
      }
      const data = await res.json();
      setClassData(data.class);
      setDecks(data.decks || []);
    } catch (error) {
      console.error("Error loading class:", error);
      toast.error("Failed to load class data");
    } finally {
      setLoading(false);
    }
  }, [classId, router]);

  useEffect(() => {
    if (classId) {
      loadClassData();
    }
  }, [classId, loadClassData]);

  const openCreateDialog = () => {
    setEditingDeck(null);
    setFormData({
      name: "",
      description: "",
      type: "flashcard",
      order: decks.length,
      isPremium: false,
      isPublished: true,
    });
    setDeckQuizData(null);
    setDeckQuizFileName("");
    setIsDialogOpen(true);
  };

  const openEditDialog = (deck: Deck) => {
    setEditingDeck(deck);
    setFormData({
      name: deck.name,
      description: deck.description || "",
      type: deck.type || "flashcard",
      order: deck.order,
      isPremium: deck.isPremium,
      isPublished: deck.isPublished,
    });
    setIsDialogOpen(true);
  };

  const openDeleteDialog = (deck: Deck) => {
    setDeletingDeck(deck);
    setIsDeleteDialogOpen(true);
  };

  const handleDeckQuizFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setDeckQuizData(null);
      setDeckQuizFileName("");
      return;
    }

    try {
      const text = await file.text();
      const json = JSON.parse(text);
      const result = validateQuizFile(json);

      if (!result.success) {
        toast.error(`Invalid quiz file: ${result.error}`);
        setDeckQuizData(null);
        setDeckQuizFileName("");
        return;
      }

      setDeckQuizData(result.data);
      setDeckQuizFileName(file.name);
      toast.success(`${result.data.questions.length} question(s) loaded`);
    } catch {
      toast.error('Failed to parse JSON file');
      setDeckQuizData(null);
      setDeckQuizFileName("");
    }
  };

  const handleRemoveDeckQuiz = () => {
    setDeckQuizData(null);
    setDeckQuizFileName("");
  };

  const handleSaveDeck = async () => {
    if (!formData.name.trim()) {
      toast.error("Deck name is required");
      return;
    }

    if (!classId) return;

    setIsSaving(true);
    try {
      const url = editingDeck
        ? `/api/admin/decks/${editingDeck.id}`
        : "/api/admin/decks";
      const method = editingDeck ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          classId: classId,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to save deck");
      }

      const result = await res.json();
      const savedDeckId = editingDeck ? editingDeck.id : result.deck.id;

      // Upload deck quiz if present
      if (deckQuizData && savedDeckId) {
        try {
          const quizRes = await fetch(`/api/admin/decks/${savedDeckId}/quiz`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              quizData: deckQuizData,
              classId: classId,
            }),
          });

          if (!quizRes.ok) {
            throw new Error('Failed to upload deck quiz');
          }

          const quizResult = await quizRes.json();
          toast.success(quizResult.message);
        } catch (quizError) {
          console.error("Error uploading quiz:", quizError);
          toast.error('Deck saved but quiz upload failed');
        }
      }

      toast.success(editingDeck ? "Deck updated successfully" : "Deck created successfully");
      setIsDialogOpen(false);
      setDeckQuizData(null);
      setDeckQuizFileName("");
      loadClassData();
    } catch (error) {
      console.error("Error saving deck:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save deck");
    } finally {
      setIsSaving(false);
    }
  };

  const deleteDeckRequest = async (deckId: string) => {
    const res = await fetch(`/api/admin/decks/${deckId}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Failed to delete deck");
    }
  };

  const cleanupAfterDelete = () => {
    toast.success("Deck deleted successfully");
    setIsDeleteDialogOpen(false);
    setDeletingDeck(null);
    loadClassData();
  };

  const handleDeleteError = (error: unknown) => {
    console.error("Error deleting deck:", error);
    const message = error instanceof Error ? error.message : "Failed to delete deck";
    toast.error(message);
  };

  const handleDeleteDeck = async () => {
    if (!deletingDeck) return;

    setIsSaving(true);
    try {
      await deleteDeckRequest(deletingDeck.id);
      cleanupAfterDelete();
    } catch (error) {
      handleDeleteError(error);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center items-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
        </div>
      </div>
    );
  }

  if (!classData) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-gray-400 mb-4">Class not found or failed to load</p>
            <Link href="/admin/classes">
              <Button variant="outline" className="border-slate-700 text-gray-300 hover:bg-slate-700">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Classes
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link href="/admin/classes">
          <Button variant="ghost" className="text-white mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Classes
          </Button>
        </Link>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {classData.icon && (
              <span className="text-4xl">{classData.icon}</span>
            )}
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
                {classData.name}
              </h1>
              {classData.description && (
                <p className="text-gray-300">{classData.description}</p>
              )}
            </div>
          </div>

          <Button
            onClick={openCreateDialog}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Deck
          </Button>
        </div>
      </div>

      {/* Stats */}
      <ClassStatsCards decks={decks} />

      {/* Decks List */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Decks</CardTitle>
          <CardDescription className="text-gray-400">
            Manage decks and flashcards in this class
          </CardDescription>
        </CardHeader>
        <CardContent>
          {decks.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 mb-4">No decks created yet</p>
              <Button
                onClick={openCreateDialog}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Deck
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {decks.map((deck) => (
                <DeckListItem
                  key={deck.id}
                  deck={deck}
                  onEdit={openEditDialog}
                  onDelete={openDeleteDialog}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <DeckFormDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        deck={editingDeck}
        formData={formData}
        setFormData={setFormData}
        quizFile={{
          data: deckQuizData,
          fileName: deckQuizFileName,
          onFileSelect: handleDeckQuizFileSelect,
          onRemove: handleRemoveDeckQuiz,
        }}
        onSave={handleSaveDeck}
        isSaving={isSaving}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteDeckDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        deck={deletingDeck}
        onConfirm={handleDeleteDeck}
        isSaving={isSaving}
      />
    </div>
  );
}
