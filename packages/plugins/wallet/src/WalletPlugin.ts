import { PluginMetadata, Agent, BasePlugin } from '@genie/core';
import { GetAddressTool } from './tools/GetAddressTool';
import { GetBalanceTool } from './tools/GetBalanceTool';
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