import {Service} from "@/core/services/Service.ts";

export class PageService extends Service {
    async fetchPageDetails(page_id: number) {
        return await this.engine.wsEngine.sendAsyncMessage<"fetchPageDetails">({
            type: "fetchPageDetails",
            data: {
                page_id,
            }
        })
    }
}