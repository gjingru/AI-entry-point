import React, { useState } from 'react';

interface RadioButtonProps {
  id: string;
  value: string;
  label: string;
  isSelected: boolean;
  isFocused: boolean;
  onSelect: (value: string) => void;
  onFocus: (id: string) => void;
  onBlur: () => void;
  onMouseEnter: (id: string) => void;
  onMouseLeave: () => void;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export default function RadioButton({
  id,
  value,
  label,
  isSelected,
  isFocused,
  onSelect,
  onFocus,
  onBlur,
  onMouseEnter,
  onMouseLeave,
  size = 'medium',
  className = ''
}: RadioButtonProps) {
  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return {
          container: 'pl-2 pr-3 h-10', // Fixed height of 40px (h-10)
          radio: 'w-4 h-4',
          dot: 'w-1 h-1',
          text: 'text-sm'
        };
      case 'large':
        return {
          container: 'pl-4 pr-6 h-10', // Fixed height of 40px (h-10)
          radio: 'w-7 h-7',
          dot: 'w-2 h-2',
          text: 'text-base'
        };
      default: // medium
        return {
          container: 'pl-3 pr-4 h-10', // Fixed height of 40px (h-10)
          radio: 'w-5 h-5',
          dot: 'w-1.5 h-1.5',
          text: 'text-sm'
        };
    }
  };

  const sizeClasses = getSizeClasses();

  const getContainerClasses = () => {
    const baseClasses = 'border border-solid box-border flex gap-2 items-center relative rounded-lg shrink-0 w-full cursor-pointer transition-all duration-200';
    
    if (isSelected) {
      return `${baseClasses} bg-white border-[#4a6ba6] shadow-sm ${sizeClasses.container} ${className}`;
    } else if (isFocused) {
      return `${baseClasses} bg-white border-[#4a6ba6] border-opacity-50 shadow-sm ${sizeClasses.container} ${className}`;
    } else {
      return `${baseClasses} bg-white border-[#bfbebe] hover:border-[#4a6ba6] hover:border-opacity-30 ${sizeClasses.container} ${className}`;
    }
  };

  const getRadioClasses = () => {
    if (isSelected) {
      return `w-6 h-6 rounded-full border-2 border-[#4a6ba6] bg-[#4a6ba6] flex items-center justify-center`;
    } else {
      return `w-6 h-6 rounded-full border-2 transition-all duration-200 ${
        isFocused ? 'border-[#4a6ba6] border-opacity-50' : 'border-[#bfbebe]'
      }`;
    }
  };

  return (
    <div
      className={getContainerClasses()}
      onClick={() => onSelect(value)}
      onFocus={() => onFocus(id)}
      onBlur={onBlur}
      onMouseEnter={() => onMouseEnter(id)}
      onMouseLeave={onMouseLeave}
      tabIndex={0}
    >
      <div className="flex flex-[1_0_0] gap-1 items-center min-h-px min-w-px relative shrink-0">
        <div className="overflow-clip relative shrink-0 w-8 h-8 flex items-center justify-center">
          {isSelected ? (
            <div className={getRadioClasses()}>
              <div className={`${sizeClasses.dot} rounded-full bg-white`}></div>
            </div>
          ) : (
            <div className={getRadioClasses()}></div>
          )}
        </div>
        <div className="box-border flex flex-[1_0_0] flex-col gap-[2px] items-start justify-center min-h-px min-w-px px-0 py-[5px] relative shrink-0">
          <p className={`font-normal leading-[22px] relative shrink-0 ${sizeClasses.text} text-black tracking-[0.5px] w-full whitespace-pre-wrap`}>
            {label}
          </p>
        </div>
      </div>
    </div>
  );
}

// Hook for managing radio button group state
export function useRadioGroup(initialValue: string) {
  const [selectedValue, setSelectedValue] = useState(initialValue);
  const [focusedId, setFocusedId] = useState<string | null>(null);

  const handleSelect = (value: string) => {
    setSelectedValue(value);
  };

  const handleFocus = (id: string) => {
    setFocusedId(id);
  };

  const handleBlur = () => {
    setFocusedId(null);
  };

  const handleMouseEnter = (id: string) => {
    setFocusedId(id);
  };

  const handleMouseLeave = () => {
    setFocusedId(null);
  };

  return {
    selectedValue,
    focusedId,
    handleSelect,
    handleFocus,
    handleBlur,
    handleMouseEnter,
    handleMouseLeave
  };
}
