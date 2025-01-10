import * as XLSX from 'https://deno.land/x/sheetjs@v0.18.3/xlsx.mjs';
import { calculateDescriptiveStats, generateExecutiveSummary } from './statsUtils.ts';
import { calculateCorrelationMatrix } from './correlationUtils.ts';
import { AnalysisInput } from './types.ts';

function validateDataset(jsonData: any[]): { isValid: boolean; error?: string } {
  if (!Array.isArray(jsonData) || jsonData.length === 0) {
    return { isValid: false, error: 'Dataset is empty or invalid' };
  }

  // Check if we have at least 2 numeric columns for correlation analysis
  const firstRow = jsonData[0];
  const numericColumns = Object.keys(firstRow).filter(column => {
    const values = jsonData.map(row => row[column]);
    return values.every(value => 
      typeof value === 'number' || 
      (typeof value === 'string' && !isNaN(parseFloat(value.replace(/[^0-9.-]/g, ''))))
    );
  });

  if (numericColumns.length < 2) {
    return { 
      isValid: false, 
      error: 'Dataset must contain at least 2 numeric columns for analysis' 
    };
  }

  // Check for consistent data types within columns
  for (const column of Object.keys(firstRow)) {
    const columnType = typeof firstRow[column];
    const hasInconsistentTypes = jsonData.some(row => 
      typeof row[column] !== columnType && 
      !(typeof row[column] === 'string' && columnType === 'number' && !isNaN(parseFloat(row[column])))
    );
    
    if (hasInconsistentTypes) {
      return { 
        isValid: false, 
        error: `Column "${column}" contains inconsistent data types` 
      };
    }
  }

  // Check for minimum required rows
  if (jsonData.length < 10) {
    return { 
      isValid: false, 
      error: 'Dataset must contain at least 10 rows for meaningful analysis' 
    };
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

  // Validate dataset before processing
  const validation = validateDataset(jsonData);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  console.log('Processing', jsonData.length, 'rows of data');

  const columns = Object.keys(jsonData[0] || {});
  const numericalData: Record<string, number[]> = {};
  const categoricalMappings: Record<string, Record<string, number>> = {};
  const descriptiveStats: Record<string, any> = {};

  // Track expected number of analyses
  let expectedAnalyses = 0;

  columns.forEach(column => {
    const values = jsonData.map(row => row[column]);
    
    const isNumerical = values.every(value => 
      typeof value === 'number' || 
      (typeof value === 'string' && !isNaN(parseFloat(value.replace(/[^0-9.-]/g, ''))))
    );

    if (isNumerical) {
      const numericValues = values.map(value => 
        typeof value === 'number' ? value : parseFloat(value.replace(/[^0-9.-]/g, ''))
      );
      numericalData[column] = numericValues;
      descriptiveStats[column] = calculateDescriptiveStats(numericValues);
      expectedAnalyses++;
    } else {
      const uniqueValues = [...new Set(values)];
      const mapping: Record<string, number> = {};
      uniqueValues.forEach((value, index) => {
        mapping[value] = index;
      });
      categoricalMappings[column] = mapping;
      numericalData[column] = values.map(value => mapping[value]);
    }
  });

  console.log(`Expected ${expectedAnalyses} numerical columns for analysis`);

  const correlationMatrix = calculateCorrelationMatrix(numericalData);
  const statsAnalysis = generateExecutiveSummary(descriptiveStats);

  return {
    numericalData,
    categoricalMappings,
    descriptiveStats,
    correlationMatrix,
    statsAnalysis,
    expectedAnalyses
  };
}