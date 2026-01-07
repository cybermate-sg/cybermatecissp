/**
 * Utility functions for Google Translate integration
 */

/**
 * Triggers Google Translate to re-translate the page or a specific element
 * This is useful for dynamically added content like modals
 */
export function triggerGoogleTranslate(): void {
  // Check if Google Translate is active
  const currentLang = getCookie('googtrans');

  if (!currentLang || currentLang === '/en/en' || currentLang === '') {
    // No translation active, skip
    return;
  }

  // Extract the target language code (format is /en/es)
  const parts = currentLang.split('/');
  const targetLang = parts.length > 2 ? parts[2] : null;

  if (!targetLang) return;

  // Method 1: Try to trigger via the select dropdown with longer delays
  const selectElement = document.querySelector('.goog-te-combo') as HTMLSelectElement;
  if (selectElement) {
    console.log('Found select element, triggering translation to:', targetLang);

    // First, reset to English
    selectElement.value = '';
    const changeEvent1 = new Event('change', { bubbles: true });
    selectElement.dispatchEvent(changeEvent1);

    // Wait longer before switching back to target language
    setTimeout(() => {
      selectElement.value = targetLang;
      const changeEvent2 = new Event('change', { bubbles: true });
      selectElement.dispatchEvent(changeEvent2);
      console.log('Dispatched change event to:', targetLang);
    }, 300);
    return;
  }

  console.log('Select element not found, trying DOM manipulation method');

  // Method 2: Force full page reload of translation by manipulating the DOM
  setTimeout(() => {
    const html = document.documentElement;
    const isRTL = html.classList.contains('translated-rtl');
    const isLTR = html.classList.contains('translated-ltr');

    if (isRTL || isLTR) {
      // Remove translation classes
      html.classList.remove('translated-ltr', 'translated-rtl');

      // Force a reflow
      void html.offsetHeight;

      // Restore classes after a brief delay
      setTimeout(() => {
        if (isRTL) html.classList.add('translated-rtl');
        if (isLTR) html.classList.add('translated-ltr');
      }, 100);
    }
  }, 200);
}

/**
 * Get a cookie value by name
 */
function getCookie(name: string): string {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || '';
  }
  return '';
}

/**
 * Check if Google Translate is currently active (language already selected)
 */
export function isGoogleTranslateActive(): boolean {
  const currentLang = getCookie('googtrans');
  return !!(currentLang && currentLang !== '/en/en' && currentLang !== '');
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
