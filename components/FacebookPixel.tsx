"use client";

import Script from 'next/script';
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

const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FB_PIXEL_ID;

export default function FacebookPixel() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (window.fbq) {
      window.fbq('track', 'PageView');
    }
  }, [pathname, searchParams]);

  if (!FB_PIXEL_ID) return null;

  return (
    <>
      <Script
        id="fb-pixel-script"
        src="/fb-pixel.js"
        strategy="afterInteractive"
        onLoad={() => {
          window.fbq?.('init', FB_PIXEL_ID);
          window.fbq?.('track', 'PageView');
        }}
      />
    </>
  );
}

export const fbEvent = (eventName: string, options: FacebookEventOptions = {}) => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', eventName, options);
  }
};
