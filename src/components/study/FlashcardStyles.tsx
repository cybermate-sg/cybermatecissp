import React from 'react';

function FlashcardAnimationStyles() {
  return (
    // nosemgrep: javascript.lang.correctness.missing-template-string-indicator
    <style jsx global>{`
      .perspective-1000 {
        perspective: 1000px;
      }
      .preserve-3d {
        transform-style: preserve-3d;
      }
      .backface-hidden {
        backface-visibility: hidden;
        -webkit-backface-visibility: hidden;
      }
      .touch-manipulation {
        touch-action: manipulation;
      }
      @keyframes fade-in {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      .animate-fade-in {
        animation: fade-in 0.2s ease-out;
      }
      @keyframes bounce-horizontal {
        0%, 100% { transform: translateX(0); }
        50% { transform: translateX(-10px); }
      }
      .animate-bounce-horizontal {
        animation: bounce-horizontal 1s ease-in-out infinite;
      }
    `}</style>
  );
}

const FLASHCARD_PROSE_STYLES = `
  /* Enhanced prose styling for cyber theme */
  .prose h1 {
    font-size: 1.75rem;
    font-weight: 700;
    margin-top: 1.5rem;
    margin-bottom: 0.75rem;
    color: #67e8f9;
  }
  .prose h2 {
    font-size: 1.5rem;
    font-weight: 700;
    margin-top: 1.5rem;
    margin-bottom: 0.75rem;
    color: #67e8f9;
  }
  .prose h3 {
    font-size: 1.25rem;
    font-weight: 700;
    margin-top: 1.25rem;
    margin-bottom: 0.75rem;
    color: #67e8f9;
  }
  .prose h4, .prose h5, .prose h6 {
    font-weight: 700;
    margin-top: 1rem;
    margin-bottom: 0.5rem;
    color: #67e8f9;
  }
  .prose p {
    margin-top: 0.75rem;
    margin-bottom: 0.75rem;
    line-height: 1.8;
  }
  .prose ul, .prose ol,
  .prose-invert ul, .prose-invert ol,
  .prose-lg ul, .prose-lg ol,
  .prose-base ul, .prose-base ol {
    padding-left: 1.75rem !important;
    margin-top: 0.75rem !important;
    margin-bottom: 0.75rem !important;
    list-style-position: outside !important;
    margin-left: 0.5rem !important;
  }
  .prose ul,
  .prose-invert ul,
  .prose-lg ul,
  .prose-base ul {
    list-style-type: disc !important;
  }
  .prose ol,
  .prose-invert ol,
  .prose-lg ol,
  .prose-base ol {
    list-style-type: decimal !important;
  }
  .prose li,
  .prose-invert li,
  .prose-lg li,
  .prose-base li {
    margin-top: 0.5rem !important;
    margin-bottom: 0.5rem !important;
    display: list-item !important;
    margin-left: 0 !important;
  }
  .prose strong {
    font-weight: 700;
    color: #f1f5f9;
  }
  .prose a {
    color: #67e8f9;
    text-decoration: underline;
    transition: color 0.2s ease;
  }
  .prose a:hover {
    color: #a5f3fc;
  }
  .prose code {
    background-color: rgba(51, 65, 85, 0.8);
    padding: 0.25rem 0.5rem;
    border-radius: 0.375rem;
    font-size: 0.9em;
    font-family: 'Courier New', monospace;
    color: #67e8f9;
    border: 1px solid rgba(6, 182, 212, 0.3);
  }
  .prose pre {
    background-color: rgba(15, 23, 42, 0.9);
    padding: 1.25rem;
    border-radius: 0.75rem;
    overflow-x: auto;
    margin: 1rem 0;
    border: 1px solid rgba(6, 182, 212, 0.2);
  }
  .prose pre code {
    background: none;
    padding: 0;
    border: none;
  }
  .prose blockquote {
    border-left: 4px solid #06b6d4;
    padding-left: 1rem;
    margin: 1rem 0;
    font-style: italic;
    color: #cbd5e1;
    background: rgba(6, 182, 212, 0.05);
    padding: 1rem;
    border-radius: 0.5rem;
  }
`;

function FlashcardProseStyles() {
  return (
    // nosemgrep: javascript.lang.correctness.missing-template-string-indicator
    <style jsx global>{FLASHCARD_PROSE_STYLES}</style>
  );
}

export function FlashcardStyles() {
  return (
    <>
      <FlashcardAnimationStyles />
      <FlashcardProseStyles />
    </>
  );
}
