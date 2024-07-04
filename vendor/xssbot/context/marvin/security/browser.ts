import { URL } from "url";
import * as dns from "dns";
import * as puppeteer from "puppeteer";
import * as ipaddress from "ipaddr.js";
import * as config from "../config";

export class RequestSecError extends Error {}

type RequestChecker = (req: puppeteer.HTTPRequest) => Promise<void>;

// SEC: Confusion vuln here if node's URL != chrome's URL
async function validateURL(urlString: string) {
    if (config.ALLOW_ALL_PROTOCOLS) {
        return;
    }
    const url = new URL(urlString);

    if (!["http:", "https:"].includes(url.protocol)) {
        throw new RequestSecError("Invalid protocol");
    }
}

// SEC: Theres a bypass for a rebind here but :shrug:
async function noInternalAccess(urlString: string) {
    if (config.ALLOW_INTERNAL_ADDRESSES) {
        return;
    }

    const url = new URL(urlString);
    const ipAddr = await dns.promises.lookup(url.hostname);
    if (!ipAddr || !ipaddress.isValid(ipAddr.address)) {
        throw new RequestSecError("Invalid IP");
    }

    const ip = ipaddress.parse(ipAddr.address);
    if (["loopback", "linklocal"].includes(ip.range())) {
        throw new RequestSecError("Invalid IP Range");
    }
}

/**
 * Validates a browser based request. This is intended to be called in a puppeteer navigation context
 * for example within a "request" event handler.
 */
export async function checkBrowserRequest(request: puppeteer.HTTPRequest): Promise<[boolean, string?]> {
    const checks: RequestChecker[] = [
        r => validateURL(r.url()),
        r => noInternalAccess(r.url())
    ];
    try {
        await Promise.all(checks.map(async (fn) => fn(request)));
        return [true];
    } catch (e) {
        await request.abort();
        return [false, (<RequestSecError>e).message];
    }
}

/**
 * Validatese a intended browser navigation before a page visit is issued. This should be used to
 * guard against chases where the actual visitation is potentially dangerous, or the intended request
 * cannot be safely checked by checkBrowserRequest. An example of this is deny access to javascript: style
 * urls, which do not trigger request event handlers.
 */
export async function precheckBrowserNavigation(navigationIntent: { url: string }): Promise<[boolean, string?]> {
    try {
        await validateURL(navigationIntent.url);
    } catch(e) {
        return [false, (<RequestSecError>e).message];
    }
    return [true];
}