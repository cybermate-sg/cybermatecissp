/**
 * Utility functions for Google Translate integration
 */

/**
 * Triggers Google Translate to re-translate the page or a specific element
 * This is useful for dynamically added content like modals
 */
/**
 * Triggers Google Translate to re-translate the page or a specific element
 * This is useful for dynamically added content like modals
 */
export function triggerGoogleTranslate(): void {
  console.log('triggerGoogleTranslate called');

  // Check if Google Translate is active
  let currentLang = getCookie('googtrans');
  console.log('Current language from cookie:', currentLang);

  // Fallback: Check dropdown value if cookie is empty
  if (!currentLang || currentLang === '/en/en' || currentLang === '') {
    const selectElement = document.querySelector('.goog-te-combo') as HTMLSelectElement;
    if (selectElement && selectElement.value) {
      console.log('Cookie empty, checking dropdown fallback:', selectElement.value);
      if (selectElement.value !== 'en') {
        // Construct a fake cookie-like string for the logic below
        currentLang = `/en/${selectElement.value}`;
      }
    }
  }

  if (!currentLang || currentLang === '/en/en' || currentLang === '') {
    // No translation active, skip
    console.log('No translation active, skipping trigger');
    return;
  }

  // Extract the target language code (format is /en/es)
  // Handle various formats: /en/es, /auto/es, etc.
  const parts = currentLang.split('/').filter(Boolean);
  const targetLang = parts.length >= 2 ? parts[parts.length - 1] : null;
  console.log('Target language extracted:', targetLang);

  if (!targetLang || targetLang === 'en') {
    console.log('No valid target language found (or target is English), aborting');
    return;
  }

  // Helper to force reflow/repaint
  const forceReflow = () => {
    const html = document.documentElement;
    // Toggling these classes sometimes wakes up the translator
    if (html.classList.contains('translated-ltr')) {
      html.classList.remove('translated-ltr');
      void html.offsetHeight; // Force reflow
      setTimeout(() => html.classList.add('translated-ltr'), 50);
    }
    if (html.classList.contains('translated-rtl')) {
      html.classList.remove('translated-rtl');
      void html.offsetHeight; // Force reflow
      setTimeout(() => html.classList.add('translated-rtl'), 50);
    }
  };

  // Method 1: Try to trigger via the select dropdown
  const selectElement = document.querySelector('.goog-te-combo') as HTMLSelectElement;

  if (selectElement) {

    console.log('Found select element, triggering translation to:', targetLang);

    // Initial reflow attempt
    forceReflow();

    // Reset loop to ensure change event fires
    // We do this in a staggered way to ensure the browser processes each state change
    setTimeout(() => {
      // 1. Reset to English/Empty
      selectElement.value = '';
      selectElement.dispatchEvent(new Event('change', { bubbles: true }));

      // 2. Wait and set to target language
      setTimeout(() => {
        selectElement.value = targetLang;
        selectElement.dispatchEvent(new Event('change', { bubbles: true }));
        console.log('Dispatched change event to:', targetLang);

        // 3. Final safety check - sometimes it needs a second nudge
        setTimeout(() => {
          if (selectElement.value !== targetLang) {
            selectElement.value = targetLang;
            selectElement.dispatchEvent(new Event('change', { bubbles: true }));
          }
        }, 500);
      }, 300);
    }, 100);

    return;
  }

  console.log('Select element not found, falling back to iframe manipulation');

  // Method 2: Fallback for when select is hidden/customized
  // Try to find the iframe that Google Translate creates
  const iframe = document.querySelector('.skiptranslate iframe') as HTMLIFrameElement;
  if (iframe) {
    try {
      // Sometimes accessing iframe content forces a refresh check
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (iframeDoc) {
        const restoreBtn = iframeDoc.getElementById(':1.restore') as HTMLElement;
        if (restoreBtn) {
          // If we found the restore button, we could theoretically click it to reset
          // But that might be too aggressive. Instead, we rely on the cookie + reload method below.
        }
      }
    } catch (e) {
      console.log('Cannot access iframe content (CORS)', e);
    }
  }
}

/**
 * Get a cookie value by name
 * Handles URL-encoded cookie values from Google Translate
 */
function getCookie(name: string): string {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    const cookieValue = parts.pop()?.split(';').shift() || '';
    // Decode URL-encoded cookie value (Google Translate encodes cookies)
    try {
      return decodeURIComponent(cookieValue);
    } catch {
      return cookieValue;
    }
  }
  return '';
}

/**
 * Check if Google Translate is currently active (language already selected)
 */
export function isGoogleTranslateActive(): boolean {
  if (typeof window === 'undefined') return false;

  const currentLang = getCookie('googtrans');
  console.log('Google Translate cookie value:', currentLang);

  // Check if a language is selected (not empty and not English-to-English)
  const isActive = !!(currentLang && currentLang !== '/en/en' && currentLang !== '');

  // Also check if the page has been translated by looking for Google Translate classes
  const hasTranslatedClass = document.documentElement.classList.contains('translated-ltr') ||
    document.documentElement.classList.contains('translated-rtl');

  console.log('Is Google Translate active:', isActive, 'Has translated class:', hasTranslatedClass);

  return isActive || hasTranslatedClass;
}

/**
 * Check if Google Translate widget is loaded and available
 * This checks if the translate dropdown/widget is present in the DOM
 */
export function isGoogleTranslateLoaded(): boolean {
  if (typeof window === 'undefined') return false;

  // Check if the translate element exists in DOM
  const translateElement = document.getElementById('google_translate_element');
  if (!translateElement) return false;

  // Check if the select dropdown is present (indicates widget is loaded)
  const selectElement = document.querySelector('.goog-te-combo');
  return !!selectElement;
}

/**
 * Get the current selected language from Google Translate
 */
export function getCurrentLanguage(): string | null {
  const currentLang = getCookie('googtrans');
  if (!currentLang) return null;

  // Cookie format is /en/es (from/to)
  const parts = currentLang.split('/');
  return parts.length > 2 ? parts[2] : null;
}

/**
 * Translate text using the currently active Google Translate language
 * This works by inserting text into DOM, letting Google Translate process it, then reading it back
 */
export async function translateText(text: string): Promise<string> {
  const currentLang = getCurrentLanguage();

  // If no translation active or English, return original text
  if (!currentLang || currentLang === 'en') {
    return text;
  }

  return new Promise((resolve) => {
    // Create a hidden element with the text
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.visibility = 'hidden';
    tempDiv.innerHTML = text;
    tempDiv.setAttribute('translate', 'yes');

    document.body.appendChild(tempDiv);

    // Wait for Google Translate to process it
    setTimeout(() => {
      // Google Translate wraps translated text in font tags or span tags
      const fontElement = tempDiv.querySelector<HTMLElement>('font, span');
      const translatedText = fontElement ? fontElement.textContent || text : tempDiv.textContent || text;

      // Clean up
      document.body.removeChild(tempDiv);

      resolve(translatedText);
    }, 500); // Give Google Translate time to process
  });
}

/**
 * Translate multiple texts in batch
 */
export async function translateTexts(texts: string[]): Promise<string[]> {
  const promises = texts.map(text => translateText(text));
  return Promise.all(promises);
}
