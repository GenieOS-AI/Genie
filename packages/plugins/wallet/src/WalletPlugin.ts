import { PluginMetadata, Agent, BasePlugin } from '@genie/core';
import { GetAddressTool, GetBalanceTool } from './tools';
import packageJson from '../package.json';

export class WalletPlugin extends BasePlugin {
  constructor() {
    const metadata: PluginMetadata = {
      name: 'wallet',
      description: 'Plugin for managing wallet addresses and balances',
      version: packageJson.version
    };

    super(metadata, [GetAddressTool, GetBalanceTool]);
  }
} 