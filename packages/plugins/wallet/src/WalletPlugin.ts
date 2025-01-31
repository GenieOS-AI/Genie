import { PluginMetadata, Plugin } from '@genieos/core';
import { GetWalletAddressTool, GetBalanceTool } from './tools';
import packageJson from '../package.json';

export class WalletPlugin extends Plugin {
  constructor() {
    const metadata: PluginMetadata = {
      name: 'wallet',
      description: 'Plugin for managing wallet addresses and balances',
      version: packageJson.version
    };

    super(metadata, [GetWalletAddressTool, GetBalanceTool]);
  }
} 