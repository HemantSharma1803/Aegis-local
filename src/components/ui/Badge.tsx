import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'neutral' | 'success' | 'warning' | 'info' | 'outline' | 'danger' | 'error';
  size?: 'sm' | 'md';
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  dot = false,
  className = '',
  ...props
}) => {
  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 font-mono tracking-tight',
    md: 'text-xs px-2.5 py-1 font-medium',
  }[size];

  const variantStyles = {
    neutral: 'bg-zinc-800/80 text-zinc-300 border border-zinc-700/60',
    success: 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/50',
    warning: 'bg-amber-950/40 text-amber-400 border border-amber-800/50',
    info: 'bg-sky-950/40 text-sky-300 border border-sky-800/50',
    outline: 'bg-transparent text-zinc-400 border border-zinc-700/70',
    danger: 'bg-rose-950/40 text-rose-400 border border-rose-800/50',
    error: 'bg-rose-950/40 text-rose-400 border border-rose-800/50',
  }[variant];

  const dotColors = {
    neutral: 'bg-zinc-400',
    success: 'bg-emerald-400',
    warning: 'bg-amber-400',
    info: 'bg-sky-400',
    outline: 'bg-zinc-400',
    danger: 'bg-rose-400',
    error: 'bg-rose-400',
  }[variant];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md whitespace-nowrap ${sizeStyles} ${variantStyles} ${className}`}
      {...props}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors}`} />}
      <span>{children}</span>
    </span>
  );
};
