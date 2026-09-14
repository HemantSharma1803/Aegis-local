import React from 'react';

export interface StatusIndicatorProps {
  status: 'online' | 'standby' | 'secure' | 'warning' | 'offline';
  label?: string;
  detail?: string;
  size?: 'sm' | 'md';
  pulse?: boolean;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  label,
  detail,
  size = 'sm',
  pulse = true,
}) => {
  const statusColors = {
    secure: {
      dot: 'bg-emerald-400',
      ring: 'bg-emerald-500/20',
      text: 'text-emerald-400',
    },
    online: {
      dot: 'bg-sky-400',
      ring: 'bg-sky-500/20',
      text: 'text-sky-400',
    },
    standby: {
      dot: 'bg-zinc-400',
      ring: 'bg-zinc-500/20',
      text: 'text-zinc-400',
    },
    warning: {
      dot: 'bg-amber-400',
      ring: 'bg-amber-500/20',
      text: 'text-amber-400',
    },
    offline: {
      dot: 'bg-red-400',
      ring: 'bg-red-500/20',
      text: 'text-red-400',
    },
  }[status];

  return (
    <div className="inline-flex items-center gap-2 select-none">
      <span className="relative flex h-2 w-2">
        {pulse && status === 'secure' && (
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${statusColors.ring}`}
          />
        )}
        <span
          className={`relative inline-flex rounded-full h-2 w-2 ${statusColors.dot}`}
        />
      </span>
      {label && (
        <span
          className={`text-xs font-medium tracking-tight ${
            size === 'sm' ? 'text-[11px]' : 'text-xs'
          } ${statusColors.text}`}
        >
          {label}
        </span>
      )}
      {detail && (
        <span className="text-[11px] text-zinc-500 font-normal">
          {detail}
        </span>
      )}
    </div>
  );
};
