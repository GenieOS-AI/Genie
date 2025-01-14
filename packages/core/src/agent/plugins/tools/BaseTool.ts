import { Tool } from '@langchain/core/tools';
import { Agent } from '../../types/agent';
import { ToolConfig } from '../index';
import { StructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { Handler } from '../../../services';
import { IHandlerResponse } from '../../../services/types/handler';
import { IHandlerRequest } from '../../../services/types/handler';
import { ToolInput, ToolOutput } from '../../types';
/**
 * Base tool class that extends LangChain's Tool with agent and callback support
 */
export abstract class BaseTool<T extends ToolInput, U extends ToolOutput, K extends Handler<IHandlerRequest, IHandlerResponse>> extends StructuredTool {
  protected agent: Agent;
  protected callback?: (toolName: string, input: T, output: U) => void;
  public readonly config: ToolConfig<T>;
  protected readonly handlers: K[];

  name: string;
  description: string;
  schema: any;

  /**
   * Creates a new tool instance
   * @param agent The agent instance this tool is attached to
   * @param config The tool's configuration including name, description, schema and examples
   * @param callback Optional callback function that receives tool name, input and output
   */
  constructor(
    agent: Agent,
    config: ToolConfig<T>,
    handlers?: K[],
    callback?: (toolName: string, input: T, output: U) => void
  ) {
    super();
    this.agent = agent;
    this.config = config;
    this.callback = callback;
    this.name = config.name;
    this.description = config.description + "\n\n" + this.formatExampleMessages();
    this.schema = config.schema;
    this.handlers = (handlers || []).sort((a, b) => b.priority - a.priority);
  }

  /**
   * Format example messages as a conversation
   */
  protected formatExampleMessages(): string {
    if (!this.config.examples.length) {
      return "";
    }

    return this.config.examples
      .map((example, index) => {
        const params = JSON.stringify(example.tool.params, null, 2);
        return `Example ${index + 1}:
Human: ${example.user}
Assistant: Use the ${this.name} tool with the following parameters: ${params}`;
      })
      .join("\n\n");
  }

  /**
   * Validate input against schema
   * @returns Validation result with status and optional error messages
   */
  abstract validateInput(input: T): { status: boolean; errors?: string[] };

  /**
   * Override the _call method to include callback handling
   * @param input The input to the tool
   */
  protected async _call(input: T): Promise<string> {
    console.log('Input to _call:', input);
    const validation = this.validateInput(input);
    if (!validation.status) {
      return JSON.stringify({ 
        success: false, 
        errors: validation.errors || ['Unknown validation error'] 
      });
    }
    const output = await this.execute(input);
    this.callback?.(this.name, input, output);
    return JSON.stringify(output);
  }

  /**
   * Abstract method that implements the tool's core functionality
   * @param input The input to process
   */
  protected abstract execute(input: T): Promise<U>;
} 