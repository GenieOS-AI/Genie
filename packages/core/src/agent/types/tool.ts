export interface ToolInput {
  [key: string]: any;
}

export interface ToolOutput {
    status: 'success' | 'error';
    message?: string;
    data?: Record<string, unknown>;
}   