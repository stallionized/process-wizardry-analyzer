import { ChatGPTAPI } from 'npm:chatgpt';

export const findPotentialUniqueIdentifiers = async (jsonData: any[]): Promise<string[]> => {
  if (!Array.isArray(jsonData) || jsonData.length === 0) {
    console.log('No data to analyze for unique identifiers');
    return [];
  }

  const columns = Object.keys(jsonData[0]);
  const basicUniqueIdentifiers = new Set<string>();

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
      uniqueCount: uniqueValues.size,
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

    const api = new ChatGPTAPI({
      apiKey: openAIApiKey,
      model: 'gpt-4o'
    });
    
    const prompt = `You are a data analyst specializing in identifying unique identifiers in datasets. 
    Analyze this dataset's columns and identify which ones could serve as unique identifiers.

Column Analysis:
${JSON.stringify(columnAnalysis, null, 2)}

For each column, determine if it could be a unique identifier by considering:
1. Are all values unique? (required - check uniqueCount against totalValues)
2. Are there any null or empty values? (validValues should equal totalValues)
3. Does the column name or values suggest it's meant to be an identifier? (e.g., ID, reference number, serial number)
4. Are the values consistent in format and type?

Return a JSON object with this structure:
{
  "uniqueIdentifiers": [
    {
      "column": "column_name",
      "confidence": "high|medium|low",
      "reasoning": "explanation"
    }
  ]
}

Only include columns that you are confident can serve as unique identifiers.`;

    console.log('\nSending analysis to GPT-4O with prompt:', prompt);
    const response = await api.sendMessage(prompt);
    console.log('GPT-4O response:', response.text);

    try {
      const gptAnalysis = JSON.parse(response.text);
      console.log('Parsed GPT analysis:', gptAnalysis);

      if (!gptAnalysis.uniqueIdentifiers || !Array.isArray(gptAnalysis.uniqueIdentifiers)) {
        console.error('Invalid GPT response format');
        return Array.from(basicUniqueIdentifiers);
      }

      // Extract high and medium confidence identifiers from GPT analysis
      const aiSuggestedIdentifiers = gptAnalysis.uniqueIdentifiers
        .filter((item: any) => ['high', 'medium'].includes(item.confidence))
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