import { useState } from 'react';

interface ResilientImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackLabel?: string;
}

export function ResilientImage({ src, alt, className = '', fallbackLabel }: ResilientImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex flex-col items-center justify-center bg-[#F3F2EE] text-[#57534E] px-4 text-center ${className}`}
      >
        <svg
          width="36"
          height="36"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.25"
          className="mb-2 opacity-60"
          aria-hidden="true"
        >
          <path d="M3 7v11" />
          <path d="M21 7v11" />
          <path d="M3 14h18" />
          <path d="M5 10h14a2 2 0 0 1 2 2v2H3v-2a2 2 0 0 1 2-2Z" />
        </svg>
        <span className="text-xs font-medium tracking-wide">{fallbackLabel || alt}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
