import { ChatGPTAPI } from 'npm:chatgpt';

export const findPotentialUniqueIdentifiers = async (jsonData: any[]): Promise<string[]> => {
  if (!Array.isArray(jsonData) || jsonData.length === 0) {
    console.log('No data to analyze for unique identifiers');
    return [];
  }

  // First do basic validation
  const columns = Object.keys(jsonData[0]);
  const basicUniqueIdentifiers: string[] = [];

  // Log the structure of the data
  console.log('Analyzing data structure:', {
    totalRows: jsonData.length,
    columns: columns,
    sampleRow: jsonData[0]
  });

  // Basic check for unique values
  for (const column of columns) {
    const values = jsonData.map(row => row[column]);
    const validValues = values.filter(value => value != null && value !== '');
    const uniqueValues = new Set(validValues);

    if (uniqueValues.size === jsonData.length && validValues.length === jsonData.length) {
      basicUniqueIdentifiers.push(column);
    }
  }

  console.log('Basic unique identifiers found:', basicUniqueIdentifiers);

  try {
    // Initialize ChatGPT API
    const api = new ChatGPTAPI({
      apiKey: Deno.env.get('OPENAI_API_KEY') || '',
      model: 'gpt-4o'
    });

    // Prepare sample data for GPT (limit to first few rows to avoid token limits)
    const sampleData = jsonData.slice(0, 5);
    
    // Construct the prompt
    const prompt = `Given this dataset sample:
${JSON.stringify(sampleData, null, 2)}

And these potential unique identifier columns found through basic validation:
${JSON.stringify(basicUniqueIdentifiers, null, 2)}

Please analyze which columns would make good unique identifiers for this dataset. Consider:
1. Whether the values are truly unique
2. Whether the column is meaningful as an identifier (e.g., 'id', 'reference_number', etc.)
3. The data type and format of the values

Return your response as a JSON array of column names that would make good unique identifiers, along with a brief explanation for each.`;

    console.log('Sending prompt to GPT-4O');
    const response = await api.sendMessage(prompt);
    console.log('GPT-4O response:', response.text);

    // Parse GPT's response
    try {
      const gptAnalysis = JSON.parse(response.text);
      console.log('Parsed GPT analysis:', gptAnalysis);
      
      // Combine GPT suggestions with basic validation results
      const finalIdentifiers = Array.from(new Set([
        ...basicUniqueIdentifiers,
        ...gptAnalysis.map((item: any) => item.column)
      ]));

      console.log('Final combined unique identifiers:', finalIdentifiers);
      return finalIdentifiers;
    } catch (parseError) {
      console.error('Error parsing GPT response:', parseError);
      // Fall back to basic validation results if GPT response parsing fails
      return basicUniqueIdentifiers;
    }
  } catch (error) {
    console.error('Error during GPT analysis:', error);
    // Fall back to basic validation results if GPT call fails
    return basicUniqueIdentifiers;
  }
}