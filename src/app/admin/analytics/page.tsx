"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search, TrendingUp, Award, Clock } from "lucide-react";
import { toast } from "sonner";

interface UserAnalytics {
  clerkUserId: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: Date;
  totalCardsStudied: number | null;
  studyStreakDays: number | null;
  totalStudyTime: number | null;
  lastActiveDate: Date | null;
  masteryBreakdown: {
    new: number;
    learning: number;
    mastered: number;
  };
  totalCardsInProgress: number;
}

interface DomainProgress {
  domainId: string;
  domainName: string;
  totalCards: number;
  studiedCards: number;
  masteredCards: number;
  learningCards: number;
  newCards: number;
  progress: number;
}

export default function AdminAnalyticsPage() {
  const [users, setUsers] = useState<UserAnalytics[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [userDetails, setUserDetails] = useState<any>(null);
  const [domainProgress, setDomainProgress] = useState<DomainProgress[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchEmail, setSearchEmail] = useState("");

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/analytics/users");
      if (!res.ok) throw new Error("Failed to load users");
      const data = await res.json();
      setUsers(data.users || []);
    } catch (error) {
      toast.error("Failed to load user analytics");
    } finally {
      setLoading(false);
    }
  };

  const loadUserDetails = async (userId: string) => {
    setLoading(true);
    setSelectedUserId(userId);
    try {
      const res = await fetch(`/api/admin/analytics/users?userId=${userId}`);
      if (!res.ok) throw new Error("Failed to load user details");
      const data = await res.json();
      setUserDetails(data);
      setDomainProgress(data.domainProgress || []);
    } catch (error) {
      toast.error("Failed to load user details");
    } finally {
      setLoading(false);
    }
  };

  const formatStudyTime = (seconds: number | null) => {
    if (!seconds) return "0m";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const filteredUsers = users.filter((user) =>
    user.email.toLowerCase().includes(searchEmail.toLowerCase()) ||
    user.name?.toLowerCase().includes(searchEmail.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          User Analytics
        </h1>
        <p className="text-gray-300">
          View performance and progress for all users
        </p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="text"
            placeholder="Search by email or name..."
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
            className="pl-10 bg-slate-800/50 border-slate-700 text-white"
          />
        </div>
      </div>

      {loading && !selectedUserId ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Users List */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">All Users</CardTitle>
              <CardDescription className="text-gray-400">
                {filteredUsers.length} users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {filteredUsers.map((user) => (
                  <div
                    key={user.clerkUserId}
                    onClick={() => loadUserDetails(user.clerkUserId)}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      selectedUserId === user.clerkUserId
                        ? 'border-purple-500 bg-purple-500/10'
                        : 'border-slate-700 hover:border-slate-600 bg-slate-900/50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-white">{user.name || 'Unknown'}</p>
                        <p className="text-sm text-gray-400">{user.email}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded ${
                        user.role === 'admin'
                          ? 'bg-purple-500/20 text-purple-400'
                          : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {user.role}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-3">
                      <div className="text-center">
                        <p className="text-xs text-gray-400">Studied</p>
                        <p className="text-lg font-bold text-white">
                          {user.totalCardsStudied || 0}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-400">Mastered</p>
                        <p className="text-lg font-bold text-green-400">
                          {user.masteryBreakdown.mastered}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-400">Learning</p>
                        <p className="text-lg font-bold text-yellow-400">
                          {user.masteryBreakdown.learning}
                        </p>
                      </div>
                    </div>

                    {user.studyStreakDays && user.studyStreakDays > 0 && (
                      <div className="mt-2 text-xs text-gray-400 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        {user.studyStreakDays} day streak
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* User Details */}
          <div className="space-y-6">
            {selectedUserId && userDetails ? (
              <>
                {/* User Stats */}
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">
                      {userDetails.user.name || 'User'} Stats
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                      {userDetails.user.email}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-slate-900/50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Award className="w-4 h-4 text-purple-400" />
                          <p className="text-xs text-gray-400">Cards Studied</p>
                        </div>
                        <p className="text-2xl font-bold text-white">
                          {userDetails.stats?.totalCardsStudied || 0}
                        </p>
                      </div>

                      <div className="p-4 bg-slate-900/50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="w-4 h-4 text-green-400" />
                          <p className="text-xs text-gray-400">Study Streak</p>
                        </div>
                        <p className="text-2xl font-bold text-white">
                          {userDetails.stats?.studyStreakDays || 0} days
                        </p>
                      </div>

                      <div className="p-4 bg-slate-900/50 rounded-lg col-span-2">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="w-4 h-4 text-blue-400" />
                          <p className="text-xs text-gray-400">Total Study Time</p>
                        </div>
                        <p className="text-2xl font-bold text-white">
                          {formatStudyTime(userDetails.stats?.totalStudyTime)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Domain Progress */}
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">Domain Progress</CardTitle>
                    <CardDescription className="text-gray-400">
                      Performance across CISSP domains
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {domainProgress.map((domain) => (
                        <div key={domain.domainId} className="p-4 bg-slate-900/50 rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium text-white">{domain.domainName}</h4>
                            <span className="text-sm text-gray-400">
                              {domain.progress}%
                            </span>
                          </div>

                          <div className="w-full bg-slate-700 rounded-full h-2 mb-3">
                            <div
                              className="bg-gradient-to-r from-purple-600 to-purple-400 h-2 rounded-full transition-all"
                              style={{ width: `${domain.progress}%` }}
                            />
                          </div>

                          <div className="grid grid-cols-4 gap-2 text-center">
                            <div>
                              <p className="text-xs text-gray-400">Total</p>
                              <p className="font-semibold text-white">{domain.totalCards}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-400">Mastered</p>
                              <p className="font-semibold text-green-400">{domain.masteredCards}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-400">Learning</p>
                              <p className="font-semibold text-yellow-400">{domain.learningCards}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-400">New</p>
                              <p className="font-semibold text-gray-400">{domain.newCards}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="py-12">
                  <div className="text-center text-gray-400">
                    <p>Select a user to view their performance details</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
