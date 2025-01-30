import { Handler, NetworkName } from "@genie/core";
import { SwapQuoteHandlerRequest, SwapQuoteHandlerResponse } from "../types";
import { GetSwapQuoteTool } from "../tools";

export abstract class SwapQuoteHandler extends Handler<SwapQuoteHandlerRequest, SwapQuoteHandlerResponse> {
    constructor(priority: number, enabled: boolean, networks: NetworkName[]) {
        super(GetSwapQuoteTool.TOOL_NAME, priority, enabled, networks);
    }
} 