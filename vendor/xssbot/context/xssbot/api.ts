import Koa from "koa";
import KoaRouter from "@koa/router";
import KoaBodyParser from "koa-bodyparser";

import bunyan from "bunyan";
import { v4 as uuidv4 } from "uuid";
import * as config from "./config";
import { noLoopBack, requireBearerToken, requireSSRFProtection } from "./security/api";
import { getQueueStatus, submitVisitRequest } from "./visitTask";
import { getVisitRequestValidator } from "./schemas";
import { resolveResourceLimits } from "./security/resources";

const app = new Koa();
const router = new KoaRouter();
const accessLogger = bunyan.createLogger({ name: "ApiAccess" });

app.use(async (ctx, next) => {
    const requestId = uuidv4();
    ctx.set("X-Request-Id", ctx.get("X-Request-Id") ?? requestId);
    accessLogger.info({
        type: "request",
        method: ctx.method,
        path: ctx.path,
        requestId,
    });

    const start = performance.now();
    await next();

    accessLogger.info({
        type: "response",
        requestId,
        status: ctx.status,
        elapsed: performance.now() - start,
    });
});
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
    router.get(config.STATUSZ_URL, async (ctx) => {
        ctx.body = {
            queues: {
                visit: await getQueueStatus(),
            },
        };
    });
}

router.post("/visit", async (ctx) => {
    if (!noLoopBack(ctx)) {
        return;
    }

    if (config.INBOUND_SSRF_PROT && !requireSSRFProtection(ctx)) {
        return;
    }
    if (config.INBOUND_BEARER !== null && !requireBearerToken(ctx, config.INBOUND_BEARER)) {
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
        ctx.status = 400;
        ctx.body = process.env.NODE_ENV === "development" ? validator.errors : "invalid request";
        return;
    }
    if (!config.PER_REQ_LIMITS && req.resourceLimits) {
        ctx.status = 400;
        ctx.body =
            process.env.NODE_ENV === "development"
                ? "found timeout field when PER_REQ_LIMITS was not set"
                : "invalid request";
        return;
    }

    await submitVisitRequest({
        url: <string>req.url,
        ...(req.resourceLimits ? { resourceLimits: resolveResourceLimits(req.resourceLimits) } : {}),
    });

    ctx.status = 202;
    ctx.body = "";
});

app.use(router.routes());

export default app;
