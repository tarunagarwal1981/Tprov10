'use client';

import React, { useEffect, useRef } from 'react';
import Script from 'next/script';

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '';

interface TurnstileWidgetProps {
  onSuccess: (token: string) => void;
  onError?: () => void;
  theme?: 'light' | 'dark' | 'auto';
  size?: 'normal' | 'compact';
  mode?: 'managed' | 'non-interactive' | 'invisible';
}

declare global {
  interface Window {
    turnstile: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback?: (token: string) => void;
          'error-callback'?: () => void;
          'expired-callback'?: () => void;
          theme?: 'light' | 'dark' | 'auto';
          size?: 'normal' | 'compact';
        }
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

export const TurnstileWidget: React.FC<TurnstileWidgetProps> = ({
  onSuccess,
  onError,
  theme = 'auto',
  size = 'normal',
  mode = 'managed',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const scriptLoadedRef = useRef(false);

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY || !scriptLoadedRef.current || !containerRef.current) return;

    const renderWidget = () => {
      if (window.turnstile && containerRef.current && !widgetIdRef.current) {
        try {
          const id = window.turnstile.render(containerRef.current, {
            sitekey: TURNSTILE_SITE_KEY,
            callback: (token: string) => {
              onSuccess(token);
            },
            'error-callback': () => {
              onError?.();
            },
            'expired-callback': () => {
              // Token expired, reset widget
              if (widgetIdRef.current) {
                window.turnstile.reset(widgetIdRef.current);
              }
            },
            theme,
            size,
          });
          widgetIdRef.current = id;
        } catch (err) {
          console.error('Turnstile render error:', err);
          onError?.();
        }
      }
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(renderWidget, 100);
    return () => clearTimeout(timer);
  }, [onSuccess, onError, theme, size]);

  const handleScriptLoad = () => {
    scriptLoadedRef.current = true;
    // Trigger re-render to create widget
    if (containerRef.current) {
      const timer = setTimeout(() => {
        if (window.turnstile && containerRef.current && !widgetIdRef.current) {
          try {
            const id = window.turnstile.render(containerRef.current, {
              sitekey: TURNSTILE_SITE_KEY,
              callback: (token: string) => {
                onSuccess(token);
              },
              'error-callback': () => {
                onError?.();
              },
              'expired-callback': () => {
                if (widgetIdRef.current) {
                  window.turnstile.reset(widgetIdRef.current);
                }
              },
              theme,
              size,
            });
            widgetIdRef.current = id;
          } catch (err) {
            console.error('Turnstile render error:', err);
            onError?.();
          }
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  };

  const reset = () => {
    if (widgetIdRef.current && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current);
    }
  };

  // Expose reset method via ref (if needed)
  React.useImperativeHandle(React.forwardRef(() => null), () => ({ reset }));

  if (!TURNSTILE_SITE_KEY) {
    return (
      <div className="text-xs text-gray-500 dark:text-gray-400 text-center py-2">
        Turnstile not configured
      </div>
    );
  }

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        onLoad={handleScriptLoad}
        onError={() => {
          console.error('Failed to load Turnstile script');
          onError?.();
        }}
        strategy="lazyOnload"
      />
      <div ref={containerRef} className="flex justify-center" />
    </>
  );
};
