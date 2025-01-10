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

  // Analyze each column's data distribution
  const columnAnalysis = {};
  for (const column of columns) {
    console.log(`\nAnalyzing column: ${column}`);
    
    const values = jsonData.map(row => {
      const value = row[column];
      return value != null ? String(value).trim() : null;
    });

    const validValues = values.filter(value => value != null && value !== '');
    const uniqueValues = new Set(validValues);

    columnAnalysis[column] = {
      totalValues: values.length,
      validValues: validValues.length,
      uniqueValues: Array.from(uniqueValues).slice(0, 5), // Sample of unique values
      isUnique: uniqueValues.size === jsonData.length && validValues.length === jsonData.length,
    };

    console.log(`Column "${column}" analysis:`, columnAnalysis[column]);

    if (uniqueValues.size === jsonData.length && validValues.length === jsonData.length) {
      console.log(`✅ Column "${column}" identified as potential unique identifier through basic validation`);
      basicUniqueIdentifiers.add(column);
    }
  }

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
    
    // Construct a detailed prompt for GPT-4O
    const prompt = `Analyze this dataset and identify which columns could serve as unique identifiers.

Column Analysis:
${JSON.stringify(columnAnalysis, null, 2)}

For each column, determine if it could be a unique identifier by considering:
1. Are all values unique? (required)
2. Are there any null or empty values? (should be none)
3. Does the column name or values suggest it's meant to be an identifier? (e.g., ID, reference number, serial number)
4. Are the values consistent in format and type?

Please analyze each column individually and return a JSON object with this structure:
{
  "columnAnalysis": [
    {
      "column": "column_name",
      "isUniqueIdentifier": true/false,
      "confidence": "high|medium|low",
      "reasoning": "detailed explanation of why this column is or isn't a good unique identifier"
    }
  ]
}`;

    console.log('\nSending analysis to GPT-4O with prompt:', prompt);
    const response = await api.sendMessage(prompt);
    console.log('GPT-4O response:', response.text);

    try {
      const gptAnalysis = JSON.parse(response.text);
      console.log('Parsed GPT analysis:', gptAnalysis);

      // Extract high and medium confidence unique identifiers from GPT analysis
      const aiSuggestedIdentifiers = gptAnalysis.columnAnalysis
        .filter((item: any) => 
          item.isUniqueIdentifier === true && 
          ['high', 'medium'].includes(item.confidence)
        )
        .map((item: any) => item.column);

      console.log('AI suggested identifiers:', aiSuggestedIdentifiers);

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