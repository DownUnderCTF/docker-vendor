import Koa from "koa";
import KoaLogger from "koa-logger";
import KoaRouter from "@koa/router";
import KoaBodyParser from "koa-bodyparser";

import * as config from "./config";
import { requireBearerToken, requireSSRFProtection } from "./security/api";
import { getQueueStatus, submitVisitRequest } from "./visitTask";
import { getVisitRequestValidator } from "./schemas";

const app = new Koa();
const router = new KoaRouter();

app.use(KoaLogger());
// Note: this setup requires users to explicity send Content-Type: application/json
app.use(
    KoaBodyParser({
        enableTypes: ["json"],
        jsonLimit: "256kb",
        strict: true,
    })
);

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
    if (config.VISIT_TOKEN !== null && !requireBearerToken(ctx, config.VISIT_TOKEN)) {
        return;
    }

    if (!ctx.request.body) {
        ctx.status = 400;
        ctx.body = "No body";
        return;
    }

    const req = ctx.request.body;
    const validator = getVisitRequestValidator();
    if (!validator(req)) {
        // TODO: respond if debug mode
        console.log(validator.errors);

        ctx.status = 400;
        ctx.body = "invalid request";
        return;
    }

    submitVisitRequest({ url: <string>req.url });

    ctx.status = 202;
    ctx.body = "";
});

app.use(router.routes());

export default app;
