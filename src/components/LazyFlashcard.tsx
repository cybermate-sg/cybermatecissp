"use client";

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

// Dynamically import Flashcard component with loading state
const Flashcard = dynamic(() => import('./Flashcard'), {
  loading: () => (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
    </div>
  ),
  ssr: true, // Enable SSR for better SEO and initial load
});

export default Flashcard;
