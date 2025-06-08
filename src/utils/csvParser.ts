
export interface CSVRow {
  name?: string;
  linkedin_url: string;
}

export const parseCSV = (file: File): Promise<CSVRow[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim() !== '');
        
        if (lines.length === 0) {
          reject(new Error('CSV file is empty'));
          return;
        }
        
        // Parse header row
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const linkedinUrlIndex = headers.findIndex(h => 
          h.includes('linkedin') || h.includes('url')
        );
        const nameIndex = headers.findIndex(h => h.includes('name'));
        
        if (linkedinUrlIndex === -1) {
          reject(new Error('CSV must contain a linkedin_url column'));
          return;
        }
        
        // Parse data rows
        const rows: CSVRow[] = [];
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim());
          if (values.length > linkedinUrlIndex && values[linkedinUrlIndex]) {
            rows.push({
              linkedin_url: values[linkedinUrlIndex],
              name: nameIndex !== -1 ? values[nameIndex] : undefined
            });
          }
        }
        
        resolve(rows);
      } catch (error) {
        reject(new Error('Failed to parse CSV file'));
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};
