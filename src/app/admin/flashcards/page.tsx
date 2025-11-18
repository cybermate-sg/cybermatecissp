"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Loader2, Trash } from "lucide-react";
import { toast } from "sonner";
import { MultiImageUpload, MediaFile } from "@/components/admin/MultiImageUpload";
import { ImageLightbox } from "@/components/admin/ImageLightbox";
import RichTextEditor from "@/components/admin/RichTextEditor";

// Updated interfaces for Class → Deck structure
interface Class {
  id: string;
  name: string;
  description: string | null;
  order: number;
  icon: string | null;
  color: string | null;
  decks: Deck[];
}

interface Deck {
  id: string;
  name: string;
  description: string | null;
  cardCount: number;
  order: number;
  isPremium: boolean;
  classId: string;
  class?: Class;
}

interface Flashcard {
  id: string;
  deckId: string;
  question: string;
  answer: string;
  explanation?: string;
  order: number;
  isPublished: boolean;
  media?: MediaFile[];
  deck?: Deck;
}

export default function AdminFlashcardsPage() {
  const [selectedDeckId] = useState<string>("");
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null);

  // Class/Deck data (simplified from Domain/Topic/Deck)
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>("");

  // Image state
  const [questionImages, setQuestionImages] = useState<MediaFile[]>([]);
  const [answerImages, setAnswerImages] = useState<MediaFile[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  // Lightbox state
  const [lightboxImages, setLightboxImages] = useState<MediaFile[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);

  // Cleanup state
  const [cleanupDialogOpen, setCleanupDialogOpen] = useState(false);
  const [orphanedImages, setOrphanedImages] = useState<string[]>([]);
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [cleanupStats, setCleanupStats] = useState<{
    totalBlobFiles: number;
    totalDbFiles: number;
    orphanedCount: number;
  } | null>(null);

  // Form state (removed difficulty field)
  const [formData, setFormData] = useState({
    question: "",
    answer: "",
    explanation: "",
    deckId: "",
  });

  const loadClasses = async () => {
    try {
      // Fetch all classes with full hierarchy from admin endpoint
      const res = await fetch('/api/admin/classes');
      if (!res.ok) throw new Error("Failed to load classes");
      const data = await res.json();

      setClasses(data.classes || []);
    } catch (error) {
      console.error("Failed to load classes:", error);
      toast.error("Failed to load classes");
    }
  };

  const loadFlashcards = async (deckId?: string) => {
    setLoading(true);
    try {
      const url = deckId
        ? `/api/admin/flashcards?deckId=${deckId}`
        : '/api/admin/flashcards';
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to load flashcards");
      const data = await res.json();
      setFlashcards(data.flashcards || []);
    } catch {
      toast.error("Failed to load flashcards");
    } finally {
      setLoading(false);
    }
  };

  // Load classes and flashcards on page mount
  useEffect(() => {
    loadClasses();
    loadFlashcards();
  }, []);


  const uploadImages = async (images: MediaFile[], flashcardId: string): Promise<MediaFile[]> => {
    const uploadedMedia: MediaFile[] = [];

    for (const image of images) {
      // Skip already uploaded images (when editing)
      if (image.url && !image.file) {
        uploadedMedia.push(image);
        continue;
      }

      if (!image.file) continue;

      try {
        const formData = new FormData();
        formData.append('file', image.file);
        formData.append('flashcardId', flashcardId);
        formData.append('placement', image.placement);
        formData.append('order', image.order.toString());

        const res = await fetch('/api/admin/upload', {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) throw new Error('Failed to upload image');

        const data = await res.json();
        uploadedMedia.push({
          url: data.url,
          key: data.key,
          fileName: data.fileName,
          fileSize: data.fileSize,
          mimeType: data.mimeType,
          placement: image.placement,
          order: image.order,
          altText: image.altText,
        });
      } catch (error) {
        console.error('Error uploading image:', error);
        toast.error(`Failed to upload ${image.fileName}`);
      }
    }

    return uploadedMedia;
  };

  const handleCreateOrUpdate = async () => {
    if (!formData.question || !formData.answer || !formData.deckId) {
      toast.error("Question, answer, and deck are required");
      return;
    }

    setLoading(true);
    setUploadingImages(true);

    try {
      // Upload images first
      const allImages = [...questionImages, ...answerImages];
      const uploadedMedia = await uploadImages(allImages, editingCard?.id || 'temp');

      const url = editingCard
        ? `/api/admin/flashcards/${editingCard.id}`
        : "/api/admin/flashcards";

      const method = editingCard ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          media: uploadedMedia,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to save flashcard");
      }

      toast.success(editingCard ? "Flashcard updated" : "Flashcard created");
      setDialogOpen(false);
      resetForm();

      // Reload all flashcards
      loadFlashcards();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to save flashcard";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      setUploadingImages(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this flashcard?")) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/flashcards/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete flashcard");

      toast.success("Flashcard deleted");

      if (selectedDeckId) {
        loadFlashcards(selectedDeckId);
      }
    } catch {
      toast.error("Failed to delete flashcard");
    } finally {
      setLoading(false);
    }
  };

  const openEditDialog = (card: Flashcard) => {
    setEditingCard(card);
    setFormData({
      question: card.question,
      answer: card.answer,
      explanation: card.explanation || "",
      deckId: card.deckId,
    });

    // Set images if available
    if (card.media) {
      const questionMedia = card.media.filter(m => m.placement === 'question');
      const answerMedia = card.media.filter(m => m.placement === 'answer');
      setQuestionImages(questionMedia);
      setAnswerImages(answerMedia);
    } else {
      setQuestionImages([]);
      setAnswerImages([]);
    }

    // Set class based on the card's deck data
    if (card.deck?.class) {
      setSelectedClassId(card.deck.class.id);
    } else {
      // Fallback: Find the class for the deck
      for (const cls of classes) {
        const deck = cls.decks.find(d => d.id === card.deckId);
        if (deck) {
          setSelectedClassId(cls.id);
          break;
        }
      }
    }

    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingCard(null);
    setSelectedClassId("");
    setQuestionImages([]);
    setAnswerImages([]);
    setFormData({
      question: "",
      answer: "",
      explanation: "",
      deckId: "",
    });
  };

  const handleClassChange = (classId: string) => {
    setSelectedClassId(classId);
    setFormData({ ...formData, deckId: "" });
  };

  const handleDeckChange = (deckId: string) => {
    setFormData({ ...formData, deckId });
  };

  const handleImageClick = (images: MediaFile[], index: number) => {
    setLightboxImages(images);
    setLightboxIndex(index);
    setShowLightbox(true);
  };

  const scanForOrphanedImages = async () => {
    setCleanupLoading(true);
    try {
      const res = await fetch('/api/admin/cleanup');
      if (!res.ok) throw new Error('Failed to scan for orphaned images');

      const data = await res.json();
      setOrphanedImages(data.orphanedImages || []);
      setCleanupStats({
        totalBlobFiles: data.totalBlobFiles,
        totalDbFiles: data.totalDbFiles,
        orphanedCount: data.orphanedCount,
      });

      if (data.orphanedCount === 0) {
        toast.success('No orphaned images found!');
      } else {
        toast.info(`Found ${data.orphanedCount} orphaned image(s)`);
      }
    } catch (error) {
      console.error('Error scanning for orphaned images:', error);
      toast.error('Failed to scan for orphaned images');
    } finally {
      setCleanupLoading(false);
    }
  };

  const cleanupOrphanedImages = async () => {
    if (orphanedImages.length === 0) {
      toast.info('No orphaned images to clean up');
      return;
    }

    setCleanupLoading(true);
    try {
      const res = await fetch('/api/admin/cleanup', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orphanedImages }),
      });

      if (!res.ok) throw new Error('Failed to clean up orphaned images');

      const data = await res.json();
      toast.success(data.message || 'Orphaned images cleaned up successfully');

      // Reset cleanup state
      setOrphanedImages([]);
      setCleanupStats(null);
      setCleanupDialogOpen(false);
    } catch (error) {
      console.error('Error cleaning up orphaned images:', error);
      toast.error('Failed to clean up orphaned images');
    } finally {
      setCleanupLoading(false);
    }
  };

  // Get filtered decks based on class selection
  const selectedClass = classes.find(c => c.id === selectedClassId);
  const availableDecks = selectedClass?.decks || [];

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Manage Flashcards
            </h1>
            <p className="text-gray-300">
              Create, edit, and organize flashcards
            </p>
          </div>

          <div className="flex gap-2">
            <Dialog open={cleanupDialogOpen} onOpenChange={setCleanupDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                  onClick={scanForOrphanedImages}
                >
                  <Trash className="w-4 h-4 mr-2" />
                  Cleanup Images
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-800 border-slate-700 text-white">
                <DialogHeader>
                  <DialogTitle>Cleanup Orphaned Images</DialogTitle>
                  <DialogDescription className="text-gray-400">
                    Remove images from storage that are not linked to any flashcard
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 mt-4">
                  {cleanupLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                      <span className="ml-2 text-gray-300">Scanning for orphaned images...</span>
                    </div>
                  ) : cleanupStats ? (
                    <div className="space-y-4">
                      <div className="bg-slate-700 rounded p-4 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Total files in storage:</span>
                          <span className="text-white font-semibold">{cleanupStats.totalBlobFiles}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Files in database:</span>
                          <span className="text-white font-semibold">{cleanupStats.totalDbFiles}</span>
                        </div>
                        <div className="flex justify-between border-t border-slate-600 pt-2">
                          <span className="text-gray-400">Orphaned images:</span>
                          <span className={`font-semibold ${cleanupStats.orphanedCount > 0 ? 'text-yellow-500' : 'text-green-500'}`}>
                            {cleanupStats.orphanedCount}
                          </span>
                        </div>
                      </div>

                      {orphanedImages.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm text-gray-400">Orphaned images found:</p>
                          <div className="bg-slate-700 rounded p-3 max-h-40 overflow-y-auto">
                            {orphanedImages.slice(0, 10).map((url, index) => (
                              <div key={index} className="text-xs text-gray-300 truncate">
                                {url.split('/').pop()}
                              </div>
                            ))}
                            {orphanedImages.length > 10 && (
                              <div className="text-xs text-gray-500 mt-1">
                                ... and {orphanedImages.length - 10} more
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2 justify-end pt-4">
                        <Button
                          variant="outline"
                          onClick={() => setCleanupDialogOpen(false)}
                          className="border-slate-600 text-slate-300"
                        >
                          Cancel
                        </Button>
                        {orphanedImages.length > 0 && (
                          <Button
                            onClick={cleanupOrphanedImages}
                            className="bg-red-600 hover:bg-red-700"
                            disabled={cleanupLoading}
                          >
                            {cleanupLoading ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Cleaning...
                              </>
                            ) : (
                              <>
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete {orphanedImages.length} Image(s)
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      Click the button above to scan for orphaned images
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={dialogOpen} onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-purple-600 to-purple-700">
                  <Plus className="w-4 h-4 mr-2" />
                  New Flashcard
                </Button>
              </DialogTrigger>
            <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingCard ? "Edit Flashcard" : "Create New Flashcard"}
                </DialogTitle>
                <DialogDescription className="text-gray-400">
                  Fill in the flashcard details below
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 mt-4 pb-4">
                {/* Class Selection */}
                <div>
                  <Label htmlFor="class">Class (Required)</Label>
                  <Select
                    value={selectedClassId}
                    onValueChange={handleClassChange}
                  >
                    <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                      <SelectValue placeholder="Select a class..." />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {classes.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.icon && `${cls.icon} `}{cls.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Deck Selection */}
                <div>
                  <Label htmlFor="deck">Deck (Required)</Label>
                  <Select
                    value={formData.deckId}
                    onValueChange={handleDeckChange}
                    disabled={!selectedClassId}
                  >
                    <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                      <SelectValue placeholder={selectedClassId ? "Select a deck..." : "Select class first"} />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {availableDecks.map((deck) => (
                        <SelectItem key={deck.id} value={deck.id}>
                          {deck.name} ({deck.cardCount} cards)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <RichTextEditor
                    label="Question (Required)"
                    content={formData.question}
                    onChange={(html) => setFormData({ ...formData, question: html })}
                    placeholder="Enter the question... You can use formatting, lists, and tables."
                  />

                  {/* Question Images */}
                  <div className="mt-3">
                    <Label className="text-sm text-gray-400 mb-2 block">
                      Question Images (Optional - Max 5)
                    </Label>
                    <MultiImageUpload
                      placement="question"
                      maxImages={5}
                      existingImages={questionImages}
                      onImagesChange={setQuestionImages}
                    />
                  </div>
                </div>

                <div>
                  <RichTextEditor
                    label="Answer (Required)"
                    content={formData.answer}
                    onChange={(html) => setFormData({ ...formData, answer: html })}
                    placeholder="Enter the answer... You can use formatting, lists, and tables."
                  />

                  {/* Answer Images */}
                  <div className="mt-3">
                    <Label className="text-sm text-gray-400 mb-2 block">
                      Answer Images (Optional - Max 5)
                    </Label>
                    <MultiImageUpload
                      placement="answer"
                      maxImages={5}
                      existingImages={answerImages}
                      onImagesChange={setAnswerImages}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="explanation">Explanation (Optional)</Label>
                  <Textarea
                    id="explanation"
                    placeholder="Additional context or tips..."
                    value={formData.explanation}
                    onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                    className="bg-slate-900 border-slate-700 text-white"
                  />
                </div>

                <div className="flex justify-end gap-2 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setDialogOpen(false);
                      resetForm();
                    }}
                    className="border-slate-700 text-white"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateOrUpdate}
                    disabled={loading || uploadingImages}
                    className="bg-gradient-to-r from-purple-600 to-purple-700"
                  >
                    {(loading || uploadingImages) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {uploadingImages ? "Uploading..." : editingCard ? "Update" : "Create"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          </div>
        </div>
      </div>

      {/* Flashcards List */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Flashcards</CardTitle>
          <CardDescription className="text-gray-400">
            {flashcards.length} flashcards
            {selectedDeckId && " in selected deck"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            </div>
          ) : flashcards.length === 0 ? (
            <p className="text-gray-400 text-center py-8">
              No flashcards yet. Create your first one!
            </p>
          ) : (
            <div className="space-y-4">
              {flashcards.map((card) => (
                <div
                  key={card.id}
                  className="p-4 bg-slate-900/50 rounded-lg border border-slate-700"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      {/* Show Class/Deck info if available */}
                      {card.deck && (
                        <div className="mb-2 flex flex-wrap gap-2">
                          {card.deck.class && (
                            <Badge variant="outline" className="text-xs text-blue-400 border-blue-400">
                              {card.deck.class.icon && `${card.deck.class.icon} `}
                              {card.deck.class.name}
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-xs text-green-400 border-green-400">
                            {card.deck.name}
                          </Badge>
                        </div>
                      )}
                      <div className="mb-2">
                        <span className="text-xs text-gray-400">Question:</span>
                        <p className="text-white mt-1">{card.question}</p>

                        {/* Question Images */}
                        {card.media && card.media.filter(m => m.placement === 'question').length > 0 && (
                          <div className="flex gap-2 mt-2 flex-wrap">
                            {card.media
                              .filter(m => m.placement === 'question')
                              .sort((a, b) => a.order - b.order)
                              .map((img, index) => {
                                const questionImages = card.media!.filter(m => m.placement === 'question').sort((a, b) => a.order - b.order);
                                return (
                                  <div
                                    key={img.id}
                                    className="relative group cursor-pointer"
                                    title={img.altText || img.fileName}
                                    onClick={() => handleImageClick(questionImages, index)}
                                  >
                                    <Image
                                      src={img.url || ''}
                                      alt={img.altText || 'Question image'}
                                      width={80}
                                      height={80}
                                      className="w-20 h-20 object-cover rounded border border-slate-600 hover:border-purple-500 transition-colors"
                                    />
                                    <div className="absolute top-1 left-1 bg-purple-500/90 text-white text-xs px-1 rounded">
                                      #{img.order + 1}
                                    </div>
                                  </div>
                                );
                              })
                            }
                          </div>
                        )}
                      </div>

                      <div className="mb-2">
                        <span className="text-xs text-gray-400">Answer:</span>
                        <p className="text-gray-300 mt-1">{card.answer}</p>

                        {/* Answer Images */}
                        {card.media && card.media.filter(m => m.placement === 'answer').length > 0 && (
                          <div className="flex gap-2 mt-2 flex-wrap">
                            {card.media
                              .filter(m => m.placement === 'answer')
                              .sort((a, b) => a.order - b.order)
                              .map((img, index) => {
                                const answerImages = card.media!.filter(m => m.placement === 'answer').sort((a, b) => a.order - b.order);
                                return (
                                  <div
                                    key={img.id}
                                    className="relative group cursor-pointer"
                                    title={img.altText || img.fileName}
                                    onClick={() => handleImageClick(answerImages, index)}
                                  >
                                    <Image
                                      src={img.url || ''}
                                      alt={img.altText || 'Answer image'}
                                      width={80}
                                      height={80}
                                      className="w-20 h-20 object-cover rounded border border-slate-600 hover:border-purple-500 transition-colors"
                                    />
                                    <div className="absolute top-1 left-1 bg-purple-500/90 text-white text-xs px-1 rounded">
                                      #{img.order + 1}
                                    </div>
                                  </div>
                                );
                              })
                            }
                          </div>
                        )}
                      </div>

                      {card.explanation && (
                        <div>
                          <span className="text-xs text-gray-400">Explanation:</span>
                          <p className="text-gray-400 text-sm mt-1">{card.explanation}</p>
                        </div>
                      )}
                      <div className="flex items-center gap-4 mt-2">
                        <span className={`text-xs px-2 py-1 rounded ${
                          card.isPublished
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {card.isPublished ? 'Published' : 'Draft'}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEditDialog(card)}
                        className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(card.id)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
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

      {/* Image Lightbox */}
      {showLightbox && (
        <ImageLightbox
          images={lightboxImages}
          currentIndex={lightboxIndex}
          onClose={() => setShowLightbox(false)}
          onNavigate={setLightboxIndex}
        />
      )}
    </div>
  );
}
