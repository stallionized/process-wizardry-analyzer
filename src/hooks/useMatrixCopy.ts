import { RefObject } from 'react';
import html2canvas from 'html2canvas';
import { toast } from 'sonner';

export const useMatrixCopy = (matrixRef: RefObject<HTMLDivElement>) => {
  const copyMatrixAsText = async () => {
    if (!matrixRef.current) return;

    try {
      const table = matrixRef.current.querySelector('table');
      if (!table) {
        toast.error('Could not find matrix table');
        return;
      }

      const rows = table.querySelectorAll('tr');
      let matrixText = '';
      
      rows.forEach((row) => {
        const cells = row.querySelectorAll('th, td');
        const rowData: string[] = [];
        
        cells.forEach(cell => {
          const cellText = cell.textContent?.trim() || '';
          rowData.push(cellText);
        });
        
        matrixText += rowData.join('\t') + '\n';
      });

      await navigator.clipboard.writeText(matrixText);
      toast.success('Matrix copied as text');
    } catch (err) {
      console.error('Failed to copy matrix as text:', err);
      toast.error('Failed to copy matrix as text');
    }
  };

  const copyMatrixAsImage = async () => {
    if (!matrixRef.current) return;

    try {
      const clone = matrixRef.current.cloneNode(true) as HTMLElement;
      
      const table = clone.querySelector('table');
      if (!table) {
        toast.error('Could not find table element');
        return;
      }

      const tableRect = table.getBoundingClientRect();
      
      Object.assign(clone.style, {
        position: 'fixed',
        left: '-9999px',
        top: '-9999px',
        width: `${tableRect.width}px`,
        height: `${tableRect.height}px`,
        transform: 'none',
        overflow: 'visible'
      });

      if ('scrollTop' in clone) clone.scrollTop = 0;
      if ('scrollLeft' in clone) clone.scrollLeft = 0;

      document.body.appendChild(clone);

      const canvas = await html2canvas(clone, {
        backgroundColor: null,
        scale: 2,
        logging: false,
        width: tableRect.width,
        height: tableRect.height,
        windowWidth: tableRect.width,
        windowHeight: tableRect.height,
        useCORS: true,
        onclone: (clonedDoc) => {
          const clonedTable = clonedDoc.querySelector('table');
          if (clonedTable) {
            clonedTable.style.transform = 'none';
            clonedTable.style.maxHeight = 'none';
            clonedTable.style.overflow = 'visible';
          }
        }
      });

      document.body.removeChild(clone);

      canvas.toBlob(async (blob) => {
        if (!blob) {
          toast.error('Failed to create image');
          return;
        }

        try {
          const data = new ClipboardItem({ 'image/png': blob });
          await navigator.clipboard.write([data]);
          toast.success('Matrix copied as image');
        } catch (err) {
          console.error('Failed to copy to clipboard:', err);
          toast.error('Failed to copy to clipboard');
        }
      }, 'image/png');
    } catch (err) {
      console.error('Failed to capture matrix:', err);
      toast.error('Failed to capture matrix');
    }
  };

  return { copyMatrixAsText, copyMatrixAsImage };
};