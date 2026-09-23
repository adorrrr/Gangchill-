import React from 'react';

interface SignatureProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'horizontal' | 'mark' | 'vertical';
}

/**
 * Gangchill's signature visual device:
 * Inspired by নদীর ঢেউ (river waves) and মাছ ধরার জালের geometry (fishing net woven rhythm).
 */
export const GangchillSignature: React.FC<SignatureProps> = ({
  className = '',
  size = 'md',
  variant = 'horizontal'
}) => {
  if (variant === 'mark') {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`inline-block ${size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-8 h-8' : 'w-5 h-5'} ${className}`}
        aria-hidden="true"
      >
        {/* River wave + net weave motif */}
        <path
          d="M2 12C6 8 10 16 14 12C18 8 22 16 22 16"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M2 16C6 12 10 20 14 16C18 12 22 20 22 20"
          stroke="currentColor"
          strokeWidth="1"
          strokeOpacity="0.6"
          strokeLinecap="round"
        />
        <circle cx="12" cy="6" r="2" fill="currentColor" />
      </svg>
    );
  }

  if (variant === 'vertical') {
    return (
      <div className={`flex flex-col items-center justify-center space-y-2 text-gangchill-ink/40 ${className}`}>
        <div className="w-px h-8 bg-gangchill-ink/15" />
        <span className="w-2 h-2 rotate-45 border border-gangchill-blue/60" />
        <div className="w-px h-8 bg-gangchill-ink/15" />
      </div>
    );
  }

  // Horizontal editorial river/net divider
  return (
    <div className={`w-full flex items-center justify-center my-10 sm:my-16 text-gangchill-ink/40 ${className}`}>
      <div className="h-px bg-gangchill-ink/12 flex-1 max-w-xs sm:max-w-sm" />
      <div className="px-4 flex items-center gap-2">
        <svg width="32" height="12" viewBox="0 0 32 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gangchill-blue">
          {/* Subtle river wave curve + net geometric diamond */}
          <path d="M2 6C6 3 10 9 14 6C18 3 22 9 26 6C28 4.5 30 5.5 31 6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M16 2L19 6L16 10L13 6L16 2Z" fill="#0284C7" fillOpacity="0.85" />
        </svg>
      </div>
      <div className="h-px bg-gangchill-ink/12 flex-1 max-w-xs sm:max-w-sm" />
    </div>
  );
};
