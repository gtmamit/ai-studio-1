import React, { useState } from 'react';

interface StudioImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackLabel?: string;
}

export const StudioImage: React.FC<StudioImageProps> = ({
  src,
  alt,
  className = '',
  fallbackLabel,
}) => {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-[#f0edec] text-[#737373] p-6 select-none ${className}`}
        role="img"
        aria-label={alt}
      >
        <svg
          width="40"
          height="24"
          viewBox="0 0 40 24"
          fill="none"
          aria-hidden="true"
          className="mb-2 text-[#141414]/35"
        >
          <path
            d="M3 18.5C3 16.5 6.5 14 11 12.5C15.5 11 17 7 18.5 4.5C21 7.5 25.5 10.5 31.5 11.5C35.5 12.2 37.5 14.5 37.5 17.5C37.5 19 36.2 19.5 34 19.5H6C4 19.5 3 19.2 3 18.5Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
        <span className="text-xs font-medium tracking-wide text-[#737373]">
          {fallbackLabel || alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
};
