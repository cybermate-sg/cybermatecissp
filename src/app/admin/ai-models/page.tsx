'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Pencil, Trash2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface AIModel {
  id: string;
  modelId: string;
  name: string;
  provider: string | null;
  priority: number;
  enabled: boolean;
  timeoutMs: number | null;
  temperature: string | null;
  maxTokens: number | null;
  costPer1kTokens: string | null;
  isFree: boolean;
  description: string | null;
  successCount: number | null;
  failureCount: number | null;
  avgResponseTimeMs: number | null;
  lastUsedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export default function AIModelsPage() {
  const [models, setModels] = useState<AIModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingModel, setEditingModel] = useState<AIModel | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    fetchModels();
  }, []);

  const fetchModels = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/ai-models');
      if (!res.ok) throw new Error('Failed to fetch models');
      const data = await res.json();
      setModels(data.models);
    } catch (error) {
      console.error('Error fetching models:', error);
      toast.error('Failed to load AI models');
    } finally {
      setLoading(false);
    }
  };

  const handleSeed = async () => {
    try {
      const res = await fetch('/api/admin/ai-models/seed', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to seed models');
      const data = await res.json();
      toast.success(data.message);
      fetchModels();
    } catch (error) {
      console.error('Error seeding models:', error);
      toast.error('Failed to seed models');
    }
  };

  const handleToggle = async (model: AIModel) => {
    try {
      const res = await fetch(`/api/admin/ai-models/${model.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !model.enabled }),
      });

      if (!res.ok) throw new Error('Failed to update model');

      toast.success(`${model.name} ${!model.enabled ? 'enabled' : 'disabled'}`);
      fetchModels();
    } catch (error) {
      console.error('Error toggling model:', error);
      toast.error('Failed to update model');
    }
  };

  const handleDelete = async (model: AIModel) => {
    if (!confirm(`Are you sure you want to delete ${model.name}?`)) return;

    try {
      const res = await fetch(`/api/admin/ai-models/${model.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete model');

      toast.success(`${model.name} deleted`);
      fetchModels();
    } catch (error) {
      console.error('Error deleting model:', error);
      toast.error('Failed to delete model');
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const modelData = {
      modelId: formData.get('modelId') as string,
      name: formData.get('name') as string,
      provider: formData.get('provider') as string,
      priority: parseInt(formData.get('priority') as string),
      timeoutMs: parseInt(formData.get('timeoutMs') as string) || null,
      temperature: parseFloat(formData.get('temperature') as string) || null,
      maxTokens: parseInt(formData.get('maxTokens') as string) || null,
      costPer1kTokens: parseFloat(formData.get('costPer1kTokens') as string) || null,
      isFree: formData.get('isFree') === 'on',
      description: formData.get('description') as string,
      enabled: true,
    };

    try {
      const url = editingModel
        ? `/api/admin/ai-models/${editingModel.id}`
        : '/api/admin/ai-models';

      const method = editingModel ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(modelData),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to save model');
      }

      toast.success(editingModel ? 'Model updated' : 'Model created');
      setIsDialogOpen(false);
      setEditingModel(null);
      fetchModels();
    } catch (error) {
      console.error('Error saving model:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save model');
    }
  };

  const calculateSuccessRate = (model: AIModel) => {
    const total = (model.successCount || 0) + (model.failureCount || 0);
    if (total === 0) return 'N/A';
    return `${Math.round(((model.successCount || 0) / total) * 100)}%`;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">AI Model Configuration</h1>
          <p className="text-muted-foreground">
            Manage AI models used for quiz generation
          </p>
        </div>
        <div className="flex gap-2">
          {models.length === 0 && (
            <Button onClick={handleSeed} variant="outline">
              Seed Default Models
            </Button>
          )}
          <Button onClick={fetchModels} variant="outline" size="icon">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingModel(null)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Model
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingModel ? 'Edit Model' : 'Add New Model'}
                </DialogTitle>
                <DialogDescription>
                  Configure an AI model for quiz generation
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="modelId">Model ID *</Label>
                    <Input
                      id="modelId"
                      name="modelId"
                      placeholder="e.g., meta-llama/llama-3.2-3b-instruct:free"
                      defaultValue={editingModel?.modelId}
                      required
                      disabled={!!editingModel}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Display Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="e.g., Llama 3.2 3B"
                      defaultValue={editingModel?.name}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="provider">Provider</Label>
                    <Input
                      id="provider"
                      name="provider"
                      placeholder="e.g., meta-llama"
                      defaultValue={editingModel?.provider || ''}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority *</Label>
                    <Input
                      id="priority"
                      name="priority"
                      type="number"
                      placeholder="1 = highest"
                      defaultValue={editingModel?.priority || 100}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="timeoutMs">Timeout (ms)</Label>
                    <Input
                      id="timeoutMs"
                      name="timeoutMs"
                      type="number"
                      placeholder="60000"
                      defaultValue={editingModel?.timeoutMs || ''}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="temperature">Temperature</Label>
                    <Input
                      id="temperature"
                      name="temperature"
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      placeholder="0.7"
                      defaultValue={editingModel?.temperature || ''}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxTokens">Max Tokens</Label>
                    <Input
                      id="maxTokens"
                      name="maxTokens"
                      type="number"
                      placeholder="2000"
                      defaultValue={editingModel?.maxTokens || ''}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="costPer1kTokens">Cost per 1k Tokens</Label>
                    <Input
                      id="costPer1kTokens"
                      name="costPer1kTokens"
                      type="number"
                      step="0.000001"
                      placeholder="0.000"
                      defaultValue={editingModel?.costPer1kTokens || ''}
                    />
                  </div>
                  <div className="space-y-2 flex items-end">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="isFree"
                        name="isFree"
                        defaultChecked={editingModel?.isFree !== false}
                        className="h-4 w-4"
                      />
                      <Label htmlFor="isFree">Free Tier Model</Label>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Notes about this model..."
                    defaultValue={editingModel?.description || ''}
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      setEditingModel(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingModel ? 'Update' : 'Create'} Model
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading models...</div>
      ) : models.length === 0 ? (
        <div className="text-center py-12 space-y-4">
          <p className="text-muted-foreground">No AI models configured yet</p>
          <Button onClick={handleSeed}>Seed Default Models</Button>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Enabled</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Timeout</TableHead>
                <TableHead>Success Rate</TableHead>
                <TableHead>Avg Time</TableHead>
                <TableHead>Last Used</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {models.map((model) => (
                <TableRow key={model.id}>
                  <TableCell>
                    <Switch
                      checked={model.enabled}
                      onCheckedChange={() => handleToggle(model)}
                    />
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{model.priority}</Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{model.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {model.modelId}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{model.provider || '-'}</TableCell>
                  <TableCell>
                    {model.timeoutMs ? `${model.timeoutMs / 1000}s` : '-'}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        calculateSuccessRate(model) === 'N/A'
                          ? 'secondary'
                          : parseInt(calculateSuccessRate(model)) > 80
                          ? 'default'
                          : 'destructive'
                      }
                    >
                      {calculateSuccessRate(model)}
                    </Badge>
                    <div className="text-xs text-muted-foreground">
                      {model.successCount || 0}✓ / {model.failureCount || 0}✗
                    </div>
                  </TableCell>
                  <TableCell>
                    {model.avgResponseTimeMs
                      ? `${(model.avgResponseTimeMs / 1000).toFixed(1)}s`
                      : '-'}
                  </TableCell>
                  <TableCell>
                    {model.lastUsedAt
                      ? new Date(model.lastUsedAt).toLocaleDateString()
                      : 'Never'}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingModel(model);
                          setIsDialogOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(model)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
