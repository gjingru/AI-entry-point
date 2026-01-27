import { useState } from 'react'
import FXPanel from './FXPanel'
import { icons } from '../utils/icons'

// Using local icons
const imgRipplingLogo = '/icons/SVGs/rippling-logo.svg';
const imgQuestionCircleOutline = icons.HelpOutline;
const imgQuestionCircleFilled = icons.HelpFilled;
const imgAccessibilityOutline = icons.AccessibilityOutline;
const imgAccessibilityFilled = icons.AccessibilityFilled;
const imgFxOutline = icons.FxOutline;
const imgFxFilled = icons.FxFilled;
const imgChevronDown = icons.ChevronDown;
const imgSearch = icons.SearchOutline;

interface RipplingNavProps {
  userName?: string;
  userRole?: string;
  companyName?: string;
  avatarUrl?: string;
  onNavigate?: (path: string) => void;
  footerBottomOffsetPx?: number; // leave space for a fixed footer below content
  isPanelOpen?: boolean;
  onPanelToggle?: (isOpen: boolean) => void;
}

export default function RipplingNav({
  userName = "Anne Montgomery",
  userRole = "Admin",
  companyName = "Neuralink",
  avatarUrl = "/images/cat.png",
  onNavigate,
  footerBottomOffsetPx = 0,
  isPanelOpen = false,
  onPanelToggle,
}: RipplingNavProps) {
  const [searchValue, setSearchValue] = useState("");
  const [isQuestionCircleActive, setIsQuestionCircleActive] = useState(false);
  const [isAccessibilityActive, setIsAccessibilityActive] = useState(false);
  
  const handlePanelToggle = () => {
    const newState = !isPanelOpen;
    if (onPanelToggle) {
      onPanelToggle(newState);
    }
  };

  return (
    <nav className="sticky top-[30px] z-50 bg-[#7A005D] flex items-center gap-4 px-3 py-2 w-full relative h-[52px] border-b-0">
      {/* Logo */}
      <button 
        onClick={() => onNavigate?.('/')}
        className="relative shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
        style={{ width: '134px', height: '34px' }}
        title="Go to Home"
      >
        <img 
          alt="Rippling Logo" 
          className="block" 
          src={imgRipplingLogo}
          style={{ width: '134px', height: '34px' }}
          onError={(e) => {
            // Fallback if image fails to load
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
          }}
        />
      </button>

      {/* Search Input - Centered in the middle */}
      <div className="flex-1 flex justify-center">
        <div className="bg-white/20 flex gap-2 h-8 items-center justify-center px-3 py-2 rounded-lg w-[400px]">
        <div className="relative shrink-0 w-5 h-5">
          <img 
            alt="Search" 
            className="block max-w-none w-full h-full" 
            style={{ filter: 'brightness(0) invert(1)' }}
            src={imgSearch}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        </div>
        <input
          type="text"
          placeholder="Search"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="flex-1 font-normal leading-[22px] bg-transparent border-0 outline-0 text-[15px] text-white/40 placeholder:text-white/40"
        />
        </div>
      </div>

      {/* Right Side Actions */}
      <div className="flex gap-6 items-center relative shrink-0 ml-auto">
        {/* Support Section */}
        <div className="flex gap-4 items-center justify-end relative rounded-sm shrink-0">
          <button
            onClick={() => setIsQuestionCircleActive(!isQuestionCircleActive)}
            className="relative shrink-0 w-6 h-6 cursor-pointer hover:opacity-80 transition-opacity flex items-center justify-center"
          >
            <img 
              alt="Question circle" 
              className="block max-w-none w-full h-full" 
              style={{ filter: 'brightness(0) invert(1)' }}
              src={isQuestionCircleActive ? imgQuestionCircleFilled : imgQuestionCircleOutline}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          </button>
          <button
            onClick={() => setIsAccessibilityActive(!isAccessibilityActive)}
            className="relative shrink-0 w-6 h-6 cursor-pointer hover:opacity-80 transition-opacity flex items-center justify-center"
          >
            <img 
              alt="Accessibility" 
              className="block max-w-none w-full h-full" 
              style={{ filter: 'brightness(0) invert(1)' }}
              src={isAccessibilityActive ? imgAccessibilityFilled : imgAccessibilityOutline}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          </button>
          {/* FX Icon */}
          <button 
            onClick={handlePanelToggle}
            className="relative shrink-0 w-6 h-6 cursor-pointer hover:opacity-80 transition-opacity flex items-center justify-center"
          >
            <img 
              alt="FX icon" 
              className="block max-w-none w-full h-full" 
              style={{ filter: 'brightness(0) invert(1)' }}
              src={isPanelOpen ? imgFxFilled : imgFxOutline}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          </button>
        </div>

        {/* Divider */}
        <div className="bg-white h-8 opacity-30 shrink-0 w-px" />

        {/* Account Button */}
        <button className="flex gap-3 items-center relative shrink-0 cursor-pointer hover:opacity-90 transition-opacity">
          <div className="flex gap-3 items-center relative shrink-0">
            {/* Avatar */}
            <div className="flex gap-2 items-start relative shrink-0">
              <div className="border border-[#dfdede] border-solid relative rounded-full shrink-0 w-8 h-8 overflow-hidden">
                {avatarUrl ? (
                  <img 
                    alt={`${userName} avatar`} 
                    className="absolute inset-0 w-full h-full object-cover rounded-full" 
                    src={avatarUrl}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        parent.innerHTML = `<div class="w-full h-full bg-white/20 flex items-center justify-center text-white text-xs font-medium">${userName.charAt(0)}</div>`;
                      }
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-white/20 flex items-center justify-center text-white text-xs font-medium">
                    {userName.charAt(0)}
                  </div>
                )}
              </div>
            </div>

            {/* User Info */}
            <div className="flex flex-col gap-1 items-start leading-none relative shrink-0 text-[13px]">
              <p className="font-medium relative shrink-0 text-white tracking-[0.25px]">
                {userName}
              </p>
              <p className="font-normal relative shrink-0 text-[#dfdede] tracking-[0.5px]">
                {userRole} • {companyName}
              </p>
            </div>
          </div>

          {/* Chevron Down */}
          <div className="relative shrink-0 w-6 h-6">
            <img 
              alt="Chevron down" 
              className="block max-w-none w-full h-full" 
              style={{ filter: 'brightness(0) invert(1)' }}
              src={imgChevronDown}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          </div>
        </button>
      </div>
      
      {/* FX Panel */}
      <FXPanel 
        isOpen={isPanelOpen} 
        onClose={() => onPanelToggle?.(false)} 
        bottomOffsetPx={footerBottomOffsetPx}
        onNavigate={onNavigate}
        avatarUrl={avatarUrl}
      />
    </nav>
  );
}
