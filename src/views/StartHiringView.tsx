import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { icons } from '../utils/icons';

// Job template data
const JOB_TEMPLATES = [
  'Software engineer I',
  'Software engineer II',
  'Product manager',
  'Product analyst'
];

// Employee data
const EMPLOYEES = [
  'Maren Curtis',
  'Craig Workman',
  'Lydia Donin',
  'Ruben Korsgaard',
  'Alfonso Gouse'
];

// Rotating placeholder texts
const PLACEHOLDER_TEXTS = [
  'Describe your new hire - include their name, email, and start date',
  'Type a former employee or contractor\'s name to rehire',
  'Hire multiple people'
];

// Mock employee data structure - in a real app, this would come from an API
interface EmployeeData {
  personal: {
    first_name: string;
    last_name: string;
    personal_email?: string;
    invite_email?: string;
  };
  work: {
    employment_classification?: string;
    country?: string;
    work_location_id?: string;
    employment_type_id?: string;
    entity?: string;
    overtime_exemption?: string;
  };
  role: {
    start_date?: string;
    title?: string;
    level?: string;
    department_id?: string;
    team_id?: string;
    manager?: string;
    job_families?: string[];
  };
  comp: {
    amount?: string;
    currency?: string;
    frequency?: string;
  };
}

// Mock employee data - matching the Figma design example
const EMPLOYEE_DATA: Record<string, EmployeeData> = {
  'Maren Curtis': {
    personal: {
      first_name: 'Tony',
      last_name: 'Smith',
      personal_email: 'ts@gmail.com',
      invite_email: 'ts@gmail.com'
    },
    work: {
      employment_classification: 'Employee',
      country: 'United States',
      work_location_id: 'San Francisco',
      employment_type_id: 'Salaried, full-time',
      overtime_exemption: 'Exempt'
    },
    role: {
      department_id: 'Sales',
      team_id: 'Software',
      manager: 'Ryan Lucas'
    },
    comp: {
      amount: '120000',
      currency: 'USD',
      frequency: 'Year'
    }
  },
  'Craig Workman': {
    personal: {
      first_name: 'Craig',
      last_name: 'Workman',
      personal_email: 'cw@gmail.com',
      invite_email: 'cw@gmail.com'
    },
    work: {
      employment_classification: 'Employee',
      country: 'United States',
      work_location_id: 'San Francisco',
      employment_type_id: 'Salaried, full-time',
      overtime_exemption: 'Exempt'
    },
    role: {
      department_id: 'Engineering',
      team_id: 'Platform',
      manager: 'Sarah Johnson'
    },
    comp: {
      amount: '150000',
      currency: 'USD',
      frequency: 'Year'
    }
  },
  'Lydia Donin': {
    personal: {
      first_name: 'Lydia',
      last_name: 'Donin',
      personal_email: 'ld@gmail.com',
      invite_email: 'ld@gmail.com'
    },
    work: {
      employment_classification: 'Employee',
      country: 'United States',
      work_location_id: 'New York',
      employment_type_id: 'Salaried, full-time',
      overtime_exemption: 'Non-exempt'
    },
    role: {
      department_id: 'Marketing',
      team_id: 'Growth',
      manager: 'Michael Chen'
    },
    comp: {
      amount: '95000',
      currency: 'USD',
      frequency: 'Year'
    }
  },
  'Ruben Korsgaard': {
    personal: {
      first_name: 'Ruben',
      last_name: 'Korsgaard',
      personal_email: 'rk@gmail.com',
      invite_email: 'rk@gmail.com'
    },
    work: {
      employment_classification: 'Employee',
      country: 'United States',
      work_location_id: 'Seattle',
      employment_type_id: 'Hourly, full-time',
      overtime_exemption: 'Non-exempt'
    },
    role: {
      department_id: 'Operations',
      team_id: 'Support',
      manager: 'Emily Davis'
    },
    comp: {
      amount: '75000',
      currency: 'USD',
      frequency: 'Year'
    }
  },
  'Alfonso Gouse': {
    personal: {
      first_name: 'Alfonso',
      last_name: 'Gouse',
      personal_email: 'ag@gmail.com',
      invite_email: 'ag@gmail.com'
    },
    work: {
      employment_classification: 'Employee',
      country: 'United States',
      work_location_id: 'Austin',
      employment_type_id: 'Salaried, full-time',
      overtime_exemption: 'Exempt'
    },
    role: {
      department_id: 'Product',
      team_id: 'Mobile',
      manager: 'David Kim'
    },
    comp: {
      amount: '130000',
      currency: 'USD',
      frequency: 'Year'
    }
  }
};

interface MentionInfo {
  text: string;
  isSelected: boolean; // true if selected from dropdown (strong typed)
}

export default function StartHiringView() {
  const navigate = useNavigate();
  const [promptValue, setPromptValue] = useState('');
  const [selectedMentions, setSelectedMentions] = useState<Set<string>>(new Set());
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionPosition, setMentionPosition] = useState<{ top: number; left: number } | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isProgrammaticOpen, setIsProgrammaticOpen] = useState(false);
  const [mentionType, setMentionType] = useState<'job-template' | 'employee' | null>(null);
  const [selectedEmployeeFormData, setSelectedEmployeeFormData] = useState<any>(null);
  const [currentPlaceholderIndex, setCurrentPlaceholderIndex] = useState(0);
  const [isPlaceholderVisible, setIsPlaceholderVisible] = useState(true);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<'upload' | 'copy' | 'template' | null>(null);
  const contentEditableRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isInsertingTextRef = useRef(false);
  const isSelectingTemplateRef = useRef(false);
  
  // Get plain text from contentEditable
  const getPlainText = (element: HTMLElement): string => {
    return element.innerText || element.textContent || '';
  };
  
  // Format text with styling for mentions
  const formatTextWithMentions = (text: string, selectedMentionsSet: Set<string>) => {
    if (!text) return '';
    // Escape HTML to prevent XSS
    const escapeHtml = (str: string) => {
      const div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    };
    
    // Build a regex pattern that matches exact selected mentions
    // We need to match mentions followed by space or end of string to avoid partial matches
    const selectedMentionsArray = Array.from(selectedMentionsSet);
    if (selectedMentionsArray.length === 0) {
      // No selected mentions, just escape and return
      return escapeHtml(text);
    }
    
    // Create a regex that matches exact mentions (case-insensitive)
    // Escape special regex characters in mention text
    const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const mentionPatterns = selectedMentionsArray.map(m => escapeRegex(m));
    const mentionRegex = new RegExp(`(${mentionPatterns.join('|')})(?=\\s|$)`, 'gi');
    
    // Split text by mentions, preserving the matches
    const parts: string[] = [];
    let lastIndex = 0;
    let match;
    
    while ((match = mentionRegex.exec(text)) !== null) {
      // Add text before the mention
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      // Add the matched mention
      parts.push(match[0]);
      lastIndex = mentionRegex.lastIndex;
    }
    
    // Add remaining text after last match
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }
    
    // If no matches found, return escaped text
    if (parts.length === 0) {
      return escapeHtml(text);
    }
    
    // Format each part
    return parts.map((part) => {
      const partLower = part.toLowerCase();
      // Check if this part is an exact selected mention
      const isSelected = selectedMentionsArray.some(selected => {
        return partLower === selected.toLowerCase();
      });
      
      if (isSelected) {
        // Strong typed mention: berry color (#7A005D) - same font weight
        return `<span style="color: #7A005D;">${escapeHtml(part)}</span>`;
      } else {
        // Regular text or manual mention - check if it starts with @
        if (part.startsWith('@')) {
          // Manual mention: grey color
          return `<span style="color: #716f6c;">${escapeHtml(part)}</span>`;
        } else {
          // Regular text - keep it black (no styling)
          return escapeHtml(part);
        }
      }
    }).join('');
  };
  
  // Detect @ mention and show dropdown
  const detectMention = (text: string, cursorPosition: number) => {
    // Find the @ symbol before cursor
    const textBeforeCursor = text.substring(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex === -1) {
      setShowMentionDropdown(false);
      setMentionType(null);
      return;
    }
    
    // Get the text from @ to cursor position
    const textFromAt = text.substring(lastAtIndex, cursorPosition);
    
    // Check if this @ is part of any selected mention in the text
    // We need to check if the @ symbol we found is within or part of a selected mention
    for (const selectedMention of selectedMentions) {
      const selectedLower = selectedMention.toLowerCase();
      // Find all occurrences of the selected mention in the text
      let searchIndex = 0;
      while (true) {
        const mentionIndex = text.toLowerCase().indexOf(selectedLower, searchIndex);
        if (mentionIndex === -1) break;
        
        // Check if the @ we found is within this occurrence of the selected mention
        // The selected mention should start with @, so check if lastAtIndex is at or before mentionIndex
        if (lastAtIndex >= mentionIndex && lastAtIndex < mentionIndex + selectedLower.length) {
          // This @ is part of a selected mention, don't show dropdown
          setShowMentionDropdown(false);
          return;
        }
        
        // Also check if cursor is right after a selected mention (within a few characters)
        // This handles cases where user types right after "@job template product manager"
        if (cursorPosition > mentionIndex + selectedLower.length && 
            cursorPosition <= mentionIndex + selectedLower.length + 5) {
          // Cursor is right after a selected mention, don't show dropdown
          setShowMentionDropdown(false);
          return;
        }
        
        searchIndex = mentionIndex + 1;
      }
    }
    
    // Get the text after @ up to cursor
    const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
    const mentionText = textAfterAt.toLowerCase().trim();
    
    // Check if the text after @ is "job template" or "employee" (not yet selected)
    // We want to show dropdown only when user is actively typing a NEW mention
    const query = mentionText;
    setMentionQuery(query);
    
    // Check for job template mentions
    if (query === 'job template' || query === 'job' || query.startsWith('job template')) {
      // Double-check: make sure the full potential mention doesn't match a selected one
      const textAfterAtToSpace = text.substring(lastAtIndex + 1);
      const spaceIndex = textAfterAtToSpace.indexOf(' ');
      const newlineIndex = textAfterAtToSpace.indexOf('\n');
      const endIndex = Math.min(
        spaceIndex !== -1 ? spaceIndex : textAfterAtToSpace.length,
        newlineIndex !== -1 ? newlineIndex : textAfterAtToSpace.length
      );
      const potentialMention = text.substring(lastAtIndex, lastAtIndex + 1 + endIndex).toLowerCase().trim();
      
      // Check if this potential mention matches any selected mention
      const matchesSelected = Array.from(selectedMentions).some(selected => {
        const selectedLower = selected.toLowerCase();
        return potentialMention === selectedLower || potentialMention.startsWith(selectedLower + ' ');
      });
      
      if (!matchesSelected) {
        setMentionType('job-template');
        setShowMentionDropdown(true);
        setSelectedIndex(0);
        // Calculate position for dropdown - place it right below the cursor, aligned with input left
        if (contentEditableRef.current) {
          const selection = window.getSelection();
          if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            const containerRect = contentEditableRef.current.getBoundingClientRect();
            // Position right below the cursor, but align left edge with input field
            setMentionPosition({
              top: rect.bottom - containerRect.top + 5, // Position below the cursor
              left: 0 // Align with left edge of input field
            });
          }
        }
      } else {
        setShowMentionDropdown(false);
        setMentionType(null);
      }
    } 
    // Check for employee mentions
    else if (query === 'employee' || query.startsWith('employee')) {
      // Double-check: make sure the full potential mention doesn't match a selected one
      const textAfterAtToSpace = text.substring(lastAtIndex + 1);
      const spaceIndex = textAfterAtToSpace.indexOf(' ');
      const newlineIndex = textAfterAtToSpace.indexOf('\n');
      const endIndex = Math.min(
        spaceIndex !== -1 ? spaceIndex : textAfterAtToSpace.length,
        newlineIndex !== -1 ? newlineIndex : textAfterAtToSpace.length
      );
      const potentialMention = text.substring(lastAtIndex, lastAtIndex + 1 + endIndex).toLowerCase().trim();
      
      // Check if this potential mention matches any selected mention
      const matchesSelected = Array.from(selectedMentions).some(selected => {
        const selectedLower = selected.toLowerCase();
        return potentialMention === selectedLower || potentialMention.startsWith(selectedLower + ' ');
      });
      
      if (!matchesSelected) {
        setMentionType('employee');
        setShowMentionDropdown(true);
        setSelectedIndex(0);
        // Calculate position for dropdown - place it right below the cursor, aligned with input left
        if (contentEditableRef.current) {
          const selection = window.getSelection();
          if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            const containerRect = contentEditableRef.current.getBoundingClientRect();
            // Position right below the cursor, but align left edge with input field
            setMentionPosition({
              top: rect.bottom - containerRect.top + 5, // Position below the cursor
              left: 0 // Align with left edge of input field
            });
          }
        }
      } else {
        setShowMentionDropdown(false);
        setMentionType(null);
      }
    } else {
      setShowMentionDropdown(false);
      setMentionType(null);
    }
  };
  
  // Filter job templates based on query
  const filteredJobTemplates = JOB_TEMPLATES.filter(template => {
    const cleanQuery = mentionQuery.replace(/^job\s*template\s*/i, '').trim();
    if (!cleanQuery) return true; // Show all if query is just "job template"
    
    // Exclude queries that look like names (two capitalized words like "James Donovan")
    // This prevents names from being matched as job templates
    const namePattern = /^[A-Z][a-z]+\s+[A-Z][a-z]+$/;
    if (namePattern.test(cleanQuery)) {
      return false; // Don't match names as job templates
    }
    
    return template.toLowerCase().includes(cleanQuery);
  });
  
  // Filter employees based on query
  const filteredEmployees = EMPLOYEES.filter(employee => {
    const cleanQuery = mentionQuery.replace(/^employee\s*/i, '').trim();
    if (!cleanQuery) return true; // Show all if query is just "employee"
    return employee.toLowerCase().includes(cleanQuery);
  });
  
  // Handle job template selection
  const handleTemplateSelect = (template: string) => {
    if (!contentEditableRef.current) return;
    
    // Mark that we're selecting a template to prevent blur handler from hiding hint box
    isSelectingTemplateRef.current = true;
    
    const text = getPlainText(contentEditableRef.current);
    
    // Find and replace @job template with @job template selectedTemplate (case-insensitive)
    // Add a space after the mention for better typing experience
    const mentionKey = `@job template ${template.toLowerCase()}`;
    const newText = text.replace(/@job\s+template/gi, mentionKey + ' ');
    
    // Add to selected mentions
    setSelectedMentions(prev => new Set([...prev, mentionKey]));
    setPromptValue(newText);
    
    // Update contentEditable
    const updatedMentions = new Set([...selectedMentions, mentionKey]);
    contentEditableRef.current.innerHTML = formatTextWithMentions(newText, updatedMentions);
    
    // Move cursor after the mention (at the end of the strong type text)
    setTimeout(() => {
      const selection = window.getSelection();
      if (selection && contentEditableRef.current) {
        // Find the position of the mention in the new text
        const mentionIndex = newText.indexOf(mentionKey);
        if (mentionIndex !== -1) {
          // Position cursor at the end of the mention (after the space)
          const cursorPos = mentionIndex + mentionKey.length + 1; // +1 for the space
          
          // Find the text node and position cursor
          const walker = document.createTreeWalker(
            contentEditableRef.current,
            NodeFilter.SHOW_TEXT,
            null
          );
          
          let currentPos = 0;
          let targetNode: Node | null = null;
          let targetOffset = 0;
          
          let node;
          while (node = walker.nextNode()) {
            const nodeLength = node.textContent?.length || 0;
            if (currentPos + nodeLength >= cursorPos) {
              targetNode = node;
              targetOffset = cursorPos - currentPos;
              break;
            }
            currentPos += nodeLength;
          }
          
          if (targetNode) {
            const newRange = document.createRange();
            newRange.setStart(targetNode, targetOffset);
            newRange.collapse(true);
            selection.removeAllRanges();
            selection.addRange(newRange);
          } else {
            // Fallback: move to end
            const range = document.createRange();
            range.selectNodeContents(contentEditableRef.current);
            range.collapse(false);
            selection.removeAllRanges();
            selection.addRange(range);
          }
        } else {
          // If mention not found, move to end
          const range = document.createRange();
          range.selectNodeContents(contentEditableRef.current);
          range.collapse(false);
          selection.removeAllRanges();
          selection.addRange(range);
        }
      }
    }, 0);
    
    setShowMentionDropdown(false);
    setMentionType(null);
    
    // Directly insert the fields text after template selection
    setTimeout(() => {
      if (contentEditableRef.current) {
        // Ensure the input is focused
        contentEditableRef.current.focus();
        
        // Get current text
        const currentText = getPlainText(contentEditableRef.current);
        
        // Only insert if field labels haven't been inserted yet
        if (!hasFieldLabelsInserted(currentText) && !hasRequiredFields(currentText)) {
          // Set flag to prevent useEffect from overwriting
          isInsertingTextRef.current = true;
          
          // Check if this is a rehire flow - only need start date
          const isRehireFlow = currentText.toLowerCase().startsWith('rehire');
          
          // Insert formatted text at the end
          const formattedText = isRehireFlow 
            ? '\n- Start date: '
            : '\n- First name:\n- Last name:\n- Invite email:\n- Start date: ';
          const newTextWithFields = currentText + formattedText;
          
          // Update contentEditable directly first
          contentEditableRef.current.innerHTML = formatTextWithMentions(newTextWithFields, updatedMentions);
          
          // Then update state
          setPromptValue(newTextWithFields);
          
          // Move cursor to end
          setTimeout(() => {
            const selection = window.getSelection();
            if (selection && contentEditableRef.current) {
              const range = document.createRange();
              range.selectNodeContents(contentEditableRef.current);
              range.collapse(false);
              selection.removeAllRanges();
              selection.addRange(range);
              contentEditableRef.current.focus();
            }
            
            // Clear flag after insertion
            setTimeout(() => {
              isInsertingTextRef.current = false;
              isSelectingTemplateRef.current = false;
            }, 100);
          }, 10);
        } else {
          isSelectingTemplateRef.current = false;
        }
      } else {
        isSelectingTemplateRef.current = false;
      }
    }, 100);
  };
  
  // Handle employee selection
  const handleEmployeeSelect = (employee: string) => {
    if (!contentEditableRef.current) return;
    
    try {
      // Mark that we're selecting an employee to prevent blur handler from hiding hint box
      isSelectingTemplateRef.current = true;
      
      const text = getPlainText(contentEditableRef.current);
      if (!text) return;
      
      // Find and replace @employee with just @selectedEmployee (case-insensitive)
      // When a strong type is selected, remove "employee" and just show the name
      // Find the first occurrence of @employee that's not already part of a selected mention
      const mentionKey = `@${employee.toLowerCase()}`;
      let newText = text;
      
      // Find the position of @employee in the text
      const employeeIndex = text.toLowerCase().indexOf('@employee');
      if (employeeIndex !== -1) {
        // Check if this @employee is already part of a selected mention
        let isPartOfSelectedMention = false;
        for (const selectedMention of selectedMentions) {
          const selectedLower = selectedMention.toLowerCase();
          const textFromIndex = text.toLowerCase().substring(employeeIndex);
          if (textFromIndex.startsWith(selectedLower) || textFromIndex.startsWith(selectedLower + ' ')) {
            isPartOfSelectedMention = true;
            break;
          }
        }
        
        // Only replace if it's not already part of a selected mention
        if (!isPartOfSelectedMention) {
          // Replace @employee with just @[employee name] (remove "employee" word)
          newText = text.substring(0, employeeIndex) + mentionKey + ' ' + text.substring(employeeIndex + '@employee'.length);
        }
      }
      
      // Add to selected mentions
      const updatedMentions = new Set([...selectedMentions, mentionKey]);
      setSelectedMentions(updatedMentions);
      setPromptValue(newText);
      
      // Update contentEditable safely
      if (contentEditableRef.current) {
        contentEditableRef.current.innerHTML = formatTextWithMentions(newText, updatedMentions);
      }
      
      // Get employee data and store it for later use when send button is clicked
      const employeeData = EMPLOYEE_DATA[employee];
      if (employeeData) {
        // Convert employee data to the format expected by ComposerView
        // NOTE: Do NOT copy first_name, last_name, invite_email, and start_date
        // These fields should be provided by the user
        const formData = {
          personal: {
            first_name: '', // Do not copy from employee
            last_name: '', // Do not copy from employee
            personal_email: employeeData.personal.personal_email || '',
            invite_email: '' // Do not copy from employee
          },
          work: {
            employment_classification: employeeData.work.employment_classification || '',
            country: employeeData.work.country || '',
            work_location_id: employeeData.work.work_location_id || '',
            employment_type_id: employeeData.work.employment_type_id || '',
            entity: employeeData.work.entity || '',
            overtime_exemption: employeeData.work.overtime_exemption || ''
          },
          role: {
            start_date: '', // Do not copy from employee
            title: employeeData.role.title || '',
            level: employeeData.role.level || '',
            department_id: employeeData.role.department_id || '',
            team_id: employeeData.role.team_id || '',
            manager: employeeData.role.manager || '',
            job_families: employeeData.role.job_families || []
          },
          comp: {
            amount: employeeData.comp.amount || '',
            currency: employeeData.comp.currency || '',
            frequency: employeeData.comp.frequency || ''
          },
          country_specific: employeeData.country_specific || undefined
        };
        
        // Store the form data for later use when send button is clicked
        setSelectedEmployeeFormData(formData);
      }
      
      // Move cursor after the mention (at the end of the strong type text)
      setTimeout(() => {
        try {
          const selection = window.getSelection();
          if (selection && contentEditableRef.current) {
            // Find the position of the mention in the new text
            const mentionIndex = newText.toLowerCase().indexOf(mentionKey.toLowerCase());
            if (mentionIndex !== -1) {
              // Position cursor at the end of the mention (after the space)
              const cursorPos = mentionIndex + mentionKey.length + 1; // +1 for the space
              
              // Find the text node and position cursor
              const walker = document.createTreeWalker(
                contentEditableRef.current,
                NodeFilter.SHOW_TEXT,
                null
              );
              
              let currentPos = 0;
              let targetNode: Node | null = null;
              let targetOffset = 0;
              
              let node;
              while (node = walker.nextNode()) {
                const nodeLength = node.textContent?.length || 0;
                if (currentPos + nodeLength >= cursorPos) {
                  targetNode = node;
                  targetOffset = Math.min(cursorPos - currentPos, nodeLength);
                  break;
                }
                currentPos += nodeLength;
              }
              
              if (targetNode) {
                const newRange = document.createRange();
                newRange.setStart(targetNode, targetOffset);
                newRange.collapse(true);
                selection.removeAllRanges();
                selection.addRange(newRange);
              } else {
                // Fallback: move to end
                const range = document.createRange();
                if (contentEditableRef.current) {
                  range.selectNodeContents(contentEditableRef.current);
                  range.collapse(false);
                  selection.removeAllRanges();
                  selection.addRange(range);
                }
              }
            } else {
              // If mention not found, move to end
              const range = document.createRange();
              if (contentEditableRef.current) {
                range.selectNodeContents(contentEditableRef.current);
                range.collapse(false);
                selection.removeAllRanges();
                selection.addRange(range);
              }
            }
          }
        } catch (error) {
          console.error('Error positioning cursor after employee selection:', error);
        }
      }, 0);
      
      setShowMentionDropdown(false);
      setMentionType(null);
      
      // Directly insert the fields text after employee selection
      setTimeout(() => {
        if (contentEditableRef.current) {
          // Ensure the input is focused
          contentEditableRef.current.focus();
          
          // Get current text
          const currentText = getPlainText(contentEditableRef.current);
          
          // Only insert if field labels haven't been inserted yet
          if (!hasFieldLabelsInserted(currentText) && !hasRequiredFields(currentText)) {
            // Set flag to prevent useEffect from overwriting
            isInsertingTextRef.current = true;
            
            // Check if this is a rehire flow - only need start date
            const isRehireFlow = currentText.toLowerCase().startsWith('rehire');
            
            // Insert formatted text at the end
            const formattedText = isRehireFlow 
              ? '\n- Start date: '
              : '\n- First name:\n- Last name:\n- Invite email:\n- Start date: ';
            const newTextWithFields = currentText + formattedText;
            
            // Update contentEditable directly first
            contentEditableRef.current.innerHTML = formatTextWithMentions(newTextWithFields, updatedMentions);
            
            // Then update state
            setPromptValue(newTextWithFields);
            
            // Move cursor to end
            setTimeout(() => {
              const selection = window.getSelection();
              if (selection && contentEditableRef.current) {
                const range = document.createRange();
                range.selectNodeContents(contentEditableRef.current);
                range.collapse(false);
                selection.removeAllRanges();
                selection.addRange(range);
                contentEditableRef.current.focus();
              }
              
              // Clear flag after insertion
              setTimeout(() => {
                isInsertingTextRef.current = false;
                isSelectingTemplateRef.current = false;
              }, 100);
            }, 10);
          } else {
            isSelectingTemplateRef.current = false;
          }
        } else {
          isSelectingTemplateRef.current = false;
        }
      }, 100);
    } catch (error) {
      console.error('Error in handleEmployeeSelect:', error);
      setShowMentionDropdown(false);
      setMentionType(null);
      isSelectingTemplateRef.current = false;
    }
  };
  
  // Check if rotating placeholder is enabled
  const [isRotatingPlaceholderEnabled, setIsRotatingPlaceholderEnabled] = useState(() => {
    const stored = localStorage.getItem('devOptions.rotatingPlaceholder');
    return stored !== null ? stored === 'true' : true;
  });

  // Listen for changes to the rotating placeholder setting
  useEffect(() => {
    const handleSettingChange = (event: CustomEvent) => {
      setIsRotatingPlaceholderEnabled(event.detail.enabled);
    };

    window.addEventListener('rotatingPlaceholderChanged', handleSettingChange as EventListener);
    return () => {
      window.removeEventListener('rotatingPlaceholderChanged', handleSettingChange as EventListener);
    };
  }, []);

  // Check which design option is selected (A or B)
  const [designOption, setDesignOption] = useState<'A' | 'B'>(() => {
    const stored = localStorage.getItem('devOptions.designOption');
    return (stored === 'A' || stored === 'B') ? stored : 'A';
  });

  // Listen for changes to the design option setting
  useEffect(() => {
    const handleDesignChange = (event: CustomEvent) => {
      setDesignOption(event.detail.option);
    };

    window.addEventListener('designOptionChanged', handleDesignChange as EventListener);
    return () => {
      window.removeEventListener('designOptionChanged', handleDesignChange as EventListener);
    };
  }, []);

  // Rotate placeholder text when input is not focused and empty
  useEffect(() => {
    // Only rotate if enabled, input is not focused, and has no content
    if (!isRotatingPlaceholderEnabled || isInputFocused || promptValue.trim()) {
      return;
    }
    
    const rotationInterval = setInterval(() => {
      // Fade out
      setIsPlaceholderVisible(false);
      
      // After fade out, change text and fade in
      setTimeout(() => {
        setCurrentPlaceholderIndex((prevIndex) => 
          (prevIndex + 1) % PLACEHOLDER_TEXTS.length
        );
        setIsPlaceholderVisible(true);
      }, 400); // Wait for fade out animation
    }, 4000); // Rotate every 4 seconds
    
    return () => clearInterval(rotationInterval);
  }, [isInputFocused, promptValue, isRotatingPlaceholderEnabled]);
  
  // Update contentEditable when promptValue changes (only if set externally)
  useEffect(() => {
    // Skip update if we're programmatically inserting text
    if (isInsertingTextRef.current) {
      return;
    }
    
    if (contentEditableRef.current) {
      const currentText = getPlainText(contentEditableRef.current);
      // Only update if the values differ (to avoid loops when user is typing)
      if (promptValue !== currentText) {
        contentEditableRef.current.innerHTML = formatTextWithMentions(promptValue, selectedMentions);
      }
    }
    
  }, [promptValue, selectedMentions, showMentionDropdown]);

  // Check if name, start date, or email are present in the text
  const hasRequiredFields = (text: string): boolean => {
    if (!text || text.trim().length === 0) return false;
    
    // Check for name - look for "First name:" or "Last name:" with content after, or just names in the text
    const firstNameMatch = text.match(/(?:first\s+name)[:\s]+([^\n-]+)/i);
    const lastNameMatch = text.match(/(?:last\s+name)[:\s]+([^\n-]+)/i);
    const hasNameValue = (firstNameMatch && firstNameMatch[1].trim().length > 0) || 
                        (lastNameMatch && lastNameMatch[1].trim().length > 0);
    
    // Check for email - look for "email:" or "invite email:" with content, or email pattern
    const emailMatch = text.match(/(?:email|invite\s+email)[:\s]+([^\n-]+)/i);
    const hasEmailValue = (emailMatch && emailMatch[1].trim().length > 0) ||
                         /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(text);
    
    // Check for start date - look for "Start date:" with content after
    const startDateMatch = text.match(/(?:start\s+date)[:\s]+([^\n-]+)/i);
    const hasStartDateValue = startDateMatch && startDateMatch[1].trim().length > 0;
    
    // Return true only if all three fields have values
    return hasNameValue && hasEmailValue && hasStartDateValue;
  };
  
  // Check if the field labels have been inserted (even without values)
  const hasFieldLabelsInserted = (text: string): boolean => {
    if (!text || text.trim().length === 0) return false;
    
    // Check if the formatted field labels are present
    const hasFirstNameLabel = text.includes('- First name:');
    const hasLastNameLabel = text.includes('- Last name:');
    const hasEmailLabel = text.includes('- Invite email:') || text.includes('- Email:');
    const hasStartDateLabel = text.includes('- Start date:');
    
    // Return true if all field labels are present
    return hasFirstNameLabel && hasLastNameLabel && hasEmailLabel && hasStartDateLabel;
  };
  
  // Update contentEditable when promptValue changes (only if set externally)
  useEffect(() => {
    // Skip update if we're programmatically inserting text
    if (isInsertingTextRef.current) {
      return;
    }
    
    if (contentEditableRef.current) {
      const currentText = getPlainText(contentEditableRef.current);
      // Only update if the values differ (to avoid loops when user is typing)
      if (promptValue !== currentText) {
        contentEditableRef.current.innerHTML = formatTextWithMentions(promptValue, selectedMentions);
      }
    }
  }, [promptValue, selectedMentions, showMentionDropdown]);

  const handleClose = () => {
    navigate('/');
  };

  const handleOptionClick = (option: string) => {
    // Handle option selection - can navigate to different flows
    console.log('Selected option:', option);
    if (option === 'manual') {
      navigate('/hiring');
    } else if (option === 'template') {
      // Pre-fill main input box with a prompt-like message
      const prefillText = 'I want to hire someone using @job template';
      setPromptValue(prefillText);
      setIsProgrammaticOpen(true);
      
      // Open the dropdown after a short delay to ensure contentEditable is updated
      setTimeout(() => {
        if (contentEditableRef.current) {
          // Focus the contentEditable first
          contentEditableRef.current.focus();
          
          // Set the content
          contentEditableRef.current.innerHTML = formatTextWithMentions(prefillText, selectedMentions);
          
          // Move cursor to the end of "@job template"
          const selection = window.getSelection();
          if (selection && contentEditableRef.current) {
            const cursorPos = prefillText.length;
            
            // Use TreeWalker to find the correct text node and position
            const walker = document.createTreeWalker(
              contentEditableRef.current,
              NodeFilter.SHOW_TEXT,
              null
            );
            
            let currentPos = 0;
            let targetNode: Node | null = null;
            let targetOffset = 0;
            
            let node;
            while (node = walker.nextNode()) {
              const nodeLength = node.textContent?.length || 0;
              if (currentPos + nodeLength >= cursorPos) {
                targetNode = node;
                targetOffset = cursorPos - currentPos;
                break;
              }
              currentPos += nodeLength;
            }
            
            if (targetNode) {
              const range = document.createRange();
              range.setStart(targetNode, targetOffset);
              range.collapse(true);
              selection.removeAllRanges();
              selection.addRange(range);
            } else {
              // Fallback: move to end
              const range = document.createRange();
              range.selectNodeContents(contentEditableRef.current);
              range.collapse(false);
              selection.removeAllRanges();
              selection.addRange(range);
            }
            
            // Trigger the mention detection to show dropdown
            detectMention(prefillText, cursorPos);
            
            // Reset the flag after a short delay
            setTimeout(() => {
              setIsProgrammaticOpen(false);
            }, 300);
          }
        }
      }, 100);
    } else if (option === 'rehire') {
      // Pre-fill main input box with "Rehire @employee"
      const prefillText = 'Rehire @employee';
      setPromptValue(prefillText);
      setIsProgrammaticOpen(true);
      
      // Open the dropdown after a short delay to ensure contentEditable is updated
      setTimeout(() => {
        if (contentEditableRef.current) {
          // Focus the contentEditable first
          contentEditableRef.current.focus();
          
          // Set the content
          contentEditableRef.current.innerHTML = formatTextWithMentions(prefillText, selectedMentions);
          
          // Move cursor to the end of "@employee"
          const selection = window.getSelection();
          if (selection && contentEditableRef.current) {
            const cursorPos = prefillText.length;
            
            // Use TreeWalker to find the correct text node and position
            const walker = document.createTreeWalker(
              contentEditableRef.current,
              NodeFilter.SHOW_TEXT,
              null
            );
            
            let currentPos = 0;
            let targetNode: Node | null = null;
            let targetOffset = 0;
            
            let node;
            while (node = walker.nextNode()) {
              const nodeLength = node.textContent?.length || 0;
              if (currentPos + nodeLength >= cursorPos) {
                targetNode = node;
                targetOffset = cursorPos - currentPos;
                break;
              }
              currentPos += nodeLength;
            }
            
            if (targetNode) {
              const range = document.createRange();
              range.setStart(targetNode, targetOffset);
              range.collapse(true);
              selection.removeAllRanges();
              selection.addRange(range);
            } else {
              // Fallback: move to end
              const range = document.createRange();
              range.selectNodeContents(contentEditableRef.current);
              range.collapse(false);
              selection.removeAllRanges();
              selection.addRange(range);
            }
            
            // Trigger the mention detection to show dropdown
            detectMention(prefillText, cursorPos);
            
            // Reset the flag after a short delay
            setTimeout(() => {
              setIsProgrammaticOpen(false);
            }, 300);
          }
        }
      }, 100);
    } else if (option === 'copy') {
      // Pre-fill main input box with a prompt-like message
      const prefillText = 'I want to hire someone like @employee';
      setPromptValue(prefillText);
      setIsProgrammaticOpen(true);
      
      // Open the dropdown after a short delay to ensure contentEditable is updated
      setTimeout(() => {
        if (contentEditableRef.current) {
          // Focus the contentEditable first
          contentEditableRef.current.focus();
          
          // Set the content
          contentEditableRef.current.innerHTML = formatTextWithMentions(prefillText, selectedMentions);
          
          // Move cursor to the end of "@employee"
          const selection = window.getSelection();
          if (selection && contentEditableRef.current) {
            const cursorPos = prefillText.length;
            
            // Use TreeWalker to find the correct text node and position
            const walker = document.createTreeWalker(
              contentEditableRef.current,
              NodeFilter.SHOW_TEXT,
              null
            );
            
            let currentPos = 0;
            let targetNode: Node | null = null;
            let targetOffset = 0;
            
            let node;
            while (node = walker.nextNode()) {
              const nodeLength = node.textContent?.length || 0;
              if (currentPos + nodeLength >= cursorPos) {
                targetNode = node;
                targetOffset = cursorPos - currentPos;
                break;
              }
              currentPos += nodeLength;
            }
            
            if (targetNode) {
              const range = document.createRange();
              range.setStart(targetNode, targetOffset);
              range.collapse(true);
              selection.removeAllRanges();
              selection.addRange(range);
            } else {
              // Fallback: move to end
              const range = document.createRange();
              range.selectNodeContents(contentEditableRef.current);
              range.collapse(false);
              selection.removeAllRanges();
              selection.addRange(range);
            }
            
            // Trigger the mention detection to show dropdown
            detectMention(prefillText, cursorPos);
            
            // Reset the flag after a short delay
            setTimeout(() => {
              setIsProgrammaticOpen(false);
            }, 300);
          }
        }
      }, 100);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Sub-header with "Start hiring" */}
      <div className="bg-white border-b border-[rgba(0,0,0,0.1)] h-14 left-0 w-full">
        <div className="flex items-center justify-between h-full px-4">
          <p className="font-medium leading-6 text-[17px] text-black tracking-[0.25px]">
            Start hiring
          </p>
          <button
            onClick={handleClose}
            className="overflow-clip relative rounded-xl shrink-0 size-8 flex items-center justify-center hover:bg-gray-100 transition-colors"
            title="Close"
          >
            <img 
              alt="Close" 
              className="block max-w-none size-5" 
              src={icons.Close}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col items-center pt-16 pb-8 px-4">
        <div className="w-full max-w-[860px]">
          {/* Title Section */}
          <div className="flex flex-col items-center gap-6 mb-6">
            <div className="flex items-center gap-2.5 justify-center">
              {/* Rippling AI Icon */}
              <img 
                src="/icons/SVGs/rippling_ai_icon_mark.svg"
                alt="Rippling AI"
                className="block max-w-none size-6"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
              <h1 className="font-medium leading-8 text-[26px] text-black text-center tracking-[0px]">
                Hire faster with Rippling AI
              </h1>
            </div>
          </div>

          {/* Prompt Box */}
          <div className="bg-white border border-[rgba(0,0,0,0.2)] border-solid flex flex-col items-start overflow-visible p-3 relative rounded-xl shrink-0 w-full mb-3 focus-within:outline-none focus-within:ring-0 box-border">
            <div className="flex flex-col gap-[13px] min-h-[77px] items-end relative shrink-0 w-full">
              <div className="flex flex-1 flex-col gap-2 items-start min-h-0 min-w-0 relative w-full">
                <div className="flex gap-2 items-center relative shrink-0 w-full">
                  <div className="relative flex-1">
                    <div
                      ref={contentEditableRef}
                      contentEditable
                      onInput={(e) => {
                        const text = getPlainText(e.currentTarget);
                        
                        // If input is empty, reset to default state
                        if (!text || text.trim().length === 0) {
                          setPromptValue('');
                          setSelectedMentions(new Set());
                          setSelectedEmployeeFormData(null);
                          setShowMentionDropdown(false);
                          setMentionType(null);
                          // Clear the contentEditable to show placeholder
                          e.currentTarget.innerHTML = '';
                          return;
                        }
                        
                        setPromptValue(text);
                        
                        // Detect mention
                        const selection = window.getSelection();
                        if (selection && selection.rangeCount > 0) {
                          const range = selection.getRangeAt(0);
                          detectMention(text, range.startOffset);
                        }
                        
                        // Only format if text contains @mentions, to avoid cursor issues
                        if (text.includes('@')) {
                          // Save cursor position in plain text
                          const selection = window.getSelection();
                          const range = selection?.getRangeAt(0);
                          let cursorOffset = 0;
                          
                          if (range) {
                            // Calculate cursor position in plain text by walking through text nodes
                            const walker = document.createTreeWalker(
                              e.currentTarget,
                              NodeFilter.SHOW_TEXT,
                              null
                            );
                            let pos = 0;
                            let node;
                            while (node = walker.nextNode()) {
                              if (node === range.startContainer) {
                                cursorOffset = pos + range.startOffset;
                                break;
                              }
                              pos += node.textContent?.length || 0;
                            }
                            // If not found, use range offset as fallback
                            if (cursorOffset === 0 && range.startContainer.nodeType === Node.TEXT_NODE) {
                              cursorOffset = range.startOffset;
                            }
                          }
                          
                          // Apply formatting
                          e.currentTarget.innerHTML = formatTextWithMentions(text, selectedMentions);
                          
                          // Restore cursor position using TreeWalker
                          try {
                            if (selection) {
                              const walker = document.createTreeWalker(
                                e.currentTarget,
                                NodeFilter.SHOW_TEXT,
                                null
                              );
                              
                              let currentPos = 0;
                              let targetNode: Node | null = null;
                              let targetOffset = 0;
                              
                              let node;
                              while (node = walker.nextNode()) {
                                const nodeLength = node.textContent?.length || 0;
                                if (currentPos + nodeLength >= cursorOffset) {
                                  targetNode = node;
                                  targetOffset = cursorOffset - currentPos;
                                  break;
                                }
                                currentPos += nodeLength;
                              }
                              
                              if (targetNode) {
                                const newRange = document.createRange();
                                newRange.setStart(targetNode, targetOffset);
                                newRange.collapse(true);
                                selection.removeAllRanges();
                                selection.addRange(newRange);
                              } else {
                                // Fallback: move to end
                                const endRange = document.createRange();
                                endRange.selectNodeContents(e.currentTarget);
                                endRange.collapse(false);
                                selection.removeAllRanges();
                                selection.addRange(endRange);
                              }
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
                        setIsInputFocused(true);
                        setIsPlaceholderVisible(true);
                        setCurrentPlaceholderIndex(0); // Reset to first placeholder on focus
                      }}
                      onKeyDown={(e) => {
                        if (showMentionDropdown) {
                          if (e.key === 'ArrowDown') {
                            e.preventDefault();
                            const maxIndex = mentionType === 'employee' 
                              ? filteredEmployees.length - 1 
                              : filteredJobTemplates.length - 1;
                            setSelectedIndex(prev => Math.min(prev + 1, maxIndex));
                          } else if (e.key === 'ArrowUp') {
                            e.preventDefault();
                            setSelectedIndex(prev => Math.max(prev - 1, 0));
                          } else if (e.key === 'Enter' || e.key === 'Tab') {
                            e.preventDefault();
                            if (mentionType === 'employee' && filteredEmployees[selectedIndex]) {
                              handleEmployeeSelect(filteredEmployees[selectedIndex]);
                            } else if (mentionType === 'job-template' && filteredJobTemplates[selectedIndex]) {
                              handleTemplateSelect(filteredJobTemplates[selectedIndex]);
                            }
                          } else if (e.key === 'Escape') {
                            e.preventDefault();
                            setShowMentionDropdown(false);
                            setMentionType(null);
                          }
                        }
                      }}
                      onBlur={(e) => {
                        setIsInputFocused(false);
                        // Don't close if we just programmatically opened it
                        if (isProgrammaticOpen) {
                          return;
                        }
                        // Don't close if we're in the process of selecting a template
                        if (isSelectingTemplateRef.current) {
                          return;
                        }
                        // Check if blur was caused by clicking on dropdown
                        const relatedTarget = e.relatedTarget as HTMLElement;
                        const clickedOnDropdown = relatedTarget && (
                          dropdownRef.current?.contains(relatedTarget) ||
                          dropdownRef.current === relatedTarget
                        );
                        
                        if (clickedOnDropdown) {
                          return; // Don't close if clicking on dropdown
                        }
                        
                        // Delay to allow dropdown click
                        setTimeout(() => {
                          // Check again if we're selecting template (in case it was set during the delay)
                          if (isSelectingTemplateRef.current) {
                            return;
                          }
                          const activeElement = document.activeElement;
                          // Check if user clicked on dropdown
                          const stillOnDropdown = dropdownRef.current?.contains(activeElement);
                          
                          // Only hide if user actually clicked away (not on dropdown)
                          if (!stillOnDropdown && 
                              activeElement !== contentEditableRef.current &&
                              !contentEditableRef.current.contains(activeElement)) {
                            setShowMentionDropdown(false);
                            setMentionType(null);
                          }
                        }, 200);
                      }}
                      className="font-normal leading-5 relative shrink-0 text-[14px] text-black bg-transparent border-0 outline-0 focus:outline-none focus:ring-0 w-full min-h-[20px]"
                      style={{
                        wordBreak: 'break-word',
                        whiteSpace: 'pre-wrap'
                      }}
                    />
                    {/* Fixed placeholder text - hidden when focused or has content */}
                    {!promptValue.trim() && !isInputFocused && (
                      <div 
                        className="absolute pointer-events-none font-normal leading-5 text-[14px] text-[#716f6c] top-0 left-0"
                        style={{
                          whiteSpace: 'pre-wrap'
                        }}
                      >
                        {hoveredCard === 'upload' 
                          ? 'I want to upload a document...' 
                          : hoveredCard === 'copy' 
                            ? 'I want to hire someone like...' 
                            : hoveredCard === 'template' 
                              ? 'I want to hire someone using...' 
                              : 'Describe your hire to start'}
                      </div>
                    )}
                    {/* Mention Dropdown */}
                    {showMentionDropdown && mentionPosition && (
                      <div
                        ref={dropdownRef}
                        className="absolute z-50 bg-white border border-[rgba(0,0,0,0.1)] border-solid rounded-xl shadow-[0px_42px_80px_0px_rgba(0,0,0,0.01),0px_17.547px_33.422px_0px_rgba(0,0,0,0.02),0px_9.381px_17.869px_0px_rgba(0,0,0,0.02),0px_5.259px_10.017px_0px_rgba(0,0,0,0.02),0px_2.793px_5.32px_0px_rgba(0,0,0,0.03),0px_1.162px_2.214px_0px_rgba(0,0,0,0.04)] w-[297px]"
                        style={{
                          top: `${mentionPosition.top}px`,
                          left: `${mentionPosition.left}px`
                        }}
                        onMouseDown={(e) => e.preventDefault()} // Prevent blur on click
                      >
                        <div className="flex flex-col">
                          <div className="px-4 pt-4 pb-2 shrink-0">
                            <p className="text-[11px] leading-[14px] text-[#716f6c] tracking-[1px] uppercase font-medium">
                              {mentionType === 'employee' ? 'Employee' : 'Job template'}
                            </p>
                          </div>
                          <div className="h-px bg-[rgba(0,0,0,0.1)] shrink-0 mx-4"></div>
                          <div className="flex flex-col gap-0 max-h-[300px] overflow-y-auto px-4 pb-4">
                            {mentionType === 'employee' ? (
                              filteredEmployees.length > 0 ? (
                                filteredEmployees.map((employee, index) => (
                                  <button
                                    key={employee}
                                    onMouseDown={(e) => {
                                      // Set flag early to prevent blur handler from hiding hint box
                                      isSelectingTemplateRef.current = true;
                                      // Don't prevent default - we want the click to work
                                    }}
                                    onClick={() => {
                                      // Ensure flag is set before handling
                                      isSelectingTemplateRef.current = true;
                                      handleEmployeeSelect(employee);
                                    }}
                                    onMouseEnter={() => setSelectedIndex(index)}
                                    className={`text-left px-0 py-2 text-[14px] leading-[20px] transition-colors rounded flex items-center gap-2 ${
                                      index === selectedIndex 
                                        ? 'bg-gray-50' 
                                        : 'hover:bg-gray-50'
                                    }`}
                                  >
                                    {/* Avatar placeholder - you can replace with actual avatar component */}
                                    <div className="w-6 h-6 rounded-full bg-gray-200 shrink-0 flex items-center justify-center text-[10px] font-medium text-gray-600">
                                      {employee && employee.trim() 
                                        ? employee.split(' ').filter(n => n && n.length > 0).map(n => n[0]).join('').substring(0, 2).toUpperCase() || '??'
                                        : '??'}
                                    </div>
                                    {employee || ''}
                                  </button>
                                ))
                              ) : (
                                <div className="py-2 text-[14px] leading-[20px] text-[#716f6c]">
                                  No employees found
                                </div>
                              )
                            ) : (
                              filteredJobTemplates.length > 0 ? (
                                filteredJobTemplates.map((template, index) => (
                                  <button
                                    key={template}
                                    onMouseDown={(e) => {
                                      // Set flag early to prevent blur handler from hiding hint box
                                      isSelectingTemplateRef.current = true;
                                      // Don't prevent default - we want the click to work
                                    }}
                                    onClick={() => {
                                      // Ensure flag is set before handling
                                      isSelectingTemplateRef.current = true;
                                      handleTemplateSelect(template);
                                    }}
                                    onMouseEnter={() => setSelectedIndex(index)}
                                    className={`text-left px-0 py-2 text-[14px] leading-[20px] transition-colors rounded ${
                                      index === selectedIndex 
                                        ? 'bg-gray-50' 
                                        : 'hover:bg-gray-50'
                                    }`}
                                  >
                                    {template}
                                  </button>
                                ))
                              ) : (
                                <div className="py-2 text-[14px] leading-[20px] text-[#716f6c]">
                                  No templates found
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  {/* Old placeholder CSS removed - using custom overlay instead */}
                </div>
              </div>
              <div className="flex gap-6 items-center overflow-clip relative shrink-0 w-full">
                <div className="flex flex-1 items-center min-h-0 min-w-0 relative gap-2">
                  {promptValue.trim() ? (
                    <>
                      {/* Template Chips - Hide when already added */}
                      {!promptValue.includes('Base compensation:') && (
                        <button 
                          onClick={() => {
                            const template = '\n\n- Base compensation:\n- Per:\n- Currency:';
                            setPromptValue(prev => prev + template);
                            if (contentEditableRef.current) {
                              contentEditableRef.current.innerHTML = formatTextWithMentions(promptValue + template, selectedMentions);
                              contentEditableRef.current.focus();
                            }
                          }}
                          className="px-3 py-1.5 bg-white border border-[rgba(0,0,0,0.1)] rounded-full text-[13px] font-medium text-black hover:bg-[#f5f5f5] transition-colors whitespace-nowrap"
                        >
                          + Add compensation details
                        </button>
                      )}
                      {!promptValue.includes('Department:') && (
                        <button 
                          onClick={() => {
                            const template = '\n\n- Department:\n- Level:\n- Title:';
                            setPromptValue(prev => prev + template);
                            if (contentEditableRef.current) {
                              contentEditableRef.current.innerHTML = formatTextWithMentions(promptValue + template, selectedMentions);
                              contentEditableRef.current.focus();
                            }
                          }}
                          className="px-3 py-1.5 bg-white border border-[rgba(0,0,0,0.1)] rounded-full text-[13px] font-medium text-black hover:bg-[#f5f5f5] transition-colors whitespace-nowrap"
                        >
                          + Add role details
                        </button>
                      )}
                    </>
                  ) : (
                    /* Outline Icon Button - Square with 6px border-radius */
                    <button className="flex items-center justify-center relative shrink-0 size-6 rounded-md border border-[rgba(0,0,0,0.2)] border-solid bg-white hover:bg-gray-50 hover:border-[rgba(0,0,0,0.3)] transition-all">
                      <img 
                        alt="Add" 
                        className="block max-w-none size-4" 
                        src={icons.Add}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    </button>
                  )}
                </div>
                <div className="flex items-center relative shrink-0">
                  {/* Primary Button */}
                  <button 
                    onClick={() => {
                      if (promptValue.trim()) {
                        // Get form data - prioritize selected employee form data, then window.hiringAgent
                        let formData = null;
                        if (selectedEmployeeFormData) {
                          formData = selectedEmployeeFormData;
                        } else if ((window as any).hiringAgent?.getData) {
                          formData = (window as any).hiringAgent.getData();
                        }
                        
                        // Navigate to composer view with user input and form data
                        navigate('/composer', {
                          state: {
                            userInput: promptValue.trim(),
                            formData: formData
                          }
                        });
                      }
                    }}
                    disabled={!promptValue.trim()}
                    className="flex gap-1.5 items-center justify-center relative shrink-0 h-8 px-3 rounded-lg bg-[#7A005D] hover:bg-[#9F1E7A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <img 
                      alt="Send" 
                      className="block max-w-none size-4" 
                      src={icons.ArrowUp}
                      style={{ filter: 'brightness(0) invert(1)' }}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                    <span className="font-medium text-[13px] leading-4 text-white whitespace-nowrap">Start and review</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Option Cards/Buttons - Hidden when prompt has content */}
          {!promptValue.trim() && (
          <div className={`w-full ${selectedMentions.size > 0 ? 'relative z-40' : ''}`}>
            {designOption === 'A' ? (
              /* Option A: Card-style design with icons and descriptions */
              <div className="flex gap-3 w-full">
                {/* Option 1: Upload document */}
                <div 
                  onClick={() => setShowUploadModal(true)}
                  onMouseEnter={() => setHoveredCard('upload')}
                  onMouseLeave={() => setHoveredCard(null)}
                  className="bg-white border border-[rgba(0,0,0,0.1)] border-solid flex flex-1 items-start p-3 rounded-lg cursor-pointer hover:border-[rgba(0,0,0,0.2)] transition-all"
                >
                  <div className="flex gap-2 items-start w-full">
                    {/* Icon Avatar with light berry background */}
                    <div className="relative shrink-0 w-7 h-7 flex items-center justify-center rounded-full bg-[#FDF3FF] overflow-hidden">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="#CE71BB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M14 2V8H20" stroke="#CE71BB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M12 18V12" stroke="#CE71BB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M9 15L12 12L15 15" stroke="#CE71BB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                                      <p className="font-semibold leading-4 text-black text-[12px] text-left">
                                        Upload document
                                      </p>
                                      <p className="font-normal leading-4 text-black text-[12px] text-left">
                                        Let Rippling AI extract data from an offer letter or CSV file
                                      </p>
                                    </div>
                  </div>
                </div>

                {/* Option 2: Copy details from employee */}
                <div 
                  onClick={() => handleOptionClick('copy')}
                  onMouseEnter={() => setHoveredCard('copy')}
                  onMouseLeave={() => setHoveredCard(null)}
                  className="bg-white border border-[rgba(0,0,0,0.1)] border-solid flex flex-1 items-start p-3 rounded-lg cursor-pointer hover:border-[rgba(0,0,0,0.2)] transition-all"
                >
                  <div className="flex gap-2 items-start w-full">
                    {/* Icon Avatar with light berry background */}
                    <div className="relative shrink-0 w-7 h-7 flex items-center justify-center rounded-full bg-[#FDF3FF] overflow-hidden">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="#CE71BB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z" stroke="#CE71BB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13" stroke="#CE71BB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M16 3.13C16.8604 3.3503 17.623 3.8507 18.1676 4.5523C18.7122 5.2539 19.0078 6.1168 19.0078 7.005C19.0078 7.8932 18.7122 8.7561 18.1676 9.4577C17.623 10.1593 16.8604 10.6597 16 10.88" stroke="#CE71BB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                                      <p className="font-semibold leading-4 text-black text-[12px] text-left">
                                        Reference an existing employee
                                      </p>
                                      <p className="font-normal leading-4 text-black text-[12px] text-left">
                                        Start with an existing employee's details and adjust
                                      </p>
                                    </div>
                  </div>
                </div>

                {/* Option 3: Hire using job template */}
                <div 
                  onClick={() => handleOptionClick('template')}
                  onMouseEnter={() => setHoveredCard('template')}
                  onMouseLeave={() => setHoveredCard(null)}
                  className="bg-white border border-[rgba(0,0,0,0.1)] border-solid flex flex-1 items-start p-3 rounded-lg cursor-pointer hover:border-[rgba(0,0,0,0.2)] transition-all"
                >
                  <div className="flex gap-2 items-start w-full">
                    {/* Icon Avatar with light berry background */}
                    <div className="relative shrink-0 w-7 h-7 flex items-center justify-center rounded-full bg-[#FDF3FF] overflow-hidden">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20 7H4C2.89543 7 2 7.89543 2 9V19C2 20.1046 2.89543 21 4 21H20C21.1046 21 22 20.1046 22 19V9C22 7.89543 21.1046 7 20 7Z" stroke="#CE71BB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M16 21V5C16 4.46957 15.7893 3.96086 15.4142 3.58579C15.0391 3.21071 14.5304 3 14 3H10C9.46957 3 8.96086 3.21071 8.58579 3.58579C8.21071 3.96086 8 4.46957 8 5V21" stroke="#CE71BB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                                      <p className="font-semibold leading-4 text-black text-[12px] text-left">
                                        Use job template
                                      </p>
                                      <p className="font-normal leading-4 text-black text-[12px] text-left">
                                        Pre-fill details from a saved job template
                                      </p>
                                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Option B: Button-style design - simple outline buttons in a row */
              <div className="flex gap-3 items-center flex-wrap">
                {/* Upload document button */}
                <button 
                  onClick={() => setShowUploadModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-[rgba(0,0,0,0.2)] rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M17 8L12 3L7 8" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 3V15" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="text-[14px] font-medium text-black">Upload document</span>
                </button>

                {/* Copy existing employee button */}
                <button 
                  onClick={() => handleOptionClick('copy')}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-[rgba(0,0,0,0.2)] rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="9" y="9" width="13" height="13" rx="2" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M5 15H4C3.46957 15 2.96086 14.7893 2.58579 14.4142C2.21071 14.0391 2 13.5304 2 13V4C2 3.46957 2.21071 2.96086 2.58579 2.58579C2.96086 2.21071 3.46957 2 4 2H13C13.5304 2 14.0391 2.21071 14.4142 2.58579C14.7893 2.96086 15 3.46957 15 4V5" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="text-[14px] font-medium text-black">Copy existing employee</span>
                </button>

                {/* Use job template button */}
                <button 
                  onClick={() => handleOptionClick('template')}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-[rgba(0,0,0,0.2)] rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 7H4C2.89543 7 2 7.89543 2 9V19C2 20.1046 2.89543 21 4 21H20C21.1046 21 22 20.1046 22 19V9C22 7.89543 21.1046 7 20 7Z" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M16 21V5C16 4.46957 15.7893 3.96086 15.4142 3.58579C15.0391 3.21071 14.5304 3 14 3H10C9.46957 3 8.96086 3.21071 8.58579 3.58579C8.21071 3.96086 8 4.46957 8 5V21" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="text-[14px] font-medium text-black">Use job template</span>
                </button>

                {/* Discover more button */}
                <button 
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-[rgba(0,0,0,0.2)] rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="11" cy="11" r="8" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M21 21L16.65 16.65" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="text-[14px] font-medium text-black">Discover more</span>
                </button>
              </div>
            )}
          </div>
          )}


          {/* Manual Entry Link - Always visible */}
          <p 
            onClick={() => handleOptionClick('manual')}
            className="font-medium leading-5 text-[#1e4aa9] text-[14px] text-center w-full cursor-pointer hover:underline transition-colors pt-3"
          >
            {designOption === 'B' ? 'Enter all hire details manually instead' : 'Enter hire details manually instead'}
          </p>
        </div>
      </div>

      {/* Upload Document Modal */}
      {showUploadModal && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowUploadModal(false)}
        >
          <div 
            className="bg-white rounded-2xl w-[520px] max-w-[90vw] overflow-hidden shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(0,0,0,0.1)]">
              <h2 className="font-medium text-[18px] text-black">Upload a document</h2>
              <button 
                onClick={() => setShowUploadModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>

            {/* Modal Content - File Drop Zone */}
            <div className="p-6">
              <div 
                className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center gap-4 transition-colors ${
                  isDragging 
                    ? 'border-[#7A005D] bg-[#FEF3FF]' 
                    : 'border-[rgba(0,0,0,0.2)] hover:border-[rgba(0,0,0,0.3)]'
                }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  const files = e.dataTransfer.files;
                  if (files.length > 0) {
                    console.log('Dropped files:', files);
                    // TODO: Handle file upload
                    setShowUploadModal(false);
                  }
                }}
              >
                <div className="w-14 h-14 rounded-full bg-[#FEF3FF] flex items-center justify-center">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15M17 8L12 3M12 3L7 8M12 3V15" stroke="#7A005D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="text-center">
                  <p className="font-medium text-[16px] text-black mb-1">
                    Drop your file here, or{' '}
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="text-[#1e4aa9] hover:underline cursor-pointer"
                    >
                      browse
                    </button>
                  </p>
                  <p className="text-[14px] text-[#716f6c]">
                    Supports offer letters (PDF, DOCX) or CSV for multiple hires
                  </p>
                </div>
                <input 
                  ref={fileInputRef}
                  type="file" 
                  className="hidden" 
                  accept=".pdf,.docx,.doc,.csv"
                  onChange={(e) => {
                    const files = e.target.files;
                    if (files && files.length > 0) {
                      console.log('Selected files:', files);
                      // TODO: Handle file upload
                      setShowUploadModal(false);
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

