declare module 'react-papaparse' {
  import { ComponentType } from 'react';

  interface CSVReaderProps {
    onDrop: (results: {
      data: any[];
      meta: {
        filename: string;
        fields: string[];
        delimiter: string;
        linebreak: string;
        aborted: boolean;
        truncated: boolean;
        cursor: number;
      };
      errors: Array<{
        type: string;
        code: string;
        message: string;
        row: number;
      }>;
    }) => void;
    onError?: (error: Error) => void;
    config?: {
      header?: boolean;
      skipEmptyLines?: boolean;
      [key: string]: any;
    };
    addRemoveButton?: boolean;
    onRemoveFile?: () => void;
    children?: React.ReactNode;
  }

  export const CSVReader: ComponentType<CSVReaderProps>;
} 