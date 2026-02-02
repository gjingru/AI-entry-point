import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { icons } from '../utils/icons';
import hireInformationConfig from '../data/hireInformation.json';
import { sendChatMessage, createHiringSystemPrompt, ChatMessage } from '../utils/openai';
import Button from '../components/Button';

// Hiring Session Data Structure (matching HiringFlowView)
interface HiringSessionData {
  personal: {
    first_name: string;
    last_name: string;
    personal_email?: string;
    invite_email?: string;
  };
  work: {
    employment_classification: string;
    country?: string;
    work_location_id?: string;
    employment_type_id?: string;
    entity?: string;
    overtime_exemption?: string;
  };
  role: {
    start_date: string;
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
  country_specific?: {
    IN?: {
      india_id_number?: string;
    };
  };
}

// Seed data from Sarah Jones - used when referencing her for a new hire
// Excludes: first_name, last_name, invite_email, start_date (these are for the new hire)
const SARAH_JONES_SEED_DATA: Partial<HiringSessionData> = {
  work: {
    employment_classification: 'Employee',
    work_location_id: 'San Francisco, CA',
    employment_type_id: 'Full-time',
    overtime_exemption: 'Exempt',
  },
  role: {
    start_date: '', // Leave empty - new hire needs to provide
    title: 'Software Engineer',
    level: 'L4',
    department_id: 'Engineering',
    team_id: 'Platform',
    manager: 'Craig Workman',
  },
  comp: {
    amount: '180000',
    currency: 'USD',
    frequency: 'Year',
  },
};


interface ComposerViewLocationState {
  userInput?: string;
  formData?: HiringSessionData;
}

export default function ComposerView() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as ComposerViewLocationState | null;
  
  const [formData, setFormData] = useState<HiringSessionData>(
    state?.formData || {
      personal: {
        first_name: '',
        last_name: '',
        personal_email: '',
        invite_email: ''
      },
      work: {
        employment_classification: ''
      },
      role: {
        start_date: ''
      },
      comp: {}
    }
  );
  
  const [userInput, setUserInput] = useState<string>(state?.userInput || '');
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [inputValue, setInputValue] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);
  const [isReviewMode, setIsReviewMode] = useState<boolean>(false);
  const [isAnimating, setIsAnimating] = useState<boolean>(true);
  const [isEntering, setIsEntering] = useState<boolean>(true);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  
  // Helper function to check if a value exists
  const hasValue = (value: any): boolean => {
    return value !== undefined && value !== null && value !== '';
  };
  
  // Check if information was copied from another employee
  const isCopiedFromEmployee = useMemo(() => {
    // Check for @employee pattern (old) or @[firstname] [lastname] pattern (new - after strong type selection)
    const hasEmployeeMention = userInput.toLowerCase().includes('@employee') || 
                               /@[a-z]+\s+[a-z]+/.test(userInput.toLowerCase());
    return hasEmployeeMention || 
           (hasValue(formData.role.department_id) || hasValue(formData.role.manager) || hasValue(formData.role.team_id)) ||
           hasValue(formData.comp.amount);
  }, [userInput, formData]);

  // Get value from nested object path
  const getValueFromPath = (obj: any, path: string): any => {
    const keys = path.split('.');
    let value = obj;
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return undefined;
      }
    }
    return value;
  };

  // Check which required fields are missing
  const getMissingRequiredFields = useMemo(() => {
    const missing: string[] = [];
    try {
      const config = hireInformationConfig as {
        requiredFields: string[];
        fieldLabels: Record<string, string>;
        fieldPaths: Record<string, string>;
      };

      if (!config || !config.requiredFields || !Array.isArray(config.requiredFields)) {
        console.error('Invalid hireInformationConfig:', config);
        return missing;
      }

      config.requiredFields.forEach((field) => {
        const path = config.fieldPaths?.[field];
        if (path) {
          const value = getValueFromPath(formData, path);
          if (!hasValue(value)) {
            missing.push(config.fieldLabels?.[field] || field);
          }
        }
      });
    } catch (error) {
      console.error('Error calculating missing fields:', error);
    }

    return missing;
  }, [formData]);

  // Check if field is mentioned in userInput text
  const isFieldMentionedInInput = (fieldLabel: string, inputText: string): boolean => {
    if (!inputText) return false;
    const lowerInput = inputText.toLowerCase();
    const lowerField = fieldLabel.toLowerCase();
    
    // Check for common patterns like "First name: John" or "first name is John" etc.
    const patterns = [
      new RegExp(`${lowerField.replace(/\s+/g, '\\s+')}[:\\s]+[^\\n-]+`, 'i'),
      new RegExp(`(?:first|last)\\s+name[:\\s]+[^\\n-]+`, 'i'), // For name fields
      new RegExp(`invite\\s+email[:\\s]+[^\\n-]+`, 'i'), // For email
      new RegExp(`start\\s+date[:\\s]+[^\\n-]+`, 'i'), // For start date
      new RegExp(`[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}`, 'i') // Email pattern
    ];
    
    return patterns.some(pattern => pattern.test(lowerInput));
  };

  // Get missing fields specific to copied employee flow
  const getMissingCopiedEmployeeFields = useMemo(() => {
    if (!isCopiedFromEmployee) return [];
    
    const missing: string[] = [];
    const fieldsToCheck = [
      { path: 'personal.first_name', label: 'First name' },
      { path: 'personal.last_name', label: 'Last name' },
      { path: 'personal.invite_email', label: 'Invite email' },
      { path: 'role.start_date', label: 'Start date' }
    ];

    fieldsToCheck.forEach(({ path, label }) => {
      const value = getValueFromPath(formData, path);
      // Only add to missing if not in formData AND not mentioned in userInput
      if (!hasValue(value) && !isFieldMentionedInInput(label, userInput)) {
        missing.push(label);
      }
    });

    return missing;
  }, [formData, isCopiedFromEmployee, userInput]);

  // Generate follow-up message for missing fields
  const generateFollowUpMessage = (missingFields: string[]): string => {
    if (missingFields.length === 0) {
      return "Please review hire information and submit on left panel when you are ready";
    }
    
    if (missingFields.length === 1) {
      return `To create a draft hire, I still need:\n\n• ${missingFields[0]}`;
    }
    
    const fieldsList = missingFields.map(field => `• ${field}`).join('\n');
    return `To create a draft hire, I still need the following information:\n\n${fieldsList}`;
  };

  // Generate follow-up message specifically for copied employee flow
  const generateCopiedEmployeeFollowUpMessage = (missingFields: string[]): string => {
    if (missingFields.length === 0) {
      return "Please review hire information and submit on left panel when you are ready";
    }
    
    if (missingFields.length === 1) {
      return `To create a draft hire, I still need:\n\n• ${missingFields[0]}`;
    }
    
    const fieldsList = missingFields.map(field => `• ${field}`).join('\n');
    return `To create a draft hire, I still need the following information:\n\n${fieldsList}`;
  };

  // Parse field values from chat messages
  const parseFieldsFromMessages = (messages: Array<{ role: 'user' | 'assistant'; content: string }>, currentFormData?: HiringSessionData): { personal?: Partial<HiringSessionData['personal']>; role?: Partial<HiringSessionData['role']> } => {
    const updates: { personal: Partial<HiringSessionData['personal']>; role: Partial<HiringSessionData['role']> } = {
      personal: {},
      role: {}
    };
    
    // Combine all message content
    const allText = messages.map(m => m.content).join('\n');
    
    // Check if first_name and last_name are already set in formData
    const hasExistingName = currentFormData?.personal?.first_name && currentFormData?.personal?.last_name;
    
    // Helper function to check if a value is a field name label (not an actual value)
    const isFieldNameLabel = (value: string): boolean => {
      const lowerValue = value.toLowerCase().trim();
      const fieldNamePatterns = [
        /^first\s+name$/i,
        /^last\s+name$/i,
        /^invite\s+email$/i,
        /^email$/i,
        /^start\s+date$/i,
        /^personal\s+email$/i
      ];
      return fieldNamePatterns.some(pattern => pattern.test(lowerValue));
    };
    
    // Parse First name - handle formats like "First name: value" or "First name value"
    const firstNameMatch = allText.match(/(?:first\s+name)[:\s]+([^\n•\-\r]+)/i);
    if (firstNameMatch && firstNameMatch[1]) {
      const value = firstNameMatch[1].trim();
      if (value && 
          !value.toLowerCase().includes('input required') && 
          !value.toLowerCase().includes('still need') && 
          !isFieldNameLabel(value) &&
          value.length > 0) {
        updates.personal!.first_name = value;
      }
    }
    
    // Parse Last name
    const lastNameMatch = allText.match(/(?:last\s+name)[:\s]+([^\n•\-\r]+)/i);
    if (lastNameMatch && lastNameMatch[1]) {
      const value = lastNameMatch[1].trim();
      if (value && 
          !value.toLowerCase().includes('input required') && 
          !value.toLowerCase().includes('still need') && 
          !isFieldNameLabel(value) &&
          value.length > 0) {
        updates.personal!.last_name = value;
      }
    }
    
    // Parse standalone names (e.g., "James Donovan") - only if first_name and last_name are not already set
    // Look for patterns like "FirstName LastName" anywhere in the message
    if (!updates.personal!.first_name && !updates.personal!.last_name && !hasExistingName) {
      // Get user messages only (not assistant responses)
      const userMessages = messages.filter(m => m.role === 'user').map(m => m.content.trim());
      
      // Check each user message for a name pattern
      for (const userMessage of userMessages) {
        console.log('Checking user message for name:', userMessage);
        
        // Exclude common words that might be capitalized but aren't names
        const excludeWords = ['first', 'last', 'name', 'email', 'date', 'start', 'invite', 'job', 'template', 'employee', 'hire', 'using', 'the', 'and', 'or', 'san', 'francisco', 'new', 'york', 'copy', 'information', 'from'];
        
        // Try multiple patterns to find names
        let nameMatch: RegExpMatchArray | null = null;
        
        // Pattern 1: Standalone name (entire message is just the name)
        nameMatch = userMessage.match(/^([A-Z][a-z]{2,})\s+([A-Z][a-z]{2,})\s*$/);
        
        // Pattern 2: Name after a mention (like "@employee craig workman James Donovan" or "@craig workman James Donovan")
        if (!nameMatch) {
          // Look for pattern: @employee [existing name] [new name] OR @[existing name] [new name]
          // We want to capture the LAST two capitalized words that aren't part of the mention
          const mentionWithNamePattern = /(@employee\s+[a-z]+\s+[a-z]+\s+|@[a-z]+\s+[a-z]+\s+)([A-Z][a-z]{2,})\s+([A-Z][a-z]{2,})(?:\s|$|[.,!?])/i;
          nameMatch = userMessage.match(mentionWithNamePattern);
          // If matched, adjust to capture the name groups correctly
          if (nameMatch && nameMatch.length >= 4) {
            nameMatch = [nameMatch[0], nameMatch[2], nameMatch[3]] as RegExpMatchArray;
          }
        }
        
        // Pattern 3: Name anywhere in text (two capitalized words)
        if (!nameMatch) {
          // Match: space or start, then FirstName LastName, then space or end or punctuation
          // But exclude if it's part of a mention pattern
          const generalNamePattern = /(?:^|\s)([A-Z][a-z]{2,})\s+([A-Z][a-z]{2,})(?:\s|$|[.,!?])/;
          const allMatches = [...userMessage.matchAll(new RegExp(generalNamePattern, 'g'))];
          
          // Find the best match (prefer names that aren't right after @)
          for (const match of allMatches) {
            if (match.index !== undefined && match[1] && match[2]) {
              const beforeMatch = userMessage.substring(0, match.index).toLowerCase();
              // Skip if it's directly after @employee, @job, or @[name] pattern
              const endsWithMention = beforeMatch.endsWith('@employee') || 
                                      beforeMatch.endsWith('@job') ||
                                      /@[a-z]+\s+[a-z]+\s*$/.test(beforeMatch);
              if (!endsWithMention) {
                nameMatch = match;
                break;
              }
            }
          }
        }
        
        console.log('Name match result:', nameMatch);
        
        if (nameMatch && nameMatch[1] && nameMatch[2]) {
          const potentialFirstName = nameMatch[1].trim();
          const potentialLastName = nameMatch[2].trim();
          
          const isExcluded = excludeWords.includes(potentialFirstName.toLowerCase()) || 
                            excludeWords.includes(potentialLastName.toLowerCase());
          
          // Only set if it looks like a real name and not excluded
          if (!isExcluded && 
              potentialFirstName.length >= 2 && potentialLastName.length >= 2 &&
              potentialFirstName.length <= 20 && potentialLastName.length <= 20) {
            console.log('Setting name:', potentialFirstName, potentialLastName);
            updates.personal!.first_name = potentialFirstName;
            updates.personal!.last_name = potentialLastName;
            break; // Found a name, stop looking
          }
        }
      }
    }
    
    // Parse Invite email
    const inviteEmailMatch = allText.match(/(?:invite\s+email|email)[:\s]+([^\n•\-\r]+)/i);
    if (inviteEmailMatch && inviteEmailMatch[1]) {
      const value = inviteEmailMatch[1].trim();
      if (value && 
          !value.toLowerCase().includes('input required') && 
          !value.toLowerCase().includes('still need') &&
          !isFieldNameLabel(value)) {
        // Clean up email (remove extra spaces, handle cases like "fwjeoi @fwe.com")
        const cleanEmail = value.replace(/\s+/g, '').replace(/@\s*/g, '@');
        if (cleanEmail.includes('@') && cleanEmail.includes('.')) {
          updates.personal!.invite_email = cleanEmail;
        }
      }
    }
    
    // Also check for email pattern anywhere in text (fallback)
    const emailPattern = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i;
    const emailMatch = allText.match(emailPattern);
    if (emailMatch && emailMatch[1] && !updates.personal!.invite_email) {
      updates.personal!.invite_email = emailMatch[1];
    }
    
    // Parse Start date - handle formats like "12/12/28" or "Start date: 12/12/28"
    // First try to find explicit "start date:" pattern
    const startDateMatch = allText.match(/(?:start\s+date)[:\s]+([^\n•\-\r]+)/i);
    if (startDateMatch && startDateMatch[1]) {
      const value = startDateMatch[1].trim();
      if (value && !value.toLowerCase().includes('input required') && !value.toLowerCase().includes('still need')) {
        // Try to parse and format the date
        let dateValue = value;
        // Handle formats like "12/12/28" -> "2028-12-12"
        const dateMatch = value.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
        if (dateMatch) {
          const month = dateMatch[1].padStart(2, '0');
          const day = dateMatch[2].padStart(2, '0');
          const year = dateMatch[3].length === 2 ? `20${dateMatch[3]}` : dateMatch[3];
          dateValue = `${year}-${month}-${day}`;
        }
        updates.role!.start_date = dateValue;
      }
    } else {
      // Fallback: Look for date patterns anywhere in the text if start_date is not already set
      // Only do this if we don't already have a start_date value
      if (!currentFormData?.role?.start_date || !hasValue(currentFormData.role.start_date)) {
        // Look for date patterns like "12/12/27" or "12/12/2027" in the text
        // Avoid matching dates that are part of email addresses or other contexts
        const datePattern = /(?:^|\s)(\d{1,2}\/\d{1,2}\/\d{2,4})(?:\s|$|[.,!?])/g;
        const dateMatches = [...allText.matchAll(datePattern)];
        
        console.log('Looking for date patterns in text:', allText, 'Found matches:', dateMatches);
        
        // Find the most likely date (prefer dates that appear after names/emails, not in email addresses)
        for (const match of dateMatches) {
          if (match.index !== undefined && match[1]) {
            const beforeMatch = allText.substring(0, match.index).toLowerCase();
            const afterMatch = allText.substring(match.index + match[0].length).toLowerCase();
            
            // Skip if it's part of an email address (has @ before or after)
            if (beforeMatch.includes('@') || afterMatch.trim().startsWith('@')) {
              console.log('Skipping date match that appears to be part of email:', match[1]);
              continue;
            }
            
            // If we find a date pattern that looks like a start date, use it
            const dateValue = match[1];
            const dateMatch = dateValue.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
            if (dateMatch) {
              const month = dateMatch[1].padStart(2, '0');
              const day = dateMatch[2].padStart(2, '0');
              const year = dateMatch[3].length === 2 ? `20${dateMatch[3]}` : dateMatch[3];
              const formattedDate = `${year}-${month}-${day}`;
              
              console.log('Parsed date:', dateValue, '->', formattedDate);
              
              // Validate the date is reasonable (not in the past too far, not too far in future)
              const parsedDate = new Date(formattedDate);
              if (parsedDate && !isNaN(parsedDate.getTime())) {
                const today = new Date();
                const fiveYearsAgo = new Date();
                fiveYearsAgo.setFullYear(today.getFullYear() - 5);
                const tenYearsFromNow = new Date();
                tenYearsFromNow.setFullYear(today.getFullYear() + 10);
                
                console.log('Date validation:', {
                  parsedDate: parsedDate.toISOString(),
                  fiveYearsAgo: fiveYearsAgo.toISOString(),
                  tenYearsFromNow: tenYearsFromNow.toISOString(),
                  isValid: parsedDate >= fiveYearsAgo && parsedDate <= tenYearsFromNow
                });
                
                // Accept dates that are reasonable (within 5 years ago to 10 years from now)
                // Also accept dates that are clearly in the future (start dates are typically future dates)
                if (parsedDate >= fiveYearsAgo && parsedDate <= tenYearsFromNow) {
                  console.log('Setting start_date to:', formattedDate);
                  updates.role!.start_date = formattedDate;
                  break; // Use the first valid date we find
                } else {
                  console.log('Date outside valid range, skipping');
                }
              } else {
                console.log('Invalid date format, skipping');
              }
            }
          }
        }
      }
    }
    
    return updates;
  };

  // Track if initial messages have been set to prevent duplicates
  const hasInitializedMessages = useRef(false);

  // Initialize messages with user input if provided
  useEffect(() => {
    const inputText = state?.userInput || userInput;
    if (inputText && inputText.trim() && !hasInitializedMessages.current) {
      hasInitializedMessages.current = true;
      setUserInput(inputText.trim());
      
      // Check if this is referencing Sarah Jones - seed her data (except personal info and start date)
      const isSarahJonesReference = inputText.toLowerCase().includes('@sarah jones') || 
                                     inputText.toLowerCase().includes('sarah jones');
      
      // Parse fields from initial input and update formData
      const initialMessages = [{ role: 'user' as const, content: inputText.trim() }];
      const updates = parseFieldsFromMessages(initialMessages, formData);
      console.log('Initial input parsing:', inputText, 'Updates:', updates);
      
      setFormData((prev) => {
        const updated = { ...prev };
        
        // If referencing Sarah Jones, seed her data first (excluding first_name, last_name, invite_email, start_date)
        if (isSarahJonesReference && SARAH_JONES_SEED_DATA) {
          console.log('Seeding Sarah Jones data');
          // Apply work data
          if (SARAH_JONES_SEED_DATA.work) {
            updated.work = { ...updated.work, ...SARAH_JONES_SEED_DATA.work };
          }
          // Apply role data (but NOT start_date - leave empty for new hire)
          if (SARAH_JONES_SEED_DATA.role) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { start_date: _startDate, ...roleWithoutStartDate } = SARAH_JONES_SEED_DATA.role;
            updated.role = { ...updated.role, ...roleWithoutStartDate };
          }
          // Apply comp data
          if (SARAH_JONES_SEED_DATA.comp) {
            updated.comp = { ...updated.comp, ...SARAH_JONES_SEED_DATA.comp };
          }
        }
        
        // Then apply any parsed updates from the message (for name, email, date if provided)
        if (updates.personal) {
          // Only update fields that have values
          if (updates.personal.first_name) updated.personal.first_name = updates.personal.first_name;
          if (updates.personal.last_name) updated.personal.last_name = updates.personal.last_name;
          if (updates.personal.invite_email) updated.personal.invite_email = updates.personal.invite_email;
          if (updates.personal.personal_email) updated.personal.personal_email = updates.personal.personal_email;
        }
        if (updates.role) {
          if (updates.role.start_date) updated.role.start_date = updates.role.start_date;
          Object.keys(updates.role).forEach(key => {
            if (updates.role![key as keyof typeof updates.role]) {
              (updated.role as Record<string, unknown>)[key] = (updates.role as Record<string, unknown>)[key];
            }
          });
        }
        
        console.log('Initial form data updated:', updated);
        return updated;
      });
      
      // Check if this is a copied employee flow
      // Check for @employee pattern (old) or @[firstname] [lastname] pattern (new - after strong type selection)
      const isCopied = inputText.toLowerCase().includes('@employee') || /@[a-z]+\s+[a-z]+/.test(inputText.toLowerCase());
      let initialMissingFields: string[];
      let followUpMessage: string;
      
      if (isCopied) {
        // For copied employee, only check the specific fields that shouldn't be copied
        initialMissingFields = getMissingCopiedEmployeeFields;
        followUpMessage = generateCopiedEmployeeFollowUpMessage(initialMissingFields);
      } else {
        // For regular flow, check all required fields
        initialMissingFields = getMissingRequiredFields;
        followUpMessage = generateFollowUpMessage(initialMissingFields);
      }
      
      setMessages([
        {
          role: 'user',
          content: inputText.trim()
        },
        {
          role: 'assistant',
          content: followUpMessage
        }
      ]);
    }
  }, [state?.userInput]);

  // Check if all required fields are complete
  const allFieldsComplete = useMemo(() => {
    // Always require start_date to be present before enabling review mode
    if (!hasValue(formData.role.start_date)) {
      return false;
    }
    if (isCopiedFromEmployee) {
      return getMissingCopiedEmployeeFields.length === 0;
    }
    return getMissingRequiredFields.length === 0;
  }, [getMissingRequiredFields, getMissingCopiedEmployeeFields, isCopiedFromEmployee, formData.role.start_date]);

  // Switch to review mode when all fields are complete
  useEffect(() => {
    // Only show review mode (summary page) when ALL required fields are complete
    // If any required field is missing, we should NOT show the summary page
    if (allFieldsComplete) {
      // Enter review mode if not already in it
      if (!isReviewMode) {
        setIsTransitioning(true);
        // Start fade out, then switch mode, then fade in
        setTimeout(() => {
          setIsReviewMode(true);
          // Small delay before starting fade in
          setTimeout(() => {
            setIsTransitioning(false);
          }, 50);
        }, 200);
      }
      
      // Update the last assistant message to show completion message
      setMessages(prev => {
        // Check if the last message is already the review message to avoid duplicates
        const lastMessage = prev.length > 0 ? prev[prev.length - 1] : null;
        const reviewMessage = 'Please review hire information and submit on left panel when you are ready';
        
        if (lastMessage && lastMessage.role === 'assistant' && lastMessage.content === reviewMessage) {
          // Already has the review message, don't add another
          return prev;
        }
        
        if (lastMessage && lastMessage.role === 'assistant') {
          // Replace the last assistant message
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = {
            role: 'assistant',
            content: reviewMessage
          };
          return newMessages;
        } else {
          // Add completion message if no assistant message exists
          return [...prev, {
            role: 'assistant',
            content: reviewMessage
          }];
        }
      });
    } else {
      // Exit review mode immediately if fields are incomplete - don't show summary page
      if (isReviewMode) {
        setIsTransitioning(true);
        // Start fade out, then switch mode, then fade in
        setTimeout(() => {
          setIsReviewMode(false);
          // Small delay before starting fade in
          setTimeout(() => {
            setIsTransitioning(false);
          }, 50);
        }, 200);
      }
    }
  }, [allFieldsComplete, isReviewMode, formData.role.start_date]);

  // Update messages when formData changes to ask for missing fields
  useEffect(() => {
    // Don't update messages if we're in review mode or if all fields are complete
    // (the review mode effect handles the completion message)
    // Also don't update if messages haven't been initialized yet
    // Also don't update if an API call is in progress (to avoid duplicate messages)
    if (isReviewMode || allFieldsComplete || !hasInitializedMessages.current || isLoading) return;
    
    if (messages.length > 0 && messages[messages.length - 1].role === 'assistant') {
      let missingFields: string[];
      let followUpMessage: string;
      
      if (isCopiedFromEmployee) {
        // For copied employee, only check the specific fields that shouldn't be copied
        missingFields = getMissingCopiedEmployeeFields;
        followUpMessage = generateCopiedEmployeeFollowUpMessage(missingFields);
      } else {
        // For regular flow, check all required fields
        missingFields = getMissingRequiredFields;
        followUpMessage = generateFollowUpMessage(missingFields);
      }
      
      // Only update if the message has changed
      if (messages[messages.length - 1].content !== followUpMessage) {
        setMessages(prev => {
          // Double-check inside callback that last message is still an assistant message
          if (prev.length === 0 || prev[prev.length - 1].role !== 'assistant') {
            return prev;
          }
          // Also check if content already matches to avoid unnecessary updates
          if (prev[prev.length - 1].content === followUpMessage) {
            return prev;
          }
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = {
            role: 'assistant',
            content: followUpMessage
          };
          return newMessages;
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData, getMissingRequiredFields, getMissingCopiedEmployeeFields, isCopiedFromEmployee, isReviewMode, isLoading, messages.length]);

  // Extract and update form data from chat messages
  useEffect(() => {
    if (messages.length > 0) {
      const updates = parseFieldsFromMessages(messages, formData);
      console.log('Form data updates from messages:', updates);
      if (Object.keys(updates.personal || {}).length > 0 || Object.keys(updates.role || {}).length > 0) {
        setFormData((prev) => {
          const updated = { ...prev };
          if (updates.personal) {
            // Only update fields that have values
            if (updates.personal.first_name) updated.personal.first_name = updates.personal.first_name;
            if (updates.personal.last_name) updated.personal.last_name = updates.personal.last_name;
            if (updates.personal.invite_email) updated.personal.invite_email = updates.personal.invite_email;
            if (updates.personal.personal_email) updated.personal.personal_email = updates.personal.personal_email;
          }
          if (updates.role) {
            if (updates.role.start_date) updated.role.start_date = updates.role.start_date;
            // Update other role fields if needed
            Object.keys(updates.role).forEach(key => {
              if (updates.role![key as keyof typeof updates.role]) {
                (updated.role as any)[key] = (updates.role as any)[key];
              }
            });
          }
          console.log('Updated form data:', updated);
          return updated;
        });
      }
    }
    // parseFieldsFromMessages is defined in the component, so we don't need it in deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, formData]);

  // Handle sending chat messages
  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    
    // Add user message to chat
    const newUserMessage = { role: 'user' as const, content: userMessage };
    setMessages(prev => [...prev, newUserMessage]);
    
    // Immediately try to parse name from the new message if formData doesn't have names yet
    if (!formData.personal.first_name || !formData.personal.last_name) {
      const nameUpdates = parseFieldsFromMessages([newUserMessage], formData);
      console.log('Parsing name from message:', userMessage, 'Updates:', nameUpdates);
      if (nameUpdates.personal?.first_name && nameUpdates.personal?.last_name) {
        console.log('Setting name:', nameUpdates.personal.first_name, nameUpdates.personal.last_name);
        setFormData((prev) => ({
          ...prev,
          personal: {
            ...prev.personal,
            first_name: nameUpdates.personal!.first_name!,
            last_name: nameUpdates.personal!.last_name!
          }
        }));
      }
    }
    
    setIsLoading(true);

    try {
      // Prepare messages for OpenAI (include system prompt)
      const missingFields = isCopiedFromEmployee 
        ? getMissingCopiedEmployeeFields 
        : getMissingRequiredFields;
      
      const systemPrompt = createHiringSystemPrompt(missingFields);
      
      const openAIMessages: ChatMessage[] = [
        { role: 'system', content: systemPrompt },
        ...messages.map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: userMessage }
      ];

      // Call OpenAI API
      const response = await sendChatMessage(openAIMessages);
      
      // Add assistant response
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to send message. Please check your OpenAI API key.';
      
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `Sorry, I encountered an error: ${errorMessage}` 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Enter key press (Shift+Enter for new line, Enter to send)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Listen for form data updates from chat
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data || typeof data !== 'object') return;
      if (data.type !== 'hiring.chat.patch') return;

      try {
        setFormData((prev) => {
          const merged = deepMerge(prev, data.payload || {});
          // Ensure copied information is displayed on left side by triggering re-render
          return merged;
        });
      } catch (e) {
        console.error('Failed to merge chat patch', e);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Deep merge helper
  const deepMerge = (target: any, source: any): any => {
    const output = { ...target };
    if (isObject(target) && isObject(source)) {
      Object.keys(source).forEach(key => {
        if (isObject(source[key])) {
          if (!(key in target)) {
            Object.assign(output, { [key]: source[key] });
          } else {
            output[key] = deepMerge(target[key], source[key]);
          }
        } else {
          Object.assign(output, { [key]: source[key] });
        }
      });
    }
    return output;
  };

  const isObject = (item: any): boolean => {
    return item && typeof item === 'object' && !Array.isArray(item);
  };

  // Format text with mentions (highlight @mentions)
  const formatTextWithMentions = (text: string) => {
    if (!text) return '';
    const escapeHtml = (str: string) => {
      const div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    };
    
    // Match @mentions - be more precise to avoid matching standalone names
    // Only match known mention patterns:
    // - @employee [firstname] [lastname] (exactly 2 names after @employee)
    // - @job template [template name] (template name after @job template)
    // Stop matching after the mention pattern, don't continue to match additional words
    
    // First, escape the entire text
    const escapedText = escapeHtml(text);
    
    // Match @job template mentions (can have multiple words for template name)
    const jobTemplatePattern = /(@job\s+template\s+[a-z\s]+?)(?=\s+[A-Z]|\s*$|[^a-z\s])/gi;
    let result = escapedText.replace(jobTemplatePattern, (match) => {
      return `<span style="color: #7a005d;">${match}</span>`;
    });
    
    // Match @employee mentions (exactly 2 names after @employee) OR @[name] mentions (after strong type selection)
    // Pattern: @employee [firstname] [lastname] OR @[firstname] [lastname] - stop after 2 names
    const employeePattern = /(@employee\s+[a-z]+\s+[a-z]+|@[a-z]+\s+[a-z]+)(?=\s+[A-Z]|\s*$|[^a-z\s])/gi;
    result = result.replace(employeePattern, (match) => {
      return `<span style="color: #7a005d;">${match}</span>`;
    });
    
    return result;
  };

  // Debug: Log when component renders
  useEffect(() => {
    console.log('ComposerView rendered', { formData, messages: messages.length });
  }, []);

  // Handle entrance animation
  useEffect(() => {
    // Trigger animation after a brief delay to ensure DOM is ready
    const timer = setTimeout(() => {
      setIsAnimating(false);
      setIsEntering(false);
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  // Format date for display
  const formatDate = (dateString: string): string => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
    } catch {
      return dateString;
    }
  };

  // Handle clicking on "Input required" badge
  const handleInputRequiredClick = (fieldPath: string, currentValue?: string) => {
    setEditingField(fieldPath);
    setEditingValue(currentValue || '');
  };

  // Check if AI response indicates invalid input
  const isInvalidResponse = (response: string, fieldLabel: string): boolean => {
    const lowerResponse = response.toLowerCase();
    const lowerField = fieldLabel.toLowerCase();
    
    // Check for error indicators
    const errorPatterns = [
      'incomplete',
      'invalid',
      'could you please',
      'please provide',
      'please enter',
      'seems to be',
      'looks like',
      'appears to be',
      'not a valid',
      'not valid',
      'error',
      'incorrect',
      'wrong format',
      'missing',
      'unable to',
      'cannot'
    ];
    
    // Check if response contains error patterns and mentions the field
    const hasErrorPattern = errorPatterns.some(pattern => lowerResponse.includes(pattern));
    const mentionsField = lowerResponse.includes(lowerField) || 
                         lowerResponse.includes('email') && lowerField.includes('email') ||
                         lowerResponse.includes('date') && lowerField.includes('date');
    
    return hasErrorPattern && mentionsField;
  };

  // Handle saving the edited value
  const handleSaveField = async (fieldPath: string, label?: string) => {
    if (!editingValue.trim()) {
      setEditingField(null);
      return;
    }

    const value = editingValue.trim();

    // Store previous formData value to revert if needed
    const keys = fieldPath.split('.');
    const getCurrentValue = (data: HiringSessionData) => {
      let current: any = data;
      for (const key of keys) {
        if (current && typeof current === 'object' && key in current) {
          current = current[key];
        } else {
          return undefined;
        }
      }
      return current;
    };
    const previousValue = getCurrentValue(formData);

    // Add user message to chat with field name
    let chatMessage = '';
    if (label) {
      chatMessage = `${label}: ${value}`;
      const newUserMessage = { role: 'user' as const, content: chatMessage };
      setMessages(prev => [...prev, newUserMessage]);
    }

    // Temporarily save the value
    setFormData((prev) => {
      const updated = { ...prev };
      let current: any = updated;
      
      // Navigate to the nested property
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }
      
      // Set the value
      current[keys[keys.length - 1]] = value;
      return updated;
    });

    setEditingField(null);
    setEditingValue('');

    // Trigger AI response if we added a chat message
    if (chatMessage && !isLoading && label) {
      setIsLoading(true);
      
      // Use setTimeout to ensure state update is processed before making AI call
      setTimeout(async () => {
        try {
          // Prepare messages for OpenAI (include system prompt)
          const missingFields = isCopiedFromEmployee 
            ? getMissingCopiedEmployeeFields 
            : getMissingRequiredFields;
          
          const systemPrompt = createHiringSystemPrompt(missingFields);
          
          // Get current messages (will include the one we just added)
          setMessages(currentMessages => {
            const openAIMessages: ChatMessage[] = [
              { role: 'system', content: systemPrompt },
              ...currentMessages.map(m => ({ role: m.role, content: m.content })),
              { role: 'user', content: chatMessage }
            ];

            // Call OpenAI API asynchronously
            sendChatMessage(openAIMessages).then(response => {
              setMessages(prev => [...prev, { role: 'assistant', content: response }]);
              
              // Check if response indicates invalid input
              if (isInvalidResponse(response, label)) {
                // Revert the formData change - set back to previous value or empty
                setFormData((prev) => {
                  const updated = { ...prev };
                  let current: any = updated;
                  
                  // Navigate to the nested property
                  for (let i = 0; i < keys.length - 1; i++) {
                    if (!current[keys[i]]) {
                      current[keys[i]] = {};
                    }
                    current = current[keys[i]];
                  }
                  
                  // Revert to previous value (or empty if it was empty)
                  current[keys[keys.length - 1]] = previousValue !== undefined ? previousValue : '';
                  return updated;
                });
              }
              
              setIsLoading(false);
            }).catch(error => {
              console.error('Error sending message:', error);
              const errorMessage = error instanceof Error 
                ? error.message 
                : 'Failed to send message. Please check your OpenAI API key.';
              
              setMessages(prev => [...prev, { 
                role: 'assistant', 
                content: `Sorry, I encountered an error: ${errorMessage}` 
              }]);
              setIsLoading(false);
            });

            return currentMessages;
          });
        } catch (error) {
          console.error('Error preparing message:', error);
          setIsLoading(false);
        }
      }, 0);
    }
  };

  // Handle canceling the edit
  const handleCancelEdit = () => {
    setEditingField(null);
    setEditingValue('');
  };




  // Review Section Component
  const ReviewSection = ({ title, children, onEdit, isComplete = true }: { title: string; children: React.ReactNode; onEdit?: () => void; isComplete?: boolean }) => (
    <div className="bg-white border border-[#d3d3d3] rounded-lg p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between pb-6 border-b border-[#e0dede]">
        <h2 className="font-medium text-[18px] leading-[22px] text-black">{title}</h2>
        <div className="flex gap-3 items-center">
          {isComplete && (
            <div className="bg-[#baf3f0] px-2 py-1.5 rounded-full">
              <p className="font-medium text-[13px] leading-[16px] text-[#00403d] tracking-[0.25px]">Complete</p>
            </div>
          )}
          {onEdit && (
            <Button appearance="outline" size="sm" onClick={onEdit}>
              Edit
            </Button>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-4">
        {children}
      </div>
    </div>
  );

  // Review Field Component
  const ReviewField = ({ label, value }: { label: string; value: string | undefined }) => (
    <div className="flex gap-4 items-start">
      <div className="flex-1 max-w-[300px]">
        <p className="font-medium text-[15px] leading-[22px] text-[#595555] tracking-[0.25px]">{label}</p>
      </div>
      <p className="flex-1 font-normal text-[15px] leading-[22px] text-black tracking-[0.5px]">
        {value || '—'}
      </p>
    </div>
  );

  // Input Required Badge Component
  const InputRequiredBadge = ({ fieldPath, label }: { fieldPath: string; label: string }) => {
    const isEditing = editingField === fieldPath;
    const buttonRef = useRef<HTMLButtonElement>(null);
    const popoverRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Focus input when editing starts
    useEffect(() => {
      if (isEditing && inputRef.current) {
        // Small delay to ensure popover is rendered
        setTimeout(() => {
          inputRef.current?.focus();
        }, 0);
      }
    }, [isEditing]);

    // Handle click outside to close
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          isEditing &&
          popoverRef.current &&
          !popoverRef.current.contains(event.target as Node) &&
          buttonRef.current &&
          !buttonRef.current.contains(event.target as Node)
        ) {
          if (editingValue.trim()) {
            handleSaveField(fieldPath, label);
          } else {
            handleCancelEdit();
          }
        }
      };

      if (isEditing) {
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
          document.removeEventListener('mousedown', handleClickOutside);
        };
      }
    }, [isEditing, editingValue, fieldPath, label]);

    return (
      <div className="flex-1 flex items-center gap-1 relative">
        <button
          ref={buttonRef}
          onClick={() => handleInputRequiredClick(fieldPath)}
          className={`flex items-center gap-1 p-[0.1rem] rounded-lg transition-colors cursor-pointer border-0 outline-none ${isEditing ? 'bg-[#E6F2FF]' : 'hover:bg-[#E6F2FF]'}`}
        >
          <div className="w-4 h-4 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="#1e4aa9" strokeWidth="2"/>
              <path d="M12 7V13M12 16H12.01" stroke="#1e4aa9" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <p className="font-medium text-[15px] leading-[22px] text-[#1e4aa9] tracking-[0.5px] underline">
            Input required
          </p>
        </button>
        
        {isEditing && (
          <div
            ref={popoverRef}
            className="absolute left-0 top-full mt-2 z-50 bg-white border border-[#bfbebe] rounded-lg shadow-lg flex items-center gap-2 p-1"
          >
            <input
              ref={inputRef}
              type="text"
              value={editingValue}
              onChange={(e) => setEditingValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSaveField(fieldPath, label);
                } else if (e.key === 'Escape') {
                  e.preventDefault();
                  handleCancelEdit();
                }
              }}
              className="flex-1 bg-white border-0 rounded-lg h-10 px-4 py-[9px] font-normal text-[15px] leading-[22px] text-black tracking-[0.5px] outline-none focus:outline-none min-w-[200px]"
              placeholder={`Add ${label.toLowerCase()}`}
            />
            <button
              onClick={() => handleSaveField(fieldPath, label)}
              disabled={!editingValue.trim()}
              className="bg-[#7A005D] rounded-md w-10 h-10 flex items-center justify-center hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            >
              <img src={icons.ArrowUp} alt="Send" className="w-4 h-4" style={{ filter: 'brightness(0) invert(1)' }} />
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Header */}
      <div 
        className="bg-white border-b border-[rgba(0,0,0,0.1)] h-14 flex items-center justify-between px-4 fixed top-[82px] left-0 right-0 z-40 flex-shrink-0"
        style={{
          opacity: isEntering ? 0 : 1,
          transform: isEntering ? 'translateY(-10px)' : 'translateY(0)',
          transition: 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1), transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        <p className="font-medium text-[17px] leading-[24px] text-black tracking-[0.25px]">
          Review hire
        </p>
        <button 
          onClick={() => navigate('/start-hiring')}
          className="flex items-center gap-1 hover:opacity-70 transition-opacity"
        >
          <div className="w-6 h-6 flex items-center justify-center">
            <img
              alt="Save and exit icon"
              className="block w-6 h-6"
              src={icons.SaveAndExitOutline}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          </div>
          <p className="font-medium text-[17px] leading-[24px] text-black tracking-[0.25px]">
            Save and exit
          </p>
        </button>
      </div>

      {/* Main Content */}
      <div className="bg-[#fafafa] h-screen w-full flex flex-row flex-nowrap overflow-hidden">
        {/* Left Side - Preview Panel */}
        <div className="flex-1 min-w-0 overflow-y-auto bg-[#fafafa] mt-14 h-[calc(100vh-82px-56px)]">
          {/* Review Mode - Show review screen */}
          <div
            style={{
              position: isReviewMode && allFieldsComplete ? 'relative' : 'absolute',
              width: '100%',
              top: 0,
              opacity: isReviewMode && allFieldsComplete ? (isTransitioning ? 0 : 1) : 0,
              transform: isReviewMode && allFieldsComplete ? (isTransitioning ? 'translateY(10px)' : 'translateY(0)') : 'translateY(-10px)',
              transition: 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1), transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              pointerEvents: isReviewMode && allFieldsComplete && !isTransitioning ? 'auto' : 'none',
              zIndex: isReviewMode && allFieldsComplete ? 1 : 0
            }}
          >
            <div className="max-w-[640px] mx-auto pt-4 px-4 pb-16">
              <h1 className="font-medium text-[24px] leading-[32px] text-black mb-6">
                Review hire
              </h1>
                
                <div className="flex flex-col gap-6">
                  {/* Personal Information */}
                  <ReviewSection title="Personal information">
                    <ReviewField label="First name" value={formData.personal.first_name} />
                    <ReviewField label="Last name" value={formData.personal.last_name} />
                    {hasValue(formData.personal.invite_email) && (
                      <ReviewField label="Invite email" value={formData.personal.invite_email} />
                    )}
                  </ReviewSection>

                  {/* Work Location and Employment */}
                  {(hasValue(formData.work.work_location_id) || 
                    hasValue(formData.work.employment_type_id) || 
                    hasValue(formData.work.overtime_exemption)) && (
                    <ReviewSection title="Work location">
                      {hasValue(formData.work.work_location_id) && (
                        <ReviewField label="Work location" value={formData.work.work_location_id} />
                      )}
                      {hasValue(formData.work.employment_type_id) && (
                        <ReviewField label="Employment type" value={formData.work.employment_type_id} />
                      )}
                      {hasValue(formData.work.overtime_exemption) && (
                        <ReviewField label="Overtime eligibility" value={formData.work.overtime_exemption} />
                      )}
                    </ReviewSection>
                  )}

                  {/* Role Information - Always show in review mode, or if any role data exists */}
                  {(isReviewMode || 
                    hasValue(formData.role.start_date) || 
                    hasValue(formData.role.title) || 
                    hasValue(formData.role.level) ||
                    hasValue(formData.role.department_id) ||
                    hasValue(formData.role.team_id) ||
                    hasValue(formData.role.manager)) && (
                    <ReviewSection 
                      title="Role information"
                      isComplete={hasValue(formData.role.start_date)}
                    >
                      <ReviewField label="Start date" value={hasValue(formData.role.start_date) ? formatDate(formData.role.start_date) : undefined} />
                      {hasValue(formData.role.title) && (
                        <ReviewField label="Title" value={formData.role.title} />
                      )}
                      {hasValue(formData.role.level) && (
                        <ReviewField label="Level" value={formData.role.level} />
                      )}
                      {hasValue(formData.role.department_id) && (
                        <ReviewField label="Department" value={formData.role.department_id} />
                      )}
                      {hasValue(formData.role.team_id) && (
                        <ReviewField label="Teams" value={formData.role.team_id} />
                      )}
                      {hasValue(formData.role.manager) && (
                        <ReviewField label="Manager" value={formData.role.manager} />
                      )}
                    </ReviewSection>
                  )}

                  {/* Compensation */}
                  {(hasValue(formData.comp.amount) || hasValue(formData.comp.frequency)) && (
                    <ReviewSection title="Compensation">
                      <ReviewField 
                        label="Compensation type" 
                        value="Base salary"
                      />
                      {hasValue(formData.comp.amount) && (
                        <ReviewField 
                          label="Base salary" 
                          value={`${formData.comp.currency && formData.comp.currency === 'USD' ? '$' : ''}${formData.comp.amount?.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`}
                        />
                      )}
                      {hasValue(formData.comp.frequency) && (
                        <ReviewField label="Per" value={formData.comp.frequency} />
                      )}
                    </ReviewSection>
                  )}
                </div>
            </div>
          </div>
          
          {/* Collection Mode - Show collection UI */}
          <div
            style={{
              position: !isReviewMode || !allFieldsComplete ? 'relative' : 'absolute',
              width: '100%',
              top: 0,
              opacity: !isReviewMode || !allFieldsComplete ? (isTransitioning ? 0 : 1) : 0,
              transform: !isReviewMode || !allFieldsComplete ? (isTransitioning ? 'translateY(-10px)' : 'translateY(0)') : 'translateY(10px)',
              transition: 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1), transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              pointerEvents: (!isReviewMode || !allFieldsComplete) && !isTransitioning ? 'auto' : 'none',
              zIndex: !isReviewMode || !allFieldsComplete ? 1 : 0
            }}
          >
            {/* Alert Banner - Full width with 40px margins */}
            <div 
              className="mx-[40px] mt-4 mb-4"
            >
                <div className="bg-[#E0D0F5] border border-[rgba(0,0,0,0.1)] p-3 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="bg-white border border-[rgba(0,0,0,0.2)] rounded-lg p-2.5 flex items-center justify-center">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M7 9.96997C7.552 9.96997 8 9.52197 8 8.96997C8 8.41797 7.552 7.96997 7 7.96997C6.448 7.96997 6 8.41797 6 8.96997C6 9.52197 6.448 9.96997 7 9.96997Z" fill="#B64195"/>
                        <path d="M13 8.96997C13 9.52197 12.552 9.96997 12 9.96997C11.448 9.96997 11 9.52197 11 8.96997C11 8.41797 11.448 7.96997 12 7.96997C12.552 7.96997 13 8.41797 13 8.96997Z" fill="#B64195"/>
                        <path d="M17 9.96997C17.552 9.96997 18 9.52197 18 8.96997C18 8.41797 17.552 7.96997 17 7.96997C16.448 7.96997 16 8.41797 16 8.96997C16 9.52197 16.448 9.96997 17 9.96997Z" fill="#B64195"/>
                        <path d="M22.75 1.21997H1.25V16.72H8.75V22.781L14.811 16.72H22.75V1.21997ZM2.75 15.22V2.71997H21.25V15.22H14.189L10.25 19.159V15.22H2.75Z" fill="#B64195"/>
                      </svg>
                    </div>
                    <div className="flex flex-col gap-1">
                      <p className="font-medium text-[16px] leading-[22px] text-[#382600]">
                        Draft hire not ready yet
                      </p>
                      <p className="font-normal text-[16px] leading-[24px] text-black">
                        Add required information in chat
                      </p>
                    </div>
                  </div>
                  <button className="bg-white border border-[rgba(0,0,0,0.2)] rounded-lg px-3 py-1.5 flex items-center gap-2 hover:bg-gray-50 transition-colors">
                    <span className="font-medium text-[16px] leading-[22px] text-black">Edit details manually</span>
                  </button>
                </div>
              </div>
              
              <div className="max-w-[620px] mx-auto pt-2 px-8">
                <h1 className="font-medium text-[22px] leading-[26px] text-black mb-4 text-center">
                  Information we've collected so far
                </h1>
            
            <div className="flex flex-col gap-[40px] pb-8">
            {/* Personal Information - Always show required fields */}
            <div className="bg-white border border-[#d3d3d3] rounded-lg p-6">
                <div className="border-b border-[#e0dede] pb-6 mb-6">
                  <h2 className="font-medium text-[18px] leading-[22px] text-black">
                    Personal information
                  </h2>
                </div>
                <div className="flex flex-col gap-4">
                  {hasValue(formData.personal.first_name) ? (
                    <div className="flex gap-4 items-center">
                      <div className="flex-1 max-w-[300px]">
                        <p className="font-medium text-[15px] leading-[22px] text-[#595555] tracking-[0.25px]">
                          First name
                        </p>
                      </div>
                      <p className="flex-1 font-normal text-[15px] leading-[22px] text-black tracking-[0.5px]">
                        {formData.personal.first_name}
                      </p>
                    </div>
                  ) : (
                    <div className="flex gap-4 items-center">
                      <div className="flex-1 max-w-[300px]">
                        <p className="font-medium text-[15px] leading-[22px] text-[#595555] tracking-[0.25px]">
                          First name
                        </p>
                      </div>
                      <InputRequiredBadge fieldPath="personal.first_name" label="First name" />
                    </div>
                  )}
                  {hasValue(formData.personal.last_name) ? (
                    <div className="flex gap-4 items-center">
                      <div className="flex-1 max-w-[300px]">
                        <p className="font-medium text-[15px] leading-[22px] text-[#595555] tracking-[0.25px]">
                          Last name
                        </p>
                      </div>
                      <p className="flex-1 font-normal text-[15px] leading-[22px] text-black tracking-[0.5px]">
                        {formData.personal.last_name}
                      </p>
                    </div>
                  ) : (
                    <div className="flex gap-4 items-center">
                      <div className="flex-1 max-w-[300px]">
                        <p className="font-medium text-[15px] leading-[22px] text-[#595555] tracking-[0.25px]">
                          Last name
                        </p>
                      </div>
                      <InputRequiredBadge fieldPath="personal.last_name" label="Last name" />
                    </div>
                  )}
                  {hasValue(formData.personal.invite_email) ? (
                    <div className="flex gap-4 items-center">
                      <div className="flex-1 max-w-[300px]">
                        <p className="font-medium text-[15px] leading-[22px] text-[#595555] tracking-[0.25px]">
                          Invite email
                        </p>
                      </div>
                      <p className="flex-1 font-normal text-[15px] leading-[22px] text-black tracking-[0.5px]">
                        {formData.personal.invite_email}
                      </p>
                    </div>
                  ) : (
                    <div className="flex gap-4 items-center">
                      <div className="flex-1 max-w-[300px]">
                        <p className="font-medium text-[15px] leading-[22px] text-[#595555] tracking-[0.25px]">
                          Invite email
                        </p>
                      </div>
                      <InputRequiredBadge fieldPath="personal.invite_email" label="Invite email" />
                    </div>
                  )}
                </div>
              </div>

            {/* Work Location and Employment */}
            {(hasValue(formData.work.employment_classification) || 
              hasValue(formData.work.work_location_id) || 
              hasValue(formData.work.employment_type_id) || 
              hasValue(formData.work.overtime_exemption)) && (
              <div className="bg-white border border-[#d3d3d3] rounded-lg p-6">
                <div className="border-b border-[#e0dede] pb-6 mb-6">
                  <h2 className="font-medium text-[18px] leading-[22px] text-black">
                    Work location and employment
                  </h2>
                </div>
                <div className="flex flex-col gap-4">
                  {hasValue(formData.work.work_location_id) && (
                    <div className="flex gap-4 items-center">
                      <div className="flex-1 max-w-[300px]">
                        <p className="font-medium text-[15px] leading-[22px] text-[#595555] tracking-[0.25px]">
                          Work location
                        </p>
                      </div>
                      <p className="flex-1 font-normal text-[15px] leading-[22px] text-black tracking-[0.5px]">
                        {formData.work.work_location_id}
                      </p>
                    </div>
                  )}
                  {hasValue(formData.work.employment_type_id) && (
                    <div className="flex gap-4 items-center">
                      <div className="flex-1 max-w-[300px]">
                        <p className="font-medium text-[15px] leading-[22px] text-[#595555] tracking-[0.25px]">
                          Employment type
                        </p>
                      </div>
                      <p className="flex-1 font-normal text-[15px] leading-[22px] text-black tracking-[0.5px]">
                        {formData.work.employment_type_id}
                      </p>
                    </div>
                  )}
                  {hasValue(formData.work.overtime_exemption) && (
                    <div className="flex gap-4 items-center">
                      <div className="flex-1 max-w-[300px]">
                        <p className="font-medium text-[15px] leading-[22px] text-[#595555] tracking-[0.25px]">
                          Overtime eligibility
                        </p>
                      </div>
                      <p className="flex-1 font-normal text-[15px] leading-[22px] text-black tracking-[0.5px]">
                        {formData.work.overtime_exemption}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Role Information - Always show if copied from employee or has any role data */}
            {(isCopiedFromEmployee || 
              hasValue(formData.role.start_date) || 
              hasValue(formData.role.department_id) || 
              hasValue(formData.role.team_id) || 
              hasValue(formData.role.title) ||
              hasValue(formData.role.manager)) && (
              <div className="bg-white border border-[#d3d3d3] rounded-lg p-6">
                <div className="border-b border-[#e0dede] pb-6 mb-6">
                  <h2 className="font-medium text-[18px] leading-[22px] text-black">
                    Role information
                  </h2>
                </div>
                <div className="flex flex-col gap-4">
                  {/* Always show Start date - required field */}
                  {hasValue(formData.role.start_date) ? (
                    <div className="flex gap-4 items-center">
                      <div className="flex-1 max-w-[300px]">
                        <p className="font-medium text-[15px] leading-[22px] text-[#595555] tracking-[0.25px]">
                          Start date
                        </p>
                      </div>
                      <p className="flex-1 font-normal text-[15px] leading-[22px] text-black tracking-[0.5px]">
                        {formData.role.start_date}
                      </p>
                    </div>
                  ) : (
                    <div className="flex gap-4 items-center">
                      <div className="flex-1 max-w-[300px]">
                        <p className="font-medium text-[15px] leading-[22px] text-[#595555] tracking-[0.25px]">
                          Start date
                        </p>
                      </div>
                      <InputRequiredBadge fieldPath="role.start_date" label="Start date" />
                    </div>
                  )}
                  {hasValue(formData.role.department_id) && (
                    <div className="flex gap-4 items-center">
                      <div className="flex-1 max-w-[300px]">
                        <p className="font-medium text-[15px] leading-[22px] text-[#595555] tracking-[0.25px]">
                          Department
                        </p>
                      </div>
                      <p className="flex-1 font-normal text-[15px] leading-[22px] text-black tracking-[0.5px]">
                        {formData.role.department_id}
                      </p>
                    </div>
                  )}
                  {hasValue(formData.role.manager) && (
                    <div className="flex gap-4 items-center">
                      <div className="flex-1 max-w-[300px]">
                        <p className="font-medium text-[15px] leading-[22px] text-[#595555] tracking-[0.25px]">
                          Manager
                        </p>
                      </div>
                      <p className="flex-1 font-normal text-[15px] leading-[22px] text-black tracking-[0.5px]">
                        {formData.role.manager}
                      </p>
                    </div>
                  )}
                  {hasValue(formData.role.team_id) && (
                    <div className="flex gap-4 items-center">
                      <div className="flex-1 max-w-[300px]">
                        <p className="font-medium text-[15px] leading-[22px] text-[#595555] tracking-[0.25px]">
                          Teams
                        </p>
                      </div>
                      <p className="flex-1 font-normal text-[15px] leading-[22px] text-black tracking-[0.5px]">
                        {formData.role.team_id}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Compensation - Always show if copied from employee or has any comp data */}
            {(isCopiedFromEmployee || hasValue(formData.comp.amount) || hasValue(formData.comp.frequency)) && (
              <div className="bg-white border border-[#d3d3d3] rounded-lg p-6">
                <div className="border-b border-[#e0dede] pb-6 mb-6">
                  <h2 className="font-medium text-[18px] leading-[22px] text-black">
                    Compensation
                  </h2>
                </div>
                <div className="flex flex-col gap-4">
                  {/* Always show Base salary */}
                  {hasValue(formData.comp.amount) ? (
                    <div className="flex gap-4 items-center">
                      <div className="flex-1 max-w-[300px]">
                        <p className="font-medium text-[15px] leading-[22px] text-[#595555] tracking-[0.25px]">
                          Base salary
                        </p>
                      </div>
                      <p className="flex-1 font-normal text-[15px] leading-[22px] text-black tracking-[0.5px]">
                        {formData.comp.currency && formData.comp.currency === 'USD' ? '$' : ''}{formData.comp.amount?.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      </p>
                    </div>
                  ) : (
                    <div className="flex gap-4 items-center">
                      <div className="flex-1 max-w-[300px]">
                        <p className="font-medium text-[15px] leading-[22px] text-[#595555] tracking-[0.25px]">
                          Base salary
                        </p>
                      </div>
                      <InputRequiredBadge fieldPath="comp.amount" label="Base salary" />
                    </div>
                  )}
                  {/* Always show Per if copied from employee or if frequency exists */}
                  {(isCopiedFromEmployee || hasValue(formData.comp.frequency)) && (
                    <div className="flex gap-4 items-center">
                      <div className="flex-1 max-w-[300px]">
                        <p className="font-medium text-[15px] leading-[22px] text-[#595555] tracking-[0.25px]">
                          Per
                        </p>
                      </div>
                      {hasValue(formData.comp.frequency) ? (
                        <p className="flex-1 font-normal text-[15px] leading-[22px] text-black tracking-[0.5px]">
                          {formData.comp.frequency}
                        </p>
                      ) : (
                        <p className="flex-1 font-normal text-[15px] leading-[22px] text-black tracking-[0.5px]">
                          {/* Empty if no frequency but still show the field */}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
            </div>
          </div>
          </div>

          {/* Footer - Full width of left panel */}
          {isReviewMode && allFieldsComplete && (
            <div 
              className="fixed bg-white bottom-0 left-0 border-t border-[#e0dede] px-4 py-3 flex items-center justify-end z-50" 
              style={{ 
                right: '448px',
                opacity: isTransitioning ? 0 : 1,
                transform: isTransitioning ? 'translateY(10px)' : 'translateY(0)',
                transition: 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1), transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              <button
                type="button"
                className="box-border flex gap-2 items-center justify-center overflow-clip h-10 px-4 py-0 relative rounded-lg shrink-0 transition-all duration-200 cursor-pointer bg-[#7A005D] hover:bg-[#9F1E7A] active:bg-[#7A005D]"
              >
                <p className="font-medium leading-[19px] relative shrink-0 text-[15px] text-white text-center tracking-[0.25px]">
                  Submit
                </p>
              </button>
            </div>
          )}
        </div>

        {/* Right Side - Chat Panel */}
        <div className="w-[448px] bg-white border-l border-[rgba(0,0,0,0.2)] flex flex-col flex-shrink-0 overflow-hidden mt-14 h-[calc(100vh-82px-56px)]">
        {/* Chat Header */}
        <div className="px-4 py-5 border-b border-[rgba(0,0,0,0.1)] flex-shrink-0">
          <h2 className="font-medium text-[16px] leading-[24px] text-black">
            Hire with AI
          </h2>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-6 min-h-0 overflow-x-hidden">
          {messages.length > 0 || userInput.trim() ? (
            messages.map((message, index) => (
              <div key={index} className="flex flex-col gap-6">
                {message.role === 'user' && (
                  <div className="flex gap-2 items-start">
                    <div className="w-6 h-6 rounded-full border border-[rgba(0,0,0,0.1)] flex-shrink-0 overflow-hidden">
                      <img 
                        src="/images/cat.png" 
                        alt="User" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    </div>
                    <div className="bg-[#f9f7f6] px-3 py-[9px] rounded-lg max-w-[368px]">
                      <p 
                        className="font-normal text-[14px] leading-[20px] text-black whitespace-pre-wrap"
                        dangerouslySetInnerHTML={{ __html: formatTextWithMentions(message.content) }}
                      />
                    </div>
                  </div>
                )}
                {message.role === 'assistant' && (
                  <div className="w-full">
                    <p className="font-normal text-[14px] leading-[17px] text-[#382600] whitespace-pre-wrap">
                      {message.content}
                    </p>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <p className="font-medium text-[20px] leading-[24px] text-black">
                  Hi Anne,
                </p>
                <p className="font-medium text-[16px] leading-[20px] text-[rgba(0,0,0,0.5)]">
                  What can we help you achieve today?
                </p>
              </div>
              
              {/* Action Cards */}
              <div className="flex gap-3 mt-2">
                {/* Upload a document */}
                <button className="flex-1 flex items-start gap-2 p-3 bg-white border border-[rgba(0,0,0,0.1)] rounded-lg hover:bg-[#fafafa] transition-colors">
                  <div className="w-7 h-7 rounded-full bg-[#FDF3FF] flex items-center justify-center flex-shrink-0">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="#CE71BB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M14 2V8H20" stroke="#CE71BB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M12 18V12" stroke="#CE71BB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M9 15L12 12L15 15" stroke="#CE71BB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div className="flex flex-col gap-0.5 text-left min-w-0">
                    <p className="font-medium text-[12px] leading-[16px] text-black">
                      Upload document
                    </p>
                    <p className="font-normal text-[12px] leading-[16px] text-black">
                      Let Rippling AI extract data from offer letter or CSV file
                    </p>
                  </div>
                </button>

                {/* Reference an existing employee */}
                <button 
                  onClick={() => {
                    const referenceText = 'Reference information from @Sarah Jones\n\n- New hire\'s name:\n- Email:\n- Start date:';
                    setInputValue(referenceText);
                    // Focus the textarea
                    if (chatInputRef.current) {
                      chatInputRef.current.focus();
                    }
                  }}
                  className="flex-1 flex items-start gap-2 p-3 bg-white border border-[rgba(0,0,0,0.1)] rounded-lg hover:bg-[#fafafa] transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-[#FDF3FF] flex items-center justify-center flex-shrink-0">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="#CE71BB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z" stroke="#CE71BB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13" stroke="#CE71BB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M16 3.13C16.8604 3.3503 17.623 3.8507 18.1676 4.5523C18.7122 5.2539 19.0078 6.1168 19.0078 7.005C19.0078 7.8932 18.7122 8.7561 18.1676 9.4577C17.623 10.1593 16.8604 10.6597 16 10.88" stroke="#CE71BB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div className="flex flex-col gap-0.5 text-left min-w-0">
                    <p className="font-medium text-[12px] leading-[16px] text-black">
                      Copy details from <span className="text-[#7A005D]">@Sarah Jones</span>
                    </p>
                    <p className="font-normal text-[12px] leading-[16px] text-black">
                      Start with existing employee details and adjust
                    </p>
                  </div>
                </button>

                {/* Hire using job template */}
                <button className="flex-1 flex items-start gap-2 p-3 bg-white border border-[rgba(0,0,0,0.1)] rounded-lg hover:bg-[#fafafa] transition-colors">
                  <div className="w-7 h-7 rounded-full bg-[#FDF3FF] flex items-center justify-center flex-shrink-0">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20 7H4C2.89543 7 2 7.89543 2 9V19C2 20.1046 2.89543 21 4 21H20C21.1046 21 22 20.1046 22 19V9C22 7.89543 21.1046 7 20 7Z" stroke="#CE71BB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M16 21V5C16 4.46957 15.7893 3.96086 15.4142 3.58579C15.0391 3.21071 14.5304 3 14 3H10C9.46957 3 8.96086 3.21071 8.58579 3.58579C8.21071 3.96086 8 4.46957 8 5V21" stroke="#CE71BB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div className="flex flex-col gap-0.5 text-left min-w-0">
                    <p className="font-medium text-[12px] leading-[16px] text-black">
                      Hire using <span className="text-[#7A005D]">@L5 Sales Rep job template</span>
                    </p>
                    <p className="font-normal text-[12px] leading-[16px] text-black">
                      Pre-fill with job template
                    </p>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Chat Input */}
        <div className="p-4 border-t border-[rgba(0,0,0,0.1)] bg-white flex-shrink-0">
          <div className="bg-white border border-[rgba(0,0,0,0.2)] rounded-lg p-3 flex flex-col gap-2">
            <textarea
              ref={chatInputRef}
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                // Auto-resize textarea
                const textarea = e.target as HTMLTextAreaElement;
                textarea.style.height = 'auto';
                textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
              }}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              className="flex-1 min-h-[20px] max-h-[120px] resize-none font-normal text-[14px] leading-[20px] text-black outline-none border-none bg-transparent"
              rows={1}
              disabled={isLoading}
            />
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <button 
                  className="w-6 h-6 border border-[rgba(0,0,0,0.2)] rounded-md flex items-center justify-center hover:bg-gray-50 disabled:opacity-50"
                  disabled={isLoading}
                >
                  <img src={icons.Upload} alt="Upload" className="w-4 h-4" />
                </button>
              </div>
              <button 
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
                className="bg-[#7A005D] rounded-md px-3 py-1.5 flex items-center justify-center hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <img src={icons.ArrowUp} alt="Send" className="w-4 h-4" style={{ filter: 'brightness(0) invert(1)' }} />
                )}
              </button>
            </div>
          </div>
        </div>
        </div>
      </div>
    </>
  );
}

