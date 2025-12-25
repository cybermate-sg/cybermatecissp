// CISSP Domain information
export const CISSP_DOMAINS = [
  {
    domain: 1,
    name: "Security and Risk Management",
    shortName: "Security & Risk",
    weight: 16,
    color: "#ef4444", // red
  },
  {
    domain: 2,
    name: "Asset Security",
    shortName: "Asset Security",
    weight: 10,
    color: "#f97316", // orange
  },
  {
    domain: 3,
    name: "Security Architecture and Engineering",
    shortName: "Architecture",
    weight: 13,
    color: "#eab308", // yellow
  },
  {
    domain: 4,
    name: "Communication and Network Security",
    shortName: "Network Security",
    weight: 13,
    color: "#84cc16", // lime
  },
  {
    domain: 5,
    name: "Identity and Access Management",
    shortName: "IAM",
    weight: 13,
    color: "#10b981", // green
  },
  {
    domain: 6,
    name: "Security Assessment and Testing",
    shortName: "Assessment",
    weight: 12,
    color: "#06b6d4", // cyan
  },
  {
    domain: 7,
    name: "Security Operations",
    shortName: "Operations",
    weight: 13,
    color: "#3b82f6", // blue
  },
  {
    domain: 8,
    name: "Software Development Security",
    shortName: "Dev Security",
    weight: 10,
    color: "#8b5cf6", // purple
  },
] as const;

/**
 * Extract domain number from deck name
 * Examples:
 * - "Day 1: Domain 1 - Security and Risk Management" -> 1
 * - "Domain 2 – Asset Security" -> 2
 */
export function extractDomainFromDeckName(deckName: string): number | null {
  const match = deckName.match(/Domain\s+(\d+)/i);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Extract day number from deck name
 * Examples:
 * - "Day 1: Domain 1 - Security and Risk Management" -> 1
 * - "Day 15 - Practice Questions" -> 15
 */
export function extractDayNumberFromDeckName(deckName: string): number | null {
  const match = deckName.match(/Day\s+(\d+)/i);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Get domain information by domain number
 */
export function getDomainInfo(domainNumber: number) {
  return CISSP_DOMAINS.find(d => d.domain === domainNumber) || null;
}

// Helper: Group flashcard decks by domain number
function groupDecksByDomain(decks: Array<{ name: string; progress: number; type: string }>) {
  const domainMap = new Map<number, { totalProgress: number; count: number }>();

  decks.forEach(deck => {
    if (deck.type !== 'flashcard') return;

    const domain = extractDomainFromDeckName(deck.name);
    if (!domain) return;

    const current = domainMap.get(domain) || { totalProgress: 0, count: 0 };
    domainMap.set(domain, {
      totalProgress: current.totalProgress + deck.progress,
      count: current.count + 1,
    });
  });

  return domainMap;
}

// Helper: Calculate average progress for a domain
function calculateAverageProgress(data: { totalProgress: number; count: number } | undefined): number {
  return data ? Math.round(data.totalProgress / data.count) : 0;
}

/**
 * Calculate progress per domain from deck list
 */
export function calculateDomainProgress(decks: Array<{
  name: string;
  progress: number;
  type: string;
}>) {
  const domainMap = groupDecksByDomain(decks);

  return CISSP_DOMAINS.map(domainInfo => ({
    domain: domainInfo.domain,
    name: domainInfo.shortName,
    progress: calculateAverageProgress(domainMap.get(domainInfo.domain)),
    color: domainInfo.color,
  }));
}

/**
 * Calculate QUIZ progress per domain from deck list with quiz progress data
 * This is separate from flashcard progress
 */
export function calculateDomainQuizProgress(
  decks: Array<{
    name: string;
    type: string;
    domainNumber?: number | null;
    quizProgress?: number; // Average quiz score for this deck
  }>
) {
  const domainMap = new Map<number, { totalProgress: number; count: number }>();

  decks.forEach((deck) => {
    // Extract domain from name or use domainNumber field
    const domain = deck.domainNumber || extractDomainFromDeckName(deck.name);
    if (!domain) return;

    // Only count decks with quiz progress
    if (deck.quizProgress === undefined || deck.quizProgress === null) return;

    const current = domainMap.get(domain) || { totalProgress: 0, count: 0 };
    domainMap.set(domain, {
      totalProgress: current.totalProgress + deck.quizProgress,
      count: current.count + 1,
    });
  });

  return CISSP_DOMAINS.map((domainInfo) => ({
    domain: domainInfo.domain,
    name: domainInfo.shortName,
    progress: calculateAverageProgress(domainMap.get(domainInfo.domain)),
    color: domainInfo.color,
  }));
}
