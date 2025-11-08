"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Plus, Edit2, Trash2, ArrowLeft, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

interface DeckData {
  id: string;
  name: string;
  description: string | null;
  classId: string;
  class: {
    id: string;
    name: string;
  };
}

interface Flashcard {
  id: string;
  question: string;
  answer: string;
  explanation: string | null;
  order: number;
  isPublished: boolean;
  media?: FlashcardMedia[];
}

interface FlashcardMedia {
  id: string;
  fileUrl: string;
  fileName: string;
  placement: string;
  order: number;
}

interface FlashcardFormData {
  question: string;
  answer: string;
  explanation: string;
  order: number;
  isPublished: boolean;
}

interface ImageUpload {
  file: File | null; // null for existing images from database
  preview: string;
  placement: 'question' | 'answer';
  order: number;
  isExisting?: boolean; // true if loaded from database
}

export default function AdminDeckDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [deckId, setDeckId] = useState<string | null>(null);
  const [deckData, setDeckData] = useState<DeckData | null>(null);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null);
  const [deletingCard, setDeletingCard] = useState<Flashcard | null>(null);
  const [activeTab, setActiveTab] = useState<"preview" | "edit" | "browse">("edit");
  const [formData, setFormData] = useState<FlashcardFormData>({
    question: "",
    answer: "",
    explanation: "",
    order: 0,
    isPublished: true,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [questionImages, setQuestionImages] = useState<ImageUpload[]>([]);
  const [answerImages, setAnswerImages] = useState<ImageUpload[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  // Unwrap params
  useEffect(() => {
    params.then((p) => setDeckId(p.id));
  }, [params]);

  const loadDeckData = useCallback(async () => {
    if (!deckId) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/decks/${deckId}`);
      if (!res.ok) {
        toast.error("Failed to load deck");
        router.push("/admin/classes");
        return;
      }
      const data = await res.json();
      setDeckData({
        id: data.id,
        name: data.name,
        description: data.description,
        classId: data.classId,
        class: data.class,
      });
      setFlashcards(data.flashcards || []);
    } catch (error) {
      console.error("Error loading deck:", error);
      toast.error("Failed to load deck data");
    } finally {
      setLoading(false);
    }
  }, [deckId, router]);

  useEffect(() => {
    if (deckId) {
      loadDeckData();
    }
  }, [deckId, loadDeckData]);

  const openCreateDialog = () => {
    setEditingCard(null);
    setFormData({
      question: "",
      answer: "",
      explanation: "",
      order: flashcards.length,
      isPublished: true,
    });
    setQuestionImages([]);
    setAnswerImages([]);
    setActiveTab("edit");
    setIsDialogOpen(true);
  };

  const openEditDialog = (card: Flashcard) => {
    setEditingCard(card);
    setFormData({
      question: card.question,
      answer: card.answer,
      explanation: card.explanation || "",
      order: card.order,
      isPublished: card.isPublished,
    });

    console.log('Opening edit dialog for card:', card);
    console.log('Card media:', card.media);

    // Load existing images as previews
    if (card.media && card.media.length > 0) {
      const questionMedia: ImageUpload[] = card.media
        .filter(m => m.placement === 'question')
        .sort((a, b) => a.order - b.order)
        .map(m => ({
          file: null,
          preview: m.fileUrl,
          placement: 'question' as const,
          order: m.order,
          isExisting: true,
        }));

      console.log('Question media loaded:', questionMedia);

      const answerMedia: ImageUpload[] = card.media
        .filter(m => m.placement === 'answer')
        .sort((a, b) => a.order - b.order)
        .map(m => ({
          file: null,
          preview: m.fileUrl,
          placement: 'answer' as const,
          order: m.order,
          isExisting: true,
        }));

      console.log('Answer media loaded:', answerMedia);

      setQuestionImages(questionMedia);
      setAnswerImages(answerMedia);

      console.log('State updated - questionImages:', questionMedia.length, 'answerImages:', answerMedia.length);
    } else {
      console.log('No media found for this card');
      setQuestionImages([]);
      setAnswerImages([]);
    }

    setActiveTab("edit");
    setIsDialogOpen(true);
  };

  const openDeleteDialog = (card: Flashcard) => {
    setDeletingCard(card);
    setIsDeleteDialogOpen(true);
  };

  const handleImageSelect = (placement: 'question' | 'answer') => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.onchange = async (e) => {
      const files = Array.from((e.target as HTMLInputElement).files || []);
      if (files.length === 0) return;

      const images = placement === 'question' ? questionImages : answerImages;
      const setImages = placement === 'question' ? setQuestionImages : setAnswerImages;

      const newImages: ImageUpload[] = files.map((file, index) => ({
        file,
        preview: URL.createObjectURL(file),
        placement,
        order: images.length + index,
      }));

      setImages([...images, ...newImages]);
    };
    input.click();
  };

  const handleRemoveImage = async (placement: 'question' | 'answer', index: number) => {
    const images = placement === 'question' ? questionImages : answerImages;
    const setImages = placement === 'question' ? setQuestionImages : setAnswerImages;
    const imageToRemove = images[index];

    // If it's an existing image from database, we should delete it from storage
    // For now, we'll just remove it from the UI. The API would need a delete endpoint.
    // TODO: Implement DELETE /api/admin/media/:id endpoint to delete from blob and database

    // Revoke the preview URL to free memory (only for new uploads, not existing URLs)
    if (!imageToRemove.isExisting) {
      URL.revokeObjectURL(images[index].preview);
    }

    const newImages = images.filter((_, i) => i !== index);
    // Reorder remaining images
    newImages.forEach((img, i) => { img.order = i; });
    setImages(newImages);
  };

  const handleSaveCard = async () => {
    if (!formData.question.trim() || !formData.answer.trim()) {
      toast.error("Question and answer are required");
      return;
    }

    if (!deckId) return;

    setIsSaving(true);
    try {
      // First, create or update the flashcard
      const url = editingCard
        ? `/api/admin/flashcards/${editingCard.id}`
        : "/api/admin/flashcards";
      const method = editingCard ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          deckId: deckId,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to save flashcard");
      }

      const savedCard = await res.json();
      const flashcardId = savedCard.flashcard?.id || savedCard.id;

      // Upload only new images (not existing ones)
      const newImages = [...questionImages, ...answerImages].filter(img => !img.isExisting && img.file);
      if (newImages.length > 0) {
        setUploadingImages(true);
        for (const image of newImages) {
          const formData = new FormData();
          formData.append('file', image.file!);
          formData.append('flashcardId', flashcardId);
          formData.append('placement', image.placement);
          formData.append('order', image.order.toString());

          const uploadRes = await fetch('/api/admin/upload', {
            method: 'POST',
            body: formData,
          });

          if (!uploadRes.ok) {
            console.error('Failed to upload image:', image.file!.name);
          }
        }
        setUploadingImages(false);
      }

      toast.success(editingCard ? "Card updated successfully" : "Card created successfully");
      setIsDialogOpen(false);
      setQuestionImages([]);
      setAnswerImages([]);
      loadDeckData();
    } catch (error) {
      console.error("Error saving card:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save card");
    } finally {
      setIsSaving(false);
      setUploadingImages(false);
    }
  };

  const handleDeleteCard = async () => {
    if (!deletingCard) return;

    setIsSaving(true);
    try {
      const res = await fetch(`/api/admin/flashcards/${deletingCard.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete card");
      }

      toast.success("Card deleted successfully");
      setIsDeleteDialogOpen(false);
      setDeletingCard(null);
      loadDeckData();
    } catch (error) {
      console.error("Error deleting card:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete card");
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

  if (!deckData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Link href={`/admin/classes/${deckData.classId}`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Class {deckData.class.name}
              </Button>
            </Link>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 mb-1">
                {deckData.name}
              </h1>
              <p className="text-slate-600 text-sm">
                {deckData.description || "Add a short description of the topics covered in this deck"}
              </p>
            </div>

            <Button
              size="lg"
              className="bg-blue-500 hover:bg-blue-600 text-white px-8 rounded-full"
            >
              STUDY DECK
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="container mx-auto px-4">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'preview' | 'edit')} className="w-full">
            <TabsList className="bg-transparent border-b border-slate-200 rounded-none w-full justify-start">
              <TabsTrigger
                value="preview"
                className="data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none bg-transparent"
              >
                Preview ({flashcards.length})
              </TabsTrigger>
              <TabsTrigger
                value="edit"
                className="data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none bg-transparent"
              >
                Edit ({flashcards.length})
              </TabsTrigger>
              <TabsTrigger
                value="browse"
                className="data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none bg-transparent"
              >
                Browse ({flashcards.length})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {activeTab === "preview" && (
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardContent className="p-8">
                <p className="text-center text-slate-600">
                  Preview mode - Study interface will appear here
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "edit" && (
          <div className="max-w-6xl mx-auto">

            {/* Flashcards List */}
            {flashcards.length === 0 ? (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center">
                    <p className="text-slate-600 mb-4">No flashcards yet</p>
                    <Button
                      onClick={openCreateDialog}
                      className="bg-blue-500 hover:bg-blue-600 text-white"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Your First Card
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {flashcards.map((card, index) => (
                  <Card key={card.id} className="border-slate-200">
                    <CardContent className="p-6">
                      <div className="flex gap-6">
                        {/* Card Number */}
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                            <span className="text-2xl font-bold text-slate-700">{index + 1}</span>
                          </div>
                        </div>

                        {/* Question Column */}
                        <div className="flex-1 border-r border-slate-200 pr-6">
                          <div className="flex items-start gap-2 mb-3">
                            <span className="text-sm font-medium text-slate-500">Q</span>
                            <div className="flex-1">
                              <p className="text-blue-600 font-medium">{card.question}</p>
                              {card.media && card.media.filter(m => m.placement === 'question').length > 0 && (
                                <div className="flex gap-2 mt-2">
                                  {card.media.filter(m => m.placement === 'question').map((media) => (
                                    <button
                                      key={media.id}
                                      className="w-16 h-16 bg-slate-100 rounded border border-slate-300 flex items-center justify-center hover:bg-slate-200"
                                    >
                                      <ImageIcon className="w-6 h-6 text-slate-400" />
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Answer Column */}
                        <div className="flex-1">
                          <div className="flex items-start gap-2 mb-3">
                            <span className="text-sm font-medium text-slate-500">A</span>
                            <div className="flex-1">
                              <p className="text-slate-700">{card.answer}</p>
                              {card.media && card.media.filter(m => m.placement === 'answer').length > 0 && (
                                <div className="flex gap-2 mt-2">
                                  {card.media.filter(m => m.placement === 'answer').map((media) => (
                                    <button
                                      key={media.id}
                                      className="w-16 h-16 bg-slate-100 rounded border border-slate-300 flex items-center justify-center hover:bg-slate-200"
                                    >
                                      <ImageIcon className="w-6 h-6 text-slate-400" />
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex-shrink-0 flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(card)}
                            className="text-slate-600 hover:text-slate-800"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDeleteDialog(card)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Add Card Button */}
            <div className="mt-6 flex justify-center">
              <Button
                onClick={openCreateDialog}
                className="bg-slate-700 hover:bg-slate-800 text-white px-8"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add New Card
              </Button>
            </div>
          </div>
        )}

        {activeTab === "browse" && (
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardContent className="p-8">
                <p className="text-center text-slate-600">
                  Browse mode - List view of all cards
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-white border-slate-200 text-slate-900 max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {editingCard ? "Edit Flashcard" : "Create New Flashcard"}
            </DialogTitle>
            <DialogDescription className="text-slate-600">
              {editingCard
                ? "Update the flashcard details below"
                : "Add a new flashcard to this deck"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-3">
              <Label htmlFor="question" className="text-base font-semibold">Question *</Label>
              <Textarea
                id="question"
                value={formData.question}
                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                placeholder="Enter the question..."
                className="bg-white border-slate-300 text-slate-900 min-h-[120px]"
              />
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleImageSelect('question')}
                  >
                    <ImageIcon className="w-4 h-4 mr-2" />
                    Add Image
                  </Button>
                </div>
                {questionImages.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {questionImages.map((img, index) => (
                      <div key={index} className="relative group">
                        <Image
                          src={img.preview || '/placeholder.png'}
                          alt={`Question image ${index + 1}`}
                          width={200}
                          height={96}
                          className="w-full h-24 object-cover rounded border border-slate-300"
                          unoptimized
                          onError={() => {
                            console.error('Failed to load image:', img.preview);
                            console.error('Image object:', img);
                          }}
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleRemoveImage('question', index)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="answer" className="text-base font-semibold">Answer *</Label>
              <Textarea
                id="answer"
                value={formData.answer}
                onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                placeholder="Enter the answer..."
                className="bg-white border-slate-300 text-slate-900 min-h-[120px]"
              />
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleImageSelect('answer')}
                  >
                    <ImageIcon className="w-4 h-4 mr-2" />
                    Add Image
                  </Button>
                </div>
                {answerImages.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {answerImages.map((img, index) => (
                      <div key={index} className="relative group">
                        <Image
                          src={img.preview || '/placeholder.png'}
                          alt={`Answer image ${index + 1}`}
                          width={200}
                          height={96}
                          className="w-full h-24 object-cover rounded border border-slate-300"
                          unoptimized
                          onError={() => {
                            console.error('Failed to load answer image:', img.preview);
                            console.error('Image object:', img);
                          }}
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleRemoveImage('answer', index)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="order" className="text-base font-semibold">Card Order</Label>
              <Input
                id="order"
                type="number"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                className="bg-white border-slate-300 text-slate-900"
                min={0}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isSaving}
              className="border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSaveCard}
              disabled={isSaving}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {uploadingImages ? "Uploading images..." : "Saving..."}
                </>
              ) : (
                <>{editingCard ? "Update" : "Create"} Card</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-white border-slate-200 text-slate-900">
          <DialogHeader>
            <DialogTitle>Delete Flashcard</DialogTitle>
            <DialogDescription className="text-slate-600">
              Are you sure you want to delete this flashcard?
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">
                <strong>Warning:</strong> This action cannot be undone.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setDeletingCard(null);
              }}
              disabled={isSaving}
              className="border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteCard}
              disabled={isSaving}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Card"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
