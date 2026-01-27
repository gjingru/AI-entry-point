import { useState } from 'react';
import { icons } from '../utils/icons';

// Using local icons
const imgArrowRight = icons.ArrowRight;
const imgChevronDown = icons.ChevronDown;

export interface AICardField {
  field: string;
  value: string;
}

export interface AICardProps {
  title: string;
  fields: AICardField[];
  onLaunch?: () => void;
  defaultExpanded?: boolean;
  className?: string;
}

export default function AICard({
  title,
  fields,
  onLaunch,
  defaultExpanded = false,
  className = ''
}: AICardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div 
      className={`bg-white border border-[rgba(0,0,0,0.1)] border-solid rounded-[12px] w-full overflow-hidden ${className}`}
    >
      <div className="flex flex-col">
        {/* Card Header */}
        <div className={`bg-white border-b border-[rgba(0,0,0,0.1)] border-solid rounded-t-[12px] ${isExpanded ? 'shadow-sm' : ''}`}>
          <div className="flex flex-col gap-3 px-4 py-3">
            <div className="flex gap-2 items-center min-h-[32px] w-full">
              {/* Title */}
              <div className="flex-1">
                <p className="font-medium leading-[17px] text-[14px] text-black whitespace-pre-wrap">
                  {title}
                </p>
              </div>
              
              {/* Spacer */}
              <div className="bg-white h-[5px] w-[88px] shrink-0" />
              
              {/* Buttons */}
              <div className="flex gap-2 items-start justify-end shrink-0">
                {/* Launch Button */}
                {onLaunch && (
                  <button
                    onClick={onLaunch}
                    className="bg-[#512f3e] flex gap-1 h-6 items-center justify-center px-2 py-0 relative rounded-md shrink-0 hover:opacity-90 transition-opacity"
                  >
                    <p className="font-medium leading-[17px] relative shrink-0 text-white text-[12px] text-center tracking-[0px]">
                      Launch
                    </p>
                    <div className="overflow-clip relative shrink-0 w-3 h-3">
                      <img alt="" className="block max-w-none w-full h-full" src={imgArrowRight} />
                    </div>
                  </button>
                )}
                
                {/* Expand/Collapse Button */}
                <div className={`flex items-center justify-center relative shrink-0 ${isExpanded ? 'rotate-180' : ''} transition-transform`}>
                  <button
                    onClick={toggleExpand}
                    className="bg-white border border-[rgba(0,0,0,0.2)] border-solid h-6 relative rounded-md hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex gap-1 h-6 items-center justify-center px-2 py-0 relative rounded-[inherit]">
                      <div className="overflow-clip relative shrink-0 w-3 h-3">
                        <div className="absolute inset-[39.45%_31.12%_37.25%_31.13%]">
                          <img 
                            alt={isExpanded ? "Collapse" : "Expand"} 
                            className="block max-w-none w-full h-full" 
                            src={imgChevronDown} 
                          />
                        </div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Expanded Content - Field/Value Pairs */}
        {isExpanded && fields.length > 0 && (
          <div className="flex flex-col gap-3 py-3">
            {fields.map((item, index) => (
              <div
                key={index}
                className="flex flex-col gap-0 px-4"
              >
                <div className="flex flex-col gap-0 items-start relative">
                  {/* Field Label */}
                  <div className="flex gap-2 items-center p-0 relative">
                    <p className="font-medium leading-[20px] relative shrink-0 text-[#6f6f72] text-[14px] tracking-[0px]">
                      {item.field}
                    </p>
                  </div>
                  {/* Field Value */}
                  <div className="flex gap-0 items-center p-0 relative">
                    <p className="font-normal leading-[24px] relative shrink-0 text-[#202022] text-[16px] tracking-[0px]">
                      {item.value || '-'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


