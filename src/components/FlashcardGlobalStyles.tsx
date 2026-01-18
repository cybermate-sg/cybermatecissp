
export default function FlashcardGlobalStyles() {
    return (
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
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }

        /* Ensure list markers are visible in scrollable containers */
        .overflow-y-auto ul,
        .overflow-y-auto ol {
          overflow: visible !important;
        }

        /* Rich text content styling for flashcards */
        .prose {
          word-wrap: break-word;
          overflow-wrap: break-word;
          white-space: normal;
        }

        .prose h1 {
          font-size: 1.5rem;
          font-weight: 600;
          margin-top: 0.75rem;
          margin-bottom: 0.5rem;
          color: #e2e8f0;
        }

        .prose h2 {
          font-size: 1.25rem;
          font-weight: 600;
          margin-top: 1rem;
          margin-bottom: 0.5rem;
          color: #e2e8f0;
        }

        .prose h3 {
          font-size: 1.125rem;
          font-weight: 600;
          margin-top: 0.75rem;
          margin-bottom: 0.5rem;
          color: #e2e8f0;
        }

        .prose h4,
        .prose h5,
        .prose h6 {
          font-weight: 600;
          margin-top: 0.75rem;
          margin-bottom: 0.5rem;
          color: #e2e8f0;
        }

        .prose p {
          margin-top: 0.5rem;
          margin-bottom: 0.5rem;
          line-height: 1.6;
          word-wrap: break-word;
          overflow-wrap: break-word;
        }

        .prose ul,
        .prose ol,
        .prose-invert ul,
        .prose-invert ol,
        .prose-sm ul,
        .prose-sm ol,
        .prose-base ul,
        .prose-base ol {
          padding-left: 1.5rem !important;
          margin-top: 0.5rem !important;
          margin-bottom: 0.5rem !important;
          list-style-position: outside !important;
          margin-left: 0.5rem !important;
        }

        .prose ul,
        .prose-invert ul,
        .prose-sm ul,
        .prose-base ul {
          list-style-type: disc !important;
        }

        .prose ol,
        .prose-invert ol,
        .prose-sm ol,
        .prose-base ol {
          list-style-type: decimal !important;
        }

        .prose li,
        .prose-invert li,
        .prose-sm li,
        .prose-base li {
          margin-top: 0.25rem !important;
          margin-bottom: 0.25rem !important;
          display: list-item !important;
          margin-left: 0 !important;
        }

        .prose strong {
          font-weight: 600;
          color: #f1f5f9;
        }

        .prose em {
          font-style: italic;
        }

        .prose blockquote {
          border-left: 4px solid #475569;
          padding-left: 1rem;
          margin: 1rem 0;
          font-style: italic;
          color: #cbd5e1;
        }

        .prose a {
          color: #60a5fa;
          text-decoration: underline;
        }

        .prose a:hover {
          color: #93c5fd;
        }

        .prose code {
          background-color: #334155;
          padding: 0.2rem 0.4rem;
          border-radius: 0.25rem;
          font-size: 0.9em;
          font-family: monospace;
          color: #e2e8f0;
        }

        .prose pre {
          background-color: #1e293b;
          padding: 1rem;
          border-radius: 0.5rem;
          overflow-x: auto;
          margin: 0.75rem 0;
        }

        .prose pre code {
          background: none;
          padding: 0;
        }

        /* Table styling for flashcards */
        .prose .tiptap-table {
          border-collapse: collapse;
          table-layout: auto;
          width: 100%;
          margin: 1rem 0;
          overflow: hidden;
          border-radius: 0.5rem;
        }

        .prose .tiptap-table td,
        .prose .tiptap-table th {
          min-width: 3em;
          border: 2px solid #475569;
          padding: 8px 12px;
          vertical-align: top;
          box-sizing: border-box;
          position: relative;
          background-color: rgba(30, 41, 59, 0.5);
        }

        .prose .tiptap-table th {
          font-weight: 600;
          text-align: left;
          background-color: #334155;
          color: #f1f5f9;
        }

        /* Responsive table wrapper */
        .prose table {
          display: table;
          table-layout: auto;
          width: 100%;
          overflow-x: auto;
        }

        .prose table td,
        .prose table th {
          word-wrap: break-word;
          overflow-wrap: break-word;
          white-space: normal;
        }

        /* Make tables responsive on mobile */
        @media (max-width: 640px) {
          .prose .tiptap-table td,
          .prose .tiptap-table th {
            padding: 6px 8px;
            font-size: 0.875rem;
          }
        }
      `}</style>
    );
}
