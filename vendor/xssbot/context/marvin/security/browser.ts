import { URL } from "url";
import * as dns from "dns";
import * as puppeteer from "puppeteer";
import * as ipaddress from "ipaddr.js";
import * as config from "../config";

export class RequestSecError extends Error {}

type RequestChecker = (req: puppeteer.HTTPRequest) => Promise<void>;

// SEC: Confusion vuln here if node's URL != chrome's URL
async function validateURL(req: puppeteer.HTTPRequest) {
    if (config.ALLOW_ALL_PROTOCOLS) {
        return;
    }
    const url = new URL(req.url());

    if (!["http:", "https:"].includes(url.protocol)) {
        throw new RequestSecError("Invalid protocol");
    }
}

// SEC: Theres a bypass for a rebind here but :shrug:
async function noInternalAccess(req: puppeteer.HTTPRequest) {
    if (config.ALLOW_INTERNAL_ADDRESSES) {
        return;
    }

    const url = new URL(req.url());
    const ipAddr = await dns.promises.lookup(url.hostname);
    if (!ipAddr || !ipaddress.isValid(ipAddr.address)) {
        throw new RequestSecError("Invalid IP");
    }

    const ip = ipaddress.parse(ipAddr.address);
    if (["loopback", "linklocal"].includes(ip.range())) {
        throw new RequestSecError("Invalid IP Range");
    }
}

export default async function checkRequest(request: puppeteer.HTTPRequest): Promise<[boolean, string?]> {
    const checks: RequestChecker[] = [validateURL, noInternalAccess];
    try {
        await Promise.all(checks.map(async (fn) => fn(request)));
        return [true];
    } catch (e) {
        await request.abort();
        return [false, (<RequestSecError>e).message];
    }
}
