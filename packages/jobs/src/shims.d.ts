declare module "papaparse" {
  export interface ParseMeta {
    aborted: boolean;
    cursor: number;
    fields?: string[];
    delimiter?: string;
  }
  export interface ParseError {
    type: string;
    code: string;
    message: string;
    row?: number;
  }
  export interface ParseResult<T> {
    data: T[];
    errors: ParseError[];
    meta: ParseMeta;
  }
  export interface Parser {
    pause(): void;
    resume(): void;
  }
  export interface ParseConfig<T> {
    header?: boolean;
    skipEmptyLines?: boolean | "greedy";
    worker?: boolean;
    chunk?: (results: ParseResult<T>, parser: Parser) => void | Promise<void>;
    complete?: (results: ParseResult<T>) => void;
    error?: (error: Error) => void;
  }
  export function parse<T>(input: string | File, config?: ParseConfig<T>): void;
  const Papa: { parse: typeof parse };
  export default Papa;
}

