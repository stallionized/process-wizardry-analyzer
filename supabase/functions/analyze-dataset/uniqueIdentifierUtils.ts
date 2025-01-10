import { ChatGPTAPI } from 'npm:chatgpt';

export const findPotentialUniqueIdentifiers = async (jsonData: any[]): Promise<string[]> => {
  if (!Array.isArray(jsonData) || jsonData.length === 0) {
    console.log('No data to analyze for unique identifiers');
    return [];
  }

  // First do basic validation
  const columns = Object.keys(jsonData[0]);
  const basicUniqueIdentifiers = new Set<string>();

  // Log the structure of the data
  console.log('Analyzing data structure:', {
    totalRows: jsonData.length,
    columns: columns,
    sampleRow: jsonData[0]
  });

  // Enhanced basic check for unique values
  for (const column of columns) {
    const values = jsonData.map(row => {
      const value = row[column];
      // Convert to string for consistent comparison
      return value != null ? String(value).trim() : null;
    });

    // Check if all values are non-null and unique
    const validValues = values.filter(value => value != null && value !== '');
    const uniqueValues = new Set(validValues);

    if (uniqueValues.size === jsonData.length && validValues.length === jsonData.length) {
      console.log(`Found potential unique identifier column: ${column}`);
      console.log(`Unique values count: ${uniqueValues.size}`);
      console.log(`Total rows: ${jsonData.length}`);
      basicUniqueIdentifiers.add(column);
    }
  }

  console.log('Basic unique identifiers found:', Array.from(basicUniqueIdentifiers));

  try {
    // Initialize ChatGPT API
    const api = new ChatGPTAPI({
      apiKey: Deno.env.get('OPENAI_API_KEY') || '',
      model: 'gpt-4o'
    });

    // Prepare sample data for GPT (limit to first few rows to avoid token limits)
    const sampleData = jsonData.slice(0, 5);
    
    // Construct a more detailed prompt for GPT-4O
    const prompt = `Analyze this dataset sample and identify columns that could serve as unique identifiers.
Sample data (first 5 rows):
${JSON.stringify(sampleData, null, 2)}

Basic validation found these potential unique identifier columns:
${JSON.stringify(Array.from(basicUniqueIdentifiers), null, 2)}

Requirements for a unique identifier:
1. Values must be unique across all rows
2. Values must not be null or empty
3. The column should make logical sense as an identifier (e.g., ID, reference number, serial number)

Please analyze and return a JSON array of objects with this structure:
{
  "identifiers": [
    {
      "column": "column_name",
      "confidence": "high|medium|low",
      "reason": "explanation of why this is a good identifier"
    }
  ]
}`;

    console.log('Sending prompt to GPT-4O for analysis');
    const response = await api.sendMessage(prompt);
    console.log('GPT-4O response:', response.text);

    try {
      const gptAnalysis = JSON.parse(response.text);
      console.log('Parsed GPT analysis:', gptAnalysis);

      // Extract high and medium confidence identifiers from GPT analysis
      const aiSuggestedIdentifiers = gptAnalysis.identifiers
        .filter((item: any) => ['high', 'medium'].includes(item.confidence))
        .map((item: any) => item.column);

      // Combine basic validation results with AI suggestions
      const finalIdentifiers = Array.from(new Set([
        ...Array.from(basicUniqueIdentifiers),
        ...aiSuggestedIdentifiers
      ]));

      console.log('Final combined unique identifiers:', finalIdentifiers);
      
      if (finalIdentifiers.length === 0) {
        console.log('No unique identifiers found in the dataset');
      } else {
        console.log(`Found ${finalIdentifiers.length} potential unique identifiers:`, finalIdentifiers);
      }

      return finalIdentifiers;

    } catch (parseError) {
      console.error('Error parsing GPT response:', parseError);
      // Fall back to basic validation results if GPT response parsing fails
      return Array.from(basicUniqueIdentifiers);
    }
  } catch (error) {
    console.error('Error during GPT analysis:', error);
    // Fall back to basic validation results if GPT call fails
    return Array.from(basicUniqueIdentifiers);
  }
};