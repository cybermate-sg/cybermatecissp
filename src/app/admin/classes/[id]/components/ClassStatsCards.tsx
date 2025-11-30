import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Deck {
  isPublished: boolean;
  cardCount: number;
}

interface ClassStatsCardsProps {
  decks: Deck[];
}

export function ClassStatsCards({ decks }: ClassStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-400">
            Total Decks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-white">{decks.length}</div>
        </CardContent>
      </Card>

      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-400">
            Published Decks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-white">
            {decks.filter((d) => d.isPublished).length}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-400">
            Total Cards
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-white">
            {decks.reduce((sum, d) => sum + d.cardCount, 0)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
