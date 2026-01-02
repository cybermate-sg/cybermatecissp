'use client';

import { useEffect, useState, useCallback } from 'react';
import Script from 'next/script';

export default function GoogleTranslate() {
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);

  const initializeGoogleTranslate = useCallback(() => {
    if ((window as any).google && (window as any).google.translate) {
      const element = document.getElementById('google_translate_element');
      if (element && !element.hasChildNodes()) {
        new (window as any).google.translate.TranslateElement(
          {
            pageLanguage: 'en',
            includedLanguages: 'en,es,fr,de,ar,zh-CN,zh-TW,ja,ko,pt,ru,hi,it,nl,pl,tr,vi,th',
            layout: (window as any).google.translate.TranslateElement.InlineLayout.HORIZONTAL,
            autoDisplay: true,
            multilanguagePage: true,
          },
          'google_translate_element'
        );
      }
    }
  }, []);

  useEffect(() => {
    // Set up the global callback for Google Translate
    (window as any).googleTranslateElementInit = initializeGoogleTranslate;

    // If script is already loaded, initialize immediately
    if (isScriptLoaded) {
      initializeGoogleTranslate();
    }
  }, [isScriptLoaded, initializeGoogleTranslate]);

  return (
    <>
      {/* Load Google Translate script using Next.js Script component */}
      <Script
        src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
        strategy="afterInteractive"
        onLoad={() => {
          setIsScriptLoaded(true);
        }}
        onError={(e) => {
          console.error('Failed to load Google Translate script', e);
        }}
      />

      {/* Container for the translator dropdown */}
      <div className="flex items-center gap-3 bg-slate-800/50 px-4 py-2 rounded-lg border border-blue-400/30">
        <svg
          className="w-5 h-5 text-blue-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
          />
        </svg>
        <span className="text-sm text-blue-300 font-semibold">Language:</span>
        <div id="google_translate_element" className="notranslate" />
      </div>

      {/* Dark theme styling for Google Translate widget */}
      <style jsx global>{`
        /* Translator dropdown container */
        #google_translate_element {
          display: inline-block;
        }

        /* Gadget container */
        .goog-te-gadget {
          font-family: inherit !important;
          color: #e2e8f0 !important;
        }

        /* Dropdown select styling */
        .goog-te-combo {
          background-color: #1e293b !important; /* slate-800 */
          border: 2px solid #60a5fa !important; /* blue-400 - more visible */
          color: #ffffff !important; /* white text for better contrast */
          padding: 10px 36px 10px 14px !important;
          border-radius: 0.5rem !important;
          font-size: 0.9375rem !important;
          font-weight: 600 !important;
          outline: none !important;
          cursor: pointer !important;
          min-width: 180px !important;
          appearance: auto !important;
          -webkit-appearance: menulist !important;
          -moz-appearance: menulist !important;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3) !important;
        }

        .goog-te-combo:hover {
          background-color: #334155 !important; /* slate-700 */
          border-color: #93c5fd !important; /* blue-300 */
        }

        .goog-te-combo:focus {
          border-color: #60a5fa !important; /* blue-400 */
          box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.3) !important;
        }

        /* Dropdown options */
        .goog-te-combo option {
          background-color: #1e293b !important; /* slate-800 */
          color: #ffffff !important; /* white */
          padding: 8px !important;
        }

        .goog-te-combo option:hover {
          background-color: #334155 !important; /* slate-700 */
        }

        /* Google branding - make minimal */
        .goog-te-gadget {
          font-family: inherit !important;
          font-size: 0 !important;
        }

        .goog-te-gadget span {
          display: inline-block;
          font-size: 0.875rem !important;
        }

        /* Hide "Powered by" link */
        .goog-te-gadget > span > a {
          display: none !important;
        }

        /* Hide or style the top banner */
        .goog-te-banner-frame.skiptranslate {
          display: none !important;
        }

        /* Adjust body top when banner would appear */
        body {
          top: 0 !important;
        }

        /* Style the iframe when translation is active */
        .skiptranslate iframe {
          visibility: hidden !important;
          height: 0 !important;
          border: none !important;
        }

        /* Container styling */
        .goog-te-gadget-simple {
          background-color: transparent !important;
          border: none !important;
          padding: 0 !important;
        }

        /* Translation icon/text */
        .goog-te-gadget-icon {
          display: none !important;
        }

        /* Menu frame styling (dropdown menu) */
        .goog-te-menu-frame {
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3) !important;
        }
      `}</style>
    </>
  );
}
