/**
 * Mobile Optimization Utilities
 * 
 * Helper functions for enhancing mobile experience
 */

/**
 * Detect if user is on mobile device
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Detect if user is on iOS
 */
export function isIOS(): boolean {
  if (typeof window === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

/**
 * Detect if user is on Android
 */
export function isAndroid(): boolean {
  if (typeof window === 'undefined') return false;
  return /Android/.test(navigator.userAgent);
}

/**
 * Get device type
 */
export function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop';
  
  const width = window.innerWidth;
  
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

/**
 * Prevent default touch behaviors (useful for custom gestures)
 */
export function preventDefaultTouch(element: HTMLElement) {
  element.addEventListener('touchstart', (e) => {
    e.preventDefault();
  }, { passive: false });
}

/**
 * Disable double-tap zoom on element
 */
export function disableDoubleTapZoom(element: HTMLElement) {
  let lastTouchEnd = 0;
  
  element.addEventListener('touchend', (e) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
      e.preventDefault();
    }
    lastTouchEnd = now;
  }, { passive: false });
}

/**
 * Add haptic feedback (vibration) on touch
 */
export function addHapticFeedback(duration: number = 10) {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(duration);
  }
}

/**
 * Detect swipe gesture
 */
export interface SwipeEvent {
  direction: 'left' | 'right' | 'up' | 'down';
  distance: number;
}

export function detectSwipe(
  element: HTMLElement,
  callback: (event: SwipeEvent) => void,
  threshold: number = 50
) {
  let touchStartX = 0;
  let touchStartY = 0;
  let touchEndX = 0;
  let touchEndY = 0;

  element.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
  }, { passive: true });

  element.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    touchEndY = e.changedTouches[0].screenY;
    handleSwipe();
  }, { passive: true });

  function handleSwipe() {
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    if (absDeltaX < threshold && absDeltaY < threshold) return;

    if (absDeltaX > absDeltaY) {
      // Horizontal swipe
      if (deltaX > 0) {
        callback({ direction: 'right', distance: absDeltaX });
      } else {
        callback({ direction: 'left', distance: absDeltaX });
      }
    } else {
      // Vertical swipe
      if (deltaY > 0) {
        callback({ direction: 'down', distance: absDeltaY });
      } else {
        callback({ direction: 'up', distance: absDeltaY });
      }
    }
  }
}

/**
 * Optimize touch scrolling performance
 */
export function optimizeTouchScroll() {
  if (typeof document === 'undefined') return;
  
  // Enable momentum scrolling on iOS
  document.body.style.webkitOverflowScrolling = 'touch';
  
  // Disable pull-to-refresh on mobile Chrome
  document.body.style.overscrollBehavior = 'none';
}

/**
 * Check if device has slow connection
 */
export function hasSlowConnection(): boolean {
  if (typeof navigator === 'undefined') return false;
  
  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
  
  if (!connection) return false;
  
  return (
    connection.saveData ||
    connection.effectiveType === 'slow-2g' ||
    connection.effectiveType === '2g' ||
    connection.effectiveType === '3g'
  );
}

/**
 * Get optimal image size for device
 */
export function getOptimalImageSize(): 'small' | 'medium' | 'large' {
  if (typeof window === 'undefined') return 'medium';
  
  const width = window.innerWidth;
  const dpr = window.devicePixelRatio || 1;
  
  if (width < 768) return 'small';
  if (width < 1024 || dpr < 2) return 'medium';
  return 'large';
}

/**
 * Format phone number for click-to-call
 */
export function formatPhoneForCall(phone: string): string {
  // Remove all non-numeric characters except +
  return phone.replace(/[^0-9+]/g, '');
}

/**
 * Create click-to-call link
 */
export function createCallLink(phone: string): string {
  return `tel:${formatPhoneForCall(phone)}`;
}

/**
 * Create tap-to-email link
 */
export function createEmailLink(email: string, subject?: string, body?: string): string {
  let link = `mailto:${email}`;
  
  const params: string[] = [];
  if (subject) params.push(`subject=${encodeURIComponent(subject)}`);
  if (body) params.push(`body=${encodeURIComponent(body)}`);
  
  if (params.length > 0) {
    link += `?${params.join('&')}`;
  }
  
  return link;
}

/**
 * Lock body scroll (useful for modals)
 */
export function lockBodyScroll() {
  if (typeof document === 'undefined') return;
  
  const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
  document.body.style.overflow = 'hidden';
  document.body.style.paddingRight = `${scrollbarWidth}px`;
}

/**
 * Unlock body scroll
 */
export function unlockBodyScroll() {
  if (typeof document === 'undefined') return;
  
  document.body.style.overflow = '';
  document.body.style.paddingRight = '';
}

/**
 * Check if device supports touch
 */
export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;
  
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    (navigator as any).msMaxTouchPoints > 0
  );
}

/**
 * Get safe area insets for notched devices (iPhone X, etc.)
 */
export function getSafeAreaInsets() {
  if (typeof window === 'undefined') return { top: 0, right: 0, bottom: 0, left: 0 };
  
  const style = getComputedStyle(document.documentElement);
  
  return {
    top: parseInt(style.getPropertyValue('--sat') || '0'),
    right: parseInt(style.getPropertyValue('--sar') || '0'),
    bottom: parseInt(style.getPropertyValue('--sab') || '0'),
    left: parseInt(style.getPropertyValue('--sal') || '0'),
  };
}

/**
 * Prevent iOS rubber band scrolling
 */
export function preventIOSRubberBand() {
  if (!isIOS()) return;
  
  let startY = 0;
  
  document.addEventListener('touchstart', (e) => {
    startY = e.touches[0].pageY;
  }, { passive: true });
  
  document.addEventListener('touchmove', (e) => {
    const y = e.touches[0].pageY;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const isScrollingUp = y > startY;
    const isAtTop = scrollTop === 0;
    
    if (isAtTop && isScrollingUp) {
      e.preventDefault();
    }
  }, { passive: false });
}

/**
 * Optimize animations for mobile (reduce complexity)
 */
export function shouldReduceAnimations(): boolean {
  return isMobileDevice() || hasSlowConnection();
}



