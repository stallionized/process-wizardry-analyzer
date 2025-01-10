export const findPotentialUniqueIdentifiers = (jsonData: any[]): string[] => {
  if (!Array.isArray(jsonData) || jsonData.length === 0) {
    console.log('No data to analyze for unique identifiers');
    return [];
  }

  const columns = Object.keys(jsonData[0]);
  const uniqueIdentifiers: string[] = [];

  console.log('Analyzing columns for unique identifiers:', columns);

  for (const column of columns) {
    // Get all values for this column
    const values = jsonData.map(row => row[column]);
    
    // Check if all values are unique and not null/undefined
    const uniqueValues = new Set(values.filter(value => value !== null && value !== undefined));
    
    console.log(`Column ${column}:`, {
      totalRows: jsonData.length,
      uniqueValues: uniqueValues.size,
      hasNulls: values.some(v => v === null || v === undefined)
    });
    
    // If number of unique values equals number of rows and no null values
    if (uniqueValues.size === jsonData.length && uniqueValues.size === values.length) {
      console.log(`Found unique identifier column: ${column}`);
      uniqueIdentifiers.push(column);
    }
  }

  console.log('Identified potential unique identifiers:', uniqueIdentifiers);
  return uniqueIdentifiers;
}