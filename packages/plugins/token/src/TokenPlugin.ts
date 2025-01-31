import { PluginMetadata, Plugin } from '@genieos/core';
import { GetTokenInfoTool } from './tools';
import packageJson from '../package.json';

export class TokenPlugin extends Plugin {

  constructor() {
    const metadata: PluginMetadata = {
      name: 'token',
      description: 'Plugin for managing token information and prices',
      version: packageJson.version
    };

    super(metadata, [GetTokenInfoTool], {});
  }
} 