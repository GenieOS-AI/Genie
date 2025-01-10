import { Tool } from '@langchain/core/tools';
import { Agent } from '../../types/agent';
import { ToolMetadata } from '../index';

/**
 * Base tool class that extends LangChain's Tool with agent and callback support
 */
export abstract class BaseTool<T extends Record<string, unknown>> extends Tool {
  protected agent: Agent;
  protected callback?: (toolName: string, input: T, output: string) => void;
  public readonly metadata: ToolMetadata;

  name: string;
  description: string;

  /**
   * Creates a new tool instance
   * @param agent The agent instance this tool is attached to
   * @param metadata The tool's metadata including name, description, and examples
   * @param callback Optional callback function that receives tool name, input and output
   */
  constructor(
    agent: Agent,
    metadata: ToolMetadata,
    callback?: (toolName: string, input: T, output: string) => void
  ) {
    super();
    this.agent = agent;
    this.metadata = metadata;
    this.callback = callback;
    this.name = metadata.name;
    this.description = metadata.description + "\n\n" + this.formatExampleMessages();
  }

  /**
   * Format example messages as a conversation
   */
  protected formatExampleMessages(): string {
    if (!this.metadata.examples.length) {
      return "";
    }

    return this.metadata.examples
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
   */
  protected abstract validateInput(input: unknown): T;

  /**
   * Override the _call method to include callback handling
   * @param input The input to the tool
   */
  protected async _call(input: string): Promise<string> {
    const parsed = JSON.parse(input);
    const validatedInput = this.validateInput(parsed);
    const output = await this.execute(validatedInput);
    this.callback?.(this.name, validatedInput, output);
    return output;
  }

  /**
   * Abstract method that implements the tool's core functionality
   * @param input The input to process
   */
  protected abstract execute(input: T): Promise<string>;
} 