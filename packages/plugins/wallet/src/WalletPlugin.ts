import { PluginMetadata, Agent, BasePlugin } from '@genie/core';
import { GetAddressTool } from './tools/GetAddressTool';
import { GetBalanceTool } from './tools/GetBalanceTool';

export class WalletPlugin extends BasePlugin {
  constructor(agent: Agent) {
    const metadata: PluginMetadata = {
      name: 'wallet',
      description: 'Plugin for managing wallet addresses and balances',
      version: '0.0.1'
    };

    super(metadata, [GetAddressTool, GetBalanceTool]);
  }
} 