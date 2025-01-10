import * as XLSX from 'https://deno.land/x/sheetjs@v0.18.3/xlsx.mjs';
import { calculateDescriptiveStats, generateExecutiveSummary } from './statsUtils.ts';
import { calculateCorrelationMatrix } from './correlationUtils.ts';
import { findPotentialUniqueIdentifiers } from './uniqueIdentifierUtils.ts';
import { AnalysisInput } from './types.ts';

function validateDataset(jsonData: any[]): { isValid: boolean; error?: string; } {
  if (!Array.isArray(jsonData) || jsonData.length === 0) {
    return { isValid: false, error: 'Dataset is empty or invalid' };
  }

  if (jsonData.length < 2) {
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

  if (numericColumns.length === 0) {
    return { isValid: false, error: 'Dataset must contain at least one numeric column for analysis' };
  }

  return { isValid: true };
}

export async function processExcelData(input: AnalysisInput) {
  console.log('Processing Excel data for project:', input.projectId);
  
  const fileUrl = input.files[0].url;
  console.log('Downloading file from:', fileUrl);

  const response = await fetch(fileUrl);
  if (!response.ok) {
    throw new Error(`Failed to download file: ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const jsonData = XLSX.utils.sheet_to_json(firstSheet);

  console.log('Excel data converted to JSON:', {
    rowCount: jsonData.length,
    columnCount: Object.keys(jsonData[0] || {}).length
  });

  const validation = validateDataset(jsonData);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  // If this is just checking for identifiers
  if (input.checkIdentifiers) {
    console.log('Checking for unique identifiers...');
    const potentialIdentifiers = await findPotentialUniqueIdentifiers(jsonData);
    
    if (potentialIdentifiers.length > 0) {
      console.log('Found potential identifiers:', potentialIdentifiers);
      return { potentialIdentifiers, jsonData };
    }
    
    console.log('No unique identifiers found');
    return { potentialIdentifiers: [], jsonData };
  }

  // Process the full analysis
  const numericalData: Record<string, number[]> = {};
  const descriptiveStats: Record<string, any> = {};
  const dataIdentifiers: Record<string, string[]> = {};

  const identifierColumn = input.selectedIdentifier || null;
  console.log('Using identifier column:', identifierColumn);

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
      
      dataIdentifiers[column] = jsonData.map((row, index) => {
        if (identifierColumn && row[identifierColumn] != null) {
          return String(row[identifierColumn]);
        }
        return `Row ${index + 1}`;
      });
    }
  });

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