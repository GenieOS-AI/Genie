import { Plugin, PluginMetadata, IHandlerResponse, IHandlerRequest, IAgent, IHandler, IPlugin } from '@genie/core';
import { GetSwapQuoteTool, ExecuteSwapTool } from './';
import { SwapPluginOptions, SwapAmountType } from './types';
import packageJson from '../package.json';

export class SwapPlugin extends Plugin {
    public readonly options: Required<SwapPluginOptions> & {
        defaultAmountType: SwapAmountType;
    };

    constructor(options: SwapPluginOptions = {}) {
        const metadata: PluginMetadata = {
            name: 'swap',
            description: 'Plugin for token swaps across multiple networks',
            version: packageJson.version,
        };
        super(metadata, [GetSwapQuoteTool, ExecuteSwapTool], options);
        this.options = {
            defaultSlippage: 0.5,
            defaultAmountType: 'input',
            providers: {},
            ...options
        };
    }

    public async initialize(agent: IAgent, handlers: IHandler<IHandlerRequest, IHandlerResponse>[]): Promise<void> {
        await super.initialize(agent, handlers);
        
        // Validate that wallet plugin is available
        if (!agent.plugins.some((p: IPlugin) => p.metadata.name === 'wallet')) {
            throw new Error('SwapPlugin requires WalletPlugin to be installed');
        }
    }
} 