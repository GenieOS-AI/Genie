import { Handler } from "@genie/core/src/services/handlers/handler";
import { GetBalanceHandlerRequest, GetBalanceHandlerResponse } from "../types/tool-handler";

export abstract class GetBalanceHandler extends Handler<GetBalanceHandlerRequest, GetBalanceHandlerResponse> {
}