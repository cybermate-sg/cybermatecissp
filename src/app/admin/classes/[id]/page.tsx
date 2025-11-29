"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Loader2, Plus, Edit2, Trash2, ArrowLeft, BookOpen, Layers, ClipboardList } from "lucide-react";
import { toast } from "sonner";
import { validateQuizFile, type QuizFile } from "@/lib/validations/quiz";

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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-400">
              Total Decks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{decks.length}</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-400">
              Published Decks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">
              {decks.filter((d) => d.isPublished).length}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-400">
              Total Cards
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">
              {decks.reduce((sum, d) => sum + d.cardCount, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

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
                <div
                  key={deck.id}
                  className="p-4 rounded-lg border border-slate-700 bg-slate-900/50 hover:bg-slate-900/70 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {/* Deck Type Icon */}
                      <div className="flex-shrink-0 mt-1">
                        {deck.type === 'quiz' ? (
                          <div className="w-10 h-10 rounded-lg bg-blue-500/20 border border-blue-500/50 flex items-center justify-center" title="Quiz Deck">
                            <ClipboardList className="w-5 h-5 text-blue-400" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-green-500/20 border border-green-500/50 flex items-center justify-center" title="Flashcard Deck">
                            <Layers className="w-5 h-5 text-green-400" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-white text-lg">
                            {deck.name}
                          </h3>
                          <span className={`text-xs px-2 py-1 rounded border ${
                            deck.type === 'quiz'
                              ? 'bg-blue-900/30 text-blue-400 border-blue-500/30'
                              : 'bg-green-900/30 text-green-400 border-green-500/30'
                          }`}>
                            {deck.type === 'quiz' ? 'Quiz' : 'Flashcard'}
                          </span>
                          {!deck.isPublished && (
                            <span className="text-xs px-2 py-1 rounded bg-gray-700 text-gray-300">
                              Draft
                            </span>
                          )}
                          {deck.isPremium && (
                            <span className="text-xs px-2 py-1 rounded bg-amber-900/30 text-amber-400 border border-amber-500/30">
                              Premium
                            </span>
                          )}
                        </div>
                        {deck.description && (
                          <p className="text-sm text-gray-300 mb-2">
                            {deck.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-gray-400">
                          <span>Order: {deck.order}</span>
                          <span>•</span>
                          <span>{deck.cardCount} card{deck.cardCount !== 1 ? 's' : ''}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link href={`/admin/decks/${deck.id}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-slate-700 text-gray-300 hover:bg-slate-700"
                        >
                          <BookOpen className="w-4 h-4 mr-2" />
                          Manage Cards
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(deck)}
                        className="text-gray-300 hover:text-white hover:bg-slate-700"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDeleteDialog(deck)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingDeck ? "Edit Deck" : "Create New Deck"}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {editingDeck
                ? "Update the deck details below"
                : "Add a new deck to this class"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
            <div className="space-y-2">
              <Label htmlFor="name">Deck Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Security Architecture and Engineering"
                className="bg-slate-900 border-slate-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of this deck..."
                className="bg-slate-900 border-slate-700 text-white min-h-[100px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Deck Type *</Label>
              <select
                id="type"
                value={formData.type}
                onChange={(e) => {
                  const newType = e.target.value as 'flashcard' | 'quiz';
                  setFormData({ ...formData, type: newType });
                  // Clear quiz data if switching to flashcard type
                  if (newType === 'flashcard') {
                    setDeckQuizData(null);
                    setDeckQuizFileName("");
                  }
                }}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="flashcard">Flashcard</option>
                <option value="quiz">Quiz</option>
              </select>
              <p className="text-xs text-gray-400">
                {formData.type === 'flashcard'
                  ? 'Traditional flashcard deck with questions and answers'
                  : 'Quiz deck with multiple-choice questions (requires JSON file upload)'}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="order">Display Order</Label>
              <Input
                id="order"
                type="number"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                className="bg-slate-900 border-slate-700 text-white"
                min={0}
              />
              <p className="text-xs text-gray-400">
                Lower numbers appear first in the list
              </p>
            </div>

            {formData.type === 'quiz' && (
              <div className="space-y-2">
                <Label htmlFor="deckQuiz">
                  Quiz Questions File {formData.type === 'quiz' && '*'}
                </Label>
                <p className="text-xs text-gray-400">
                  Upload a JSON file with multiple-choice questions for this quiz deck
                </p>

                <Input
                  id="deckQuiz"
                  type="file"
                  accept=".json"
                  onChange={handleDeckQuizFileSelect}
                  className="bg-slate-900 border-slate-700 text-white cursor-pointer"
                />

                {deckQuizData && (
                  <div className="p-3 bg-blue-900/30 border border-blue-700 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-blue-300">
                          ✓ {deckQuizData.questions.length} question{deckQuizData.questions.length !== 1 ? 's' : ''} loaded
                        </p>
                        <p className="text-xs text-blue-400 mt-1">{deckQuizFileName}</p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveDeckQuiz}
                        className="text-blue-300 hover:text-blue-100 hover:bg-blue-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="mt-2 pt-2 border-t border-blue-700">
                      <p className="text-xs text-blue-300 font-medium mb-1">Preview:</p>
                      <div className="space-y-1">
                        {deckQuizData.questions.slice(0, 2).map((q, idx) => (
                          <div key={idx} className="text-xs text-blue-200">
                            <p className="font-medium">Q{idx + 1}: {q.question}</p>
                            <p className="text-blue-400 ml-2 mt-0.5">
                              {q.options.length} options, {q.options.filter(o => o.isCorrect).length} correct
                            </p>
                          </div>
                        ))}
                        {deckQuizData.questions.length > 2 && (
                          <p className="text-xs text-blue-400 italic">
                            +{deckQuizData.questions.length - 2} more question(s)...
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-between py-2 px-3 bg-slate-900 rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="isPremium">Premium Content</Label>
                <p className="text-xs text-gray-400">
                  Requires paid subscription to access
                </p>
              </div>
              <Switch
                id="isPremium"
                checked={formData.isPremium}
                onCheckedChange={(checked) => setFormData({ ...formData, isPremium: checked })}
              />
            </div>

            <div className="flex items-center justify-between py-2 px-3 bg-slate-900 rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="isPublished">Published</Label>
                <p className="text-xs text-gray-400">
                  Make this deck visible to users
                </p>
              </div>
              <Switch
                id="isPublished"
                checked={formData.isPublished}
                onCheckedChange={(checked) => setFormData({ ...formData, isPublished: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isSaving}
              className="border-slate-700 text-gray-300 hover:bg-slate-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveDeck}
              disabled={isSaving}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>{editingDeck ? "Update" : "Create"} Deck</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>Delete Deck</DialogTitle>
            <DialogDescription className="text-gray-400">
              Are you sure you want to delete &quot;{deletingDeck?.name}&quot;?
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
              <p className="text-sm text-red-300">
                <strong>Warning:</strong> This will permanently delete the deck and all its flashcards.
                This action cannot be undone.
              </p>
              {deletingDeck && deletingDeck.cardCount > 0 && (
                <p className="text-sm text-red-300 mt-2">
                  This deck contains {deletingDeck.cardCount} card{deletingDeck.cardCount !== 1 ? 's' : ''} which will also be deleted.
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setDeletingDeck(null);
              }}
              disabled={isSaving}
              className="border-slate-700 text-gray-300 hover:bg-slate-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteDeck}
              disabled={isSaving}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Deck"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
