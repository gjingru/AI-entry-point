import { useEffect, useMemo, useRef, useState } from 'react';

interface DatePickerProps {
  id?: string;
  label: string;
  value?: string; // ISO date YYYY-MM-DD
  onChange?: (isoDate: string) => void;
  required?: boolean;
  error?: boolean;
  errorMessage?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

function formatISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseISO(iso?: string): Date | undefined {
  if (!iso) return undefined;
  const parts = iso.split('-');
  if (parts.length !== 3) return undefined;
  const [y, m, d] = parts.map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1);
  if (isNaN(dt.getTime())) return undefined;
  return dt;
}

export default function DatePicker({
  id,
  label,
  value,
  onChange,
  required = false,
  error = false,
  errorMessage,
  placeholder = 'YYYY-MM-DD',
  disabled = false,
  className = ''
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState<string>(value || '');
  // Default to today's month, or the selected date's month if a date is selected
  const getInitialMonth = (): Date => {
    const parsed = parseISO(value);
    return parsed || new Date();
  };
  const [currentMonth, setCurrentMonth] = useState<Date>(getInitialMonth());
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInputValue(value || '');
    const parsed = parseISO(value);
    // Only update month if a date is selected, otherwise keep current view
    if (parsed) {
      setCurrentMonth(parsed);
    } else {
      // If no date selected, show today's month when opening
      setCurrentMonth(new Date());
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const today = useMemo(() => new Date(), []);
  const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
  const startWeekDay = startOfMonth.getDay(); // 0-6
  const daysInMonth = endOfMonth.getDate();

  const weeks: Array<Array<Date | null>> = [];
  let currentWeek: Array<Date | null> = [];
  // Leading blanks
  for (let i = 0; i < startWeekDay; i++) currentWeek.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    currentWeek.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), d));
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }
  if (currentWeek.length) {
    while (currentWeek.length < 7) currentWeek.push(null);
    weeks.push(currentWeek);
  }

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  const selectedDate = parseISO(value);

  const borderClasses = () => {
    if (disabled) return 'border-[#e0dede] bg-[#fafafa]';
    if (error) return 'border-[#c3402c]';
    if (isOpen) return 'border-[#4a6ba6]';
    return 'border-[#bfbebe]';
  };

  const handleInputChange = (text: string) => {
    setInputValue(text);
    // allow free typing; commit only if matches YYYY-MM-DD
    const isoRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (isoRegex.test(text)) {
      const parsed = parseISO(text);
      if (parsed) {
        onChange?.(formatISO(parsed));
        setCurrentMonth(parsed);
      }
    }
  };

  const handleInputFocus = () => {
    // When opening, default to today's month if no date is selected
    if (!value) {
      setCurrentMonth(new Date());
    }
    setIsOpen(true);
  };

  const handlePick = (date: Date) => {
    const iso = formatISO(date);
    setInputValue(iso);
    onChange?.(iso);
    setIsOpen(false);
  };

  const goPrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };
  const goNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const monthLabel = currentMonth.toLocaleString(undefined, { month: 'long', year: 'numeric' });

  return (
    <div className={`flex flex-col gap-1 items-start relative rounded-lg shrink-0 w-full ${className}`} ref={containerRef}>
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

      <div className={`bg-white border border-solid box-border flex gap-1 items-center h-10 px-4 py-[9px] relative rounded-lg shrink-0 w-full transition-all duration-200 ${borderClasses()}`}>
        <input
          id={id}
          type="text"
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1 font-normal text-[15px] leading-[22px] text-black tracking-[0.5px] bg-transparent border-none outline-none placeholder:text-[#999999]"
        />
        <button type="button" onClick={() => setIsOpen(!isOpen)} className="p-0 m-0">
          <svg className={`w-5 h-5 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {isOpen && (
        <div className="absolute z-50 top-full w-[256px] bg-white border border-[#bfbebe] border-solid rounded-lg shadow-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <button type="button" onClick={goPrevMonth} className="px-2 py-1 rounded hover:bg-[#f5f5f5]">←</button>
            <p className="text-[15px] font-medium">{monthLabel}</p>
            <button type="button" onClick={goNextMonth} className="px-2 py-1 rounded hover:bg-[#f5f5f5]">→</button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-[12px] text-[#595555] mb-1">
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
              <div key={d}>{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {weeks.flat().map((date, idx) => {
              if (!date) return <div key={idx} className="h-8" />;
              const isToday = isSameDay(date, today);
              const isSelected = selectedDate ? isSameDay(date, selectedDate) : false;
              const base = 'h-8 flex items-center justify-center rounded cursor-pointer';
              const todayCls = isToday ? ' ring-1 ring-[#e0dede] text-[#595555]' : '';
              const selectedCls = isSelected ? ' bg-[#502d3c] text-white' : ' hover:bg-[#f5f5f5]';
              return (
                <div
                  key={idx}
                  className={`${base}${todayCls}${selectedCls}`}
                  onClick={() => handlePick(date)}
                >
                  {date.getDate()}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {error && errorMessage && (
        <div className="flex flex-col justify-center leading-[0] relative shrink-0 text-[#c3402c] text-[12px] tracking-[0.25px]">
          <p className="leading-[16px]">{errorMessage}</p>
        </div>
      )}
    </div>
  );
}


