import { useState, useRef, useEffect } from 'react';

export interface SelectOption {
  id: string;
  label: string;
}

export interface SelectProps {
  id?: string;
  label: string;
  value?: string;
  options: SelectOption[];
  onChange?: (value: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  placeholder?: string;
  required?: boolean;
  error?: boolean;
  errorMessage?: string;
  disabled?: boolean;
  className?: string;
  searchable?: boolean;
}

export default function Select({
  id,
  label,
  value,
  options,
  onChange,
  onFocus,
  onBlur,
  placeholder = 'Select an option...',
  required = false,
  error = false,
  errorMessage,
  disabled = false,
  className = '',
  searchable = false
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [inputValue, setInputValue] = useState('');
  const selectRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        selectRef.current &&
        !selectRef.current.contains(event.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        if (searchable) {
          // Reset input value to selected option label or empty
          const selectedOption = options.find(opt => opt.id === value);
          setInputValue(selectedOption ? selectedOption.label : '');
          setSearchTerm('');
        }
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, searchable, value, options]);

  // Focus input when dropdown opens
  useEffect(() => {
    if (isOpen && searchable && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, searchable]);

  // Update input value when value prop changes
  useEffect(() => {
    if (searchable) {
      const selectedOption = options.find(opt => opt.id === value);
      setInputValue(selectedOption ? selectedOption.label : '');
    }
  }, [value, options, searchable]);

  const selectedOption = options.find(opt => opt.id === value);

  // Filter options based on search term
  const filteredOptions = searchable && searchTerm
    ? options.filter(option => 
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : options;

  const handleSelect = (optionId: string) => {
    const option = options.find(opt => opt.id === optionId);
    onChange?.(optionId);
    setIsOpen(false);
    setSearchTerm('');
    if (searchable) {
      setInputValue(option ? option.label : '');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setSearchTerm(newValue);
    
    // Check if input matches exactly with an option
    const exactMatch = options.find(opt => 
      opt.label.toLowerCase() === newValue.toLowerCase()
    );
    
    if (exactMatch) {
      onChange?.(exactMatch.id);
    } else {
      // Clear selection if no exact match
      onChange?.('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchTerm('');
      if (searchable) {
        const selectedOption = options.find(opt => opt.id === value);
        setInputValue(selectedOption ? selectedOption.label : '');
      }
    }
  };

  const handleInputFocus = () => {
    setIsFocused(true);
    setIsOpen(true);
    onFocus?.();
  };

  const handleInputBlur = () => {
    setIsFocused(false);
    onBlur?.();
  };

  const handleFocus = () => {
    setIsFocused(true);
    onFocus?.();
  };

  const handleBlur = () => {
    setIsFocused(false);
    onBlur?.();
  };

  const getBorderClasses = () => {
    if (disabled) {
      return 'border-[#e0dede] bg-[#fafafa]';
    }
    if (error) {
      return 'border-[#c3402c]';
    }
    if (isFocused || isOpen) {
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

      {/* Select Container */}
      <div className="relative w-full" ref={selectRef}>
        {searchable ? (
          <div
            className={`bg-white border border-solid box-border flex gap-1 items-center h-10 px-4 py-[9px] relative rounded-lg shrink-0 w-full transition-all duration-200 ${getBorderClasses()}`}
            onMouseEnter={() => !disabled && setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled}
              className="flex-1 font-normal text-[15px] leading-[22px] text-black tracking-[0.5px] bg-transparent border-none outline-none placeholder:text-[#999999]"
            />
            <svg
              className={`w-5 h-5 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        ) : (
          <div
            className={`bg-white border border-solid box-border flex gap-1 items-center h-10 px-4 py-[9px] relative rounded-lg shrink-0 w-full transition-all duration-200 cursor-pointer ${getBorderClasses()}`}
            onClick={() => !disabled && setIsOpen(!isOpen)}
            onMouseEnter={() => !disabled && setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            tabIndex={disabled ? -1 : 0}
          >
            <p className={`flex-1 font-normal relative shrink-0 text-[15px] leading-[22px] text-black tracking-[0.5px] ${
              selectedOption ? '' : 'text-[#999999]'
            }`}>
              {selectedOption ? selectedOption.label : placeholder}
            </p>
            <svg
              className={`w-5 h-5 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        )}

        {/* Dropdown */}
        {isOpen && (
          <div
            ref={dropdownRef}
            className="absolute z-50 w-full mt-1 bg-white border border-[#bfbebe] border-solid rounded-lg shadow-lg max-h-60 overflow-auto"
            onKeyDown={handleKeyDown}
          >
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-2 text-[15px] text-[#999999]">
                {searchTerm ? 'No matching options found' : 'No options available'}
              </div>
            ) : (
              filteredOptions.map((option) => (
                <div
                  key={option.id}
                  className={`px-4 py-2 cursor-pointer hover:bg-[#f5f5f5] ${
                    option.id === value ? 'bg-[#f0f4ff]' : ''
                  }`}
                  onClick={() => handleSelect(option.id)}
                >
                  <p className="text-[15px] leading-[22px] text-black tracking-[0.5px]">
                    {option.label}
                  </p>
                </div>
              ))
            )}
          </div>
        )}
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
