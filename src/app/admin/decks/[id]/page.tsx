"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import RichTextEditor from "@/components/admin/RichTextEditor";
import { Loader2, Plus, Edit2, Trash2, ArrowLeft, Image as ImageIcon, ClipboardList, TestTube, Upload, X, ChevronDown, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { validateQuizFile, type QuizFile, type QuizQuestionUpdate, type DeckQuizQuestionUpdate } from "@/lib/validations/quiz";
import { AiQuizGenerationModal } from "@/components/admin/AiQuizGenerationModal";
import { FormattedContent } from "@/components/admin/FormattedContent";
import { QuizQuestionList } from "@/components/admin/QuizQuestionList";
import { QuizQuestionEditDialog } from "@/components/admin/QuizQuestionEditDialog";

interface DeckData {
  id: string;
  name: string;
  description: string | null;
  type: string;
  classId: string;
  class: {
    id: string;
    name: string;
  };
}

interface QuizQuestion {
  id: string;
  questionText: string;
  options: Array<{ text: string; isCorrect: boolean }>;
  explanation: string | null;
  eliminationTactics: Record<string, string> | null;
  correctAnswerWithJustification: Record<string, string> | null;
  compareRemainingOptionsWithJustification: Record<string, string> | null;
  correctOptionsJustification: Record<string, string> | null;
  order: number;
  createdAt: Date;
  createdBy: string;
  difficulty?: number | null;
}

interface Flashcard {
  id: string;
  question: string;
  answer: string;
  explanation: string | null;
  order: number;
  isPublished: boolean;
  media?: FlashcardMedia[];
  quizQuestions?: QuizQuestion[];
}

interface FlashcardMedia {
  id: string;
  fileUrl: string;
  fileName: string;
  fileKey: string;
  fileSize: number;
  mimeType: string;
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

interface MediaUpload {
  url: string;
  key: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  placement: string;
  order: number;
  altText: string | null;
}

const DECK_QUIZ_JSON_EXAMPLE = {
  questions: [
    {
      question: "What does CIA stand for in information security?",
      options: [
        { text: "Confidentiality, Integrity, Availability", isCorrect: true },
        { text: "Central Intelligence Agency", isCorrect: false },
        { text: "Computer Information Access", isCorrect: false },
      ],
      explanation: "CIA Triad is fundamental to information security",
    },
  ],
} as const;

const FLASHCARD_QUIZ_JSON_EXAMPLE = {
  questions: [
    {
      question: "What does IAM stand for?",
      options: [
        { text: "Identity Access Management", isCorrect: true },
        { text: "Internet Access Module", isCorrect: false },
      ],
      explanation: "Optional explanation",
    },
  ],
} as const;

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
  const [quizData, setQuizData] = useState<QuizFile | null>(null);
  const [quizFileName, setQuizFileName] = useState<string>("");
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  // Deck-level quiz state
  const [deckQuizData, setDeckQuizData] = useState<QuizFile | null>(null);
  const [deckQuizFileName, setDeckQuizFileName] = useState<string>("");
  const [deckQuizLoading, setDeckQuizLoading] = useState(false);
  const [deckHasQuiz, setDeckHasQuiz] = useState(false);
  const [deckQuizCount, setDeckQuizCount] = useState(0);

  // Quiz question management state
  const [flashcardQuizQuestions, setFlashcardQuizQuestions] = useState<QuizQuestion[]>([]);
  const [loadingFlashcardQuiz, setLoadingFlashcardQuiz] = useState(false);
  const [deckQuizQuestions, setDeckQuizQuestions] = useState<QuizQuestion[]>([]);
  const [loadingDeckQuiz, setLoadingDeckQuiz] = useState(false);

  // Quiz question edit state
  const [editingFlashcardQuestion, setEditingFlashcardQuestion] = useState<QuizQuestion | null>(null);
  const [isFlashcardQuizEditDialogOpen, setIsFlashcardQuizEditDialogOpen] = useState(false);
  const [savingFlashcardQuizEdit, setSavingFlashcardQuizEdit] = useState(false);
  const [editingDeckQuestion, setEditingDeckQuestion] = useState<QuizQuestion | null>(null);
  const [isDeckQuizEditDialogOpen, setIsDeckQuizEditDialogOpen] = useState(false);
  const [savingDeckQuizEdit, setSavingDeckQuizEdit] = useState(false);

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
        type: data.type || 'flashcard',
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

  // Check if deck has quiz on mount
  useEffect(() => {
    const checkDeckQuiz = async () => {
      if (!deckId) return;
      try {
        const res = await fetch(`/api/decks/${deckId}/has-quiz`);
        const data = await res.json();
        setDeckHasQuiz(data.hasQuiz);
        setDeckQuizCount(data.count);
      } catch (error) {
        console.error('Error checking deck quiz:', error);
      }
    };
    checkDeckQuiz();
  }, [deckId]);

  // Load deck quiz questions when deck has quiz
  useEffect(() => {
    const loadDeckQuizQuestions = async () => {
      if (!deckId || !deckHasQuiz) return;

      setLoadingDeckQuiz(true);
      try {
        const res = await fetch(`/api/admin/decks/${deckId}/quiz/list`);
        if (res.ok) {
          const data = await res.json();
          setDeckQuizQuestions(data.questions || []);
        }
      } catch (error) {
        console.error('Error loading deck quiz questions:', error);
        setDeckQuizQuestions([]);
      } finally {
        setLoadingDeckQuiz(false);
      }
    };

    loadDeckQuizQuestions();
  }, [deckId, deckHasQuiz]);

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
    setQuizData(null);
    setQuizFileName("");
    setFlashcardQuizQuestions([]);
    setActiveTab("edit");
    setIsDialogOpen(true);
  };

  const openEditDialog = async (card: Flashcard) => {
    setEditingCard(card);
    setFormData({
      question: card.question,
      answer: card.answer,
      explanation: card.explanation || "",
      order: card.order,
      isPublished: card.isPublished,
    });

    // Clear quiz state first
    setFlashcardQuizQuestions([]);
    setQuizData(null);
    setQuizFileName("");

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

    // Open dialog first, then load quiz questions
    setActiveTab("edit");
    setIsDialogOpen(true);

    // Load existing quiz questions
    setLoadingFlashcardQuiz(true);
    try {
      const res = await fetch(`/api/admin/flashcards/${card.id}/quiz`);
      if (res.ok) {
        const data = await res.json();
        console.log('Loaded quiz questions:', data.questions?.length || 0);
        setFlashcardQuizQuestions(data.questions || []);
      } else {
        console.error('Failed to load quiz questions, status:', res.status);
        setFlashcardQuizQuestions([]);
      }
    } catch (error) {
      console.error('Error loading flashcard quiz questions:', error);
      setFlashcardQuizQuestions([]);
    } finally {
      setLoadingFlashcardQuiz(false);
    }
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

  const handleQuizFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const json = JSON.parse(text);
      const result = validateQuizFile(json);

      if (!result.success) {
        toast.error(`Invalid quiz file: ${result.error}`);
        setQuizData(null);
        setQuizFileName("");
        return;
      }

      setQuizData(result.data);
      setQuizFileName(file.name);
      toast.success(`${result.data.questions.length} question(s) loaded from ${file.name}`);
    } catch (error) {
      toast.error('Failed to parse JSON file. Please check the file format.');
      setQuizData(null);
      setQuizFileName("");
      console.error('Quiz file parsing error:', error);
    }
  };

  const handleRemoveQuiz = () => {
    setQuizData(null);
    setQuizFileName("");
    toast.success('Quiz removed');
  };

  // Flashcard quiz question delete handler
  const handleDeleteFlashcardQuizQuestion = async (questionId: string) => {
    if (!editingCard) return;

    // Store original state for rollback
    const originalQuestions = [...flashcardQuizQuestions];

    // Optimistically update UI
    setFlashcardQuizQuestions((prev) => prev.filter((q) => q.id !== questionId));

    try {
      const res = await fetch(`/api/admin/flashcards/${editingCard.id}/quiz/${questionId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete question');

      toast.success('Quiz question deleted successfully');

      // Refresh flashcard list to update quiz count badge
      await loadDeckData();
    } catch (error) {
      console.error('Error deleting flashcard quiz question:', error);
      // Rollback on error
      setFlashcardQuizQuestions(originalQuestions);
      toast.error('Failed to delete quiz question');
    }
  };

  // Flashcard quiz question edit handlers
  const handleEditFlashcardQuestion = (question: QuizQuestion) => {
    setEditingFlashcardQuestion(question);
    setIsFlashcardQuizEditDialogOpen(true);
  };

  const handleSaveFlashcardQuizQuestion = async (
    questionId: string,
    data: QuizQuestionUpdate
  ) => {
    if (!editingCard) return;

    // Store original for rollback
    const originalQuestions = [...flashcardQuizQuestions];

    // Optimistic update
    setFlashcardQuizQuestions((prev) =>
      prev.map((q) => (q.id === questionId ? { ...q, ...data } : q))
    );

    setSavingFlashcardQuizEdit(true);
    try {
      const res = await fetch(`/api/admin/flashcards/${editingCard.id}/quiz/${questionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Update failed:', errorData);
        throw new Error(errorData.error || 'Failed to update question');
      }

      const result = await res.json();
      setFlashcardQuizQuestions((prev) =>
        prev.map((q) => (q.id === questionId ? result.question : q))
      );

      toast.success('Quiz question updated successfully');
      setIsFlashcardQuizEditDialogOpen(false);
      await loadDeckData();
    } catch (error) {
      console.error('Error updating flashcard quiz question:', error);
      setFlashcardQuizQuestions(originalQuestions);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update quiz question';
      toast.error(errorMessage);
    } finally {
      setSavingFlashcardQuizEdit(false);
    }
  };

  // Deck quiz question edit handlers
  const handleEditDeckQuestion = (question: QuizQuestion) => {
    setEditingDeckQuestion(question);
    setIsDeckQuizEditDialogOpen(true);
  };

  const handleSaveDeckQuizQuestion = async (
    questionId: string,
    data: DeckQuizQuestionUpdate
  ) => {
    if (!deckId) return;

    // Store original for rollback
    const originalQuestions = [...deckQuizQuestions];

    // Optimistic update
    setDeckQuizQuestions((prev) =>
      prev.map((q) => (q.id === questionId ? { ...q, ...data } : q))
    );

    setSavingDeckQuizEdit(true);
    try {
      const res = await fetch(`/api/admin/decks/${deckId}/quiz/${questionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Update failed:', errorData);
        throw new Error(errorData.error || 'Failed to update question');
      }

      const result = await res.json();
      setDeckQuizQuestions((prev) =>
        prev.map((q) => (q.id === questionId ? result.question : q))
      );

      toast.success('Quiz question updated successfully');
      setIsDeckQuizEditDialogOpen(false);
    } catch (error) {
      console.error('Error updating deck quiz question:', error);
      setDeckQuizQuestions(originalQuestions);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update quiz question';
      toast.error(errorMessage);
    } finally {
      setSavingDeckQuizEdit(false);
    }
  };

  // Deck-level quiz handlers
  const handleDeckQuizFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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

  const handleUploadDeckQuiz = async () => {
    if (!deckQuizData) {
      toast.error('Please select a quiz file first');
      return;
    }

    setDeckQuizLoading(true);
    try {
      const res = await fetch(`/api/admin/decks/${deckId}/quiz`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quizData: deckQuizData,
          classId: deckData?.classId,
        }),
      });

      if (!res.ok) throw new Error('Failed to upload deck quiz');

      const data = await res.json();
      toast.success(data.message);
      setDeckHasQuiz(true);
      setDeckQuizCount(data.count || deckQuizData.questions.length);
      setDeckQuizData(null);
      setDeckQuizFileName("");

      // Refresh questions list
      const listRes = await fetch(`/api/admin/decks/${deckId}/quiz/list`);
      if (listRes.ok) {
        const listData = await listRes.json();
        setDeckQuizQuestions(listData.questions || []);
      }
    } catch (error) {
      toast.error('Failed to upload deck quiz');
      console.error(error);
    } finally {
      setDeckQuizLoading(false);
    }
  };

  const handleDeleteDeckQuiz = async () => {
    if (!confirm('Are you sure you want to delete all quiz questions for this deck?')) {
      return;
    }

    setDeckQuizLoading(true);
    try {
      const res = await fetch(`/api/admin/decks/${deckId}/quiz`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete deck quiz');

      toast.success('Deck quiz deleted successfully');
      setDeckHasQuiz(false);
      setDeckQuizCount(0);
      setDeckQuizData(null);
      setDeckQuizFileName("");
      setDeckQuizQuestions([]);
    } catch (error) {
      toast.error('Failed to delete deck quiz');
      console.error(error);
    } finally {
      setDeckQuizLoading(false);
    }
  };

  // Deck quiz question delete handler
  const handleDeleteDeckQuizQuestion = async (questionId: string) => {
    if (!deckId) return;

    // Store original state for rollback
    const originalQuestions = [...deckQuizQuestions];
    const originalCount = deckQuizCount;

    // Optimistically update UI
    setDeckQuizQuestions((prev) => prev.filter((q) => q.id !== questionId));
    setDeckQuizCount((prev) => Math.max(0, prev - 1));

    // Update hasQuiz flag if no questions left
    if (deckQuizQuestions.length <= 1) {
      setDeckHasQuiz(false);
    }

    try {
      const res = await fetch(`/api/admin/decks/${deckId}/quiz/${questionId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete question');

      toast.success('Quiz question deleted successfully');
    } catch (error) {
      console.error('Error deleting deck quiz question:', error);
      // Rollback on error
      setDeckQuizQuestions(originalQuestions);
      setDeckQuizCount(originalCount);
      setDeckHasQuiz(originalQuestions.length > 0);
      toast.error('Failed to delete quiz question');
    }
  };

  const handleSaveCard = async () => {
    if (!formData.question.trim() || !formData.answer.trim()) {
      toast.error("Question and answer are required");
      return;
    }

    if (!deckId) return;

    setIsSaving(true);
    setUploadingImages(true);

    try {
      const allImages = [...questionImages, ...answerImages];
      const flashcardId = editingCard?.id || 'temp';

      // Upload new images first
      const uploadedMedia: MediaUpload[] = [];

      for (const image of allImages) {
        // Skip already uploaded images (existing ones from DB)
        if (image.isExisting && !image.file) {
          // For existing images, we need to find the corresponding media data
          const existingMedia = editingCard?.media?.find(m =>
            m.fileUrl === image.preview && m.placement === image.placement
          );
          if (existingMedia) {
            uploadedMedia.push({
              url: existingMedia.fileUrl,
              key: existingMedia.fileKey,
              fileName: existingMedia.fileName,
              fileSize: existingMedia.fileSize,
              mimeType: existingMedia.mimeType,
              placement: image.placement,
              order: image.order,
              altText: null,
            });
          }
          continue;
        }

        // Upload new images
        if (image.file) {
          try {
            const uploadFormData = new FormData();
            uploadFormData.append('file', image.file);
            uploadFormData.append('flashcardId', flashcardId);
            uploadFormData.append('placement', image.placement);
            uploadFormData.append('order', image.order.toString());

            const uploadRes = await fetch('/api/admin/upload', {
              method: 'POST',
              body: uploadFormData,
            });

            if (!uploadRes.ok) {
              console.error('Failed to upload image:', image.file.name);
              continue;
            }

            const uploadData = await uploadRes.json();
            uploadedMedia.push({
              url: uploadData.url,
              key: uploadData.key,
              fileName: uploadData.fileName,
              fileSize: uploadData.fileSize,
              mimeType: uploadData.mimeType,
              placement: image.placement,
              order: image.order,
              altText: null,
            });
          } catch (error) {
            console.error('Error uploading image:', error);
          }
        }
      }

      // Now create or update the flashcard with media array
      const url = editingCard
        ? `/api/admin/flashcards/${editingCard.id}`
        : "/api/admin/flashcards";
      const method = editingCard ? "PATCH" : "POST";

      // Only include quizData if there's new quiz data to upload
      const requestBody: Record<string, unknown> = {
        ...formData,
        deckId: deckId,
        media: uploadedMedia,
      };

      // Only add quizData if it's not null (user uploaded new quiz file)
      if (quizData !== null) {
        requestBody.quizData = quizData;
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to save flashcard");
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
              {deckData.description ? (
                <FormattedContent
                  html={deckData.description}
                  className="text-slate-600 text-sm prose-p:my-1"
                />
              ) : (
                <p className="text-slate-600 text-sm">
                  Add a short description of the topics covered in this deck
                </p>
              )}
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

            {/* Deck-Level Test/Quiz Section - Only show for quiz-type decks */}
            {deckData.type === 'quiz' && (
            <Card className="mb-6 border-blue-200 bg-blue-50/30">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <TestTube className="w-5 h-5 text-blue-600" />
                    <h2 className="text-lg font-semibold text-slate-800">
                      Deck-Level Test/Quiz
                    </h2>
                    {deckHasQuiz && (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                        {deckQuizCount} Question{deckQuizCount !== 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>
                </div>
                <p className="text-sm text-slate-600 mb-4">
                  Upload quiz questions for the entire deck. Users can take this test to assess their knowledge across all concepts.
                  <strong className="block mt-1">Note: Uploading multiple files will ADD questions to the existing quiz.</strong>
                </p>

                {/* Current Quiz Status */}
                {deckHasQuiz && (
                  <Alert className="mb-4 bg-blue-50 border-blue-200">
                    <TestTube className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                      This deck has {deckQuizCount} quiz question{deckQuizCount !== 1 ? 's' : ''}.
                      Upload a new file to add more questions, or delete all questions using the button below.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-4">
                  {/* File Upload */}
                  <div className="space-y-2">
                    <Label htmlFor="deck-quiz-upload" className="text-slate-700">
                      Upload Quiz JSON File
                    </Label>
                    <Input
                      id="deck-quiz-upload"
                      type="file"
                      accept=".json"
                      onChange={handleDeckQuizFileSelect}
                      className="bg-white border-slate-300 cursor-pointer"
                      disabled={deckQuizLoading}
                    />
                    <p className="text-xs text-slate-500">
                      Expected format: Same as flashcard quiz JSON (see example below)
                    </p>
                  </div>

                  {/* Preview of loaded quiz */}
                  {deckQuizData && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-medium text-blue-900">
                            ✓ {deckQuizData.questions.length} question(s) loaded
                          </p>
                          <p className="text-sm text-blue-700">{deckQuizFileName}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setDeckQuizData(null);
                            setDeckQuizFileName("");
                          }}
                          className="text-blue-700 hover:bg-blue-100"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>

                      {/* Show first 2 questions preview */}
                      <div className="mt-3 space-y-2">
                        <p className="text-xs font-semibold text-blue-800">Preview:</p>
                        {deckQuizData.questions.slice(0, 2).map((q, idx) => (
                          <div key={idx} className="text-xs bg-white p-2 rounded border border-blue-200">
                            <p className="font-medium text-slate-800">{idx + 1}. {q.question}</p>
                            <p className="text-slate-600 mt-1">
                              {q.options.length} options •
                              {q.options.filter(o => o.isCorrect).length} correct answer(s)
                            </p>
                          </div>
                        ))}
                        {deckQuizData.questions.length > 2 && (
                          <p className="text-xs text-blue-600">
                            ... and {deckQuizData.questions.length - 2} more question(s)
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <Button
                      onClick={handleUploadDeckQuiz}
                      disabled={!deckQuizData || deckQuizLoading}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {deckQuizLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          {deckHasQuiz ? 'Add More Questions' : 'Upload Deck Quiz'}
                        </>
                      )}
                    </Button>

                    {deckHasQuiz && (
                      <Button
                        onClick={handleDeleteDeckQuiz}
                        disabled={deckQuizLoading}
                        variant="destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Deck Quiz
                      </Button>
                    )}
                  </div>

                  {/* JSON Format Example */}
                  <Collapsible>
                    <CollapsibleTrigger className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800">
                      <ChevronDown className="w-4 h-4" />
                      View Expected JSON Format
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-2">
                      <pre className="text-xs bg-slate-100 p-3 rounded border overflow-x-auto">
                        {JSON.stringify(DECK_QUIZ_JSON_EXAMPLE, null, 2)}
                      </pre>
                    </CollapsibleContent>
                  </Collapsible>

                  {/* Existing Deck Quiz Questions */}
                  {deckHasQuiz && (
                    <div className="mt-6 border-t pt-4">
                      <Label className="text-base font-semibold mb-3 block">
                        Manage Existing Questions
                      </Label>
                      <QuizQuestionList
                        questions={deckQuizQuestions}
                        onEdit={handleEditDeckQuestion}
                        onDelete={handleDeleteDeckQuizQuestion}
                        isLoading={loadingDeckQuiz}
                        emptyMessage="No quiz questions found."
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            )}

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
                          {/* Quiz Indicator */}
                          {card.quizQuestions && card.quizQuestions.length > 0 && (
                            <div className="mt-2 flex items-center justify-center">
                              <div className="flex items-center gap-1 bg-purple-50 border border-purple-200 rounded-md px-2 py-1">
                                <ClipboardList className="w-3 h-3 text-purple-600" />
                                <span className="text-xs font-medium text-purple-600">{card.quizQuestions.length}</span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Question Column */}
                        <div className="flex-1 border-r border-slate-200 pr-6">
                          <div className="flex items-start gap-2 mb-3">
                            <span className="text-sm font-medium text-slate-500">Q</span>
                            <div className="flex-1">
                              <FormattedContent
                                html={card.question}
                                className="text-blue-600 prose-strong:text-blue-700 prose-headings:text-blue-800"
                              />
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
                              <FormattedContent
                                html={card.answer}
                                className="text-slate-700 prose-strong:text-slate-900 prose-headings:text-slate-800"
                              />
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
        <DialogContent className="bg-white border-slate-200 text-slate-900 max-w-3xl">
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

          <div className="space-y-6 py-4 max-h-[60vh] overflow-y-auto pr-2">
            <div className="space-y-3">
              <RichTextEditor
                label="Question *"
                content={formData.question}
                onChange={(html) => setFormData({ ...formData, question: html })}
                placeholder="Enter the question... You can use formatting, lists, and tables."
                maxHeight="250px"
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
              <RichTextEditor
                label="Answer *"
                content={formData.answer}
                onChange={(html) => setFormData({ ...formData, answer: html })}
                placeholder="Enter the answer... You can use formatting, lists, and tables."
                maxHeight="250px"
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
              <div className="flex items-center gap-2">
                <Label className="text-base font-semibold">
                  Quiz/Test Questions (Optional)
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAiModalOpen(true)}
                  className="h-7 px-2"
                  title="Generate quiz questions using AI"
                >
                  <Sparkles className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-sm text-slate-600">
                Upload a JSON file with multiple-choice questions or use AI to generate them
              </p>

              <Input
                type="file"
                accept=".json"
                onChange={handleQuizFileSelect}
                className="bg-white border-slate-300 cursor-pointer"
              />

              {quizData && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-900">
                        ✓ {quizData.questions.length} question{quizData.questions.length !== 1 ? 's' : ''} loaded
                      </p>
                      <p className="text-xs text-blue-700 mt-1">{quizFileName}</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveQuiz}
                      className="text-blue-700 hover:text-blue-900 hover:bg-blue-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="mt-3 pt-3 border-t border-blue-200">
                    <p className="text-xs text-blue-700 font-medium mb-2">Preview:</p>
                    <div className="space-y-2">
                      {quizData.questions.slice(0, 2).map((q, idx) => (
                        <div key={idx} className="text-xs text-blue-800">
                          <p className="font-medium">Q{idx + 1}: {q.question}</p>
                          <p className="text-blue-600 ml-2 mt-1">
                            {q.options.length} options, {q.options.filter(o => o.isCorrect).length} correct
                          </p>
                        </div>
                      ))}
                      {quizData.questions.length > 2 && (
                        <p className="text-xs text-blue-600 italic">
                          +{quizData.questions.length - 2} more question(s)...
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <details className="text-xs text-slate-600">
                <summary className="cursor-pointer font-medium text-slate-700 hover:text-slate-900">
                  Expected JSON Format
                </summary>
                <pre className="mt-2 p-3 bg-slate-100 rounded border border-slate-200 overflow-x-auto">
                  {JSON.stringify(FLASHCARD_QUIZ_JSON_EXAMPLE, null, 2)}
                </pre>
              </details>
            </div>

            {/* Existing Quiz Questions List */}
            {editingCard && (
              <div className="space-y-3">
                <div className="border-t pt-4">
                  <Label className="text-base font-semibold mb-3 block">
                    Manage Existing Questions
                  </Label>
                  <QuizQuestionList
                    questions={flashcardQuizQuestions}
                    onEdit={handleEditFlashcardQuestion}
                    onDelete={handleDeleteFlashcardQuizQuestion}
                    isLoading={loadingFlashcardQuiz}
                    emptyMessage="No quiz questions yet. Upload a JSON file or use AI to generate questions."
                  />
                </div>
              </div>
            )}

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

      {/* AI Quiz Generation Modal */}
      <AiQuizGenerationModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onGenerate={(topic, questions) => {
          setQuizData(questions);
          setQuizFileName(`AI: ${topic}`);
          setIsAiModalOpen(false);
          toast.success(`Loaded ${questions.questions.length} AI-generated questions`);
        }}
        generationType="flashcard"
        targetFlashcardId={editingCard?.id}
      />

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

      {/* Flashcard Quiz Question Edit Dialog */}
      <QuizQuestionEditDialog
        question={editingFlashcardQuestion}
        isOpen={isFlashcardQuizEditDialogOpen}
        onOpenChange={setIsFlashcardQuizEditDialogOpen}
        onSave={handleSaveFlashcardQuizQuestion}
        isSaving={savingFlashcardQuizEdit}
        isDeckQuiz={false}
      />

      {/* Deck Quiz Question Edit Dialog */}
      <QuizQuestionEditDialog
        question={editingDeckQuestion}
        isOpen={isDeckQuizEditDialogOpen}
        onOpenChange={setIsDeckQuizEditDialogOpen}
        onSave={handleSaveDeckQuizQuestion}
        isSaving={savingDeckQuizEdit}
        isDeckQuiz={true}
      />

      {/* Global Styles for Formatted Content */}
      <style jsx global>{`
        /* Rich text content styling for admin flashcard display */
        .prose h1, .prose h2, .prose h3, .prose h4, .prose h5, .prose h6 {
          font-weight: 600;
          margin-top: 0.75rem;
          margin-bottom: 0.5rem;
        }

        .prose h1 {
          font-size: 1.5rem;
        }

        .prose h2 {
          font-size: 1.25rem;
        }

        .prose h3 {
          font-size: 1.125rem;
        }

        .prose p {
          margin-top: 0.5rem;
          margin-bottom: 0.5rem;
          line-height: 1.6;
        }

        .prose ul,
        .prose ol {
          padding-left: 1.5rem;
          margin-top: 0.5rem;
          margin-bottom: 0.5rem;
        }

        .prose ul {
          list-style-type: disc;
        }

        .prose ol {
          list-style-type: decimal;
        }

        .prose li {
          margin-top: 0.25rem;
          margin-bottom: 0.25rem;
        }

        .prose strong {
          font-weight: 600;
        }

        .prose em {
          font-style: italic;
        }

        .prose code {
          background-color: #e2e8f0;
          padding: 0.2rem 0.4rem;
          border-radius: 0.25rem;
          font-size: 0.9em;
          font-family: monospace;
          color: #1e293b;
        }

        .prose pre {
          background-color: #f1f5f9;
          padding: 1rem;
          border-radius: 0.5rem;
          overflow-x: auto;
          margin: 0.75rem 0;
        }

        .prose pre code {
          background: none;
          padding: 0;
        }

        /* Table styling for admin flashcards */
        .prose table,
        .prose .tiptap-table {
          border-collapse: collapse;
          table-layout: auto;
          width: 100%;
          margin: 1rem 0;
          overflow: hidden;
          border-radius: 0.5rem;
          border: 1px solid #cbd5e1;
        }

        .prose table td,
        .prose table th,
        .prose .tiptap-table td,
        .prose .tiptap-table th {
          min-width: 3em;
          border: 1px solid #cbd5e1;
          padding: 8px 12px;
          vertical-align: top;
          box-sizing: border-box;
          position: relative;
          background-color: #ffffff;
        }

        .prose table th,
        .prose .tiptap-table th {
          font-weight: 600;
          text-align: left;
          background-color: #f1f5f9;
          color: #1e293b;
        }

        .prose blockquote {
          border-left: 4px solid #cbd5e1;
          padding-left: 1rem;
          margin: 1rem 0;
          font-style: italic;
          color: #64748b;
        }

        .prose a {
          color: #3b82f6;
          text-decoration: underline;
        }

        .prose a:hover {
          color: #2563eb;
        }
      `}</style>
    </div>
  );
}
