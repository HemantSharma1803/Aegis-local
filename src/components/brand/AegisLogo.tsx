import React from 'react';

interface AegisLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

export const AegisLogo: React.FC<AegisLogoProps> = ({
  size = 'md',
  showText = true,
  className = '',
}) => {
  const iconDimensions = {
    sm: 'w-5 h-5',
    md: 'w-7 h-7',
    lg: 'w-9 h-9',
    xl: 'w-12 h-12',
  }[size];

  const textSizes = {
    sm: 'text-sm font-semibold tracking-wider',
    md: 'text-base font-semibold tracking-wider',
    lg: 'text-lg font-bold tracking-wider',
    xl: 'text-2xl font-bold tracking-wider',
  }[size];

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Abstract shield emblem: Outer faceted boundary with local intelligence core */}
      <div className={`relative flex items-center justify-center ${iconDimensions} text-zinc-100 flex-shrink-0`}>
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-[0_0_12px_rgba(16,185,129,0.15)]"
        >
          {/* Subtle outer shield facet */}
          <path
            d="M16 2.5L27 6.5V15.5C27 22.8 22.3 27.6 16 29.5C9.7 27.6 5 22.8 5 15.5V6.5L16 2.5Z"
            fill="#111319"
            stroke="#2e3342"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          {/* Inner protective geometric vault */}
          <path
            d="M16 6.5L23 9.5V15C23 20 19.8 23.5 16 25C12.2 23.5 9 20 9 15V9.5L16 6.5Z"
            fill="#181b24"
            stroke="#3b4255"
            strokeWidth="1"
            strokeLinejoin="round"
          />
          {/* Local intelligence focal nexus */}
          <path
            d="M16 11L19.5 14.5L16 18L12.5 14.5L16 11Z"
            fill="#10b981"
            className="transition-colors duration-300"
          />
          {/* Center pinpoint */}
          <circle cx="16" cy="14.5" r="1" fill="#ffffff" />
          {/* Bottom stabilizing anchor line */}
          <path
            d="M16 18V21.5"
            stroke="#10b981"
            strokeWidth="1.25"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col leading-none">
          <div className="flex items-center gap-1.5">
            <span className={`font-mono text-zinc-100 uppercase tracking-widest ${textSizes}`}>
              Aegis
            </span>
            <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-zinc-800/90 text-emerald-400 border border-emerald-500/20 tracking-wider">
              Local
            </span>
          </div>
          <span className="text-[10px] tracking-normal text-zinc-400 mt-1 font-medium">
            On-Device AI Presentation Coach
          </span>
        </div>
      )}
    </div>
  );
};
