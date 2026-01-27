import React, { useState, useEffect } from 'react';
import { icons } from '../utils/icons';

// Using local icons
const imgChevronRight = icons.ChevronRight;
// Divider removed - using CSS border instead

const ROTATING_PLACEHOLDER_KEY = 'devOptions.rotatingPlaceholder';

export default function DevOptionsNav() {
  const [isRotatingPlaceholder, setIsRotatingPlaceholder] = useState(() => {
    // Default to true if not set
    const stored = localStorage.getItem(ROTATING_PLACEHOLDER_KEY);
    return stored !== null ? stored === 'true' : true;
  });

  useEffect(() => {
    localStorage.setItem(ROTATING_PLACEHOLDER_KEY, String(isRotatingPlaceholder));
    // Dispatch event so StartHiringView can react to changes
    window.dispatchEvent(new CustomEvent('rotatingPlaceholderChanged', { 
      detail: { enabled: isRotatingPlaceholder } 
    }));
  }, [isRotatingPlaceholder]);

  return (
    <nav className="sticky top-0 z-[60] bg-[#b9dbf3] flex items-center gap-[11px] px-[11px] h-[30px]">
      <p className="font-medium leading-[16px] text-[12px] text-[#1e4aa9] text-center tracking-[0px] shrink-0">
        Dev options
      </p>
      
      {/* Rotating placeholder text toggle */}
      <div className="flex items-center gap-2 px-2">
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={isRotatingPlaceholder}
            onChange={(e) => setIsRotatingPlaceholder(e.target.checked)}
            className="w-3.5 h-3.5 cursor-pointer accent-[#1e4aa9]"
          />
          <p className="font-medium leading-[16px] text-[12px] text-[#202022] text-center tracking-[0px] shrink-0">
            Rotating placeholder text
          </p>
        </label>
      </div>

      {/* Divider */}
      <div className="flex h-[18px] items-center justify-center relative shrink-0 w-px">
        <div className="h-full w-px bg-gray-400" />
      </div>
      
      {/* Admin settings button */}
      <button className="flex gap-1 items-center justify-center h-6 px-2 rounded-md shrink-0 hover:opacity-80 transition-opacity">
        <p className="font-medium leading-[16px] text-[12px] text-[#202022] text-center tracking-[0px] shrink-0">
          Admin settings
        </p>
        <div className="overflow-clip relative shrink-0 w-3 h-3">
          <div className="absolute inset-[39.45%_31.12%_37.25%_31.13%]">
            <img 
              alt="Chevron right" 
              className="block max-w-none w-full h-full" 
              src={imgChevronRight}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          </div>
        </div>
      </button>

      {/* Divider */}
      <div className="flex h-[18px] items-center justify-center relative shrink-0 w-px">
        <div className="h-full w-px bg-gray-400" />
      </div>

      {/* Seed company data button */}
      <button className="flex gap-1 items-center justify-center h-6 px-2 rounded-md shrink-0 hover:opacity-80 transition-opacity">
        <p className="font-medium leading-[16px] text-[12px] text-[#202022] text-center tracking-[0px] shrink-0">
          Seed company data
        </p>
        <div className="overflow-clip relative shrink-0 w-3 h-3">
          <div className="absolute inset-[39.45%_31.12%_37.25%_31.13%]">
            <img 
              alt="Chevron right" 
              className="block max-w-none w-full h-full" 
              src={imgChevronRight}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          </div>
        </div>
      </button>
    </nav>
  );
}

