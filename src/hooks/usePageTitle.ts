import { useEffect } from 'react';

const DEFAULT_TITLE = 'AgroTensor — Smart Farm Intelligence';

/**
 * Sets the browser tab title for the current page and restores the previous
 * title on unmount. Call with no argument to fall back to the default title.
 */
export function usePageTitle(title?: string) {
  useEffect(() => {
    const previous = document.title;
    document.title = title ? `${title} — AgroTensor` : DEFAULT_TITLE;
    return () => {
      document.title = previous;
    };
  }, [title]);
}
