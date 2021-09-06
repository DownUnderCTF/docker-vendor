// Base
/** The port the application will listen on for requests, defaults to 8000 */
export const PORT = +(process.env.PORT ?? 8000);
/** The browser driver to use, defaults to chrome. Supported: chrome */
export const BROWSER = process.env.BROWSER ?? "chrome";
/** The redis host for managing tasks, defaults to localhost */
export const REDIS_HOST = process.env.REDIS_HOST ?? "localhost";

// Ops
/** Healthcheck url, defaults to /healthz. Disable if set to 'DISABLE' */
export const HEALTHZ_URL = process.env.HEALTHZ_URL ?? "/healthz";
/** Deep status url, defaults to /statusz. Disable if set to 'DISABLE' */
export const STATUSZ_URL = process.env.STATUSZ_URL ?? "/statusz";

// Features
export const USE_COOKIEJAR = true;

// Resources Limits
/** If true allows each request to set its own timeout limits */
export const PER_REQ_LIMITS =
    (process.env.PER_REQ_LIMITS ?? "0") in ["1", "true"];
/** Total amount of time allocated to any visit requests in ms, defaults to 10000 */
export const TIMEOUT_TOTAL = +(process.env.TIMEOUT_TOTAL ?? 10000);
/** Total amount of time to wait on a idle network in ms, defaults to 5000 */
export const TIMEOUT_NETWORK_IDLE = +(process.env.TIMEOUT_NETWORK_IDLE ?? 5000);

// Security
/** Requires X-SSRF-Protection to be sent in the request if true, defaults to true */
export const VISIT_SSRF_PROT =
    (process.env.VISIT_SSRF_PROT ?? "1") in ["1", "true"];
/** Bearer token that should be sent in the request, disabled by default */
export const VISIT_TOKEN = process.env.VISIT_TOKEN ?? null;
/** Ratelimit (per second) for visit requests, defaults to no rate limit */
export const VISIT_RATELIMIT = +(process.env.VISIT_RATE_LIMIT ?? -1);
