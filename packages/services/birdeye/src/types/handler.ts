import { NetworkName } from '@genieos/core';

export interface HandlerConfig {
    name: string;
    enabled?: boolean;
    networks?: NetworkName[];
    priority?: number;
}

export type HandlersConfig = HandlerConfig[];
