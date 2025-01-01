import { RefObject } from 'react';
import html2canvas from 'html2canvas';
import { toast } from 'sonner';

export const useMatrixCopy = (matrixRef: RefObject<HTMLDivElement>) => {
  const copyMatrixToClipboard = async () => {
    if (!matrixRef.current) return;

    try {
      // Create a clone of the matrix container
      const clone = matrixRef.current.cloneNode(true) as HTMLElement;
      
      // Get the table element within the clone
      const table = clone.querySelector('table');
      if (!table) {
        toast.error('Could not find table element');
        return;
      }

      // Calculate the full dimensions of the table
      const tableRect = table.getBoundingClientRect();
      
      // Set styles for the clone to ensure full capture
      Object.assign(clone.style, {
        position: 'fixed',
        left: '-9999px',
        top: '-9999px',
        width: `${tableRect.width}px`,
        height: `${tableRect.height}px`,
        transform: 'none',
        overflow: 'visible'
      });

      // Reset any scroll position
      if ('scrollTop' in clone) clone.scrollTop = 0;
      if ('scrollLeft' in clone) clone.scrollLeft = 0;

      // Add clone to document temporarily
      document.body.appendChild(clone);

      // Capture the entire table
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
          // Ensure all content is visible in the cloned document
          const clonedTable = clonedDoc.querySelector('table');
          if (clonedTable) {
            clonedTable.style.transform = 'none';
            clonedTable.style.maxHeight = 'none';
            clonedTable.style.overflow = 'visible';
          }
        }
      });

      // Remove clone after capture
      document.body.removeChild(clone);

      // Convert to blob and copy to clipboard
      canvas.toBlob(async (blob) => {
        if (!blob) {
          toast.error('Failed to create image');
          return;
        }

        try {
          const data = new ClipboardItem({ 'image/png': blob });
          await navigator.clipboard.write([data]);
          toast.success('Matrix copied to clipboard');
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

  return { copyMatrixToClipboard };
};