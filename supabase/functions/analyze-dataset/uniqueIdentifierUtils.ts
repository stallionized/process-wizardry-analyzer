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
    
    // Filter out null/undefined values
    const validValues = values.filter(value => value !== null && value !== undefined);
    
    // Create a Set of unique values
    const uniqueValues = new Set(validValues);
    
    console.log(`Column ${column}:`, {
      totalRows: jsonData.length,
      validValues: validValues.length,
      uniqueValues: uniqueValues.size,
      hasNulls: values.length !== validValues.length,
      sample: values.slice(0, 3)
    });
    
    // Check if:
    // 1. We have the same number of unique values as total rows
    // 2. We don't have any null/undefined values
    // 3. The number of valid values equals the total number of rows
    if (uniqueValues.size === jsonData.length && 
        validValues.length === jsonData.length) {
      console.log(`Found unique identifier column: ${column}`);
      uniqueIdentifiers.push(column);
    }
  }

  console.log('Identified potential unique identifiers:', uniqueIdentifiers);
  return uniqueIdentifiers;
}