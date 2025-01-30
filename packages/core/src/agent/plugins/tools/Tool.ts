import { IAgent } from '../../types/agent';
import { StructuredTool } from '@langchain/core/tools';
import { IHandler, IHandlerResponse } from '../../../services/types/handler';
import { IHandlerRequest } from '../../../services/types/handler';
import { ToolConfig, ToolInput, ToolOutput } from '../../types';
import { logger } from '../../../utils';

/**
 * Base tool class that extends LangChain's Tool with agent and callback support
 */
export abstract class Tool<T extends ToolInput, U extends ToolOutput, K extends IHandler<IHandlerRequest, IHandlerResponse>> extends StructuredTool {
  protected agent: IAgent;
  protected callback?: (toolName: string, input: T, output: U) => void;
  public readonly config: ToolConfig<T>;
  protected handlers: K[] = [];

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
    agent: IAgent,
    config: ToolConfig<T>,
    callback?: (toolName: string, input: T, output: U) => void
  ) {
    super();
    logger.debug(`Creating tool: ${config.name}`);
    this.agent = agent;
    this.config = config;
    this.callback = callback;
    this.name = config.name;
    this.description = config.description + "\n\n" + this.formatExampleMessages();
    this.schema = config.schema;
    logger.debug(`Tool ${config.name} created with ${config.examples.length} examples`);
  }

  public async initialize(handlers: K[]): Promise<void> {
    logger.info(`Initializing tool: ${this.name}`);
    this.handlers = (handlers || []).sort((a, b) => b.priority - a.priority);
    logger.debug(`Tool ${this.name} initialized with ${this.handlers.length} handlers, sorted by priority`);
  }

  /**
   * Format example messages as a conversation
   */
  protected formatExampleMessages(): string {
    if (!this.config.examples.length) {
      logger.debug(`No examples configured for tool: ${this.name}`);
      return "";
    }

    logger.debug(`Formatting ${this.config.examples.length} examples for tool: ${this.name}`);
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
    logger.info(`Executing tool: ${this.name}`);
    logger.debug(`Tool ${this.name} received input:`, input);

    const validation = this.validateInput(input);
    if (!validation.status) {
      const errorMsg = validation.errors?.join(', ') || 'Unknown validation error';
      logger.warn(`Tool ${this.name} validation failed: ${errorMsg}`);
      return JSON.stringify({ 
        success: false, 
        errors: validation.errors || ['Unknown validation error'] 
      });
    }

    try {
      logger.debug(`Tool ${this.name} executing with validated input`);
      const output = await this.execute(input);
      logger.debug(`Tool ${this.name} execution completed`, { output });

      if (this.callback) {
        logger.debug(`Executing callback for tool: ${this.name}`);
        this.callback(this.name, input, output);
      }

      return JSON.stringify(output);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Tool ${this.name} execution failed: ${errorMessage}`, error);
      return JSON.stringify({ 
        success: false, 
        error: errorMessage 
      });
    }
  }

  /**
   * Abstract method that implements the tool's core functionality
   * @param input The input to process
   */
  protected abstract execute(input: T): Promise<U>;
} 