// Base
/** The port the application will listen on for requests, defaults to 8000 */
export const PORT = +(process.env.PORT ?? 8000);
/** Path to the browser driver to use, defaults to chrome */
export const BROWSER_EXECUTABLE = process.env.BROWSER_EXECUTABLE ?? "/usr/bin/google-chrome-stable";
/** The redis host for managing tasks, defaults to localhost */
export const REDIS_HOST = process.env.REDIS_HOST ?? "localhost";

// Ops
/** Healthcheck url, defaults to /healthz. Disable if set to 'DISABLE' */
export const HEALTHZ_URL = process.env.HEALTHZ_URL ?? "/healthz";
/** Deep status url, defaults to /statusz. Disable if set to 'DISABLE' */
export const STATUSZ_URL = process.env.STATUSZ_URL ?? "/statusz";

// Auth Methods
/** Outbound auth strategy to use, defaults to none. Supports: cookiejar, none */
export const OUTBOUND_AUTH_METHOD = process.env.OUTBOUND_AUTH_METHOD ?? "none";
/** Path to the cookiejar file to use if the auth method is 'cookiejar' */
export const OUTBOUND_AUTH_COOKIEJAR = process.env.OUTBOUND_AUTH_COOKIEJAR ?? "/var/marvin/auth/cookiejar";

// Resources Limits
/** If true allows each request to set its own timeout limits */
export const PER_REQ_LIMITS = (process.env.PER_REQ_LIMITS ?? "0") in ["1", "true"];
/** Total amount of time allocated to any visit requests in ms, defaults to 10000 */
export const TIMEOUT_TOTAL = +(process.env.TIMEOUT_TOTAL ?? 10000);
/** Total amount of time to wait on a idle network in ms, defaults to 5000 */
export const TIMEOUT_NETWORK_IDLE = +(process.env.TIMEOUT_NETWORK_IDLE ?? 5000);

// Security
/** Requires X-SSRF-Protection to be sent in the request if true, defaults to true */
export const INBOUND_SSRF_PROT = (process.env.INBOUND_SSRF_PROT ?? "1") in ["1", "true"];
/** Bearer token that should be sent in the request, disabled by default */
export const INBOUND_BEARER = process.env.INBOUND_BEARER ?? null;

// Misc
/** Name of the service, used to make sure we don't loop requests back to ourselves. */
export const SERVICE_NAME = "ductf/marvin";
