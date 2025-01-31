import { Handler, NetworkName } from '@genieos/core';
import { TokenInfoHandlerRequest, TokenInfoHandlerResponse } from '../types';
import { GetTokenInfoTool } from '../tools/GetTokenInfoTool';

export abstract class GetTokenInfoHandler extends Handler<TokenInfoHandlerRequest, TokenInfoHandlerResponse> {
    constructor(priority: number, enabled: boolean, networks: NetworkName[]) {
        super(GetTokenInfoTool.TOOL_NAME, priority, enabled, networks);
    }
} 