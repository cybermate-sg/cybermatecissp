import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, TrendingUp, Home } from "lucide-react";

export default async function SessionSummaryPage({
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ cards?: string; duration?: string }>;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const { cards, duration } = await searchParams;

  const cardsStudied = parseInt(cards || '0', 10);
  const durationSeconds = parseInt(duration || '0', 10);
  const durationMinutes = Math.floor(durationSeconds / 60);
  const durationSecondsRemainder = durationSeconds % 60;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Success Icon */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/20 mb-4">
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
              Session Complete!
            </h1>
            <p className="text-gray-300">
              Great work! Here&apos;s your session summary.
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Cards Studied
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">{cardsStudied}</div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Study Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">
                  {durationMinutes}:{durationSecondsRemainder.toString().padStart(2, '0')}
                </div>
                <p className="text-xs text-gray-400 mt-1">minutes</p>
              </CardContent>
            </Card>
          </div>

          {/* Progress Message */}
          <Card className="bg-slate-800/50 border-slate-700 mb-6">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-blue-500" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Keep Building Your Streak!
                  </h3>
                  <p className="text-gray-300 text-sm">
                    Consistency is key to mastering CISSP concepts. Try to study a little bit every day to maintain your momentum.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="space-y-3">
            <Link href="/dashboard/session/new" className="block">
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-6 text-lg">
                Start Another Session
              </Button>
            </Link>

            <Link href="/dashboard" className="block">
              <Button variant="outline" className="w-full border-slate-600 text-gray-300 hover:bg-slate-700 hover:text-white py-6">
                <Home className="w-5 h-5 mr-2" />
                Return to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
