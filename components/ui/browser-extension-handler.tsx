'use client';

import { useEffect } from 'react';

export function BrowserExtensionHandler() {
  useEffect(() => {
    // Handle common browser extension attributes that cause hydration mismatches
    const handleExtensionAttributes = () => {
      const html = document.documentElement;
      const body = document.body;
      
      // Remove or normalize common extension attributes
      const extensionAttributes = [
        'webcrx',
        'data-extension',
        'data-adguard',
        'data-lastpass',
        'data-bitwarden',
        'cz-shortcut-listen',
        'spellcheck',
        'data-new-gr-c-s-check-loaded',
        'data-gr-ext-installed',
        'data-lt-installed',
        'webdriver-extension',
        'wot-modified'
      ];
      
      // Clean up HTML element
      extensionAttributes.forEach(attr => {
        if (html.hasAttribute(attr)) {
          html.removeAttribute(attr);
        }
        if (body && body.hasAttribute(attr)) {
          body.removeAttribute(attr);
        }
      });

      // Also clean up any style tags or scripts added by extensions
      const extensionStyles = document.querySelectorAll('style[data-extension], style[data-adblock]');
      extensionStyles.forEach(style => style.remove());
    };

    // Run immediately
    handleExtensionAttributes();
    
    // Run after a delay to catch late-loading extensions
    const timeout = setTimeout(handleExtensionAttributes, 100);
    
    // Set up a mutation observer to catch extension modifications
    const observer = new MutationObserver(() => {
      handleExtensionAttributes();
    });
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['webcrx', 'data-extension', 'data-adguard', 'data-lastpass', 'data-bitwarden']
    });
    
    return () => {
      clearTimeout(timeout);
      observer.disconnect();
    };
  }, []);

  return null;
}
