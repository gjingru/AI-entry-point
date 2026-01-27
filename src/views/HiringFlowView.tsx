import { useState, useEffect, useRef } from 'react';
import RadioButton, { useRadioGroup } from '../components/RadioButton';
import InputText from '../components/InputText';
import DatePicker from '../components/DatePicker';
import Button from '../components/Button';
import Select, { SelectOption } from '../components/Select';
import { parseAcceptedValuesCSV, ParsedCSV } from '../utils/csvParser';
import { icons } from '../utils/icons';

// Asset URLs from Figma (valid for 7 days)
const img5 = "https://www.figma.com/api/mcp/asset/c8f48695-2bd6-43f8-9fd3-ca727f90b6f3";
const img6 = "https://www.figma.com/api/mcp/asset/7202c76c-5ed9-43bc-b7bc-89bb153a72a0";

interface HiringFlowViewProps {
  onBack?: () => void;
  panelWidth?: number; // Width of the side panel when open (for responsive layout)
}

// Hiring Session Data Structure
interface HiringSessionData {
  personal: {
    first_name: string;
    last_name: string;
    personal_email?: string;
    invite_email?: string;
  };
  work: {
    employment_classification: string; // Employee, Contractor, EOR
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

type Step = 'hiring_type' | 'work' | 'role' | 'compensation' | 'country_specific' | 'review';

const STEP_TITLES: Record<Step, string> = {
  hiring_type: 'Hiring Type',
  work: 'Work & Employment Information',
  role: 'Role Information',
  compensation: 'Compensation Information',
  country_specific: 'Country-specific Information',
  review: 'Review'
};


export default function HiringFlowView({ onBack, panelWidth = 0 }: HiringFlowViewProps) {
  const [currentStep, setCurrentStep] = useState<Step>('hiring_type');
  const [csvData, setCsvData] = useState<ParsedCSV | null>(null);
  const [loading, setLoading] = useState(true);
  const autoAdvanceRef = useRef(false); // Prevent multiple auto-advances
  
  // Original hiring flow options
  const [hiringType, setHiringType] = useState<string>('individual');
  const [candidateType, setCandidateType] = useState<string>('new');
  
  // Form data state
  const [formData, setFormData] = useState<HiringSessionData>({
    personal: {
      first_name: '',
      last_name: '',
      personal_email: ''
    },
    work: {
      employment_classification: ''
    },
    role: {
      start_date: ''
    },
    comp: {}
  });

  // Radio groups
  const hiringTypeGroup = useRadioGroup('individual');
  const candidateTypeGroup = useRadioGroup('new');
  const employmentClassificationGroup = useRadioGroup('');

  // Load CSV data on mount
  useEffect(() => {
    const loadCSVData = async () => {
      try {
        const data = await parseAcceptedValuesCSV();
        setCsvData(data);
      } catch (error) {
        console.error('Failed to load CSV data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadCSVData();
  }, []);

  // Helper to get country label from stored value
  const getCountryLabel = (): string | undefined => {
    if (!formData.work.country || !csvData) return undefined;
    // If country is stored as label (for backward compatibility)
    const option = csvData.countries.find(opt => 
      opt.label === formData.work.country || opt.id === formData.work.country
    );
    return option?.label || formData.work.country;
  };

  // Check if country is India
  const isCountryIndia = (): boolean => {
    const countryLabel = getCountryLabel();
    return countryLabel === 'India';
  };

  // Calculate visible steps based on form data
  const getVisibleSteps = (): Step[] => {
    const steps: Step[] = ['hiring_type', 'work', 'role', 'compensation'];
    
    // Add country-specific step only if Employee/EOR and country is IN
    // Only check if csvData is loaded to avoid crashes
    if (
      csvData &&
      (formData.work.employment_classification === 'Employee' || 
       formData.work.employment_classification === 'EOR') &&
      isCountryIndia()
    ) {
      steps.push('country_specific');
    }
    
    steps.push('review');
    return steps;
  };

  // Get filtered employment types based on classification
  const getEmploymentTypeOptions = (): SelectOption[] => {
    if (!csvData || !csvData.employmentTypes) return [];
    
    const classification = formData.work.employment_classification;
    
    if (classification === 'Contractor') {
      // Contractor → 1099 contractor
      return csvData.employmentTypes
        .filter(opt => opt && opt.label && (opt.label.toLowerCase().includes('1099') || 
                      opt.label.toLowerCase().includes('contractor')))
        .map(opt => ({
          id: opt.id,
          label: opt.label
        }));
    } else if (classification === 'Employee' || classification === 'EOR') {
      // Employee/EOR → Salaried FT/PT, Hourly FT/PT
      return csvData.employmentTypes
        .filter(opt => {
          if (!opt || !opt.label) return false;
          const label = opt.label.toLowerCase();
          return (label.includes('salaried') || label.includes('hourly')) &&
                 (label.includes('full-time') || label.includes('part-time'));
        })
        .map(opt => ({
          id: opt.id,
          label: opt.label
        }));
    }
    
    return [];
  };

  // Calculate progress percentage
  const calculateProgress = (): number => {
    const visibleSteps = getVisibleSteps();
    const currentIndex = visibleSteps.indexOf(currentStep);
    return ((currentIndex + 1) / visibleSteps.length) * 100;
  };

  // Validation helpers
  const isPersonalStepValid = (): boolean => {
    return (
      formData.personal.first_name.trim() !== '' &&
      formData.personal.last_name.trim() !== ''
    );
  };

  const isWorkStepValid = (): boolean => {
    if (!formData.work.employment_classification) return false;
    
    // If Contractor, classification is enough
    if (formData.work.employment_classification === 'Contractor') {
      return true;
    }
    
    // If Employee/EOR, country is required but we'll allow proceeding without it for now
    // (you can add stricter validation if needed)
    return true;
  };

  const isRoleStepValid = (): boolean => {
    // Start date is required
    if (!formData.role.start_date || formData.role.start_date.trim() === '') {
      return false;
    }
    
    // Validate date format (ISO date)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    return dateRegex.test(formData.role.start_date);
  };

  const isCountrySpecificStepValid = (): boolean => {
    // Only required if country is IN
    if (isCountryIndia()) {
      return !!(
        formData.country_specific?.IN?.india_id_number &&
        formData.country_specific.IN.india_id_number.trim() !== ''
      );
    }
    return true;
  };

  const canProceedToNextStep = (): boolean => {
    switch (currentStep) {
      case 'hiring_type':
        return hiringTypeGroup.selectedValue !== '' && 
               candidateTypeGroup.selectedValue !== '' && 
               isPersonalStepValid();
      case 'work':
        return isWorkStepValid();
      case 'role':
        return isRoleStepValid();
      case 'compensation':
        return true; // Compensation is optional
      case 'country_specific':
        return isCountrySpecificStepValid();
      case 'review':
        return true;
      default:
        return false;
    }
  };

  // Deep merge helper for chat patches
  const deepMerge = (target: any, source: any): any => {
    if (typeof source !== 'object' || source === null) return target;
    const result: any = Array.isArray(target) ? [...target] : { ...target };
    Object.keys(source).forEach((key) => {
      const sourceValue = (source as any)[key];
      const targetValue = (target as any)?.[key];
      if (Array.isArray(sourceValue)) {
        result[key] = sourceValue.slice();
      } else if (typeof sourceValue === 'object' && sourceValue !== null) {
        result[key] = deepMerge(targetValue || {}, sourceValue);
      } else {
        result[key] = sourceValue;
      }
    });
    return result;
  };

  // Determine if all required steps are valid
  const isAllRequiredValid = (): boolean => {
    return isPersonalStepValid() && isWorkStepValid() && isRoleStepValid() && isCountrySpecificStepValid();
  };

  // Chat injection: via window message and helper API
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data || typeof data !== 'object') return;
      if (data.type !== 'hiring.chat.patch') return;

      try {
        setFormData((prev) => deepMerge(prev, data.payload || {}));
        // Sync radio groups if provided
        if (data.payload?.work?.employment_classification) {
          employmentClassificationGroup.handleSelect(
            data.payload.work.employment_classification
          );
        }
      } catch (e) {
        console.error('Failed to merge chat patch', e);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // After any formData change, if everything is valid, jump to review
  // Only auto-advance if not already on review step and user hasn't manually navigated
  useEffect(() => {
    // Skip if already on review or if csvData is not loaded yet
    if (currentStep === 'review' || !csvData || autoAdvanceRef.current) {
      autoAdvanceRef.current = false; // Reset flag if we're on review
      return;
    }
    
    // Only auto-advance if we're on a step before review and all required fields are valid
    try {
      const visibleSteps = getVisibleSteps();
      const currentIndex = visibleSteps.indexOf(currentStep);
      const reviewIndex = visibleSteps.indexOf('review');
      
      // Only advance if we're before review and all required fields are valid
      if (currentIndex >= 0 && currentIndex < reviewIndex && isAllRequiredValid()) {
        autoAdvanceRef.current = true; // Set flag to prevent re-triggering
        setCurrentStep('review');
      }
    } catch (error) {
      console.error('Error in auto-advance effect:', error);
    }
    // Note: currentStep is intentionally not in deps - we only want to check on formData/csvData changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData, csvData]);

  // Expose a convenience API for direct injection and data retrieval
  useEffect(() => {
    (window as any).hiringAgent = {
      inject: (patch: Partial<HiringSessionData>) => {
        setFormData((prev) => deepMerge(prev, patch || {}));
      },
      getData: () => {
        return formData;
      }
    };
    return () => {
      if ((window as any).hiringAgent) delete (window as any).hiringAgent;
    };
  }, [formData]);

  // Update form data helper
  const updateFormData = (path: string, value: any) => {
    setFormData(prev => {
      const newData = { ...prev };
      const keys = path.split('.');
      let current: any = newData;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newData;
    });
  };

  // Navigation handlers
  const handleNext = () => {
    if (!canProceedToNextStep()) return;
    
    const visibleSteps = getVisibleSteps();
    const currentIndex = visibleSteps.indexOf(currentStep);
    
    if (currentIndex < visibleSteps.length - 1) {
      setCurrentStep(visibleSteps[currentIndex + 1]);
    }
  };

  const handleBack = () => {
    const visibleSteps = getVisibleSteps();
    const currentIndex = visibleSteps.indexOf(currentStep);
    
    if (currentIndex > 0) {
      setCurrentStep(visibleSteps[currentIndex - 1]);
    } else if (onBack) {
      onBack();
    }
  };

  const handleComplete = () => {
    // Validate all required fields
    if (!isPersonalStepValid() || !isWorkStepValid() || !isRoleStepValid()) {
      alert('Please complete all required fields before submitting.');
      return;
    }
    
    // In a real app, this would POST to /hiring/sessions/:id/complete
    console.log('Submitting hiring session:', formData);
    alert('Hiring session submitted successfully!');
  };

  // Sync hiring type and candidate type with state
  useEffect(() => {
    setHiringType(hiringTypeGroup.selectedValue);
  }, [hiringTypeGroup.selectedValue]);

  useEffect(() => {
    setCandidateType(candidateTypeGroup.selectedValue);
  }, [candidateTypeGroup.selectedValue]);

  // Sync employment classification with form data
  useEffect(() => {
    if (employmentClassificationGroup.selectedValue) {
      updateFormData('work.employment_classification', employmentClassificationGroup.selectedValue);
      
      // Reset country and country-specific data when switching to Contractor
      if (employmentClassificationGroup.selectedValue === 'Contractor') {
        updateFormData('work.country', undefined);
        setFormData(prev => ({
          ...prev,
          country_specific: undefined
        }));
      }
    }
    // updateFormData is stable (doesn't depend on props/state that change)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employmentClassificationGroup.selectedValue]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...</div>
    );
  }

  const progress = calculateProgress();

  return (
    <div className="relative min-h-screen w-full">
      {/* Flow Header */}
      <div className="sticky top-[82px] bg-white h-14 left-0 z-40 w-full">
        <div className="absolute inset-0">
          <div className="absolute bg-white inset-0" />
          <div className="absolute bottom-0 h-1 left-0 right-0">
            <div className="absolute bg-[#e0dede] inset-0" />
            <div
              className="absolute bg-[#502d3c] bottom-0 left-0 top-0 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="absolute flex gap-2 items-center overflow-clip right-6 rounded-sm top-1/2 translate-y-[-50%]">
            <div className="overflow-clip relative shrink-0 w-6 h-6">
              <div className="absolute inset-[12.5%]">
                <img
                  alt="Save and exit icon"
                  className="block max-w-none w-full h-full"
                  src={icons.SaveAndExitOutline}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              </div>
            </div>
            <p className="font-medium leading-[22px] relative shrink-0 text-[#502d3c] text-[15px] tracking-[0.25px]">
              Save and exit
            </p>
          </div>
          <div className="absolute flex gap-3 items-center left-4 top-4">
            <div className="relative shrink-0 w-6 h-6">
              <div className="absolute inset-[12.5%]">
                <img
                  alt="List icon"
                  className="block max-w-none w-full h-full"
                  src={img5}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              </div>
            </div>
            <div className="h-[19.5px] relative shrink-0 w-0">
              <div className="absolute bottom-0 left-[-0.5px] right-[-0.5px] top-0">
                <img
                  alt="Arrow"
                  className="block max-w-none w-full h-full"
                  src={img6}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              </div>
            </div>
            <p className="font-medium leading-6 relative shrink-0 text-[17px] text-black tracking-[0.25px]">
              {STEP_TITLES[currentStep]}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col gap-10 items-center mx-auto pt-8 pb-20 w-full max-w-2xl px-4">
        {/* Step Header */}
        <div className="w-full">
          <p className="font-medium leading-8 text-2xl text-black text-left">
            {currentStep === 'hiring_type' && "Share some details about who you're hiring"}
            {currentStep === 'work' && "Work & Employment Information"}
            {currentStep === 'role' && "Role Information"}
            {currentStep === 'compensation' && "Compensation Information"}
            {currentStep === 'country_specific' && "Country-specific Information"}
            {currentStep === 'review' && "Review Your Information"}
          </p>
        </div>

        {/* Step Content */}
        <div className="w-full">
          {currentStep === 'hiring_type' && (
            <div className="flex flex-col gap-6 items-start relative shrink-0 w-full">
              {/* Hiring Type Selection */}
              <div className="flex flex-col gap-2 items-start relative shrink-0 w-full">
                <div className="flex flex-col gap-2 items-start relative shrink-0 w-full">
                  {/* Individual Hire Option */}
                  <RadioButton
                    id="individual"
                    value="individual"
                    label="Hire an individual"
                    isSelected={hiringTypeGroup.selectedValue === 'individual'}
                    isFocused={hiringTypeGroup.focusedId === 'individual'}
                    onSelect={hiringTypeGroup.handleSelect}
                    onFocus={hiringTypeGroup.handleFocus}
                    onBlur={hiringTypeGroup.handleBlur}
                    onMouseEnter={hiringTypeGroup.handleMouseEnter}
                    onMouseLeave={hiringTypeGroup.handleMouseLeave}
                    className="border-2"
                  />

                  {/* Multiple People Option */}
                  <RadioButton
                    id="multiple"
                    value="multiple"
                    label="Hire multiple people"
                    isSelected={hiringTypeGroup.selectedValue === 'multiple'}
                    isFocused={hiringTypeGroup.focusedId === 'multiple'}
                    onSelect={hiringTypeGroup.handleSelect}
                    onFocus={hiringTypeGroup.handleFocus}
                    onBlur={hiringTypeGroup.handleBlur}
                    onMouseEnter={hiringTypeGroup.handleMouseEnter}
                    onMouseLeave={hiringTypeGroup.handleMouseLeave}
                  />

                  {/* Background Check Option */}
                  <RadioButton
                    id="background-check"
                    value="background-check"
                    label="Run a background check on someone"
                    isSelected={hiringTypeGroup.selectedValue === 'background-check'}
                    isFocused={hiringTypeGroup.focusedId === 'background-check'}
                    onSelect={hiringTypeGroup.handleSelect}
                    onFocus={hiringTypeGroup.handleFocus}
                    onBlur={hiringTypeGroup.handleBlur}
                    onMouseEnter={hiringTypeGroup.handleMouseEnter}
                    onMouseLeave={hiringTypeGroup.handleMouseLeave}
                  />
                </div>

                {/* Resume Process Link */}
                <div className="flex gap-4 items-center relative shrink-0">
                  <div className="flex flex-col font-medium justify-center leading-[0] relative shrink-0 text-[#4a6ba6] text-[15px] tracking-[0.25px] whitespace-nowrap">
                    <p className="leading-[22px]">Resume a hiring process that's already been started</p>
                  </div>
                  <div className="bg-[#502d3c] box-border flex flex-col items-center justify-center overflow-clip px-2 py-1 relative rounded-full shrink-0">
                    <div className="flex flex-col font-normal justify-center leading-[0] relative shrink-0 text-[12px] text-center text-white tracking-[0.25px] whitespace-nowrap">
                      <p className="leading-3">2</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="flex items-center justify-center relative shrink-0 w-full">
                <div className="flex-none scale-y-[-100%] w-full">
                  <div className="h-px relative w-full">
                    <div className="absolute bg-[rgba(196,196,196,0.01)] h-8 left-0 right-0 top-[calc(50%+-16px)] translate-y-[-50%]" />
                    <div className="absolute bg-[rgba(196,196,196,0.01)] h-8 left-0 right-0 top-[calc(50%+16px)] translate-y-[-50%]" />
                    <div className="absolute h-0 left-0 right-0 top-1/2 translate-y-[-50%]">
                      <div className="absolute bottom-[-0.5px] left-0 right-0 top-[-0.5px]">
                        <div className="border border-[rgba(0,0,0,0.1)] border-solid h-px relative w-full" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Candidate Type Selection - Only show if "Hire an individual" is selected */}
              {hiringTypeGroup.selectedValue === 'individual' && (
                <div className="flex flex-col gap-2 items-start relative shrink-0 w-full">
                  <div className="flex flex-col font-medium justify-center leading-[0] relative shrink-0 text-[#595555] text-[0px] tracking-[0.25px] whitespace-nowrap">
                    <p className="leading-[22px] text-[15px]">
                      Who do you want to hire?<span className="font-medium text-[#c3402c] tracking-[0.25px]"> *</span>
                    </p>
                  </div>

                  {/* ATS Candidate Option */}
                  <RadioButton
                    id="ats"
                    value="ats"
                    label="A candidate in the applicant tracking system"
                    isSelected={candidateTypeGroup.selectedValue === 'ats'}
                    isFocused={candidateTypeGroup.focusedId === 'ats'}
                    onSelect={candidateTypeGroup.handleSelect}
                    onFocus={candidateTypeGroup.handleFocus}
                    onBlur={candidateTypeGroup.handleBlur}
                    onMouseEnter={candidateTypeGroup.handleMouseEnter}
                    onMouseLeave={candidateTypeGroup.handleMouseLeave}
                  />

                  {/* Background Check System Option */}
                  <RadioButton
                    id="background-system"
                    value="background-system"
                    label="A candidate in the background check system"
                    isSelected={candidateTypeGroup.selectedValue === 'background-system'}
                    isFocused={candidateTypeGroup.focusedId === 'background-system'}
                    onSelect={candidateTypeGroup.handleSelect}
                    onFocus={candidateTypeGroup.handleFocus}
                    onBlur={candidateTypeGroup.handleBlur}
                    onMouseEnter={candidateTypeGroup.handleMouseEnter}
                    onMouseLeave={candidateTypeGroup.handleMouseLeave}
                  />

                  {/* Former Employee Option */}
                  <RadioButton
                    id="former-employee"
                    value="former-employee"
                    label="A former employee or contractor"
                    isSelected={candidateTypeGroup.selectedValue === 'former-employee'}
                    isFocused={candidateTypeGroup.focusedId === 'former-employee'}
                    onSelect={candidateTypeGroup.handleSelect}
                    onFocus={candidateTypeGroup.handleFocus}
                    onBlur={candidateTypeGroup.handleBlur}
                    onMouseEnter={candidateTypeGroup.handleMouseEnter}
                    onMouseLeave={candidateTypeGroup.handleMouseLeave}
                  />

                  {/* New Candidate Option */}
                  <RadioButton
                    id="new"
                    value="new"
                    label="A new candidate"
                    isSelected={candidateTypeGroup.selectedValue === 'new'}
                    isFocused={candidateTypeGroup.focusedId === 'new'}
                    onSelect={candidateTypeGroup.handleSelect}
                    onFocus={candidateTypeGroup.handleFocus}
                    onBlur={candidateTypeGroup.handleBlur}
                    onMouseEnter={candidateTypeGroup.handleMouseEnter}
                    onMouseLeave={candidateTypeGroup.handleMouseLeave}
                  />
                </div>
              )}

              {/* Personal Information - Only show if "Hire an individual" and "A new candidate" is selected */}
              {hiringTypeGroup.selectedValue === 'individual' && candidateTypeGroup.selectedValue === 'new' && (
                <>
                  {/* Divider */}
                  <div className="flex items-center justify-center relative shrink-0 w-full">
                    <div className="flex-none scale-y-[-100%] w-full">
                      <div className="border border-[rgba(0,0,0,0.1)] border-solid h-px relative w-full">
                        <div className="absolute bg-[rgba(196,196,196,0.01)] h-8 left-0 right-0 top-[calc(50%+16px)] translate-y-[-50%]" />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 items-start relative shrink-0 w-full">
                    <InputText
                      id="firstName"
                      label="First name"
                      value={formData.personal.first_name}
                      onChange={(value) => updateFormData('personal.first_name', value)}
                      required
                    />
                    <InputText
                      id="lastName"
                      label="Last name"
                      value={formData.personal.last_name}
                      onChange={(value) => updateFormData('personal.last_name', value)}
                      required
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {currentStep === 'work' && (
            <div className="flex flex-col gap-4 items-start relative shrink-0 w-full">
              {/* Employment Classification */}
              <div className="w-full">
                <p className="font-medium leading-[22px] text-[#595555] text-[15px] mb-2">
                  Employment Classification<span className="text-[#c3402c]"> *</span>
                </p>
                <div className="flex flex-col gap-2">
                  <RadioButton
                    id="employee"
                    value="Employee"
                    label="Employee"
                    isSelected={employmentClassificationGroup.selectedValue === 'Employee'}
                    isFocused={employmentClassificationGroup.focusedId === 'employee'}
                    onSelect={employmentClassificationGroup.handleSelect}
                    onFocus={employmentClassificationGroup.handleFocus}
                    onBlur={employmentClassificationGroup.handleBlur}
                    onMouseEnter={employmentClassificationGroup.handleMouseEnter}
                    onMouseLeave={employmentClassificationGroup.handleMouseLeave}
                  />
                  <RadioButton
                    id="contractor"
                    value="Contractor"
                    label="Contractor"
                    isSelected={employmentClassificationGroup.selectedValue === 'Contractor'}
                    isFocused={employmentClassificationGroup.focusedId === 'contractor'}
                    onSelect={employmentClassificationGroup.handleSelect}
                    onFocus={employmentClassificationGroup.handleFocus}
                    onBlur={employmentClassificationGroup.handleBlur}
                    onMouseEnter={employmentClassificationGroup.handleMouseEnter}
                    onMouseLeave={employmentClassificationGroup.handleMouseLeave}
                  />
                  <RadioButton
                    id="eor"
                    value="EOR"
                    label="EOR"
                    isSelected={employmentClassificationGroup.selectedValue === 'EOR'}
                    isFocused={employmentClassificationGroup.focusedId === 'eor'}
                    onSelect={employmentClassificationGroup.handleSelect}
                    onFocus={employmentClassificationGroup.handleFocus}
                    onBlur={employmentClassificationGroup.handleBlur}
                    onMouseEnter={employmentClassificationGroup.handleMouseEnter}
                    onMouseLeave={employmentClassificationGroup.handleMouseLeave}
                  />
                </div>
              </div>

                     {/* Country - Only visible for Employee/EOR */}
                     {(formData.work.employment_classification === 'Employee' ||
                       formData.work.employment_classification === 'EOR') && (
                       <Select
                         id="country"
                         label="Country"
                         value={
                           formData.work.country && csvData
                             ? csvData.countries.find(opt => 
                                 opt.id === formData.work.country || 
                                 opt.label === formData.work.country
                               )?.id || formData.work.country
                             : undefined
                         }
                         options={csvData?.countries || []}
                         onChange={(value) => {
                           const option = csvData?.countries.find(opt => opt.id === value);
                           // Store the option id for consistency
                           updateFormData('work.country', option?.id || '');
                           
                           // Reset country-specific data when country changes
                           if (option?.label !== 'India') {
                             setFormData(prev => ({
                               ...prev,
                               country_specific: undefined
                             }));
                           }
                         }}
                         placeholder="Select a country"
                         searchable={true}
                       />
                     )}

              {/* Work Location */}
              <Select
                id="workLocation"
                label="Work location"
                value={formData.work.work_location_id}
                options={csvData?.workLocations || []}
                onChange={(value) => updateFormData('work.work_location_id', value)}
                placeholder="Select a work location"
                searchable={true}
              />

              {/* Employment Type - Filtered by classification */}
              <Select
                id="employmentType"
                label="Employment type"
                value={formData.work.employment_type_id}
                options={getEmploymentTypeOptions()}
                onChange={(value) => updateFormData('work.employment_type_id', value)}
                placeholder="Select an employment type"
                disabled={!formData.work.employment_classification}
                searchable={true}
              />

              {/* Entity - Optional */}
              <Select
                id="entity"
                label="Entity"
                value={formData.work.entity}
                options={csvData?.entities || []}
                onChange={(value) => updateFormData('work.entity', value)}
                placeholder="Select an entity"
                searchable={true}
              />

              {/* Overtime Exemption - Optional */}
              <InputText
                id="overtimeExemption"
                label="Overtime exemption"
                value={formData.work.overtime_exemption || ''}
                onChange={(value) => updateFormData('work.overtime_exemption', value)}
                placeholder="Enter overtime exemption details"
              />
            </div>
          )}

          {currentStep === 'role' && (
            <div className="flex flex-col gap-3 items-start relative shrink-0 w-full">
              <DatePicker
                id="startDate"
                label="Start date"
                value={formData.role.start_date}
                onChange={(iso) => updateFormData('role.start_date', iso)}
                required
              />
              <InputText
                id="title"
                label="Title"
                value={formData.role.title || ''}
                onChange={(value) => updateFormData('role.title', value)}
                placeholder="Enter job title"
              />
              <Select
                id="level"
                label="Level"
                value={formData.role.level}
                options={csvData?.levels || []}
                onChange={(value) => updateFormData('role.level', value)}
                placeholder="Select a level"
                searchable={true}
              />
              <Select
                id="department"
                label="Department"
                value={formData.role.department_id}
                options={csvData?.departments || []}
                onChange={(value) => updateFormData('role.department_id', value)}
                placeholder="Select a department"
                searchable={true}
              />
              <Select
                id="team"
                label="Team"
                value={formData.role.team_id}
                options={csvData?.teams || []}
                onChange={(value) => updateFormData('role.team_id', value)}
                placeholder="Select a team"
                searchable={true}
              />
            </div>
          )}

          {currentStep === 'compensation' && (
            <div className="flex flex-col gap-3 items-start relative shrink-0 w-full">
              <InputText
                id="amount"
                label="Amount"
                type="text"
                value={formData.comp.amount || ''}
                onChange={(value) => updateFormData('comp.amount', value)}
                placeholder="Enter amount"
              />
              <Select
                id="currency"
                label="Currency"
                value={formData.comp.currency}
                options={csvData?.currencies || []}
                onChange={(value) => {
                  const option = csvData?.currencies.find(opt => opt.id === value);
                  updateFormData('comp.currency', option?.label || '');
                }}
                placeholder="Select currency"
                searchable={true}
              />
              <Select
                id="frequency"
                label="Frequency"
                value={formData.comp.frequency}
                options={csvData?.frequencies || []}
                onChange={(value) => {
                  const option = csvData?.frequencies.find(opt => opt.id === value);
                  updateFormData('comp.frequency', option?.label || '');
                }}
                placeholder="Select frequency"
                searchable={true}
              />
            </div>
          )}

          {currentStep === 'country_specific' && isCountryIndia() && (
            <div className="flex flex-col gap-3 items-start relative shrink-0 w-full">
              <InputText
                id="indiaIdNumber"
                label="India ID Number"
                value={formData.country_specific?.IN?.india_id_number || ''}
                onChange={(value) => {
                  setFormData(prev => ({
                    ...prev,
                    country_specific: {
                      ...prev.country_specific,
                      IN: {
                        ...prev.country_specific?.IN,
                        india_id_number: value
                      }
                    }
                  }));
                }}
                required
                placeholder="Enter India ID number"
              />
            </div>
          )}

          {currentStep === 'review' && (
            <div className="flex flex-col gap-4 items-start relative shrink-0 w-full">
              <div className="w-full p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-lg mb-4">Hiring Type</h3>
                <p><strong>Type:</strong> {hiringType}</p>
                <p><strong>Candidate Type:</strong> {candidateType}</p>
              </div>
              
              <div className="w-full p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-lg mb-4">Personal Information</h3>
                <p><strong>Name:</strong> {formData.personal.first_name} {formData.personal.last_name}</p>
              </div>
              
              <div className="w-full p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-lg mb-4">Work Information</h3>
                <p><strong>Classification:</strong> {formData.work.employment_classification}</p>
                {formData.work.country && (
                  <p><strong>Country:</strong> {getCountryLabel()}</p>
                )}
              </div>
              
              <div className="w-full p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-lg mb-4">Role Information</h3>
                <p><strong>Start Date:</strong> {formData.role.start_date}</p>
                {formData.role.title && <p><strong>Title:</strong> {formData.role.title}</p>}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Flow Footer */}
      <div className="fixed bg-white bottom-0 box-border flex items-start justify-between overflow-clip px-4 py-3 z-50 border-t border-[#e0dede]" style={{ 
        left: 0,
        right: panelWidth > 0 ? `${panelWidth}px` : 0,
        transition: 'right 0.3s ease-in-out'
      }}>
        <Button
          onClick={handleBack}
          appearance="secondary"
        >
          Back
        </Button>
        <div className="flex gap-4 items-center relative shrink-0">
          {currentStep === 'review' ? (
            <Button
              onClick={handleComplete}
              disabled={!canProceedToNextStep()}
            >
              Complete
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={!canProceedToNextStep()}
            >
              Continue
            </Button>
          )}
        </div>
        <div className="absolute inset-0 pointer-events-none shadow-[inset_0px_1px_0px_0px_#e0dede]" />
      </div>
    </div>
  );
}
