import { db } from "@/lib/db";
import { users, domains, flashcards, userCardProgress } from "@/lib/db/schema";
import { sql } from "drizzle-orm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Users as UsersIcon, BookOpen, TrendingUp } from "lucide-react";

export default async function AdminDashboardPage() {
  // Get statistics
  const [stats] = await Promise.all([
    Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(users),
      db.select({ count: sql<number>`count(*)::int` }).from(domains),
      db.select({ count: sql<number>`count(*)::int` }).from(flashcards),
      db.select({ count: sql<number>`count(*)::int` }).from(userCardProgress),
    ])
  ]);

  const [userCount, domainCount, flashcardCount, progressCount] = stats;

  const totalUsers = userCount[0]?.count || 0;
  const totalDomains = domainCount[0]?.count || 0;
  const totalFlashcards = flashcardCount[0]?.count || 0;
  const totalProgress = progressCount[0]?.count || 0;

  // Get recent activity
  const recentUsers = await db.query.users.findMany({
    orderBy: (users, { desc }) => [desc(users.createdAt)],
    limit: 5,
  });

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
          Admin Dashboard
        </h1>
        <p className="text-gray-300">
          Manage flashcards and view user analytics
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-400">
                Total Users
              </CardTitle>
              <UsersIcon className="w-4 h-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{totalUsers}</div>
            <p className="text-xs text-gray-400 mt-1">
              Registered accounts
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-400">
                Domains
              </CardTitle>
              <BookOpen className="w-4 h-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{totalDomains}</div>
            <p className="text-xs text-gray-400 mt-1">
              CISSP domains
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-400">
                Flashcards
              </CardTitle>
              <FileText className="w-4 h-4 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{totalFlashcards}</div>
            <p className="text-xs text-gray-400 mt-1">
              Total questions
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-400">
                Study Sessions
              </CardTitle>
              <TrendingUp className="w-4 h-4 text-orange-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{totalProgress}</div>
            <p className="text-xs text-gray-400 mt-1">
              Cards studied
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Users */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Recent Users</CardTitle>
          <CardDescription className="text-gray-400">
            Latest user registrations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentUsers.length === 0 ? (
            <p className="text-gray-400">No users yet</p>
          ) : (
            <div className="space-y-4">
              {recentUsers.map((user) => (
                <div
                  key={user.clerkUserId}
                  className="flex items-center justify-between py-2 border-b border-slate-700 last:border-0"
                >
                  <div>
                    <p className="font-medium text-white">{user.name || 'Unknown'}</p>
                    <p className="text-sm text-gray-400">{user.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-400">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                    <span className={`text-xs px-2 py-1 rounded ${
                      user.role === 'admin'
                        ? 'bg-purple-500/20 text-purple-400'
                        : 'bg-blue-500/20 text-blue-400'
                    }`}>
                      {user.role}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
