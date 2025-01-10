import * as XLSX from 'https://deno.land/x/sheetjs@v0.18.3/xlsx.mjs';
import { calculateDescriptiveStats, generateExecutiveSummary } from './statsUtils.ts';
import { calculateCorrelationMatrix } from './correlationUtils.ts';
import { findPotentialUniqueIdentifiers } from './uniqueIdentifierUtils.ts';
import { AnalysisInput } from './types.ts';

function validateDataset(jsonData: any[]): { isValid: boolean; error?: string; } {
  console.log('Validating dataset...');
  
  if (!Array.isArray(jsonData) || jsonData.length === 0) {
    console.error('Dataset validation failed: Empty or invalid dataset');
    return { isValid: false, error: 'Dataset is empty or invalid' };
  }

  if (jsonData.length < 2) {
    console.error('Dataset validation failed: Not enough rows');
    return { isValid: false, error: 'Dataset must contain at least 2 rows for analysis' };
  }

  const firstRow = jsonData[0];
  const numericColumns = Object.keys(firstRow).filter(column => {
    const values = jsonData.map(row => row[column]);
    return values.some(value => 
      typeof value === 'number' || 
      (typeof value === 'string' && !isNaN(parseFloat(value)))
    );
  });

  console.log('Found numeric columns:', numericColumns);

  if (numericColumns.length === 0) {
    console.error('Dataset validation failed: No numeric columns found');
    return { isValid: false, error: 'Dataset must contain at least one numeric column for analysis' };
  }

  return { isValid: true };
}

export async function processExcelData(input: AnalysisInput) {
  console.log('Starting data processing with input:', input);
  const fileUrl = input.files[0].url;
  console.log('Processing file from:', fileUrl);

  const response = await fetch(fileUrl);
  if (!response.ok) {
    throw new Error(`Failed to download file: ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  console.log('File downloaded successfully');

  const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const jsonData = XLSX.utils.sheet_to_json(firstSheet);

  console.log('Excel data converted to JSON');
  console.log('Number of rows:', jsonData.length);
  console.log('Sample row:', jsonData[0]);
  
  const validation = validateDataset(jsonData);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  // Find potential unique identifiers using GPT-4O enhanced detection
  console.log('\nStarting unique identifier detection...');
  const potentialIdentifiers = await findPotentialUniqueIdentifiers(jsonData);
  console.log('Potential unique identifiers found:', potentialIdentifiers);

  // If this is the initial submission, return only the potential identifiers
  if (input.checkIdentifiers) {
    console.log('Initial submission - returning potential identifiers');
    return {
      potentialIdentifiers,
      jsonData // We'll need this later when the user selects an identifier
    };
  }

  const numericalData: Record<string, number[]> = {};
  const descriptiveStats: Record<string, any> = {};
  const dataIdentifiers: Record<string, string[]> = {};

  // Use the selected identifier if provided
  const identifierColumn = input.selectedIdentifier || null;
  console.log('Using identifier column:', identifierColumn);

  // Process numeric columns and keep track of identifiers
  Object.keys(jsonData[0]).forEach(column => {
    const values = jsonData.map(row => {
      const value = row[column];
      if (typeof value === 'number') return value;
      if (typeof value === 'string') {
        const parsed = parseFloat(value);
        if (!isNaN(parsed)) return parsed;
      }
      return null;
    }).filter((value): value is number => value !== null);

    if (values.length > 0) {
      numericalData[column] = values;
      descriptiveStats[column] = calculateDescriptiveStats(values);
      
      // Use the selected identifier if available, otherwise use row numbers
      dataIdentifiers[column] = jsonData.map((row, index) => {
        if (identifierColumn && row[identifierColumn] != null) {
          return String(row[identifierColumn]);
        }
        return `Row ${index + 1}`;
      });
    }
  });

  console.log('Processed numerical data for columns:', Object.keys(numericalData));

  const correlationMatrix = calculateCorrelationMatrix(numericalData);
  const statsAnalysis = generateExecutiveSummary(descriptiveStats);

  return {
    numericalData,
    descriptiveStats,
    correlationMatrix,
    statsAnalysis,
    dataIdentifiers,
    selectedIdentifier: identifierColumn
  };
}