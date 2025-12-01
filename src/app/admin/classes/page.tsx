"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Plus, Edit2, Trash2, BookOpen, GripVertical, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { ClassFormDialog } from "./components/ClassFormDialog";

interface Class {
  id: string;
  name: string;
  description: string | null;
  order: number;
  icon: string | null;
  color: string | null;
  isPublished: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  deckCount?: number;
}

interface ClassFormData {
  name: string;
  description: string;
  order: number;
  icon: string;
  color: string;
  isPublished: boolean;
}

const getColorClass = (color: string | null) => {
  const colorMap: { [key: string]: string } = {
    purple: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    blue: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    green: "bg-green-500/20 text-green-400 border-green-500/30",
    red: "bg-red-500/20 text-red-400 border-red-500/30",
    orange: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    yellow: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    pink: "bg-pink-500/20 text-pink-400 border-pink-500/30",
    indigo: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
    teal: "bg-teal-500/20 text-teal-400 border-teal-500/30",
  };
  return colorMap[color || "purple"] || colorMap.purple;
};

export default function AdminClassesPage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [deletingClass, setDeletingClass] = useState<Class | null>(null);
  const [formData, setFormData] = useState<ClassFormData>({
    name: "",
    description: "",
    order: 0,
    icon: "📚",
    color: "purple",
    isPublished: true,
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/classes");
      if (!res.ok) throw new Error("Failed to load classes");
      const data = await res.json();

      // Fetch deck counts for each class
      const classesWithCounts = await Promise.all(
        (data.classes || []).map(async (cls: Class) => {
          try {
            const deckRes = await fetch(`/api/admin/classes/${cls.id}`);
            if (deckRes.ok) {
              const deckData = await deckRes.json();
              return { ...cls, deckCount: deckData.decks?.length || 0 };
            }
          } catch (err) {
            console.error("Failed to load deck count for class:", cls.id, err);
          }
          return { ...cls, deckCount: 0 };
        })
      );

      setClasses(classesWithCounts);
    } catch (error) {
      console.error("Error loading classes:", error);
      toast.error("Failed to load classes");
    } finally {
      setLoading(false);
    }
  };

  const openCreateDialog = () => {
    setEditingClass(null);
    setFormData({
      name: "",
      description: "",
      order: classes.length,
      icon: "📚",
      color: "purple",
      isPublished: true,
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (cls: Class) => {
    setEditingClass(cls);
    setFormData({
      name: cls.name,
      description: cls.description || "",
      order: cls.order,
      icon: cls.icon || "📚",
      color: cls.color || "purple",
      isPublished: cls.isPublished,
    });
    setIsDialogOpen(true);
  };

  const openDeleteDialog = (cls: Class) => {
    setDeletingClass(cls);
    setIsDeleteDialogOpen(true);
  };

  const handleSaveClass = async () => {
    if (!formData.name.trim()) {
      toast.error("Class name is required");
      return;
    }

    setIsSaving(true);
    try {
      const url = editingClass
        ? `/api/admin/classes/${editingClass.id}`
        : "/api/admin/classes";
      const method = editingClass ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to save class");
      }

      toast.success(editingClass ? "Class updated successfully" : "Class created successfully");
      setIsDialogOpen(false);
      loadClasses();
    } catch (error) {
      console.error("Error saving class:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save class");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClass = async () => {
    if (!deletingClass) return;

    setIsSaving(true);
    try {
      const res = await fetch(`/api/admin/classes/${deletingClass.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete class");
      }

      toast.success("Class deleted successfully");
      setIsDeleteDialogOpen(false);
      setDeletingClass(null);
      loadClasses();
    } catch (error) {
      console.error("Error deleting class:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete class");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            Manage Classes
          </h1>
          <p className="text-gray-300">
            Create and organize CISSP study classes
          </p>
        </div>
        <Button
          onClick={openCreateDialog}
          className="bg-purple-600 hover:bg-purple-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Class
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-400">
              Total Classes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{classes.length}</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-400">
              Published Classes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">
              {classes.filter((c) => c.isPublished).length}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-400">
              Total Decks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">
              {classes.reduce((sum, c) => sum + (c.deckCount || 0), 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Classes List */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">All Classes</CardTitle>
          <CardDescription className="text-gray-400">
            Manage your CISSP classes and their content
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            </div>
          ) : classes.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 mb-4">No classes created yet</p>
              <Button
                onClick={openCreateDialog}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Class
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {classes.map((cls) => (
                <div
                  key={cls.id}
                  className={`p-4 rounded-lg border transition-all ${getColorClass(cls.color)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="flex items-center gap-2">
                        <GripVertical className="w-4 h-4 text-gray-500 cursor-move" />
                        <span className="text-2xl">{cls.icon}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-white text-lg">
                            {cls.name}
                          </h3>
                          {!cls.isPublished && (
                            <span className="text-xs px-2 py-1 rounded bg-gray-700 text-gray-300">
                              Draft
                            </span>
                          )}
                        </div>
                        {cls.description && (
                          <p className="text-sm text-gray-300 mb-2">
                            {cls.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-gray-400">
                          <span>Order: {cls.order}</span>
                          <span>•</span>
                          <span>{cls.deckCount || 0} deck{cls.deckCount !== 1 ? 's' : ''}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link href={`/admin/classes/${cls.id}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-slate-700 text-gray-300 hover:bg-slate-700"
                        >
                          <BookOpen className="w-4 h-4 mr-2" />
                          Manage Decks
                          <ChevronRight className="w-4 h-4 ml-2" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(cls)}
                        className="text-gray-300 hover:text-white hover:bg-slate-700"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDeleteDialog(cls)}
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
      <ClassFormDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        editingClass={editingClass}
        formData={formData}
        setFormData={setFormData}
        onSave={handleSaveClass}
        isSaving={isSaving}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>Delete Class</DialogTitle>
            <DialogDescription className="text-gray-400">
              Are you sure you want to delete &quot;{deletingClass?.name}&quot;?
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
              <p className="text-sm text-red-300">
                <strong>Warning:</strong> This will permanently delete the class and all its decks and flashcards.
                This action cannot be undone.
              </p>
              {deletingClass && deletingClass.deckCount && deletingClass.deckCount > 0 && (
                <p className="text-sm text-red-300 mt-2">
                  This class contains {deletingClass.deckCount} deck{deletingClass.deckCount !== 1 ? 's' : ''} which will also be deleted.
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setDeletingClass(null);
              }}
              disabled={isSaving}
              className="border-slate-700 text-gray-300 hover:bg-slate-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteClass}
              disabled={isSaving}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Class"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
