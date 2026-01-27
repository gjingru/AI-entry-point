import { useState } from 'react';

export interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  appearance?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

export default function Button({
  children,
  onClick,
  disabled = false,
  type = 'button',
  appearance = 'primary',
  size = 'md',
  className = ''
}: ButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  // Size configurations
  const getSizeClasses = () => {
    switch (size) {
      case 'xs':
        return {
          container: 'h-6 px-2 py-0',
          text: 'text-[12px] leading-[16px]'
        };
      case 'sm':
        return {
          container: 'h-8 px-3 py-0',
          text: 'text-[14px] leading-[20px]'
        };
      case 'lg':
        return {
          container: 'h-12 px-4 py-0',
          text: 'text-[16px] leading-[24px]'
        };
      default: // md
        return {
          container: 'h-10 px-4 py-0',
          text: 'text-[15px] leading-[19px]'
        };
    }
  };

  const sizeClasses = getSizeClasses();

  // Appearance classes
  const getAppearanceClasses = () => {
    if (disabled) {
      return {
        container: 'bg-[rgba(0,0,0,0.05)] cursor-not-allowed',
        text: 'text-[rgba(0,0,0,0.4)]'
      };
    }

    if (isPressed && appearance === 'primary') {
      return {
        container: 'bg-[#502d3c] cursor-pointer',
        text: 'text-white'
      };
    }

    if (isHovered && appearance === 'primary') {
      return {
        container: 'bg-[#502d3c] cursor-pointer',
        text: 'text-white'
      };
    }

    switch (appearance) {
      case 'primary':
        return {
          container: 'bg-[#502d3c] cursor-pointer hover:bg-[#502d3c]/90 active:bg-[#502d3c]',
          text: 'text-white'
        };
      case 'secondary':
        return {
          container: 'bg-white border border-[#d3d3d3] cursor-pointer hover:border-[#4a6ba6]',
          text: 'text-[#252528]'
        };
      case 'outline':
        return {
          container: 'bg-white border border-[#bfbebe] cursor-pointer hover:border-[#4a6ba6]',
          text: 'text-black'
        };
      case 'ghost':
        return {
          container: 'bg-transparent cursor-pointer hover:bg-[rgba(0,0,0,0.05)]',
          text: 'text-black'
        };
      default:
        return {
          container: 'bg-[#502d3c] cursor-pointer',
          text: 'text-white'
        };
    }
  };

  const appearanceClasses = getAppearanceClasses();

  const handleMouseEnter = () => {
    if (!disabled) {
      setIsHovered(true);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setIsPressed(false);
  };

  const handleMouseDown = () => {
    if (!disabled) {
      setIsPressed(true);
    }
  };

  const handleMouseUp = () => {
    setIsPressed(false);
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      className={`box-border flex gap-2 items-center justify-center overflow-clip ${sizeClasses.container} relative rounded-lg shrink-0 transition-all duration-200 ${appearanceClasses.container} ${className}`}
      style={
        !disabled && isHovered && appearance === 'primary'
          ? {
              backgroundImage: 'linear-gradient(90deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.1) 100%), linear-gradient(90deg, rgba(80, 45, 60, 1) 0%, rgba(80, 45, 60, 1) 100%)'
            }
          : !disabled && isPressed && appearance === 'primary'
          ? {
              backgroundImage: 'linear-gradient(90deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.2) 100%), linear-gradient(90deg, rgba(80, 45, 60, 1) 0%, rgba(80, 45, 60, 1) 100%)'
            }
          : undefined
      }
    >
      <p className={`font-medium leading-[19px] relative shrink-0 ${sizeClasses.text} ${appearanceClasses.text} text-center tracking-[0.25px]`}>
        {children}
      </p>
    </button>
  );
}

