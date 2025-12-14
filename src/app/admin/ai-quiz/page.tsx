'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sparkles,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  Settings
} from 'lucide-react';
import { toast } from 'sonner';

interface QuotaData {
  dailyQuotaLimit: number;
  generationsUsedToday: number;
  remainingGenerations: number;
  isQuotaExceeded: boolean;
  resetTime: string;
  config: {
    flashcardQuestionsDefault: number;
    deckQuestionsDefault: number;
    quotaResetHour: number;
    isEnabled: boolean;
    notes?: string;
  };
  recentGenerations: Array<{
    id: string;
    topic: string;
    generationType: string;
    numQuestionsGenerated: number;
    status: string;
    errorMessage?: string;
    tokensUsed?: number;
    costUsd?: string;
    responseTimeMs?: number;
    createdAt: string;
  }>;
}

interface LogEntry {
  id: string;
  topic: string;
  generationType: string;
  numQuestionsGenerated: number;
  status: string;
  errorMessage?: string;
  tokensUsed?: number;
  costUsd?: string;
  responseTimeMs?: number;
  createdAt: string;
}

export default function AiQuizPage() {
  const [quota, setQuota] = useState<QuotaData | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [configEdit, setConfigEdit] = useState({
    dailyQuotaLimit: 50,
    flashcardQuestionsDefault: 5,
    deckQuestionsDefault: 50,
  });
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  useEffect(() => {
    fetchQuotaData();
  }, []);

  const fetchQuotaData = async () => {
    setLoading(true);
    try {
      const [quotaRes, logsRes] = await Promise.all([
        fetch('/api/admin/ai-quiz/quota'),
        fetch('/api/admin/ai-quiz/logs?limit=20'),
      ]);

      if (quotaRes.ok) {
        const quotaData = await quotaRes.json();
        if (quotaData.success) {
          setQuota(quotaData.data);
          setConfigEdit({
            dailyQuotaLimit: quotaData.data.config.dailyQuotaLimit,
            flashcardQuestionsDefault: quotaData.data.config.flashcardQuestionsDefault,
            deckQuestionsDefault: quotaData.data.config.deckQuestionsDefault,
          });
        }
      }

      if (logsRes.ok) {
        const logsData = await logsRes.json();
        if (logsData.success) {
          setLogs(logsData.data.logs);
        }
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load AI quiz data');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async () => {
    setIsSavingConfig(true);
    try {
      const response = await fetch('/api/admin/ai-quiz/quota', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(configEdit),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success('Configuration updated successfully');
        fetchQuotaData(); // Refresh data
      } else {
        throw new Error(data.error || 'Failed to update configuration');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(errorMessage);
    } finally {
      setIsSavingConfig(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">
            <CheckCircle2 className="w-3 h-3" />
            Success
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded">
            <XCircle className="w-3 h-3" />
            Failed
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 bg-gray-500/20 text-gray-400 text-xs rounded">
            {status}
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-purple-500" />
            AI Quiz Management
          </h1>
          <p className="text-gray-400">
            Monitor and configure AI quiz generation settings
          </p>
        </div>
        <Button
          onClick={fetchQuotaData}
          variant="outline"
          className="border-slate-600 text-white hover:bg-slate-800"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      {quota && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-purple-900/40 to-purple-800/20 border-purple-700/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2 text-white">
                <TrendingUp className="w-5 h-5 text-purple-400" />
                Daily Quota
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-white">
                  {quota.generationsUsedToday} / {quota.dailyQuotaLimit}
                </div>
                <p className="text-sm text-gray-400">
                  {quota.remainingGenerations} generations remaining
                </p>
                <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                  <div
                    className={`h-2 rounded-full ${
                      quota.isQuotaExceeded ? 'bg-red-500' : 'bg-purple-500'
                    }`}
                    style={{
                      width: `${Math.min((quota.generationsUsedToday / quota.dailyQuotaLimit) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-900/40 to-blue-800/20 border-blue-700/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2 text-white">
                <Clock className="w-5 h-5 text-blue-400" />
                Quota Resets
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-white">
                  {new Date(quota.resetTime).toLocaleTimeString()}
                </div>
                <p className="text-sm text-gray-400">
                  {new Date(quota.resetTime).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-900/40 to-green-800/20 border-green-700/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2 text-white">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
                Recent Success Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-white">
                  {quota.recentGenerations.length > 0
                    ? Math.round(
                        (quota.recentGenerations.filter((g) => g.status === 'success').length /
                          quota.recentGenerations.length) *
                          100
                      )
                    : 0}%
                </div>
                <p className="text-sm text-gray-400">
                  Last {quota.recentGenerations.length} generations
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Configuration Section */}
      <Card className="bg-slate-800/50 border-slate-700 mb-8">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2 text-white">
            <Settings className="w-5 h-5" />
            Configuration
          </CardTitle>
          <CardDescription className="text-gray-400">
            Adjust your AI quiz generation settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dailyQuotaLimit" className="text-white">
                Daily Quota Limit
              </Label>
              <Input
                id="dailyQuotaLimit"
                type="number"
                min="1"
                max="500"
                value={configEdit.dailyQuotaLimit}
                onChange={(e) =>
                  setConfigEdit({
                    ...configEdit,
                    dailyQuotaLimit: parseInt(e.target.value) || 1,
                  })
                }
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="flashcardDefault" className="text-white">
                Flashcard Questions Default
              </Label>
              <Input
                id="flashcardDefault"
                type="number"
                min="1"
                max="50"
                value={configEdit.flashcardQuestionsDefault}
                onChange={(e) =>
                  setConfigEdit({
                    ...configEdit,
                    flashcardQuestionsDefault: parseInt(e.target.value) || 1,
                  })
                }
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deckDefault" className="text-white">
                Deck Questions Default
              </Label>
              <Input
                id="deckDefault"
                type="number"
                min="1"
                max="50"
                value={configEdit.deckQuestionsDefault}
                onChange={(e) =>
                  setConfigEdit({
                    ...configEdit,
                    deckQuestionsDefault: parseInt(e.target.value) || 1,
                  })
                }
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
          </div>

          <Button
            onClick={handleSaveConfig}
            disabled={isSavingConfig}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            {isSavingConfig ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Configuration'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Usage Logs */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-xl text-white">Usage Logs</CardTitle>
          <CardDescription className="text-gray-400">
            Recent AI quiz generation history
          </CardDescription>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No generation history yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                      Topic
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                      Type
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                      Questions
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                      Time
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                      <td className="py-3 px-4 text-sm text-white max-w-xs truncate" title={log.topic}>
                        {log.topic}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-400">
                        {log.generationType}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-400">
                        {log.numQuestionsGenerated}
                      </td>
                      <td className="py-3 px-4">{getStatusBadge(log.status)}</td>
                      <td className="py-3 px-4 text-sm text-gray-400">
                        {log.responseTimeMs ? `${log.responseTimeMs}ms` : '-'}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-400">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
