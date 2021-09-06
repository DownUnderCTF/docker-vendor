import Koa from "koa";

export function requireBearerToken(
    ctx: Koa.Context,
    expectedToken: string
): boolean {
    const bearer = ctx.headers.authorization?.split(" ")[1];
    if (bearer === undefined) {
        ctx.body = "";
        ctx.status = 401;
        return false;
    }
    // Honestly if someone timings this they deserve the flag.
    // TODO: replace with crypto.timingSafeEqual if we're really paranoid
    if (bearer !== expectedToken) {
        ctx.body = "";
        ctx.status = 403;
        return false;
    }

    return true;
}

export function requireSSRFProtection(ctx: Koa.Context) {
    if (!("x-ssrf-protection" in ctx.headers)) {
        ctx.body = "";
        ctx.status = 403;
        return false;
    }
    return true;
}
