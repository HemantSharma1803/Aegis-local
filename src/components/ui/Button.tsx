import React from 'react';

export interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'loading'> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  isLoading?: boolean;
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  isLoading = false,
  loading = false,
  className = '',
  disabled,
  ...props
}) => {
  const effectiveLoading = isLoading || loading;
  const baseStyles =
    'inline-flex items-center justify-center font-medium transition-all duration-150 rounded-lg outline-none select-none disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 whitespace-nowrap cursor-pointer';

  const sizeStyles = {
    xs: 'text-[11px] px-2.5 py-1 gap-1 min-h-[26px]',
    sm: 'text-xs px-3 py-1.5 gap-1.5 min-h-[32px]',
    md: 'text-sm px-4 py-2 gap-2 min-h-[38px]',
    lg: 'text-sm px-5 py-2.5 gap-2.5 min-h-[44px] font-semibold',
  }[size];

  const variantStyles = {
    primary:
      'bg-zinc-100 text-zinc-900 hover:bg-white border border-white/20 shadow-sm hover:shadow active:bg-zinc-200',
    secondary:
      'bg-zinc-800/80 text-zinc-200 hover:bg-zinc-700/80 hover:text-white border border-zinc-700/60 shadow-sm',
    outline:
      'bg-transparent text-zinc-300 hover:bg-zinc-800/60 hover:text-white border border-zinc-700/80',
    ghost:
      'bg-transparent text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 border border-transparent',
    danger:
      'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/50',
  }[variant];

  return (
    <button
      className={`${baseStyles} ${sizeStyles} ${variantStyles} ${className}`}
      disabled={disabled || effectiveLoading}
      {...props}
    >
      {effectiveLoading ? (
        <svg
          className="animate-spin -ml-0.5 mr-2 h-4 w-4 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : (
        icon && iconPosition === 'left' && <span className="flex-shrink-0">{icon}</span>
      )}
      <span>{children}</span>
      {!effectiveLoading && icon && iconPosition === 'right' && (
        <span className="flex-shrink-0">{icon}</span>
      )}
    </button>
  );
};
