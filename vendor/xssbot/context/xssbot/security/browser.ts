import { URL } from "url";
import * as puppeteer from "puppeteer";

type RequestChecker = (req: puppeteer.HTTPRequest) => Promise<boolean>;

// SEC: Confusion vuln here if node's URL != chrome's URL
async function validateURL(req: puppeteer.HTTPRequest): Promise<boolean> {
    const url = new URL(req.url());

    if (!["http:", "https:"].includes(url.protocol)) {
        return false;
    }

    return true;
}

export default async function checkRequest(request: puppeteer.HTTPRequest) {
    const checks: RequestChecker[] = [validateURL];
    // eslint-disable-next-line no-restricted-syntax
    for (const checker of checks) {
        // eslint-disable-next-line no-await-in-loop
        if (!(await checker(request))) {
            return false;
        }
    }
    return true;
}
