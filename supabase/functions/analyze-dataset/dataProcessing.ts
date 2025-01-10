import * as XLSX from 'https://deno.land/x/sheetjs@v0.18.3/xlsx.mjs';
import { calculateDescriptiveStats, generateExecutiveSummary } from './statsUtils.ts';
import { calculateCorrelationMatrix } from './correlationUtils.ts';
import { AnalysisInput } from './types.ts';

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

  if (jsonData.length === 0) {
    throw new Error('No data found in Excel file');
  }

  console.log('Processing', jsonData.length, 'rows of data');

  const columns = Object.keys(jsonData[0] || {});
  const numericalData: Record<string, number[]> = {};
  const categoricalMappings: Record<string, Record<string, number>> = {};
  const descriptiveStats: Record<string, any> = {};

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

  const correlationMatrix = calculateCorrelationMatrix(numericalData);
  const statsAnalysis = generateExecutiveSummary(descriptiveStats);

  return {
    numericalData,
    categoricalMappings,
    descriptiveStats,
    correlationMatrix,
    statsAnalysis
  };
}