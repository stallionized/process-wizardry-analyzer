export function generateAllPossiblePairs(variables: string[]): [string, string][] {
  const pairs: [string, string][] = [];
  for (let i = 0; i < variables.length; i++) {
    for (let j = i + 1; j < variables.length; j++) {
      pairs.push([variables[i], variables[j]]);
    }
  }
  return pairs;
}

export function mergeAnalyses(analyses: any[]) {
  if (analyses.length === 0) return null;
  
  const merged = {
    anova: {
      results: [] as any[],
      summary: '',
    }
  };

  const resultMap = new Map();

  analyses.forEach(analysis => {
    if (!analysis?.anova?.results) return;
    
    analysis.anova.results.forEach((result: any) => {
      const key = `${result.variable}-${result.comparedWith}`;
      if (!resultMap.has(key)) {
        resultMap.set(key, {
          ...result,
          fStatistic: 0,
          pValue: 0,
          effectSize: 0,
          count: 0
        });
      }
      
      const existing = resultMap.get(key);
      existing.fStatistic += result.fStatistic;
      existing.pValue += result.pValue;
      existing.effectSize += result.effectSize;
      existing.count += 1;
    });
  });

  resultMap.forEach(result => {
    if (result.count > 0) {
      merged.anova.results.push({
        ...result,
        fStatistic: result.fStatistic / result.count,
        pValue: result.pValue / result.count,
        effectSize: result.effectSize / result.count
      });
    }
  });

  const uniqueSummaries = analyses
    .map(a => a.anova.summary)
    .filter((summary): summary is string => typeof summary === 'string')
    .filter((summary, index, self) => self.indexOf(summary) === index);
  
  merged.anova.summary = uniqueSummaries.join(' ');

  return merged;
}