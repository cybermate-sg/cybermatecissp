"use client";

import { Flame, Clock, BarChart3, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StatsCardProps {
  streak: number;
  minutesToday: number;
  cardsToday: number;
  accuracy: number;
  last7DaysActivity: number[];
}

export function StatsCard({ streak, minutesToday, cardsToday, accuracy, last7DaysActivity }: StatsCardProps) {
  // Calculate max value for scaling the bars (with a minimum of 1 to avoid divide by zero)
  const maxMinutes = Math.max(...last7DaysActivity, 1);

  return (
    <Card className="bg-white border-gray-200 shadow-lg sticky top-4 mt-12 h-[500px] flex flex-col">
      <CardHeader className="pb-4 flex-shrink-0">
        <CardTitle className="text-lg font-bold text-gray-900">Your Stats Today</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 flex-1 flex flex-col justify-evenly overflow-hidden">
        {/* Streak */}
        <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-xl border border-orange-200">
          <div className="flex-shrink-0 w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
            <Flame className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold text-orange-600">{streak}</p>
            <p className="text-xs text-gray-600">Day Streak</p>
          </div>
        </div>

        {/* Minutes Studied */}
        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-200">
          <div className="flex-shrink-0 w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
            <Clock className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold text-blue-600">{minutesToday}</p>
            <p className="text-xs text-gray-600">Minutes Today</p>
          </div>
        </div>

        {/* Cards Reviewed */}
        <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl border border-green-200">
          <div className="flex-shrink-0 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600">{cardsToday}</p>
            <p className="text-xs text-gray-600">Cards Reviewed</p>
          </div>
        </div>

        {/* Accuracy */}
        <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-xl border border-purple-200">
          <div className="flex-shrink-0 w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
            <Target className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold text-purple-600">{accuracy}%</p>
            <p className="text-xs text-gray-600">Accuracy</p>
          </div>
        </div>

        {/* Last 7 Days Activity Chart */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 mb-2">Last 7 Days Activity</p>
          <div className="flex items-end justify-between gap-1 h-16">
            {last7DaysActivity.map((minutes, i) => {
              const height = maxMinutes > 0 ? (minutes / maxMinutes) * 100 : 0;
              const isToday = i === last7DaysActivity.length - 1;
              return (
                <div
                  key={i}
                  className={`flex-1 rounded-t transition-all hover:opacity-80 ${
                    isToday ? 'bg-blue-500' : 'bg-blue-200'
                  }`}
                  style={{ height: `${Math.max(height, 5)}%` }}
                  title={`${minutes} min${minutes !== 1 ? 's' : ''}`}
                ></div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
