import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { icons } from '../utils/icons';

// Asset URLs - using local icons
const imgArrowUp = icons.ArrowUp;
const imgDropdownArrow = icons.ChevronDown;
const imgAddIconLight = icons.Add;
const imgCollapsePanel = icons.CollapsePanelOutline;
const imgAddComment = icons.AddCommentOutline;
const imgExpand = icons.Expand;
const imgClose = icons.Close;
const imgUpload = icons.Upload;

interface FXPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSend?: (message: string) => void;
  bottomOffsetPx?: number;
  onNavigate?: (path: string) => void;
  avatarUrl?: string;
  initialPromptValue?: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function FXPanel({ isOpen, onClose, onSend, bottomOffsetPx = 0, onNavigate, avatarUrl = "/images/avatar2.png", initialPromptValue = "" }: FXPanelProps) {
  const navigate = useNavigate();
  const [promptValue, setPromptValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const contentEditableRef = useRef<HTMLDivElement>(null);
  const [isExiting, setIsExiting] = useState(false);
  
  // Format text with grey styling for @mentions
  const formatTextWithMentions = (text: string) => {
    if (!text) return '';
    // Escape HTML to prevent XSS
    const escapeHtml = (str: string) => {
      const div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    };
    // Match @mentions (e.g., @job template)
    const parts = text.split(/(@\w+(?:\s+\w+)*)/g);
    return parts.map((part) => {
      if (part.startsWith('@')) {
        return `<span style="color: #716f6c;">${escapeHtml(part)}</span>`;
      }
      return escapeHtml(part);
    }).join('');
  };
  
  // Get plain text from contentEditable
  const getPlainText = (element: HTMLElement): string => {
    return element.innerText || element.textContent || '';
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-resize contentEditable
  useEffect(() => {
    if (contentEditableRef.current) {
      const element = contentEditableRef.current;
      element.style.height = 'auto';
      const scrollHeight = element.scrollHeight;
      const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      const maxHeightPx = 20 * rootFontSize;
      element.style.height = `${Math.min(scrollHeight, maxHeightPx)}px`;
      element.style.overflowY = scrollHeight > maxHeightPx ? 'auto' : 'hidden';
    }
  }, [promptValue]);

  // Listen for window events to set prompt value
  useEffect(() => {
    const handleSetPrompt = (event: MessageEvent) => {
      if (event.data?.type === 'setChatPrompt') {
        const value = event.data.value || '';
        setPromptValue(value);
        if (contentEditableRef.current) {
          contentEditableRef.current.innerHTML = formatTextWithMentions(value);
          // Move cursor to end
          const range = document.createRange();
          const selection = window.getSelection();
          range.selectNodeContents(contentEditableRef.current);
          range.collapse(false);
          selection?.removeAllRanges();
          selection?.addRange(range);
        }
      }
    };
    window.addEventListener('message', handleSetPrompt);
    return () => window.removeEventListener('message', handleSetPrompt);
  }, []);

  // Handle initial prompt value
  useEffect(() => {
    if (initialPromptValue && isOpen) {
      setPromptValue(initialPromptValue);
      if (contentEditableRef.current) {
        contentEditableRef.current.innerHTML = formatTextWithMentions(initialPromptValue);
      }
    }
  }, [initialPromptValue, isOpen]);

  // Reset exit state when panel opens
  useEffect(() => {
    if (isOpen) {
      setIsExiting(false);
    }
  }, [isOpen]);

  const handleSend = async (message: string) => {
    if (!message.trim()) return;

    // Get form data from window.hiringAgent if available
    let formData = null;
    if ((window as any).hiringAgent?.getData) {
      formData = (window as any).hiringAgent.getData();
    }

    // Trigger fade-out for main content
    window.dispatchEvent(new CustomEvent('fadeOutMainContent'));
    
    // Start exit animation
    setIsExiting(true);
    
    // Wait for animations to complete before navigating
    setTimeout(() => {
      // Navigate to composer view with user input and form data
      navigate('/composer', {
        state: {
          userInput: message.trim(),
          formData: formData
        }
      });
    }, 300); // Match animation duration
    return;

    const userMessage: Message = { role: 'user', content: message };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setPromptValue("");

    // Call onSend callback if provided
    if (onSend) {
      onSend(message);
    }

    // For template: Add a simple echo response
    // Replace this with your own chat integration
    setTimeout(() => {
      const assistantMessage: Message = { 
        role: 'assistant', 
        content: `You said: "${message}". This is a template - integrate your chat service here.` 
      };
      setMessages([...newMessages, assistantMessage]);
    }, 500);
  };

  if (!isOpen) return null;

  const bottomOffset = bottomOffsetPx > 0 ? bottomOffsetPx : 0;

  return (
    <div 
      className="fixed right-0 top-[82px] bg-white border-l border-[rgba(0,0,0,0.2)] z-50 flex flex-col overflow-hidden"
      style={{ 
        height: `calc(100vh - 82px - ${bottomOffset}px)`,
        maxHeight: `calc(100vh - 82px - ${bottomOffset}px)`,
        width: '400px',
        opacity: isExiting ? 0 : 1,
        transform: isExiting ? 'translateX(50px)' : 'translateX(0)',
        transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}
    >
      {/* Panel Header */}
      <div className="bg-white flex items-center justify-between px-4 py-4 shrink-0">
        <div className="flex items-center gap-2">
          <button className="w-6 h-6 flex items-center justify-center">
            <img 
              alt="Collapse panel" 
              className="block w-6 h-6" 
              src={imgCollapsePanel}
            />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button className="w-6 h-6 flex items-center justify-center hover:opacity-70 transition-opacity">
            <img 
              alt="Add comment" 
              className="block w-6 h-6" 
              src={imgAddComment}
            />
          </button>
          <button className="w-6 h-6 flex items-center justify-center hover:opacity-70 transition-opacity">
            <img 
              alt="Expand" 
              className="block w-6 h-6" 
              src={imgExpand}
            />
          </button>
          <button 
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center hover:opacity-70 transition-opacity"
          >
            <img 
              alt="Close" 
              className="block w-6 h-6" 
              src={imgClose}
            />
          </button>
        </div>
      </div>
      
      {/* Panel Content */}
      <div className={`flex-1 overflow-y-auto flex flex-col min-h-0 px-4 ${
        messages.length === 0 ? 'items-start justify-end' : 'items-start'
      }`}>
        {messages.length === 0 ? (
          <div className="flex flex-col gap-2 w-full">
            <p className="font-medium leading-[24px] text-[20px] text-black tracking-[0px]">
              Hi Anne,
            </p>
            <p className="font-medium leading-[20px] text-[16px] text-[rgba(0,0,0,0.5)] tracking-[0px]">
              What can we help you achieve today?
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 w-full pt-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className="flex gap-2 w-full items-start"
              >
                {message.role === 'user' && (
                  <>
                    <div className="flex-shrink-0 w-8 h-8">
                      <div className="border border-[rgba(0,0,0,0.1)] border-solid relative rounded-full shrink-0 w-8 h-8 overflow-hidden">
                        {avatarUrl ? (
                          <img 
                            alt="User avatar" 
                            className="absolute inset-0 w-full h-full object-cover rounded-full" 
                            src={avatarUrl}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent) {
                                parent.innerHTML = `<div class="w-full h-full bg-gray-200 flex items-center justify-center text-gray-600 text-xs font-medium">U</div>`;
                              }
                            }}
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-600 text-xs font-medium">U</div>
                        )}
                      </div>
                    </div>
                    <div className="bg-[#f3f1ee] flex items-center justify-end px-3 py-[9px] rounded-bl-[8px] rounded-br-[8px] rounded-tl-[2px] rounded-tr-[8px] max-w-[298px]">
                      <p 
                        className="font-normal leading-[24px] text-[16px] text-[#013c2b] text-right whitespace-pre-wrap break-words"
                        style={{ overflowWrap: 'anywhere' }}
                      >
                        {message.content}
                      </p>
                    </div>
                  </>
                )}
                
                {message.role === 'assistant' && (
                  <div className="w-full">
                    <p 
                      className="font-normal leading-[24px] text-[16px] whitespace-pre-wrap break-words"
                      style={{ overflowWrap: 'anywhere' }}
                    >
                      {message.content}
                    </p>
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      
      {/* Input Area */}
      <div className="shrink-0 px-4 py-2 bg-white border-t border-[rgba(0,0,0,0.1)]">
        <div className={`${isFocused ? 'bg-white' : 'bg-[#f9f7f6]'} border border-[rgba(0,0,0,0.2)] border-solid rounded-lg px-2 py-2 flex flex-col gap-3 transition-colors`}>
          <div className="flex items-center gap-2">
            <div
              ref={contentEditableRef}
              contentEditable
              onInput={(e) => {
                const text = getPlainText(e.currentTarget);
                setPromptValue(text);
                // Only format if text contains @mentions, to avoid cursor issues
                if (text.includes('@')) {
                  // Save cursor position
                  const selection = window.getSelection();
                  const range = selection?.getRangeAt(0);
                  const cursorOffset = range?.startOffset || 0;
                  
                  // Apply formatting
                  e.currentTarget.innerHTML = formatTextWithMentions(text);
                  
                  // Restore cursor position (simplified)
                  try {
                    if (selection && e.currentTarget.firstChild) {
                      const newRange = document.createRange();
                      const textNode = e.currentTarget.firstChild;
                      const maxOffset = textNode.textContent?.length || 0;
                      newRange.setStart(textNode, Math.min(cursorOffset, maxOffset));
                      newRange.collapse(true);
                      selection.removeAllRanges();
                      selection.addRange(newRange);
                    }
                  } catch (err) {
                    // If cursor restoration fails, move to end
                    const endRange = document.createRange();
                    const endSelection = window.getSelection();
                    endRange.selectNodeContents(e.currentTarget);
                    endRange.collapse(false);
                    endSelection?.removeAllRanges();
                    endSelection?.addRange(endRange);
                  }
                }
              }}
              onFocus={() => {
                setIsFocused(true);
              }}
              onBlur={() => {
                setIsFocused(false);
              }}
              data-placeholder="Ask, create, navigate, or chat..."
              className="flex-1 font-normal leading-[24px] text-[16px] text-black tracking-[0px] bg-transparent border-0 outline-0 focus:outline-none focus:ring-0 w-full min-h-[20px] overflow-y-auto"
              style={{ 
                maxHeight: '20rem',
                wordBreak: 'break-word',
                whiteSpace: 'pre-wrap'
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  const text = getPlainText(e.currentTarget);
                  if (text.trim()) {
                    handleSend(text.trim());
                  }
                }
              }}
            />
            <style>{`
              [contenteditable][data-placeholder]:empty:before {
                content: attr(data-placeholder);
                color: #716f6c;
                pointer-events: none;
              }
            `}</style>
          </div>
          <div className="flex items-center justify-between">
            <button className="bg-white border border-[rgba(0,0,0,0.2)] border-solid rounded-md w-6 h-6 flex items-center justify-center hover:bg-gray-50 transition-colors">
              <img 
                alt="Add" 
                className="block w-4 h-4" 
                src={imgAddIconLight}
              />
            </button>
            <button 
              onClick={() => {
                if (promptValue.trim()) {
                  handleSend(promptValue.trim());
                }
              }}
              className="overflow-clip relative rounded-md shrink-0 w-6 h-6 hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center disabled:bg-[#512f3e] bg-[#7A005D]"
              disabled={!promptValue.trim()}
            >
              <div className="w-4 h-4 flex items-center justify-center">
                <img 
                  alt="Send" 
                  className="block max-w-none w-full h-full" 
                  src={imgArrowUp}
                  style={{ filter: promptValue.trim() ? 'brightness(0) invert(1)' : 'none' }}
                />
              </div>
            </button>
          </div>
        </div>
        
        {/* Disclaimer */}
        <p className="text-center text-[11px] leading-[14px] text-[rgba(0,0,0,0.4)] tracking-[0px] mt-2 px-4">
          Rippling AI results may be inaccurate. Review before acting.
        </p>
      </div>
    </div>
  );
}
