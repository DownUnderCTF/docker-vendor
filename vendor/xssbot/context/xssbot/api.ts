import Koa from "koa";
import KoaLogger from "koa-logger";
import KoaRouter from "@koa/router";

import * as config from "./config";
import { requireBearerToken, requireSSRFProtection } from "./security/api";
import { getQueueStatus, submitVisitRequest } from "./visitTask";

const app = new Koa();
const router = new KoaRouter();

app.use(KoaLogger());

if (config.HEALTHZ_URL !== "DISABLE") {
    router.get(config.HEALTHZ_URL, (ctx) => {
        ctx.body = "1";
    });
}
if (config.STATUSZ_URL !== "DISABLE") {
    // TODO
    router.get(config.STATUSZ_URL, async (ctx) => {
        ctx.body = {
            queues: {
                visit: await getQueueStatus(),
            },
        };
    });
}

router.post("/visit", (ctx) => {
    if (config.VISIT_SSRF_PROT && !requireSSRFProtection(ctx)) {
        return;
    }
    if (
        config.VISIT_TOKEN !== null &&
        !requireBearerToken(ctx, config.VISIT_TOKEN)
    ) {
        return;
    }

    // TODO: log requests
    // Do simple validation at submit time
    submitVisitRequest({ url: "http://google.com" });

    ctx.status = 202;
    ctx.body = "";
});

app.use(router.routes());

export default app;
