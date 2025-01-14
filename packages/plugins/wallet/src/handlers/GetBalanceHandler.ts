import { Handler } from "@genie/core";
import { GetBalanceHandlerRequest, GetBalanceHandlerResponse } from "../types/tool-handler";

export abstract class GetBalanceHandler extends Handler<GetBalanceHandlerRequest, GetBalanceHandlerResponse> {
}