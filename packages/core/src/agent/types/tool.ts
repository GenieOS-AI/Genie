/**
 * Interface representing an example message for a tool
 */
export interface ToolExample {
    user: string;
    tool: {params: Record<string, unknown>};
  }
  
  /**
   * Interface for tool configuration including name, description, schema and examples
   */
  export interface ToolConfig<T extends Record<string, unknown>> extends Record<string, unknown> {
    name: string;
    description: string;
    examples: ToolExample[];
    schema: T;
  }
  
export interface ToolInput {
  [key: string]: any;
}

export interface ToolOutput {
    status: 'success' | 'error';
    message?: string;
    data?: Record<string, unknown>;
    needHumanConfirmation?: boolean;
}   

