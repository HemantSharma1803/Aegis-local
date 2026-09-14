import React from 'react';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  secondaryAction?: React.ReactNode;
  badgeText?: string;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  secondaryAction,
  badgeText,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 md:p-12 border border-dashed border-zinc-800/80 rounded-xl bg-zinc-900/20 max-w-2xl mx-auto my-auto ${className}`}
    >
      {badgeText && (
        <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 bg-zinc-800/80 px-2 py-0.5 rounded-full border border-zinc-700/50 mb-4">
          {badgeText}
        </span>
      )}

      {icon && (
        <div className="w-12 h-12 rounded-xl bg-zinc-800/60 border border-zinc-700/40 flex items-center justify-center text-zinc-400 mb-4 shadow-sm">
          {icon}
        </div>
      )}

      <h3 className="text-base font-semibold text-zinc-100 tracking-tight mb-2">
        {title}
      </h3>

      <p className="text-sm text-zinc-400 max-w-md leading-relaxed mb-6">
        {description}
      </p>

      {(action || secondaryAction) && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {action}
          {secondaryAction}
        </div>
      )}
    </div>
  );
};
