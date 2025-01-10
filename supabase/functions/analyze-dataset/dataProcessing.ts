import * as XLSX from 'https://deno.land/x/sheetjs@v0.18.3/xlsx.mjs';
import { calculateDescriptiveStats, generateExecutiveSummary } from './statsUtils.ts';
import { calculateCorrelationMatrix } from './correlationUtils.ts';
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
  const fileUrl = input.files[0].url;
  console.log('Downloading file from:', fileUrl);

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
  
  const validation = validateDataset(jsonData);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  const numericalData: Record<string, number[]> = {};
  const descriptiveStats: Record<string, any> = {};
  const dataIdentifiers: Record<string, string[]> = {};

  // Find potential identifier columns (non-numeric columns)
  const firstRow = jsonData[0];
  const potentialIdentifierColumns = Object.keys(firstRow).filter(column => {
    const value = firstRow[column];
    return typeof value === 'string' || typeof value === 'number';
  });

  console.log('Potential identifier columns:', potentialIdentifierColumns);

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
      
      // Store identifiers for this column's data points
      dataIdentifiers[column] = jsonData.map(row => {
        // Try to find the best identifier from available columns
        for (const idColumn of potentialIdentifierColumns) {
          if (idColumn !== column && row[idColumn]) {
            return String(row[idColumn]);
          }
        }
        return `Row ${jsonData.indexOf(row) + 1}`;
      });
    }
  });

  console.log('Processed numerical data for columns:', Object.keys(numericalData));
  console.log('Collected identifiers for data points');

  const correlationMatrix = calculateCorrelationMatrix(numericalData);
  const statsAnalysis = generateExecutiveSummary(descriptiveStats);

  return {
    numericalData,
    descriptiveStats,
    correlationMatrix,
    statsAnalysis,
    dataIdentifiers
  };
}
