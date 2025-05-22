'use client';

import dynamic from 'next/dynamic';

const FacebookPixel = dynamic(() => import('./FacebookPixel'), {
  ssr: false
});

export function Providers() {
  return <FacebookPixel />;
} 