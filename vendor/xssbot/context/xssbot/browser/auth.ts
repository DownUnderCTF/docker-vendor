import * as fs from "fs";
import * as puppeteer from "puppeteer";
import * as config from "../config";
import logger from "./logger";

async function applyCookieJar(page: puppeteer.Page) {
    try {
        const cookies: { name: string; value: string }[] = JSON.parse(
            await fs.promises.readFile(config.OUTBOUND_AUTH_COOKIEJAR, "utf-8")
        );
        cookies.forEach((cookie) => page.setCookie(cookie));
    } catch (e) {
        logger.warn(`Failed to load all cookies from cookiejar.`);
    }
}

export default async function applyAuth(page: puppeteer.Page) {
    switch (config.OUTBOUND_AUTH_METHOD.toLowerCase()) {
        case "none":
            return;
        case "cookiejar":
            await applyCookieJar(page);
            break;
        default:
            logger.warn(`Unknown auth method ${config.OUTBOUND_AUTH_METHOD}. Assuming none`);
    }
}
