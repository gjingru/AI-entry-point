import React, { useState, useEffect } from 'react';
import { icons } from '../utils/icons';

// Using local icons
const imgChevronRight = icons.ChevronRight;
// Divider removed - using CSS border instead

const ROTATING_PLACEHOLDER_KEY = 'devOptions.rotatingPlaceholder';
const DESIGN_OPTION_KEY = 'devOptions.designOption';

export default function DevOptionsNav() {
  const [isRotatingPlaceholder, setIsRotatingPlaceholder] = useState(() => {
    // Default to true if not set
    const stored = localStorage.getItem(ROTATING_PLACEHOLDER_KEY);
    return stored !== null ? stored === 'true' : true;
  });

  const [designOption, setDesignOption] = useState<'A' | 'B'>(() => {
    const stored = localStorage.getItem(DESIGN_OPTION_KEY);
    return (stored === 'A' || stored === 'B') ? stored : 'A';
  });

  useEffect(() => {
    localStorage.setItem(ROTATING_PLACEHOLDER_KEY, String(isRotatingPlaceholder));
    // Dispatch event so StartHiringView can react to changes
    window.dispatchEvent(new CustomEvent('rotatingPlaceholderChanged', { 
      detail: { enabled: isRotatingPlaceholder } 
    }));
  }, [isRotatingPlaceholder]);

  useEffect(() => {
    localStorage.setItem(DESIGN_OPTION_KEY, designOption);
    // Dispatch event so StartHiringView can react to changes
    window.dispatchEvent(new CustomEvent('designOptionChanged', { 
      detail: { option: designOption } 
    }));
  }, [designOption]);

  return (
    <nav className="sticky top-0 z-[60] bg-[#b9dbf3] flex items-center gap-[11px] px-[11px] h-[30px]">
      <p className="font-medium leading-[16px] text-[12px] text-[#1e4aa9] text-center tracking-[0px] shrink-0">
        Dev options
      </p>
      
      {/* Design Option A/B toggle */}
      <div className="flex items-center gap-1 px-2">
        <p className="font-medium leading-[16px] text-[12px] text-[#202022] text-center tracking-[0px] shrink-0 mr-1">
          Design:
        </p>
        <button
          onClick={() => setDesignOption('A')}
          className={`px-2 py-0.5 text-[12px] font-medium rounded transition-colors ${
            designOption === 'A' 
              ? 'bg-[#1e4aa9] text-white' 
              : 'bg-white text-[#202022] hover:bg-gray-100'
          }`}
        >
          Option A
        </button>
        <button
          onClick={() => setDesignOption('B')}
          className={`px-2 py-0.5 text-[12px] font-medium rounded transition-colors ${
            designOption === 'B' 
              ? 'bg-[#1e4aa9] text-white' 
              : 'bg-white text-[#202022] hover:bg-gray-100'
          }`}
        >
          Option B
        </button>
      </div>

      {/* Divider */}
      <div className="flex h-[18px] items-center justify-center relative shrink-0 w-px">
        <div className="h-full w-px bg-gray-400" />
      </div>

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

