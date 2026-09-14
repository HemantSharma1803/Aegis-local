import React from 'react';
import { Minus, Square, X } from 'lucide-react';

export const WindowControls: React.FC = () => {
  return (
    <div className="flex items-center space-x-1 select-none text-zinc-500">
      <button
        aria-label="Minimize"
        className="w-7 h-7 inline-flex items-center justify-center hover:bg-zinc-800 hover:text-zinc-200 transition-colors rounded"
        onClick={() => {}}
      >
        <Minus className="w-3.5 h-3.5" />
      </button>
      <button
        aria-label="Maximize"
        className="w-7 h-7 inline-flex items-center justify-center hover:bg-zinc-800 hover:text-zinc-200 transition-colors rounded"
        onClick={() => {}}
      >
        <Square className="w-3 h-3" />
      </button>
      <button
        aria-label="Close"
        className="w-7 h-7 inline-flex items-center justify-center hover:bg-red-600 hover:text-white transition-colors rounded"
        onClick={() => {}}
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
