import { ChatGPTAPI } from 'npm:chatgpt';

export const findPotentialUniqueIdentifiers = async (jsonData: any[]): Promise<string[]> => {
  if (!Array.isArray(jsonData) || jsonData.length === 0) {
    console.log('No data to analyze for unique identifiers');
    return [];
  }

  // First do basic validation
  const columns = Object.keys(jsonData[0]);
  const basicUniqueIdentifiers = new Set<string>();

  // Log initial data analysis
  console.log('Starting unique identifier analysis');
  console.log('Data structure:', {
    totalRows: jsonData.length,
    columns: columns,
    sampleRow: jsonData[0]
  });

  // Enhanced basic check for unique values with detailed logging
  for (const column of columns) {
    console.log(`\nAnalyzing column: ${column}`);
    
    const values = jsonData.map(row => {
      const value = row[column];
      return value != null ? String(value).trim() : null;
    });

    const validValues = values.filter(value => value != null && value !== '');
    const uniqueValues = new Set(validValues);

    console.log(`Column "${column}" analysis:`, {
      totalValues: values.length,
      validValues: validValues.length,
      uniqueValues: uniqueValues.size,
      isUnique: uniqueValues.size === jsonData.length && validValues.length === jsonData.length,
      sampleValues: values.slice(0, 3)
    });

    if (uniqueValues.size === jsonData.length && validValues.length === jsonData.length) {
      console.log(`✅ Column "${column}" identified as potential unique identifier`);
      basicUniqueIdentifiers.add(column);
    }
  }

  console.log('\nBasic validation results:', Array.from(basicUniqueIdentifiers));

  try {
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      console.error('OpenAI API key not found');
      return Array.from(basicUniqueIdentifiers);
    }

    // Initialize ChatGPT API
    const api = new ChatGPTAPI({
      apiKey: openAIApiKey,
      model: 'gpt-4o'
    });

    // Prepare sample data for GPT
    const sampleData = jsonData.slice(0, 5);
    
    // Construct a detailed prompt for GPT-4O
    const prompt = `Analyze this dataset sample and identify columns that could serve as unique identifiers.
Sample data (first 5 rows):
${JSON.stringify(sampleData, null, 2)}

Basic validation found these potential unique identifier columns:
${JSON.stringify(Array.from(basicUniqueIdentifiers), null, 2)}

Requirements for a unique identifier:
1. Values must be unique across all rows (no duplicates)
2. Values must not be null or empty
3. The column should make logical sense as an identifier (e.g., ID, reference number, serial number, timestamp with sufficient precision)
4. Consider both numeric and string-based identifiers

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

    console.log('\nSending data to GPT-4O for analysis');
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

      console.log('\nFinal unique identifiers:', {
        basicValidation: Array.from(basicUniqueIdentifiers),
        aiSuggestions: aiSuggestedIdentifiers,
        combined: finalIdentifiers
      });
      
      return finalIdentifiers;

    } catch (parseError) {
      console.error('Error parsing GPT response:', parseError);
      return Array.from(basicUniqueIdentifiers);
    }
  } catch (error) {
    console.error('Error during GPT analysis:', error);
    return Array.from(basicUniqueIdentifiers);
  }
};