import { ChatGPTAPI } from 'npm:chatgpt';

export const findPotentialUniqueIdentifiers = async (jsonData: any[]): Promise<string[]> => {
  if (!Array.isArray(jsonData) || jsonData.length === 0) {
    console.log('No data to analyze for unique identifiers');
    return [];
  }

  const columns = Object.keys(jsonData[0]);
  console.log('\n=== Starting Unique Identifier Analysis ===');
  console.log('Analyzing dataset with:', {
    totalRows: jsonData.length,
    columns: columns,
  });

  // Analyze each column's data
  const columnAnalysis = {};
  for (const column of columns) {
    const values = jsonData.map(row => {
      const value = row[column];
      return value != null ? String(value).trim() : null;
    });

    const validValues = values.filter(value => value != null && value !== '');
    const uniqueValues = new Set(validValues);
    const sampleValues = Array.from(uniqueValues).slice(0, 5);

    columnAnalysis[column] = {
      totalValues: values.length,
      validValues: validValues.length,
      uniqueCount: uniqueValues.size,
      sampleValues,
      isUnique: uniqueValues.size === validValues.length && validValues.length === values.length
    };

    console.log(`\nColumn "${column}" analysis:`, columnAnalysis[column]);
  }

  try {
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      console.error('OpenAI API key not found');
      return [];
    }

    const api = new ChatGPTAPI({
      apiKey: openAIApiKey,
      model: 'gpt-4o'
    });

    const prompt = `As a data analyst, examine this dataset's columns and identify which could serve as unique identifiers.

Column Analysis:
${JSON.stringify(columnAnalysis, null, 2)}

A column is a good unique identifier if:
1. It has EXACTLY the same number of unique values as total rows (check uniqueCount equals totalValues)
2. It has NO null or empty values (check validValues equals totalValues)
3. The values look like identifiers (e.g., sequential numbers, UUIDs, or meaningful unique codes)

Return ONLY a JSON array of column names that meet ALL these criteria. Example:
["id", "reference_number"]

If no columns qualify, return an empty array.`;

    console.log('\nSending analysis to GPT-4O with prompt:', prompt);
    const response = await api.sendMessage(prompt);
    console.log('GPT-4O response:', response.text);

    try {
      const suggestedColumns = JSON.parse(response.text);
      
      if (!Array.isArray(suggestedColumns)) {
        console.error('Invalid GPT response format - expected array');
        return [];
      }

      console.log('\nGPT suggested columns:', suggestedColumns);
      
      // Validate that each suggested column actually exists
      const validColumns = suggestedColumns.filter(column => columns.includes(column));
      
      console.log('Final validated unique identifiers:', validColumns);
      return validColumns;

    } catch (parseError) {
      console.error('Error parsing GPT response:', parseError);
      return [];
    }
  } catch (error) {
    console.error('Error during GPT analysis:', error);
    return [];
  }
};