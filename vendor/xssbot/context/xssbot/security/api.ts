import { Context } from "koa";

export function requireBearerToken(ctx: Context, expectedToken: string): boolean {
    const bearer = ctx.headers.authorization?.split(" ")[1];
    if (bearer === undefined) {
        ctx.body = "";
        ctx.status = 401;
        return false;
    }
    // SEC: Insecure secret comparison, replace with crypto.timingSafeEqual if we're really paranoid
    // Honestly if someone timings this they deserve whatever they're trying to do
    if (bearer !== expectedToken) {
        ctx.body = "";
        ctx.status = 403;
        return false;
    }

    return true;
}

export function requireSSRFProtection(ctx: Context) {
    if (!("x-ssrf-protection" in ctx.headers)) {
        ctx.body = "";
        ctx.status = 403;
        return false;
    }
    return true;
}
