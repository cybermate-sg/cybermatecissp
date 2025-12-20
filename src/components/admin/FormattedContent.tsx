"use client";

import { useMemo, useState, useEffect } from "react";

interface FormattedContentProps {
  html: string;
  className?: string;
}

/**
 * Component to render formatted HTML content with proper sanitization
 */
export function FormattedContent({ html, className = "" }: FormattedContentProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const sanitizedHtml = useMemo(() => {
    if (!isMounted) return html;

    // Dynamic import to avoid SSR issues with jsdom
    try {
      const DOMPurify = require("isomorphic-dompurify");
      return DOMPurify.sanitize(html, {
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
    } catch (error) {
      console.error("Error sanitizing HTML:", error);
      return html;
    }
  }, [html, isMounted]);

  // Don't render during SSR to avoid jsdom issues
  if (!isMounted) {
    return null;
  }

  return (
    <div
      className={`prose prose-sm max-w-none ${className}`}
      // eslint-disable-next-line react/no-danger -- HTML is sanitized with DOMPurify before rendering
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
}
