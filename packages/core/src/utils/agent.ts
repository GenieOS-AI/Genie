import { AgentPluginConfig, IPlugin } from '../agent/types';
import { ModelConfig } from '../agent/types/model';
import { env } from '../environment';

export function findServiceConfig(serviceName: string, pluginConfig?: AgentPluginConfig) {
  return pluginConfig?.plugins?.flatMap(p => {
    const config = Object.values(p)[0];
    return config.services?.find(s => s.name === serviceName);
  }).find(s => s !== undefined);
}

export function findPluginConfig(pluginName: string, pluginConfig?: AgentPluginConfig) {
  const pluginEntry = pluginConfig?.plugins?.find(
    p => Object.keys(p)[0] === pluginName
  );
  return pluginEntry ? pluginEntry[pluginName] : undefined;
}
export function getModelSettings(modelConfig: ModelConfig, configSettings: any) {
  return {
    temperature: modelConfig.settings?.temperature,
    maxTokens: modelConfig.settings?.maxTokens,
    ...configSettings
  };
}
