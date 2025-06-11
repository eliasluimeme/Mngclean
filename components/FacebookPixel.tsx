"use client";

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

interface FacebookEventOptions {
  [key: string]: string | number | boolean | object | undefined;
}

declare global {
  interface Window {
    fbq?: (type: string, eventName: string, options?: FacebookEventOptions) => void;
  }
}

export default function FacebookPixelPageTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Track page views on route changes
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'PageView');
      console.log('Facebook Pixel: PageView tracked for', pathname);
    }
  }, [pathname, searchParams]);

  return null; // This component doesn't render anything
}

export const fbEvent = (eventName: string, options: FacebookEventOptions = {}) => {
  if (typeof window !== 'undefined' && window.fbq) {
    try {
      window.fbq('track', eventName, options);
      console.log(`Facebook Pixel: Tracked ${eventName}`, options);
    } catch (error) {
      console.error('Facebook Pixel tracking error:', error);
    }
  } else {
    console.warn('Facebook Pixel not loaded or window not available');
  }
};

// Helper function for tracking custom events with better error handling
export const fbCustomEvent = (eventName: string, options: FacebookEventOptions = {}) => {
  if (typeof window !== 'undefined' && window.fbq) {
    try {
      window.fbq('trackCustom', eventName, options);
      console.log(`Facebook Pixel: Tracked custom event ${eventName}`, options);
    } catch (error) {
      console.error('Facebook Pixel custom tracking error:', error);
    }
  } else {
    console.warn('Facebook Pixel not loaded or window not available');
  }
};
