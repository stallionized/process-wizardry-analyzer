export function chunkData(data: Record<string, number[]>, chunkSize: number = 500) {
  const totalLength = Object.values(data)[0]?.length || 0;
  const chunks: Array<Record<string, number[]>> = [];
  
  for (let i = 0; i < totalLength; i += chunkSize) {
    const chunk: Record<string, number[]> = {};
    Object.entries(data).forEach(([key, values]) => {
      chunk[key] = values.slice(i, i + chunkSize);
    });
    chunks.push(chunk);
  }
  
  return chunks;
}

export function processChunkData(chunk: Record<string, number[]>): Record<string, number[]> {
  const processedChunk: Record<string, number[]> = {};
  Object.entries(chunk).forEach(([key, values]) => {
    processedChunk[key] = values.map(v => Number(v.toFixed(2)));
  });
  return processedChunk;
}