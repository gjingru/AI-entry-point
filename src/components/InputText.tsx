import { useState, useRef } from 'react';

export interface InputTextProps {
  id?: string;
  label: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  placeholder?: string;
  required?: boolean;
  error?: boolean;
  errorMessage?: string;
  disabled?: boolean;
  type?: 'text' | 'email' | 'password' | 'tel' | 'url';
  className?: string;
  size?: 'xs' | 's' | 'm' | 'l';
}

export default function InputText({
  id,
  label,
  value: controlledValue,
  defaultValue = '',
  onChange,
  onFocus,
  onBlur,
  placeholder,
  required = false,
  error = false,
  errorMessage,
  disabled = false,
  type = 'text',
  className = '',
  size = 'm'
}: InputTextProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Determine if component is controlled or uncontrolled
  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : internalValue;

  // Handle value changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (!isControlled) {
      setInternalValue(newValue);
    }
    onChange?.(newValue);
  };

  const handleFocus = () => {
    setIsFocused(true);
    onFocus?.();
  };

  const handleBlur = () => {
    setIsFocused(false);
    onBlur?.();
  };

  // Size configurations
  const getSizeClasses = () => {
    switch (size) {
      case 'xs':
        return {
          container: 'h-8 px-3 py-[5px]',
          text: 'text-[12px] leading-[16px]'
        };
      case 's':
        return {
          container: 'h-9 px-3 py-[7px]',
          text: 'text-[14px] leading-[20px]'
        };
      case 'l':
        return {
          container: 'h-11 px-4 py-[11px]',
          text: 'text-[16px] leading-[24px]'
        };
      default: // medium
        return {
          container: 'h-10 px-4 py-[9px]',
          text: 'text-[15px] leading-[22px]'
        };
    }
  };

  const sizeClasses = getSizeClasses();

  // Get border classes based on state
  const getBorderClasses = () => {
    if (disabled) {
      return 'border-[#e0dede] bg-[#fafafa]';
    }
    if (error) {
      return 'border-[#c3402c]';
    }
    if (isFocused) {
      return 'border-[#4a6ba6]';
    }
    if (isHovered) {
      return 'border-[#4a6ba6] border-opacity-30';
    }
    return 'border-[#bfbebe]';
  };

  return (
    <div className={`flex flex-col gap-1 items-start relative rounded-lg shrink-0 w-full ${className}`}>
      {/* Label */}
      <div className="flex gap-1 items-center relative shrink-0">
        <p className="font-medium leading-[22px] relative shrink-0 text-[#595555] text-[15px] tracking-[0.25px]">
          {label}
        </p>
        {required && (
          <div className="flex flex-col justify-center leading-[0] relative shrink-0 text-[#c3402c] whitespace-nowrap">
            <p className="leading-[22px]">*</p>
          </div>
        )}
      </div>

      {/* Input Container */}
      <div
        className={`bg-white border border-solid box-border flex gap-1 items-start ${sizeClasses.container} relative rounded-lg shrink-0 w-full transition-all duration-200 ${getBorderClasses()}`}
        onMouseEnter={() => !disabled && setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <input
          ref={inputRef}
          id={id}
          type={type}
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={`flex-1 font-normal relative shrink-0 ${sizeClasses.text} text-black tracking-[0.5px] bg-transparent border-0 outline-0 w-full`}
        />
      </div>

      {/* Error Message */}
      {error && errorMessage && (
        <div className="flex flex-col justify-center leading-[0] relative shrink-0 text-[#c3402c] text-[12px] tracking-[0.25px]">
          <p className="leading-[16px]">{errorMessage}</p>
        </div>
      )}
    </div>
  );
}

// Hook for managing input state
export function useInputText(initialValue: string = '') {
  const [value, setValue] = useState(initialValue);
  const [isFocused, setIsFocused] = useState(false);

  const handleChange = (newValue: string) => {
    setValue(newValue);
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  return {
    value,
    isFocused,
    handleChange,
    handleFocus,
    handleBlur
  };
}

