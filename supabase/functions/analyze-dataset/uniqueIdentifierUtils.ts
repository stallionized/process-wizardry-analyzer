export const findPotentialUniqueIdentifiers = (jsonData: any[]): string[] => {
  if (!Array.isArray(jsonData) || jsonData.length === 0) {
    return [];
  }

  const columns = Object.keys(jsonData[0]);
  const uniqueIdentifiers: string[] = [];

  for (const column of columns) {
    // Get all values for this column
    const values = jsonData.map(row => row[column]);
    
    // Check if all values are unique and not null/undefined
    const uniqueValues = new Set(values.filter(value => value !== null && value !== undefined));
    
    // If number of unique values equals number of rows and no null values
    if (uniqueValues.size === jsonData.length && uniqueValues.size === values.length) {
      uniqueIdentifiers.push(column);
    }
  }

  return uniqueIdentifiers;
}