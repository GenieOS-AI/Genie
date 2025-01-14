import { NetworkName } from '@genie/core';

export interface HandlerConfig {
    name: string;
    enabled?: boolean;
    networks?: NetworkName[];
    priority?: number;
}

export type HandlersConfig = HandlerConfig[];
