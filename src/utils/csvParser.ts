// Utility to parse CSV and extract options for form fields

export interface Option {
  id: string;
  label: string;
}

export interface ParsedCSV {
  countries: Option[];
  currencies: Option[];
  frequencies: Option[];
  employmentTypes: Option[];
  workLocations: Option[];
  departments: Option[];
  levels: Option[];
  jobFamilies: Option[];
  entities: Option[];
  teams: Option[];
}

// Parse CSV text and extract unique values for each column
export async function parseAcceptedValuesCSV(): Promise<ParsedCSV> {
  try {
    // Fetch the CSV file - try both possible paths
    // First try public directory path (for Vite static files)
    let response = await fetch('/Config/org data accepted value.csv');
    
    // If that fails, try the root path
    if (!response.ok) {
      response = await fetch('./Config/org data accepted value.csv');
    }
    
    if (!response.ok) {
      throw new Error('Failed to fetch CSV file. Please ensure the file is in public/Config/ directory.');
    }
    const csvText = await response.text();
    
    // Parse CSV lines
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      throw new Error('Invalid CSV format');
    }

    // Get headers
    const headers = parseCSVLine(lines[0]);
    const dataRows = lines.slice(2); // Skip header and requirement row

    // Find column indices
    const countryIdx = headers.indexOf('Country');
    const currencyIdx = headers.indexOf('Compensation currency');
    const frequencyIdx = headers.indexOf('Compensation time period');
    const employmentTypeIdx = headers.indexOf('Employment type');
    const workLocationIdx = headers.indexOf('Work location');
    const departmentIdx = headers.indexOf('Department');
    const levelIdx = headers.indexOf('Level');
    const jobFamilyIdx = headers.indexOf('Job family');
    const entityIdx = headers.indexOf('Entity');
    const teamIdx = headers.indexOf('Teams');

    // Extract unique values
    const countrySet = new Set<string>();
    const currencySet = new Set<string>();
    const frequencySet = new Set<string>();
    const employmentTypeSet = new Set<string>();
    const workLocationSet = new Set<string>();
    const departmentSet = new Set<string>();
    const levelSet = new Set<string>();
    const jobFamilySet = new Set<string>();
    const entitySet = new Set<string>();
    const teamSet = new Set<string>();

    dataRows.forEach(row => {
      const values = parseCSVLine(row);
      
      if (countryIdx >= 0 && values[countryIdx]) countrySet.add(values[countryIdx].trim());
      if (currencyIdx >= 0 && values[currencyIdx]) currencySet.add(values[currencyIdx].trim());
      if (frequencyIdx >= 0 && values[frequencyIdx]) frequencySet.add(values[frequencyIdx].trim());
      if (employmentTypeIdx >= 0 && values[employmentTypeIdx]) employmentTypeSet.add(values[employmentTypeIdx].trim());
      if (workLocationIdx >= 0 && values[workLocationIdx]) workLocationSet.add(values[workLocationIdx].trim());
      if (departmentIdx >= 0 && values[departmentIdx]) departmentSet.add(values[departmentIdx].trim());
      if (levelIdx >= 0 && values[levelIdx]) levelSet.add(values[levelIdx].trim());
      if (jobFamilyIdx >= 0 && values[jobFamilyIdx]) jobFamilySet.add(values[jobFamilyIdx].trim());
      if (entityIdx >= 0 && values[entityIdx]) entitySet.add(values[entityIdx].trim());
      if (teamIdx >= 0 && values[teamIdx]) teamSet.add(values[teamIdx].trim());
    });

    // Convert to Option arrays
    const toOptions = (set: Set<string>): Option[] => {
      return Array.from(set)
        .filter(v => v && v.trim() !== '')
        .sort()
        .map((value, index) => ({
          id: `option-${index}-${value.toLowerCase().replace(/\s+/g, '-')}`,
          label: value
        }));
    };

    return {
      countries: toOptions(countrySet),
      currencies: toOptions(currencySet),
      frequencies: toOptions(frequencySet),
      employmentTypes: toOptions(employmentTypeSet),
      workLocations: toOptions(workLocationSet),
      departments: toOptions(departmentSet),
      levels: toOptions(levelSet),
      jobFamilies: toOptions(jobFamilySet),
      entities: toOptions(entitySet),
      teams: toOptions(teamSet)
    };
  } catch (error) {
    console.error('Error parsing CSV:', error);
    // Return empty defaults on error
    return {
      countries: [],
      currencies: [],
      frequencies: [],
      employmentTypes: [],
      workLocations: [],
      departments: [],
      levels: [],
      jobFamilies: [],
      entities: [],
      teams: []
    };
  }
}

// Simple CSV line parser that handles quoted fields
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++; // Skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

