"use client";

import { useState, useEffect } from "react";
import DOMPurify from "isomorphic-dompurify";

interface FormattedContentProps {
  html: string;
  className?: string;
}

/**
 * Component to render formatted HTML content with proper sanitization
 */
export function FormattedContent({ html, className = "" }: FormattedContentProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [sanitizedHtml, setSanitizedHtml] = useState("");

  useEffect(() => {
    setIsMounted(true);

    // Sanitize HTML on mount
    try {
      const cleaned = DOMPurify.sanitize(html, {
        ALLOWED_TAGS: [
          'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
          'ul', 'ol', 'li', 'code', 'pre', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
          'blockquote', 'a', 's'
        ],
        ALLOWED_ATTR: ['href', 'class', 'target', 'rel'],
        ALLOW_DATA_ATTR: false,
        ALLOW_UNKNOWN_PROTOCOLS: false,
        SAFE_FOR_TEMPLATES: true,
        RETURN_TRUSTED_TYPE: false
      });
      setSanitizedHtml(cleaned);
    } catch (error) {
      console.error("Error sanitizing HTML:", error);
      setSanitizedHtml(html);
    }
  }, [html]);

  // Don't render during SSR to avoid jsdom issues
  if (!isMounted) {
    return null;
  }

  return (
    <div
      className={`prose prose-sm max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
}
