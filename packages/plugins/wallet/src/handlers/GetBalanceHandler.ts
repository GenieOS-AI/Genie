import { Handler, NetworkName } from "@genie/core";
import { GetBalanceHandlerRequest, GetBalanceHandlerResponse } from "../types/tool-handler";
import { GetBalanceTool } from "../tools/GetBalanceTool";

export abstract class GetBalanceHandler extends Handler<GetBalanceHandlerRequest, GetBalanceHandlerResponse> {
    constructor(priority: number, enabled: boolean, networks: NetworkName[]) {
        super(GetBalanceTool.TOOL_NAME, priority, enabled, networks);
    }
}