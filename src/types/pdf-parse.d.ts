declare module 'pdf-parse' {
  interface PDFOptions {
    pagerender?: (pageData: any) => Promise<string>;
    max?: number;
  }

  interface PDFData {
    numpages: number;
    numrender: number;
    info: any;
    metadata: any;
    text: string;
    version: string;
  }

  function parse(dataBuffer: Buffer | ArrayBuffer, options?: PDFOptions): Promise<PDFData>;
  
  export = parse;
} 