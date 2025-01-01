import { RefObject } from 'react';
import { toast } from 'sonner';

export const useMatrixCopy = (matrixRef: RefObject<HTMLDivElement>) => {
  const copyMatrixToClipboard = async () => {
    if (!matrixRef.current) return;

    try {
      // Get the table element
      const table = matrixRef.current.querySelector('table');
      if (!table) {
        toast.error('Could not find matrix table');
        return;
      }

      // Create a text representation of the matrix
      const rows = table.querySelectorAll('tr');
      let matrixText = '';
      
      rows.forEach((row, rowIndex) => {
        const cells = row.querySelectorAll('th, td');
        const rowData: string[] = [];
        
        cells.forEach(cell => {
          // Get the text content, removing any extra whitespace
          const cellText = cell.textContent?.trim() || '';
          rowData.push(cellText);
        });
        
        // Join cells with tabs and add newline
        matrixText += rowData.join('\t') + '\n';
      });

      // Copy to clipboard using the Clipboard API
      await navigator.clipboard.writeText(matrixText);
      toast.success('Matrix copied to clipboard');
    } catch (err) {
      console.error('Failed to copy matrix:', err);
      toast.error('Failed to copy matrix to clipboard');
    }
  };

  return { copyMatrixToClipboard };
};