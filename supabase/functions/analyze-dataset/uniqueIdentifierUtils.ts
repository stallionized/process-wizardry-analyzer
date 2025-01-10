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
    const validValues = values.filter(value => value != null && value !== '');
    
    // Create a Set of unique values
    const uniqueValues = new Set(validValues);
    
    // Log detailed information about the column
    console.log(`Column ${column} analysis:`, {
      totalRows: jsonData.length,
      validValues: validValues.length,
      uniqueValues: uniqueValues.size,
      hasNulls: values.length !== validValues.length,
      sample: values.slice(0, 3),
      isUnique: uniqueValues.size === jsonData.length && validValues.length === jsonData.length
    });

    // A column is a potential unique identifier if:
    // 1. All values are unique (uniqueValues.size equals total rows)
    // 2. No null/empty values (validValues.length equals total rows)
    if (uniqueValues.size === jsonData.length && validValues.length === jsonData.length) {
      console.log(`✓ Found unique identifier column: ${column}`);
      uniqueIdentifiers.push(column);
    } else {
      console.log(`✗ Column ${column} is not a unique identifier`);
    }
  }

  console.log('Final unique identifiers found:', uniqueIdentifiers);
  return uniqueIdentifiers;
}